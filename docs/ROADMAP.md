# trailraces.cat — roadmap (source of truth)

Living control-plane doc. Locked sequence at the bottom; update in place with dated provenance. Created 2026-08-20 to consolidate a day of parallel threads into one sequence.

## North star (Dima, 2026-08-22)
**Build the best possible AI-agent-friendly discovery layer for races** — starting from the small Catalunya subset — **as a learning experience for me, and in parallel bringing value to fellow runners.** The agent/MCP experience is the crown jewel: optimise how well an agent can discover, reason over, and plan races from this data. Learning + runner value are the two payoffs; public SEO/traffic and scale are downstream of getting the agent-native layer genuinely good. Rigor is bought where it makes the agent layer more trustworthy, not for its own sake.

**Consequence for sequencing (2026-08-22):** Step 2 (taste) ships **in slices, piece by piece** — the honesty floor holds on every slice, but we do NOT gate the dogfood on perfecting all 91. Ship the cleanest trustworthy slice to site **and** MCP, learn, then add slices.

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

## Strategic correction (2026-08-31 — outside review + owner)

An outside review (Codex) of the late-August enrichment work landed three corrections; the owner accepted them:
- **Enrichment is a product CAPABILITY, not the growth strategy.** The "enrichment-as-GEO-primary-source engine" thesis (floated *after* the enrichment attempt collapsed to 20 reviewed routes) was rejected as sunk-cost: normalizing PUBLIC organizer data is aggregation, not primary-source origin (real primary source = organizer-confirmed updates, first-hand runner observations, original route analysis, proprietary results/usage data). Google states structured data is not a special requirement for AI answers. **Crawl ≠ citation ≠ demand.**
- **The enrichment failure was FIELD SELECTION, not the honesty bar.** Character + social handles were speculative, low-value, weak-evidence fields; the reviews correctly killed them. Lesson: pick high-value fields, confirm them cheaply (a ~15-min human approval pass at 226 races), and DON'T build a generalized identity/validation engine.
- **STOP building validation infrastructure for speculative enrichment** — the proposed "pass-runner service" is rejected at this scale. Manual approval is cheaper, faster, more honest.

**The next cycle is DISTRIBUTION + DEMAND VALIDATION on what already ships, not more building:**
1. Ask-box is live (Step 3) → dogfood it with COLD runners (Step 4). **Distribution is the bottleneck** (a Catalan trail-running forum / subreddit / FB group, or 3–4 running friends).
2. Cheap discovery plumbing (owner-account tasks): MCP-registry submission (registry.modelcontextprotocol.io + PulseMCP/Glama/Smithery — serves the agent-native crown jewel); Bing Webmaster + IndexNow (Bing is the retrieval layer behind ChatGPT-search/Copilot); AI-referrer tracking (GA4 + Bing AI Performance). `robots.js` already allows all bots — no change needed (verified 2026-08-31).
3. Close the SEO measurement loop (`docs/seo/tracker.md`) and FIX it — the weekly cron records nothing (it git-commits from a cron on a shared worktree); move readings to a Supabase table.
4. ONLY if indexing is healthy: 3–5 hand-curated answer pages from already-trusted facts as an experiment vs ordinary pages — NOT 15–20, and NO new enrichment fields until a real query / click / failed planning session names the missing fact.

The parked note below ("full 226 enrichment rollout — gated on demand") stands, reaffirmed: **demand names the enrichment.**

## Locked sequence (product-director pass, 2026-08-20)

**Through-line:** take the agent-native machinery + race data already built, get all of it live behind one dogfoodable planning on-ramp, and learn whether an AI planning over rich race data is genuinely differentiated — adding zero new scope until the dogfood tells you where the gap is.

**Step 1 — Ship the difficulty index to live pages + MCP. ✅ DONE 2026-08-22.** Cheapest, objective (no honesty/editorial risk), and the safest payload to prove the enrich pipeline deploys cleanly. Shipped on ITRA's public km-effort scale (see the ITRA note below): 6-level word + itra_points 0-6 + D+/km, per-distance and event-max (null unless every distance has D+). Codex reviewed the first cut; all 5 review defects fixed (partial-event false max, filtered-scope mixing, no parity guard, undocumented field, "difficulty" overstated) — now parity-guarded by mirrored tests on both runtimes (`app/lib/format.test.mjs` + `supabase/functions/mcp/difficulty_test.ts`).

**Step 2 — Deploy the taste layer to live pages + MCP. 🟡 Slice 1 SHIPPED 2026-08-22.**
Shipped in slices (north-star decision). **Slice 1 (LIVE, site + MCP v11):**
editorial (what makes it special / catch / who) + clean character attributes,
each honesty-labelled by claim_strength (Organizer/Derived/Our read/Our guess/
Dima); 84 publishable profiles, 80 join on the site; per-tool MCP projection.
Built through two external audits + a code-review; correctness bar met (editorial-
as-fact = 0, prior-edition flagged, source-addressable). **Slice 2 (next):**
operational facts (start/cutoffs) via compound-bullet manual splits + the
prior-edition hide gate; chunk-3's ~10 url-only races (town backfill join); the 4
non-joining + exception-tail salvage; og-image ride-along. Deferred per Trade-1/2
lean: the resolution-ledger + digest-parity machinery (revisit if taste scales to
226 / regenerates on a cadence).

