# Full de Ruta light redesign — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline) or superpowers:subagent-driven-development to implement task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Rebuild the homepage and race page in the Full de Ruta light design system and ship them to production on trailraces.cat, in one atomic cutover.

**Architecture:** One feature branch off `main`, built in an isolated git worktree (other sessions share the main checkout). New pure module `app/lib/semantics.js` (tested) carries every design-semantic decision; small `app/components/fdr/` primitives compose both pages; the two pages are rebuilt against the briefs' tier ladders; peripheral pages (about, for-agents, og-image, layout) retheme last so the site never ships half-dark. Deploy = merge to `main` (Vercel auto-deploys) only after Dima approves the branch's Vercel preview — the preview on real data IS the "lightweight review pack".

**Tech stack:** Next.js 16 (app router, ISR), React 19, plain CSS custom properties (no Tailwind usage in these files today — keep it that way), `next/font/google` for Anton / Work Sans / JetBrains Mono, `node --test` for pure modules.

**Decision sources (in rank order):** `outputs/2026-08-24_design-decision-log_v1.md` → the two briefs (with their Corrections blocks) → wireframes/mockups in `outputs/`. Where this plan and the log disagree, the log wins.

**Locked decisions this plan implements:** light board · difficulty ramp **A (current equal-lightness tokens)** — Q4 test pending, all colours flow from `semantics.js` so a Ramp-B swap is a one-file change · drive colour = green ≤60 min only, ink for the rest · verdict = editorial-or-nothing (three-state design; generated state deliberately not built in v1) · distances enumerate · kids run is a row · sold-out/cancelled = ribbon on race page, typographic at list level · neutral AI buttons · no picks before input; after input one "Closest match to your filters" block · "Next two weekends" horizon block · silhouettes NOT on list rows (DistanceLadder instead; no ElevationProfile in v1 at all — no GPX data exists).

**Hard invariants (breaking any = failed task):**
- The full race list stays server-rendered HTML (no `useSearchParams` in the render path — see the comment in `RaceList.jsx`).
- Shareable filter URLs stay back-compatible (`?drive=u60&dist=10-15,15-21&prov=GIRONA…`).
- `generateMetadata`, JSON-LD, `revalidate = 86400`, `dynamicParams = false`, and the GSC verification meta in `app/layout.js` all survive.
- Honesty rules: provenance labels on interpreted claims, absence renders as absence, expected dates never look confirmed.
- Existing tests keep passing: `node --test app/lib/` (4 suites) — deno/MCP tests untouched by this plan.

---

## Task 0: Worktree, branch, baseline

**Files:** none (setup)

- [ ] **Step 1: Create worktree + branch off main**
```bash
cd /Users/dima/Claude/Trails/trail-catalunya
git fetch origin
git worktree add ../trail-catalunya-fdr -b feat/fdr-light-redesign origin/main
cd ../trail-catalunya-fdr && npm install
```
- [ ] **Step 2: Baseline green**
```bash
node --test app/lib/ && npm run build
```
Expected: all tests pass, build succeeds. If baseline is red, STOP and report — do not fix unrelated breakage inside this plan.
- [ ] **Step 3: Copy this plan + decision log into the worktree and commit**
```bash
cp ../trail-catalunya/docs/plans/2026-08-24-fdr-light-redesign.md docs/plans/
cp ../trail-catalunya/outputs/2026-08-24_design-decision-log_v1.md outputs/
git add docs/plans/2026-08-24-fdr-light-redesign.md outputs/2026-08-24_design-decision-log_v1.md
git commit -m "docs(design): FdR redesign plan + decision log"
```

## Task 1: `app/lib/semantics.js` — the design-semantic module (TDD)

**Files:** Create `app/lib/semantics.js` · Create `app/lib/semantics.test.mjs`

Single home for every "what does this data mean visually" rule. Pure, no React.

