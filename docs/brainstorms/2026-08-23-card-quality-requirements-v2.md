# Race-card quality — requirements (v2, post-audit)

Date: 2026-08-23
Status: revised after outside audit; ready for planning
Supersedes: `2026-08-23-card-quality-tier0-requirements-v1-SUPERSEDED.md`
Rules ledger: `docs/rules.md` · Open loops: `docs/open-loops.md`

## Why there is a v2

v1 was audited in a separate harness (Codex) per the workspace's outside-auditor
rule and returned **not ready**, with six confirmed author errors. All six are
corrected here and each is recorded rather than quietly fixed, because the
pattern matters more than the individual numbers.

**Corrections carried into v2:**

1. **176 towns need geocoding, not ~86.** v1 computed `199 active − 113 cache
   keys`. Only **23** of the 199 active towns are in the cache; 90 cache keys
   are stale. This is the same population-mismatch error that earlier produced
   `819 rows` (402 of them `REMOVED`). Now rule **R10**.
2. **A code-only MCP deploy IS required.** `supabase/functions/mcp/grouping.ts`
   duplicates the site's grouping, naming and date logic. v1's "no MCP redeploy
   required" was false. Now rule **R8**.
3. **"The page persists — never 404" is impossible as written.**
   `app/race/[slug]/page.js:16` sets `dynamicParams = false`, so a `REMOVED`
   event's page disappears at the next rebuild. Deferred as open loop **L9**.
4. **Event `status` comes from `groupRows[0]`**, not `mainRows[0]` — v1 misread
   `app/lib/races.js:192`. Name and province do come from `mainRows[0]`.
5. **`EnrichmentRow` is already correctly guarded** (`RaceCard.jsx:234`). v1
   claimed it needed the same fix as the detail page. It does not; removed
   from scope.
6. **Widest event has 5 distances** (Congost Trail Challenge), not 4 — v1
   grouped by `race_name` where the app groups by `(race_url, town)`. And there
   are **3** sub-race-first naming cases, not 2 (Espintrail Vertical is the
   third), across **6** mixed-name events.

Two further corrections to claims v1 relayed without checking: Llagostera's
"151 registered (full)" is **not** displayed (`capacity` is not in
`SLICE1_ATTRIBUTES`) — the "sold out already" editorial text is, so the defect
stands but is narrower; and `fmtKm()`'s duplicate branch is confirmed **dead
code, not a live defect**.

## Verified baseline (2026-08-23)

Filter — and every count below applies it, per **R10**:
`source='ultrescatalunya' AND status NOT IN ('REMOVED','SUSPESA')`.

- **412 rows → 226 events → 199 towns**
- **9 of 226 events** complete on five dimensions (date · D+ on every distance ·
  drive time · coordinates · taste). Median event missing two.
- **176 active towns** lack a geocode → **195 of 226 events** have no lat/lng
- **11 active towns / 11 events** lack a drive time
- **226 of 226** events render the dead "Race-day facts" heading
- **17 events** past-dated and still `ACTIVA`
- **138 TBD rows / 91 events** carry `month`, `month_num` and `year` (138/138)
- **6 events** multi-date; **6 events** mixed-name; **8 events** ≥5× distance spread

## Root cause

`scripts/geocode-towns.py` reads `data/races-raw.json`, the April CSV-era
snapshot, and was never rewired when the live system moved to the Supabase
`scrape-trails` function. Both JSON caches drifted from live data for four
months. `data/towns-missing-drive-times.json` — the file that exists to report
exactly this — was last written 25 April and names one town while eleven are
missing. Nothing anywhere recorded the drift. That silence is the defect;
everything else is its symptom.

---

# Plan 1 — Presentation truthfulness

Lowest risk, no identity or schema impact, ships Dima's reported bug. Site-only.

**P1.1 · Discrete values render as lists** (R1). `distancesSummary()` and
`elevationSummary()` in `app/lib/format.js` comma-join instead of `min–max`.
Must handle the 5-distance case (Congost Trail Challenge).

**P1.2 · No mismatched aggregates in metadata** (R2). `generateMetadata` must
not pair the full distance range with the single hardest D+.
*Open:* the exact title string for a multi-distance event needs specifying —
"do not pair unrelated maxima" admits several valid outputs.

**P1.3 · Delete the dead `fmtKm()` branch.** Cosmetic; not user-visible.

**P1.4 · Guard the "Race-day facts" heading** on the detail page only
(`app/race/[slug]/page.js:314`). **Do not touch `EnrichmentRow`** — already
guarded. **Do not remove the enrichment slot**; it is awaiting activation and
the lag-tolerance is deliberate and proven against prod.

**P1.5 · Render known month/year** for the 91 dated-unknown events instead of
"To be announced". Must stay visually distinct from a confirmed date, and
JSON-LD must not claim a date we do not have.
*Open:* which value wins when `month`/`year` disagree with `date_display`
(`Radikal Estana`: `Agost 2026` vs `2027`) — or whether to suppress both.

**Tests:** `app/lib/format.test.mjs` — two, four and five discrete distances;
single distance; decimal (`10.6`); wide-spread metadata title; month-only date.

