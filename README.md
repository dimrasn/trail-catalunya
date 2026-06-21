# Trail Catalunya

A discovery tool for trail-running races in Catalunya. It replaces the flat
calendar at ultrescatalunya.com with a filterable view (drive time from
Barcelona, distance, elevation, month, province, kids run), an "Ask Claude /
Ask ChatGPT" handoff, and a public MCP server so agents can query the data.

Three surfaces over one Supabase dataset:

- **Website** — static Next.js app on Vercel. Reads races from Supabase at
  build time and renders a filterable, month-grouped list.
- **Scraper** — weekly Supabase Edge Function that refreshes the dataset from
  the source calendar.
- **MCP server** — public, read-only Edge Function exposing the data to
  Claude/ChatGPT via three tools.

## Data model

The source lists one row per race × distance. The `races` table mirrors that
(one row per distance); the app groups rows into events by `(race_url, town)`,
each event carrying a `distances[]` array. A separate `towns` table holds drive
time from Plaça Glòries, Barcelona, plus lat/lng. `scrape_runs` logs each
scrape; `race_changes` is an append-only audit of what changed per run.

Race statuses: `ACTIVA` (live), `SUSPESA` (suspended — excluded from the site
and MCP), `SOLD_OUT`, `REMOVED` (no longer on the source — excluded).

## Website

```bash
npm install
npm run dev    # http://localhost:3000
npm run build
```

Requires two env vars (also set in Vercel, Production + Preview):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The anon key is public by design; row-level security on the read tables is what
protects the data. The build fetches races + towns from Supabase, so the env
vars must be present at build time. A Vercel deploy hook (fired by the scraper
when data actually changes) rebuilds the site; a 24h ISR revalidate is the
safety net.

Key files: `app/page.js` (server component, build-time fetch),
`app/lib/races.js` (fetch + group + drive-time join), `app/components/*`
(filter bar, race cards, AI handoff).

## MCP server

A hand-rolled JSON-RPC MCP server (`supabase/functions/mcp/`), deployed
no-auth and read-only at `…/functions/v1/mcp`. Tools:

- `search_races` — filter by drive time, distance, elevation, province, month,
  date window, kids run.
- `get_race` — full detail for one race id.
- `whats_on` — races in a date/weekend window (range-overlap aware).

Every response carries the race URL, data freshness (age + `stale` flag), and a
`registration_status: "unknown — verify at url"` marker — the data does not
include live registration status, so tool descriptions instruct the agent to
fetch race URLs to confirm. Reads use the anon key + public-read RLS; the
log/rate-limit writes use SECURITY DEFINER functions callable only by the
service role. Per-IP and global daily rate limits keep it inside free tiers.
Queries are logged anonymously (no IP, no identity), 90-day retention.

Add it as a custom connector in Claude (Settings → Connectors) using the
function URL.

## Scraper

`supabase/functions/scrape-trails/` fetches the
[2026 calendar](https://ultrescatalunya.com/calendari-trail-catalunya-2026),
parses it, diffs against the DB, upserts, marks stale rows `REMOVED`, runs
golden-row assertions, emails alerts on failure, and triggers a Vercel
rebuild when data changed.

```
pg_cron (Mon 05:00 UTC)
   └─→ pg_net.http_post (with x-scrape-secret) → Edge Function scrape-trails
          ├─ fetch source HTML
          ├─ parser.ts  (port of scrape_trails.py)
          ├─ sanity gate (reject if rows drop >20% vs current)
          ├─ diff → race_changes; upsert races; mark REMOVED
          ├─ golden.ts assertions (catch silent parser drift)
          ├─ email alert on failure / golden-fail (Resend)
          └─ trigger Vercel deploy hook if changed
```

| Path | Purpose |
|---|---|
| `scrape_trails.py` | Diagnostic Python reference — **not production code**, kept in sync with `parser.ts` for local debugging. |
| `supabase/functions/scrape-trails/index.ts` | Handler: gate → fetch → parse → diff → upsert → assert → alert → deploy. |
| `supabase/functions/scrape-trails/parser.ts` | Pure HTML parser. |
| `supabase/functions/scrape-trails/diff.ts` | Change detection vs current DB state. |
| `supabase/functions/scrape-trails/golden.ts` | Stable-race assertions run after each upsert. |
| `supabase/functions/scrape-trails/test.ts` | `deno test` parity checks against `fixture.html`. |

### Auth

The function is deployed `--no-verify-jwt`, so it is gated by a shared secret:
it requires an `x-scrape-secret` header matching the `SCRAPE_SECRET` function
env var. The weekly cron supplies it from the vault (`scrape_secret`). There is
no unauthenticated trigger path.

Required Edge Function secrets (`supabase secrets set …`):

- `SCRAPE_SECRET` — shared secret; also stored in the vault as `scrape_secret`
  for the cron.
- `VERCEL_DEPLOY_HOOK_URL` — Vercel deploy hook (no committed fallback).
- `RESEND_API_KEY`, `ALERT_FROM`, `ALERT_TO` — email alerts (no-op if unset).

### Manual run

```bash
supabase functions invoke scrape-trails --body '{}'          # needs the secret configured
# or, with the header explicitly:
curl -X POST "$SCRAPE_URL" -H "x-scrape-secret: $SCRAPE_SECRET" -d '{}'
```

A successful run within the last 30 minutes is skipped
(`{"status":"skipped","reason":"recent_success"}`); pass `{"force": true}` to
override. `force` still requires the secret.

### Operations

```sql
-- run history
select id, run_at, status, total_races, added, changed, removed, duration_ms
from scrape_runs order by run_at desc limit 20;

-- recent changes
select change_type, count(*) from race_changes
where detected_at > now() - interval '14 days' group by change_type;

-- disable / re-enable the weekly job
select cron.unschedule('scrape-trails-weekly');
-- re-enable by re-applying supabase/migrations/*_schedule_scrape_auth.sql
```

### Debugging a parse regression

When `scrape_runs.error_message` is set, a golden assertion fails, or
`total_races` deviates sharply from baseline:

1. Save the live HTML:
   `curl -A "Mozilla/5.0 ..." "$SOURCE_URL" > /tmp/calendar.html`
2. Run the Python diagnostic: `python scrape_trails.py --html-file /tmp/calendar.html --csv-only --csv-path /tmp/check.csv`
3. Run the TS parity tests: `deno test --allow-read supabase/functions/scrape-trails/test.ts`
4. If the parser regressed: fix `parser.ts`, mirror in `scrape_trails.py`,
   refresh `fixture.html`, update `test.ts`, then
   `supabase functions deploy scrape-trails --no-verify-jwt`.

## Local tooling

- Deno 1.40+ — Edge Function tests.
- Python 3.10+ with `requests` + `beautifulsoup4` — the diagnostic scraper.
- Supabase CLI — deploy functions / apply migrations from your machine.
