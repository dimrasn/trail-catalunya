-- SEO measurement loop: crawl-rate signal.
-- Next middleware (middleware.js) detects search/AI crawler user-agents and
-- writes one row per bot hit via the SECURITY DEFINER RPC below. This is the
-- EARLIEST indicator in the measurement loop (crawl rate → indexed → impressions
-- → position → clicks) — Vercel hobby request logs evaporate in ~1h, so we
-- persist the signal ourselves. Applied to remote 2026-08-20 via the Supabase
-- MCP; this file is the repo record.

create table if not exists public.crawler_hits (
  id bigint generated always as identity primary key,
  bot text not null,
  path text not null,
  ua text,
  hit_at timestamptz not null default now()
);

create index if not exists crawler_hits_bot_time on public.crawler_hits (bot, hit_at desc);

alter table public.crawler_hits enable row level security;
-- No RLS policies → no direct anon/public read or write. All writes go through
-- log_crawler_hit(); reads happen from the dashboard / SQL.

create or replace function public.log_crawler_hit(p_bot text, p_path text, p_ua text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.crawler_hits (bot, path, ua)
  values (left(p_bot, 40), left(p_path, 300), left(p_ua, 500));
$$;

revoke all on function public.log_crawler_hit(text, text, text) from public;
grant execute on function public.log_crawler_hit(text, text, text) to anon;

comment on table public.crawler_hits is 'SEO crawl-rate signal: bot UA + path + time, written by Next middleware via log_crawler_hit(). Earliest indicator in the measurement loop.';
