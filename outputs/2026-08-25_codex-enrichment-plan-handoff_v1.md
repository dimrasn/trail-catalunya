# Codex handoff — review the enrichment machine-contract + plan (round 3)

**For:** the external reviewing agent (Codex) that returned the round-1 and round-2
verdicts (both "not build-ready for publication"). This is round 3. **Read-only:**
review and report; do NOT implement, crawl, extract, deploy, or edit code.

## What to review, and where
Repo `origin/main` @ `2714693` (the trailraces.cat / trail-catalunya project).
1. **`docs/enrichment/fields-spec.md`** — the MACHINE CONTRACT. This is the primary
   review target: your round-2 verdict said the gating artifact is a precise
   data-contract, and this is it (Fact record shape, per-field grain matrix,
   validation timing, freshness state, resolver).
2. **`docs/plans/2026-08-25-002-feat-enrichment-phase-plan.md`** — the plan (r3) that
   builds to the contract.

## ⚠ Read `main`, not the working tree
Parallel sessions leave the working directory on a feature branch; both prior passes
false-flagged files (`scripts/deploy-mcp.sh`, the dogfood file, and — round 2 — they
still exist) as missing. Read `origin/main` (or `git worktree add <tmp> origin/main`).

## Product context (so you can judge "honest")
trailraces.cat is an AI-agent-friendly race-discovery layer for Catalonia (229 races,
129 upcoming); the crown jewel is a public Supabase MCP the user's Claude/ChatGPT
connects to. Its whole value is **honesty** — "never fabricate, verify at the url."
The enrichment phase adds operational facts (start_time, price, registration, etc.)
+ character, across all races. **The load-bearing risk is publishing a
confidently-wrong fact, which is worse than a gap.** Governing rules: `AGENTS.md`,
`docs/rules.md`, and `fields-spec.md`.

## The decided design (settled with the user; not up for re-litigation, but flag risks)
- **Local scripted-Haiku one-off** (~$3–4, dedicated spend-limited key), NOT the
  metered cloud cron (demoted; its non-LLM crawl/change-detection is reused as the
  freshness monitor). This is the only engine with eval-parity.
- **One pass → operational facts AND character** (so taste expansion is free output).
- **Retention across editions:** current-proven facts render current; prior-edition
  facts render as a neutral dated prior ("2025 edition: 08:00 — 2026 unverified"),
  never as current; stable facts + character persist.
- **Validation at batch-promotion** (has page content), runtime gate trusts the
  recorded `validation_result`.

## What shipped since your round-2 review (context, not for review)
- The connector already got real fixes live: past-races excluded by default, a `night`
  filter, `limit` honored, and the kids/night flags backfilled from organizer facts
  (kids filter 0→13). A town-corrections layer fixed the Llavaneres duplicate +
  province (one Barcelona event now).
- **The local crawl ran: 171/229 pages fetched, 58 → fix-list** (JS-only / Instagram /
  dead). So the corpus the extraction will run on EXISTS; the 58 failures are real
  input (many need Instagram/agent-browser or manual override).

## What changed vs your round-2 review (verify each landed in the contract/plan)
Your four P0s + three P1s:
- **r2-P0-1 (contract can't encode proof/retention)** → machine `Fact`
  {`variant_id`, exact `edition_year`, page-specific `source_url`, `source_hash`,
  `evidence_quote`, `validation_result`}; `current_facts` vs `prior_editions[year]`;
  proof moved to BATCH-PROMOTION; "likely similar" removed; DB-year is a negative veto.
- **r2-P0-2 (grain incomplete)** → per-field V/E grain matrix for every actionable
  field (sold_out, confirmed, equipment, licence, aid, night, registration, price
  tiers); event-scalar only on a completeness rule (all DB variants agree, none missing).
- **r2-P0-3 (sentinel can't suppress the bundle)** → freshness is a LIVE per-source
  state (a PREREQUISITE unit) the MCP checks per request / the site during ISR;
  not-`fresh` suppresses the fact.
- **r2-P0-4 (precedence + missed surfaces)** → one shared `resolveRaceFacts()` with
  per-field resolution, consumed by race page, card, homepage JSON-LD, AI prompts, MCP.
- **P1-5/6/7** → executable eval command + broad fixtures + zero-false-positive;
  pinned-SHA + payload-hash from BOTH surfaces + mixed-version safety; character
  precedence (new overrides legacy for processed races).

## Review asks (ranked)
1. **Is the machine contract (`fields-spec.md`) now build-ready?** Can the `Fact`
   record + grain matrix + validation timing actually be implemented as specified,
   and do they close your four P0s — or is there a residual way to publish a
   confidently-wrong variant, edition, availability, or safety fact?
2. **Retention / dated-prior:** does rendering last year's fact as a neutral dated
   prior reopen any prior-edition-as-current risk? Is the non-LLM DB-year veto right
   given no-parseable-year and cross-year events?
3. **Freshness-as-live-suppression:** is the per-source state + TTL + fail-closed
   design sound, and is placing it before publication sufficient?
4. **The one resolver across all surfaces:** did the inventory (race page, card,
   homepage JSON-LD, prompts, MCP) miss any operational read path?
5. **Given the crawl reality (58/229 unreachable),** is the fix-list/override posture
   honest, and does the plan handle the website-less races without fabricating?
6. **Anything still blocking** — and your diff against this revision.

## Constraints
Read-only. The honesty bar is absolute: a confidently-wrong published fact is a phase
failure.

## Return
Ranked findings (severity · section · concrete failure · fix) + a verdict: is the
contract + plan now build-ready for publication, and is the honesty design strong
enough to guarantee a confidently-wrong fact cannot publish?
