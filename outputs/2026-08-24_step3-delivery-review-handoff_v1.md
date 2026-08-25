# Handoff — review the delivery hardening, U4, and the Step-3 + trackability plans

**For:** an external reviewing agent (e.g. Codex) — outside the harness that did
this work. Review what's shipped-live and what's planned, and judge correctness,
honesty, safety, and whether the plans are build-ready. **Read-only:** do NOT
implement, deploy, migrate, push, or switch branches (parallel sessions share
this working dir — see below).

**Repo:** `/Users/dima/Claude/Trails/trail-catalunya`. Production: trailraces.cat
(Next.js on Vercel from `main`) + a public authless Supabase MCP Edge Function
(`verify_jwt:false`). North star: the best AI-agent-friendly race discovery layer
(the MCP/pages are the crown jewel), as Dima's learning + runner value.

## ⚠ Read `main`, not the working tree
Up to THREE sessions share this dir: the working dir may be on
`feat/card-quality-tier0` or `feat/fdr-light-redesign` (a homepage UI redesign),
NOT `main`. **`main` (origin/main) is the source of truth for the work below.**
Do NOT `git checkout` in the shared dir; use `git worktree add <tmp> origin/main`
if you need a clean tree. See `docs/multi-session.md`.

## What to review (all since the 2026-08-23 review)

### A. Delivery hardening (shipped)
- `scripts/deploy-mcp.sh` — deploys the MCP ONLY from a freshly-fetched
  `origin/main` worktree, with an (optional, deno-gated) test gate and a live
  `initialize` probe. Exists because two bugs bit us: a stale-local-branch deploy
  shipped OLD source to prod once, and parallel sessions leave the dir on a
  feature branch. Is this actually sufficient to prevent stale/wrong-source
  deploys? Any hole (e.g. the deno gate now skips silently when absent — is the
  warning enough)?
- `docs/multi-session.md` — the one-session-or-isolated-worktrees rule.

### B. The 2026-08-23 review-fixes — DEPLOYED & VERIFIED LIVE (MCP re-deployed)
Re-verify they actually hold on the LIVE MCP (endpoint below), not just in repo:
- Source-silence (e.g. `"No indication."`) no longer publishes as an organizer
  fact (`build-taste.mjs` `isUnknownValue` broadened; corpus regenerated).
- `taste_flags` gated: set only from ORGANIZER-stated fields + affirmative
  wording — a negation ("no night mention") must NOT set `night:true`; inferred
  technicality is not a flag (`taste_view.ts`/`taste.js` `tasteFlags`). **Verify
  the gate is correct AND complete** (is organizer-provenance + affirm/negate the
  right bar? any value that still slips?).
- Quote-strip only trims a matched enclosing pair (no unbalanced quotes).
- The R2-2 projection instruction excludes interval reps (no valid Riegel
  `(D1,T1)`); keeps the no-anchor "suggest a TT" flag (`protocol.ts`).
- The required `deno test --allow-read supabase/functions/ eval/` is green (135/135).

### C. U4 — BEST NEXT RACE ranking clause (shipped live in MCP INSTRUCTIONS)
`supabase/functions/mcp/protocol.ts` — a new DISCOVERY clause teaching a connected
agent to answer "best next race / a cool race coming up" with a ranked few + why,
ranking on drive time + live `difficulty`/`d_plus_per_km` + `taste_summary`/
`taste_flags`, with readiness/PB only if a training connector is present. **Review:
does it correctly leverage fields that actually exist in the tool responses? Is
the honesty rule kept (verify registration/start at url)? Does anything require a
connector that shouldn't (zero-setup promise)? Is the ranking guidance sound?**

### D. Step-3 deepened plan (PREP — not built)
`docs/plans/2026-08-20-001-feat-best-next-race-onramp-plan.md` — the ask-box
on-ramp, deepened 2026-08-24 (see the "Deepening" section up top). **Review:
is it build-ready? Three calls to check specifically:** (1) the HARD constraint
that U1 (homepage UI) must be built INTO/after the `feat/fdr-light-redesign`
homepage, not the current `RaceList` — right call? (2) reconciling U3's intent-log
(client→RPC) with trackability T1's route-handler-with-server-credential into ONE
pattern — is the route-handler the right default? (3) the honest ceiling (users
arrive via ChatGPT reading pages, connector ~0) reflected in success criteria.

### E. Trackability requirements (PREP — not built)
`docs/seo/2026-08-24-trackability-requirements.md` — closing the funnel: T1
outbound-click beacon, T2 UTM tagging, T3 tracker readings, T7 email-capture
decision. **Review:** (1) T1 introduces the site's FIRST server-side write
credential (a key in a Next route handler; today the site is read-only anon) —
is the posture (server-side only, slug allowlist, RLS, no PII) sufficient, and
should it rate-limit so click counts can't be inflated? (2) The T7 recommendation
to NOT gate AI features on email (it would kill the ChatGPT/crawler channel +
destroy audited MCP anonymity) — is that the right call? (3) Do the ask-box
intent-log, T1 clicks, and T7 alerts form one coherent measurement layer?

## Cold-start reading order
1. `AGENTS.md` "Deployment state" — live state, the deploy runbook, the
   version-tracking trap.
2. `docs/ROADMAP.md` — north star + locked sequence (Step 1 + taste Slice 1 done;
   Step 3 next).
3. `docs/dogfood/2026-08-22-slice1-gaps.md` — the dogfood + composition validation.
4. The shipped code: `supabase/functions/mcp/protocol.ts` (INSTRUCTIONS incl. U4),
   `mcp/taste_view.ts` ↔ `app/lib/taste.js` (gates), `scripts/build-taste.mjs`,
   `scripts/deploy-mcp.sh`.
5. The plans: the Step-3 plan (D) + the trackability doc (E).
6. Prior review this builds on: `outputs/2026-08-23_step2-taste-layer-audit_v1.md`.

## Verify against the LIVE MCP
Endpoint: `https://qaebfhbdfjvzhmvcjroz.supabase.co/functions/v1/mcp` (JSON-RPC,
public). `initialize` returns the full INSTRUCTIONS (should contain "BEST NEXT
RACE"); `search_races`/`get_race` return the taste + flags. Confirm the version
with the Supabase list-edge-functions (it drifts — parallel sessions deploy too;
never trust a version number in a doc).

## Known-incomplete — assess the PLANS for these, don't re-report as bugs
- Step-3 UI (U1) is blocked on the `feat/fdr-light-redesign` homepage rewrite.
- The shared measurement backend (intent-log + T1) is unbuilt (plans only).
- Slice-2 taste backlog (operational facts, Burriac overrides, technicality
  salvage, chunk-3 join, `capacity`) is parked.
- MCP-connector adoption is ~0; real usage is ChatGPT reading pages (per the
  data dive: `oai-searchbot` crawled ~149 pages).

## Constraints
Read-only; no deploy/migrate/push/branch-switch. Honesty-default-unknown; never
fabricate a race attribute. MCP stays authless/public; the enrich-races LLM
pipeline stays dormant (out of scope).

## Return
A ranked findings list (severity · file/section · concrete failure · fix) + three
verdicts: (1) is the shipped work (delivery hardening, review-fixes, U4) sound and
honest as live? (2) is the Step-3 plan build-ready and are its coordination calls
right? (3) is the trackability plan safe (esp. the write credential) and is the
T7 no-gate call correct? Prefer a few decisive findings over a long list.
