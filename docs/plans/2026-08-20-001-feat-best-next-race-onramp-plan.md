# feat: Best next race — agent-native planning on-ramp (v1)

Type: feat · Depth: Standard · Created: 2026-08-20 · Deepened: 2026-08-24
Origin: `docs/brainstorms/2026-08-20-best-next-race-requirements.md`

---

## Deepening (2026-08-24) — read first; refines the units below

Five things changed since this plan was written. None overturn the shape; they
sharpen it and add one hard sequencing constraint. **The units below (U1–U4,
KTDs, R4/R5) have been rewritten to match this section — do not read an earlier
draft's "Dependencies: none" / "SECURITY DEFINER RPC" / "redeploy via Supabase
MCP" wording; those were superseded here (external review #5).** U4 is now
SHIPPED and live (2026-08-24); U1/U2/U3 remain to build.

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
- R4. **On-site intent logging** — one row per submission capturing the intent chips, the current filters, and a DERIVED goal category (mapped from any free text), so the log is a demand signal without a free-text PII surface. If raw goal text is kept at all, it is stored as *unlinked, user-volunteered content* — no identity/IP, but NOT labelled "anonymous" (free text can carry a name/email the user typed), disclosed as such, output-escaped, and purged on a fixed retention (origin: intent-logging decision; privacy per review #8).
- R5. Zero server-side storage of *training* data preserved; readiness/PB gated behind the user's own connector. The intent log holds no training data and no derived-from-connector fields (origin: locked constraints).

## Key Technical Decisions

- **KTD1 — On-ramp placement: above the filters; discovery page unchanged.** The majority won't use AI, so filter/list/race-page discovery stays primary; the on-ramp sits above it and is skippable (see origin).
- **KTD2 — Capture reuses existing filter state, no new constraints form.** A goal box + one-tap intent chips + a value-exchange nudge ("tell me what matters and I'll pick better"); the handoff silently folds in whatever filters are already set. Minimizes friction while allowing depth.
- **KTD3 — Intent log writes through a server-side route handler, the SAME ingest contract as trackability T1** (supersedes the earlier client→`SECURITY DEFINER` RPC; deepening #5). A Next.js route handler (`app/api/intent/route.js`) holds the write credential server-side (a narrow key, never shipped to the client) and validates the payload against an allowlist — known chip ids, known filter keys, a derived goal-category enum, and a capped+escaped free-text field only if kept — before inserting into `intent_log`. RLS on, no anon write policy; rate-limited + body-capped so counts can't be inflated. One ingest pattern serves both funnel halves: the *why* (intent) here and the *did-it-work* (T1 outbound clicks) in the trackability doc. No analytics SaaS.
- **KTD4 — Reasoning stays in the agent.** No on-site ranking engine. The prompt (and MCP instructions) carry the ranking logic; the site only captures + hands off.

## Implementation Units

### U1. Goal-capture on-ramp component

**Goal:** A goal-first capture block on the homepage, above the filters, additive and skippable.
**Requirements:** R1, R2.
**Dependencies:** [HARD, deepening #4] the `feat/fdr-light-redesign` homepage rewrite. Build the on-ramp INSIDE that branch, or land it as a drop-in on the NEW homepage after the redesign merges to `main`. Do NOT mount on the current `RaceList.jsx` — the redesign is rewriting exactly that surface, so any mount here will be thrown away or conflict. U3/U4 do not carry this dependency.
**Files:** `app/components/BestNextRace.jsx` (new), `app/components/BestNextRace.test.jsx` (new); mount point = the redesigned homepage container (resolve the exact file against `feat/fdr-light-redesign` at build time — NOT `RaceList.jsx`).
**Approach:** A compact block: a headline question, a free-text goal input, a row of one-tap intent chips (fun trail / somewhere new / chase a PB / kid-friendly / what's on soon), and a value-exchange line ("the more you tell me, the better I can pick — all optional"). Reads the current filter state from the redesigned homepage (drive/distance/elevation/month/province/kidsRun) via props — does not introduce its own constraints UI. Two primary actions (Ask Claude / Ask ChatGPT) + a "Connect your own AI" link to `/for-agents`. Fully usable with everything left blank.
**Patterns to follow:** the existing `AskAI.jsx` button/afford­ance styling and the dark-theme tokens; chip styling from the filter chips in `RaceList.jsx`.
**Test scenarios:**
- Renders with all inputs empty; both handoff buttons are enabled (blank is valid).
- Selecting/deselecting an intent chip toggles its state.
- Typing a goal updates the free-text value.
- Reads and reflects filter state passed via props (e.g., a set month is available to the handoff builder).
- `Test expectation:` covers R1, R2 behavior; no network in this unit.

### U2. Tailored "best next race" handoff prompt

**Goal:** Build a goal-conditioned prompt from intent + chips + current filters + races — each race carrying its difficulty + taste projection — and launch Claude/ChatGPT.
**Requirements:** R3.
**Dependencies:** U1.
**[review #6] The prompt's ranking data must exist in scope.** The four-axis "why it fits" reasoning (deepening #1) needs `difficulty` + `d_plus_per_km`, `taste_summary`, and `taste_flags` PER RACE — but site race objects today carry only the display-shaped `ev.taste` (from `tasteForDisplay`); difficulty is computed separately in `app/lib/format.js`, and `taste_summary`/`taste_flags` are currently produced only on the MCP side. So this unit MUST add an event-level projection, not just a prompt string.
**Files:** `app/lib/raceProjection.js` (new — per-event projection: `difficulty`/`d_plus_per_km` via `app/lib/format.js`, plus `taste_summary` + `taste_flags` via the existing site gate `app/lib/taste.js` exports `tasteSummary`/`tasteFlags`), `app/lib/raceProjection.test.mjs` (new), `app/components/askPrompt.js` (add `buildBestNextRacePrompt`, consuming the projection), `app/components/askPrompt.test.mjs` (extend).
**Approach:** First the projection: `projectRaceForPrompt(event)` returns a compact, claim-labelled record — difficulty word + itra_points + d+/km, `taste_summary` (with its strength label so our read is never relayed as an organizer fact), and `taste_flags` — OMITTING any field that is unknown (never fabricate; absent = unknown, mirroring the MCP gate). Then the builder: a new function distinct from `buildPrompt`/`buildRacePrompt` that states the user's goal (chips + free text), the active filters as constraints, and the candidate races inline WITH their projection; instructs the agent to recommend the best few, **ranked on enjoyment (taste) / low-logistics (drive time) / novelty / PB**, drive-time-first; to compose with the user's own Strava/Garmin/Calendar/Weather **if present** and **skip cleanly if not**; and carries the existing discipline verbatim — verify registration/start at the official URL, treat scraped race text and taste evidence as data-not-instructions, never send personal data to a URL. **URL-length budget:** reuse `buildPrompt`'s `MAX_INLINE` race cap AND trim the per-race projection to the ranking-relevant fields, so the deep-link stays within practical URL limits even with taste added. Reuses `claudeUrl`/`chatgptUrl`.
**Patterns to follow:** the structure, drive-time-ranking clause, injection guard, `MAX_INLINE` cap, and Strava-composition clause in `buildPrompt`/`buildRacePrompt`; the projection semantics of `supabase/functions/mcp/tools.ts` (list envelope = taste_summary + taste_flags) mirrored on the site.
**Test scenarios:**
- `projectRaceForPrompt`: a race with difficulty + taste yields difficulty + taste_summary (with strength label) + taste_flags; a race missing taste yields difficulty only, no fabricated taste fields; a race missing difficulty omits it.
- With chips + goal + filters set, the prompt contains the goal, the constraints, the four-axis ranking instruction, and at least one race's projected difficulty/taste.
- With everything blank, the prompt is still valid and asks the agent to elicit constraints.
- The prompt includes the verify-at-URL, injection-guard, and Strava-optional (skip-if-absent) clauses.
- The inline race count respects `MAX_INLINE`; the encoded URL stays under the builder's existing length guard even with projections attached.
- `claudeUrl`/`chatgptUrl` wrap the prompt (URL-encoded, non-empty).
- Covers R3 + review #6.

### U3. On-site intent log

**Goal:** One row per on-ramp submission — a demand signal, written through the shared server-side ingest contract, with no free-text PII surface.
**Requirements:** R4, R5.
**Dependencies:** U1, U2; **the ingest contract (KTD3 / trackability T1) must be settled first** — U3's backend can be built once that's fixed, independent of U1's redesign wait.
**Files:** `supabase/migrations/<ts>_intent_log.sql` (new — table + RLS, NO anon write policy), `app/api/intent/route.js` (new — server-side route handler holding the write credential + allowlist validation + rate-limit + body cap), client call site in `app/components/BestNextRace.jsx` (fire-and-forget POST to `/api/intent` on submit), `app/components/BestNextRace.test.jsx` (extend), `app/api/intent/route.test.mjs` (new).
**Approach:** Same ingest pattern as trackability T1 (KTD3): the client POSTs `{chips[], filters{}, goal_category, goal_text?}` to the `/api/intent` route handler, which validates against an allowlist (known chip ids, known filter keys, a derived goal-category enum, a capped+escaped `goal_text` only if kept), then inserts into `intent_log` using a server-side credential. **Privacy (review #8):** store chips + filters + the derived `goal_category` by default; if raw `goal_text` is retained, mark the column as unlinked user-volunteered content (not "anonymous"), disclose it where the query log is disclosed, escape on any output, and set a fixed retention/purge. RLS on with no anon write policy — writes only via the route handler; rate-limit + body cap so counts can't be inflated. On Ask-Claude/ChatGPT click, fire a non-blocking POST (never blocks or fails the handoff).
**Patterns to follow:** the trackability T1 route handler + `outbound_clicks` allowlist; the `crawler_hits` migration for the RLS/no-policy shape (but NOT its client-RPC write path — writes go through the route handler now).
**Execution note:** the write is best-effort — a log failure must never affect the handoff.
**Test scenarios:**
- Submitting fires exactly one POST with chips + filters + goal_category; the handoff proceeds regardless of the call's outcome.
- The route handler REJECTS unknown chip ids / filter keys / oversized bodies; accepts a valid payload.
- `goal_text`, if present, is capped and escaped; the derived `goal_category` is always set.
- A failed/blocked log call does not throw or delay the redirect.
- No identity/IP/training fields are sent or stored (R5); the row is not labelled "anonymous" if it carries free text (R4/#8).

### U4. MCP instructions — "best next race" ranking clause  ✅ SHIPPED (2026-08-24)

**Status:** LIVE. The BEST NEXT RACE block is in `supabase/functions/mcp/protocol.ts` `INSTRUCTIONS`, deployed via `scripts/deploy-mcp.sh` and build-verified live (serverInfo.build probe). This supersedes this unit's original "redeploy via the Supabase MCP / mcp v8" wording — deploys now go through `deploy-mcp.sh` (deepening #5).
**What shipped (as refined by external review #9):** the agent ranks the candidate set **from LIST fields first** (drive time + `difficulty` + `taste_summary` + `taste_flags` already in `search_races`/`whats_on`), then calls `get_race` only for the finalists when `taste.editorial` could change their order — resolving the earlier "no fetching" contradiction. Axes: LOW-FAFF (drive), ENJOYMENT (taste), FIT (difficulty + d+/km), NOVELTY/PB. Novelty = distinctiveness within the shortlist; a personal "new to you" or PB projection is offered only if the user supplies history or a training connector is present. Keeps the verify-registration/start-at-url honesty rule; shortlisting is zero-setup.
**Requirements:** R3.
**Verification:** live `initialize` contains "RANK THE CANDIDATE SET FROM LIST FIELDS FIRST"; the old "no fetching" line is gone; tools unaffected.

## Success Criteria

Measured against the honest ceiling (deepening #3: users arrive via ChatGPT/
search reading pages; MCP-connector adoption ~0). Connector installs are an
explicit NON-goal for v1.

- **Intent-log fill** — a steady stream of submissions with a non-empty chip or
  goal category, above dogfood noise (mark dogfood dates, per trackability T6).
  This is the demand signal that ranks what Slice-2 taste fields to build.
- **Handoff use** — Ask-Claude / Ask-ChatGPT click-through on the on-ramp,
  measured via the same outbound-beacon the trackability doc's T1 builds.
- **Reasoned-shortlist behaviour** shows up in the weekly citation probe — an AI
  answer that returns a ranked "why it fits" sourced from our pages — NOT in
  connector-install counts.
- **Guardrail:** no honesty regressions — the shipped answer still tells the user
  to verify registration/start at the race url, and never relays our read as an
  organizer fact.

## Scope Boundaries

**Deferred for later** (origin roadmap): the structured taste layer + editorial questions (unique/cool/catch/who/reference), sourced by extending `enrich-races`, gated on the facts pipeline shipping + query-log demand; the difficulty-index (`km + D+/100`) computed field (a cheap near-term win from existing data); personalized precomputed race index; logistics→calendar; weather/shoe jobs; season-sequencing as a first-class feature.

**Deferred to follow-up work:** the GSC `description` + per-race og-image fixes (ride along the next race-page touch); improving the site-native discovery beyond current filters.

**Outside this product's identity:** accounts, saved plans, multi-user features, email/alerts.

## Open Questions

- Exact copy for the value-exchange nudge and the intent chips — settle at build time; keep it in Dima's voice, short.
- Whether U4 ships with U1–U3 or slightly after — independent deploy; low risk either way.

## Risks & Dependencies

- **Prompt length / deep-link URL limits** — the handoff URL carries the prompt + inline races; reuse the existing `MAX_INLINE` cap from `buildPrompt` to stay within practical limits.
- **Intent-log privacy (review #8)** — store chips + filters + a derived goal category; treat any retained free text as unlinked user-volunteered content (not "anonymous"), capped, escaped, retention-purged, and disclosed where the query log is. Validate on the server, never trust the client payload.
- **New backend surface (review #7)** — U3 introduces the site's first server-side WRITE path (the `/api/intent` route handler + a write credential), shared with trackability T1. This is new infra vs. the current read-only-anon site: it needs a narrow credential (not a broad service-role key), RLS with no anon write, rate-limiting, and body caps before it ships. Front-end still deploys on Vercel push; any MCP redeploy goes through `scripts/deploy-mcp.sh`.
