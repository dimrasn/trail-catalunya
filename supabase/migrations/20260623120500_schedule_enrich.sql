-- Schedule the enrichment pass (U7). enrich-races processes ONE bounded chunk
-- per invocation and no-ops once the window/budget is drained, so we fire it
-- several times in sequence — NOT self-retrigger (KTD2). Fires every 10 minutes
-- across a Monday-morning window, after the weekly scrape (05:00) has finished.
--
-- Both URL and secret come from the vault (no literals). The vault secrets
-- `enrich_races_url` and `enrich_secret` must be created out-of-band (values not
-- in source control), and ENRICH_SECRET must be set as a function secret.

DO $$
BEGIN
  PERFORM cron.unschedule('enrich-races-weekly');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'enrich-races-weekly',
  '0,10,20,30,40,50 6 * * 1',  -- every 10 min, 06:00–06:50 UTC Monday
  $cron$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'enrich_races_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-enrich-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'enrich_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 200000
  );
  $cron$
);
