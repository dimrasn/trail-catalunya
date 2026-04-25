-- Scraper schema additions.
--
-- Context: the canonical scraper is ultres_scraper.py (in /scrapper/). The
-- existing `races` and `scrape_runs` tables already match what that scraper
-- writes, so most columns are already in place. This migration adds the
-- small set of additive extras needed to support the Edge Function port:
--
--   1. `source` column on `races` — lets us add more calendars later.
--   2. `last_seen` column on `races` — distinguishes "row touched by the
--      latest scrape run" from `scraped_at` (which carries the initial insert
--      timestamp and `updated_at` (changed via trigger only on field changes).
--   3. Unique index spanning (source, race_name, distance_km, town, month) —
--      matches how the scraper deterministically identifies a race row. This
--      is redundant with the existing race_hash PK (hash of the same fields)
--      but makes the uniqueness explicit at the schema level, and lets the
--      Edge Function upsert on that conflict target without recomputing the
--      hash if we ever change it.
--   4. Helpful indexes on scrape_runs.run_at for audit-log queries.
--
-- Everything is additive: ADD COLUMN IF NOT EXISTS / CREATE INDEX IF NOT
-- EXISTS. No drops, no renames, no type changes.

-- ── races additions ─────────────────────────────────────────────────────────

ALTER TABLE public.races
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'ultrescatalunya';

ALTER TABLE public.races
  ADD COLUMN IF NOT EXISTS last_seen timestamptz;

-- Composite uniqueness (in addition to race_hash PK). Using COALESCE so
-- NULL distance_km doesn't break uniqueness across scrapes.
CREATE UNIQUE INDEX IF NOT EXISTS races_source_identity_uniq
  ON public.races (
    source,
    race_name,
    town,
    month,
    COALESCE(distance_km, 0)
  );

-- ── scrape_runs additions ──────────────────────────────────────────────────
-- scrape_runs already has everything the scraper writes. Add source column
-- and index for faster "recent runs" queries, which the README docs.

ALTER TABLE public.scrape_runs
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'ultrescatalunya';

CREATE INDEX IF NOT EXISTS scrape_runs_run_at_desc
  ON public.scrape_runs (run_at DESC);
