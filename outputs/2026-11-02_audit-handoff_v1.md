# Audit handoff — trailraces.cat after the 5-week stale-data incident

2026-11-02 · For: an independent auditing agent (Codex or equivalent — a different harness from the one that wrote the fix, on purpose) · From: the Claude Code session that diagnosed and fixed the incident. **Report only: do not fix, commit, deploy, or trigger a scrape.**

## What the product is
trailraces.cat — trail-race discovery for Catalonia: a Next.js site on Vercel (deploys from `main`), a weekly scraper Edge Function (`supabase/functions/scrape-trails`, pg_cron Mon 05:00 UTC → `races` table), and a public MCP server (`supabase/functions/mcp`) that AI agents query. Supabase project `qaebfhbdfjvzhmvcjroz`. Repo `dimrasn/trail-catalunya`. The owner's bar: a confidently-wrong fact shown to a runner is worse than a gap.

## What happened (facts, from `scrape_runs` and the live site)
- 2026-10-05 → 2026-11-02: five consecutive Monday scrapes failed with `Sanity gate failed: only ~300 fresh rows vs 393 active in DB (min 314)`. Last good scrape: 2026-09-28. The site and MCP served 5-week-old data; nobody noticed until the owner opened the site on 2026-11-02.
- Root cause: the gate compared fresh rows against ALL non-removed DB rows, including ~209 finished races. Finished races are only marked REMOVED by a successful run, so the gate could never recover.
- Separately, the homepage showed September/October races in November: month-only races ("SEP · TBA", no published day) were exempt from the past-race filter.
- Separately, `enrichment_view_test.ts` hardcoded 2026-06-23 facts against the real clock; after ~21 Sep it failed, so `scripts/deploy-mcp.sh` (fail-closed test gate) could not deploy the MCP.

## What was changed (commit `2cf4873` on `main`)
1. `sanityBaseline()` in `scrape-trails/diff.ts`: baseline = upcoming + undated rows only. Tested.
2. `app/components/RaceList.jsx` and `mcp/filters_core.ts` (`not_before`): a month-only race whose month is over is treated as past. Tested on the MCP side.
3. `enrichedFactsForMcp(row, nowMs)` takes an injectable clock; the test pins it.
Then: scrape-trails deployed; a forced scrape succeeded (300 rows, +22, −115, ~34 changed, deploy hook fired); MCP deployed via `deploy-mcp.sh` (live `serverInfo.build = 2cf4873`); live homepage verified to open on November.

## What to audit — push hardest on 1 and 2
1. **Why did a 5-week outage stay silent?** `scrape-trails/index.ts` calls `sendAlert` on error (Resend; secrets `RESEND_API_KEY`, `ALERT_FROM`, `ALERT_TO`). Did those alerts send? Check function logs / Resend if reachable; otherwise say exactly what you could not check. Is there any freshness check independent of the scraper (e.g. the MCP's `data_freshness.stale` flag, threshold 10 days) that anyone or anything reads? Propose the cheapest detection that would have caught this in week 1.
2. **Is the new gate still a real gate?** With baseline = upcoming + undated, could a genuinely broken parser now pass (e.g. parse only the future half of the calendar)? Golden-row assertions exist (`runGoldenAssertions`) — do they cover that? Note the source calendar still lists ~115 past-dated rows today; check what happens to the baseline when the source prunes them.
3. **Past-race handling everywhere a race is shown.** Site list (fixed), "At a glance" hero, the "PAST RACES 0" counter on the homepage (looks wrong — there are past races), weekend view, race detail pages for finished races, homepage `ItemList` JSON-LD, `sitemap.xml`, MCP `search_races` / `whats_on` / `get_race`. Is "past" defined the same way in each? Is a month-only race in the *current* month handled sensibly?
4. **Other clock-dependent tests** — anything else that will fail on a future date and silently block a deploy gate (grep for hardcoded 2026 dates in `*_test.ts` / `*.test.mjs`).
5. **Data honesty after the catch-up.** 34 races changed in one run after 5 weeks: spot-check a few against the source (ultrescatalunya.com) — dates, distances, status (cancelled/SUSPESA).
6. **Anything else** that would show a runner something false or stale.

## Setup
```
cd ~/Claude/Trails/trail-catalunya && git fetch origin
git worktree add ../trail-catalunya-audit origin/main && cd ../trail-catalunya-audit
cp ../trail-catalunya/.env.local . && npm install
deno test --allow-read supabase/functions/ eval/   # expect 156 pass
node --test app/lib/*.test.mjs app/components/*.test.mjs   # expect 138 pass
```
Prod reads (read-only): Supabase MCP `execute_sql` on `qaebfhbdfjvzhmvcjroz` — tables `scrape_runs`, `races`, `crawler_hits`, `seo_readings`, `intent_log`; `cron.job`. Live MCP: POST `https://qaebfhbdfjvzhmvcjroz.supabase.co/functions/v1/mcp`. Never write, deploy, or trigger a scrape.

## Deliverable
`outputs/2026-11-02_audit-findings_v1.md` in your worktree, uncommitted. One table, one row per finding: severity (blocker / should-fix / nit), what a runner or agent would see, evidence (file:line or query + result), fix suggestion. Mark each claim as fact (with source) or judgement. Lead with the two or three that matter; if nothing blocks, say so in one line at the top.
