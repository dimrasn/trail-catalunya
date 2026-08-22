# Taste field registry + tag normalization map (U1)

Built from a full inventory of raw annotations across `chunk-0..11.md` (2026-08-22).
The corpus was produced by a 13-agent Workflow whose agents tagged inconsistently
— 60+ raw bracket variants, mixed case, and evidence sometimes embedded inside the
bracket (`[scraped: "…"]`) rather than after an em-dash. The generator
(`scripts/build-taste.mjs`) normalizes every raw tag through the map below and
FAILS LOUD on any unmapped variant.

## claim_strength (strong → weak)
`organizer_fact` > `derived` > `our_read` > `inference`. Plus `dima_firsthand`
(runner) and `organizer_pdf` (reglament PDF). A compound tag resolves to the
WEAKER side. An unknown-sentinel value is omitted regardless of tag.

## Tag map (raw, case-insensitive → canonical)
- **organizer_fact** ← `scrape`, `scraped`, `SCRAPE`, `SITE`, `source`, `stated`,
  `scrape-grounded`, `scraped name`, `scraped location`, `geo`, `source: site`,
  `source + geo`, `SCRAPE, routes page`, `SCRAPE, organizer says`,
  `SCRAPE, rare honest signal`, and any `scraped: "<quote>"` (the quote becomes the
  evidence; the tag becomes organizer_fact).
- **derived** ← `derived`, `DERIVED`, `DERIVED partial`, `DERIVED from …`.
- **our_read** ← `editorial`, `EDITORIAL`, `editorial — flag` (also sets
  `review_flag:true`), `editorial geography/known geography/town-based`.
- **inference** ← `infer`, `inference`, `INFER`, `INFERENCE`, `inference from name`,
  `inference — no night mention`.
- **compound → weaker:** `editorial/inference`, `EDITORIAL, inference`,
  `scrape/inference`, `SCRAPE/INFER`, `INFER/SCRAPE`, `SITE/INFERENCE` → inference;
  `SCRAPE/DERIVED`, `DERIVED + SCRAPE`, `DERIVED/SCRAPE` → derived;
  `DERIVED/EDITORIAL`, `SCRAPE/EDITORIAL`, `scraped + editorial` → our_read;
  `DERIVED/INFERENCE` → inference.
- **OMIT (unknown-sentinel tags):** `unknown`, `UNKNOWN`, `SCRAPE unknown`,
  `scraped — absent`, `SCRAPE-absent`, `DERIVED-blocked`, `unknown for 2026`,
  `unknown — <reason>`, `unknown/CONFLICT-RISK`. Also omit when the VALUE token is
  `unknown` / `not stated` / `cannot compute` / `n/a` / empty, regardless of tag.
- **flag-for-review (published as our_read + `review_flag`):** `FLAG`,
  `editorial — flag`, anything containing `CONFLICT-RISK`.

## Canonical attribute keys (normalized from bullet labels)
`night_race, start_time, course_topology, setting, championship, cutoffs,
aid_stations, logistics_parking, tradition_editions, food, kids_race,
technicality, capacity, price, distance_dplus, season_heat`. Bullet labels are
lowercased, trimmed, `?`/spaces/slashes normalized; an unmapped label is kept
under its slugified name and flagged in the exceptions report (never dropped).

## Editorial keys
`unique, cool, catch, who, reference_point` (from UNIQUE / COOL / CATCH / WHO /
REFERENCE POINT). Each stored `{value, claim_strength}`.

## HIGH-BLAST operational fields (KTD5 staleness gate applies)
`start_time, cutoffs, mandatory_kit, logistics_parking`. Hidden or shown
"previous edition — verify" when `edition=previous` or stale.

## Excluded blocks
Any block containing ⚠ or listed in `_fix-list.md` is excluded whole (including
its editorial/inference lines). 123 blocks − ~32 ⚠ ≈ 91 profiles; the generator
prints the exact reconciled count.
