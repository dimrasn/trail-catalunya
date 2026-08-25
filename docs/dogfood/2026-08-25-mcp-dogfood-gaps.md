# MCP dogfood — gap list (2026-08-25, agent-cold pass)

Ran ~10 realistic "find me a race" scenarios directly against the live MCP
(`ce161b5`), reasoning as a connected agent. This is the automated/cold pass;
Dima's own connector sessions augment it. Tags: **fix-now** · **enrich** · **park**.

Headline: the agent layer is genuinely strong for the marquee / hard races —
difficulty + taste + drive compose beautifully (the `vh+` ultra query was the best
experience). But three concrete bugs undercut everyday use, and taste/difficulty
coverage is the biggest single lever.

## fix-now (bugs that hurt a normal query)

**G1 · search_races leaks PAST races — highest impact.** `search_races` with no
date filter returned 50 races of which **18 were already past** (Aug 2–25; today is
Aug 25). Worse: the result is capped at 50 and ordered oldest-first, so the default
call is *dominated* by finished races and pushes upcoming ones off the page. An
agent asked "find me a race" gets mostly races that already happened. The **site**
hides past races by default; the MCP parity was missed.
→ Fix: default `search_races`/`whats_on` to `date_from = today` unless the caller
explicitly asks for past. (Same fix we shipped on the site.)

**G2 · `kids_run` filter is dead on the MCP.** `kids_run:true` → **0 races**,
always; no event carries `kidsRun`. The site's kids-run filter works (it sets
`kidsRun` when any variant of an event has a kids-run name). The MCP's event build
doesn't populate `kidsRun`, so the family/kids persona gets nothing.
→ Fix: populate `kidsRun` in the MCP grouping, mirroring `app/lib/races.js`.

**G3 · No way to search for a night race.** "Find me a night race" forces the
agent to pull everything and scan `taste_flags.night` client-side — and with the
50-cap it misses night races beyond the window (only Burriac Atac surfaced;
Aiguafreda / Vallromanes / Torrelles / Avià did not). `taste_flags` exist in the
list but aren't filterable.
→ Fix: add a `night` filter (and likely a `technicality` band filter) to
`search_races`/`whats_on`. Pairs with the Slice-2 start-time data later.

**G4 · Result cap (50) + no relevance sort truncates the useful set.** Order is
oldest-date-first, not the drive-first "primary axis" the instructions name. Once
G1 excludes past races the cap hurts less, but for a broad query upcoming/near
races can still fall off the page. → Fix: exclude-past (G1) first; then consider a
drive-first or date-first-from-today default and/or a higher cap with pagination.

**G5 · 4 of 50 races have null drive time; possible duplicate event.** Null drive
= towns not geocoded → un-rankable on the primary axis (run the "new town"
drive-time backfill). And "Moon Trail Llavaneres" vs "Moontrail Llavaneres" appear
as two events (same town, same date 08-29, same 36 min) — likely a scrape
duplicate or an unmerged day/night pair; one has taste, one doesn't. → Investigate
+ dedup/geocode.

## enrich (data coverage — the biggest lever, now demand-validated)

**G6 · Taste + difficulty coverage is thin across the full 226-race set.** On a
result page, ~58% had no `taste_summary` and ~24% no `difficulty` (unrated: no D+
on every distance). So for many everyday races the agent can't speak to vibe or
difficulty — exactly the axes that make the layer valuable. Taste is Slice-1 (84
profiles); difficulty needs complete D+. → **Slice 2 taste expansion + difficulty
D+ coverage is the highest-value next enrichment.** The dogfood confirms it.

## park

Nothing major surfaced to park. Registration status / start time being absent is
by design (Slice 2 / enrichment pipeline) and the untrusted-content notice already
tells the agent to verify at the url — that honesty posture worked well.

## What worked (keep)

- `vh+` difficulty query: 9 races, all Very hard/Extreme/Brutal, each with a strong
  taste summary — the product at its best.
- `whats_on` weekend window: clean, with drive + difficulty + taste on the marquee
  races.
- `get_race`: works via `id` (search results include `id`); flexible matching
  (slug / url substring). The composition + honesty envelopes are all present.
- Difficulty scale, drive times, and taste honesty labels are solid *where the data
  exists* — which is why G6 (coverage) is the lever, not the mechanics.

## Suggested next actions (from these gaps)

1. One small MCP change bundling **G1 (exclude past) + G2 (kidsRun) + G3 (night/
   technicality filter)** — all parity/bug fixes, deploy via `deploy-mcp.sh`.
2. Then **Slice 2** (G6) — the demand-validated enrichment.
3. G5 (geocode + dedup) rides along opportunistically.

---

## Round 2 — Codex independent pass + what shipped (2026-08-25, MCP `5a72739`)

Codex ran an unbiased cold dogfood (handoff:
`outputs/2026-08-25_codex-dogfood-handoff_v1.md`) and found 3 things this pass
missed + re-ranked. Integrated.

**Shipped this round (deployed + verified live):**
- **G1 past races** — `search_races` now excludes past by default (`include_past:true`
  to opt in). Verified: default earliest = next upcoming; 0 past.
- **G3 night** — real `night` filter on `search_races`/`whats_on`. Verified: 4 real
  night races.
- **Codex #3 `limit`** — was ignored (`limit:1`→50); now honored (capped at 50).
- **Codex #1 honesty (instruction-level patch)** — taste prose can incidentally carry
  a start time / cutoff / price / "sold out"; the INSTRUCTIONS + untrusted-notice now
  forbid relaying any of those as current (verify at url). *The deeper fix — stripping
  operational facts from the taste DATA — is backlogged (Slice-2 regeneration).*
- **Opening-move (Dima's session)** — read training data FIRST when present and shape
  picks to it; never make the user self-categorise into abstract buckets; if no data,
  give concrete pickable races + an open "or tell me". In MCP INSTRUCTIONS + on-ramp prompt.

**Corrected from round 1:** G2 (kids_run) is NOT a simple "dead filter" — there are
0 kids-NAMED races in the DB, but Codex showed kids races DO exist as organizer_facts
in the taste layer (CabróRun "Mini CabróRun", Moontrail "Ironkids"). So the real fix is
to backfill `kidsRun` from taste organizer_facts (below), not a filter bug.

**Backlog, in Codex's combined priority order:**
1. Strip operational facts (start/cutoff/price/sold-out) from the taste DATA, or move them
   to a freshness/edition-tracked envelope (the proper fix behind the instruction patch).
2. Backfill `kidsRun` from taste `kids_race` organizer_facts + a cross-layer consistency check.
3. Data quality: dedup "Moon Trail" / "Moontrail Llavaneres" (same URL/date), fix Llavaneres
   province (GIRONA → Barcelona/Maresme), backfill the ~4 null drive times (geocode).
4. Ordering/pagination beyond the 50-cap (now that past + limit are fixed).
5. Slice-2: expand taste + D+ coverage (the biggest lever — ~58% no taste, ~24% no difficulty).
6. Later: variant-scoped difficulty (Hard event-max can return Moderate matched variants —
   transparent via matched_distances, so parked).
