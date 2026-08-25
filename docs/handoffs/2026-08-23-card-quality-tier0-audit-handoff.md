# Handoff: audit the race-card quality Tier 0 requirements

**You are the outside auditor.** The spec under review was written by Claude in
Claude Code. Per `~/Claude/CLAUDE.md`, a reviewer inside the same harness as the
author shares the author's blind spots — a prior Codex pass on this repo found
two arithmetic errors that two same-harness audits had missed. **Run this in a
different harness (Codex preferred).** Nothing has been implemented yet; this is
a review of requirements, before any code moves.

Self-contained brief — everything you need to start is below. Read
`AGENTS.md` (cold-start order + deployment state) before touching anything.

---

## Context in one paragraph

trail-catalunya serves https://trailraces.cat — a directory of trail-running
races in Catalunya — from three surfaces over one Supabase dataset (project
`qaebfhbdfjvzhmvcjroz`): a Next.js site on Vercel (ISR, auto-deploys from
`main`), a weekly `scrape-trails` Edge Function (pg_cron Mon 05:00 UTC), and a
public `mcp` Edge Function. The `races` table is **one row per race × distance**;
the app and MCP group rows into events by `(race_url, town)`. The owner (Dima)
reported two defects on `/race/trail-de-monells`: distances rendered as
`18–25 km` (a range, though only 18 and 25 exist), and a missing drive time plus
no map link on the location. Investigation found both were symptoms of a wider
class, and produced the spec you are auditing.

## The artifact under audit

`docs/brainstorms/2026-08-23-card-quality-tier0-requirements.md` — nine
requirements (A–I) scoping the **deterministic** remediation only. Judgment and
research work (taste coverage, missing dates, prices) is deliberately excluded
and listed in the spec's §2 and §6.

## What has NOT happened

- No code changed. No migration. No deploy. Nothing committed.
- The current branch is `feat/multi-select-filters`, which is *not* where this
  work belongs — flag branch strategy if you think it matters.

---

## Your job

Audit the spec for defects **before** it becomes an implementation plan. Three
things specifically, in priority order:

1. **Verify every load-bearing number.** They are listed below with the exact
   query to recompute each. The author got one badly wrong already (see
   "Known author error"), so treat none of them as given.
2. **Find what the spec misses or gets wrong** — requirements that will not
   survive contact with the code, contradictions between items, ambiguity where
   two implementers would diverge, and scope that is too large or too small.
3. **Challenge the deferrals.** §6 parks several items (series/editions model,
   stage races, the rules ledger). Argue if any of them cannot safely wait, or
   if anything in Tier 0 should instead be deferred.

---

## Known author error — start here, it tells you where else to look

The author initially reported the catalogue as **819 rows / 329 towns**, and
sized the remediation backlog against it. That was wrong: 402 rows are
`REMOVED` and 5 are `SUSPESA`, and `app/lib/races.js:238-239` excludes both, as
does the MCP. The true active figure is **412 rows / 226 events / 199 towns** —
the backlog was overstated by roughly 2×, and downstream figures (missing
elevation, TBD dates, missing drive times) were all inflated before correction.

The corrected numbers are in the spec. **Assume this class of error may recur**
and check whether the active filter
(`status NOT IN ('REMOVED','SUSPESA')` AND `source='ultrescatalunya'`) has been
applied consistently everywhere the spec quotes a count.

---

## Claims to verify, each with its check

Run these directly. The SQL goes to Supabase project `qaebfhbdfjvzhmvcjroz`.

### Baseline

```sql
with a as (select * from races
           where status not in ('REMOVED','SUSPESA') and source='ultrescatalunya')
select count(*) rows_n,
       count(distinct race_url||'::'||town) events_n,
       count(distinct town) towns_n
from a;
```
Spec claims: **412 / 226 / 199**.

### Per-requirement claims

| # | Claim in spec | Check |
|---|---|---|
| A | `distancesSummary()` renders `min–max`; `fmtKm()` has two identical branches and is **dead code, not a live defect** | Read `app/lib/format.js:69-81`. Confirm `String(11.0) === '11'` in node, i.e. the dead branch changes nothing today. Challenge if you disagree it's harmless. |
| A | Widest event has 4 distances, so comma-joining never overflows | `select race_url,town,count(*) from a group by 1,2 order by 3 desc limit 3;` |
| A | 8 events have ≥5× spread between shortest and longest distance | Recompute. Spec uses this to justify the metadata fix. |
| B | `geocode-towns.py` reads `data/races-raw.json` (April CSV), not Supabase | Read `scripts/geocode-towns.py` + `scripts/pipeline.sh`. |
| B | 113 geocoded towns vs 199 active → **195 of 226 events have no lat/lng** | `node -e "console.log(Object.keys(require('./data/towns-geocoded.json')).length)"` then join against live towns. |
| B | 11 active towns lack a drive time | Compare `data/towns-drive-times.json` keys against active towns. |
| B | `La Cambrils-Odèn` resolves to the wrong Cambrils (97 min, coastal, but race is in the Solsonès) | `select town,province from a where race_name ilike '%cambrils%';` + the drive-times JSON. |
| B | `Vall de Núria` shows 3h 45m for a valley with **no road access** | `select name,drive_minutes_from_barcelona from towns where name ilike '%núria%';` Verify the real-world claim independently — Núria is rack-railway only from Ribes de Freser. |
| C | The Google Maps link **already exists** and is gated on lat/lng | Read `app/race/[slug]/page.js:346`. |
| D | `race_enrichment` does not exist, so the "Race-day facts" heading renders with only an apology on **226/226** events | `select to_regclass('public.race_enrichment');` + read `app/race/[slug]/page.js:314`. |
| E | Event name/province/status come from `mainRows[0]` and the query has **no `ORDER BY`** → order-dependent slugs | Read `app/lib/races.js:117` and `races.js:234-239`. |
| E | Two events are currently named after a sub-race ("Olla de Núria vertical", "Volta a la Maria La nocturna") | Query both events' rows. |
| F | 6 events have >1 distinct date and render as single-day | `select race_url,town,count(distinct date) c from a where date is not null group by 1,2 having count(distinct date)>1;` |
| G | 17 events are past-dated and still `ACTIVA`, with live CTA + `EventScheduled` + sitemap priority 0.8 | `select count(distinct race_url||'::'||town) from a where date < current_date;` + read `app/sitemap.js` and the CTA block. |
| G | Llagostera ran 22 Aug; its taste says "sold out already / 151 registered (full)" above a live register button | Check the event and its taste profile. |
| H | **All 138 TBD rows carry `month`, `month_num` and `year`** | `select count(*) filter (where date is null) a, count(*) filter (where date is null and month_num is not null) b from a;` — spec says 138/138. This is the highest-value claim in the spec; verify carefully. |
| H | 91 events affected | Recompute at event grain, not row grain. |
| I | `data/towns-missing-drive-times.json` is a stale 25-April snapshot listing only `Lluerts` | `cat data/towns-missing-drive-times.json`. |

