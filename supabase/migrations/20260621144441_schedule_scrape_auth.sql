-- Re-schedule the weekly scrape cron to authenticate to the now-gated
-- scrape-trails function. The function requires an x-scrape-secret header
-- (it is deployed --no-verify-jwt and would otherwise be publicly triggerable).
-- Both the URL and the secret are read from the vault — no literals here.
--
-- The vault secret `scrape_secret` must exist (created out-of-band, value not
-- in source control). `scrape_trails_url` already exists from the original
-- schedule migration.

DO $$
BEGIN
  PERFORM cron.unschedule('scrape-trails-weekly');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'scrape-trails-weekly',
  '0 5 * * 1',  -- Monday 05:00 UTC
  $cron$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'scrape_trails_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-scrape-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'scrape_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $cron$
);
