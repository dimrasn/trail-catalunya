# Enrichment fields spec + machine contract — "what we collect, and how honestly"

The single source of truth for the enrichment phase. The extractor prompt, the
batch-promotion validator, the runtime gate (`enrichment_view.ts` / `enrichment.js`),
the schema types (`enrich-races/types.ts`), the shared resolver, and the eval key all
reference THIS file. If a field isn't here, we don't publish it. Settled with Dima +
two Codex review rounds, 2026-08-25. Not yet built — this is the target.

## Principles

1. **Two tiers.** A standardized schema of deterministic fields (below) + the model
   (Haiku) for character and outliers.
2. **Validation happens at BATCH-PROMOTION, not at the runtime gate** (Codex r2-P0-1).
   The runtime gate only sees a fact, not the page, so it cannot check a quote. The
   local batch validates each fact's quote against exactly one captured page and
   records a `validation_result`; the runtime gate trusts that result.
3. **Honesty envelope + machine fields, always.** Every fact carries: `value` ·
   `variant_id` · `edition_year` · `confidence` · `evidence_quote` · `source_url`
   (the specific page the quote is on) · `source_hash` · `validation_result` ·
   `last_checked`. Missing/failed → not published.
4. **Fail closed.** No provable year, mixed-year, ambiguous page, or ambiguous variant
   → the fact fails validation and is not published.
5. **Retention, exact-year keyed.** Data is retained across editions: `current_facts`
   (proven for the current 2026 edition) and `prior_editions[year]` (isolated
   history). History renders NEUTRALLY — "2025 edition: 08:00 — 2026 unverified" —
   never "likely similar" (an unsupported inference), never inside current
   `enriched_facts`.
6. **Freshness is a LIVE state, not a static stamp** (Codex r2-P0-3). A separate,
   cheap, non-LLM monitor persists per-source `fresh | changed | overdue | error`
   state; the MCP checks it per request and the site during ISR; anything not `fresh`
   suppresses the affected current facts until a local re-extraction clears it.
7. **One shared resolved projection** (Codex r2-P0-4). Every surface — race page,
   card, homepage JSON-LD, AI prompts, MCP — reads the SAME `resolveRaceFacts(race)`
   output. Resolution is per-field, never cross-field.

## Machine schema

```
Fact {
  field         : enum (start_time | price | cutoff | confirmed | sold_out |
                        registration_opens_on | registration_closes_on |
                        registration_url | track_link | elevation_profile |
                        mandatory_equipment | feec_licence | aid_stations |
                        kids_race | night | social_link | <character fields>)
  variant_id    : DB-backed distance-variant id, or null for a true event-level fact
  value         : typed per field
  edition_year  : exact int (e.g. 2026) — never "previous"
  confidence    : high | low            (unknown ⇒ omit the fact)
  evidence_quote: verbatim string that MUST occur on source_url's captured page
  source_url    : the specific crawled page carrying the quote (NOT the seed url)
  source_hash   : hash of that captured page (ties the fact to the freshness monitor)
  validation_result : validated | failed | unverified
  last_checked  : ISO date of the batch run
}

RaceEnrichment {
  race_id       : DB-backed
  current_facts : Fact[]   (edition_year == current; validation_result == validated)
  prior_editions: { [year:int]: Fact[] }   (isolated history)
}
```

## Field catalog — per-field GRAIN (Codex r2-P0-2: every actionable field can vary)

Grain columns: **V** = may vary by distance-variant (variant override allowed);
**E** = may vary by edition (year-scoped); **model** = LLM-generated.

| field | V | E | notes |
|---|---|---|---|
| start_time | ✓ | ✓ | staggered starts |
| price / tier | ✓ | ✓ | tiers need a category+validity structure, not just a distance key |
| cutoff | ✓ | ✓ | |
| confirmed | ✓ | ✓ | one distance can be cancelled while others run |
| sold_out | ✓ | ✓ | one distance sells out independently; sourced from the WEEKLY SCRAPER (fresh), not the snapshot |
| registration_opens_on / closes_on | (✓) | ✓ | event default + variant override where stated |
| registration_url | (✓) | ✓ | event default + variant override |
| registration_status | — | — | DERIVED from dates + today + fresh sold-out; never snapshotted |
| track_link (Wikiloc/Komoot/Strava) | ✓ |  | mostly stable |
| elevation_profile | ✓ |  | |
| mandatory_equipment | ✓ | ✓ | ultra vs short differ; can change between editions |
| feec_licence | ✓ | ✓ | |
| aid_stations / self-sufficiency | ✓ | ✓ | |
| kids_race | (✓) | ✓ | organizer-affirmed → kidsRun (U1 shipped) |
| night | ✓ | ✓ | may apply to one variant only |
| social_link (Instagram/Facebook) |  |  | fallback source for website-less races |
| character (unique/cool/catch/who/setting/terrain/technicality/food) | — | — | model tier, stable, persists |