- [ ] **Step 1: Write the failing tests**
```js
// app/lib/semantics.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  difficultyToken, driveBand, DRIVE_INK, enumerateDistances, verdictFor, LEVELS,
} from './semantics.js'

test('difficultyToken maps all six levels + unrated', () => {
  assert.equal(difficultyToken('Easy').bg, '#ADE3BF')
  assert.equal(difficultyToken('Brutal').ink, '#F3E2E1')
  assert.equal(difficultyToken(null).bg, '#F1F4F6')       // unrated: sunk, never a hue
  assert.equal(difficultyToken('nonsense').bg, '#F1F4F6')
})
test('driveBand: green only under 60, ink scale after', () => {
  assert.equal(driveBand(45), 'near')
  assert.equal(driveBand(60), 'near')
  assert.equal(driveBand(61), 'mid')
  assert.equal(driveBand(120), 'mid')
  assert.equal(driveBand(121), 'far')
  assert.equal(driveBand(null), null)
  assert.equal(DRIVE_INK.near, '#04884D')
})
test('enumerateDistances sorts, dedupes, enumerates — never a range', () => {
  assert.equal(enumerateDistances([{ km: 42 }, { km: 5 }, { km: 21 }, { km: 21 }]), '5 · 21 · 42 km')
  assert.equal(enumerateDistances([{ km: 11.5 }]), '11.5 km')
  assert.equal(enumerateDistances([]), null)
})
test('verdictFor: editorial when the taste layer has one, null otherwise (no generated prose)', () => {
  const race = { taste: { editorial: [{ key: 'unique', value: 'The benchmark 100k', strengthLabel: 'Our read' }] } }
  assert.deepEqual(verdictFor(race), { text: 'The benchmark 100k', label: 'Our read' })
  assert.equal(verdictFor({ taste: { editorial: [] } }), null)
  assert.equal(verdictFor({}), null)
})
```
- [ ] **Step 2: Run to verify failure**
```bash
node --test app/lib/semantics.test.mjs
```
Expected: FAIL (module not found).
- [ ] **Step 3: Implement**
```js
// app/lib/semantics.js
// Full de Ruta semantics for the site. One hue, one meaning:
// difficulty owns the ramp; green appears once more as the celebrated
// <=60min drive band; everything else is ink. Ramp A (equal-lightness
// pastels) per decision log Q4 — a Ramp-B swap only touches LEVELS here.

export const LEVELS = {
  Easy:        { bg: '#ADE3BF', ink: '#103C28' },
  Moderate:    { bg: '#DFD69D', ink: '#3F380E' },
  Hard:        { bg: '#F9CAA2', ink: '#593215' },
  'Very hard': { bg: '#FFC2BC', ink: '#662F2C' },
  Extreme:     { bg: '#B04A44', ink: '#FDF3F2' },
  Brutal:      { bg: '#4F1F1E', ink: '#F3E2E1' },
}
const UNRATED = { bg: '#F1F4F6', ink: '#5F6469' }
export const LEVEL_ORDER = Object.keys(LEVELS)

export function difficultyToken(levelWord) {
  return LEVELS[levelWord] || UNRATED
}

// Drive: green celebrates "within the radius" (Dima's own 1-hour rule);
// longer is not bad, just quieter — never amber (amber means Hard).
export const DRIVE_INK = { near: '#04884D', mid: '#5F6469', far: '#A1A5A9' }
export function driveBand(minutes) {
  if (minutes == null) return null
  if (minutes <= 60) return 'near'
  if (minutes <= 120) return 'mid'
  return 'far'
}

// "5 · 21 · 42 km" — the menu it actually is. Never a range.
export function enumerateDistances(distances) {
  if (!distances || distances.length === 0) return null
  const kms = [...new Set(distances.map(d => d.km))].sort((a, b) => a - b)
  return `${kms.join(' · ')} km`
}

// Verdict three-state design; v1 ships states 1 and 3 only:
// editorial verdict (taste layer) or NOTHING. No templated prose —
// the factual signals already live in the gate/card line.
export function verdictFor(race) {
  const item = race?.taste?.editorial?.find(e => e.key === 'unique')
  if (!item || !item.value) return null
  return { text: item.value, label: item.strengthLabel || 'Our read' }
}
```
- [ ] **Step 4: Run tests — pass**
```bash
node --test app/lib/semantics.test.mjs && node --test app/lib/
```
- [ ] **Step 5: Commit** `git commit -am "feat(design): semantics module — FdR colour/drive/verdict rules (tested)"`

## Task 2: Tokens + fonts foundation

**Files:** Create `app/fdr.css` · Modify `app/layout.js` (add fonts + stylesheet import ONLY — body stays dark until Task 6 cutover)

