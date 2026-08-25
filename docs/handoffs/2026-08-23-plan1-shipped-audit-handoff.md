# Handoff: audit shipped Plan 1 + the decisions taken around it

**You are the outside auditor.** The code and decisions below were produced by
Claude in Claude Code. Per `~/Claude/CLAUDE.md`, a reviewer in the same harness
as the author inherits the author's blind spots. **Run this in a different
harness (Codex preferred).**

This is the second audit in this thread. The first reviewed a *specification*
and returned "not ready" with six confirmed author errors — that verdict was
correct and acted on. **This one reviews shipped code, plus two decisions the
author adopted on the owner's behalf.** Assume the same error class is still
live.

Self-contained brief. Read `AGENTS.md` (cold-start order) and `docs/rules.md`
(the rules ledger) before touching anything.

---

## Context in one paragraph

trail-catalunya serves https://trailraces.cat from three surfaces over one
Supabase dataset (project `qaebfhbdfjvzhmvcjroz`): a Next.js site on Vercel, a
weekly `scrape-trails` Edge Function, and a public `mcp` Edge Function. The
`races` table is one row per race × distance; the app and MCP group rows into
events by `(race_url, town)`. The owner (Dima) reported that
`/race/trail-de-monells` rendered `18–25 km` — a range, though the race offers
exactly 18 km and 25 km — and that the card showed no drive time and no map
link. Investigation found a wider defect class and produced a three-plan
remediation. **Plan 1 (presentation truthfulness) is now shipped. Plans 2 and 3
are not started.**

## Where things stand

- Branch `feat/card-quality-tier0`, off `main` (`372bce3`). **Not pushed, not
  deployed, not live.**
- Three commits:
  - `7b97357` — rules ledger, open-loops file, requirements v2, `AGENTS.md`
  - `5f0b791` — **the code under audit**
  - `bb9fdbc` — closes two open decisions as rules R12/R13
- Requirements: `docs/brainstorms/2026-08-23-card-quality-requirements-v2.md`
- Prior audit's handoff (for the errors it caught):
  `docs/handoffs/2026-08-23-card-quality-tier0-audit-handoff.md`

Start with `git show 5f0b791` and `git show bb9fdbc`.

## What Plan 1 claims to have done

1. **R1** — `distancesSummary()` / `elevationSummary()` comma-join discrete
   values instead of rendering `min–max`. Replaced `fmtKm()`, whose two
   branches were identical.
2. **R2** — new `metadataDistancePart()`. Page titles no longer pair a distance
   range with a bare maximum climb (`5–100 km / 6600 m D+` → `5, 21, 42, 100 km
   · up to 6600 m D+`).
3. **Dead enrichment heading** — "Race-day facts" now renders only when there is
   a payload. It previously shipped on 226/226 pages with only an apology under
   it. The slot is kept deliberately.
4. **Known months** — 91 events now render "Expected September 2026 — exact
   date not announced" instead of "To be announced", from `month_num`/`year`
   columns the site was discarding. Held in separate
   `expectedMonth`/`expectedYear` fields, never written into `date`.

Author's verification, for you to reproduce or refute:

```
node --test app/lib/*.test.mjs                     # 37 pass, 11 new
deno test --allow-read --no-check supabase/functions/ eval/   # 114 pass
npm run build                                      # 226 race pages
# then, over .next/server/app/race/*.html:
#   "Race-day facts"        226 -> 0
#   expected-month pages      0 -> 91
#   "To be announced"           -> 0
#   N–N km ranges from our formatters -> 0
```

---

## Questions the author wants answered

These are genuine uncertainties, not rhetorical. Answer them directly.

**Q1 — Is R13 (longest-distance naming) structurally unstable?**
Rule R13 derives an event's name from its longest-distance row, and the slug
derives from the name. That makes the URL a function of the *data*: if a race
adds a longer distance next season, the name changes and the slug moves again —
which is the exact instability R9 exists to prevent. The author verified it
resolves all 3 current sub-race-first cases correctly and treated the override
registry as a fallback. **Should the registry instead be primary — an explicit
pinned name for every multi-name event, with the heuristic only for new
events?** This may be a design flaw in a rule already written to the ledger.

**Q2 — Was R12 (roadless towns) the right call, or did the author dodge?**
The first audit found that R3's plausibility guard needs a shared
`minutes | no_road_access | unknown` contract, which implies a schema change on
`towns`. The author overrode this: keep the access state in the site's JSON
only, let the MCP keep returning `null` until Slice 2, on the grounds that
there is no second consumer needing the distinction. **Is that reasoning sound?
Does `null` already carry a meaning to MCP-consuming agents that this
overloads?** Note the MCP's tool description documents drive time as a primary
discovery axis.

