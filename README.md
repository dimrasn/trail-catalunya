This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Race Scraper

A Supabase Edge Function (`scrape-trails`) fetches the
[ultrescatalunya.com 2026 calendar](https://ultrescatalunya.com/calendari-trail-catalunya-2026)
and upserts the parsed race rows into the `races` table on Supabase. Each
run is logged to `scrape_runs`.

### Schedule

- **Cron:** every Monday at **05:00 UTC** (07:00 CEST / 06:00 CET in Barcelona).
- **Job name:** `scrape-trails-weekly` (registered via `pg_cron`).
- **Source URL:** `https://ultrescatalunya.com/calendari-trail-catalunya-2026`.
- **Concurrency guard:** the function refuses to run if a successful scrape
  completed in the last 30 minutes. Override with `{"force": true}` in the
  POST body when you need to re-run during testing.

### Architecture

```
pg_cron (Mon 05:00 UTC)
   └─→ pg_net.http_post → Edge Function `scrape-trails`
                              ├─ fetch source HTML
                              ├─ parser.ts (port of scrape_trails.py)
                              ├─ upsert into `races` (on_conflict: race_hash)
                              ├─ mark stale rows as REMOVED
                              └─ log run to `scrape_runs`
```

Components:

| Path | Purpose |
|---|---|
| `scrape_trails.py` | Diagnostic Python reference. **Not production code** — kept in sync with `parser.ts` for local debugging. |
| `supabase/functions/scrape-trails/index.ts` | Edge Function handler (fetch → parse → upsert → log). |
| `supabase/functions/scrape-trails/parser.ts` | Pure parser, ported from `scrape_trails.py`. |
| `supabase/functions/scrape-trails/test.ts` | `deno test` parity checks against `fixture.html`. |
| `supabase/functions/scrape-trails/fixture.html` | Live HTML snapshot used as test fixture. |
| `supabase/migrations/*_scraper_schema.sql` | Adds `source` and `last_seen` columns; composite unique index. |
| `supabase/migrations/*_schedule_scrape.sql` | Registers the weekly cron job. |

### Manually trigger a run

```bash
# Anyone with the function URL can invoke (verify_jwt=false):
curl -X POST "https://qaebfhbdfjvzhmvcjroz.supabase.co/functions/v1/scrape-trails" \
  -H "Content-Type: application/json" \
  -d '{"force": true}'

# Or via the Supabase CLI (after `supabase login` and `supabase link`):
supabase functions invoke scrape-trails --body '{"force":true}'
```

If you omit `force` and the previous run succeeded less than 30 minutes ago,
the function returns `{"status":"skipped","reason":"recent_success",...}`.

### See run history

```sql
SELECT id, run_at, status, total_races, duration_ms, error_message
FROM scrape_runs
ORDER BY run_at DESC
LIMIT 20;
```

Healthy baseline: ~700 rows, status `success`, ~2-3 second duration.

### Disable the schedule

```sql
SELECT cron.unschedule('scrape-trails-weekly');
```

Re-enable by re-applying `supabase/migrations/*_schedule_scrape.sql`.

### Debug a parse failure

When `scrape_runs.error_message` is non-null, or `total_races` deviates from
the ~700 baseline:

1. Save the live HTML for inspection:
   ```bash
   curl -A "Mozilla/5.0 ..." "https://ultrescatalunya.com/calendari-trail-catalunya-2026" \
     > /tmp/calendar.html
   ```
2. Re-run the Python diagnostic against the saved file:
   ```bash
   python scrape_trails.py --html-file /tmp/calendar.html --csv-only --csv-path /tmp/check.csv
   ```
   This prints the row counts and stats. Compare against the most recent
   `scrape_runs.total_races`.
3. Compare the TS parser too:
   ```bash
   deno test --allow-read supabase/functions/scrape-trails/test.ts
   ```
   The fixture row-count test should be within ±5% of the Python baseline.
4. If the parser regressed, update `parser.ts`, mirror the change in
   `scrape_trails.py`, refresh `fixture.html`, update the parity asserts in
   `test.ts`, and redeploy:
   ```bash
   supabase functions deploy scrape-trails --no-verify-jwt
   ```

### Local dev requirements

- Python 3.10+, `pip install requests beautifulsoup4` (for `scrape_trails.py`).
- [Deno](https://deno.land/) 1.40+ (for the Edge Function tests).
- [Supabase CLI](https://supabase.com/docs/guides/cli) (only needed to
  deploy from your machine; the function is already deployed in production).