---

## Where the author is least confident — press hardest here

1. **E renames a live, indexed page.** Deriving the event name from the
   longest-distance row moves `/race/olla-de-nuria-vertical` →
   `/race/olla-de-nuria`. The spec asserts this is correct but does **not**
   specify a redirect. Is the rule right at all? Is "longest distance" the
   correct heuristic, or does it break an event whose flagship is not its
   longest race? Does a slug change need a 301, and does the spec's silence on
   that make it incomplete?

2. **G item 4 — "Next edition expected `<month>` `<year+1>`" — is an inference
   the site would publish.** The spec requires it be labelled per the project's
   existing `claim_strength` discipline. Is that sufficient, or is predicting a
   future race date something the site should not do at all? Note the site's
   whole credibility position is honesty-labelling.

3. **The Tier 0 / Tier 2 boundary.** The spec asserts the defect set is roughly
   55% deterministic, 30% researchable, 15% judgment, and cuts Tier 0 along the
   deterministic line. Item B breaks that line (deterministic data, manual
   acquisition — the owner declined Google Maps API spend). Is the boundary
   principled or convenient? Does B belong in Tier 0 at all?

4. **Nine requirements may be too many for one plan.** The author judged them
   individually small and mutually independent. Verify that independence — in
   particular whether E (event identity) and F (dateEnd) collide, since both
   change `groupRowsIntoEvents()`.

5. **The real-world claim about Vall de Núria** rests on the author's knowledge
   that Núria has no road, not on a source. If that is wrong, requirement B's
   plausibility guard is built on a bad example.

6. **Item I is asserted to be the load-bearing requirement** ("without it every
   other item decays"). That is an argument, not a verified fact. Test it: is
   there an existing mechanism that would have caught the 11 missing towns?
   Check `supabase/functions/scrape-trails/golden.ts` and the Resend alerting.

---

## Traps that will waste your time if you don't know them

- **Tests need the read flag:** `deno test --allow-read supabase/functions/ eval/`.
  Without `--allow-read`, 12 scrape-trails tests false-fail on `fixture.html`
  access (`NotCapable`) and it looks like a code defect. Node side:
  `node --test app/lib/*.test.mjs`.
- **`deno check` fails locally** on `npm:@supabase/realtime-js` resolution for
  any file importing supabase-js. Local-only, deploys fine, **do not fix**.
- **Do not deploy the MCP.** Nothing in this spec touches
  `docs/enrichment/2026-batch/parsed/taste.json`, so no redeploy is needed. If
  you somehow conclude one is, note that `taste.json` is ~165KB+ and the
  Supabase MCP `deploy_edge_function` tool is inline-only — a malformed inline
  JSON would 500 the *public* MCP. Deploys must go through the Supabase CLI
  from disk, from the repo root.
- **`race_enrichment` is unapplied on purpose.** The site and MCP tolerate its
  absence by design and this is proven against prod. Requirement D is a render
  guard; if you read it as "delete the enrichment slot", that's a
  misinterpretation — flag the wording as ambiguous rather than acting on it.
- **Two sources for drive times.** The site reads
  `data/towns-drive-times.json` at build; only the MCP reads the `towns` table.
  The site→towns migration is deliberately deferred. A fix that updates one and
  not the other is a real defect — check the spec requires both.
- **Drive-time origin is Plaça Glòries (41.4036, 2.1868)**, not the user's
  location. It is documented in the MCP's own tool description. If any
  requirement implies otherwise, that's a defect.

---

## What to send back

A findings list, most severe first. For each: the file/line or query that
demonstrates it, what breaks, and a concrete correction. Specifically state:

1. Which spec numbers you **recomputed and confirmed**, and which you found wrong.
2. Any requirement that is ambiguous enough that two implementers would build
   different things.
3. Anything in §6 (deferred) that you believe cannot safely wait.
4. Whether the Tier 0 scope should be split, and where the seam is.
5. Your verdict: is this spec ready to become an implementation plan, yes or no?

Do not fix anything. Do not write code. This is a review pass.
