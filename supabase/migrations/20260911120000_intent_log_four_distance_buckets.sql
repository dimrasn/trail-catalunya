-- Intent log: collapse the distance allowlist from five buckets to four, keeping
-- the two retired values accepted.
--
-- 10-15 and 15-21 became a single 10-21 band (app/lib/filters.js, 2026-09-11).
-- The outer boundaries did not move; only the split inside them went away.
--
-- WHY A NEW MIGRATION, NOT AN EDIT: same reason the 09-10 file gives. That file
-- supersedes the applied 08-25 one and may itself be applied before this lands,
-- so this is derived FROM it, mechanically, by substituting ONE string — the
-- distance array literal, in both places it appears. Diff the two files: the only
-- difference should be the two distance arrays. Applying 09-10 then 09-11 in
-- filename order is correct; applying only 09-11 is also correct, because it
-- carries the six difficulty levels forward unchanged.
--
-- 10-15 and 15-21 STAY in the allowlist for exactly the reason 'vh+' does: a
-- visitor on a cached bundle still emits them, and a shared ?dist=10-15 link
-- still resolves (DISTANCE_LEGACY expands it to 10-21). Dropping them would
-- silently discard those rows instead of logging them, biasing the signal the
-- log exists to collect.

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
      'distance',   array['u10','10-21','21-42','42+','10-15','15-21'],
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
  v_arr := intent_filter_arr(p_filters->'distance',   array['u10','10-21','21-42','42+','10-15','15-21']);
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
