# Handoff — review the intent-logging plan (Step 3, U3)

**For:** an external reviewing agent (e.g. Codex), a second lens after an internal
compound-engineering doc-review already ran. **Read-only:** review the plan and
report; do NOT implement, migrate, deploy, or edit code.

**Plan under review:** `docs/plans/2026-08-25-001-feat-intent-logging-plan.md`
(on `main`). It supersedes the U3 section of the parent on-ramp plan
(`docs/plans/2026-08-20-001-feat-best-next-race-onramp-plan.md`).

## ⚠ Review `main`, not the working tree
Up to three sessions share this repo; the working directory is frequently on a
feature branch (e.g. `feat/card-quality-tier0`) that is **behind `main`**. The
plan's premise — that the ask-box goal box + intent chips + `buildBestNextRacePrompt`
are already shipped — is TRUE on `origin/main` (commit `62a3fd4`: `app/components/
AskAI.jsx` has `goal`/`chips`/`hasIntent` + `INTENT_CHIPS`), and FALSE on the
working-branch checkout. Read `origin/main` (or `git worktree add <tmp> origin/main`).
The internal review lost one finding to exactly this trap — don't repeat it.

## What this plan does
Log **every** ask-box submission (raw goal text + chip ids + active filters +
which provider button + timestamp) as the "why" demand signal the dogfood proved
we're blind to. It is the site's first browser-originated server-side write path
(the site is read-only-anon today).

## What the internal review already changed (verify these landed, don't re-derive)
Four CE reviewers (coherence, feasibility, security-lens, adversarial) ran on an
earlier draft; the plan now reflects their findings. The load-bearing ones:
- **The DB (RPC/table) is the trust boundary, not the route handler.** `log_intent`
  is `grant execute ... to anon` and the anon key is public, so a direct
  `POST /rest/v1/rpc/log_intent` bypasses the route handler's allowlist/caps. So
  the provider-enum CHECK, jsonb size cap, and per-chip truncation live in the
  migration/RPC (KTD1, U1). The route handler is a same-origin normalizer, not the
  guard (KTD2).
- **Rate-limiting is stated honestly** (KTD4): the in-memory route throttle protects
  nothing (Vercel multi-instance + bypassable); the enforceable bound is the RPC
  caps + retention + a storage alert; counts are directional.
- **Retention NULLs `goal_text`, keeps the anonymous aggregate, via `pg_cron` in the
  migration** (KTD5, R6) — deleting whole rows would destroy the demand signal the
  feature exists to build.
- **One shared allowlist source** (chips as stable ids + filter keys), imported by
  both the component and the validator, with a parity test (KTD6) — so a later chip
  never silently reads as zero demand.
- **Handoff-first client wiring** (U3): a never-awaited `logIntent()` fired strictly
  after `window.open`/clipboard — an `await` before the clipboard write could
  silently break Copy.
- Route handler **awaits** the RPC (a non-awaited serverless fetch gets killed);
  same-origin-only (no CORS); precise "not tied to identity in our systems" wording.

## Review asks (ranked)
1. **Is the trust-boundary claim actually complete?** With enforcement in the RPC,
   is there any remaining way a direct anon caller harms the DB (cost, storage,
   a poisoned value a future reader trusts)? Is the `pg_column_size` guard on
   `p_filters` the right mechanism? Is `left(chip, 24)` + array-cap 8 sufficient?
2. **Privacy honesty:** is storing raw `goal_text` as "unlinked, not anonymous"
   with NULL-purge + disclosure a defensible posture, or is there a leak the plan
   misses (e.g. the aggregate + a rare goal string re-identifying someone)?
3. **The `pg_cron` NULL-purge:** correct and safe as an in-migration job? Any risk
   it silently doesn't run (this workspace has a history of scheduled tasks not
   firing) — does the plan's "observe the artifact, not the timestamp" success
   criterion cover it?
4. **Handoff-first ordering + `await`-the-RPC:** are U2/U3 as written actually
   race-free and non-blocking on Vercel Next 16, or is there a failure mode?
5. **KTD6 allowlist parity:** does the shared-source + parity-test design actually
   prevent the silent-undercount bias, including the chips-as-ids migration of the
   already-shipped display-label chips?
6. **The premise tripwire** (retire raw-text logging if it never beats the chips) —
   is that the right guardrail, or is 180 days / the window wrong?

## Known-incomplete (assess the plan, don't report as bugs)
Reading/aggregation UI, a durable cross-instance rate-limit, and derived-category
tagging are explicitly deferred. T1 (`/api/out`) reuses this ingest contract and
is a separate build.

## Constraints
Read-only; no deploy/migrate/branch-switch. The migration is applied by Dima
(Supabase MCP, branch first); the front-end ships on Vercel push; no new env var;
no MCP redeploy involved.

## Return
A ranked findings list (severity · plan section · concrete failure · fix) + a
verdict: is this plan build-ready for an implementer, and is the security/privacy
posture sound for the site's first write path? Prefer a few decisive findings.
