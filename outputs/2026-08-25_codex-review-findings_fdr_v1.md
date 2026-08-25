# FdR light redesign - pre-production review

Date: 2026-08-25  
Branch: `feat/fdr-light-redesign`  
Reviewed range: `ea240283e59ba5b6cb35a31664b0d7117626385a..1101c575d70bb674285e26a4bae48a7883815b72`  
Scope: 50 changed files; 1,551 executable lines  
Mode: report only; no fixes applied

## Verdict

Not ready. Merge is blocked by two P1 findings: the redesigned cards can overstate event elevation when the source data is incomplete, and the MCP schema silently removes three supported search filters from schema-driven clients.

The visual direction is approved. The light editorial system is coherent, the card hierarchy scans well, and both rich and sparse race pages feel intentional on desktop and mobile. This needs a focused integrity pass, not a redesign rethink.

## P1 - blockers

### 1. Cards republish a partial climb as the event maximum

Location: `app/components/RaceCard.jsx:89` and `app/components/RaceCard.jsx:155`

`RaceCard` calculates the label with `maxElevation(race.distances)`, which ignores missing climb values, then presents the result as `up to X D+`. That converts the largest known figure into an event-wide maximum even when a longer distance has no published climb. Five current events have partial elevation data; the built site reproduces the problem on Tomb al poble vell de Puigcercos, shown as `7 / 15 km / up to 509 D+` although the 7 km climb is unknown.

Impact: this is a data-honesty regression and violates `docs/rules.md` R14. It can make a race look easier than the evidence supports.

Fix: use `completeMaxElevation` for this aggregate. Suppress the climb maximum, or explicitly say the data is incomplete, whenever any advertised distance lacks elevation data. Add a mixed-completeness render test.

### 2. `search_races` drops three advertised filters from its public schema

Location: `supabase/functions/mcp/tools.ts:232`

The tool description and handler support `province`, `dist_ranges`, and `elev_ranges`, but `inputSchema.properties` declares none of them. `origin/main` exposed these properties. Schema-driven clients therefore cannot discover or reliably call capabilities the implementation still advertises and reads.

Impact: this is a breaking MCP contract regression, including for agents that build calls from `tools/list`.

Fix: restore all three properties to the public schema and add a regression test against the serialized `search_races` schema.

## P2 - should fix before shipping

### 3. Difficulty disappears from the AI prompt

Location: `app/components/askPrompt.js:40`

`activeFilterPhrases` never reads `filters.difficulty`. With difficulty as the only active filter, the generated prompt says no filters were set; with mixed filters, it silently omits difficulty.

Fix: add the difficulty phrase and label to the prompt builder, with difficulty-only and mixed-filter tests.

### 4. "Next two weekends" is a rolling 14-day window

Location: `app/components/RaceList.jsx:187`

The implementation selects today through today + 13 days, including weekdays. On a Sunday this spans parts of three calendar weekends, so the visible label does not describe the result set.

Fix: compute the next two weekend windows. If the rolling horizon is intentional, relabel it `Next 14 days`; my recommendation is to honor the agreed weekend promise.

### 5. The closest match renders twice

Location: `app/components/RaceList.jsx:246`

The selected closest race appears in the highlighted `ClosestMatch` block and remains in the grouped calendar. Browser reproduction on `/?drive=u60&dif=hard%2Cvh%2B` showed `/race/la-pota-roja` twice.

Fix: remove `closest.id` from the grouped result after promoting it, then cover the renders-once invariant with a component test.

### 6. The faint text token is too faint for meaningful small copy

Location: `app/fdr.css:12`

`--fdr-ink-faint: #A1A5A9` measures 2.48:1 on white and 2.37:1 on the canvas. It is used for meaningful 9.5-12.5 px content, including warnings, status fallback, counts, provenance, and difficulty labels. That is below the 4.5:1 WCAG AA threshold for normal text ([WCAG 2.2 contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)).

Fix: reserve `ink-faint` for decorative content. Use `ink-muted` for semantic small copy, or introduce a subtle text token around `#70757A` or darker and recheck both backgrounds.

### 7. Known expected-month mismatches inflate the TBD count

Location: `supabase/functions/mcp/filters_core.ts:76`

An undated race with `expectedMonth` only returns early when the month matches. A known mismatch falls through to `tbdExcluded++`, so the count includes more than fully undated/TBD races. A November query with one expected-October race and one genuinely TBD race returns a count of two.

Impact: the tool response contradicts its public explanation of the count and can mislead downstream agents.

Fix: increment `tbdExcluded` only for truly undated races. If expected-date exclusions matter, return them as a separate count.

### 8. The branch has no multi-file provenance entry

Location: `what-changed.md:3`

The branch changes 50 files, but `what-changed.md` is unchanged from `origin/main` and documents only the earlier 2026-08-23 multi-select operation. This misses the governing workspace requirement to log multi-file changes.

Fix: append a dated redesign entry naming the affected surfaces and verification performed before merge.

## Requirements completeness

- Light visual system and reusable primitives: met.
- Race-page tier ladder for rich and sparse records: met.
- Homepage finder behavior: partially met; difficulty prompting, weekend semantics, and closest-match deduplication need correction.
- MCP and website filter parity: not met; the MCP schema regression is a blocker, and difficulty remains website-only.
- Production acceptance: partially met; automated baselines and browser smoke tests pass, but the integrity findings above remain.

## Agent-native gap

The website now exposes a difficulty filter, while MCP `search_races` has no equivalent. Because tool results are capped, an agent cannot reliably reconstruct the same result set locally. I would add this immediately after the blocking schema repair, but I am treating it as a follow-up rather than a separate merge blocker.

## Coverage

- `node --test app/lib/*.test.mjs`: 77 passed.
- `deno test --allow-read supabase/functions/ eval/`: 140 passed.
- `npm run build`: passed; 238 pages generated.
- `git diff --check origin/main...HEAD`: passed.
- Browser QA: homepage, filtered finder, rich race page, and sparse race page at desktop and 390 x 844; no console errors or warnings.
- SSR link check: 221 race links present.
- Independent validation: all eight findings reproduced against the branch.
- Review lenses: correctness, API contract, agent-native use, testing, performance, maintainability, project standards, adversarial review, and browser UX.
- Cross-model peer review was not configured; a local adversarial pass was used instead.
- Workspace validator: path, index, and project checks passed. Its overall failure came from unrelated pre-existing overdue learning entries and a missing skill install, not this branch.
- Remaining test gaps: no component coverage for closest-match deduplication or weekend semantics; no schema serialization test; no mixed-elevation card test; no difficulty-prompt test.

## Actionable findings

1. Block merge: make elevation maxima complete-data-only.
2. Block merge: restore the three MCP schema properties.
3. Add difficulty to the AI prompt and tests.
4. Make the two-weekend filter match its label.
5. Render the promoted closest match only once.
6. Raise contrast for meaningful small copy.
7. Count only genuinely TBD races as TBD exclusions.
8. Add the required multi-file provenance entry.

Recommended fix order: 1 -> 2 -> 3/4/5 -> 6/7 -> 8. Re-run the same automated baselines and the filtered mobile finder after the fixes.
