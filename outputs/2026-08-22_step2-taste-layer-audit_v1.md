# Step 2 taste-layer audit

## BLUF

Do not start U2 or U3 from the current `taste.json`. The generator is deterministic, but its output is not trustworthy: normal source syntax is silently lost, compound claims can change meaning, the exception report is not a publication gate, and several honesty contracts exist only in prose.

The current 92-row output is not 92 valid race profiles. It contains 89 real race profiles plus three summary/meta records. The generator also exits successfully with 166 unresolved exceptions: 98 `unmapped_label`, 48 `no_tag`, and 20 `missing_url_or_town`.

## Code Review Results

Scope: explicit read-only review of the Step 2 handoff, plan v3, registry, generator, generated JSON, exception JSON, source chunks, overrides, fix list, and the existing site/MCP enrichment gates.

Intent: decide whether the current U1 artifact is sound enough to become the source for the page and public MCP, and define a durable exception policy.

Mode: markdown report-only. No source, plan, generated artifact, deploy, branch, or commit was changed.

Reviewers: correctness, testing, maintainability, project standards, security, performance, API contract, reliability, agent-native, adversarial fallback, and one independent validation pass. Security and agent-native review were included because the artifact will feed a public MCP. Reliability and API-contract review were included because one generated file must serve two deployments.

### Triage Groups

- Parsing and publication boundary, apply queue: #1, #3, #4, #5, #6. Make the source-to-field transformation closed and testable before salvaging individual exceptions. Fix #3 and #4 first because later cleanup is unsafe while facts can still disappear silently.
- Honesty at consumption time, apply queue with one product decision: #2, #8. Define edition, consent, authorship, and uncertainty as structured data before specifying the page or MCP projection.
- Artifact rollout, apply queue: #7. Do this only after the canonical artifact passes the first two groups.

### P1 -- High

| # | File | Issue | Reviewer | Confidence |
|---|---|---|---|---:|
| 1 | `docs/enrichment/2026-batch/taste-fields.md:10` | Registry and executable schema disagree | maintainability, adversarial | 100 |
| 2 | `docs/plans/2026-08-22-001-feat-taste-layer-deploy-plan.md:114` | Edition and consent are not bound to source or content identity | adversarial, security | 100 |
| 3 | `scripts/build-taste.mjs:130` | Parser loses routine syntax and conflates compound claims | correctness, testing, API contract, adversarial | 100 |
| 4 | `scripts/build-taste.mjs:147` | Exceptions have no closed-loop source-addressable publish gate | correctness, testing, maintainability, reliability, security, API contract, agent-native, adversarial | 100 |
| 5 | `scripts/build-taste.mjs:193` | Header and block classification corrupt joins and coverage | correctness, adversarial | 100 |
| 6 | `scripts/build-taste.mjs:24` | Claim labels overstate authorship and evidence | correctness, adversarial | 100 |
| 7 | `scripts/build-taste.mjs:251` | Artifact generation and two-surface rollout lack parity guarantees | reliability, adversarial | 100 |
| 8 | `docs/plans/2026-08-22-001-feat-taste-layer-deploy-plan.md:140` | MCP projection and trust plan drop uncertainty | agent-native, security, adversarial | 75 |

- #1 - `taste-fields.md:10-13,35-43,49-51` promises `dima_firsthand`, `organizer_pdf`, `FLAG`, retained slugified labels, and `mandatory_kit`. `build-taste.mjs:20-27,57-79` implements none of those contracts. Failure scenario: Marato Valls de Cardos mandatory gear is an `unmapped_label` exception, so a release-critical field disappears even though the registry calls it supported and high blast. Fix: make one machine-readable registry authoritative for tags, keys, aliases, strength order, and blast class; generate or validate the prose registry and parser from it.

- #2 - KTD5 stores `edition` but makes `last_checked` optional, while also saying profiles are stamped 2026. Sant Galderic's source at `chunk-9.md:36-43` explicitly contains 2025 start data. Failure scenario: a blanket 2026 profile stamp launders the 2025 start into a current organizer fact. KTD7's bare `public_approved:true` has the same identity problem: the note can be edited after approval and remain approved. Fix: store `event_edition` separately from required `source_edition` or `source_year` and `checked_at`, with field-level overrides. Bind consent to `note_id`, exact content hash, approver, and approval time. Honesty prose may block a candidate; it must never authorize publication.

- #3 - `build-taste.mjs:152` takes the text before the first value tag. A leading `[SCRAPE]` therefore becomes an empty value and is omitted at line 161. Ultra Pirineu's sourced start and cutoff at `chunk-5.md:44` disappear, and eight chunk-6 profiles retain only a few fields. `build-taste.mjs:130` also drops colonless substantive bullets without an exception. The first-label and first-tag rule at `build-taste.mjs:137-152` conflates clauses: Marxa Bonesvalls loses a known aid fact because cup policy is unknown, while Burriac Atac publishes an assumed bring-your-own policy under `organizer_fact`. Fix: parse repeated mechanical syntax into atomic clauses, and route semantic compounds to explicit reviewed splits. Add fixtures for leading tags, trailing tags, colonless facts, multiple labels, and mixed known/unknown clauses.

