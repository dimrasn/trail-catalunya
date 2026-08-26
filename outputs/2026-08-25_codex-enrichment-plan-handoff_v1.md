# Handoff — re-review the enrichment-phase plan (round 3)

**For:** the external reviewing agent (Codex) that returned the round-1 verdict
"not build-ready for publication." This is the revised plan addressing your six
findings + Dima's decisions. **Read-only:** review and report; do not implement.

**Plan:** `docs/plans/2026-08-25-002-feat-enrichment-phase-plan.md` (on `main`).
**Schema:** `docs/enrichment/fields-spec.md` (new — the canonical field contract the
plan builds to).

## ⚠ Read `main`, not the working tree
The round-1 pass false-flagged `scripts/deploy-mcp.sh` and the dogfood file as
missing; both exist on `origin/main`. Review `origin/main`.

## What changed since your ROUND-2 review (the four P0s)
Your round-2 verdict ("not build-ready; close the four P0 contract/freshness gaps")
is addressed. The gating artifact is now a MACHINE CONTRACT in
`docs/enrichment/fields-spec.md`:
- **r2-P0-1 (contract can't encode proof/retention)** → a machine `Fact` record
  (`variant_id`, exact `edition_year`, page-specific `source_url`, `source_hash`,
  `evidence_quote`, `validation_result`) + separated `current_facts` vs
  `prior_editions[year]`. Proof moved to BATCH-PROMOTION (U4) where the page exists;
  the runtime gate trusts `validation_result`. "Likely similar" removed — history
  renders neutrally. DB-year is a negative veto, not positive proof.
- **r2-P0-2 (grain incomplete)** → per-field grain matrix marks V (variant) + E
  (edition) for every actionable field (sold_out, confirmed, equipment, licence, aid,
  night, registration, price tiers); event-scalar only on a completeness rule (all DB
  variants agree, none missing) — U4/KTD4.
- **r2-P0-3 (sentinel can't suppress the bundle)** → freshness is a LIVE per-source
  state (U6, a PREREQUISITE before publish) the MCP checks per request and the site
  during ISR; not-`fresh` suppresses the fact. The cheap non-LLM monitor is automated
  (kept, not demoted).
- **r2-P0-4 (precedence + missed surfaces)** → one shared `resolveRaceFacts()` with
  per-field resolution, consumed by race page, card, homepage JSON-LD, AI prompts, and
  MCP (the missed consumers) — U5, one parity-tested projection.
- **r2-P1-5/P1-6/P1-7** → executable eval command + broad fixtures + zero-false-positive
  (U7); pinned-SHA + payload-hash exposed from BOTH surfaces + matched + mixed-version
  safety (U8/KTD9); character precedence — new overrides legacy taste for processed
  races (KTD8).

## What changed since your round-1 review (verify each landed)
Your six findings + Dima's product decisions are folded in:
- **P0-1 variant grain** → facts that vary by distance (start_time, price, cutoff)
  are variant-scoped in the schema (`fields-spec.md`) and enforced in U3/U4; an
  event scalar only when all non-kids variants agree.
- **P0-2 edition not fact-grounded** → U4 adds fact-local proof (evidence quote must
  exist on the page) + fail-closed + a NON-LLM cross-check of the page year against
  the DB's known date; mixed/unresolved → hidden.
- **P0-3 taste isn't the only operational source** → new U5 reconciles the existing
  sold-out / race-page price / JSON-LD availability into one precedence contract;
  nothing live published without freshness.
- **P1-4 freshness not enforced** → U4/U8 make it code: missing/invalid `last_checked`
  hides; event-relative TTL hides overdue; a non-LLM change sentinel (reusing
  `changes.ts`) suppresses facts when a source changes; the re-crawl N goes to
  `docs/rules.md`.
- **P1-5 eval didn't test production** → engine flipped to a SCRIPTED Haiku one-off
  (reusing `extract.ts`'s `callAnthropic`, dedicated spend-limited key, ~$3–4 one-off),
  and U6's eval runs that EXACT harness against a HUMAN-verified key incl. a
  mixed-edition fixture.
- **P1-6 durability** → U2 corrects BOTH the site JSON and the `towns` table + a
  post-scrape override so the weekly scraper can't revert it.
- **Your "other calls"** → same-versioned-change (not atomic cross-target deploy,
  SHA-verified both surfaces); `mcp/enrichment.json` path corrected to
  `supabase/functions/mcp/enrichment.json`; `source_url` added to the MCP fact.

Dima's product decisions also folded: **local scripted batch** (cloud cron demoted);
**one Haiku pass → BOTH operational facts AND character** (so taste expansion is free
output, not a manual grind); and the **retention model** — this reconciles your
"never publish prior-edition as current" with Dima's "keep it, it repeats": data is
retained across editions; current-proven facts show current, prior-edition facts show
as a DATED PRIOR ("2025 — likely similar, verify"), `[stable]` facts + character persist.

U1 (flag backfill) is already SHIPPED (kids filter 0→13, verified live).

## Review asks (ranked)
1. **Does the retention / dated-prior model actually close your P0-2 concern,** or
   does "show last year's as a dated prior" reopen the prior-edition-as-current risk
   in a new form? Is the non-LLM DB-date cross-check sufficient given no-parseable-year
   and mixed-edition pages?
2. **Is the variant-scoping (U3/U4) complete** — any operational field still modeled
   event-level that shouldn't be? Does the "event scalar only if all variants agree"
   rule have a failure mode?
3. **U5 source reconciliation** — is the precedence (enriched > fresh-scraper sold-out
   > legacy price) right, and did the inventory miss an operational read path?
4. **U6 production-parity eval** — is running the exact scripted harness against a
   human key enough, and is the mixed-edition fixture the right hardest case?
5. **Same-versioned-change (U7/KTD8)** — is SHA-verify across two deploy targets an
   adequate substitute for atomicity, or is there still a window?
6. **Anything still missing** — your diff against this revision is the highest value.

## Constraints
Read-only. The honesty bar is absolute: a confidently-wrong published fact is a
phase failure, worse than a gap.

## Return
Ranked findings (severity · section · concrete failure · fix) + a verdict: is the
revised plan now build-ready for publication, and is the honesty design sound?