**Q3 — Should the expected-month render be gated on data agreement?**
Shipped without validating the month data itself. Measured: of the 91 events
now showing an expected month, **4 have a `date_display` that is a bare year
disagreeing with the `year` column** (e.g. `Radikal Estana`:
`month='Agost 2026'`, `year=2026`, `date_display='2027'`). None are in the past.
**Is 4/91 acceptable, or should the render be suppressed when the source
disagrees with itself?** The author leaned ship-and-measure; argue the other
side if it deserves it.

**Q4 — Is "up to X m D+" honest on partially-known events?**
`maxElevation()` takes the max of non-null elevations. On an event where some
distances have D+ and others don't, "up to 6600 m D+" is computed from a
subset. It cannot overstate the known maximum, but it may describe a smaller
set than the distance list beside it implies. **Does this reproduce the R2
failure in a subtler form?** Note the project already refuses partial maxima
elsewhere: `eventKmEffort()` returns null unless *every* distance has D+.

**Q5 — Did removing the apology lose a needed hedge?**
The old "Race-day facts" fallback told users start time and registration status
were unverified. That text is now gone on all 226 pages. The CTA disclaimer
below still reads "Dates, start times and registration change. Always confirm
on the official site." **Is the remaining hedge sufficient, or was a real
user-protective signal deleted?**

**Q6 — Is R1 correctly applied to elevation?**
Distances are unambiguously discrete — a runner picks one. Elevation is a
*property* of each distance, and `↑650, 1090 m` may read worse than a range.
**Should elevation follow R1, or is it genuinely a different case?**

**Q7 — Is coverage complete?**
The author checked `RaceCard.jsx`, `askPrompt.js`, `for-agents`,
`opengraph-image` and the MCP, and concluded the only remaining `N–N` renders
are (a) filter-bucket labels in `askPrompt.js` (`'10-15': '10–15 km'`), which
are genuine ranges, and (b) organizer-quoted kids-race taste text
(`ages 3–16, 1–6 km`). **Verify independently — is there a surface that was
missed?** The MCP is the one that matters most: it feeds agents, not humans.

---

## Where the author is least confident

Beyond the questions above:

1. **The two rules were adopted from the author's own recommendation** on a
   one-line "let's go" from the owner, and marked as such in `docs/rules.md`.
   If either is wrong, it is now written into the ledger that governs future
   sessions — which makes a wrong rule more durable than a wrong commit.
2. **The month copy** — "Expected September 2026 — exact date not announced" —
   was written to be unmistakably an expectation. Read it cold. Could a user
   act on it as though it were confirmed?
3. **JSON-LD** was deliberately left emitting no date for these 91 events.
   Verify that is actually true in the built output and that no structured-data
   consumer now sees a contradiction between visible text and markup.
4. **Test quality, not just count.** 11 tests were added. Are any of them
   asserting the implementation back at itself rather than the requirement?

---

## Traps that will waste your time

- **`deno test` type-check fails PRE-EXISTING on `main`** at
  `difficulty_test.ts:96` — `drive_max` is not declared in `VariantFilter`.
  Reproduced with all Plan-1 changes stashed. It is **not** caused by this
  work; logged as L13. Use `--no-check` to run the suite (114 pass). Do not
  attribute it to Plan 1, and check `feat/multi-select-filters` before fixing.
- **`--allow-read` is required** on `deno test` or 12 scrape-trails tests
  false-fail on `fixture.html` access (`NotCapable`) and look like code defects.
- **Local `deno check` fails on `npm:@supabase/realtime-js`** for files
  importing supabase-js. Local only, deploys fine, **do not fix**.
- **`race_enrichment` is unapplied on purpose.** The site and MCP tolerate its
  absence by design, proven against prod. The Plan-1 change is a render guard;
  if you read it as removing the enrichment slot, that is a misreading.
- **Do not deploy anything.** Plan 1 is site-only and unpushed.
- **Counts must apply the active filter** —
  `source='ultrescatalunya' AND status NOT IN ('REMOVED','SUSPESA')`. Ignoring
  it inflates the catalogue from 412 rows to 819. The first audit caught the
  author making a related error twice (see rule R10); assume it can recur.

## Out of scope

Plans 2 and 3 are not written yet — do not review them. Deliberate non-goals in
requirements v2 §Non-goals: no series/editions model, no taste-layer edits, no
enrichment activation, no site→`towns` migration, no new skills.

---

## What to send back

A findings list, most severe first. For each: the file/line or command that
demonstrates it, what breaks, and a concrete correction. Plus:

1. **Direct answers to Q1–Q7.** These are the point of this audit.
2. Which author claims you **reproduced and confirmed**, and which you found
   wrong — especially the built-HTML tallies.
3. Any rule in `docs/rules.md` you believe is wrong or wrongly scoped. It is
   the governing document now, so an error there outlives any single commit.
4. Whether Plan 1 is safe to merge to `main` and deploy, yes or no.
5. What you would change about the *sequencing* — Plan 3 (176-town geocode
   backfill + gap assertions) is next, Plan 2 (identity, moves indexed URLs,
   needs MCP parity deploy) last.

Do not fix anything. Do not push. This is a review pass.