- [ ] **Step 1: Create `app/fdr.css`** — the FdR custom properties (structure colours from the design system: canvas `#F9FAFC`, surface `#FFF`, sunk `#F1F4F6`, border `#DBDEE2`, border-strong `#CACED3`, ink `#20252A`, ink-muted `#5F6469`, ink-faint `#A1A5A9`, action `#2D6FCD`, action-hover `#0555B7`, wash `#D6E9FF`, danger `#AC3031`, night `#98E4E8`/`#003F4B`) plus radius (4/8/999), spacing steps, and three font-family vars wired to the next/font variables. Utility classes: `.fdr-label` (mono caps 11px), `.fdr-mono` (tabular), `.fdr-card` (surface + hairline + 4px radius), focus-visible outline rule.
- [ ] **Step 2: Fonts in `app/layout.js`** via `next/font/google`:
```js
import { Anton, Work_Sans, JetBrains_Mono } from 'next/font/google'
const anton = Anton({ weight: '400', subsets: ['latin'], variable: '--font-poster' })
const workSans = Work_Sans({ subsets: ['latin'], variable: '--font-sans' })
const jbMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })
// <body className={`${anton.variable} ${workSans.variable} ${jbMono.variable}`}>
```
Import `./fdr.css`. Do NOT change body colours yet. Verify the GSC meta tag is untouched.
- [ ] **Step 3: Verify** `npm run build` green; dev server renders old pages unchanged.
- [ ] **Step 4: Commit** `git commit -am "feat(design): FdR tokens + Anton/Work Sans/JetBrains Mono foundation"`

## Task 3: FdR primitives

**Files:** Create `app/components/fdr/DifficultyChip.jsx`, `DifficultyScale.jsx`, `DistanceLadder.jsx`, `StatusRibbon.jsx`, `Provenance.jsx`

All presentational, props-in, no data fetching. Colour always from `semantics.js`. Rules baked in:
- **DifficultyChip** `{ level, effort, size }` — word + km-effort number together, `aria-label={`Difficulty: ${level}, ${effort} km-effort`}`. Unrated renders the word "Unrated" on sunk — never colour-only, never hidden labels (no `showLabel` prop exists, by design).
- **DifficultyScale** `{ level }` — six equal segments, filled up to the level's position (position carries rank), tick words underneath at 9px, `role="img"` + aria-label. This is the race-page centrepiece.
- **DistanceLadder** `{ distances, maxKm }` — one 8px bar per startable distance, width `km / maxKm`, fill = that distance's own level token (via `difficultyLevel(kmEffort(d))` from `format.js`), mono caption per bar (`21 km · ↑1450 m · Moderate`), missing D+ → sunk fill + "D+ not published".
- **StatusRibbon** `{ kind: 'sold-out' | 'cancelled', detail }` — full-width, typographic (dark ink bg, inverse text — no hue), renders nothing when kind is null.
- **Provenance** `{ label }` — 10px mono-caps ink-faint tag ("Organizer" / "Our read" / …).

- [ ] **Step 1: Implement the five components** (each ≤ 60 lines, inline styles + fdr.css vars).
- [ ] **Step 2: Verify** — temporary render check on the dev server or a scratch route; then `npm run build`.
- [ ] **Step 3: Commit** `git commit -am "feat(design): FdR primitives — chip, scale, ladder, ribbon, provenance"`

## Task 4: Race page rebuild

**Files:** Rewrite the JSX/styles of `app/race/[slug]/page.js` (keep: `generateStaticParams`, `generateMetadata`, `eventJsonLd`, `relatedRaces`, the build-time memo, `revalidate`, `dynamicParams`)

Tier ladder, exactly per the race-card brief + Corrections:

