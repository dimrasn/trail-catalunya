---
artifact_contract: "ce-handoff/v1"
created_at: "2026-08-22T07:19:43Z"
title: "Difficulty index fixes - implementation handoff"
summary: "Self-contained handoff to correct partial-data and filtered-search semantics, harden site/MCP parity, and return the work with explanations."
keywords: ["trail-catalunya", "trailraces.cat", "km-effort", "difficulty", "MCP", "Supabase", "Next.js"]
cwd: "/Users/dima/Claude/Trails/trail-catalunya"
resume_focus: "Implement the validated difficulty-index fixes locally, verify them, and return an explanation-first summary without deploying or pushing."
repository: "trail-catalunya"
repo_root_sha: "73a5ff9a9ab9a3a9712e6c231b81e59b2ec99829"
branch: "main"
head: "7d2a03ce38328f5e203e569f72de9278f9162c75"
worktree_path: "/Users/dima/Claude/Trails/trail-catalunya"
---

# Difficulty index fixes - implementation handoff

## Objective

Correct the difficulty-index behavior shipped in site commit `7d2a03c` and Supabase MCP function v9. Bring the work back with a concise explanation of the schema decisions, before/after behavior, verification evidence, and any remaining trade-offs.

Implement and test locally. Do not push, deploy the Edge Function, trigger Vercel, or publish anything without Dima's explicit approval.

## Current ground truth

- The site and MCP both compute km-effort as `km + D+/100`, rounded to one decimal.
- An individual distance receives no km-effort unless both km and D+ are known. This invariant is correct and must remain.
- Both implementations currently agree on rounding and bands: gentle `<30`, moderate `<50`, hard `<80`, very hard `<120`, extreme otherwise.
- Full verification already passed: 17 MCP tests, the production build with 235 static pages, live MCP responses, and race pages at 375 px.
- Mobile layout is sound. A four-column Distance / Elevation / Effort / Price table did not overflow at 375 px.
- The worktree has a pre-existing modification to `deno.lock`. It is not part of this feature; preserve it and do not include it in the fix.
- The enrichment pipeline remains built but not deployed. Do not activate or change it as part of this work.

## Why the shipped behavior needs correction

### 1. A partial event can claim a false maximum

Relevant code: `app/lib/format.js:104-122`, `app/race/[slug]/page.js:162-165`, and `supabase/functions/mcp/tools.ts:43-53,90-95`.

Both surfaces discard distances with unknown D+ and calculate the maximum over the remaining values. The result is then presented as the event's definitive difficulty, although it is only the maximum of the known subset.

Production example: Cursa de l'Alba has a 42 km option with unknown D+, plus known 22 km and 12 km options. The site and MCP report `34 km-effort / moderate`. That is necessarily understated: 42 flat kilometres already equal 42 km-effort before any climbing.

### 2. Filtered MCP results mix event and variant scope

Relevant code: `supabase/functions/mcp/tools.ts:143-146` accepts an event when any distance matches; `tools.ts:95` still returns the maximum across every sibling distance.

Production example:

```text
search_races({drive_max:120, month:10, dist_max:10})
```

Ultra Pirineu is correctly included because its 5 km option matches. Its event-level difficulty is nevertheless `166 / extreme`, taken from the 100 km option; the matching 5 km option is `13.6 / gentle`. An agent can reject a suitable variant because the response does not identify which distance matched.

### 3. The contract is duplicated without a parity guard

The site implementation is in `app/lib/format.js:104-122`; the Deno implementation is in `supabase/functions/mcp/tools.ts:43-53`. They agree now, but a later rounding or threshold change can drift silently.

The repository already treats the `app/lib/races.js` / `supabase/functions/mcp/grouping.ts` split as a parity risk and protects it with tests. Use the same principle here.

### 4. Tool and agent documentation does not explain the field

`supabase/functions/mcp/protocol.ts:28-30` mentions km-effort, but tool descriptions in `tools.ts:235-318` omit event scope, matching-variant behavior, and partial-data semantics. `app/for-agents/page.js:112-127` and `public/llms.txt:18` do not advertise the capability.

A client learning the API from `tools/list` can therefore treat event difficulty as the selected distance or assume the value is complete.

### 5. `Difficulty` overstates what km-effort measures

The arithmetic is an endurance-load proxy. It does not measure gradient, descents, terrain, exposure, or technicality.

