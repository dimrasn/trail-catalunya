# Design brief — Main page, trailraces.cat

2026-08-24 · v1 · Owner: Dima · Status: ready for designer
Companion brief: `2026-08-24_race-card-design-brief_v1.md` (race detail page — read it first; §1–2 context and §7 honesty rules are shared and not repeated in full here).

**This brief is a thinking assignment, not a spec.** The race-card brief prescribes a structure. Here we prescribe the job, the raw material, the constraints, and our current best hypothesis — and we expect you to explore, iterate, and propose the best possible main page, including directions we have not thought of. Where you disagree with the hypothesis, say so with a mockup, not a paragraph.

---

## 1. The job of this page

The site helps a runner find the **best possible next race**. The main page is where that search happens. Today it is a filterable calendar — correct, fast, and opinion-free. The problem: **a calendar's implicit answer to "what's best?" is "whatever is soonest."** That is the weakest possible ranking. The page must become a *finder* without losing what already works (completeness, speed, honesty, scannability).

The user's mental model (from the owner, use it): a runner weighs **cost of going** (drive, date, availability) against **worth it** (how cool, how hard, whether it matches their level). "I avoid races more than 1 hour away unless it's something very cool."

## 2. What exists today (live at trailraces.cat)

One column, max-width 680, dark theme. Top to bottom: title ("Trail Catalunya 2026 · 129 races") → a 6-row filter bank (drive / distance / elevation D+ buckets / month / province / toggles) → an Ask-AI button row → the race list, grouped chronologically by month. Each card: name + date, town + province + drive time, then distance chips ("11km ↑530m").

## 3. Diagnosed problems (verified against the live page — your proposal must resolve all five)

1. **Chronology is the only ranking.** A spectacular race 6 weeks out sits below a mediocre one next Saturday, forever. No other ordering or highlighting exists.
2. **Filters speak database, not runner.** Elevation buckets ("500–1000 D+") are expert units; runners think "close, hard, this autumn, kids can come." The bank costs ~⅓ of the first mobile viewport before any race is visible.
3. **The site's signature assets are invisible on the list.** A difficulty index (6 levels) and an editorial taste layer (one-line character summaries) exist for the data — the AI/MCP surface serves both on every list row — but the human card shows neither, and difficulty is not a filter. Machines currently get a better list than people.
4. **No point of view.** All 129 races are visually identical. Nothing says "start here" to a newcomer.
5. **No orientation.** The three differentiators — drive times from Barcelona, honest difficulty, AI that knows every race — are never stated on the page. First-time visitors can't tell this apart from a plain listing site.

## 4. Raw material you can design with (all live in the dataset today)

- **Per race:** name, town, province, date (or "expected month" or TBD), official URL, drive minutes from Barcelona (from Plaça Glòries; null for some), distances[] each with km / D+ / sometimes price / sometimes variant name, kids-run flag, sold-out flag.
- **Difficulty:** per distance and event-max — ITRA km-effort number, a 6-word level (Easy / Moderate / Hard / Very hard / Extreme / Brutal), climb density (m/km). Null when D+ unpublished.
- **Taste layer (~55% of races):** a one-line "what makes it special" summary + flags (night race, technicality band), each tagged with provenance (Organizer / Derived / Our read / Our guess).
- **AI layer:** per-context prompts that open Claude/ChatGPT preloaded with the current filters and races; a public MCP server behind it.
- **Coverage caveats you must design for, not around:** ~45% of races have no taste line; some have no D+ (→ no difficulty); some have no drive time; ~138 have only an expected month, not a date. A sparse race must look intentional, never broken.

## 5. Decisions already taken (constraints, not suggestions)

1. **No editorial picks on the cold page.** Recommendations appear only *in response to* user input (a filter set, an AI query). Neutral until the user speaks; opinionated once they have. Any highlighted result must honestly label how it was chosen ("closest match to your filters" — deterministic — unless a human actually curated it).
2. **All filters remain available, and AI is visibly present as an alternative input** — then we observe which the users touch first. Do not force a single funnel; instrument for learning. (You may propose how prominence is balanced; you may not remove either.)
3. **Distances enumerate, never range** ("5 · 21 · 42 km", not "5–100 km"). Kids run is an option, not decoration.
4. **Honesty rules from the companion brief §7 apply everywhere**: provenance labels on every interpreted claim, absence rendered as absence (TBD/dash), expected dates never look confirmed, our judgement never presented as the organizer's.
5. **Sold-out and cancelled must be visible at list level**, not discovered on the detail page.
6. Dark theme, monospace numerals as an existing signature; final tokens come from the parallel design-system track. English UI, long Catalan race names.

