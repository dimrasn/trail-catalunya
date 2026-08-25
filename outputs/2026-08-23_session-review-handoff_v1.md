# Handoff — full review of the trailraces session (Slice 1 + dogfood)

**For:** an external reviewing agent (e.g. Codex) — outside the harness that did
this work. **Review everything shipped/staged in this session** and judge whether
it's correct, honest, and safe. Read-only: do NOT implement, migrate, deploy,
push, or switch branches (a parallel session shares this working dir — see below).

**Repo:** `/Users/dima/Claude/Trails/trail-catalunya` — production: trailraces.cat
(Next.js on Vercel from `main`) + a public, authless Supabase Edge Function MCP
(`verify_jwt:false`). North star: the best AI-agent-friendly race discovery layer
(the MCP/agent experience is the crown jewel), as Dima's learning + runner value.

## ⚠ Read this first — shared working dir
The working dir may be checked out on a parallel session's branch
(`feat/multi-select-filters`), NOT `main`. **Review `main` (origin/main), which is
the trailraces source of truth for this session's work.** Do NOT `git checkout`
in the shared dir. If you need a clean tree, use a worktree:
`git worktree add <tmp> main`.

## What this session shipped / staged (the arc)
1. **ITRA difficulty (Step 1) — LIVE.** Difficulty on ITRA's published km-effort
   scale: 6-level word (Easy…Brutal) + `itra_points` 0-6 + `d_plus_per_km`, per
   distance + event-max (null unless every distance has D+). Shared pure module
   `supabase/functions/mcp/difficulty.ts` ↔ `app/lib/format.js`, parity-tested.
   MCP deployed (was v10). Fixed 5 prior Codex-review defects.
2. **Past-races fix — LIVE.** `app/components/RaceList.jsx` hid finished races by
   default + a "Show past" toggle (`FilterBar.jsx`). (Data retains past races;
   only the list was missing a date filter.)
3. **Taste layer Slice 1 — LIVE (site + MCP v11).** Hand-curated editorial +
   clean character attributes for ~84 races, each labelled by `claim_strength`
   (organizer / derived / our_read / inference / dima). Generator
   `scripts/build-taste.mjs` → `docs/enrichment/2026-batch/parsed/taste.json`
   (git source; also bundled as `mcp/taste.json`). Gate `app/lib/taste.js` ↔
   `mcp/taste_view.ts` (parity-tested). Site: "Our take" + "Character" section;
   MCP: `get_race` full taste, list tools = `taste_available` + `taste_summary`.
   Operational facts (start/cutoffs) DEFERRED to Slice 2 by design.
4. **Staged on `main`, NOT yet on the live MCP (v11):**
   - `taste_flags` (night, technicality band) in the list projection (dogfood #1).
   - PROJECTED-TIME instruction fix (work-interval anchor + flag no-anchor; R2-2).
   - The next `supabase functions deploy mcp` from `main` ships both → v12.
5. **Dogfood (2 rounds) — `docs/dogfood/2026-08-22-slice1-gaps.md`.** Cold-agent
   round 1 + a composition round 2 run against Dima's live Strava. Conclusion:
   the north-star bet works (readiness verdict correct + useful). Gap list drives
   Slice 2.

## Cold-start reading order
1. `docs/ROADMAP.md` — north star + locked sequence + Slice-1-shipped state.
2. `AGENTS.md` "Deployment state" — live vs staged, the deploy runbook, the
   `main`-ahead-of-MCP note, the deploy trap.
3. `docs/plans/2026-08-22-001-feat-taste-layer-deploy-plan.md` (v3) — the taste
   plan + KTDs (built through two audits).
4. Prior audits already folded in (for context, not re-review):
   `outputs/2026-08-22_taste-layer-deploy-plan-audit_v1.md`,
   `outputs/2026-08-22_step2-taste-layer-audit_v1.md`.
5. The code: `scripts/build-taste.mjs`, `app/lib/taste.js`, `mcp/taste_view.ts`,
   `mcp/tools.ts`, `mcp/protocol.ts` (INSTRUCTIONS), `app/race/[slug]/page.js`,
   `app/lib/difficulty`↔`format.js`, `app/components/RaceList.jsx`.
6. Output: `docs/enrichment/2026-batch/parsed/taste.json` (+ `taste-exceptions.json`).
7. Tests: `app/lib/format.test.mjs`, `app/lib/taste.test.mjs`,
   `mcp/difficulty_test.ts`, `mcp/taste_view_test.ts`.

## Review these specifically (rank findings most-severe first)
1. **Live-vs-repo drift.** Confirm the live site + MCP match `main` where claimed
   LIVE (Slice 1), and that `taste_flags`/R2-2 are correctly described as staged
   (NOT live). Probe the MCP: `get_race`/`search_races` (endpoint in AGENTS.md).
2. **Honesty guarantees hold** (the product's whole differentiator): no unknown
   published as fact; editorial never labelled organizer_fact; no prior-edition
   operational fact shown as current; `taste_flags` conservative (a flag set only
   when stated — e.g. Burriac Atac must NOT read technicality:low). Verify against
   `taste.json` + the gates.
3. **Generator trustworthiness.** Is `taste.json` reproducible from the current
   `build-taste.mjs` (re-run in a temp dir, diff)? Tag normalization, leading-tag
   value recovery, meta/date-town exclusion, source-addressability. (A prior audit
   found a stale-file + several bugs — all since fixed; confirm they're actually
   fixed, and that compound operational bullets are excluded, not garbled-published.)
4. **Difficulty correctness** (Step 1): km-effort/ITRA-points/bands, null-when-
   partial, per-distance vs event-max scope.
5. **Parity** site↔MCP gates (taste + difficulty): same logic, field-name
   convention aside; tests mirror.
6. **Dogfood soundness.** Is the round-2 composition math (readiness L/V/W/C +
   Riegel projection) applied correctly per the INSTRUCTIONS, and are the gap-list
   conclusions justified?
7. **Deploy/CLI safety & git hygiene** — the MCP taste bundle can't be inline-
   deployed (165KB); CLI-from-`main` is the path; the branch-collision handling.

## Known-incomplete — assess the PLAN, don't re-report as bugs
- MCP is v11: `taste_flags` + R2-2 are on `main`, not live yet (deploy pending).
- Slice-2 backlog: operational facts (compound-bullet manual split + prior-edition
  gate), merge `_overrides/*` (Burriac runner/PDF notes), technicality-coverage
  salvage, chunk-3 url-only join (town backfill), ~4 non-joining + exception tail.
- Deferred by lean decision (Trade 1/2): resolution-ledger + digest-parity
  machinery (revisit only if taste scales to 226 / regenerates on a cadence).

## Constraints
Read-only; no deploy/migrate/push/branch-switch. Honesty-default-unknown; never
fabricate a race attribute. MCP stays authless/public. Enrich-races LLM pipeline
stays dormant (out of scope).

## Return
A ranked findings list (severity · file/section · concrete failure · fix) + a
verdict: is the shipped Slice 1 sound to keep live, and are `taste_flags`/R2-2
safe to deploy (v12) as-is? Prefer a few decisive findings over a long list.