---

# Plan 2 — Event identity and lifecycle

Highest risk: touches two surfaces, moves published URLs, changes JSON-LD.
**Blocked on L2** (canonical-name decision).

**P2.1 · Deterministic identity.** Add `ORDER BY` to the fetch
(`app/lib/races.js:234`). Name from the longest-distance row, plus an explicit
override registry for the 6 mixed-name events (**D2**, pending). Note `status`
comes from `groupRows[0]` and name/province from `mainRows[0]` — state the
intended precedence for each explicitly rather than inheriting it.

**P2.2 · MCP parity** (R8). Every P2.1/P2.2 change mirrored into
`supabase/functions/mcp/grouping.ts` with mirrored tests, following the existing
`difficulty.ts` ↔ `format.js` pattern. **Requires a code-only MCP deploy** —
`taste.json` is untouched, so the 165KB inline-size trap does not apply and the
Supabase MCP deploy tool is usable.

**P2.3 · Redirects** (R9). A permanent redirect for every slug that moves.
Must ship in the same change as the rename, not after.

**P2.4 · Multi-day end dates.** Derive `dateEnd` from min/max `date` across the
event's rows (6 events). Both groupers.

**P2.5 · Stage-race guard** (L8). Pyrenees Stage Run (8 days, 240 km) and Brama
Stage Run render as single-day. The full model is deferred, but the audit ruled
the false presentation cannot wait — an explicit end-date override.

**P2.6 · Finished races stop inviting registration** (17 events). State marker;
CTA demoted to a plain official-site link; **"Next edition not announced — check
official site"** per **R6** (no predicted date); out of upcoming listings and
sitemap; `relatedRaces()` excludes past events; homepage JSON-LD stops marking
past events `EventScheduled` (L11 — it filters on `r.date` only, independent of
the client-side homepage filter).

**Not in scope:** historical page retention (**L9**) — `dynamicParams = false`
makes "never 404" impossible today; needs a design, not a patch.

---

# Plan 3 — Location operations

Deterministic storage and rendering; **acquisition is an operational backfill,
not code work.** Managed as such per the audit.

**P3.1 · Backfill 176 geocodes + 11 drive times.** Dima's decision 2026-08-23:
automate free via OSRM/Nominatim, no API spend. Origin for every drive time is
**Plaça Glòries, Barcelona (41.4036, 2.1868)** — documented in the MCP's own
tool description; it must not drift. Town list comes from live Supabase, never
`data/races-raw.json`.

- **Acceptance:** Monells ≈86 min (Dima measured 1h26m by hand). A materially
  different value means the wrong Monells resolved.
- **Ambiguity guard** (R4): verify against province. Known live failure —
  `La Cambrils-Odèn` (`LLEIDA`, Solsonès) resolved to coastal Cambrils, 97 min.
- **Plausibility guard** (R3): Vall de Núria shows 3h 45m for a valley reachable
  only by rack railway. **Blocked on L1** — the
  `minutes | no_road_access | unknown` contract is undecided, and the current
  integer column cannot express the difference.

**P3.2 · Write to both consumers** (R7). `data/towns-geocoded.json` +
`data/towns-drive-times.json` for the site's build, and the `towns` table via
`scripts/backfill-towns.mjs` for the MCP. Updating one only is a defect.

**P3.3 · Location links to a map.** The "Getting there" block
(`app/race/[slug]/page.js:346`) starts working for every geocoded event once
P3.1 lands — no change needed there. Additionally link the Key Facts location
line.
*Open:* link label, destination, whether the existing map CTA stays, and how the
centroid is disclosed. These are **town centroids, not start lines**, and the
card must not imply otherwise.

**P3.4 · Gaps report themselves** (R11). Two checks, because there are two
consumers and the Edge runtime cannot inspect committed JSON:
- post-scrape Supabase completeness alert (serves the MCP), via the existing
  `golden.ts` + Resend path;
- a build/CI check against both committed caches (serves the site).

Regenerate `data/towns-missing-drive-times.json` as real output or delete it.
*Open:* whether a gap fails ingestion, fails the build, or only alerts.

---

## Non-goals

- No series/editions model (**L10**) — deferred, but named as the correct home
  for next-edition rollover and for the taste layer.
- No taste-layer edits. `taste.json` untouched.
- No enrichment activation.
- No new skills. Skill design follows, scoped against the baseline this leaves.
- No site→`towns` migration.

## Verification

- `node --test app/lib/*.test.mjs`
- `deno test --allow-read supabase/functions/ eval/` — the `--allow-read` flag
  is REQUIRED; without it 12 scrape-trails tests false-fail on fixture access.
- Local `deno check` fails on `npm:@supabase/realtime-js` for files importing
  supabase-js. Local only, deploys fine, **do not fix**.
- Data acceptance: Monells ≈86 min; zero active towns lacking geocode or drive
  time; `La Cambrils-Odèn` in the Solsonès.
- Cards to eyeball: Trail de Monells, Ultra Pirineu, Cursa Muntanya Llagostera
  Trail, Olla de Núria, Congost Trail Challenge (5 distances), Pyrenees Stage Run.
