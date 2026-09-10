-- Intent log: widen the difficulty allowlist from four buckets to the six ITRA
-- levels, keeping the retired 'vh+' accepted.
--
-- WHY A NEW MIGRATION, NOT AN EDIT: 20260825120000_intent_log.sql is APPLIED TO
-- PROD (AGENTS.md — "FULLY LIVE & VERIFIED 2026-08-25"). Editing an applied
-- migration changes nothing in the database and desyncs the file from reality.
-- Both functions are CREATE OR REPLACE, so this supersedes cleanly.
--
-- HOW THIS FILE WAS PRODUCED: mechanically, by reading 20260825120000_intent_log.sql
-- and substituting ONE string — the difficulty array literal, in both places it
-- appears. Every other byte of both function bodies is identical to the applied
-- version. It was generated rather than retyped on purpose: a hand-written copy
-- of this function got the parameter name wrong (p_goal_text for p_goal, which
-- CREATE OR REPLACE rejects outright), and worse, re-derived has_intent from the
-- CLIENT value instead of the server, reopening the forged-input hole the
-- original deliberately closed. Diff it against the 08-25 file before applying;
-- the only difference should be the two difficulty arrays.
--
-- 'vh+' stays in the allowlist deliberately. A visitor may be running a cached
-- bundle that still emits it, and a shared ?dif=vh+ link still resolves to it.
-- Dropping it would silently discard those rows rather than log them, biasing
-- the very signal the log exists to collect.

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
      'difficulty', array['easy','moderate','hard','very-hard','extreme','brutal','vh+'],
      'month',      array['01','02','03','04','05','06','07','08','09','10','11','12'],
      'province',   array['BARCELONA','GIRONA','TARRAGONA','LLEIDA']
    )
  );
$$;

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
  v_arr := intent_filter_arr(p_filters->'difficulty', array['easy','moderate','hard','very-hard','extreme','brutal','vh+']);
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
