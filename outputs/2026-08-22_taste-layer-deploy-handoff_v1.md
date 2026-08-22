# Handoff — audit the Step-2 taste-layer deploy PLAN (before build)

**For:** an external reviewing agent (e.g. Codex) — you are outside the harness
that wrote the plan, so you don't share its blind spots. **Audit the PLAN, not a
diff** — nothing is built yet. Read-only: do not implement, migrate, or deploy.

**Repo:** `/Users/dima/Claude/Trails/trail-catalunya` (production: trailraces.cat
+ a public Supabase Edge Function MCP).

## What to read (cold-start order)
1. `docs/plans/2026-08-22-001-feat-taste-layer-deploy-plan.md` — the plan under audit.
2. `docs/ROADMAP.md` — Step 2 in the locked sequence + the deviation test.
3. `AGENTS.md` "Deployment state" — what's live vs the DORMANT enrich pipeline
   (this plan must not activate it).
4. `app/lib/races.js` + `app/lib/enrichment.js` — how the site reads/gates the
   current stable-facts enrichment (the pattern the taste layer must mirror).
5. `supabase/functions/mcp/tools.ts` + `mcp/enrichment_view.ts` — the MCP side.
6. `supabase/migrations/20260623120000_race_enrichment.sql` — the existing
   enrichment schema the new `race_taste` table sits beside.
7. Data being deployed: `docs/enrichment/2026-batch/chunk-0.md` (shape) +
   `_overrides/burriac-atac.md` (the `[RUNNER]` layer) + `_fix-list.md` (the 29).

## The decision the plan turns on
**KTD1 — storage.** The plan recommends a NEW Supabase `race_taste` table (both
site + MCP read Supabase already; one source of truth) over a committed JSON
(site-only; the MCP is a separate Edge Function that can't import repo JSON).
Is that the right call, or does a committed-JSON-bundled-into-both surface win?

## Questions to pressure-test (rank by severity, most severe first)
1. **Hallucination containment (KTD2/U2).** The store is built from freeform
   markdown by an LLM parser. Are the verbatim-copy + honesty-default-unknown
   rules + the pre-load human-diff gate enough to guarantee the store contains
   nothing the markdown doesn't say? What would you add?
2. **Key integrity (U2 risk).** Taste joins on `(source, race_url, town)`. What
   silently drops a join (trailing slash, town spelling, source value), and is
   the U2 join-check against `races` sufficient to catch it before load?
3. **Migration-safety optics.** U1 applies a new table. Confirm it is genuinely
   inert (no function/cron/cost) and cannot be confused with the AGENTS.md-gated
   enrich-pipeline activation. Anything about RLS / grants that's wrong?
4. **Honesty rendering (KTD4).** Is the gate's treatment right — `[scraped]` as
   fact, `[derived]/[editorial]/[inference]` as visible judgement, `[RUNNER]`
   attributed to Dima, `[unknown]` omitted — and does the MCP untrusted-content
   notice need to distinguish OUR editorial from scraped third-party text?
5. **Degradation.** Will a race with no taste row (the 29 fix-list + any
   un-scraped) render EXACTLY as today on both site and MCP? Any path where an
   absent join throws instead of being skipped?
6. **Scope / deviation.** Does anything in the plan quietly exceed Step 2
   (e.g. re-touch difficulty, expand personas, wake the pipeline)?

## Constraints (do not violate)
- Do NOT implement, apply migrations, deploy, or push. Audit only.
- The enrich-races pipeline stays dormant. MCP stays `verify_jwt:false` (public).
- Honesty-default-unknown; never fabricate a race attribute.

## Return
A ranked findings list (severity, file/section, the concrete failure it causes,
suggested fix) + a verdict on KTD1. Prefer a few decisive findings over a long
list.
