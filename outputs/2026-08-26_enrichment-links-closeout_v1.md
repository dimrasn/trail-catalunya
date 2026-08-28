# Enrichment links — closeout (shelved)

2026-08-26 · branch `feat/enrich-links-character` · status: **SHELVED, not merged, not deployed**

## What this was

Slice 1 of race enrichment: add route maps (Wikiloc/Komoot/Strava) + social channels
(and, initially, generated character) to race pages and the MCP agent layer, extracted
from a local crawl of each race's official site. Built end-to-end, reviewed by Codex over
three rounds, then shelved by owner decision. Nothing reached production.

## How it ended, and why

Three Codex reviews, each blocking, converged on one root cause: **URL/text overlap
cannot prove a link belongs to a race.**

- **Round 1** — generated character published fabrications ("Montseny natural park" from a
  participant's club name; 269/416 fields evidence-free; stale prior-edition logistics).
  → character split out to its own future slice.
- **Round 2** — links still shipped a sibling race's route on a shared organizer domain
  (Naturetime), lookalike/CDN social hosts. → fixed host-exact matching, seed-page/tenancy
  rule, cross-event dedup, corpus-id collision, links-in-hash.
- **Round 3** — the remaining deterministic rule (publish a link whose slug/handle names
  the race) still leaked: a **town-named race collides with its municipality's account**
  (`ajllavaneres` for Moon Trail Llavaneres), sponsor/collaborator handles contain the
  town (`bonarea.santllorencsavall`), and 2025/`aristot2007` routes showed as current.

The tightening never converged because the signal isn't there: from a flat URL + text
corpus, "the race's Instagram" and "the town hall's Instagram" are indistinguishable when
the race is named after its town. Honest auto-coverage (no human) collapsed to ~8 races.

Owner options were: (a) a ~15-min human approval pass, (b) shelve, (c) routes-only ~8
races, (d) re-crawl for link-local evidence. **Decision: shelve** — the harm guarded
against is low (a wrong route map / a sponsor's IG is annoying, not dangerous) and it was
not worth more effort now.

## What ships from this branch

Nothing to production. The branch is a preserved starting point. If it is ever merged, it
changes NO runtime behaviour (the site + MCP are reverted to their pre-links state).

## Reusable groundwork kept (sound, tested)

- **Durable corpus** `docs/enrichment/2026-batch/_corpus/` — 173 races, content-addressed
  (url-hashed ids, page hash binds text + links), provenance manifest. Reproducible.
- **Fixed crawl** `scripts/enrich-crawl.ts` — captures per-page outbound links; unique ids.
- **Candidate extractor** `scripts/enrich-extract-links.ts` → `link-candidates.json`
  (INTERNAL, imported by nothing) + its **classifier** (host-exact allowlist, route/social
  shape, spoof/CDN/vendor rejection, seed-page/tenancy, cross-event dedup), locked by
  `scripts/enrich-extract-links_test.ts` (5 tests: classify, spoof-host, extract).
- `supabase/functions/enrich-races/fetch.ts` — additive `extractOutboundUrls` +
  `fetchRacePagesWithLinks` (the text-only pipeline is unchanged).

Removed as rejected: the string identity-proof publication rule + `links.json` + the
generated character bundle/generator (all recoverable from git history).

## If links come back — the bar (from the reviews)

In `docs/enrichment/fields-spec.md` ("Slice 1 — SHELVED"): capture link-LOCAL evidence at
crawl time (anchor/alt/aria/nearest-heading/JSON-LD `sameAs`); publish a *relationship*
(race/organizer/town/partner), never a host match, and never from under a
"Patrocinadors/Col·laboradors" heading; derive edition from the event date; validate with
an INDEPENDENT hand-verified rejection corpus, not the publisher's own predicate.

## Cold-start reading order for a revival

1. This closeout.
2. `docs/enrichment/fields-spec.md` — "Slice 1 — SHELVED" (the bar) + "CHARACTER slice".
3. `outputs/2026-08-26_codex-enrichment-slice1-review-findings_v1.md` — the three review
   rounds with concrete failing cases (the future rejection corpus).
4. `scripts/enrich-extract-links.ts` + `_test.ts` — the sound classifier to build on.
5. `scripts/enrich-crawl.ts` — where to add link-local evidence capture.
