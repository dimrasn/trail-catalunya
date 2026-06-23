-- U1 — race enrichment store (Phase 2a). Stable facts (start time, price,
-- confirmed/cancelled) live at the EVENT grain (source, race_url, town) — the
-- same key app/lib/races.js and mcp/grouping.ts group on — NOT the per-distance
-- grain of `races`, so one fact is never duplicated across sibling distance
-- rows (plan KTD1). Each fact is a JSONB blob carrying value + confidence +
-- evidence + source_url + edition + last_checked (R1). Volatile registration/
-- sold-out facts are Phase 2b and intentionally absent here.

CREATE TABLE IF NOT EXISTS public.race_enrichment (
  source           text NOT NULL DEFAULT 'ultrescatalunya',
  race_url         text NOT NULL CHECK (length(btrim(race_url)) > 0),
  town             text NOT NULL CHECK (length(btrim(town)) > 0),
  start_time       jsonb,
  price            jsonb,
  confirmed_status jsonb,
  content_hash     text,
  origin           text NOT NULL DEFAULT 'crawl' CHECK (origin IN ('crawl', 'override')),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source, race_url, town)
);

-- Public read so the site build (anon key) and the MCP function can join it.
-- Evidence snippets are HTML-stripped + length-capped at write time (U5/U6), so
-- anon-readable columns are safe. Writes happen via the service role only.
ALTER TABLE public.race_enrichment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read race_enrichment"
  ON public.race_enrichment
  FOR SELECT
  USING (true);

-- Per-run audit (mirrors scrape_runs). Service-role only — no public read, so
-- cost figures aren't exposed to anon callers.
CREATE TABLE IF NOT EXISTS public.enrichment_runs (
  id            bigserial PRIMARY KEY,
  run_at        timestamptz NOT NULL DEFAULT now(),
  status        text NOT NULL DEFAULT 'running', -- running | success | paused | error
  enriched      int  NOT NULL DEFAULT 0,
  skipped       int  NOT NULL DEFAULT 0,
  unknown       int  NOT NULL DEFAULT 0,
  cost_micros   bigint NOT NULL DEFAULT 0,
  duration_ms   int,
  error_message text
);
ALTER TABLE public.enrichment_runs ENABLE ROW LEVEL SECURITY;

-- Monthly spend ledger for the hard cost cap (R11). Service-role only.
CREATE TABLE IF NOT EXISTS public.enrichment_spend (
  month_key    text PRIMARY KEY,        -- 'YYYY-MM'
  spent_micros bigint NOT NULL DEFAULT 0,
  updated_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.enrichment_spend ENABLE ROW LEVEL SECURITY;

-- Atomic spend increment (KTD3): a single round-trip that increments and
-- returns the new total, so overlapping invocations cannot under-count past the
-- cap via read-modify-write. SECURITY DEFINER; callable only by the service
-- role (the Edge Function), never the public anon key.
CREATE OR REPLACE FUNCTION public.bump_enrichment_spend(p_month text, p_delta bigint)
  RETURNS bigint
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  new_total bigint;
BEGIN
  INSERT INTO public.enrichment_spend (month_key, spent_micros, updated_at)
  VALUES (p_month, p_delta, now())
  ON CONFLICT (month_key)
  DO UPDATE SET spent_micros = public.enrichment_spend.spent_micros + EXCLUDED.spent_micros,
                updated_at = now()
  RETURNING spent_micros INTO new_total;
  RETURN new_total;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.bump_enrichment_spend(text, bigint) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.bump_enrichment_spend(text, bigint) FROM anon;
GRANT  EXECUTE ON FUNCTION public.bump_enrichment_spend(text, bigint) TO service_role;
