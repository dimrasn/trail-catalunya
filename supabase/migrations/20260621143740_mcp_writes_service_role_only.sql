-- Security fix: the MCP write RPCs were granted to `anon`, but the anon key is
-- public — anyone could call them directly (outside the Edge Function's rate
-- limiter) to pollute the query log or inflate the invocation counter and
-- self-DoS the MCP via the global ceiling. Revoke anon; the Edge Function now
-- performs these writes with the service-role key (server-only, never shipped
-- to clients). Reads stay on the anon key + public-read RLS.

REVOKE EXECUTE ON FUNCTION public.log_mcp_call(text, text, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.bump_rate_limit(text, timestamptz) FROM anon;
REVOKE EXECUTE ON FUNCTION public.bump_invocations() FROM anon;

GRANT EXECUTE ON FUNCTION public.log_mcp_call(text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.bump_rate_limit(text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.bump_invocations() TO service_role;

-- Reset the daily invocation counter polluted by direct-call security probes.
DELETE FROM public.mcp_invocations WHERE day = current_date;