Example: Vertical Puigestelup is 4 km with 1,047 m D+, producing `14.5 / gentle` despite averaging roughly 262 m ascent per km. The raw formula matches [ITRA km-effort](https://itra.run/About/DiscoverTrailRunning), but the custom bands are not ITRA's published endurance buckets. The [FEEC 2026 rules](https://www.feec.cat/wp-content/uploads/2025/07/Reglament-Curses-per-Muntanya-2026.pdf) also apply a technical factor in their ultra hardness coefficient.

## Recommended design

This is the preferred implementation, not an option survey.

### Distance-level contract

Keep the existing invariant and field:

```json
{
  "km": 21.4,
  "elevationGain": 1090,
  "km_effort": 32.3
}
```

If either input is unknown, `km_effort` must be `null`. Never substitute zero for missing D+.

### Event-level contract

Only emit an event aggregate when every distance has a valid km-effort. This is the simplest honest contract.

Complete event:

```json
{
  "difficulty": {
    "km_effort": 166,
    "band": "extreme",
    "scope": "event_max"
  }
}
```

Partial or all-missing event:

```json
{
  "difficulty": null
}
```

Known per-distance values remain available even when the aggregate is null. Document that `difficulty:null` means a reliable event maximum cannot be calculated, not that the race has zero effort.

### Filtered-search contract

Keep `difficulty` stable as the complete event maximum; do not make the same event's aggregate change with query filters. Add `matched_distances` to `search_races` and `whats_on` when distance or elevation filters are supplied.

For the Ultra Pirineu query above, the response should retain `difficulty.scope:"event_max"` and return only the 5 km option in `matched_distances`. The full `distances` array should remain present so event context is not lost.

Apply all supplied distance and elevation predicates to the same variant when calculating `matched_distances`. The current separate `.some(...)` checks can let one distance satisfy the distance condition and another satisfy the elevation condition; do not preserve that ambiguity.

### Site presentation

- Rename the key fact from `Difficulty` to `Max endurance effort`.
- Show it only when all event distances have known km-effort.
- Keep the per-distance `Effort` column when at least one distance has a value; use a dash for unknown rows.
- Add a short visible or tooltip explanation: `Km-effort combines distance and climb; it does not measure steepness or technical terrain.`
- Keep the existing missing-elevation note.
- Preserve the current responsive table behavior.

The MCP JSON key can remain `difficulty` for compatibility, but its descriptions must call it an endurance proxy and state `scope:"event_max"`.

## Implementation map

1. `app/lib/format.js`
   - Add a pure completeness-aware event aggregate helper, or change `maxKmEffort` so callers cannot mistake a partial maximum for a complete one.
   - Preserve formula, one-decimal rounding, and exact half-open band boundaries.

2. `app/race/[slug]/page.js`
   - Gate the aggregate on every distance having known km-effort.
   - Rename the key fact and add the limitation copy.
   - Leave the per-distance behavior intact.

3. `supabase/functions/mcp/tools.ts`
   - Extract pure difficulty decoration and variant-matching helpers so they can be unit-tested without Supabase.
   - Emit event difficulty only for complete events and include `scope:"event_max"`.
   - Return `matched_distances` for variant-filtered searches.
   - Ensure combined distance/elevation constraints match the same distance.
   - Update `Distance` / event result types so `km_effort`, `difficulty`, and `matched_distances` are declared rather than runtime-only additions.

4. Tests
   - Add `app/lib/format.test.mjs` for the site implementation.
   - Add a focused Deno test such as `supabase/functions/mcp/difficulty_test.ts`.
   - Use one shared fixture set where practical. If the runtimes cannot safely import one module, shared fixtures are enough; do not force a deployment-brittle cross-runtime import.
   - Add a pure test for filtered matching and the same-variant rule.

5. Contract surfaces
   - Update all three descriptions in `supabase/functions/mcp/tools.ts`.
   - Update `supabase/functions/mcp/protocol.ts`.
   - Update `app/for-agents/page.js` and `public/llms.txt`.
   - Keep wording consistent across every surface.

## Required test cases

Encode these as automated fixtures where possible:

1. Missing km -> `null`.
2. Missing D+ -> `null`, never a value calculated with zero climb.
3. `21.4 + 1090/100` -> `32.3`.
4. A whole result displays as `166`, not `166.0`.
5. Exact bands: `30` moderate, `50` hard, `80` very hard, `120` extreme.
6. All distances missing D+ -> site has no aggregate and no Effort column; MCP `difficulty:null`.
7. Partial Cursa de l'Alba shape -> site has no aggregate; MCP `difficulty:null`; known per-distance values remain.
8. Complete Ultra Pirineu -> event `166 / extreme`; per-distance values remain `166`, `70`, `35.5`, and `13.6`.
9. `dist_max:10` Ultra Pirineu result -> `matched_distances` contains the 5 km option and its `13.6`; event difficulty remains explicitly scoped to `event_max`.
10. Combined distance and elevation filters -> one variant must satisfy both.
11. A four-column race table remains within a 375 px viewport.

## Verification before returning

Run from the repository root:

```bash
deno test --allow-read supabase/functions/ eval/
node --test app/lib/enrichment.test.mjs app/lib/format.test.mjs
npm run build
git diff --check
git status --short
```

The build uses `.env.local` and should generate 235 static pages unless the live dataset has legitimately changed. The existing Next.js middleware deprecation warning is unrelated.

Do not use local `deno check` failures involving `npm:@supabase/realtime-js` as evidence of a defect; the project guide documents that as local tooling noise.

If deployment is later approved, repeat the production checks:

- Query the MCP for Ultra Pirineu and a fully missing-D+ race.
- Query Cursa de l'Alba to confirm partial aggregate suppression.
- Run the `dist_max:10` Ultra Pirineu query and inspect `matched_distances`.
- Check Ultra Pirineu, Cursa de l'Alba, a missing-D+ race, and a four-column race page at 375 px.

## What to bring back

Return the completed local diff with:

1. The decision in one sentence: how event completeness and filtered-distance scope now work.
2. Before/after JSON for Cursa de l'Alba and the filtered Ultra Pirineu query.
3. A file-by-file change summary explaining why each change exists.
4. Exact test and build results, including counts.
5. Confirmation that `deno.lock` was preserved and no deployment or push occurred.
6. Any compatibility risk for clients already consuming MCP v9.

Do not report only that the tests pass. Explain why the two misleading production scenarios can no longer occur.
