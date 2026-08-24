# trailraces.cat — full project state & open questions

2026-08-24 · consolidates three parallel threads (card-quality, filters, design)
into one picture. For Dima and for any agent picking any thread up cold.

**Read order for a cold agent:** `AGENTS.md` (deployment state) → `docs/ROADMAP.md`
(north star + locked sequence) → `docs/rules.md` (quality rules) →
`docs/open-loops.md` (L1–L17) → this file (what's in flight and undecided).

---

## 0. One-screen status

- **Live:** site at trailraces.cat (Next.js/Vercel from `main`), 226 race pages,
  difficulty index, taste layer Slice 1, MCP server. All shipped & verified.
- **The crown jewel is the MCP** (agent-native discovery), per the north star.
- **In flight right now:** card-quality Plan 1 (this thread) — merged on its
  branch, awaiting a THIRD/final audit, then merge-to-main + a code-only MCP
  deploy.
- **The one genuinely tangled thing:** the MCP deploy state. Three undeployed
  MCP changes are now stacked, and the docs disagree on what's actually live.
  Resolve this (§3) before ANY deploy.
- **Undecided and needing Dima:** six questions in §6.

---

## 1. The three threads

### Thread A — Race-card quality (this session, `feat/card-quality-tier0`)
**11 commits ahead of main, merged up to date with main, NOT pushed/deployed.**

Origin: two defects on `/race/trail-de-monells` (distance shown as a range
`18–25 km`; missing drive time + map link). Investigation found a wider class:
9 of 226 cards complete on five dimensions, median missing two.

Split into 3 plans (`docs/brainstorms/2026-08-24-card-quality-requirements-v2.md`):
- **Plan 1 — presentation truthfulness. DONE on branch, awaiting final audit.**
  Discrete distances as lists; honest titles (no range × max-climb); dead
  "Race-day facts" block guarded (was on 226/226 pages); 87 known-but-undated
  races now show "Expected <month>"; partial-elevation aggregates suppressed;
  the agreement gate; **and MCP expected-month parity** (pulled forward from
  Plan 2 because deferring it violated R8). Survived 2 audits (4 P1s + a re-audit
  finding 4 more, all fixed). Third audit brief:
  `docs/handoffs/2026-08-24-plan1-final-audit-handoff.md`.
- **Plan 2 — event identity & lifecycle. NOT started.** Deterministic event
  names (registry-primary, R13), redirects for moved slugs (R9), multi-day end
  dates, stage-race guard, finished-race handling. Blocked on L15 (build the
  name registry) and moves indexed URLs — highest blast radius, do last.
- **Plan 3 — location operations. NOT started.** The 176-town geocode + drive-
  time backfill (free via OSRM/Nominatim — Dima's call, no API spend), the map
  links, and the gap assertion (R11). **Must start with the R12 schema contract
  (L14)** or 176 towns get written under a contract we know is wrong. This plan
  fixes the OTHER half of the original Monells report.

New governance this thread added (workspace contract requires it):
`docs/rules.md` (14 rules, lens-stamped, R6/R12/R13 rewritten after audits),
`docs/open-loops.md` (L1–L17).

### Thread B — Multi-select filters + multi-value MCP (`feat/multi-select-filters`)
**Status: its work is ALREADY ON MAIN by content** (branch's `tools.ts` is
identical to main's). The branch's 5 commits are superseded duplicates — the
work landed on main under different hashes (`305f8e0`, `99729ef`, etc.). Site
filters are multi-select; MCP has multi-value OR filters. Handoff:
`docs/handoffs/2026-08-23-multi-select-filters-handoff.md`.
**Open:** the branch is stale and should be retired (§5). AND — is the multi-
value MCP actually deployed live, or only on `main`? The docs disagree (§3).

### Thread C — Design system / redesign (`outputs/2026-08-24_*`)
**Status: two design briefs "ready for designer" + wireframes. No code.**
- Race-card redesign brief + 2 wireframes (`2026-08-24_race-card-*`).
- Homepage redesign brief + mockups (`2026-08-24_homepage-*`) — reframes the
  homepage from a chronological calendar into a *finder* (chronology is the only
  ranking today; filters speak DB not runner; difficulty/taste invisible on the
  list though the MCP serves them).
**Open + IMPORTANT collision:** the race-card brief redesigns the exact page
Thread A's Plan 1 just changed (it even lists "Race-day facts renders an apology"
as a problem — which Plan 1 already fixed). These two threads touch the same
surface and must be reconciled, or the designer works against a stale page and
Plan 2/3 fights the redesign. See §6-Q4.

---

## 2. Where the roadmap says we are (`docs/ROADMAP.md`)

North star: **the best AI-agent-friendly race-discovery layer**, as Dima's
learning + runner value. Locked 4-step sequence:
- **Step 1 — difficulty index. ✅ LIVE.**
- **Step 2 — taste layer. 🟡 Slice 1 LIVE; Slice 2 pending** (operational facts:
  start times/cutoffs via compound-bullet splits + prior-edition gate; the ~10
  url-only races; the 4 non-joining + exception tail).
- **Step 3 — ask-box on-ramp. NOT built.** NL box above the filters, hands off to
  the user's AI. Plan ready (`docs/plans/2026-08-20-001-...`).
- **Step 4 — dogfood sprint.** ≥8–10 real planning sessions → gap list. This IS
  the learning goal and the only demand signal at ~zero traffic.

**Deviation test (enforce it):** a new idea enters the sequence only if it (a)
ships already-built work live, or (b) comes from a dogfood failure. Card-quality
Plan 1 qualifies under (a)+(b); the design thread (C) is a larger bet that should
be tested against this rule before it consumes the sequence.

---

## 3. The deploy tangle — resolve BEFORE any deploy (most urgent)

Three MCP changes are now built-but-undeployed, stacked:
1. `taste_flags` (night/technicality band in list) — dogfood #1.
2. PROJECTED-TIME instruction fix (work-interval anchor, R2-2).
3. **expected-month parity** (this thread, `041457c`).

And the docs **contradict themselves** on what's live: `AGENTS.md` says both
"multi-value MCP DEPLOYED & VERIFIED" (line ~44) and "main is AHEAD of the live
MCP, still v11" (line ~73). We do not actually know the live version.

**Required before deploying anything (L17):** call the live MCP `initialize`,
read the real version, and reconcile `AGENTS.md` to fact. Only then decide what
the next `supabase functions deploy mcp` ships (it will bundle ALL undeployed
changes at once — they can't be shipped separately from disk). The deploy is
CLI-from-disk if `taste.json` changed; the card-quality MCP change alone leaves
`taste.json` untouched, so it *could* use the MCP tool — but if bundled with the
taste_flags work, re-check.

---

## 4. Consolidated open loops (from `docs/open-loops.md`)

Blocking / near-term: **L14** (R12 schema before Plan 3 backfill), **L16**
(expected-month MCP parity built, awaiting audit+deploy), **L17** (verify live
MCP version). Plan-2-gated: **L6/L7/L15** (redirects, MCP identity parity, name
registry), **L8** (stage-race guard), **L11** (homepage JSON-LD past events).
Standalone: **L4/L5** (backfill + gap assertion, Plan 3), **L12** (data-quality
flags: Radikal Estana month/year conflict, sub-10 m/km "trail" races, elevation
inversions), **L13** (pre-existing `deno` type-check fail on main —
`difficulty_test.ts:96`, `drive_max`). Deferred design-scale: **L9** (historical
page retention — `dynamicParams=false` makes "never 404" impossible today),
**L10** (series/editions model — the real home for taste + next-edition
rollover).

---

## 5. Branch hygiene

Only `feat/card-quality-tier0` is genuinely active. **10 branches are stale**
(0 commits ahead of main, i.e. fully merged, OR superseded-by-content):
`feat/multi-select-filters` (superseded, §1-B), `feat/agentic-content-and-nudges`,
`feat/ai-handoff-buttons`, `feat/mcp-race-discovery`, `feat/mcp-setup-help`,
`feat/race-enrichment-phase-2a`, `feat/seo-quick-wins`,
`fix/ai-handoff-unfiltered-prompt`, `fix/codex-audit`, `fix/dynamic-months`.
Safe to delete after a glance; recommend cleaning up to remove the "which branch
is live?" confusion that caused the near-miss deploy this session (§6-Q6).

---

## 6. Open questions needing Dima's decision

- **Q1 — Deploy gate.** After the final audit passes, do we merge Plan 1 to
  `main` and deploy the MCP as one step, or hold the MCP deploy until Slice 2 /
  the other stacked changes are ready to ship together? (Touches §3.)
- **Q2 — Plan sequencing.** Confirm: Plan 3 (location, fixes the rest of Monells)
  before Plan 2 (identity, moves URLs)? Recommended yes.
- **Q3 — R12 schema.** Approve the shared `drivable/no_road_access/unknown`
  contract as a real migration before the backfill (L14)? Recommended yes — the
  audit was firm.
- **Q4 — Design vs. Tier 0 collision.** The race-card redesign brief (Thread C)
  redesigns the page Plan 1 just fixed and Plan 2/3 will keep changing. Who wins,
  and in what order — freeze card code until the redesign lands, or ship Plan
  2/3 first and have the designer work from the fixed page? This is the biggest
  unresolved cross-thread conflict.
- **Q5 — Roadmap priority.** The locked sequence says Step 3 (ask-box) + Step 4
  (dogfood) are the learning goal. Card-quality and design are both *off* that
  sequence. Does card-quality Plan 2/3 and/or the redesign preempt the ask-box,
  or does the ask-box ship first over current data (as the roadmap's permitted
  reorder allows)?
- **Q6 — Branch cleanup + concurrency rule.** OK to delete the 10 stale branches?
  And adopt a standing rule that MCP-touching work rebases on `main` and
  re-verifies the live version before deploy? (This session was one command from
  regressing production because two branches touched the MCP.)

---

## 7. Recommended immediate sequence

1. Run the **final Plan 1 audit** (Codex) — everything waits on the verdict.
2. Resolve the **deploy-state ambiguity** (§3, L17) — verify live MCP version,
   fix `AGENTS.md` to fact. Can happen in parallel with the audit.
3. On a clean verdict: **merge Plan 1 → main**, decide Q1, deploy.
4. **Plan 3** starting with the R12 schema (Q3), then the 176-town backfill.
5. Decide **Q4/Q5** (design vs. build order) before Plan 2 or the redesign moves.
6. **Retire the 10 stale branches** (Q6).
