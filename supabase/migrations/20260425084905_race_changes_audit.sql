-- Append-only audit log of how the `races` table changed across scrape runs.
--
-- Every scrape diffs the new HTML against the current DB state and emits one
-- row per detected change. This gives us:
--   • "What's new this week?" reports
--   • Per-race history ("when did Costa Brava sell out?")
--   • Re-add detection (race went REMOVED, then came back)
--   • Forensics for unexpected DB state ("when did this row's price change?")
--
-- Keep it append-only. No updates, no deletes. Archival of old rows happens
-- via a future scheduled job (1-year retention is plenty).

CREATE TABLE IF NOT EXISTS public.race_changes (
  id              bigserial PRIMARY KEY,
  scrape_run_id   bigint REFERENCES public.scrape_runs(id) ON DELETE CASCADE,
  race_hash       text NOT NULL,
  change_type     text NOT NULL CHECK (change_type IN ('added', 'changed', 'removed', 're_added')),
  changed_fields  jsonb,         -- {field: {old, new}, ...} for 'changed'
  before_row      jsonb,         -- snapshot for 'changed' / 'removed' / 're_added'
  after_row       jsonb,         -- snapshot for 'added' / 'changed' / 're_added'
  detected_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS race_changes_run_idx
  ON public.race_changes(scrape_run_id);

CREATE INDEX IF NOT EXISTS race_changes_hash_idx
  ON public.race_changes(race_hash, detected_at DESC);

CREATE INDEX IF NOT EXISTS race_changes_type_recent_idx
  ON public.race_changes(change_type, detected_at DESC);

-- Public read so a future "What's new" page on the website can query directly
-- via the anon key. Writes only via service role (the Edge Function).
ALTER TABLE public.race_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read race_changes"
  ON public.race_changes
  FOR SELECT
  USING (true);
