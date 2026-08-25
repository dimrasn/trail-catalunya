# Design brief — Race detail card, trailraces.cat

2026-08-24 · v1 · Owner: Dima · Status: ready for designer
Live example to redesign: https://trailraces.cat/race/cursa-popular-d-amer (simple race) · https://trailraces.cat/race/ultra-pirineu (rich race)

---

## 1. What the product is

trailraces.cat is a directory of ~226 trail races in Catalunya, scraped weekly, with three things no competitor page has: (1) drive time from Barcelona on every race, (2) an honest difficulty index on ITRA's km-effort scale, (3) an AI layer — every race is queryable via Claude/ChatGPT and via a public MCP server. Site is dark-themed, English, mobile + desktop. A design system is being developed in parallel — this brief is about the **composition and content hierarchy of the race detail page**, not final tokens. Where the brief names colors, treat them as semantic intent, not hex decisions.

## 2. The job of this page

The site's job: help a runner find the best next race. The list/homepage does discovery. **The race page answers one question: "is this my best next race?"** — for any visitor, expert or first-timer, in seconds.

The mental model to design around: a runner weighs **cost of going** (drive, date, price, availability) against **worth it** (how cool, how hard, whether it matches their level). The owner's own rule captures it: *"I avoid races more than 1 hour away unless it's something very cool."* The card is a **worth-the-drive verdict**, resolved top to bottom.

## 3. What is wrong with the current page (verified against the live page)

1. **Redundancy.** Date, location, distances and elevation each appear 2–3 times on one screen (subhead + key-facts list + distances table). The key-facts block can be deleted with zero information loss.
2. **Inverted hierarchy.** The loudest element is a 40px drive-time billboard — a question the visitor mostly settled on the list. The signature differentiator, difficulty, is two thin gray rows plus a 3-line methodology paragraph. The method gets more space than the verdict.
3. **Empty promises.** A "Race-day facts" heading often renders only an apology ("not verified yet").
4. **Buried actions.** Register is mid-column; the Ask-AI buttons — part of the product, not a gimmick — are dead last.

## 4. Information architecture — the tier ladder (must follow)

The page resolves in three glances. Order and relative weight are fixed; visual execution is the designer's.

| Tier | Block | Weight |
|---|---|---|
| 0 | **Status ribbon** (sold out / cancelled) — only when applicable | Loudest on the page when present; absent entirely otherwise |
| 1 | **Identity + verdict**: race name, one-sentence verdict, provenance label | Accent |
| 1 | **Difficulty**: level word + visual scale + km-effort/climb numbers | Accent — this is the differentiator |
| 2 | **The gate**: drive time · date · distances (enumerated) | Grouped cluster, glanceable, never a billboard |
| 2 | **Act zone**: Register + Ask Claude / Ask ChatGPT | Co-primary pair; sticky bottom bar candidate on mobile |
| 3 | **Distances table**: every startable option incl. kids run, availability per row | Present, calm |
| 3 | **About this race**: prose + facts + (future) runner quotes — the growth section | Present, calm |
| 3 | **Character** (rich races): setting, terrain, who-it's-for, aid… | Present, calm |
| 4 | Related races, connect-your-own-AI, footer | Quiet |

## 5. Required elements and their rules

**5.1 Status ribbon (tier 0).** A state, not a chip. When any distance is sold out or the race is cancelled, a full-width ribbon at the very top says so and names *which* distances ("Sold out — 100k & 42k · 21k & kids still open"). Partial sell-out is the common case on multi-distance races. When sold out, the Register CTA flips to a muted state and the Related section is promoted as "still-open alternatives." When nothing applies, the ribbon does not exist — no dead chrome.

**5.2 Verdict line (tier 1).** One sentence under the name that lets anyone grasp the race instantly ("A flat, fast 6–12 km village race near Girona — friendly for a PB or a first trail number"). Sourced from the editorial taste layer where it exists (~80 races); auto-generated from stats elsewhere and labelled as such. Always carries a provenance label (see §7). *Open decision D1 (§10) — design must work with and without this line.*

**5.3 Difficulty module (tier 1).** The level word (Easy / Moderate / Hard / Very hard / Extreme / Brutal) plus a visual 6-step scale showing where this race sits, plus the numbers (km-effort, m/km climb) at secondary weight. Methodology collapses to one line + an expandable "how we measure" — never a standing paragraph. Comprehensible without reading anything: color + position + word.

**5.4 Gate cluster (tier 2).** Drive time (color-cued: ≤1h fine · ~1–1.5h think · >1.5h needs-to-be-worth-it), date, distances. **Distances always enumerate, never range**: "5 · 21 · 42 · 100 km", not "5–100 km" — a range reads as a slider, an enumeration reads as the menu it is. Kids run counted here as "+ kids". Drive time keeps its "from Barcelona (Plaça Glòries, estimated)" honesty note at footnote weight.

**5.5 Act zone (tier 2).** Register (primary) + Ask Claude / Ask ChatGPT (co-primary) as one block, with 1–2 example questions underneath ("can I walk the 12k?", "is the 21k a good taster for the 100k?") — people don't know what a card can answer until shown. On mobile, this pair is the natural sticky bottom bar. Exactly one data-freshness disclaimer on the page, here — not repeated per section.

