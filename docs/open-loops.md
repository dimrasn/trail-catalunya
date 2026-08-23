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
*(L1 and L2 closed 2026-08-23 — see Done.)*

## In flight

| # | Loop | Owner | Due | Status |
|---|---|---|---|---|
| L14 | **R12 schema work must precede the Plan 3 backfill.** Shared `drivable / no_road_access / unknown` contract across site JSON + `towns` table, or 176 towns get written under a contract we know is wrong. | agent | with Plan 3 | open |
| L15 | **Build the canonical name registry (R13)** before any Plan 2 identity change; pin display name and slug independently. | agent | with Plan 2 | open |
| L16 | **MCP has no expected-month fields.** Site now shows 87 expected months; `mcp/grouping.ts` does not, so agents still see these as undated. Parity work + code-only deploy. | agent | with Plan 2 | open |
| L13 | **Pre-existing on `main`:** `deno test` type-check fails at `difficulty_test.ts:96` — `drive_max` is not declared in `VariantFilter`. Reproduced with all Plan-1 changes stashed. Blocks the documented test command; 114 tests pass with `--no-check`. May already be fixed on `feat/multi-select-filters` — check before fixing. | agent | 2026-08-30 | open |
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
