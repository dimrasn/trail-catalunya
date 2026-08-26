# Enrichment fields spec — the canonical "what we collect from every race"

The single source of truth for the enrichment phase. The extractor prompt, the
gate (`enrichment_view.ts`), the schema types (`enrich-races/types.ts`), and the
eval answer key all reference THIS file. If a field isn't here, we don't publish
it as a structured fact. Design settled with Dima 2026-08-25; folds the dogfood +
Codex review. Not yet built — this defines the target.

## Principles

1. **Two tiers.** A **standardized schema** of clear, deterministic fields we try
   to get from *every* race (below), extracted against a fixed contract; and **the
   model (Haiku)** for the unpredictable — character ("what's unique/cool") and
   outliers that don't fit a slot.
2. **Honesty envelope, always.** Every published fact carries: `value` ·
   `confidence` · `evidence` (the exact quote, which MUST exist on the page) ·
   `source_url` · `edition` · `last_checked`. Missing any → the fact fails closed
   (not published).
3. **Fact-local proof, fail-closed** (Codex P0-2). A fact is published only if its
   evidence quote is present on the recorded source page AND its local context
   (heading/table/date) is consistent with the race's known date. Unresolved,
   mixed-edition, or unprovable → hidden.
4. **Grain tags** on every field:
   - **[distance]** — varies per race distance → stored per-variant, never a single
     event scalar (Codex P0-1: staggered starts / tiered prices). An event-level
     scalar is published only when every non-kids variant shares it.
   - **[edition]** — changes year to year → refreshed each edition.
   - **[stable]** — usually the same across years → collected once, re-confirmed
     cheaply.
5. **Retention across editions** (Dima). A race is very likely the same next year,
   so data is a *retained asset*, never thrown away. This year's proven facts show
   as **current**; last year's show as a **dated prior** ("2025 edition: … —
   likely similar, verify"), never dressed as current; **[stable]** facts + character
   persist. Next year = re-confirm + deltas, not re-collect.
6. **Volatile ≠ snapshot.** Genuinely live states are never published as a stale
   boolean — see Registration.

## Fields

### Logistics — mostly [edition]
| field | grain | notes |
|---|---|---|
| `start_time` | [distance][edition] | staggered starts are the norm — per-variant |
| `price` / tiers | [distance][edition] | tiered/early-bird → per-variant; precedence over legacy `races.price` |
| `cutoff` / time limit | [distance][edition] | per-variant |
| `confirmed_status` | [edition] | confirmed / cancelled for THIS edition |

### Registration lifecycle — [edition], captured as DATES not a live boolean
| field | grain | notes |
|---|---|---|
| `registration_url` | [edition] | where to sign up |
| `registration_opens_on` | [edition] | dated fact — agent derives "not yet open" if today < this |
| `registration_closes_on` | [edition] | deadline — agent derives "closed" if today > this |
| `registration_status` | DERIVED | not_yet_open \| open \| closed \| sold_out \| unknown — computed from the dates + today; **never a stale snapshot** |
| `sold_out` | [edition] | the ONE live status published honestly — sourced from the WEEKLY SCRAPER (ESGOTADES), so it carries a fresh weekly check-date, not the enrichment snapshot |

### Route & terrain — mostly [stable]
| field | grain | notes |
|---|---|---|
| `track_link` (Wikiloc / Komoot / Strava) | [distance][stable] | high value; usually a clean link |
| `elevation_profile` (image/link) | [distance][stable] | |
| `distance_km`, `elevation_gain` | [distance] | already in the races table |

### Requirements & safety — mostly [stable]
| field | grain | notes |
|---|---|---|
| `mandatory_equipment` | [stable] | e.g. Burriac Atac's working headlamp — safety-relevant |
| `feec_licence` | [stable] | licence/insurance requirement |
| `aid_stations` / self-sufficiency | [stable] | |

### Flags — organizer-confirmed, filterable
| field | grain | notes |
|---|---|---|
| `kids_race` | [stable] | organizer-affirmed → sets `kidsRun` (U1, shipped 2026-08-25) |
| `night` | [stable] | organizer-affirmed → `taste_flags.night` (shipped) |

### Contact & sources
| field | grain | notes |
|---|---|---|
| `official_url` | — | already have |
| `social_links` (Instagram / Facebook) | [stable] | the FALLBACK source for the ~29 website-less races |

### Character — the MODEL tier, [stable]
`unique` · `cool` · `catch` · `who_its_for` · `setting` · `terrain` ·
`technicality` · `food` — generated from the page by a cheap model (Haiku),
honesty-labelled by claim_strength, persists across years. This is the taste layer.

### Outliers — also the model
Anything notable that doesn't fit a slot — surfaced low-confidence unless
organizer-stated. Never fabricated.

## Consumption (how this file is load-bearing)
- **Extractor prompt** enumerates exactly these fields + the grain rules; the model
  fills the standard slots + generates character; unknown → omit (never guess).
- **Gate** (`enrichment_view.ts`) enforces the envelope + fail-closed + the edition
  cross-check + the retention/dated-prior presentation + the derived registration
  status.
- **Eval key** (human-verified by Dima) tests the extractor's output for these
  fields against real pages, incl. mixed-edition.
- **Types** mirror this list per-variant.

## Open (settle at build)
- The exact `[stable]` re-confirm cadence + the `[edition]` re-crawl N (days before
  race) → write into `docs/rules.md`.
- Any field a runner needs that's missing (parking/access? previous winners/times?
  weather exposure?) — add here before extraction.
