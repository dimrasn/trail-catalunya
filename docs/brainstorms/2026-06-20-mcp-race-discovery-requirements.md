---
date: 2026-06-20
topic: mcp-race-discovery
---

# MCP Race Discovery — Slice 1 Requirements

## Summary

Expose the live Trail Catalunya race dataset as a hosted, public MCP server so people can plan races by talking to their own Claude or ChatGPT — paying for their own tokens. Tools are shaped around the real planning loop (search by weekend and filters, details that always carry the race URL), and tool descriptions direct the agent to fetch shortlisted race sites at query time to verify registration status and start time. The website stays as the deterministic front end; the broken hosted chat widget is removed. The weekly scrape keeps feeding both surfaces, now with failure-noticing and golden-row assertions so silent data corruption can't pass unseen.

## Problem Frame

Picking a race today is a tedious multi-tab loop. The maintainer starts from a free weekend, filters the calendar by elevation (the binding constraint — distance is rarely the problem), then clicks into each candidate's own website to answer the questions the calendar can't: is registration open, is it sold out, is the race even confirmed, what time does it start, is there a kids run, and is the real drive time under ~60 minutes. Start time is load-bearing twice — it gates both drive feasibility and whether a child can come. The loop exhausts discoverability before the runner ever gets to the interesting question: *which races are worth breaking the 60-minute rule for* — the hidden gems no filter expresses.

The current site (the existing MVP) already solves elevation/distance/drive/month/province/kids filtering well. The unmet need is the part that requires reading individual race sites — and the maintainer's stated smallest proof is not richer stored data but the ability to *ask Claude, with this dataset as the backend*, and have the agent do the click-through legwork. Building stored enrichment first would mean designing a taste-and-status schema before seeing a single real query. Shipping the agent surface first turns real planning sessions into the requirements log that drives later enrichment.

## Key Decisions

- **MCP-first, enrichment-later.** Slice 1 ships the agent surface over today's ~8 fields plus race URLs. No crawler, no evidence model, no stored enrichment. The query log this produces becomes slice 2's grounded requirements.
- **Registration status is verified live by the agent, not stored.** Tools return shortlisted races with their URLs; tool descriptions instruct the agent to fetch those sites and confirm registration/start time before recommending. Agent-fetched status at query time is fresher than any weekly crawl and defers the crawler until demand is proven.
- **The maintainer never pays for usage.** Users bring their own agent and tokens. The server itself must stay inside free-tier limits by design; there is no payment method on file, so the structural worst case is the MCP pausing, never a bill.
- **Website demoted to one client, not rebuilt.** The static site keeps working unchanged except for removing the dead chat widget. The pipeline keeps running; this slice adds observation, not a rewrite.
- **Log every query, without identity.** Full query text and filters are recorded to learn what users need; IP and any identity are not. This keeps the learning value while keeping free-text personal context out of storage.
- **Runs as a Supabase Edge Function.** The MCP server lives in the same Supabase project as the scraper and dataset — one free tier, one platform, no new billing surface, same Deno/TS stack as the existing scrape function.
- **Alerts go to email.** Loud scrape failures, sanity-gate trips, and golden-row assertion failures all notify the maintainer through a single transactional-email channel.
- **Golden set is maintainer-chosen.** The agent proposes ~6-8 large, well-known, multi-distance races and stable facts about them; the maintainer reviews the list during planning.

## Requirements

### MCP server and tools

- R1. A hosted MCP server exposes the live Supabase race dataset over a public URL using streamable HTTP, requiring no authentication to call.
- R2. The server provides a tool to search races by the filters the site already supports — drive time from a chosen origin, distance range, elevation range, month, province, kids run — and by an explicit date or weekend window.
- R3. The search tool accepts an origin other than Plaça Glòries so drive-time results are correct for a user who is not in central Barcelona; it defaults to Plaça Glòries when none is given.
- R4. Every tool response that names a race includes that race's official URL so the calling agent can fetch it for live verification.
- R5. A tool returns full detail for one race: all stored fields plus the URL and the freshness timestamp of the last successful scrape.
- R6. A tool answers "what's on" for a given date or weekend window, accepting the same origin and filter parameters as search.
- R7. Tool descriptions instruct the calling agent to fetch the official site of each shortlisted race and verify registration status and start time before recommending, and to report when it could not confirm rather than guessing.
- R8. Tool responses mark any text relayed from a scraped third-party source as untrusted external content.
- R9. Tool responses state data freshness (the last successful scrape time) so the agent can communicate staleness.

### Zero-cost guardrails

