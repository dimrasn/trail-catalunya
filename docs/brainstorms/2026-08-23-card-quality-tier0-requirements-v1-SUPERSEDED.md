> **SUPERSEDED 2026-08-23** by
> `2026-08-23-card-quality-requirements-v2.md`. An outside audit (Codex) found
> six author errors, including a 176-vs-86 sizing error that invalidated a
> decision already taken on it. **Do not work from this file.** It is kept only
> so the corrections are traceable; the v2 document lists each one.

# Race-card quality — Tier 0 requirements

Date: 2026-08-23
Status: approved for planning
Origin: Dima reported two defects on `/race/trail-de-monells` (distance rendered
`18–25 km` as a range; location plain text, no map link; drive time absent
though he measured 1h26m by hand). Investigation found both were symptoms of a
larger class. This document scopes the deterministic remediation (Tier 0) only.

---

## 1. Why this exists

The two reported defects are not content-entry gaps. They are the visible edge
of an enrichment pipeline that has been disconnected from the live data source
since April 2026, plus a formatting bug, plus the absence of any mechanism that
reports gaps when they appear.

**Measured state of the live catalogue** (2026-08-23, `source='ultrescatalunya'`,
`status NOT IN ('REMOVED','SUSPESA')` — the exact filter `app/lib/races.js:238`
applies): **412 rows → 226 events → 199 towns.**

> Note: raw row counts (819 rows / 329 towns) include 402 `REMOVED` and 5
> `SUSPESA` rows that neither the site nor the MCP renders. Any number quoted
> about "the catalogue" must apply the active filter or it overstates the
> backlog by ~2x. This mistake was made once during this investigation.

Completeness across five dimensions (has date · every distance has D+ · has
drive time · has coordinates · has taste): **9 of 226 events are complete on all
five. The median event is missing two.**

### Root cause of the reported defects

`scripts/pipeline.sh` runs `parse-csv.py → geocode-towns.py →
compute-drive-times.py → merge.py`. `geocode-towns.py` reads
`data/races-raw.json` — the April CSV-era snapshot. When the live system moved
to the Supabase `scrape-trails` Edge Function, this pipeline was never rewired.
Consequences, both silent:

- `data/towns-geocoded.json` holds 113 towns against 199 active → **195 of 226
  events have no lat/lng**. `app/race/[slug]/page.js:346` gates the entire
  "Getting there" block (which *already contains* a Google Maps link) on
  `race.lat != null && race.lng != null`, so the block never renders. The
  feature Dima asked for is built and starved of data.
- `data/towns-drive-times.json` holds 347 keys but is missing 11 live towns →
  those cards read "Drive time — not available". Monells is one of the 11.
- `data/towns-missing-drive-times.json`, the file that exists to report this,
  is a 25-April snapshot listing one town (`Lluerts`). It has never been
  regenerated. **Nothing anywhere recorded that 11 towns arrived unenriched.**

The last failure is the important one. Dima found Monells by eye. Tier 0 is not
complete without a mechanism that makes the next gap announce itself.

---

## 2. Scope

Tier 0 covers defects that are **deterministic** — fixable from data already
held, or by reconnecting existing code. It explicitly excludes work requiring
editorial judgment or organizer research; those are scoped separately.

The one exception is item B, where the *data* is deterministic but *acquisition*
is manual by decision (see B).

### Out of scope for Tier 0 (recorded so they are not lost)

- Taste coverage (146 of 226 events have no profile) and the 13 events whose
  taste prose quotes distances absent from their own table (prior-edition bleed).
- 91 events with unknown dates, 33 events with no elevation on any distance,
  403 rows with no price — all require opening organizer pages.
- 18 official-site URLs embedding a year ≤2025, 2 Instagram post permalinks.
- 4 duplicate event pairs and 4 orphaned taste keys.
- Honesty-label defects: values stamped `organizer_fact` that contain our own
  inference in the same string.
