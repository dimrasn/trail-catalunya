# Codex review handoff — FdR light redesign, pre-production

2026-08-25 · For: Codex (outside auditor) · From: the Claude Code session that built the branch
Review target: branch `feat/fdr-light-redesign` (repo `dimrasn/trail-catalunya`), diff vs `origin/main`.
Gate: this branch merges to `main` (= production deploy to trailraces.cat via Vercel) only after your review + Dima's go.

**Why you:** workspace rule — a reviewer inside the same harness shares the author's blind spots. Everything below was built and self-verified by one Claude session; your job is to find what it cannot see. Report only — do NOT fix, do NOT commit, do NOT touch `main` or other branches.

## 0. Setup (isolated — other sessions use the main checkout)

```bash
cd ~/Claude/Trails/trail-catalunya
git fetch origin
git worktree add ../trail-catalunya-codex origin/feat/fdr-light-redesign
cd ../trail-catalunya-codex && npm install
cp ../trail-catalunya/.env.local .env.local   # NEXT_PUBLIC_* only, public by design
```

Baselines that MUST be green before you start (if not, stop and report that first):
- `node --test app/lib/*.test.mjs` → 77 pass (glob required; a bare directory arg fails to resolve).
- `deno test --allow-read supabase/functions/ eval/` → 140 pass (`--allow-read` is REQUIRED — without it 12 scrape tests false-fail on fixture reads; this is a known trap, not a defect).
- `npm run build` → 238 static pages (needs `.env.local`).
- Optional visual: `npm run dev` → localhost:3000.

## 1. What this branch is

A full visual + IA rebuild of the two product pages in the "Full de Ruta" light design system, replacing the dark skin, PLUS a merge of `feat/card-quality-tier0` (expected-month display for ~138 dateless races + audit fixes + undeployed MCP expected-month parity).

New/rewritten, in dependency order:
- `app/lib/semantics.js` (+ test) — colour/drive/verdict semantics. Every design meaning lives here.
- `app/fdr.css`, `app/layout.js` — tokens + Anton/Work Sans/JetBrains Mono via next/font.
- `app/components/fdr/` — DifficultyChip, DifficultyScale, DistanceLadder, StatusRibbon, Provenance.
- `app/lib/filters.js` (+ tests) — new `difficulty` multi-select filter (`dif` URL param, event-max scope; unrated races match only an empty selection).
- `app/race/[slug]/page.js` — rebuilt: ribbon → verdict → difficulty module → gate strip → act zone → ladder + table → taste → related. Kept: generateMetadata, JSON-LD, revalidate=86400, dynamicParams=false, build-time memo.
- `app/components/RaceCard.jsx` (V2 tiered card), `RaceList.jsx` (hero header, "Next two weekends" horizon, "closest match" block, difficulty wiring), `FilterBar.jsx` (difficulty row; climb demoted behind MORE; MORE/SHOW split), `FilterChip.jsx`, `AskAI.jsx` (restyle only — logic untouched).
- `app/globals.css`, `app/about/page.js`, `app/for-agents/page.js`, `app/opengraph-image.js` — light cutover (mechanical token sweep).
- `supabase/functions/mcp/*` — arrived via the card-quality merge, NOT authored by this redesign (one test-typing fix excepted). MCP deploys are manual and separate; merging to main does NOT deploy them.

## 2. Owner rulings — verify implementation, do NOT relitigate the design

All recorded with rationale in `outputs/2026-08-24_design-decision-log_v1.md` (in this branch). Binding: light board; drive time as banded warm chips NEAR/MID/FAR (green/amber/dark-red pastels, word+time always together — owner chose this over two alternatives knowing amber also means Hard); AI buttons in palette tints (Claude orange tint, ChatGPT green tint); verdict = editorial-or-nothing (no generated prose); distances enumerate never range; kids run is a table row; sold-out = event-level ribbon on the race page, typographic chip at list level; no recommendations before user input, one labelled "closest match" after.

## 3. Where to look hardest (my own risk-ranking — but roam freely)

1. **Hydration & SSR.** `RaceList` deliberately avoids `useSearchParams` (SSR bailout would empty the server HTML — see the comment). Filters apply post-mount from `window.location`. New this branch: `todayISO()`-dependent horizon block and closest-match block. Check: hydration mismatch risk around midnight/build-time vs client clock; the horizon computing on server-render with build-time date (is the SSR HTML ever wrong-but-sticky?); `filtersToParams(filters) !== ''` as the "has input" test (does `showPast` etc. count as input and hide the horizon — intended, but check for weird states).
2. **Filter correctness + URL back-compat.** `matchesDifficulty` (event-max scope; `vh+` = Very hard/Extreme/Brutal; unrated excluded under an active selection). Legacy URLs (`?drive=u60&dist=10-15,15-21&prov=…`) must still parse; new `dif` param round-trips. The `%2B` in `vh+` through URLSearchParams both directions.
3. **The merge itself.** `origin/main...` union of two diverged branches (main's taste v15 fixes × card-quality's expected-month). I already caught one union break (deno type error in `filters_core_test.ts`). Look for more: places where main's newer taste/format code and card-quality's expected-month code interact (e.g. `races.js`, `format.js`, `askPrompt.js`, race page expected-date rendering).
4. **The mechanical token sweep** on `about`/`for-agents`/`AskAI` (regex/string replacements): any missed colour, unreadable pairing, or broken inline style produced by blind substitution.
5. **Data-shape honesty.** Null paths: no drive (em dash), no D+ (UNRATED / "climb not published" / ladder sunk bar), no taste (no line 4), expected month (never looks confirmed), `soldOut` + cancelled ribbon interplay, kids-run row colSpan arithmetic in the distances table.
6. **A11y.** Chips carry words + aria-labels by design — verify none of the new components leaks a colour-only state; focus-visible on all interactive elements; contrast of the pastel chips' ink pairs and of MID amber text on white.
7. **Perf.** ~206 `RaceCard`s render client-side per filter change; `verdictFor`/`eventKmEffort` called per card per render inside the signal line. Is any of it worth memoising, or is it noise at this scale?

## 4. Known + accepted (don't report these as findings)

- Warm drive chips can sit next to warm difficulty chips (e.g. BRUTAL + MID amber on one row) — owner accepted, the band word disambiguates.
- Horizon block duplicates races that also appear in their month group — deliberate (orientation vs complete calendar).
- Sold-out is event-level only (source has no per-distance availability) and the ribbon says so honestly.
- Night flag is absent on the site (MCP-only data today).
- ElevationProfile/silhouettes intentionally not built (no GPX data); DistanceLadder fills the slot.
- `deno check` on files importing supabase-js fails locally on `npm:@supabase/realtime-js` — known local-only quirk, deploys fine (AGENTS.md).
- The dev `.claude/launch.json` in the MAIN checkout points at this worktree — session tooling, not shipped.

## 5. Deliverable

Write findings to `outputs/2026-08-25_codex-review-findings_fdr_v1.md` in your worktree (do not commit): severity-ranked (blocker / should-fix / nit), each with file:line, the failure scenario, and — per the owner's standing rule — **lead with the few findings that actually matter** rather than an exhaustive inventory. If nothing blocks the merge, say so in one line at the top.
