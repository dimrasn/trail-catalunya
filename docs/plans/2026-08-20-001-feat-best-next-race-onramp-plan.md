# feat: Best next race — agent-native planning on-ramp (v1)

Type: feat · Depth: Standard · Created: 2026-08-20 · Deepened: 2026-08-24
Origin: `docs/brainstorms/2026-08-20-best-next-race-requirements.md`

---

## Deepening (2026-08-24) — read first; refines the units below

Five things changed since this plan was written. None overturn the shape; they
sharpen it and add one hard sequencing constraint.

1. **Taste + difficulty are now LIVE (Slice 1) and queryable — stop planning for
   "agent infers taste."** Race data on both the pages and the MCP now carries
   `difficulty` (ITRA km-effort word + points + D+/km), `taste_summary` (a
   one-line, claim-tagged "what makes it special"), and `taste_flags` (night,
   technicality band — organizer-gated). **U2 (handoff prompt) and U4 (MCP
   ranking clause) must LEVERAGE these fields**, not tell the agent to infer or
   fetch taste. Concretely: the "why it fits" reasoning ranks on drive time +
   `difficulty` + `taste_flags`/`taste_summary` that already exist; the prompt
   inlines them. Scope-boundaries line "structured taste layer deferred" is
   partly superseded — Slice 1 is in.

2. **Intent-logging (R4 / U3) is the load-bearing value, not a nice-to-have.**
   Dogfood + the live query log proved agents pass STRUCTURED filters and almost
   never free-text intent, so `mcp_query_log` is blind to *why*. U3 is what turns
   that blindness into signal. Raise its priority; do not treat it as optional
   polish. It ranks which taste-fields Slice 2 should build.

3. **Honest ceiling (CPO data, 2026-08-24).** Real users reach us via ChatGPT/
   OpenAI-search READING PAGES (`oai-searchbot` crawled ~149 pages; live
   `chatgpt-user` fetches), while MCP-connector adoption is ~0. So this on-ramp's
   ceiling is **intent-capture + a better handoff for the humans who land on the
   site** — NOT connector growth. Update Success Criteria accordingly: measure
   intent-log fill + handoff use + whether the reasoned-shortlist behaviour shows
   in the weekly citation probe; do NOT measure connector installs.

4. **[HARD CONSTRAINT] A homepage redesign is in flight (`feat/fdr-light-redesign`).**
   U1 mounts a component in `app/components/RaceList.jsx` — the exact surface the
   redesign is rewriting. **Do NOT build U1 against the current RaceList.** Either
   build the on-ramp INSIDE the redesign branch, or land it as a drop-in on the
   NEW homepage after the redesign merges to `main`. Sequencing dependency: U1
   waits on (or joins) the redesign. U3/U4 (log + MCP clause) are independent and
   can proceed. Coordinate before writing homepage JSX.