- **The series/editions model.** The durable entity is the race, not the
  edition. Deferred deliberately; see G for the interim treatment and §6.

---

## 3. Requirements

### A. Discrete distances render as a list, not a range

`app/lib/format.js:74` `distancesSummary()` returns `min–max`, which asserts a
continuous range where only discrete options exist. `18–25 km` reads as "any
distance between 18 and 25"; the race offers exactly two.

- Comma-join discrete values: `18, 25 km`; `5, 21, 42, 100 km`.
- Bounded: the widest event in the catalogue has 4 distances (Ultra Pirineu),
  so no truncation logic is needed. If a future event exceeds 4, it still
  renders — length is not a correctness concern at this scale.
- `elevationSummary()` (`format.js:83`) has the identical defect (`↑650–1090 m`)
  and receives the same treatment.
- `generateMetadata` pairs the full distance range with the single hardest D+.
  Ultra Pirineu's `<title>` currently reads `5–100 km / 6600 m D+`, which
  describes a 5 km race with 6600 m of climb. Must not pair a range endpoint
  with an unrelated maximum. 8 events have a ≥5× spread and hit this.
- `fmtKm()` (`format.js:69`) has two identical branches
  (`km % 1 === 0 ? String(km) : String(km)`). This is **dead code, not a live
  defect** — `String(11.0)` already yields `"11"`. Delete the dead branch; do
  not treat it as a user-visible bug.

**Verification:** unit tests in `app/lib/format.test.mjs` covering: two discrete
distances, four discrete distances, a single distance, a decimal distance
(`10.6`), and the metadata title for a wide-spread event.

### B. Reconnect geocoding and drive times

Restores 195 map links and 11 drive times.

**Decision (Dima, 2026-08-23): no Google Maps API spend.** ~86 towns is small
enough to source manually; an agent performs the lookups via the browser rather
than the Distance Matrix API. This moves acquisition into the *researchable*
lane while the storage and rendering stay deterministic.

> This is a one-off agent task inside Tier 0, **not** a packaged skill (see §4).
> It is, however, the clearest skill candidate the investigation surfaced: a
> small, per-item, loopable job with a fixed input (town + province) and a fixed
> output (lat/lng + minutes from Glòries). If the steady-state inflow of ~1–2 new
> towns/week justifies it, this becomes the first skill built on top of the
> Tier 0 baseline.

- Origin for all drive times is **Plaça Glòries, Barcelona (41.4036, 2.1868)** —
  the existing convention in `scripts/compute-drive-times.py`, and the value the
  MCP server documents. It must not drift.
- The town list must come from the live Supabase `races` table (active filter),
  never from `data/races-raw.json`.