**Step 3 — Ship the ask-box on-ramp, instrumented. ✅ SHIPPED & LIVE (goal-first capture `62a3fd4`, intent logging `489c224`, dogfood fixes `5a72739`; on `main`, live on trailraces.cat — verified 2026-08-31, homepage placeholder "a hard race under 1h away I can train toward" + Ask-Claude).** Natural-language box above the filters (filters stay primary), "Ask Claude →", hands off to the user's AI; every submit logged via the intent RPC (AGENTS.md deployment-state). **NOTE (2026-08-31): the roadmap was stale on this — an outside review flagged it built. The next build is NOT the ask-box; it's dogfooding what's already shipped (Step 4).**

**Step 4 — Dogfood sprint + gap log. ← THE CURRENT NEXT STEP (2026-08-31).** Run ~8–10 real planning sessions through the (live) ask-box; record every break (wrong ranking, hurtful unknown, missing attribute, clumsy handoff). This IS the learning goal, and the only real demand signal at ~zero traffic. Done when: a written gap list of ≥5 concrete failures, each tagged fix-now / enrich / park — that list seeds the next cycle. **Critical (outside-review point, 2026-08-31): test with COLD external runners, not just Dima + agents — and the real bottleneck is DISTRIBUTION (where do cold runners come from at ~zero traffic: a Catalan trail-running forum / subreddit / FB group, or 3–4 running friends). Solve that first, or the dogfood can't run.**

**Step 5 (candidate — net-new scope, not dogfood-driven; enters on Dima's go) — Localize the site to Catalan + Spanish (three languages).** *Rationale:* real traffic arrives via ChatGPT/search READING PAGES (CPO data, 2026-08-24), and runners search in Catalan/Spanish ("cursa de muntanya" / "carrera de montaña") — so localized pages + `hreflang` directly widen the GEO/SEO channel that *is* the traffic. Closer to the core bet than to nice-to-have. *Sequencing:* **AFTER `feat/fdr-light-redesign` lands** — localizing a homepage mid-rewrite is throwaway (same trap as Step 3 U1). *Scope v1:* UI chrome + difficulty words + static pages (`/about`, `/for-agents`) + `lang`/`hreflang` + a localized sitemap; race **data stays source-language**. The taste **editorial** ("Our take") is a **later slice** — machine-translating our own honesty-labelled analysis needs a correctness pass, not a bulk translate, or the honesty floor breaks in translation. The **MCP stays English** (agents translate; localization is a site/SEO concern, not an MCP one). *Needs its own brainstorm/plan first* (routing model, race-name/town handling, what gets translated) — it's a workstream, not a config flag. Per the deviation test it's net-new, so it waits for an explicit go or a dogfood signal rather than auto-entering. Added 2026-08-25 at Dima's request.

**Parked (say no):** the 29 fix-list races (long tail); full 226 enrichment rollout (gated on demand); new SEO surface + the GSC description tweak (SEO-WAIT); taste-layer persona/voice expansion beyond spec; any MCP v9 / new agentic scope. None re-enter until the dogfood names them.

**ITRA difficulty — resolved 2026-08-22 (no lookalike needed).** Dima's ITRA research (verified at itra.run) established that our km-effort IS ITRA's *kilomètre-effort* formula (km + D+/100), and the km-effort→points table is public. So the "lookalike" framing was wrong for the parts that matter: we adopted ITRA's *actual* public logic, no modelling, no scraping — shipped in Step 1: a 6-level word (Easy/Moderate/Hard/Very hard/Extreme/Brutal) mapped onto ITRA's km-effort boundaries + itra_points 0-6 + D+/km (vertical density) on pages and MCP. What stays parked: **Mountain Level (0-12)** — ITRA does NOT publish its formula (confirmed at itra.run), so it's the only piece that would need a reverse-engineer (a real lookalike) or a per-race scrape of ITRA's published value; re-enters only if the dogfood shows difficulty drives choices AND we have enough ITRA-labelled races. The **aid-station self-sufficiency penalty** (ITRA discloses it) needs per-race aid-station counts → rides along with the enrichment deploy (Step 2).

**Deviation test:** a new idea enters the roadmap only if (a) it ships already-built work to live, or (b) it comes from a failure the dogfood exposed. Otherwise → idea garden, not the sequence.

**Biggest risk:** the enrich pipeline is the one true unknown, and steps 2–4 depend on it deploying cleanly — hence difficulty-index first, to surface friction on the cheapest payload. Permitted reorder: timebox steps 1–2; if the pipeline balloons, ship the ask-box (step 3, standalone) first over current data and fix the pipeline in parallel — don't let an infra rabbit-hole eat the learning.