1. **StatusRibbon** — `race.soldOut` → "Sold out — check the official site for remaining distances" (event-level flag is all the data has; per-distance availability is not invented). `race.enrichment?.confirmed_status?.value === 'cancelled'` → cancelled ribbon.
2. **Identity:** race name (Work Sans 700 28px — Anton reserved for the site wordmark), then `verdictFor(race)` → one sentence + Provenance tag, or nothing.
3. **Difficulty module:** DifficultyChip (level word + event km-effort) + DifficultyScale + secondary line `{maxEff} km-effort · {climbDensity} m/km climb` + one-line method + `<details>`How we measure`</details>` holding the current ITRA paragraph. Unrated races: "Difficulty unrated — D+ not published" on sunk, no scale.
4. **Gate cluster:** 3-cell hairline-divided strip (MetricRow pattern): DRIVE (`formatDrive`, coloured by `DRIVE_INK[driveBand(m)]`, em dash when null, "from Plaça Glòries (estimated)" footnote) · WHEN (`displayDate` or "Expected {month} — not confirmed" in ink-muted, or "Date TBD") · DISTANCES (`enumerateDistances` + " + kids run" when `race.kidsRun`).
5. **Act zone:** primary action-blue "Official site & registration ↗"; below it two neutral secondary buttons "Ask Claude" / "Ask ChatGPT" (existing `claudeUrl(prompt)`/`chatgptUrl(prompt)` — restyle only) + one example-question hint line + THE single disclaimer ("Dates, start times and registration change — confirm on the official site."). Delete the per-section disclaimers elsewhere.
6. **Distances table:** per row — km (+variantName), ↑D+ (dash when null), effort + level word pill, price when any. Kids run appended as a real row: "Kids run · distance TBC". `DistanceLadder` above the table as the visual.
7. **About & Character:** taste editorial items (skip `unique` — already the verdict) under "Our take"; character grid with Provenance per item; the existing labels-legend line survives. Enrichment facts block: keep the existing guarded slot, restyled.
8. **Related + footer:** keep logic; restyle rows light; when sold out, retitle "Still-open alternatives".

- [ ] **Step 1: Rebuild the page** against the structure above, all colours/tokens from `semantics.js`/`fdr.css`.
- [ ] **Step 2: Verify states on the dev server** — `/race/cursa-popular-d-amer` (sparse), `/race/ultra-pirineu` (rich + taste), one expected-month race, one unrated (no D+) race. 390px and desktop. Page source: JSON-LD present, race name in SSR HTML.
- [ ] **Step 3: Run tests + build** `node --test app/lib/ && npm run build`
- [ ] **Step 4: Commit** `git commit -am "feat(race-page): FdR rebuild — ribbon/verdict/difficulty/gate/act tier ladder"`

## Task 5: Homepage rebuild

**Files:** Modify `app/lib/filters.js` + `app/lib/filters.test.mjs` · Modify `app/components/FilterBar.jsx`, `RaceCard.jsx`, `RaceList.jsx`, `AskAI.jsx`

**5a — difficulty filter (TDD):**
- [ ] Add to `filters.js`: `DIFFICULTY_VALUES = ['easy', 'moderate', 'hard', 'vh+']`, `difficulty: []` in `DEFAULT_FILTERS`, `dif` URL param in `filtersFromParams`/`filtersToParams`, and:
```js
// Event-scope difficulty (max km-effort), mirroring the MCP's event_max scope.
// 'vh+' = Very hard, Extreme and Brutal. Unrated races match only when the
// difficulty filter is empty — an unknown never satisfies a positive claim.
export function matchesDifficulty(race, selected, eventLevelWord) {
  if (!selected || selected.length === 0) return true
  if (eventLevelWord == null) return false
  const slug = { Easy: 'easy', Moderate: 'moderate', Hard: 'hard' }[eventLevelWord] || 'vh+'
  return selected.includes(slug)
}
```
  Tests first in `filters.test.mjs` (empty→true, unrated+active→false, each band, `vh+` covers three words, URL round-trip with `dif=hard,vh+`). Run failing → implement → pass.
