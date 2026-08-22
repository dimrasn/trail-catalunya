# Handoff — full review of Step 2 (taste-layer deploy), in-progress state

**For:** an external reviewing agent (e.g. Codex) — outside the harness that did
this work, so you don't share its blind spots. **Review everything produced for
Step 2 so far**: the plan, the generator code, and its output. Read-only — do
NOT implement, migrate, deploy, push, or edit anything.

**Repo:** `/Users/dima/Claude/Trails/trail-catalunya` (production: trailraces.cat
site + a public Supabase Edge Function MCP). Today is 2026-08-22.

## What Step 2 is
Deploy a hand-produced "taste layer" (attributes + editorial, honesty-tagged) for
~91 of ~120 upcoming-2026 races to the race pages and the MCP. Step 1 (ITRA
difficulty) already shipped. The taste layer is static hand-curated content;
storage is committed JSON bundled into both surfaces (NOT a DB table — decided
after audit). The enrich-races LLM pipeline stays DORMANT and is out of scope.

## Current state (what to review)
- **Plan v3** (hardened through two prior audits): `docs/plans/2026-08-22-001-feat-taste-layer-deploy-plan.md`
- **Field registry + tag-normalization map:** `docs/enrichment/2026-batch/taste-fields.md`
- **Generator (deterministic parser), ~260 lines:** `scripts/build-taste.mjs`
- **Generator output:** `docs/enrichment/2026-batch/parsed/taste.json` (92
  profiles) + `docs/enrichment/2026-batch/parsed/taste-exceptions.json` (166 items)
- **Source corpus:** `docs/enrichment/2026-batch/chunk-0..11.md` (123 `##` blocks;
  ~31 ⚠ fix-list stubs excluded) + `_overrides/burriac-atac.md` (`[RUNNER]` Dima)
  + `_overrides/burriac-xtrem.md` (`[PDF]` organizer) + `_fix-list.md`.
- **Prior audit already resolved into v3:** `outputs/2026-08-22_taste-layer-deploy-plan-audit_v1.md`.

Current metrics from the generator: 92 profiles, median 10 fields/profile,
exceptions reduced 817 → 166.

## Cold-start reading order
1. Plan v3 (goal, KTDs, Product Contract, units, open decisions).
2. `taste-fields.md` (the tag map + claim_strength model + canonical keys).
3. `scripts/build-taste.mjs` (the parser it describes).
4. `taste.json` — spot-check against the source markdown for the 5 fixtures:
   Burriac Atac (`chunk-1`), Ultra Pirineu, Cursa de Sant Galderic (`chunk-9` —
   the prior-edition P0), Marató del Montseny, and any fix-list race (should have
   NO profile).
5. `taste-exceptions.json` — are these truly un-parseable, or is recoverable data
   being dropped?
6. The prior audit + `app/lib/enrichment.js` / `mcp/enrichment_view.ts` (the
   provenance + staleness pattern the taste layer is meant to reuse).

## Review these specifically (rank findings most-severe first)
1. **Fidelity / hallucination.** Does `taste.json` contain anything the source
   markdown doesn't say? Are `claim_strength` values correct vs the raw tags
   (`[SCRAPE]`→organizer_fact, `[editorial/inference]`→inference, etc.)? Is
   evidence copied faithfully (modulo sanitization) or mis-attached to the wrong
   field? (The parser grabs the first `[...]` per bullet — check that heuristic.)
2. **The P0 — prior-edition facts.** Sant Galderic's `honesty` says "figures are
   2025-edition" yet its `start_time` is `organizer_fact` with no edition marker.
   Per-field edition/staleness is NOT yet wired (a known-remaining item). Is the
   plan's KTD5 approach (reuse enrichment.js's gate; hide/"previous edition —
   verify" for high-blast operational fields) sufficient, and how should the
   generator DETECT prior-edition (parse the honesty note? a per-field signal?)?
3. **Tag-normalization correctness.** `taste-fields.md` maps 60+ raw variants.
   Any mis-map (e.g. a tag that should omit but publishes, or vice versa)? The
   compound-tag "weaker wins" rule — right resolution?
4. **The exception tail (166).** Categories: ~20 header rows with no parsed
   `town`; ~38 untagged real values (`Night race: no`, season/heat prose); the
   rest combined bullets (`cutoffs/aid/cups` as one line) + long-tail labels. Is
   "omit untagged values, log them, hand-salvage the high-value ones" the right
   call, or is data being lost that a better parser would keep? Is the 92-vs-91
   count reconciled correctly?
5. **Unknown handling (KTD4).** Unknowns are usually `value:"unknown"` under a
   `[scraped]` tag; the generator omits on the value token (incl. leading
   "unknown (…)"). Any way an unknown still slips through as a fact?
6. **Determinism / source-addressability.** The prior audit demanded a
   deterministic, source-addressable generator over byte-equality-between-two-LLM-
   files. Does `build-taste.mjs` meet that bar (every field traces to file+line;
   nothing silently dropped)? Is a golden-fixture + join-check test plan (planned,
   not yet written) the right verification?
7. **Plan soundness for the un-built units.** U2 site render (per-section
   partial-row matrix, page contract, staleness gate), U3 MCP render (bundle JSON
   into the deploy, per-tool projection, absent-file tolerance), U4 deploy/verify.
   Anything unsafe or missing?
8. **Decisions.** Storage = JSON-bundled-into-both; aid-penalty deferred;
   og-image its own unit or parked; runner-note consent gate. Any you'd overturn?

## Known-incomplete — do NOT re-report as defects, but DO assess the plan for them
- Overrides (Burriac Atac runner notes, Burriac Xtrem PDF) not yet merged into
  `taste.json`; consent gate not yet applied.
- Per-field edition/staleness (P0) not yet wired.
- ~20 profiles have `town:null` (header-format misses).
- The 166 exceptions are logged, not yet salvaged.
- Golden-fixture tests + the `(race_url, town)` join-check vs a live `races`
  snapshot not yet written.

## Constraints
Read-only. Don't build/deploy/migrate/push. Honesty-default-unknown; never
fabricate a race attribute. MCP stays public (`verify_jwt:false`). The enrich
pipeline stays dormant.

## Return
A ranked findings list (severity · file/section · concrete failure · suggested
fix) + a verdict: is the generator's output trustworthy enough to base the render
on after the known-incomplete items are finished, or is there a structural
problem to fix first? Prefer a few decisive findings over a long list.