## 6. Our current best hypothesis — the benchmark to beat

We prototyped this; it is attached (`2026-08-24_homepage-mockups.html`). Treat it as the baseline: propose it, improve it, or beat it with something better — but any alternative must beat it *on the acceptance criteria in §8*, not on novelty.

- **Card "V2 tiered":** two fixed-job lines under name/date/town — line 1 the numbers verdict (`MODERATE · 15.7 · 21.4 km · up to 1090 D+ · night`), line 2 the taste quote when one exists. Drive in a fixed-width right column (color-cued: ≤1h calm / 1–2h amber / 2h+ muted) so it scans vertically. Difficulty word always present, colored on a fixed Easy→Brutal spectrum.
- **Page top:** a one-line promise under the title naming the three differentiators; the filter bank keeps every axis but **difficulty (human words) replaces D+ buckets as the visible axis** (raw D+, province, kids, night, unscheduled move behind "More"); the AI row reads as an alternative input ("Or just say it — …") with an example query.
- **Pick-after-input:** once filters are set, results return with one "★ Closest match to your filters" block on top carrying a *why* drawn from the taste layer, provenance-labelled. A follow-up AI button inherits the filter context ("Ask Claude about these 4").

## 7. Questions we want you to genuinely explore (not rhetorical)

1. **Is one chronological list the right spine at all?** Alternatives worth testing: a "next 2 weekends" horizon block above the full calendar; ordering within a month by a transparent worth-the-drive heuristic; a map view as a secondary mode. Show us at least one non-calendar organization and argue for or against it.
2. **What is the best first-visit experience** on a phone, cold, no intent yet? The promise line is our floor — is there a stronger orientation that doesn't cost a viewport?
3. **Where does AI belong long-term?** Today it's an outbound link (opens Claude/ChatGPT with a prompt). Design for that reality, but tell us what changes if it ever becomes an on-page conversation.
4. **How should 82 expected-but-undated races and TBD races coexist with dated ones** without polluting the "I can actually plan this" feel?
5. **Density ceiling:** V2 cards are ~30% taller than today's. At 30–50 races per month view, does the list still feel scannable? If not, propose the compact/expanded mechanics (e.g. taste line only on the current month, or on hover/tap).

## 8. Acceptance criteria (any proposal, including ours, is judged on these)

1. **Scan test:** on mobile, scrolling one month of results, a user can compare races on drive + difficulty + distance without opening any card.
2. **Newcomer test:** a first-time visitor understands within 5 seconds what the site does and why it beats a plain race list.
3. **Sparse ≠ broken:** a card with no taste line, no D+, or no drive time looks intentional.
4. **Both inputs alive:** filters and AI are each discoverable and usable within one interaction from page load; neither buries the other.
5. **Neutral-then-opinionated:** no recommendation content before user input; after input, at most one highlighted result, honestly labelled.
6. **Nothing lost:** every capability of the current page (all filter axes, shareable filter URLs, TBD/past toggles, month grouping or an equivalent) survives.
7. **Sold-out/cancelled visible at list level.**
8. **Performance/SEO shape preserved:** the full list must remain server-renderable HTML (the current architecture prerenders it for crawlers; don't design something that only exists after client-side interaction).

## 9. Deliverables

1. **Two genuinely different page concepts** (not one concept in two skins), each as mobile-first comps: cold page, filtered state, and one month of list at realistic density (use the real data in the attached mockups). One concept may be our hypothesis refined; at least one must challenge it structurally (§7.1).
2. Your recommendation between them, argued against §8 — criterion by criterion.
3. List-card spec for the winning concept: all data states (rich / no-taste / no-difficulty / no-drive / expected-date / TBD / sold-out / cancelled).
4. The filter + AI input treatment: cold, active-filters, and cleared states; where "More" lives; how active filters read back to the user.
5. The pick-after-input block: trigger logic, label, why-line sourcing, provenance treatment.
6. A one-page rationale: what you accented, what you demoted, what you rejected and why.

## 10. Reference material

- Live page: https://trailraces.cat/ · companion detail-page brief: `2026-08-24_race-card-design-brief_v1.md`
- Our prototype (the benchmark): `outputs/2026-08-24_homepage-mockups.html` — card variants V1/V2/V3 on six real races incl. all awkward data states, plus the cold-top and pick-after-input compositions.
- Race-card wireframes (visual language continuity): `outputs/2026-08-24_race-card-wireframe-v2.html`
- Difficulty methodology: ITRA km-effort (km + D+/100), 6 levels, endurance-load not steepness; climb density (m/km) covers verticality. Both must be presentable without jargon.
- Honesty ledger: `docs/rules.md` in the repo.
