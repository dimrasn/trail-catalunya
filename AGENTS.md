# Trail Catalunya — agent guide

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may
all differ from your training data. Read the relevant guide in
`node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Cold-start reading order

1. `README.md` — live architecture: 3 surfaces (site / weekly scraper / MCP
   server) over one Supabase dataset. Trust this, not any `CLAUDE.md`/`AGENTS.md`
   in a parent directory (stale v1, superseded June 2026).
2. `## Deployment state` below — what's live vs built-but-NOT-deployed.
   **enrich-races is NOT live**: don't apply its migrations or "fix" its absence
   without the activation checklist.
3. Tests before touching code:
   `deno test supabase/functions/ eval/` and `node --test app/lib/enrichment.test.mjs`.
   Known quirk: local `deno check` on files importing supabase-js fails on
   `npm:@supabase/realtime-js` resolution — **local only, deploys fine, do not fix**.
4. `supabase/migrations/` in filename order — the real schema. `races` is one
   row per race×distance; the app and MCP group into events by `(race_url, town)`.
5. `docs/brainstorms/` → `docs/plans/` by date prefix — design rationale for the
   MCP server (06-21) and enrichment (06-23). Their Scope Boundaries sections
   list what is deliberately not built.
6. Data flow: pg_cron Mon 05:00 UTC → `scrape-trails` (x-scrape-secret) →
   upsert + golden assertions + Resend alerts → Vercel deploy hook → site rebuild.
   Manual re-run: README "Operations".
7. Site drive times come from `data/towns-drive-times.json` (committed JSON),
   NOT the `towns` table — only MCP reads the table. New town in a scrape →
   drive time is null until the "New town" runbook (README) is run. The
   site→towns migration is deliberately deferred (enrichment plan, Scope Boundaries).

## Deployment state (last verified 2026-08-20)

**Live:** Next.js site on Vercel (ISR, auto-deploy from `main`); `scrape-trails`
Edge Function + weekly cron (verified green); `mcp` Edge Function (public);
SEO layer (robots/sitemap/JSON-LD/og-image). Custom domain: **trailraces.cat**
(DonDominio, bought 2026-08-20) — added to Vercel + `NEXT_PUBLIC_SITE_URL` set;
DNS cutover + GSC in progress, see `docs/handoffs/2026-08-20-domain-cutover-handoff.md`.

**Built but NOT deployed — enrichment pipeline** (`supabase/functions/enrich-races/`,
merged in `710cb31`): migrations `20260623120000_race_enrichment.sql` and
`20260623120500_schedule_enrich.sql` are **unapplied**; function undeployed; no
secrets set. The site and MCP tolerate the missing table by design. Activation
checklist, in order:
1. Recompute worst-case token cost vs the €5/month cap (plan KTD3; constants in
   `enrich-races/cost.ts` are provisional).
2. Seed real eval snapshots (`enrich-races/fixtures/README.md`) — the display
   gate is untrustworthy on the 3 synthetic seeds.
3. `supabase secrets set ANTHROPIC_API_KEY ENRICH_SECRET` (dedicated Anthropic
   key with provider-side spend limit ≤ the cap).
4. Vault entries `enrich_secret`, `enrich_races_url` (out-of-band).
5. Apply the schema migration.
6. `supabase functions deploy enrich-races --no-verify-jwt`.
7. Apply the cron migration **last** (it schedules POSTs to the function —
   applying it first fires crons at a nonexistent endpoint).

## Provisioned infra (names only — values live in Supabase/Vercel dashboards)

- Supabase project: `qaebfhbdfjvzhmvcjroz`.
- Vercel project: `trail-catalunya` (`prj_kmAJZb6QBJk0IQuQIqCgVf6JIwSh`,
  team `team_pN0P95wmwoYttZ31w3tnMCio`); prod alias `trail-catalunya.vercel.app`;
  custom domain `trailraces.cat` (+ `www` 308→apex), registrar DonDominio.
- GitHub: `dimrasn/trail-catalunya`, deploys from `main`.
- Edge Function secrets: `SCRAPE_SECRET`, `RESEND_API_KEY`, `ALERT_FROM`,
  `ALERT_TO`, `VERCEL_DEPLOY_HOOK_URL`; future: `ANTHROPIC_API_KEY`, `ENRICH_SECRET`.
- Vault secrets (pg_cron auth): `scrape_secret`, `scrape_trails_url`; future:
  `enrich_secret`, `enrich_races_url`.
- Cron jobs: `scrape-trails-weekly` (Mon 05:00 UTC); future `enrich-races-weekly`
  (Mon 06:00–06:50 UTC, 6 fires).
- Build env (Vercel + local `.env.local`): `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public by design), optional `NEXT_PUBLIC_SITE_URL`.