- Results write to `data/towns-geocoded.json` and `data/towns-drive-times.json`
  (the site's build-time sources) and are backfilled into the `towns` table via
  `scripts/backfill-towns.mjs` (the MCP's source). Both must be updated —
  they are separate consumers, and the site→towns migration stays deferred.
- **Acceptance case:** Monells must land at ≈86 minutes. Dima measured 1h26m by
  hand; a materially different value means the wrong Monells was resolved.
- **Ambiguity guard:** town names that resolve to a better-known place elsewhere
  in Catalunya must be verified against `province`. Known live failure:
  `La Cambrils-Odèn` carries `town='Cambrils', province='LLEIDA'` but the cache
  resolved plain "Cambrils" to the Tarragona coastal town, yielding a confident
  97 min for a race in the Solsonès.
- **Plausibility guard:** a drive time must describe a possible drive.
  `Vall de Núria` currently shows **3h 45m in 40px type**; Núria has no road
  access at all — it is reachable only by the Ribes de Freser rack railway.
  Towns without road access need an explicit representation, not a number.

### C. Location links to a map

- The "Getting there" block at `app/race/[slug]/page.js:346` begins working for
  all geocoded events once B lands. No change needed to it.
- Additionally, the Location line in Key Facts becomes a link, as requested.
- Coordinates are **town centroids, not start lines.** The card must not imply
  otherwise. Actual start coordinates exist only on organizer pages and are
  deferred (§6).

### D. Remove the dead "Race-day facts" block

`app/race/[slug]/page.js:314` renders the `Race-day facts` heading
unconditionally, then falls through to an apology when `race.enrichment` is
absent. `race_enrichment` does not exist in the database (verified:
`to_regclass('public.race_enrichment')` → null), so this fires on **226 of 226
events**. Every page ships a section heading whose only content is a disclaimer.

- Hide the heading when there is no enrichment payload.
- `EnrichmentRow` in `RaceCard.jsx` is dead for the same reason — same treatment.
- **Do not delete the enrichment slot.** The pipeline is built and awaiting
  activation (`AGENTS.md`, "Built but NOT deployed"); this is a render guard,
  not a removal. Lag-tolerance must be preserved.

### E. Deterministic event identity

`app/lib/races.js:117` derives `eventName`, `province` and `status` from
`mainRows[0]`, and the query at `races.js:234` has **no `ORDER BY`**. Event
names, and therefore slugs, are order-dependent and can change between builds —
an SEO defect, since a URL may silently move.

- Add a deterministic `ORDER BY` to the query.
- Derive the event name from the **longest-distance row**. This corrects two
  live cases where an event is named after a sub-race: "Olla de Núria vertical"
  (at `/race/olla-de-nuria-vertical`, for the event containing the 24 km Olla de
  Núria) and "Volta a la Maria La nocturna".
- Ties broken deterministically (e.g. by `race_hash`) so no build can differ.

**Verification:** a test asserting that shuffling input row order produces
identical event name, slug, province and status.

### F. Multi-day events carry an end date

6 events have >1 distinct `date` across their rows and render as single-day.
`parseDateEnd()` only fires on a range *string* (`"15-16/08/2026"`), which these
do not have.

- Derive `dateEnd` from min/max `date` across the event's rows.
- Affected: Ultra Pirineu (rows dated 02/03/04 Oct — a 3-day festival asserted
  as one day), Olla de Núria, Congost Trail Challenge, Trepitja Garrotxa,
  Prades Epic Trail, Volta a la Maria.
- Note `Pyrenees Stage Run` is **not** fixed by this: it is a single row reading
  `240 km / 15000 m` on one date, for an 8-day GR11 stage race. Its own taste
  says "8 Stages, AUG 29–SEP 5" directly below a Key Facts block asserting one
  Saturday. Multi-day *stage races* need a representation Tier 0 does not
  provide — recorded in §6.

### G. Finished races stop inviting registration

17 events are past-dated and still `ACTIVA`. `RaceList.jsx:128` hides them from
the homepage, but their pages render unchanged: a live blue
`Official site & registration ↗` CTA, `eventStatus: EventScheduled` in JSON-LD,
and inclusion in `app/sitemap.js` at `priority: 0.8`. `relatedRaces()` has no
date filter, so live pages link out to finished ones.

Worst live case: **Cursa Muntanya Llagostera Trail** ran 22 Aug. Its taste text
reads "sold out already" and "150 places, 151 registered (full)" directly above
a live registration button.

Treatment, following standard race-directory practice:

1. The page persists — never 404. It is the SEO asset and the landing point for
   someone researching next year.
2. An unambiguous "This edition has finished" marker, above the fold.
3. The registration CTA demotes to a plain official-site link.
4. A forward pointer: "Next edition expected `<month>` `<year+1>`", derived from
   the month the finished edition ran.
5. Dropped from upcoming listings and from the sitemap; still indexed.
6. `relatedRaces()` excludes past events.

**Honesty constraint:** item 4 is *our inference*, not an organizer claim. This
project already enforces `claim_strength` on the taste layer; the same
discipline applies. It must be visibly labelled as an expectation, never
asserted as a scheduled date.

### H. Known dates that are currently discarded

All **138 TBD rows carry `month`, `month_num` and `year`** (verified: 138/138
on each). Example: `month='Agost 2026', month_num=8, year=2026`, rendered as
"Date: To be announced".

- Render the known month and year for the 91 affected events.
- Preserve the distinction between "expected August 2026" and a confirmed date —
  these must not look alike, and JSON-LD must not claim a date we lack.
- Flag the disagreement class found live: `Radikal Estana` has
  `month='Agost 2026', month_num=8, year=2026` but `date_display='2027'`.

### I. Gaps announce themselves

The requirement without which every other item decays. `scrape-trails` already
runs golden assertions and sends Resend alerts.

- Assert after each weekly scrape: every active town has a geocode and a drive
  time. A new town missing either is a loud failure, not a silent null.
- Regenerate `data/towns-missing-drive-times.json` as real output, or delete it.
  A stale gap-report is worse than none: it asserts "one town missing" while
  eleven are, and it is why this class went unnoticed for four months.
- The report drives the manual lookup loop in B.

---

## 4. Non-goals

- No schema migration. No series/editions table.
- No change to the deferred site→`towns` migration.
- No enrichment activation. `race_enrichment` stays unapplied; D is a render
  guard that preserves lag-tolerance.
- No taste-layer edits. `taste.json` is untouched, so **no MCP redeploy is
  required** and the CLI-from-disk deploy trap (`AGENTS.md`) is not engaged.
- No new skills. Tier 0 is code and data only; the skill design follows, scoped
  against the baseline this leaves behind.

---

## 5. Verification

- `node --test app/lib/*.test.mjs` and
  `deno test --allow-read supabase/functions/ eval/`. The `--allow-read` flag is
  required or 12 scrape-trails tests false-fail on fixture access.
- New tests: distance/elevation formatting (A), order-independence of event
  identity (E), `dateEnd` derivation (F), past-race state (G), month-only date
  rendering (H).
- Data acceptance: Monells ≈86 min; zero active towns lacking geocode or drive
  time; `La Cambrils-Odèn` resolving to the Solsonès, not the coast.
- Visual check on the four cards that motivated this: Trail de Monells,
  Ultra Pirineu, Cursa Muntanya Llagostera Trail, Olla de Núria.
- Known local quirk: `deno check` fails on `npm:@supabase/realtime-js`
  resolution for files importing supabase-js. Local only; deploys fine; do not
  "fix" it.

---

## 6. What this deliberately leaves for later

Recorded here because each was found during this investigation and would
otherwise be lost.

- **Series vs editions.** The durable entity is the race; editions hang off it.
  This is the correct home for next-edition rollover (G) *and* for the taste
  layer — attaching taste to an edition is what produces the prior-edition bleed
  where 13 events quote distances absent from their own table.
- **Stage races.** `Pyrenees Stage Run` (8 days, 240 km) and `Brama Stage Run`
  cannot be represented honestly as a single date and distance.
- **Start coordinates**, replacing town centroids (Dima's stated ambition).
- **Verticals inside a distance list.** 9 events pair a sub-6 km KV with a
  ≥20 km race; `Ultra Pirineu` shows four bare numbers because all four rows are
  named identically, so `variantName` is null on every one.
- **The rules ledger.** `~/Claude/CLAUDE.md` mandates, for projects whose rules
  evolve through conversation, a single `rules.md` with one row per rule, an
  agent-facing write obligation, a Tool access section, and an open-loops file.
  This repo has none. "Discrete distances use commas" should be a durable rule,
  not a commit message.
- **Non-trail entries.** 11 rows have <10 m climb per km; `Cursa de la Vaca` is
  10 km / 22 m D+ (2 m/km) rendered with the full trail apparatus.
- **Elevation inversions.** `Cursa del Torró` 5 km/52 m vs 10 km/42 m;
  `Corriols de Guardiola` 5 km/330 m vs 10 km/300 m.
