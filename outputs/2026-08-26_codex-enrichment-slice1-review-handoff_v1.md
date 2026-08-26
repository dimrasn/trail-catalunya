# Codex review handoff — enrichment Slice 1 (links + character), pre-production

2026-08-26 · For: Codex (outside auditor) · From: the Claude Code session that built the branch
Review target: branch `feat/enrich-links-character` (repo `dimrasn/trail-catalunya`), diff vs `origin/main` (base `848915d`).
Gate: this branch merges to `main` (= production: site to trailraces.cat via Vercel, and a **separate** manual MCP deploy via `scripts/deploy-mcp.sh`) only after your review + Dima's go.

**Why you:** workspace rule — a reviewer inside the same harness shares the author's blind spots. Everything below was built and self-verified by one Claude session; your job is to find what it cannot see. Report only — do NOT fix, do NOT commit, do NOT touch `main` or other branches.

**The product's #1 value is HONESTY.** The governing rule for this whole slice: *never publish a confidently-wrong fact — a gap is always better than a wrong answer.* Your highest-value findings are any place a runner (or their agent) could be shown something false and believe it.

## 0. Setup (isolated — other sessions use the main checkout + a different branch)

```bash
cd ~/Claude/Trails/trail-catalunya
git fetch origin
git worktree add ../trail-catalunya-codex origin/feat/enrich-links-character
cd ../trail-catalunya-codex
cp ../trail-catalunya/.env.local .env.local   # NEXT_PUBLIC_* only, public by design
npm install                                   # or: cp -al ../trail-catalunya/node_modules ./node_modules
```

Baselines that MUST be green before you start (if not, stop and report that first):
- `node --test app/lib/*.test.mjs` → **97 pass** (glob required; a bare directory arg fails to resolve).
- `deno test --allow-read supabase/functions/ eval/` → **151 pass** (`--allow-read` REQUIRED — without it the scrape tests false-fail on fixture reads; known trap, not a defect).
- `deno test --allow-read --allow-net scripts/enrich-extract-links_test.ts` → **3 pass** (the link-classifier honesty tests).
- `npm run build` → **238 static pages** (needs `.env.local`).
- Optional visual: `npm run dev` → a race with no prior taste, e.g. `/race/trobada-aristot`, shows generated Character + a Wikiloc "Route map".

The three commits to review (`git log --oneline origin/main..HEAD`):
1. `8698738` durable content-addressed corpus + Slice-1 contract
2. `0e40a3c` link extraction — 97 route links across 43 races
3. `589dc78` wire character + links into site & MCP

## 1. What this branch is

Slice 1 of the enrichment phase: extend each race with (a) **route/social links** found on its official page and (b) **generated editorial character** for races the curated taste layer doesn't cover. It deliberately ships the LOW-BLAST subset; the high-risk operational logistics (start_time, price, cutoff, registration, sold-out, equipment) are OUT of this slice.

