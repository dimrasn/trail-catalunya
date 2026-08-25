-- Ask-box intent logging (Step 3, U3). Plan:
-- docs/plans/2026-08-25-001-feat-intent-logging-plan.md
--
-- The write RPC is anon-callable (credential-free, Dima 2026-08-25), so THE RPC IS
-- THE TRUST BOUNDARY: it validates MEANING (canonical chip ids, filter rebuild from
-- value domains, provider enum, server-derived has_intent), caps size, and bounds
-- write-volume with a cost circuit breaker. A direct PostgREST caller with the
-- public anon key hits exactly these checks — the app-layer route handler is only a
-- normalizer for honest clients. Data is a DIRECTIONAL hint, not decision-grade.
--
-- The canonical sets below MUST equal app/lib/intent.js — guarded by the JS↔SQL
-- parity test in app/lib/intent.test.mjs. Change both together.

create table if not exists public.intent_log (
  id          bigint generated always as identity primary key,
  goal_text   text,                       -- unlinked user-volunteered free text; NULLed at 90d; admin-read-only
  chips       text[],                     -- canonical chip IDS (not display labels)
  filters     jsonb,                      -- rebuilt to canonical keys + in-domain values
  provider    text not null,
  has_intent  boolean not null,
  created_at  timestamptz not null default now(),
  constraint intent_log_provider_chk check (provider in ('claude', 'chatgpt', 'copy'))
);

comment on column public.intent_log.goal_text is
  'Unlinked, user-volunteered free text (may contain PII). Not tied to identity in our systems. Admin-read-only. NULLed after 90 days by the intent_log_purge cron; the anonymous chips/filters/provider row is retained.';

-- Purge predicate index (only rows still carrying text).
create index if not exists intent_log_purge_idx
  on public.intent_log (created_at) where goal_text is not null;

alter table public.intent_log enable row level security;
-- No RLS policies → no direct anon read or write. Writes go only through log_intent().

-- Canonical vocabulary, readable for the JS↔SQL parity test (KTD2).
create or replace function public.intent_allowlist()
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'chips',     array['fun-trail','somewhere-new','chase-pb','kid-friendly'],
    'providers', array['claude','chatgpt','copy'],
    'filters', jsonb_build_object(
      'drive',      array['u60','60-120','120+'],
      'distance',   array['u10','10-15','15-21','21-42','42+'],
      'elevation',  array['u200','200-500','500-1000','1000-2000','2000+'],
      'difficulty', array['easy','moderate','hard','vh+'],
      'month',      array['01','02','03','04','05','06','07','08','09','10','11','12'],
      'province',   array['BARCELONA','GIRONA','TARRAGONA','LLEIDA']
    )
  );
$$;

-- Keep only allowed values, in canonical (allowlist) order — mirrors filters.js.
create or replace function public.intent_filter_arr(p_arr jsonb, p_allowed text[])
returns text[]
language sql
immutable
as $$
  select array(
    select a
    from unnest(p_allowed) with ordinality as t(a, ord)
    where a in (select jsonb_array_elements_text(coalesce(p_arr, '[]'::jsonb)))
    order by ord
  );
$$;

