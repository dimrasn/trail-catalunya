# Best next race — agent-native planning on-ramp (v1)

Status: requirements (brainstorm output, 2026-08-20). Feeds `/ce-plan`.
Origin: product-director session ("build the agent-native planning loop, dogfood it") → this brainstorm.

## Outcome

A runner states what they want and gets **the best next race for that goal** — a ranked, reasoned few, not a list. Zero setup by default; deeper if they've connected their own Strava/Calendar/Weather.

## The problem (from Dima's own workflow)

Planning the next few months of races today = talk to a coach for the performance skeleton, then hand-crawl multiple calendars/marketplaces site-by-site, date-by-date, link-by-link to answer "is it close, is it a good route, how technical, is there butifarra at the finish, could I PB." No tool takes an intent and returns a reasoned shortlist. The tedium is the manual, multi-site detail-gathering.

## Primary user (an explicit scope decision)

**A runner who wants their next cool race** — arrives cold (likely via search), probably has *no* connectors. Not the season-planner. Dima-the-season-planner is a power-user subset served by the same handoff once connectors are on. This choice is deliberate: optimise for the majority's job ("find me the best next race"), not the power user's ("sequence my season").

Consequence, load-bearing: the experience must be great with **zero connectors**. The four "best" axes split —
- **Zero-setup (site data only):** enjoyment/vibe, low-logistics (drive time), novelty.
- **Upgrade (Strava present):** PB-potential, readiness, projected finish time.

## The bet this v1 proves (context, not v1 scope)

trailraces.cat is a **race spine** (facts: distance, D+, drive time, start, url). An agent composes it with the user's OWN connectors to serve a stack of jobs: readiness + projected time + PB-potential (Strava), race-day weather, shoe pick, logistics→calendar (Calendar), and the experience layer (scenic/technical/butifarra). v1 is the thin end of that wedge; the rest is the roadmap below.

## v1 scope — the "best next race" tiered on-ramp (Approach C)

One flow across two surfaces:

1. **On-site goal capture (the on-ramp).** Entry flips from filter-first to **goal-first**: "What are you looking for?" — quick intent chips (fun trail / somewhere new / chase a PB / kid-friendly / what's on soon) + a free-text box for what filters can't hold ("scenic, under an hour, butifarra at the finish") + a few light constraints. This is new; today's Ask-AI sends only filter state, this sends *intent*.
2. **Tailored handoff.** The site turns goal + live race data into a tailored prompt and drops the user into Claude/ChatGPT. No account, no connector required.
3. **Reasoned answer (in the agent).** A ranked few, drive-time-first for low-faff, each with a "why it fits" tied to the stated goal. If Strava/Calendar/Weather are present, the answer deepens (readiness, projected time, PB-potential); if not, it degrades gracefully to shortlist + reasons.
4. **Intent logging.** The captured goal is logged (extends the existing anonymous MCP query log) — the signal that reveals which taste-fields real demand justifies investing in.

Requirements:
- The reasoning lives in the agent (open-ended intent is what LLMs are best at); the site owns capture + handoff + the intent signal. Neither surface tries to be the other.
- Readiness/PB lines are the *only* thing gated behind a connector. Everything else is zero-setup.
- Every recommended race still carries "verify registration + start time at the official site" — the honesty rule holds.
- Composition stays local in the user's own agent; the server never receives or stores training data.

## Success criteria (testbed, not revenue)

- Dima genuinely uses it to find his own next races (the dogfood test).
- The intent log fills with real goals → tells us which taste-fields to build.
- The weekly AI-citation probe shows the reasoned-shortlist behaviour surfacing when asked ("trail race near Barcelona in October, ~25k").
- Qualitative: a reasoned few with "why" beats the current list/filter path for a real planning task.

## Scope boundaries

**Deferred to the roadmap (captured, not v1):**
- The **experience/taste layer as structured data** (scenic/technical/butifarra) — v1 lets the agent infer/fetch it; the intent log gates the investment. *Sourcing is an open question (see below).*
- **Exact start point + parking** as structured data — agent fetches from the official site in v1.
- **Personalized precomputed index** (rank all 226 for PB-potential/readiness vs your Strava) — bigger build, later.
- **Logistics → calendar** (block start/parking/drive into the user's calendar) — a strong standalone job, next after v1.
- **Weather and shoe-pick** jobs — agent-composed later.
- **Season-sequencing** as a first-class feature — the handoff can still do it for power users; not the v1 shape.

**Outside this product's identity:** accounts, saved plans, multi-user features, email/alerts — no users to serve; pure speculation pre-traffic.

## Key decisions (locked)

- **Approach C (tiered on-ramp)** over site-native ranking (A) or pure handoff (B): serves the cold majority, plays to the agent's strength, and captures the intent signal on-site.
- **Strava-optional**: v1 must be excellent with zero connectors.
- **Zero server-side storage of training data** preserved; local composition only.

## Dependencies / assumptions

- Requires a composing agent (Claude/ChatGPT) for the reasoning; the site alone does capture + handoff. This is the bet, not a risk to engineer away.
- v1's experience-axis reasoning is agent-inferred; quality there is bounded until the taste layer becomes real data.
- Leans on the live MCP composition instructions (readiness/projected time) already deployed.

## Open questions

- **Where exactly the on-ramp sits** on the homepage (replace the filter-first hero, or sit above the filters as a guided path) — a design call for planning.
- **How much constraint capture** before it's friction — chips + free text may be enough; test.
- **Sourcing the taste/description layer** — RESOLVED in principle (content-growth review, 2026-08-20), still deferred as a build:
  - Extract **structured, evidence-backed experience attributes** (e.g. scenic / technical / food-at-finish), each with the same `value + confidence + evidence + source + edition + last_checked` envelope as the facts pipeline — NOT generated "about this race" prose (that's the doorway-farm trap the anti-thin rule bans and what the PD meant by "stop adding SEO surface"). Any human-readable description is a *composition of those attributes in our voice*, never a hosted summary of the organizer's copy.
  - The line: the **proper-noun-strip test** — strip proper nouns/numbers; if two descriptions become interchangeable it's spam, if they stay distinct on real attributes it's a resource. Low-confidence attributes are dropped, not hedged ("scenic: unknown — no evidence" is the brand).
  - Extends the built-but-undeployed `enrich-races` pipeline (same crawl, schema, eval harness, MCP envelope) — not a new system.
  - **Which** attributes to extract is set by the query-intent log, not built on spec — the log is near-empty at zero traffic, so seeding taste fields now is guessing with the tool built to stop guessing.
  - Candidate attributes to seed (Dima, 2026-08-20), pending query-log confirmation: **start time of day** (early-morning vs later — a real logistics + experience signal nobody surfaces), scenic, historical, and distinctive character (a race *through a winery*, *through a national park*, or with a *long-standing tradition*). The rendered description is composed FROM these attributes through the **runner's lens** ("why this race is cool to run"), never a summary of the scraped page.
  - Sequencing: a **10–15 rich-race structured test** (measure coverage, calibration, strip-test) is the de-risking move; full ~130-race rollout gated on (a) the facts pipeline actually deployed and (b) the query log showing real experience demand. Cost is ~€1 (piggybacks the existing crawl); the real cost is eng + eval. Does not block v1 (agent-inferred in the interim).