**5.6 Distances table (tier 3).** One row per startable option — **kids run is a row, not a tag** (its distance is often unknown: render "distance TBC"). Columns: distance, climb, effort/level, availability (when known), price (when known). Missing data renders as an honest dash, never invented.

**5.7 About this race (tier 3).** The reserved growth section: short prose, start time/place, setup (bag drop, showers, food), later runner quotes. Renders **only what exists** — for many races today that is one derived sentence; enrichment lands into it over time with no layout change. Design the full state and the sparse state.

**5.8 Character grid (tier 3, rich races only).** Setting, terrain, who-it's-for, aid, tradition — each value with its provenance label. Roughly 80 of 226 races have this.

## 6. States that must be designed

Archetypes (all real, use their real data): **Cursa Popular d'Amer** (simple: 2 distances, flat, Easy, no taste layer) · **Ultra Pirineu** (rich: 4 distances + kids, Extreme, sold-out mix, night start, full taste layer) · a mid case with partial data.

State matrix, each on mobile and desktop:
1. Open, simple race (sparse data — most of the catalog looks like this)
2. Rich race, fully open
3. Partially sold out (ribbon + per-row availability + flipped CTA)
4. Cancelled
5. Date not confirmed ("Expected Oct 2026 — exact date not announced" — an expectation must never look like a confirmed date)
6. Missing pieces: no drive time / no elevation on some distances / no taste layer / no price — every element needs its honest-absence rendering

## 7. Honesty rules (non-negotiable, from the project's quality ledger)

- Every editorial or interpreted claim carries a provenance label: **Organizer** (from the race's own site) · **Derived** · **Our read** · **Our guess** · **Dima (ran it)** · **auto-summary**. Labels are visible but sub-weight — they qualify, they don't compete.
- Our judgement is never presented as the organizer's claim.
- Unknown data renders as unknown (dash, "TBC"), never invented, never filled with plausible placeholders.
- Expected dates read as expectations. Sold-out/start-time claims carry their "confirm on the official site" caveat — once, in the act zone.

## 8. Constraints

- Dark theme is the established direction; monospace for numerals is an existing signature worth keeping. Final tokens come from the parallel design-system work — deliver composition + semantic color intent, not a competing palette.
- One proposal to test: **one color language across the card** — difficulty runs a fixed Easy→Brutal spectrum, and drive time reuses the same warm ramp (near = calm, far = hot). Two of the three key judgements become readable at arm's length.
- Primary device split unknown — design mobile-first, deliver both.
- No hero photography exists in the data today; do not design a layout that collapses without images.
- English UI. Race names are Catalan — the type system must handle long names ("Cursa de Muntanya de…") gracefully.

## 9. Acceptance criteria

1. **The 3-glance test.** A first-time visitor, 5 seconds, mobile: can they state (a) what/where/when the race is, (b) how hard it is, (c) whether it's sold out? All three or fail.
2. **Zero duplication.** Every fact appears exactly once at full weight (an enumeration in the gate + detail rows in the table is the one allowed pairing).
3. **Difficulty needs no reading.** Level is graspable from the visual alone; numbers and methodology are optional depth.
4. **Sold-out is unmissable** without scrolling, on mobile, and names which distances.
5. **Register and Ask-AI are reachable within one thumb-swipe** on mobile at any scroll depth (sticky bar satisfies this).
6. **Sparse race ≠ broken race.** The Amer-class page (most of the catalog) must look complete and intentional, not like a rich page with holes.
7. **Headings-only scan works.** Reading only section labels + big numbers tells the story of the page.
8. **Honesty labels present** on every interpreted claim, at sub-weight.

## 10. Open decisions (flag in your proposal, don't resolve silently)

- **D1 — verdict line for all races?** Recommendation: yes, auto-generated + labelled where no editorial exists; it is the single biggest "grasp it instantly" lever. Design both variants until decided.
- **D2 — runner quotes.** No source or pipeline exists yet. Design the slot; it ships empty-hidden until provenance is solved.
- **D3 — sticky mobile act bar.** Recommended; confirm it doesn't fight the ribbon on sold-out pages.

## 11. Deliverables

1. Mobile + desktop comps for the 3 archetype races across the state matrix (§6) — minimum 8 screens.
2. Component inventory: ribbon, verdict, difficulty module, gate cluster, act zone, distances table, about section, character grid — each with its states (default / sparse / unknown-data).
3. A one-page hierarchy rationale: what you accented, what you demoted, why.
4. Semantic color-intent map (difficulty spectrum, drive ramp, status colors) as input to the design-system track.

## 12. Reference material

- Live pages: the two URLs at top.
- Composition wireframes from the working session (illustrative, not prescriptive): `outputs/2026-08-24_race-card-wireframe-v1.html`, `outputs/2026-08-24_race-card-wireframe-v2.html` — v2 reflects the decided corrections (ribbon, enumerated distances, kids-run row, promoted AI zone, About section).
- Difficulty methodology: ITRA km-effort (km + D+/100), 6 levels; it measures endurance load, not steepness — m/km climb covers verticality. Both must be presentable without jargon.
- Quality/honesty ledger lives in the repo at `docs/rules.md` — the §7 rules derive from it.