-- The trust boundary. SECURITY DEFINER, anon-executable, self-validating.
create or replace function public.log_intent(
  p_goal       text,
  p_chips      text[],
  p_filters    jsonb,
  p_provider   text,
  p_has_intent boolean   -- accepted for signature stability but IGNORED (re-derived)
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_allowed_chips text[] := array['fun-trail','somewhere-new','chase-pb','kid-friendly'];
  v_goal    text;
  v_chips   text[];
  v_filters jsonb := '{}'::jsonb;
  v_arr     text[];
  v_has     boolean;
begin
  -- provider must be valid; drop silently otherwise (best-effort; don't error callers)
  if p_provider is null or p_provider not in ('claude','chatgpt','copy') then
    return;
  end if;

  -- cost circuit breaker: bound total write volume (near-atomic count-then-insert;
  -- a small concurrent overshoot is acceptable for a cost cap). Tunable.
  if (select count(*) from public.intent_log where created_at > now() - interval '1 minute') >= 60 then
    return;
  end if;

  -- goal: trim + cap
  v_goal := left(btrim(coalesce(p_goal, '')), 400);
  if v_goal = '' then v_goal := null; end if;

  -- chips: allowlist ∩, per-element cap, dedupe, cap 8
  select (array_agg(distinct left(c, 24)))[1:8]
    into v_chips
  from unnest(coalesce(p_chips, '{}')) as c
  where left(c, 24) = any(v_allowed_chips);

  -- filters: rebuild to canonical keys with in-domain values only
  v_arr := intent_filter_arr(p_filters->'drive',      array['u60','60-120','120+']);
  if array_length(v_arr,1) > 0 then v_filters := v_filters || jsonb_build_object('drive', to_jsonb(v_arr)); end if;
  v_arr := intent_filter_arr(p_filters->'distance',   array['u10','10-15','15-21','21-42','42+']);
  if array_length(v_arr,1) > 0 then v_filters := v_filters || jsonb_build_object('distance', to_jsonb(v_arr)); end if;
  v_arr := intent_filter_arr(p_filters->'elevation',  array['u200','200-500','500-1000','1000-2000','2000+']);
  if array_length(v_arr,1) > 0 then v_filters := v_filters || jsonb_build_object('elevation', to_jsonb(v_arr)); end if;
  v_arr := intent_filter_arr(p_filters->'difficulty', array['easy','moderate','hard','vh+']);
  if array_length(v_arr,1) > 0 then v_filters := v_filters || jsonb_build_object('difficulty', to_jsonb(v_arr)); end if;
  v_arr := intent_filter_arr(p_filters->'month',      array['01','02','03','04','05','06','07','08','09','10','11','12']);
  if array_length(v_arr,1) > 0 then v_filters := v_filters || jsonb_build_object('month', to_jsonb(v_arr)); end if;
  v_arr := intent_filter_arr(p_filters->'province',   array['BARCELONA','GIRONA','TARRAGONA','LLEIDA']);
  if array_length(v_arr,1) > 0 then v_filters := v_filters || jsonb_build_object('province', to_jsonb(v_arr)); end if;
  -- kidsRun: the one demand boolean (view toggles are dropped)
  if (p_filters->>'kidsRun') = 'true' then v_filters := v_filters || jsonb_build_object('kidsRun', true); end if;

  -- has_intent: SERVER-DERIVED, ignore the client value
  v_has := (v_goal is not null) or (coalesce(array_length(v_chips,1),0) > 0);

  insert into public.intent_log (goal_text, chips, filters, provider, has_intent)
  values (v_goal, v_chips, v_filters, p_provider, v_has);
end;
$$;

revoke all on function public.log_intent(text, text[], jsonb, text, boolean) from public;
grant  execute on function public.log_intent(text, text[], jsonb, text, boolean) to anon;
revoke all on function public.intent_allowlist() from public;
grant  execute on function public.intent_allowlist() to anon;

comment on function public.log_intent is
  'Ask-box intent logger. TRUST BOUNDARY: validates meaning + caps + cost circuit breaker; anon-callable. Data is a directional hint, not decision-grade.';

-- Retention: NULL goal_text after 90 days, keep the anonymous row. Idempotent.
do $$
begin
  perform cron.unschedule('intent_log_purge')
  where exists (select 1 from cron.job where jobname = 'intent_log_purge');
exception when others then
  null;  -- pg_cron not present / first run: ignore
end $$;

select cron.schedule(
  'intent_log_purge',
  '17 4 * * *',   -- daily 04:17 UTC
  $$update public.intent_log set goal_text = null
      where goal_text is not null and created_at < now() - interval '90 days'$$
);
