-- Weekly cron schedule for the scrape-trails Edge Function.
--
-- Runs every Monday at 05:00 UTC (07:00 CEST / 06:00 CET local Barcelona
-- time), a quiet period unlikely to stress ultrescatalunya.com.
--
-- The Edge Function is deployed with verify_jwt=false, so the cron call
-- doesn't need an Authorization header. A 30-minute "recently succeeded"
-- guard inside the function itself blocks extra runs from accidental
-- double-fires or random public pokes. The only Vault secret needed is
-- the function URL.
--
-- Management:
--   disable:         select cron.unschedule('scrape-trails-weekly');
--   list:            select * from cron.job;
--   run history:     select * from scrape_runs order by run_at desc limit 20;
--   manual trigger:  supabase functions invoke scrape-trails --body '{"force":true}'

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Idempotent: unschedule any previous incarnation before re-scheduling.
DO $$
BEGIN
  PERFORM cron.unschedule('scrape-trails-weekly');
EXCEPTION WHEN OTHERS THEN
  -- job doesn't exist; fine
  NULL;
END $$;

SELECT cron.schedule(
  'scrape-trails-weekly',
  '0 5 * * 1',  -- Monday 05:00 UTC
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'scrape_trails_url'),
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);
