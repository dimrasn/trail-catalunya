# Design port — handoff for Dima

**Date:** 2026-09-11 · v1 · Nik (agent-assisted)
**Branch:** `feat/prototype-design-port` — 8 commits off `main` (`5d03be7`), 29 files,
+2967 / −385.

This is the design study (`outputs/prototype/index.html` in Nik's working copy) ported onto
the real app: the homepage now renders in the study's layout and palette, reading live
Supabase data. Filter semantics are unchanged except where noted below, and every change to
them is mirrored and tested.

---

## Send this to Dima

**Nik — the design port is ready to look at.** One branch, eight commits, each one
reviewable on its own. It changes what the homepage LOOKS like and two filter domains; it
does not change how a race is rated, grouped, or published.

**Three things need you, in this order:**

1. **Read the branch, merge it.** Vercel deploys the site from `main` — no other step for
   the front end.
2. **Apply two migrations to prod.** They widen the intent-log allowlist to match the new
   filter domains. Until they are applied the log silently drops rows for the new values —
   the site itself works fine.
   - `supabase/migrations/20260910120000_intent_log_six_difficulty_levels.sql`
   - `supabase/migrations/20260911120000_intent_log_four_distance_buckets.sql`
   Apply in filename order, or apply only the second — it carries the first forward
   unchanged. Both are `CREATE OR REPLACE`, both derived mechanically from the applied
   08-25 file by substituting one array literal.
3. **Redeploy the MCP.** `supabase/functions/mcp/filters_core.ts` gained the six ITRA
   difficulty levels (R8 parity with the site). **Check the live version first** — open loop
   L17 says the docs disagree about what is actually deployed, so call `initialize` before
   shipping on top of it. `taste.json` is untouched, so the inline-size trap does not apply
   and a code-only deploy is fine.

**One thing I could not run:** the Deno suite. No usable `deno` on this machine (the binary
is killed on exec by endpoint security), so `filters_core_test.ts` — the MCP half of the R8
mirror — is **unrun**. Please run `deno test --allow-read supabase/functions/ eval/` before
the MCP deploy. The Node suite is green at 138.

---

## What changed

### Look

The homepage is the study's page: masthead → hero (`PICK A TRAIL / GO RUN.` over the art) →
month glance panel → filter panel → sort/view controls → a full-width ruled list of rows,
with a Weekends view that groups each month into Fri–Sun rungs.

- `app/study.css` is **lifted** from the study's `<style>` block, not re-derived — 615 lines
  with four mechanical substitutions (three font families → the app's next/font variables,
  and the hero-art path). It can be diffed against the source.
- The palette is the study's, verbatim: cream `#F7F6F1`, ink `#11110F`, terracotta
  `#A8412A`, Archivo / Manrope / IBM Plex Mono. **The difficulty ramp did not move** —
  `semantics.js` already held the study's six steps, because the study adopted the repo's
  `LEVELS` rather than the other way round.
- Contrast measured, not assumed: ink 17.47/15.24, muted 5.51/4.81, accent 5.62/4.90 on
  canvas/sunk. All clear AA.

### Filters

- **Six ITRA difficulty levels** instead of four (`vh+` un-bundled). `?dif=vh+` still
  resolves to the top three. Site + MCP + intent-log SQL.
- **Four distance buckets** instead of five (10-15 and 15-21 merge into 10–21). `?dist=10-15`
  and `?dist=15-21` still resolve. Site + intent-log SQL only — the MCP takes distance as
  numeric `dist_min`/`dist_max`, so this is not an R8 change.
- Stated plainly: an old `?dist=10-15` link now returns MORE races than it did. R9 protects
  a shared link from breaking, not from widening; the alternative was orphaning it.

### Honesty fixes (these are yours, from the reconciliation)

- **A2** — the race page rendered `<a href={race.url}>` unguarded, so an empty `race_url`
  produced a self-link captioned "Official site & registration". Now a dashed "No organizer
  link in the source calendar", and the label is derived from the host: 34 catalogue urls are
  Instagram / Facebook / linktr.ee, which render as "Organizer on Instagram" rather than
  wearing the organizer's badge.
- **A1** — `race_url` is the identity key and defaults to `''`, so two link-less races in one
  town would merge into a single card and slug. Golden assertions now check it twice: per
  golden race, and as a catalogue-wide sweep. Runs inside the Edge Function at scrape time,
  which already emails on failure.

---

## Decisions I made that are yours to overrule

1. **Six filter cells, where the study has four.** The study asks WHEN / HOW HARD /
   DISTANCE / DRIVE. The site also filters climb and province, and climb is first-class by
   your ruling of 2026-08-25. Rather than drop working filters to match a cell count, both
   sit in the study's own control vocabulary and its two-per-row grid. Cutting them is a
   deletion, not a rewrite, if you disagree.
2. **"Next two weekends" and the promoted "closest match" are gone.** The study answers
   orientation with the glance panel (month metrics + NEXT UP) and the Weekends view, and
   both state their population. Two further promoted blocks would answer the same question a
   third and fourth time.
3. **The ask-box stays.** It is live and logging; the study predates it.
4. **The row is not clickable; the race name is a link** to the static `/race/<slug>`. The
   study's row opened a quick-view overlay with a link nested inside it, which its own
   comment flags as invalid markup.
5. **Two additions to the study's CSS, both marked NOT LIFTED in the file.** The study's
   weekend ladder (`.ladder`/`.wk`/`.wkh`) has no CSS at all — the ladder replaced the
   calendar grid in its final commit and the styling never followed — so those rules are
   written here from its existing vocabulary. And `.seg.segf button{flex:1 1 0}` splits a
   track by button count, so the "Any" cap landed at a different x in a 4-card row than a
   5-card row; the first card is now pinned to 116px.

---

## Verification

| Gate | Result |
|---|---|
| `next build` | green — 390 pages |
| Node suite | **138 green** (114 at the start of this work) |
| Deno suite | **NOT RUN** — no usable deno on this machine (see above) |
| Browser | **NOT SEEN BY THE AGENT** — headless Chrome is killed by endpoint security. Nik reviewed the render at desktop width. |
| Retired palette sweep | 12 old values (F9FAFC, 2D6FCD, 6B7075, 15152a …) — zero occurrences across homepage, a race page, /for-agents, /about and the stylesheet |
| Study structures in served HTML | heroart, glance + 4 stat tiles, 3 filter rows, 3 menus, 3 segmented controls, rows with ticks + save stars, legend bar, `/hero-art.jpg` 200 |

The build was run against a local stand-in for Supabase (the committed
`data/races.json` snapshot served through a PostgREST-shaped mock), because this machine has
no prod credentials. So **page generation is proven; the numbers on the page came from an
April snapshot**, not from live data. Nothing in the repo was modified to do that — the app
was pointed at the mock through `NEXT_PUBLIC_SUPABASE_URL` alone.

## Still open, unchanged by this branch

L4 (geocode backfill), L8 (stage races render single-day), L9 (removed races 404 at rebuild),
L13 (`deno check` fails on `difficulty_test.ts:96` — pre-existing on `main`), L15 (canonical
name registry), L17 (verify the live MCP version). See `docs/open-loops.md`.
