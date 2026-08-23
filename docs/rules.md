# Race-card quality rules — the ledger

**This file is the single place a rule about card quality lands.** Every other
document defers to it. If a rule lives only in a commit message, a plan, or a
chat reply, it does not exist and will be re-litigated.

Created 2026-08-23, after an outside audit found that this project qualifies
under the workspace's evolving-rules contract (`~/Claude/CLAUDE.md`, "Projects
whose rules evolve through conversation") and had none of the four required
artifacts. Open commitments live in `docs/open-loops.md`.

## Agent write obligation (non-negotiable)

**Any verdict Dima states in conversation gets written here before the session
ends, verbatim, with the date.** He talks; he does not edit markdown. A rule he
stated and no agent recorded is a rule that will be broken next month. Do not
paraphrase his wording into something tidier — the phrasing carries the intent.

Status values: `live` (in force) · `proposed` (awaiting his verdict) ·
`falsified` (tried, wrong, kept so it is not retried).

## Lens

Two lenses read this catalogue with opposing objectives and both are correct:

- **`lens: completeness`** — maximise how many cards carry usable facts. Wants
  to fill gaps, infer, extrapolate from prior editions.
- **`lens: honesty`** — maximise how much of what we publish is true and
  correctly attributed. Will delete work completeness just produced.

Every rule below is stamped with the lens that produced it. An unstamped
contradiction is unreadable; a stamped one is a decision. Contradictions go to
`## Tensions`, they are not silently resolved by whichever agent ran last.

---

## Rules

### R1 — Discrete options render as a list, never a range
`lens: honesty` · `status: live` · added 2026-08-23

A range (`18–25 km`) asserts that intermediate values exist. Where the values
are discrete and enumerable — distances, elevations — join them with commas:
`18, 25 km`. Applies to any surface: card, race page, `<title>`, MCP payload.

> Dima, 2026-08-23: *"let's mention distances using comma not -, because there
> is nothing in between"*

Evidence: `/race/trail-de-monells` rendered `18–25 km` for an event offering
exactly 18 km and 25 km.

### R2 — Never pair a range endpoint with an unrelated maximum
`lens: honesty` · `status: live` · added 2026-08-23

Ultra Pirineu's page title read `5–100 km / 6600 m D+` — the full distance
spread beside the single hardest climb, describing a 5 km race with 6600 m of
ascent. Aggregates from different distances must not be juxtaposed as if they
describe one variant.

### R3 — A number we display must describe something possible
`lens: honesty` · `status: live` · added 2026-08-23