- #4 - The generator logs exceptions at `build-taste.mjs:147,166`, writes canonical output at lines 251-252, and exits 0 with 166 unresolved items. The exception object overwrites the numeric `loc.line` with raw text. Published fields at lines 175-179 also discard source line and raw tag. Failure scenario: a reviewer cannot prove whether a missing fact was an intentional omission, a parser defect, or a changed exception, and a rerun can overwrite a reviewed artifact with another partial artifact. Fix: issue stable exception IDs from source file, numeric line/span, and raw-text hash; preserve source references on every field; consume a checked-in resolution ledger; and fail on new, changed, orphaned, or unresolved publication-relevant exceptions.

- #5 - `build-taste.mjs:193` matches `town:` inside `date/town:`, so at least seven profiles can receive a date-shaped town. The broad H2 parser at line 220 emits `Batch honesty summary`, `Data / honesty notes`, and `Chunk summary` as profiles. The block-wide warning check at line 230 also removes usable content from Trail No Limits and Cursa de la Ratafia because one line is disputed. Failure scenario: the `(race_url, town)` join misses real races while the headline count still reports 92. Fix: parse typed race headers, reject date-shaped towns and meta blocks, reconcile against a stable event inventory, and quarantine a field by default. Quarantine a whole block only for wrong-event data or a wholly unreliable source.

- #6 - `build-taste.mjs:24` maps `geo` to `organizer_fact`; the first tag can also cover authored inference in the same sentence. The generated JSON contains 28 editorial fields marked `organizer_fact`, although the Product Contract at `plan.md:67-70` says editorial is labelled `Our read`. Cursa Neandertal's authored UNIQUE synthesis at `chunk-8.md:91` becomes `organizer_fact` at `taste.json:3437-3439`. Phrases such as `none mentioned` also escape the narrow unknown classifier at `build-taste.mjs:28-34` and can be published as facts. Fix: separate authorship from evidentiary basis, classify each clause, map geography to `our_read` or `derived`, and expand the unknown/source-silence vocabulary before publication.

- #7 - `build-taste.mjs:251-252` replaces `taste.json` and its exception report through independent writes. The plan then auto-deploys the site but copies and deploys the MCP manually at `plan.md:186-190`. Failure scenario: interruption leaves mismatched local artifacts, or a normal site push exposes a newer taste revision than the public MCP indefinitely. Fix: generate one versioned candidate bundle with `schema_version`, source digest, and content digest; validate it before atomic promotion; retain last-good; and verify both deployed surfaces expose the same digest.

- #8 - KTD8 says list tools return `special + who`, but does not require those compact values to retain claim strength or edition state. U3 extends the untrusted notice only to `evidence` and `honesty` at `plan.md:180-182`, although attributes, editorial text, and runner notes are also free text. Failure scenario: an agent treats an inference as an organizer fact or follows an imperative-looking taste value as an instruction. Fix: use typed `PublicTasteField` objects in compact output, or expose only `taste_available`; mark the complete `taste` subtree as untrusted data in tool descriptions and protocol instructions.

### Requirements Completeness

- U1 deterministic generation: met. A clean rerun in a temporary directory produced byte-identical `taste.json` and `taste-exceptions.json`.
- KTD2 source addressability and no silent drops: not met; see #3 and #4.
- KTD3 fail loud on unmapped tags: not met; see #1 and #4.
- KTD4 zero unknown-sentinel publication: not met. The classifier misses source-silence variants such as `none mentioned`; see #6.
- KTD5 edition and staleness: known incomplete, and the planned identity model needs #2 before implementation.
- KTD7 overrides and runner consent: known incomplete, and consent needs the content-binding change in #2.
- KTD9 difficulty exclusion: met in the generator. Aid remains present only where the parser succeeds.
- U1 golden tests, live join check, overrides, and consent gate: known incomplete per the handoff. They are not re-reported as separate defects.
- U2, U3, and U4: not built. Their plan is blocked by #2, #7, and #8 even after U1 is repaired.

### Exception Policy

Recommendation: target zero unclassified publication-relevant exceptions, not zero exceptions. An exception is a valid workflow state only after it has a durable disposition. Do not hand-edit `taste.json`, and do not rewrite immutable source chunks to satisfy parser heuristics.

Use a checked-in `taste-exception-resolutions.json` keyed by a stable ID derived from `source_file + numeric source_line/span + raw_text_sha256`. Each record should contain:

- `status`: `resolved`, `accepted_omit`, or `blocked`.
- `disposition`: `parser_rule`, `schema_alias`, `manual_split`, `intentional_omit`, `field_quarantine`, or `block_quarantine`.
- For published fields: canonical key, value, claim strength, source URL, source edition/year, checked date, and field-level rationale.
- Governance: reviewer, review date, and the raw-text hash that was actually reviewed.