**Event-scalar promotion (completeness rule).** A fact may be published event-level
(variant_id=null) ONLY when EVERY eligible non-kids DB variant has a grounded,
identical, validated value. If any DB variant is missing from extraction, the scalar
is blocked — publish per-variant or not at all (Codex r2-P0-2).

## Resolution + rendering (the one shared projection)

`resolveRaceFacts(race)` resolves each field independently and every surface consumes
it identically (Codex r2-P0-4):
- **Price:** enriched current price > fresh-scraper price; a stale legacy `races.price`
  hides.
- **Sold-out:** a fresh positive scraper sold-out OVERRIDES any date-derived
  registration state.
- **Registration status:** derived only from `opens_on`/`closes_on` + today, labelled;
  unknown or stale inputs → `unknown`.
- **JSON-LD availability:** never `InStock` merely because sold-out is absent; emit an
  availability only from a fresh positive/negative signal. The homepage `EventScheduled`
  default and the `soldOut` injected into AI prompts read from this resolver too.
- **Current vs history:** current_facts render as current; prior_editions render
  neutrally with their year and a "{year} unverified" note; never mixed.

## Freshness state (live, cheap, non-LLM)

A monitor fetches + hashes each source and persists per-source state. A fact whose
`source_hash` no longer matches → `changed` → suppressed until re-extracted. Overdue
(past an event-relative TTL) → suppressed. Monitor error → suppressed (fail closed).
The MCP checks state per request; the site during ISR.

## Consumption (load-bearing)
- Extractor prompt enumerates these fields + grain + "unknown → omit".
- Batch validator proves each quote against one captured page → sets `validation_result`.
- Runtime gate trusts `validation_result`, applies the freshness state + resolver.
- Eval key (human-verified) tests the exact scripted harness for zero false-positive
  actionable facts.

## Slice 1 — LINKS + CHARACTER (low-risk, ships first)

Decided 2026-08-25 (after Codex round 3): publish the enrichment in two slices. Slice
1 is the LOW-BLAST subset — where a wrong value is mildly annoying, not dangerous — so
it ships on a deliberately (and honestly) simpler contract while the high-risk logistics
wait for the full machine contract above. This is NOT a shortcut: the four Codex P0s
target facts a runner *acts on* (start_time, price, cutoff, sold-out, equipment), and
none of them apply to links or honesty-labelled character. Extracted from the durable
corpus (`docs/enrichment/2026-batch/_corpus/`, content-addressed, git-tracked).

**In Slice 1**
- `track_link` (Wikiloc / Komoot / Strava route), `elevation_profile` link,
  `social_link` (Instagram / Facebook) — each: `{ kind, url, source_url, page_hash,
  fetched_at }`.
- CHARACTER (`unique/cool/catch/who/setting/terrain/technicality/food`) — the existing
  taste layer's shape + `claim_strength`, generated from the corpus; extends taste to
  uncovered races. New validated character overrides legacy taste per race (KTD8).

**Explicitly NOT in Slice 1 (deferred to the logistics slice + the full contract):**
start_time, price, cutoff, sold_out, confirmed, registration_*, mandatory_equipment,
feec_licence, aid_stations. Anything a runner sets an alarm by, pays, or needs for
safety waits for semantic validation + durable IDs + live freshness.

**Why the four P0s don't bite here (the honesty argument, not a bypass)**
- *r3-P0-1 semantic proof:* a `track_link` is validated DETERMINISTICALLY — the URL
  parses, its host is on a small allowlist (wikiloc.com / komoot.* / strava.com /
  instagram.com / facebook.com), and it occurs verbatim in a corpus page. No LLM
  field-labelling to be wrong about. Character is honesty-labelled `our_read`, never
  presented as an organizer fact.
- *r3-P0-2 formal schema:* Slice 1 has a small, fully-typed shape (LinkFact +
  CharacterClaim), separate from operational facts, `claim_strength` present.
- *r3-P0-3 freshness:* links + character are `[stable]` (low staleness); each carries
  `page_hash` + `fetched_at` so the later monitor can refresh them, but a stale link is
  low-blast — no live suppression needed in Slice 1.
- *r3-P0-4 identity:* attaches to the existing `(race_url, town)` event identity; a
  mis-attach on a rename costs a link, not a start time. Durable series/edition/variant
  IDs are built with the logistics slice, where they matter.

**Slice 1 honesty rules:** a link publishes only if it parses + is host-allowlisted +
occurs in a corpus page (else omitted, never fabricated). Character never asserts an
organizer fact. Every link carries its `source_url` + `page_hash` + `fetched_at`.

## Open (settle before the LOGISTICS-slice U3 build)
- Exact event-relative TTL + `[stable]` re-confirm cadence → into `docs/rules.md`.
- Any runner-critical field still missing (parking/access? previous winners' times?
  weather exposure?) — add here first.
