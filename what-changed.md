# What changed

## 2026-08-23 — Multi-select filters integration branch

Prepared `feat/multi-select-filters-clean` from current `main`, retaining the
current taste flags and projected-time instructions while carrying only the
three multi-select filter commits. The replacement commits use
`Dima <dimrasn@gmail.com>`; the original `feat/multi-select-filters` branch was
left untouched.

- `app/components/FilterBar.jsx` — made bucket chips toggle multiple values and
  made the Any/All sentinel clear only its row.
- `app/components/RaceList.jsx` — moved filter state to arrays and used the
  extracted OR-within-row matchers.
- `app/components/askPrompt.js` — rendered multi-value selections as “A or B”.
- `app/components/askPrompt.test.mjs` — added multi-value prompt coverage.
- `app/lib/filters.js` — added canonical URL parsing/serialization, toggling,
  and site matchers.
- `app/lib/filters.test.mjs` — covered OR matching, canonical round-trips,
  legacy links, invalid input, and the encoded `42+` bucket.
- `supabase/functions/mcp/difficulty.ts` — made distance/elevation matching
  range-aware while preserving same-variant semantics.
- `supabase/functions/mcp/difficulty_test.ts` — covered disjoint bands,
  precedence, and same-variant behavior.
- `supabase/functions/mcp/filters_core.ts` — added pure input normalization and
  event-level filter application.
- `supabase/functions/mcp/filters_core_test.ts` — covered scalar/array inputs,
  OR bands, cross-filter AND, and drive bands.
- `supabase/functions/mcp/log_filter.ts` — allowed bounded multi-value filter
  shapes without admitting arbitrary object fields.
- `supabase/functions/mcp/log_filter_test.ts` — covered array/range caps and the
  query-log privacy boundary.
- `supabase/functions/mcp/protocol.ts` — documented agent-facing OR semantics.
- `supabase/functions/mcp/tools.ts` — added schemas and handlers for the new
  inputs while retaining `taste_flags` from current `main`.
- `AGENTS.md` — recorded that the site and MCP changes are built but not live.
- `what-changed.md` — recorded this multi-file operation.

Verification on the prepared branch: 55 Node tests passed; 134 Deno tests
passed; the Next.js production build generated 235 static pages.

## 2026-08-24/25 — Full de Ruta light redesign (branch feat/fdr-light-redesign)

~50 files. Site-wide dark→light retheme in the Full de Ruta design system + IA rebuild
of both product pages; merged feat/card-quality-tier0 (expected-month display + audit
fixes + undeployed MCP expected-month parity) into the base.

- NEW: app/lib/semantics.js (+ test) — colour/drive/verdict/climb/weekend semantics.
- NEW: app/fdr.css (tokens), app/components/fdr/* (DifficultyChip/Scale, DistanceLadder,
  StatusRibbon, Provenance), app/lib/askprompt.test.mjs, supabase/functions/mcp/tools_schema_test.ts.
- REBUILT: app/race/[slug]/page.js (tier ladder), app/components/RaceCard.jsx (V2 card),
  RaceList.jsx (hero, weekend horizon, closest-match), FilterBar.jsx (difficulty row,
  MORE/SHOW split), FilterChip.jsx, AskAI.jsx (palette buttons); askPrompt.js (difficulty phrase).
- RETHEMED: app/layout.js (+fonts), globals.css, about, for-agents, opengraph-image.
- MCP (merge + fixes, NOT deployed): filters_core.ts (expectedMonth month-parity + honest
  tbd count), tools.ts (schema regression repaired), filters_core_test.ts.
- Verification: node 82 · deno 142 · build 238 pages · browser QA desktop+390px ·
  Codex external review (outputs/2026-08-25_codex-review-findings_fdr_v1.md) — all 8
  findings fixed before merge.