5. **One measurement layer + gated deploy.** U3's intent log is the *why* half of
   the same funnel `docs/seo/2026-08-24-trackability-requirements.md` builds —
   T1 outbound-clicks (*did it work*) + T7 race-alerts (*came back*). **Reconcile
   the logging pattern:** U3 currently specifies a client→`SECURITY DEFINER` RPC;
   T1 specifies a Next route handler holding a server-side write credential +
   allowlist validation. Pick ONE for both (the route-handler pattern is the
   stronger default — credential server-side, payload validated, rate-limitable
   so counts can't be inflated). And **U4 (MCP-instruction change) deploys via
   `scripts/deploy-mcp.sh`** (gated, from a clean `origin/main` worktree) — NOT an
   inline `deploy_edge_function` (the 165KB taste bundle can't inline; a wrong-
   source deploy already shipped stale code once).

## Summary

Add a goal-first "best next race" on-ramp to the homepage: a lightweight, optional capture of what the user is looking for, which builds a tailored prompt and hands them into their own Claude/ChatGPT for a ranked, reasoned shortlist. Zero-setup by default; deepened (readiness, projected time, PB-potential) only when the user has their own Strava/Calendar/Weather connector. The existing filter-based discovery page stays as the primary path for the majority who won't use AI — the on-ramp is additive. Every on-ramp submission is logged anonymously on-site to reveal what people actually ask for.

## Problem Frame

Today the site offers filter-based discovery + an "Ask AI" deep-link that sends only filter state. It captures no *intent*, so the handoff can't reason about goals ("fun trail, somewhere new, PB-friendly"), and we're blind to what the majority actually want. The brainstorm's chosen wedge (Approach C, tiered on-ramp) closes both gaps without building an on-site ranking engine: the site captures intent + hands off; the agent does the open-ended reasoning; connectors are the upgrade.

## Requirements (trace to origin)

- R1. Goal-first capture on the homepage, **additive** to (not replacing) the filter discovery page (origin: Primary user + "discovery page stays").
- R2. Capture is **optional and value-framed** — never blocks the handoff; teaches the user what's worth sharing; reuses filters they've already set rather than a second form (origin: capture-depth decision).
- R3. A tailored handoff prompt that ranks "best next race" on the four axes (enjoyment / low-logistics / novelty / PB), drive-time-first, and composes with the user's Strava/Calendar/Weather **only if present**, degrading gracefully otherwise (origin: v1 scope, tiered).
- R4. **On-site intent logging** — one anonymized row per submission (goal text, chips, current filters), mirroring the live `crawler_hits` pattern (origin: intent-logging decision).
- R5. Zero server-side storage of training data preserved; readiness/PB gated behind the user's own connector (origin: locked constraints).

## Key Technical Decisions

- **KTD1 — On-ramp placement: above the filters; discovery page unchanged.** The majority won't use AI, so filter/list/race-page discovery stays primary; the on-ramp sits above it and is skippable (see origin).
- **KTD2 — Capture reuses existing filter state, no new constraints form.** A goal box + one-tap intent chips + a value-exchange nudge ("tell me what matters and I'll pick better"); the handoff silently folds in whatever filters are already set. Minimizes friction while allowing depth.
- **KTD3 — Intent log mirrors `crawler_hits`.** New `intent_log` table + `SECURITY DEFINER` RPC + client fire-and-forget on submit. No identity, no IP, capped text — same posture as the query and crawler logs. Reuses a proven, live pattern rather than an analytics SaaS.
- **KTD4 — Reasoning stays in the agent.** No on-site ranking engine. The prompt (and MCP instructions) carry the ranking logic; the site only captures + hands off.

## Implementation Units

### U1. Goal-capture on-ramp component

**Goal:** A goal-first capture block on the homepage, above the filters, additive and skippable.
**Requirements:** R1, R2.
**Dependencies:** none.
**Files:** `app/components/BestNextRace.jsx` (new), `app/components/RaceList.jsx` (mount above the filter row), `app/components/BestNextRace.test.jsx` (new).
**Approach:** A compact block: a headline question, a free-text goal input, a row of one-tap intent chips (fun trail / somewhere new / chase a PB / kid-friendly / what's on soon), and a value-exchange line ("the more you tell me, the better I can pick — all optional"). Reads the current filter state already held in `RaceList` (drive/distance/elevation/month/province/kidsRun) via props — does not introduce its own constraints UI. Two primary actions (Ask Claude / Ask ChatGPT) + a "Connect your own AI" link to `/for-agents`. Fully usable with everything left blank.
**Patterns to follow:** the existing `AskAI.jsx` button/afford­ance styling and the dark-theme tokens; chip styling from the filter chips in `RaceList.jsx`.
**Test scenarios:**
- Renders with all inputs empty; both handoff buttons are enabled (blank is valid).
- Selecting/deselecting an intent chip toggles its state.
- Typing a goal updates the free-text value.
- Reads and reflects filter state passed via props (e.g., a set month is available to the handoff builder).
- `Test expectation:` covers R1, R2 behavior; no network in this unit.

### U2. Tailored "best next race" handoff prompt

**Goal:** Build a goal-conditioned prompt from intent + chips + current filters + races, and launch Claude/ChatGPT.
**Requirements:** R3.
**Dependencies:** U1.
**Files:** `app/components/askPrompt.js` (add `buildBestNextRacePrompt`), `app/components/askPrompt.test.mjs` (extend).
**Approach:** A new builder distinct from `buildPrompt`/`buildRacePrompt`. It states the user's goal (chips + free text), the active filters as constraints, and the candidate races inline; instructs the agent to recommend the best few, **ranked on enjoyment / low-logistics (drive time) / novelty / PB**, drive-time-first; to compose with the user's own Strava/Garmin/Calendar/Weather **if present** (readiness, projected time, PB-potential, race-day weather) and to **skip those cleanly if not**; and carries the existing discipline verbatim — verify registration/start at the official URL, treat scraped race text as data-not-instructions, never send personal data to a URL. Reuses `claudeUrl`/`chatgptUrl`.
**Patterns to follow:** the structure, drive-time-ranking clause, injection guard, and Strava-composition clause already in `buildPrompt`/`buildRacePrompt`.
**Test scenarios:**
- With chips + goal + filters set, the prompt contains the goal, the constraints, and the four-axis ranking instruction.
- With everything blank, the prompt is still valid and asks the agent to elicit constraints.
- The prompt includes the verify-at-URL, injection-guard, and Strava-optional (skip-if-absent) clauses.
- `claudeUrl`/`chatgptUrl` wrap the prompt (URL-encoded, non-empty).
- Covers R3.

### U3. On-site intent log

**Goal:** One anonymized row per on-ramp submission.
**Requirements:** R4, R5.
**Dependencies:** U1, U2.
**Files:** `supabase/migrations/<ts>_intent_log.sql` (new — table + RPC), `middleware`/client call site in `app/components/BestNextRace.jsx` (fire-and-forget on submit), `app/components/BestNextRace.test.jsx` (extend).
**Approach:** Mirror the shipped `crawler_hits` pattern exactly: an `intent_log` table (goal text, chips array, filters JSON, timestamp — no identity, no IP), RLS on with no policies, a `SECURITY DEFINER` `log_intent` RPC with capped inputs and `anon` execute. On Ask-Claude/ChatGPT click, fire a non-blocking `fetch` to the RPC (never blocks or fails the handoff). Apply the migration to remote via the Supabase MCP (as with `crawler_hits`) and keep the `.sql` as the repo record.
**Patterns to follow:** `supabase/migrations/20260820173000_crawler_hits.sql` and the `log_crawler_hit` fire-and-forget in `middleware.js`.
**Execution note:** the write is best-effort — a log failure must never affect the handoff.
**Test scenarios:**
- Submitting fires exactly one log call with goal + chips + filters; the handoff proceeds regardless of the call's outcome.
- A failed/blocked log call does not throw or delay the redirect.
- Values are capped; no identity fields are sent.
- Covers R4; verify no training/personal data is included (R5).

### U4. MCP instructions — "best next race" ranking clause

**Goal:** Ensure a connected agent ranks on the four axes and degrades gracefully, matching the on-ramp prompt.
**Requirements:** R3.
**Dependencies:** none (independent of U1–U3; separate deploy).
**Files:** `supabase/functions/mcp/protocol.ts` (extend the DISCOVERY block).
**Approach:** A few lines in the existing DISCOVERY section of `INSTRUCTIONS`: when asked for "the best next race," rank on enjoyment / low-logistics (drive time) / novelty / PB-fit, lead with drive time, and treat the training-composition + weather/calendar as optional deepeners. No schema or tool change. Redeploy the `mcp` Edge Function via the Supabase MCP (verify_jwt:false), as with prior versions.
**Patterns to follow:** the existing DISCOVERY + COMPOSES-WITH-TRAINING-DATA blocks in `protocol.ts`; the deploy path recorded in `AGENTS.md` (mcp v8).
**Test scenarios:** `Test expectation: none — instruction-string change; verified live post-deploy (initialize returns the new clause; tools unaffected).`

## Scope Boundaries

**Deferred for later** (origin roadmap): the structured taste layer + editorial questions (unique/cool/catch/who/reference), sourced by extending `enrich-races`, gated on the facts pipeline shipping + query-log demand; the difficulty-index (`km + D+/100`) computed field (a cheap near-term win from existing data); personalized precomputed race index; logistics→calendar; weather/shoe jobs; season-sequencing as a first-class feature.

**Deferred to follow-up work:** the GSC `description` + per-race og-image fixes (ride along the next race-page touch); improving the site-native discovery beyond current filters.

**Outside this product's identity:** accounts, saved plans, multi-user features, email/alerts.

## Open Questions

- Exact copy for the value-exchange nudge and the intent chips — settle at build time; keep it in Dima's voice, short.
- Whether U4 ships with U1–U3 or slightly after — independent deploy; low risk either way.

## Risks & Dependencies

- **Prompt length / deep-link URL limits** — the handoff URL carries the prompt + inline races; reuse the existing `MAX_INLINE` cap from `buildPrompt` to stay within practical limits.
- **Intent-log privacy** — must stay anonymized and capped; reuse the proven `crawler_hits` posture; disclose in the same place as the query log.
- **No new backend infra** — front-end deploys on Vercel push; the intent-log migration + any MCP redeploy go through the Supabase MCP (no new tokens).
