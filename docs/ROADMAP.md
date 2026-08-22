# trailraces.cat — roadmap (source of truth)

Living control-plane doc. Locked sequence at the bottom; update in place with dated provenance. Created 2026-08-20 to consolidate a day of parallel threads into one sequence.

## Where we are (state as of 2026-08-20)

### Shipped & LIVE on trailraces.cat
- Domain live (trailraces.cat, DNS+SSL); GSC verified + sitemap submitted; Bing imported. SEO step-1 (server-rendered list, robots/sitemap/canonical/SportsEvent JSON-LD/og-image).
- **226 per-race pages** `/race/[slug]` — drive-time hero, distances, related-races mesh, internal links, per-race SportsEvent JSON-LD, sitemap. Homepage cards link inward.
- **Difficulty index (ITRA km-effort scale)** — 6-level word (Easy…Brutal) + itra_points 0-6 + D+/km, on race pages and all three MCP tools (per-distance + event-max, null unless every distance has D+). Adopts ITRA's *published* logic; no lookalike, no scraping. (Shipped 2026-08-22.)
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

## Locked sequence (product-director pass, 2026-08-20)

**Through-line:** take the agent-native machinery + race data already built, get all of it live behind one dogfoodable planning on-ramp, and learn whether an AI planning over rich race data is genuinely differentiated — adding zero new scope until the dogfood tells you where the gap is.

**Step 1 — Ship the difficulty index to live pages + MCP. ✅ DONE 2026-08-22.** Cheapest, objective (no honesty/editorial risk), and the safest payload to prove the enrich pipeline deploys cleanly. Shipped on ITRA's public km-effort scale (see the ITRA note below): 6-level word + itra_points 0-6 + D+/km, per-distance and event-max (null unless every distance has D+). Codex reviewed the first cut; all 5 review defects fixed (partial-event false max, filtered-scope mixing, no parity guard, undocumented field, "difficulty" overstated) — now parity-guarded by mirrored tests on both runtimes (`app/lib/format.test.mjs` + `supabase/functions/mcp/difficulty_test.ts`).

**Step 2 — Deploy the 91-race taste layer to live pages + MCP.** Attributes + km-esforç + editorial (unique/cool/catch/who/reference), honesty-tagged, unknown-default; the 29 un-profiled degrade gracefully. Fold the per-race og-image fix in here (already touching page render). This is finished work sitting dark, and the actual substance of the agent-native bet. Done when: the 91 show attributes/editorial on-page + via MCP, honesty tags intact, no un-profiled race renders a broken/invented field.

**Step 3 — Ship the ask-box on-ramp, instrumented.** Natural-language box above the filters (filters stay primary), "Ask Claude →", hands off to the user's AI. ~1-argument change to the existing handoff. Log every query. Only a real test once the data it hands off to is live (steps 1–2). Done when: live above the filters, hands off correctly, every query captured to a readable log.

**Step 4 — Dogfood sprint + gap log.** Dima runs ~8–10 real planning sessions through the ask-box; record every break (wrong ranking, hurtful unknown, missing attribute, clumsy handoff). This IS the learning goal, and the only real demand signal at ~zero traffic. Done when: a written gap list of ≥5 concrete failures, each tagged fix-now / enrich / park — that list seeds the next cycle.

**Parked (say no):** the 29 fix-list races (long tail); full 226 enrichment rollout (gated on demand); new SEO surface + the GSC description tweak (SEO-WAIT); taste-layer persona/voice expansion beyond spec; any MCP v9 / new agentic scope. None re-enter until the dogfood names them.

**ITRA difficulty — resolved 2026-08-22 (no lookalike needed).** Dima's ITRA research (verified at itra.run) established that our km-effort IS ITRA's *kilomètre-effort* formula (km + D+/100), and the km-effort→points table is public. So the "lookalike" framing was wrong for the parts that matter: we adopted ITRA's *actual* public logic, no modelling, no scraping — shipped in Step 1: a 6-level word (Easy/Moderate/Hard/Very hard/Extreme/Brutal) mapped onto ITRA's km-effort boundaries + itra_points 0-6 + D+/km (vertical density) on pages and MCP. What stays parked: **Mountain Level (0-12)** — ITRA does NOT publish its formula (confirmed at itra.run), so it's the only piece that would need a reverse-engineer (a real lookalike) or a per-race scrape of ITRA's published value; re-enters only if the dogfood shows difficulty drives choices AND we have enough ITRA-labelled races. The **aid-station self-sufficiency penalty** (ITRA discloses it) needs per-race aid-station counts → rides along with the enrichment deploy (Step 2).

**Deviation test:** a new idea enters the roadmap only if (a) it ships already-built work to live, or (b) it comes from a failure the dogfood exposed. Otherwise → idea garden, not the sequence.

**Biggest risk:** the enrich pipeline is the one true unknown, and steps 2–4 depend on it deploying cleanly — hence difficulty-index first, to surface friction on the cheapest payload. Permitted reorder: timebox steps 1–2; if the pipeline balloons, ship the ask-box (step 3, standalone) first over current data and fix the pipeline in parallel — don't let an infra rabbit-hole eat the learning.