- [ ] **5b — FilterBar:** new DIFFICULTY row of colour+word chips (token bg when active, word always) placed where ELEVATION was; ELEVATION moves into the existing MORE row (with kids/TBD/past). Everything else unchanged.
- [ ] **5c — RaceCard V2 (tiered):** rows — (1) name + sold-out chip … date (mono, right); (2) town + province chip … drive (fixed-width right column, `DRIVE_INK[driveBand]`, bold when 'near'); (3) signal line: `{LEVEL WORD coloured} · {enumerateDistances} · up to {maxElevation} D+` (word "UNRATED" ink-faint when null); (4) taste one-liner via `verdictFor(race)` when present, 1-line clamp, quiet. Distance chips deleted.
- [ ] **5d — RaceList:** light-board Header with H1 "Find the race that fits" + promise line ("{n} trail races in Catalunya — drive times from Barcelona, honest difficulty, and AI that knows them all."); **horizon block** "Next two weekends" above the month groups — dated races where `today <= date <= today+13`, sorted by date then drive, rendered as normal RaceCards under a labelled header (deterministic orientation, not a pick; hidden when any filter is active); **closest-match block** — when ≥1 filter is active and results exist, the top match (rank: drive asc, nulls last, tie → earlier date) renders once in an action-wash framed card labelled "★ Closest match to your filters" + why-line (`verdictFor` text or the signal line) — the SSR-safety pattern (defaults first, params after mount) is untouched; wire `matchesDifficulty(race, filters.difficulty, difficultyLevel(eventKmEffort(race.distances)))`.
- [ ] **5e — AskAI:** restyle to neutral secondary buttons + retitle the row "Or just say it —" with one example query; logic unchanged.
- [ ] **Verify:** dev server — cold page, `?dif=hard,vh+&drive=u60`, legacy URL `?drive=u60&dist=10-15,15-21`, empty-state, 390px scan test (drive/difficulty/distance comparable without opening cards). `node --test app/lib/ && npm run build`.
- [ ] **Commit** `git commit -am "feat(homepage): FdR rebuild — difficulty filter, V2 cards, horizon + closest-match blocks"`

## Task 6: Peripheral cutover (the site goes light in one commit)

**Files:** Modify `app/layout.js` (body → canvas/ink), `app/globals.css`, `app/about/page.js`, `app/for-agents/page.js`, `app/opengraph-image.js`

- [ ] Body background → `#F9FAFC`, text → `#20252A`; sweep `about` and `for-agents` inline styles dark→token equivalents (mechanical; content untouched); og-image light board (canvas bg, ink text, keep dimensions); confirm GSC meta + Vercel Analytics intact.
- [ ] **Verify every route** on the dev server: `/`, `/race/ultra-pirineu`, `/about`, `/for-agents`. No dark remnants (`grep -rn "#0a0a14\|#12122a\|#1a1a2e" app/` returns only files deliberately deleted/replaced — expect zero hits).
- [ ] `npm run build` · **Commit** `git commit -am "feat(design): light-board cutover — layout, about, for-agents, og-image"`

## Task 7: Acceptance pass (the gates from the decision log)

- [ ] `node --test app/lib/` — all green. `npm run build` — green.
- [ ] Browser pass, 390px + desktop, screenshots for Dima: cold homepage · filtered with closest-match · race page sparse (Amer) · race page rich (Ultra Pirineu) · sold-out state · expected-date race · about.
- [ ] Gates: one drive boundary set everywhere (60/120) · no colour-only state · every control has a name · SSR list in page source (`curl -s localhost:3000 | grep -c "race/"` > 100) · legacy filter URLs work · expected dates unambiguous · sparse races look intentional.
- [ ] Fix anything failing; re-run; commit fixes individually.

## Task 8: Preview → approval → production

- [ ] **Push the branch** `git push -u origin feat/fdr-light-redesign` → Vercel builds a preview URL.
- [ ] **Hand Dima the preview URL + the Task-7 screenshots.** This preview on real production data is the lightweight review pack. **HARD GATE: no merge without Dima's explicit go.**
- [ ] On approval: update `AGENTS.md` Deployment state (site redesign shipped, dark skin retired) in the same branch, merge to `main`, push. Vercel auto-deploys production.
- [ ] **Verify production:** trailraces.cat renders light, race pages fine, `site:` JSON-LD intact. Report done with screenshots.
- [ ] Post-ship (separate, optional): sync learnings back to the Claude Design system project; Q4 ramp decision when Dima rules; route-sheet prototype.

---

## Self-review notes
- Spec coverage: ribbon/verdict/difficulty/gate/act/distances/about/related (race brief §4–5) → Task 4; three-state verdict (Corrections 2) → Task 1 `verdictFor` (state 2 deliberately absent); difficulty-as-filter, V2 card, horizon, closest-match, promise line, neutral AI (homepage brief + log Q3/Q5/Q6/Q7/Q8) → Task 5; light cutover + D3 checklist → Task 6; gates → Task 7; per-distance sold-out is NOT in the site dataset — ribbon uses the event flag and says so honestly (documented deviation from brief §5.1's ideal).
- Night flag: not in the site's race shape (MCP-only today) — omitted from cards; noted for a later data pass, not invented.
- ElevationProfile/CatalogueField: excluded (no GPX/scatter data wiring in v1) — DistanceLadder covers the visual slot, per log Q5.
