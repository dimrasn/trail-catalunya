# Trackability requirements — closing the funnel

SEO-architect engagement, 2026-08-24. Companion to `2026-08-20-seo-roadmap.md`
(roadmap) and `tracker.md` (the weekly ritual + decisions ledger this feeds).

## The problem

We can see users *find* the service but not whether it *moved them toward
solving their problem*. The funnel has four stages — found us → viewed a race →
clicked out to the race's own site (**qualified intent**, not proof the problem
was solved — we can't see what happens on the organizer's site) → came back
later (trust, the north star) — and stage 3 is invisible on every channel today.

**These are separate aggregate signals, not one attributable journey (review
#11).** We have no shared identifier joining a page view, an outbound click, an
AI fetch, and an MCP call — so never present them as one linked funnel per user.
Read each as its own aggregate: page views (Vercel), outbound clicks
(`outbound_clicks`, source-tagged), AI fetches (fetch-mix), MCP calls
(`mcp_query_log`). Stage-3 data is what turns the tracker from a dashboard into a
signal: which races have demand, whether race pages plausibly convert (clicks per
race-page view, in aggregate), what to build next (R4 curated pages vs Slice-2
race-page facts), and who to approach first in R7 organizer outreach.

What exists per channel (verified 2026-08-24):

- **Web:** Vercel Web Analytics (page views, referrers — manual read, hobby
  plan, no API) + `crawler_hits` (bots only). Outbound clicks: **nothing** —
  race links are plain `<a target="_blank">`.
- **AI fetch channel** (`chatgpt-user` et al. reading pages for a live user):
  fetch-mix signal wired in `tracker.md` 2026-08-24. Click-through is
  structurally invisible (the user never visits); proxies are chatgpt.com /
  perplexity.ai referrers in Vercel + the weekly hand citation-probe.
- **MCP:** `mcp_query_log` (tool + allowlisted filters + `query_text`,
  anonymous by design — no session id, no IP). `search_races` → `get_race`
  ratio is the agent click-through proxy, aggregate only.

## Requirements

### T1 — Outbound-click beacon (web "problem solved" signal) — build

Every outbound click from a race surface to the race's own site logs one
anonymous row — a **qualified-intent** event, not "problem solved" (review #11).

- **Where it fires:** the registration/race-site link on `/race/{slug}` pages
  (and, only once the redesigned card exposes an external organizer action, on
  the list — see the UI note below). Client-side `navigator.sendBeacon` on click
  — non-blocking, survives the navigation, no delay to the user.
- **Where it lands (review #7 — least-privilege, not a broad key):** POST to a
  Next.js route handler (e.g. `/api/out`) which calls a NARROWLY-permissioned
  `SECURITY DEFINER` RPC (`log_outbound_click`) that can insert into
  `outbound_clicks` and nothing else — invoked with the anon/publishable key, NOT
  a service-role key (a service-role key in the route is broad DB access and must
  not be the ingest credential). The handler validates the payload against an
  allowlist before the call: `race_slug` must match an existing slug (reject
  junk), `source` must be `race_page` (add `list` only when the list surface
  ships). It DERIVES `target_host` server-side from the slug's known race URL —
  never trusts a client-supplied host.
- **Abuse controls (review #7):** rate-limit per IP (reuse the MCP `ratelimit.ts`
  posture), cap the body size, and suppress obvious duplicates (same slug+source
  within a short window) so counts can't be trivially inflated. Treat the numbers
  as DIRECTIONAL demand signal, not bot-clean truth.
- **Schema:** `outbound_clicks(id, race_slug text, source text, target_host
  text, hit_at timestamptz default now())`. **No IP, no UA, no cookies, no
  identity** — same privacy posture as `mcp_query_log` (allowlisted fields
  only, audited 2026-08-20). RLS on, no anon read policy and no anon write policy
  (writes only via the RPC).
- **Why:** the best available proxy for qualified intent on the web channel.
  Per-race click counts rank real demand (feeds Slice-2 enrichment priority and
  R7 outreach order); clicks-per-race-page-view, in aggregate, hints whether race
  pages convert — a soft trigger for R4, never a per-user attribution claim.
- **Acceptance:** a click on a live race page's registration link inserts a row
  within seconds; navigation is not delayed; a fabricated slug is rejected;
  `target_host` is server-derived (a spoofed host in the body is ignored);
  repeated identical POSTs are throttled; the table has no PII columns; bots
  don't pollute it (they don't execute the click handler — verify a scrape day
  adds no rows).
- **UI dependency (review #10):** the CURRENT list `RaceCard` is a single
  enclosing internal link to `/race/{slug}` — there is no external organizer
  action on the card, and nesting an external `<a>` inside that link is invalid
  HTML. So **v1 fires the beacon on the race PAGE only.** A list-surface beacon
  waits on the `feat/fdr-light-redesign` card contract exposing a real, separate
  organizer link as a sibling control (not nested) — and when it does, it must
  bring keyboard/focus behaviour, a new-tab (`rel="noopener"`) disclosure, and
  its own tests. Do not add a list beacon against the current card.

### T2 — UTM tagging on outbound race links — build (ships with T1)

Append `?utm_source=trailraces.cat&utm_medium=referral` to outbound organizer
links (the race page now; the list surface when its redesigned card ships an
external link — see the T1 UI note).

- **Why:** makes our referrals visible in the *organizer's* analytics. This is
  the opening evidence for R7 outreach ("we already send you runners — verify
  your details"), at zero cost. It also survives where our own beacon can't
  see (e.g. a user who copies the link).
- **Care:** append correctly when the target URL already has a query string or
  fragment; skip non-http(s) targets. Pure helper + unit tests (URL edge
  cases), shared by both surfaces.
- **Acceptance:** links on live pages carry the UTM params; a URL with an
  existing `?` or `#` is not corrupted; tests cover both.

### T3 — Funnel readings in the weekly ritual — tracker update (ships with T1)

Add to `tracker.md`: the `outbound_clicks` queries (clicks per race, week
trend, filtered to `source='race_page'`) read as their OWN aggregate signal and
compared ALONGSIDE — not per-user joined with (review #11) — the fetch-mix and
MCP get_race ranks, plus one ritual step: read Vercel race-page views by hand,
compute clicks/views for the top pages in aggregate, log in the decisions ledger.

- **Why:** data with no decision attached is a dashboard. The ledger row is
  what makes this a signal.
- **Acceptance:** queries live in `tracker.md`; the first post-ship ritual
  produces a ledger row with a recheck date.

### T4 — Returning-user read — no build

North star per the roadmap. Read Vercel Analytics visitors/returning weekly by
hand; log in the ledger. Hobby plan has no API — manual is acceptable at this
scale; revisit only if the ritual outgrows 15 min.

### T5 — AI-channel proxies — no build (already live, listed for completeness)

Fetch-mix signal (tracker, 2026-08-24), weekly citation probe, chatgpt.com /
perplexity.ai referrers in Vercel. A chatgpt.com referrer is the AI-channel
"solved AND wanted more" event — the user clicked our citation inside the AI
answer.

### T6 — MCP dogfood contamination — process note, no build

`mcp_query_log` is anonymous, so Dima's own dogfood sessions are
indistinguishable from real agent traffic (2026-08-22/23/24 spikes are largely
dogfood). Until external volume dominates: note dogfood session dates in the
tracker when they happen, and read MCP funnel numbers as an upper bound.
Adding a dogfood marker header was considered and deferred — connector clients
can't easily set custom headers, and the contamination is self-limiting.

### T7 — Email capture — DECISION NEEDED (recommendation: no gate; opt-in value exchange)

Dima's prompt (2026-08-24): *"probably I need to give access to AI features
only after sharing with me email."*

**Recommendation: do NOT gate AI features on email.** Three reasons:

1. **A gate kills the AI channel outright.** `chatgpt-user`, search crawlers,
   and MCP agents cannot complete an email flow — they'd get nothing, cite
   nothing, and the fastest-moving channel we have (138 race pages read by
   OpenAI's crawler in 4 days, ~5 live ChatGPT fetches/day at day 4) goes to
   zero. The GEO bet *is* frictionless citability; the moment access costs an
   email, ChatGPT answers from someone else's calendar.
2. **MCP anonymity is a designed, audited trust feature** (allowlist logging,
   no PII, stated in the untrusted-notice; hardened in the 2026-08-20 audit).
   Reversing it converts a trust asset into a liability and creates the
   system's first PII store as a side effect of a gate.
3. **At zero authority, the asset to grow is citations and habit, not a
   list.** Gating a 4-day-old free service trades compounding distribution
   for a handful of addresses.

**What gets the same signal without the cost — opt-in race alerts on the web
surface,** where a human is actually present: "Email me when registration
opens / the date is confirmed" per race. The enrichment layer already tracks
exactly these facts; Resend is already provisioned for alerts.

- What it yields: identity + retention signal (stronger than a click — a
  subscription is a stated intent to race), a re-engagement channel, and
  per-race demand ranking that beats click counts.
- v1 scope when approved: `race_alerts(email, race_slug, created_at,
  confirmed_at, unsubscribe_token)`, double opt-in via Resend, RLS locked,
  PII isolated to this one table and named as the system's first PII (privacy
  note on the page + an unsubscribe that works). Trigger emails ride the
  existing weekly scrape/enrichment diff.
- When: after T1 click data shows which races have demand (the subscribe
  button goes where the demand is), not before.

## Sequencing

One build unit: **T1 + T2 + T3** (small — one migration, one route handler,
one client wrapper on two surfaces, a URL helper + tests, tracker queries).
T4–T6 are ritual/process. T7 is Dima's decision — recommendation above.
