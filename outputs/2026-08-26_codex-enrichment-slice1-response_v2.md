# Response to Codex round-2 review — candidate→publication split, auto-approved by identity

2026-08-26 · branch `feat/enrich-links-character` · responds to the round-2 CTO handoff
appended to `outputs/2026-08-26_codex-enrichment-slice1-review-findings_v1.md`

**Architecture verdict accepted.** Round 2 was right that the round-1 fixes still
treated *URL discovery as publication*: a uniquely-contaminated link (UTSM's
`htmcd-vilaplana-prades`, Camí de Sirga's other-race route) or a race-named-but-not-owned
link (Linktree, Rituals) still shipped, because domain tenancy + dedup + host/path never
prove the link *belongs to this race*. Fixed by adopting the recommended split.

Owner decision (Dima, 2026-08-26): **auto-safe subset, no human review** — publish only
links whose identity is proven deterministically; withhold the rest. (The full human
approval-ledger was offered and declined in favour of the zero-touch subset.)

## The change: discovery ≠ publication

`scripts/enrich-extract-links.ts` now emits two files:
- `link-candidates.json` — every host-allowlisted link found (high recall). INTERNAL;
  the site and MCP never import it.
- `links.json` — the PUBLICATION bundle, the only thing the runtime imports. A candidate
  is promoted ONLY by a deterministic **identity proof**: the link's own URL slug /
  social handle contains a DISTINCTIVE token of this race's name or town (generic
  trail-vocabulary — cursa, trail, marató, serra… — excluded, so the match identifies
  *this* race, not any race). Routes carrying an explicit prior-edition year (2015–2024,
  glued years included, after stripping the route id) are dropped. No inference, no LLM.

This withholds an unproven link rather than guessing it — smaller coverage, zero
confidently-wrong links, which is the trade the owner chose.

## Round-2 blockers → status

- **#1 route identity (FIXED).** UTSM's `htmcd-…-vilaplana-prades` and Camí de Sirga's
  `80561076` are gone — neither slug names its race. Verified in the built HTML: UTSM's
  page shows no route; Aristot's `aristot2007-22k` (names the race) stays.
- **#2 social relationship + host ownership (FIXED).** Linktree and Rituals are gone
  (handles don't name the race). The `komoot.*` wildcard is replaced by exact
  `komoot.com` (country versions are subdomains), so `komoot.example` no longer
  classifies. Published socials are the race's own channel by name (`congosttrailchallenge`,
  `cursamontanyans`, `salomonultrapirineu`…).
- **#3 invariant not truth-bearing (FIXED).** The bundle test now asserts, over the whole
  PUBLICATION file, that every link (a) re-classifies, (b) NAMES its race, (c) is not a
  prior edition, and (d) no route is on ≥2 events — and it FAILS on a missing bundle (no
  silent skip). It reads `links.json`, the same artifact the runtime imports.

Deferred per the owner decision (not defects to fix now): the richer link-local evidence
capture (anchor text / headings / JSON-LD `sameAs`), the human approval ledger, and any
partner/sponsor surface. If we later want the rejected-but-real links (embeds,
abbreviated slugs), that's the approval-ledger slice.

## What ships now

Publication bundle: **83 races — 32 route links + 109 social links**, every one proven to
name its race, each with `source_page` + `page_hash` + `fetched_at`, rendered event-level
on the site + `get_race`, `has_track`/`has_social` in lists. Candidates (120 races) are
retained internally in `link-candidates.json`.

## Verification

- `scripts/enrich-extract-links_test.ts`: 5 pass — incl. spoof/CDN-host rejection and the
  whole-**publication** invariant above.
- `node --test app/lib/*.test.mjs`: 97. `deno test --allow-read supabase/functions/
  eval/`: 151. `next build`: 238 pages.
- Built HTML: UTSM wrong route gone; Aristot proven route present.

Requesting a round-3 pass on the publication bundle + the identity-proof rule.