Pipeline (all local, no metered cloud — Dima's "only 200 sites, do it locally" ruling):
- `scripts/enrich-crawl.ts` — crawls each race's official page(s) into a **durable, git-tracked, content-addressed corpus** at `docs/enrichment/2026-batch/_corpus/` (174 races / 504 pages; each page: SHA-256 of the full cleaned text — datetimes INCLUDED, so the hash is the freshness anchor — + `fetched_at` + a provenance manifest listing 55 JS-only failures). Reuses `supabase/functions/enrich-races/fetch.ts`.
- `supabase/functions/enrich-races/fetch.ts` — TWO new exports: `extractOutboundUrls(html, base)` (all href/src/bare URLs — the link evidence `htmlToText` strips) and `fetchRacePagesWithLinks` (the text-path variant + per-page `links[]`). The existing text-only path is untouched.
- `scripts/enrich-extract-links.ts` (+ `_test.ts`) — deterministic classify of corpus links → `links.json`: `tracks` (Wikiloc/Komoot/Strava routes) + `socials` (IG/FB, scope-tagged organizer-vs-race). No LLM.
- `scripts/enrich-character-input.ts` → 101 uncovered races' text → `_character-input.json`; 8 Haiku subagents → per-batch outputs; `scripts/enrich-assemble-character.ts` → `docs/enrichment/2026-batch/parsed/character.json` (75 races kept, 26 skipped as too thin).
- Wiring: `app/lib/races.js` + `supabase/functions/mcp/tools.ts` merge character as a taste FALLBACK and attach event-level `links`; `app/race/[slug]/page.js` renders a "Links" section; MCP `get_race` returns full `links`, lists return `has_track`/`has_social`.

Reference specs in the branch: `docs/enrichment/fields-spec.md` (the machine contract; the "Slice 1 — LINKS + CHARACTER" section is the honesty argument for why this subset ships simpler) and `docs/plans/2026-08-25-002-feat-enrichment-phase-plan.md`.

## 2. Owner rulings — verify implementation, do NOT relitigate

- **Ship socials with honest framing**, and **character in this same slice** — both are Dima's explicit calls this session.
- **Never publish a confidently-wrong fact; a gap beats a wrong answer.** This is the bar to hold everything to.
- **Links are EVENT-LEVEL** ("routes/socials linked from the official page"), never attached to a distance-variant as "the GPX of the 42k" (a page links several routes).
- **Character is `our_read` editorial** extending taste to uncovered races — never presented as an organizer fact. Curated `taste.json` always wins where present.
- **Socials are never "the race's official account"** — scope-tagged `organizer` (a shared timing company / host town, seen on ≥3 races) vs `race`; a sponsor/town link appearing under the honest "found on the official page" framing is accepted.
- **Slice 1 is links + character ONLY.** Operational logistics + Codex round-3's four P0s (semantic proof, formal schema, live freshness, durable IDs) belong to the LATER logistics slice — the argument that they don't bite links/character is in `fields-spec.md`. Don't require them here.
- **Bundled-JSON pattern** (like the shipped `taste.json`), no DB migration this slice.

## 3. Where to look hardest (my own risk-ranking — but roam freely)

1. **Character VALUE fabrication (sharpest).** Evidence *quotes* are corpus-verified (see #4), but each field's `value` is generated `our_read` prose. The real risk: an invented SPECIFIC — a year ("19 years of tradition"), a number ("1800m+"), a claim — that the source text does NOT support, now shown as our read. `our_read` excuses editorial *interpretation*, not invented *facts*. Sample a dozen `editorial.unique` / `catch` / `attributes.*` values in `parsed/character.json` and grep the race's `_corpus/<id>.json` text for the specifics. Flag any number/date/claim not grounded.
2. **Character can never fabricate a queryable flag.** `scripts/enrich-assemble-character.ts` FORCES `claim_strength:'our_read'` on every field regardless of model output; `taste.js`/`taste_view.ts` `tasteFlags()` only fires on `FLAG_ELIGIBLE = {organizer_fact, organizer_pdf}`. Confirm there is no path by which a generated profile sets `night`/`technicality`/`kids_race` flags, and that the merge is fallback-only (curated taste wins) in BOTH `app/lib/races.js` and `supabase/functions/mcp/tools.ts`.
3. **Link classifier honesty** (`scripts/enrich-extract-links.ts`, `classifyLink`). Does anything confidently-wrong survive? Check the allowlist/denylist (share widgets, FB pixels `/tr`, numeric page-ids, `/media`, CMS/vendor footers, `strava-embeds.com`, asset extensions, bare-domain roots, Wikiloc `user.do`, embed twins). Spot-check that a track URL on a race page is plausibly THAT race's route, not a sponsor's or a neighbouring race's. Check the `organizer`-vs-`race` scope threshold (≥3 distinct races).
4. **Evidence verification rigor.** `enrich-assemble-character.ts` keeps `evidence` only if the normalized quote (`NFC`+lowercase+collapsed-whitespace) is a substring of the normalized corpus text, min length 8. Is 8 too short (a spurious match)? Any way a NON-verbatim quote survives (147 kept / 135 dropped)? Independently: are the 147 "kept" quotes genuinely present?
5. **Key alignment / join correctness.** `links.json` and `character.json` are keyed `source_url::town` / `url::town` using the RAW race town; events are keyed by the CANONICAL town (`grouping.ts` `canonicalTown`). I claim this is PARITY with how the shipped `taste.json` joins (same convention, same match rate) and that only the one canonicalized town (Llavaneres) misses. Verify that claim, and that nothing double-counts or mis-joins across sibling distance rows.
6. **MCP deploy safety of the relative imports.** `tools.ts` imports `character.json` + `links.json` via `../../../docs/enrichment/2026-batch/...` (outside the function dir) — I rely on the precedent that `grouping.ts` already imports `../../../data/town-corrections.json` and deploys fine. Reason about whether `supabase functions deploy mcp` will bundle these at deploy; if there's any chance it won't, that's a blocker (the MCP would 500 on cold start). This is the riskiest deploy-time unknown.
7. **MCP projection.** `envelope()` strips `links` from list results and exposes `has_track`/`has_social`; `get_race` returns full `links`. Confirm no raw evidence/hash leaks into responses, and the INSTRUCTIONS text teaches an agent to read links honestly.
8. **`fetch.ts` additions are additive-only.** `extractOutboundUrls` + `fetchRacePagesWithLinks` must not change the behavior of the existing `fetchRacePages` / `htmlToText` / `discoverPageLinks` used by the real pipeline.

## 4. Known + accepted (don't report these as findings)

- **55 JS-only sites** failed the crawl (listed in `_corpus/_manifest.json` `failed[]`) — a later fix pass, not a defect.
- **Llavaneres** (the one canonicalized town) — its links/character miss the merged event; 1 race, and consistent with how `taste.json` itself behaves.
- **`supabase/functions/mcp/taste.json` differs in content from canonical `docs/enrichment/2026-batch/parsed/taste.json`** (same 84 profiles) — a PRE-EXISTING drift, NOT introduced by this branch. Worth a one-line note if you want, but it's out of scope here (this branch imports character/links from canonical precisely to avoid adding a second drifting copy).
- **135 evidence quotes dropped** as unverifiable — by design; the `our_read` value is kept, the unverifiable quote is not.
- Character is Haiku-quality editorial breadth, deliberately shallower than curated taste depth.
- `deno check` on files importing supabase-js fails locally on `npm:@supabase/realtime-js` — known local-only quirk; the test suite + deploy are fine (AGENTS.md).

## 5. Deliverable

Write findings to `outputs/2026-08-26_codex-enrichment-slice1-review-findings_v1.md` in your worktree (do not commit): severity-ranked (blocker / should-fix / nit), each with `file:line`, the concrete failure scenario, and — per Dima's standing rule — **lead with the few findings that actually matter** rather than an exhaustive inventory. If nothing blocks the merge, say so in one line at the top. The single most important question to answer: *is there anywhere this slice shows a runner a confidently-wrong fact?*
