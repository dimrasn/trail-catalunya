# Response to Codex Slice-1 review — links-only, character deferred

2026-08-26 · branch `feat/enrich-links-character` · responds to
`outputs/2026-08-26_codex-enrichment-slice1-review-findings_v1.md`

**Verdict accepted in full.** Codex blocked the merge on three confirmed-live honesty
defects. Every one reproduced against the committed bundle before fixing. The root
cause it named is exactly right: the gates proved *URL syntax and substring occurrence*,
never *identity or truth*. Decision (Dima, 2026-08-26): **ship links-only now behind
hardened gates; split character into its own slice** with a real grounding gate.

## Blockers — fixed or deferred

**B1 — cross-race routes (FIXED).** Confirmed: `naturetime.es` hosts many races;
l'Albiol / Ulldemolins / UTSM each published Colldejou's Cursa de Nadal routes,
`source_page` visibly a different race's page.
Fix (`scripts/enrich-extract-links.ts`): links are read from the race's OWN page; on a
shared-organizer domain (one registrable domain hosting ≥2 race seeds) only the seed
page is trusted; a single-tenant race domain is trusted across its own subpages; and any
route claimed by ≥2 distinct events is dropped from all. Result: 0 cross-event routes,
Colldejou routes only on Colldejou, 37 races keep honest route maps.

**B3 — bogus / lookalike social hosts (FIXED).** Confirmed: 15 live — `cdninstagram.com`
CDN assets as "Instagram: v/o1", Facebook `story.php`, `wix` vendor.
Fix: classification now requires the *registrable domain* to be exactly allowlisted
(subdomains OK, substrings never) — kills `cdninstagram`, `strava-embeds`,
`evilwikiloc`-style lookalikes; social paths restricted to real profile handles
(reject story/search/CDN/media/pixel/vendor). Result: 0 bogus socials.

**B2 — fabricated / stale character (DEFERRED, not patched).** Confirmed: "Montseny
natural park" published because "montseny" was a substring of a participant's club name
`CA BAIX MONTSENY`; 269/416 fields had no evidence; stale prior-edition operational lines
leaked. This is not patchable under time pressure — an LLM inventing a plausible `value`
needs field-local semantic validation, and the failing case *had* evidence. Character is
removed from this slice; its grounding gate is specified in
`docs/enrichment/fields-spec.md` ("CHARACTER slice — the grounding gate it must pass"):
evidence required per field, verified in context, provenance on the actual page,
operational content stripped, human answer key + regression fixtures.

## Should-fix

**#4 — evidence cited the seed page, not the matching page (DEFERRED with character).**
Was character-only; links carry correct per-page `source_page`/`page_hash`. Folded into
the character gate (point 3).

**#5 — corpus ID collision + hash ignored links (FIXED).** Corpus id is now
`slug(town)--slug(race)--<race_url-hash>` (the two "Imperial Tàrraco" events are now
distinct; 173 fetched → 173 unique files, asserted). The page hash now binds text AND
the captured links, so a changed href flips the freshness anchor.

## What this branch now ships

Links only: 120 races carry ≥1 link — 37 with a Wikiloc/Komoot/Strava route map, 110
with a scope-tagged (organizer vs race) social channel — each with `source_page` +
`page_hash` + `fetched_at`, rendered event-level on the site + `get_race`, `has_track`/
`has_social` in lists. The durable corpus + fixed crawl remain; the character generator
and its flawed bundle were removed from the branch (git history keeps them).

## Verification

- `scripts/enrich-extract-links_test.ts`: 5 pass — incl. spoof/CDN-host rejection and a
  **whole-bundle invariant** (every emitted URL re-classifies; no route on ≥2 events).
- `node --test app/lib/*.test.mjs`: 97 pass. `deno test --allow-read supabase/functions/
  eval/`: 151 pass. `next build`: 238 pages.
- Spot-checked built HTML: Aristot renders its route map; Amer no longer shows the
  fabricated Montseny character.

Requesting a re-review of the links-only bundle + the B1/B3/#5 fixes before merge.
