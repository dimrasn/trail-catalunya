# Handoff: confirmation pass on the Plan 1 P1 fixes

**You are the outside auditor, and you already reviewed this once.** Your last
verdict on Plan 1 was **"not safe to merge"** with four P1 findings (plus a P2
and two structural rule notes). All were accepted and fixed. **This is a
confirmation pass, not a fresh review** — your job is to decide whether each
finding is genuinely closed, whether the fixes introduced new defects, and
whether the rewritten rules are sound. Then a merge yes/no.

Run in the same different-harness discipline (Codex). Read `docs/rules.md`
(governing doc) and `AGENTS.md` (cold-start, incl. the test-flag traps) first.

---

## What changed since your last review

One commit: **`cb11696`** — "fix(cards): close 4 P1s from the Plan 1 audit".
Start with `git show cb11696`. It touches 7 code files + `docs/rules.md` +
`docs/open-loops.md`. The commit under your *previous* audit was `5f0b791`;
everything before it is unchanged and out of scope for this pass.

Branch `feat/card-quality-tier0`, off `main` (`372bce3`). **Not pushed, not
deployed.** Plans 2 and 3 still not started.

Your prior findings and the disposition claimed:

| # | Your finding | Claimed fix |
|---|---|---|
| F1 (P1) | Partial elevation → false "up to X m D+" on 6 events | New `completeMaxElevation()`; `elevationSummary` + `metadataDistancePart` now return null unless every distance has D+. New rule **R14**. |
| F2 (P1) | Expected month absent from hero, related-list, card, askPrompt, month filter, MCP | All site surfaces fixed; **MCP explicitly deferred to Plan 2 (L16)**. |
| F3 (P1) | Expected-month derivation accepts contradictory data (4/91) | `races.js` now requires in-range month + all rows agree + no `date_display` year conflict. 91 → 87 published. **R6 amended.** |
| F4 (P1) | R12 overloads MCP `null` (unknown vs no-road) | R12 rewritten to a shared `drivable/no_road_access/unknown` contract; **v1 kept in the ledger as `falsified`**. Schema work gated before Plan 3 (L14). |
| F5 (P2) | R1 wrongly extended to elevation | **R1 narrowed** to independently-selectable distances; elevation reverts to a span. |
| — | R13 (longest-distance naming) structurally unstable | **R13 rewritten**: registry primary, heuristic only proposes for new events. Not implemented (L15). |

---

## What to verify — each finding, one at a time

For each, confirm the fix is real AND that it did not break something adjacent.

**F1.** Read `completeMaxElevation()` and its two callers in
`app/lib/format.js`. Confirm: (a) an event with any null-D+ distance publishes
no "up to X" and no elevation span; (b) `difficulty`/`km-effort` paths are
unaffected. Reproduce against build:
```
npm run build
# titles claiming "up to X m D+" on a partially-known event should be 0
```
The 6 partial-elevation events (from the active dataset) are the population.
Independently recompute that count and name at least one.

**F2.** This is the fix most likely to have leaked, because it touched 5
surfaces. Verify in the BUILT HTML, not just the source:
- no race page whose **own hero** says "Date TBD" while its body says
  "Expected" (the same-page contradiction Plan 1 introduced);
- `RaceList.jsx` — expected-month races appear under their month and are
  excluded ONLY when they have no month; check the Show-TBD toggle still
  behaves and the month-group ordering did not break;
- `askPrompt.js` — the agent prompt no longer flattens these to "date TBD";
- **confirm the MCP is genuinely untouched** (deferral is honest, not an
  oversight) — `supabase/functions/mcp/` should have no expected-month code.
  Is deferring it correct, or does shipping expected months on the site while
  the MCP calls them undated create a cross-surface inconsistency bad enough to
  block? Your call.

**F3.** Read the agreement gate in `app/lib/races.js`. Adversarial cases:
- an event whose rows split 2-and-2 on month — suppressed?
- `month_num` = 0 or 13 — suppressed?
- `date_display` = a bare year matching `year` — NOT suppressed (that is not a
  conflict)?
- Confirm the count is 87 published / 4 suppressed, and that `Radikal Estana`
  is one of the 4. Recompute independently.

**F4 & R13 & R1 — the ledger.** These are rule changes; the code for R12/R13 is
NOT in this commit. Judge the *rules* on their merits:
- **R12**: is the shared `drivable/no_road_access/unknown` contract right, and
  is gating it before the Plan 3 backfill (L14) sufficient? Is v1 correctly
  marked falsified with an accurate reason?
- **R13**: registry-primary — does this actually remove the slug-instability, or
  just move it? What pins a slug when a registry entry's display name changes?
- **R1**: is narrowing it to distances (elevation as span, complete-data-only)
  the correct line, or is there a third category you would treat differently?
- **R14**: does it duplicate or contradict any existing rule (e.g. the
  `eventKmEffort` completeness refusal it cites)?

---

## Specific questions

**CQ1.** Did any F2 surface get missed? Name every place a user or agent sees a
race's date and confirm each is consistent. The prior pass found the hero after
the author missed it once — assume another was missed.

**CQ2.** R6 now lets an organizer-published month through as "expected". Is the
line between "organizer month = evidence" and "our recurrence guess =
forbidden" (R6's original point) still crisp, or has amending it blurred the two?

**CQ3.** The fix added a `MONTHS_SHORT` import to `page.js` and a local copy to
`askPrompt.js`. Is month-name formatting now duplicated across files in a way
that will drift? Should it be one helper?

**CQ4.** 91 → 87: are the 87 all genuinely safe, or does the agreement gate
still pass an event that is wrong in a way the 4 checks don't catch?

**CQ5.** Merge readiness. Plan 1 is site-only, unpushed. With these fixes, is it
safe to merge to `main` and deploy — yes or no? If no, the single blocking item.

---

## Traps (unchanged from last pass)

- `deno test` type-check fails PRE-EXISTING on `main` at `difficulty_test.ts:96`
  (`drive_max` not in `VariantFilter`), logged L13. Use `--no-check` (114 pass).
  Not caused by this work.
- `--allow-read` required or 12 scrape-trails tests false-fail on fixture access.
- Local `deno check` fails on `npm:@supabase/realtime-js` — local only, do not fix.
- `race_enrichment` unapplied on purpose; the facts-block guard is not a removal.
- Counts apply `source='ultrescatalunya' AND status NOT IN ('REMOVED','SUSPESA')`
  (412 rows, not 819). See R10.
- Do not deploy. Do not push. Do not fix — review only.

## Author's own reproduction (confirm or refute)

```
node --test app/lib/*.test.mjs                       # 39 pass
deno test --allow-read --no-check supabase/functions/ eval/   # 114 pass
npm run build                                         # 235 pages
# built HTML:
#   partial-elevation "up to X" titles          -> 0
#   pages whose hero contradicts their body      -> 0
#   expected-month pages                          -> 87
#   Radikal Estana                                -> falls back to Date TBD
```

## What to send back

1. Per-finding: **closed / not closed / regressed**, with the command or
   file:line that proves it.
2. Direct answers to CQ1–CQ5.
3. Any rule in `docs/rules.md` you judge wrong or wrongly scoped (R1, R6, R12,
   R13, R14 are the changed ones).
4. **Merge verdict: yes / no.** If no, the one blocking item.

Do not fix anything. Do not push. This is a confirmation pass.
