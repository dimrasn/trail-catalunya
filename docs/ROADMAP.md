# trailraces.cat — roadmap (source of truth)

Living control-plane doc. Locked sequence at the bottom; update in place with dated provenance. Created 2026-08-20 to consolidate a day of parallel threads into one sequence.

## Where we are (state as of 2026-08-20)

### Shipped & LIVE on trailraces.cat
- Domain live (trailraces.cat, DNS+SSL); GSC verified + sitemap submitted; Bing imported. SEO step-1 (server-rendered list, robots/sitemap/canonical/SportsEvent JSON-LD/og-image).
- **226 per-race pages** `/race/[slug]` — drive-time hero, distances, related-races mesh, internal links, per-race SportsEvent JSON-LD, sitemap. Homepage cards link inward.
- **/about** (Dima's voice) + **/for-agents** (extractable MCP docs). `public/llms.txt`.
- **Ask-AI handoff** — list + per-race prompts; drive-time ranking + Strava/Garmin composition nudges.
- **MCP server v8** (public, verify_jwt:false) — agentic-composition instructions (readiness + projected finish via Riegel/Naismith v1), DISCOVERY block, `personalization` envelope; security-hardened (allowlist query log, injection guard, ceiling+rate-gating on initialize/tools, get_race personalization). Verified live.
- **Instrumentation** — Vercel Web Analytics + `crawler_hits` log (middleware); SEO measurement-loop tracker (`docs/seo/tracker.md`) + weekly cron (Mon 09:32 CET).
- Connector-tier copy corrected. GSC Event-schema decision logged (defer 2 truthful fixes, ignore 3).

### Built as a DATASET or PLAN — NOT live
- **Enrichment dataset** — 91/120 upcoming-2026 races taste-profiled (attributes + km-esforç index + unique/cool/catch/who/reference, honesty-tagged) in `docs/enrichment/2026-batch/`; overrides for Burriac Atac (runner notes) + Burriac Xtrem (PDF); `_fix-list.md` (29 un-fetchable sites). **Content only — not on any page or in the MCP.**
- **best-next-race on-ramp** — requirements (`docs/brainstorms/2026-08-20-best-next-race-requirements.md`) + plan (`docs/plans/2026-08-20-001-feat-best-next-race-onramp-plan.md`) + Proof link. **Not built.** Refined by the product director into an "ask-box" (not a search bar) above the filters.
- **Taste-layer design** — attribute model (Catalan organizer) + editorial questions + persona/voice spec (content growth hacker). Deferred build.

### Decided direction (from today's specialists)
- SEO/traffic: **wait** — new .cat domain, harvest is spring-2027; monthly GSC check only.
- Agent-native is the differentiated bet + the learning goal; the planning on-ramp is the dogfood.
- "Make it better for me" is legit only as friction hit during a real task; the majority won't use AI, so the filter discovery page stays primary.
- Enrichment = structured evidence-backed attributes (+ editorial), never doorway prose; honesty-default-unknown.

## Open threads (the deviation to resolve)
1. Build the **ask-box on-ramp** (plan ready, PD-refined).
2. **Deploy the taste layer onto the site + MCP** (the dataset exists; wiring/pipeline deferred).
3. Resolve the **29 fix-list races** (agent-browser for JS/403 sites; manual for Instagram-only).
4. **GSC description + per-race og-image** (ride-along fixes).
5. Difficulty-index (`km + D+/100`) as a cheap now-win from data we already have.

## Locked sequence
_To be finalized with the product director (this section is the output of that pass)._
