# Handoff — review the enrichment-phase plan (independent pass)

**For:** an external reviewing agent (e.g. Codex). **Read-only:** review and report;
do NOT implement, crawl, extract, deploy, or edit code.

**Plan:** `docs/plans/2026-08-25-002-feat-enrichment-phase-plan.md` (on `main`).

## ⚠ Read `main`, not the working tree
Parallel sessions leave the working directory on a feature branch. The internal
reviewers hit this twice — flagging `scripts/deploy-mcp.sh` and
`docs/dogfood/2026-08-25-mcp-dogfood-gaps.md` as "missing" when both exist on
`origin/main`. Review `origin/main` (or `git worktree add <tmp> origin/main`).

## What the plan does
The data-fill phase: make the agent layer trustworthy across all 229 races by
collecting operational facts (start_time, price, confirmed_status), fixing derived
flags from organizer data, cleaning data-quality defects, and closing the
operational-facts-in-taste honesty leak. **Key decision (Dima): collect operational
facts as a LOCAL, agent-driven batch over ~200 mostly-static pages → a committed
bundled `enrichment.json` (the `taste.json` pattern), NOT the metered cloud
`enrich-races` pipeline (demoted to a freshness fallback).**

## What the internal review already changed (verify these hold; don't re-derive)
Three CE reviewers (coherence/feasibility/adversarial) ran; the adversarial pass read
the actual reused gate code and found the important issues. The plan now reflects:
- **The reused gates were BUILT BUT NEVER RUN ON REAL DATA and had honesty holes** —
  hardening them (U4) is a prerequisite to publishing any fact: (a) edition detection
  was circular (the model self-judges 2025-vs-2026; a "2025 banner + 2026 registration"
  page could publish last year's start time as current) → a **non-LLM DB-date
  cross-check** now forces `edition:previous`→low on a year mismatch; (b) **price had no
  staleness ceiling** → now rendered "as last checked {date}"; (c) the **site and MCP
  gates disagreed** on low-confidence high-blast facts (site hides, MCP published) →
  reconciled to both-hide + a real parity test.
- **Free engine clarified:** extract via an in-session AGENT workflow (batched fan-out —
  200 pages don't fit one context), reusing only validation + gate + types, NOT
  `extract.ts`'s metered `callAnthropic`. (Scripted one-off noted as a ~$3–4 alternative.)
- **Eval answer key is HUMAN-verified (Dima), not agent-self-graded**, with a
  mixed-edition fixture (the case the edition bug bites).
- **Taste-strip happens at the source and in the SAME deploy** as enrichment (no
  double-source window; no regex-over-prose that clobbers character or misses Catalan).
- **Runtime:** the crawl/extract reuse Deno-TS modules → run under Deno, not Node.

## Review asks (ranked)
1. **Is the U4 gate-hardening actually sufficient?** Especially the DB-date edition
   cross-check — does comparing the extracted page year to the race's known 2026 date
   reliably catch prior-edition misreads, and are there pages where it false-positives
   (e.g. a race genuinely dated across a year boundary, or a page with no parseable
   date)? Is "both gates hide low-confidence high-blast facts" the right call, or does
   hiding lose value an agent could use with a caveat?
2. **The freshness/staleness honesty (KTD4).** Is "render start_time with its
   last_checked date + a hard N-days-before re-crawl rule" enough, or is a one-off local
   snapshot fundamentally too stale to publish start times at all? What would you do
   instead?
3. **The free agent-workflow extraction (U6).** Is fanning ~200 races across sub-agents
   for honest fact-extraction sound, or will self-consistency/hallucination across a
   fleet be worse than one scripted model call? Where's the failure mode?
4. **The same-deploy strip (U7).** Is landing enrichment-bundle + taste-strip in one
   deploy actually atomic enough, or is there still a window/ordering hazard?
5. **Scope/sequencing.** Are the quick wins (U1 flags, U2 data-quality) correctly
   independent? Is anything mis-scoped or missing (e.g. the cloud-pipeline demotion —
   right call at 200 races, or a mistake)?
6. **Anything the internal review missed** — its diff against your cold read is the
   highest-value output.

## Known-incomplete (assess the plan, don't report as bugs)
The cloud pipeline demotion, taste coverage expansion (U8), and the exact re-crawl N
are deferred/open by design. Extraction is not yet run; the eval key is not yet built.

## Constraints
Read-only; no crawl/deploy. The honesty bar is absolute: a confidently-wrong published
fact is a phase failure, worse than a gap. Judge honesty as strictly as feasibility.

## Return
A ranked findings list (severity · plan section · concrete failure · fix) + a verdict:
is this plan build-ready, and is the honesty design sound enough that it won't publish
a confidently-wrong fact? Prefer a few decisive findings.