Before publishing a computed figure, it must survive a plausibility check
against the real world. Vall de Núria shows `3h 45m` drive time in 40px type;
the valley has no road access at all (rack railway from Ribes de Freser only,
confirmed against the operator's own access page). Confident typography on an
impossible number is worse than showing nothing.

### R4 — Ambiguous place names are verified against province before use
`lens: honesty` · `status: live` · added 2026-08-23

`La Cambrils-Odèn` (`province=LLEIDA`, in the Solsonès) resolved to the
Tarragona coastal Cambrils, yielding a confident and wrong 97 min. Any
geocode or drive time for a town whose name also names a better-known place
must be checked against the race's province before it is cached.

### R5 — Our inference never wears the organizer's badge
`lens: honesty` · `status: live` · added 2026-08-23 (pre-existing, now written down)

Every published claim carries a `claim_strength`. `organizer` / `organizer_pdf`
mean scraped from the race's own material. `our_read` / `derived` / `inference`
mean our judgement. A value stamped `organizer` must not contain our inference
in the same string — several currently do (e.g. an Aid field labelled
`[Organizer]` that ends "cup policy not stated → assume bring-your-own flask").

### R6 — Do not publish a predicted future date
`lens: honesty` · `status: live` · added 2026-08-23

Superseding a proposal made and rejected the same day. The rejected version:
show "Next edition expected September 2027" on a finished race, labelled as our
inference. The audit's objection stands — labelling communicates uncertainty but
does not license assuming annual recurrence or a stable month, and an irregular
or discontinued event would still carry a fabricated date-like claim.

**In force:** show "Next edition not announced — check official site." A future
month/year appears only from organizer evidence or validated edition history.

### R7 — Both drive-time consumers are updated together
`lens: completeness` · `status: live` · added 2026-08-23

Drive times and coordinates have two independent consumers: the site reads
`data/towns-drive-times.json` + `data/towns-geocoded.json` at build; the MCP
reads the `towns` table. The site→towns migration is deliberately deferred. A
change that updates one and not the other is a defect, not a partial fix.

### R8 — Grouping logic exists twice and must stay in parity
`lens: honesty` · `status: live` · added 2026-08-23

`app/lib/races.js` and `supabase/functions/mcp/grouping.ts` both group rows into
events by `(race_url, town)` and both derive the event name from the first
non-kids row. Any change to naming, identity, or date derivation must land in
both, with mirrored tests — otherwise the same race gets different names, IDs
and dates depending on the surface. This repo already applies this discipline to
`difficulty.ts` ↔ `format.js` and `taste_view.ts` ↔ `taste.js`.

### R9 — A published URL never silently moves
`lens: honesty` · `status: live` · added 2026-08-23

Event slugs derive from the event name, so any naming-rule change moves URLs.
Every changed slug needs a permanent redirect from the old path. Currently slugs
are also *order-dependent* (no `ORDER BY` in the fetch), meaning a URL can move
between two builds of identical data — that is the defect R9 exists to close.

### R10 — Sizing claims name their population and its overlap
`lens: honesty` · `status: live` · added 2026-08-23

Earned twice in one day, the same way both times. `819 rows` counted 402
`REMOVED` rows the site never renders (true active: 412). `199 towns − 113 cache
keys = 86 to geocode` assumed the cache was a subset of active towns; only 23
overlap, so the real backlog is 176 — double the figure a decision was then
made on.

**Never subtract the sizes of two populations. Compute the set difference.**
Any count asserted about "the catalogue" states its filter
(`source='ultrescatalunya' AND status NOT IN ('REMOVED','SUSPESA')`), and any
count of "what's missing" is an intersection, not a subtraction.

### R11 — Every gap reports itself
`lens: completeness` · `status: live` · added 2026-08-23

A missing value must produce a signal, not a silent null. `towns-missing-drive-
times.json` existed precisely to report this class, was last written 25 April,
lists one town while eleven are missing, and let 176 ungeocoded towns accumulate
unnoticed for four months. A stale gap-report is worse than none: it asserts the
gap is small. Gap reports are regenerated as output, or deleted.

---

## Tensions

### T1 — Coverage vs. honesty on unknown facts
`completeness` wants a card to say something; `honesty` wants silence over a
guess. **Resolution in context:** silence wins for anything a user would act on
(dates, prices, cutoffs, registration status). Inference is allowed for
character and framing, where it is labelled and no plan depends on it. R6 is
this tension resolved for future dates; R5 is it resolved for attribution.

### T2 — Prior-edition data vs. staleness
`completeness` wants last year's facts on this year's card; `honesty` notes 13
events currently quote distances from an older edition in prose sitting directly
above a table of this year's actual distances. **Resolution in context:**
prior-edition facts are publishable only when the field is evergreen (setting,
tradition, terrain) — never for anything edition-specific. This is why the taste
layer's Slice 1 ships character and defers operational facts. The root fix is a
series/edition model, which is not yet built.

---

## Open decisions (awaiting Dima's verdict)

- **D1 — roadless towns.** R3 requires a non-numeric state for places like Vall
  de Núria, but the JSON cache and the `towns.drive_minutes_from_barcelona`
  integer column both represent "unknown" and "no road exists" as `null`. A
  shared `minutes | no_road_access | unknown` contract probably needs a schema
  change; a cheaper cut keeps the access state in the site's JSON and lets the
  MCP keep returning null until Slice 2. Not yet decided.
- **D2 — canonical event names.** The longest-distance heuristic resolves all 3
  live sub-race-first cases correctly (Olla de Núria, Espintrail, Volta a la
  Maria) but distance is not proof of brand hierarchy. Proposed: heuristic as
  default plus an explicit override registry for the 6 mixed-name events.
