-- MCP server support tables: anonymous query log + rate-limit counter.
--
-- Both have RLS enabled with NO public-read policy — the anon-key MCP function
-- never SELECTs them, and query text must never be publicly queryable. The
-- function writes through two SECURITY DEFINER functions (granted to anon) so
-- it can log + rate-limit without holding a service-role key.

-- ── query log (identity-free by construction) ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.mcp_query_log (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tool        text NOT NULL,
  query_text  text,
  filters     jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mcp_query_log ENABLE ROW LEVEL SECURITY;
-- no policy → anon cannot SELECT/INSERT directly

-- ── rate-limit counter (hashed IP, short-lived) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.mcp_rate_limit (
  ip_hash       text NOT NULL,
  window_start  timestamptz NOT NULL,
  count         int NOT NULL DEFAULT 0,
  PRIMARY KEY (ip_hash, window_start)
);
ALTER TABLE public.mcp_rate_limit ENABLE ROW LEVEL SECURITY;
-- no policy → anon cannot SELECT/INSERT directly

-- ── invocation counter for the R12 usage alert ─────────────────────────────
-- One row per UTC day; incremented on every JSON-RPC method (not only
-- tools/call) so handshake traffic is counted against the free-tier ceiling.
CREATE TABLE IF NOT EXISTS public.mcp_invocations (
  day    date PRIMARY KEY,
  count  int NOT NULL DEFAULT 0
);
ALTER TABLE public.mcp_invocations ENABLE ROW LEVEL SECURITY;

-- ── SECURITY DEFINER write paths, anon-executable ──────────────────────────
CREATE OR REPLACE FUNCTION public.log_mcp_call(p_tool text, p_query_text text, p_filters jsonb)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  INSERT INTO public.mcp_query_log (tool, query_text, filters)
  VALUES (p_tool, p_query_text, p_filters);
$$;

-- Atomic increment; returns the new count for the current window so the caller
-- can compare against its threshold. Concurrent isolates can't lose updates.
CREATE OR REPLACE FUNCTION public.bump_rate_limit(p_ip_hash text, p_window_start timestamptz)
RETURNS int
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  INSERT INTO public.mcp_rate_limit (ip_hash, window_start, count)
  VALUES (p_ip_hash, p_window_start, 1)
  ON CONFLICT (ip_hash, window_start)
  DO UPDATE SET count = public.mcp_rate_limit.count + 1
  RETURNING count;
$$;

-- Increment today's invocation counter and return the new daily total.
CREATE OR REPLACE FUNCTION public.bump_invocations()
RETURNS int
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  INSERT INTO public.mcp_invocations (day, count)
  VALUES (current_date, 1)
  ON CONFLICT (day)
  DO UPDATE SET count = public.mcp_invocations.count + 1
  RETURNING count;
$$;

REVOKE EXECUTE ON FUNCTION public.log_mcp_call(text, text, jsonb) FROM public;
REVOKE EXECUTE ON FUNCTION public.bump_rate_limit(text, timestamptz) FROM public;
REVOKE EXECUTE ON FUNCTION public.bump_invocations() FROM public;
GRANT EXECUTE ON FUNCTION public.log_mcp_call(text, text, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.bump_rate_limit(text, timestamptz) TO anon;
GRANT EXECUTE ON FUNCTION public.bump_invocations() TO anon;

-- ── retention / purge jobs ─────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'mcp-query-log-purge',
  '17 4 * * *',  -- daily 04:17 UTC
  $$ DELETE FROM public.mcp_query_log WHERE created_at < now() - interval '90 days'; $$
);

SELECT cron.schedule(
  'mcp-rate-limit-purge',
  '5 * * * *',   -- hourly
  $$ DELETE FROM public.mcp_rate_limit WHERE window_start < now() - interval '2 hours'; $$
);
