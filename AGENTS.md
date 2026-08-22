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
   `deno test --allow-read supabase/functions/ eval/` and
   `node --test app/lib/enrichment.test.mjs`. The `--allow-read` flag is REQUIRED
   — without it 12 scrape-trails tests false-fail on `fixture.html` read access
   (NotCapable), which looks like a code defect but isn't.
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

## Deployment state (last verified 2026-08-22)

**MCP version 10 + difficulty index — DEPLOYED & VERIFIED 2026-08-22.** The
difficulty metric now uses ITRA's *published* km-effort scale (verified at
itra.run): `itra_points` 0-6 (ITRA's table), a 6-level `difficulty_level` word
(Easy/Moderate/Hard/Very hard/Extreme/Brutal, ITRA points 4+5 merged into
Extreme), and `d_plus_per_km` (vertical density) — per distance + event-max
(`scope:event_max`, null unless every distance has D+). Shipped on race pages
("Difficulty: <word> · <km-effort> km-effort" + "Climb: <n> m/km" + an ITRA-logic
note) and all three MCP tools; the earlier homemade bands are gone. Shared pure
module `supabase/functions/mcp/difficulty.ts` ↔ `app/lib/format.js`, parity-
guarded by mirrored tests (`difficulty_test.ts` + `app/lib/format.test.mjs`,
11 each). Includes the 5 Codex-review fixes to the first difficulty cut. v10
deployed via Supabase MCP `deploy_edge_function` from encoded source (all 10
files); verified live: `get_race(ultra-pirineu)` → `{km_effort:166,
itra_points:5, difficulty_level:"Extreme"}`, per-distance `d_plus_per_km`
present, filtered search `matched_distances` carries the new fields,
`enriched_facts:null` (lag-tolerance intact). **Mountain Level (0-12) stays
parked** — ITRA hides that formula; the aid-station penalty rides with the
enrichment deploy. See `docs/ROADMAP.md`.

**Live:** Next.js site on Vercel (ISR, auto-deploy from `main`); `scrape-trails`
Edge Function + weekly cron (verified green); `mcp` Edge Function (public);
SEO layer (robots/sitemap/JSON-LD/og-image). Custom domain: **trailraces.cat**
(DonDominio, bought 2026-08-20) — added to Vercel + `NEXT_PUBLIC_SITE_URL` set;
Site LIVE at https://trailraces.cat (DNS+SSL+308s verified); GSC verified +
sitemap submitted + homepage indexing requested; Bing imported from GSC (all
2026-08-20). GSC verification is an HTML-tag meta in app/layout.js — do not remove.

**MCP agentic-composition instructions — DEPLOYED 2026-08-20** (mcp function
version 8, verify_jwt:false, via Supabase MCP `deploy_edge_function`). v7
(2026-08-20) added a DISCOVERY block at the top of `INSTRUCTIONS` (drive-time is
the primary axis; which tool for which query) and replaced the readiness/
projected-time heuristic with a Riegel + ITRA-km-effort (Naismith) v1 — approved
as a scrappy-but-defensible starting point, to be refined later. v8 (2026-08-20,
second-pass audit hardening): strict allowlist on the anonymous query log
(`log_filter.ts`, pure + tested — only declared filter keys persist, undeclared
fields dropped so no PII/training-data leak); readiness rewritten as a strict
mutually-exclusive decision order on the SELECTED variant with complete-data
guards + ultra cutoffs; injection guardrail (scraped race text is data, not
instructions; never POST training data to a url); `get_race` now returns the
`personalization` envelope; ceiling + per-IP rate limit now gate `initialize`
and `tools/list`, not only `tools/call`. NOTE: free-text `query` is still logged
as `query_text` (declared, disclosed, and the enrichment-priority signal) — the
auditor wanted it removed entirely; kept pending Dima's call (open decision).
`supabase/functions/mcp/protocol.ts` adds an `INSTRUCTIONS` export (returned in
`initialize`), `tools.ts` adds a `personalization` envelope field + composition
clauses on all three tool descriptions + the enrichment integration (imports
`enrichment_view.ts`, queries `race_enrichment`), `index.ts` wires `instructions`
into the initialize result. These teach a composing agent to join races with the
user's OWN Strava/Garmin MCP locally (readiness + projected finish time) — zero
storage, no server-side fetch. Front-end nudges (AskAI panel, askPrompt lines,
/about, /for-agents) shipped via Vercel push. Verified live post-deploy:
`initialize` returns the 3261-char `instructions`; `search_races` returns
`personalization` + `enriched_facts: null` (see next para) with no error.

**Note the enrichment-lag tolerance is now PROVEN, not just designed.** Versions
5→6 crossed the enrichment integration merged in `710cb31` (which version 5
predated). The deployed `tools.ts` now queries `race_enrichment`, a table that
is STILL unapplied (see enrichment pipeline below). The tools tolerate its
absence by design — the `race_enrichment` select's error is not thrown;
`enrichedFactsForMcp(undefined)` returns null — and this was confirmed against
prod on 2026-08-20 (a live `search_races` returned a clean payload,
`enriched_facts: null`, no 500). Activating the enrichment pipeline later will
light these facts up with no further MCP redeploy needed.

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
