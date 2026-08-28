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

## Slice 1 — SHELVED (character split out, then links shelved, 2026-08-26)

Decided 2026-08-25, then reworked and finally SHELVED 2026-08-26 across three Codex
reviews. Nothing from this slice ships to production. What remains on the branch is
reusable groundwork; the closeout is `outputs/2026-08-26_enrichment-links-closeout_v1.md`.

- **CHARACTER — deferred (Codex round 1).** The generated character published
  confidently-wrong facts (a fabricated "Montseny natural park" that passed an 8-char
  substring evidence check because "montseny" was inside a *participant's club name*;
  269/416 fields with no evidence; stale prior-edition operational lines). Deferred to
  its own slice with the grounding gate below.
- **LINKS — shelved (Codex rounds 2–3).** URL discovery is not proof that a link
  BELONGS to a race. Every deterministic no-review rule leaked a confidently-wrong link:
  host/tenancy/dedup let a sibling race's route through; then a slug/handle name-match
  let through a *town-named race's municipality account* (`ajllavaneres`), sponsor/
  collaborator handles that contain the town (`bonarea.santllorencsavall`), and
  prior-edition routes. The root cause is structural: **name overlap ≠ relationship
  identity, and it cannot be established from a flat URL + text corpus.** Owner decision
  (declining a ~15-min human approval pass): shelve links rather than ship a leaky subset.

**What a future links slice needs (the bar three rounds established):**
- **Link-LOCAL evidence at crawl time** — each link's anchor text, image alt, `aria-label`,
  the nearest heading/section label, page title/canonical, and JSON-LD `sameAs`. The
  current corpus stores only a flat `links[]`, which is why identity can't be proven.
- **A relationship, not a host match** — publish `race` only from strong evidence (a full
  normalized-name fingerprint, or context that is NOT under a "Patrocinadors /
  Col·laboradors / Amb la col·laboració de" heading); otherwise keep an evidenced
  `organizer`/`town`/`partner` relationship or withhold. No `unknown` relationship ships.
- **Edition from the event date** — treat every non-current route year as non-current
  (no hard-coded lower bound; `aristot2007` and 2025 routes both fail).
- **An INDEPENDENT rejection corpus** — a hand-verified fixture of municipality/sponsor/
  collaborator/partial-collision/2025/pre-2015 cases the gate must reject. A test that
  re-runs the publisher's own predicate certifies its own bugs (Codex round-3 #3).

**Reusable groundwork kept on the branch (sound, not shelved):**
- The durable content-addressed corpus (`_corpus/`, url-hashed ids, links bound into the
  page hash) and the fixed crawl (`scripts/enrich-crawl.ts`).
- The candidate extractor (`scripts/enrich-extract-links.ts` → `link-candidates.json`,
  INTERNAL) + its classifier, `_test.ts`-locked:
- **Host identity (Codex B3 + r2 #2):** a link classifies only if its host's *registrable
  domain* is exactly `wikiloc.com` / `komoot.com` / `strava.com` / `instagram.com` /
  `facebook.com|fb.com` (subdomains OK — `de.komoot.com`, `ca.wikiloc.com`). Substring/
  wildcard matching is banned — it admitted `cdninstagram.com`, `strava-embeds.com`,
  `evilwikiloc.example`, and (via a `komoot.*` wildcard) `komoot.example`.
- **Route shape:** a track must be a route-shaped path (id-bearing slug / `tour/<id>` /
  `routes|activities|segments/<id>`), never a user/club/root/embed-twin.
- **Social shape:** a real profile handle only — reject roots, share/story/search/pixel/
  CDN/media paths, numeric page-ids, and CMS/vendor footers (`wix`, `wordpress`…).
- **Event identity (Codex B1):** links are read from the race's OWN page; on a shared-
  organizer domain (one registrable domain hosting ≥2 race seeds, e.g. `naturetime.es`)
  only the seed page is trusted, because a followed subpage may be a *sibling race*.
  Any route claimed by ≥2 distinct events is dropped from all (unprovable identity).
- **Provenance:** every link carries `source_page` (the exact page it was on) +
  `page_hash` + `fetched_at`. The page hash binds BOTH text and the captured links, so
  a changed href flips the freshness anchor (Codex should-fix 5).
- **Event-level, never per-distance.** Corpus id = `slug(town)--slug(race)--<url-hash>`
  so two same-named events in one town don't collide (Codex should-fix 5).

**Explicitly NOT in Slice 1:** start_time, price, cutoff, sold_out, confirmed,
registration_*, mandatory_equipment, feec_licence, aid_stations — the logistics slice +
the full machine contract above (Codex round-3's four P0s apply THERE).

## CHARACTER slice — the grounding gate it must pass (from the Codex B2 finding)

Character generation returns when it can meet ALL of these; until then no generated
character ships:
1. **Evidence REQUIRED per published field** — no evidence, no publish (drop the
   269-field evidence-free tail entirely).
2. **Evidence verified IN CONTEXT, not by substring** — the quote must support the
   field's actual claim (the "montseny" ⊂ "CA BAIX MONTSENY" match must fail);
   word-boundaried, semantically checked.
3. **Provenance points at the ACTUAL page** the quote is on, not the seed page
   (Codex should-fix 4) — the cited `page_hash` must verify the cited quote.
4. **Operational content deterministically STRIPPED from character values** — dates,
   times, cutoffs, prices, capacity, registration rules, equipment: none of these may
   ride in as "character," even edition-stamped.
5. **A human-verified answer key + whole-bundle regression tests** (the Amer/Vilarnau/
   Duextrem cases become fixtures) — model self-labelling is not a gate.

## Open (settle before the LOGISTICS-slice U3 build)
- Exact event-relative TTL + `[stable]` re-confirm cadence → into `docs/rules.md`.
- Any runner-critical field still missing (parking/access? previous winners' times?
  weather exposure?) — add here first.
