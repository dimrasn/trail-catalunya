# Design decision log — Full de Ruta + two product pages

2026-08-24 · v1 · Owner: Dima · Records the disposition of the external Design Director review (received 2026-08-24) against our positions. This file is the canonical decision record the reviewer's "next assignment" asks for; cite it in the review pack.

## Dispositions on Q1–Q9

| Q | Reviewer's call | Disposition | Notes |
|---|---|---|---|
| Q1 identity | Colour discipline ≠ identity; make the name literal with a saveable/printable route sheet per race | **Adopted** | The route-sheet behaviour is the identity bet; no logo exercise. |
| Q2 light board | Light-first; document v1 as intentionally light-only; dark is a later, separately-tested palette (not an OKLCH flip) | **Adopted** | Readme's "derive dark by flipping lightness" note to be corrected when recorded. |
| Q3 drive colour | Green for ≤60 min only; 61–120/120+ down the ink scale; one canonical boundary set (60/120) everywhere | **Adopted** | Kills the 45/90 variants in FilterPanel + Hero. Matches `--fdr-color-drive-near`. |
| Q4 pastel ramp | Add modest ordinal lightness progression across Easy→Very hard | **Test, then decide** (Dima 2026-08-24) | Both ramps built; greyscale + contrast evidence page: `2026-08-24_difficulty-ramp-test_v1.html`. Position cue + word stay mandatory either way. |
| Q5 silhouettes | Not on every list row — race page, closest-match and expanded state only; ladder is the list default; never condition on difficulty | **Adopted** | The difficulty-conditioned variant we floated is dead — it biased visual status toward hard races. |
| Q6 finder spine | Chronology stays the inventory spine; add a deterministic "Next two weekends" horizon block; closest-match block after input | **Adopted** | Horizon block is orientation, not recommendation — compatible with no-picks-before-input. Expected-month races cannot appear in a weekend horizon (no date). |
| Q7 verdict line | No universal verdict. Three states: editorial verdict / high-confidence generated / factual signal line | **Adopted** (reverses our earlier recommendation; resolves race-card brief open decision D1) | Sparse state is a first-class composition, not a sentence-shaped placeholder. |
| Q8 AI buttons | Neutral styling; provider name (+ optional monochrome mark); sell the contextual promise, not the brand | **Adopted** | Consistent with the `thirdPartyColour` ruling already in semantics.json. |
| Q9 emotion | Silhouette + one human sentence + place/date + a route sheet worth saving; target feeling "I can picture doing this" | **Adopted** | To be written into the readme as a choice, per round-1 challenge E2. |

## Process rulings (Dima, 2026-08-24)

1. **Next phase = lightweight pack.** Acceptance gates 2–9 from the reviewer adopted wholesale. Packaging collapsed: ONE self-contained HTML pack containing (a) mobile-first finder proof at 390px with a real 30–50-race month (cold/filtered/cleared), (b) mobile-first race-page proof (sparse/rich/partial-sold-out/cancelled/expected-date), (c) desktop variants, (d) the six product recipes with sparse/error/status states, (e) semantic colour sheet with contrast verification, (f) this decision log. Every artifact embedded or web-accessible — no local paths, per reviewer gate 1.
2. **The freeze applies to the redesign surfaces only.** Live-site fixes and data/MCP work keep shipping; no product implementation *of the two redesigned pages* until the pack is reviewed.
3. **Contract-sync rule adopted:** any change to tokens, semantics, components or screens updates `semantics.json` + readme in the same edit, or the change is unfinished.

## Standing kit fixes (unchanged from review round 2, now ordered by the reviewer's re-rank)

1. Freeze a named design-system snapshot before further design work.
2. Kit truth + accessibility: labels on the difficulty selector (no colour-only controls), remove fictional taste filters, restore month/province/TBD/past/AI, one drive boundary set.
3. Mobile IA proof (the pack's core).
4. Six product recipes.
5. Route-sheet prototype (identity bet).
6. Dark mode: record "light-only v1" now, revisit after primary acceptance.

## Cover note owed back to the reviewer (their requested format)

1. **What changed because of this review:** verdict-for-all dropped in favour of three states; silhouette demoted from list rows; "next two weekends" horizon adopted; sequencing/freeze named top risk; pack format adopted (lightweight).
2. **Where we intentionally disagreed:** Q4 goes to a greyscale + contrast test rather than direct adoption (the equal-lightness pastels are the system's stated signature; we convert the taste dispute into a measurement); the frozen-pack process is collapsed to one self-contained HTML pack, and the implementation freeze is scoped to the redesign surfaces only.
3. **What remains unproven:** the 390px scan test at production density; the Q4 ramp choice; whether the route sheet earns its identity bet.
