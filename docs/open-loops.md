# Open loops — race-card quality

Commitments with owners and due dates. A commitment with no destination is a
commitment that gets dropped. Companion to `docs/rules.md` (the rules ledger).

Created 2026-08-23. Review weekly, alongside the Monday scrape.

## Status key
`open` · `blocked` (name the blocker) · `done` (keep one cycle, then delete)

---

## Awaiting Dima's verdict

| # | Loop | Owner | Due | Status |
|---|---|---|---|---|
| L1 | **D1 — roadless towns.** Decide the `minutes / no_road_access / unknown` contract: schema change on `towns`, or site-JSON-only with MCP returning null until Slice 2. Blocks requirement B's plausibility guard. | Dima | 2026-08-30 | open |
| L2 | **D2 — canonical event names.** Approve longest-distance heuristic + override registry for the 6 mixed-name events, or specify a different rule. Blocks the identity plan. | Dima | 2026-08-30 | open |

## In flight

| # | Loop | Owner | Due | Status |
|---|---|---|---|---|
| L3 | Rewrite the Tier 0 spec against the 2026-08-23 audit (9 findings, 6 confirmed errors) and split into 3 plans: presentation truthfulness / event identity & lifecycle / location operations. | agent | 2026-08-24 | open |
| L4 | Geocode + drive-time backfill for **176 active towns** via OSRM/Nominatim (Dima's call 2026-08-23: automate free, no API spend). Acceptance: Monells ≈86 min vs his hand-measured 1h26m. | agent | with location plan | open |
| L5 | Add the golden assertion so a new town missing geocode/drive time fails loudly (R11). Must cover **both** consumers per R7 — Supabase check post-scrape, and a build/CI check on the committed JSON caches. | agent | with location plan | open |
| L6 | Redirect map for every slug that moves when the naming rule changes (R9). Must exist before the identity plan ships. | agent | with identity plan | open |
| L7 | Mirror all identity/date changes into `supabase/functions/mcp/grouping.ts` with parity tests (R8). A code-only MCP deploy is required — `taste.json` untouched, so the inline-size trap does not apply. | agent | with identity plan | open |

## Carried from the audit, not yet scheduled

| # | Loop | Owner | Due | Status |
|---|---|---|---|---|
| L8 | **Stage races.** Pyrenees Stage Run (8 days, 240 km) and Brama Stage Run render as single-day. Full model deferred, but the audit ruled the false single-day presentation cannot wait — needs a Tier 0 end-date override. | agent | with identity plan | open |
| L9 | **Historical page retention.** `dynamicParams = false` means a `REMOVED` event's page 404s at the next rebuild, so "the page persists" is currently impossible. Needs a historical source or a canonical-route registry. | — | 2026-09-15 | blocked on L3 |
| L10 | **Series / editions model.** The durable entity is the race, not the edition. Correct home for next-edition rollover and for the taste layer — attaching taste to an edition is what produces the T2 prior-edition bleed. | — | 2026-10-01 | open |
| L11 | Homepage JSON-LD marks all 17 past-dated events `EventScheduled` (filters on `r.date` only, independent of the client-side homepage filter). | agent | with lifecycle plan | open |
| L12 | Data-quality flags found in passing: `Radikal Estana` has `month='Agost 2026'` but `date_display='2027'`; 11 rows under 10 m climb/km (`Cursa de la Vaca` is 2 m/km); elevation inversions on `Cursa del Torró` and `Corriols de Guardiola`. | — | 2026-09-15 | open |

---

## Done

| # | Loop | Closed |
|---|---|---|
| — | Outside audit of the Tier 0 spec (Codex, different harness per the workspace rule). Verdict: not ready. 6 author errors confirmed, incl. the 176-vs-86 sizing error that invalidated a decision already taken. | 2026-08-23 |