- R10. The server enforces per-IP rate limiting and caps response sizes so a runaway or hostile caller cannot exhaust free-tier quota.
- R11. The deployment stays within the free tiers of its hosting and database; no configuration may introduce a billable plan or a payment method.
- R12. A usage alert notifies the maintainer when monthly invocations approach a set fraction of the free-tier ceiling.

### Pipeline observation

- R13. A failed weekly scrape or a tripped sanity gate notifies the maintainer through a defined channel.
- R14. After each scrape, a small set of golden-row assertions verifies known-stable facts about specific races; a failed assertion notifies the maintainer through the same channel as a loud failure.

### Query logging

- R15. Every MCP tool call is logged with its query text, filter parameters, and tool name, without IP address or any user identity.
- R16. Query logs carry a retention window of 90 days after which they are purged.
- R17. The server's public description discloses that queries are logged anonymously to improve the tool.

### Website hygiene

- R18. The hosted AI chat widget is removed from the public website (or gated to private/dev-only).
- R19. The website continues to read from the live dataset and is otherwise unchanged in this slice.

## Key Flows

- F1. **Plan a weekend.** A user asks their agent for races on a free weekend within a drive budget and elevation range from their location. The agent calls the search/what's-on tool with those constraints and an origin, receives a ranked shortlist with URLs and freshness, fetches each shortlisted race's site to confirm registration and start time, then recommends — flagging any race it could not confirm and noting how stale the underlying data is.
- F2. **Hidden gems worth the drive.** A user asks for races outside the usual radius that are worth a longer drive. The agent searches with a wider drive budget, then uses race detail and live site fetches to characterize candidates, surfacing the trade-off explicitly rather than filtering them out.
- F3. **Weekly freshness.** The scrape runs; on success the data and freshness timestamp update for both site and MCP; on failure, sanity-gate trip, or golden-row assertion failure, the maintainer is notified and the last good data stays live.

## Acceptance Examples

- AE1. **Covers R7, R9.** A user asks for a sub-60-minute, sub-1000m-elevation race next Saturday. The agent returns candidates, fetches their sites, and reports "registration open" for two, "sold out" for one, and "could not confirm registration — see site" for one, and notes the calendar data is N days old.
- AE2. **Covers R3.** A user states they are in Girona, not Barcelona. Drive-time filtering and results are computed from Girona, not Plaça Glòries.
- AE3. **Covers R10, R11.** A caller issues a rapid burst of tool calls; the server rate-limits them and continues serving other callers, and no billable threshold is ever crossed.
- AE4. **Covers R14.** A scrape completes with a plausible row count but a parser drift puts town names in the price field; a golden-row assertion for a known race fails and the maintainer is notified even though the sanity gate passed.
- AE5. **Covers R15.** A user query containing personal context ("near my home with my kid") is logged as query text and filters with no IP or identity attached.

## Scope Boundaries

### Deferred to later slices

- The enrichment crawler and evidence/confidence model. Slice 2 starts with objective practical fields (race confirmed, registration open, start time) extracted and stored, taste fields (scenic, technicality, food/butifarra, vibe) after that — prioritized by the slice-1 query log.
- Every.to-style "Ask in ChatGPT / Ask in Claude / Copy prompt" handoff buttons on the website.
- Per-race detail pages on the website.
- EN / CA / ES localization of the site and filters.
- iCal/calendar feeds, alerts, and saved-criteria notifications.
- Midweek scrape cadence to reduce late-listing latency.
- Multi-source ingestion and entity resolution.

### Outside this product's identity (for now)

- Public user accounts, personal dashboards, monetization, organizer portals.
- A hosted, maintainer-funded AI chat on the website. The product's stance is that users bring their own agent and pay for their own tokens.
- Community correction or moderation flows; there is no community yet.

## Dependencies / Assumptions

- The existing weekly scrape, Supabase dataset, and Vercel site continue operating as today; this slice observes and extends them, it does not rebuild them.
- The agent calling the MCP server can fetch external URLs at query time; live registration/start-time verification depends on that capability and on race sites being fetchable.
- Free-tier limits on the chosen hosting and database are sufficient for dogfooding and early adoption volume.

## Outstanding Questions

### Deferred to planning

- Exact rate-limit thresholds and response-size caps.
- The free-tier usage fraction that triggers the R12 alert.
- Where query logs are stored and how the 90-day purge runs.
- Whether the website continues reading the dataset directly or moves onto the same query layer the MCP server uses (shared-core refactor) — a slice-1-optional, slice-2-likely decision.