The generator should produce a complete consumption ledger. Every eligible source bullet must end as `published`, `omitted_unknown`, `dropped_out_of_scope`, `excluded_block`, `resolved_exception`, or `unresolved_exception`. Counts must reconcile exactly. A new, changed, orphaned, or unresolved publication-relevant exception must exit non-zero without replacing the last-good artifact.

Promote a parser rule only for repeated, one-to-one syntax. Keep mixed semantic bullets as explicit manual splits. An LLM may propose a resolution-ledger patch, but it must never write directly to the canonical output or authorize publication.

Release blockers are join/key failures; source-edition ambiguity; `start_time`, cutoffs, mandatory kit, and access/parking; runner consent; and any case that turns inference or source silence into an organizer fact. Salvage night, topology, technicality, aid, and self-sufficiency next. Low-value editorial or seasonal omissions may remain omitted only with an explicit reviewed disposition. Quarantine one field for one-field conflicts; quarantine the whole race only when event identity or the complete source is unreliable.

### Actionable Findings

| Priority | Findings | Route | Required response |
|---|---|---|---|
| 1 | #3, #4 | `gated_auto -> downstream-resolver` | Replace silent parsing with atomic extraction, source refs, fixtures, and a complete consumption ledger. |
| 2 | #1, #5, #6 | `gated_auto/manual -> downstream-resolver` | Make the registry executable, repair block/key classification, and correct honesty labels. |
| 3 | #2 | `manual -> downstream-resolver` | Define source edition and content-bound consent before merging overrides. Dima still approves final runner wording. |
| 4 | #7, #8 | `gated_auto -> downstream-resolver` | Add atomic bundle parity, typed MCP projections, and a whole-subtree trust boundary before U2/U3 deployment. |

### Agent-Native Gaps

- The current public field shape cannot explain or verify its source because field-level provenance is discarded (#4).
- The compact MCP contract can erase uncertainty that the full profile and page are meant to show (#8).
- Manual exception repair has no durable input for a later agent or generator run (#4).

### Coverage

- Generator verification: rerun in a temporary directory; 12 chunks, 123 blocks, 31 warning-excluded blocks, 92 output rows, 166 exceptions. Both generated files matched the reviewed artifacts byte-for-byte.
- Data checks: 92 output rows contain 89 real race profiles plus three meta profiles; 28 editorial fields are labelled `organizer_fact`; date-shaped towns and source-silence facts were reproduced.
- Validator: one fresh batch checked all eight merged P1 findings; 8 of 8 validated.
- Cross-model review: the Claude peer job produced no artifact because the review helper saw no tracked diff while this handoff explicitly scoped untracked files. A local adversarial fallback completed. This is a coverage limitation; do not describe the review as cross-model corroborated.
- Performance: no concrete issue at the current corpus size. Minified taste JSON is about 156 KB, with the largest profile about 2.8 KB. Keep the planned 50-result MCP response-size fixture.
- Testing gaps: add golden fixtures for tag position, compound clauses, header variants, unknown-language values, exact source-reference round trips, exception-ledger stability, faulted atomic promotion, deployed digest parity, content-bound runner consent, prior-edition high-blast fields, and every partial/absent MCP projection.
- No P0 is assigned because this code is not live. All eight P1 findings are release blockers for U2/U3, not production incidents.

### Top 3 Fixes

1. Rebuild the generator boundary first. Use one executable registry, atomic clause parsing, exact source references, and corpus-reconciliation tests. This resolves #1, #3, #5, and most of #6.
2. Make exceptions and honesty state durable. Add the resolution ledger, explicit source edition, field-level quarantine, and content-bound consent. This resolves #2 and #4 and makes Dima's exception review meaningful.
3. Ship one verified public artifact. Promote a versioned digest atomically, require site/MCP parity, preserve uncertainty in compact MCP fields, and mark the complete taste subtree untrusted. This resolves #7 and #8.

---

### Verdict

Not ready. The deterministic rerun is a useful property, but it deterministically reproduces silent loss and mislabeled claims. Fix the generator and exception publication boundary before basing page or MCP work on `taste.json`.

Prioritized actionable recap:

1. P1, `scripts/build-taste.mjs:130,147` - stop silent parsing and make every exception source-addressable and release-gating (#3, #4). Mechanical implementation plus fixtures.
2. P1, `docs/enrichment/2026-batch/taste-fields.md:10` and `scripts/build-taste.mjs:24,193` - establish one executable schema, honest claim labels, and correct event keys/coverage (#1, #5, #6). Mechanical work with one claim-model decision.
3. P1, `docs/plans/2026-08-22-001-feat-taste-layer-deploy-plan.md:114` - bind operational freshness to source edition and runner approval to exact content (#2). Contract decision, then implementation.
4. P1, `scripts/build-taste.mjs:251` and `plan.md:140` - add atomic artifact parity and preserve MCP uncertainty/trust semantics (#7, #8). Mechanical rollout work after U1 is trustworthy.
