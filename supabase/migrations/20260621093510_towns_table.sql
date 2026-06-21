-- towns: single source of truth for per-town geo + drive time from Plaça
-- Glòries. The MCP Edge Function joins races → towns for drive_minutes; it
-- cannot import the data/*.json files the Next.js build uses. Drive time is
-- always measured from Plaça Glòries (41.4036, 2.1868) in slice 1.
--
-- ~347 rows after backfill (scripts/backfill-towns.mjs): every town in
-- data/towns-drive-times.json, with lat/lng filled where data/towns-geocoded.json
-- has it (~113) and left null otherwise (~234). province is sourced from the
-- races table, not the JSON files.

CREATE TABLE IF NOT EXISTS public.towns (
  name                       text PRIMARY KEY,
  province                   text,
  lat                        numeric,
  lng                        numeric,
  drive_minutes_from_barcelona int,
  updated_at                 timestamptz NOT NULL DEFAULT now()
);

-- Public read so the anon-key MCP function (and a future site migration) can
-- query it. No write policy — writes happen via the service role (backfill,
-- and a future geocoding step), never via anon.
ALTER TABLE public.towns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read towns"
  ON public.towns
  FOR SELECT
  USING (true);
