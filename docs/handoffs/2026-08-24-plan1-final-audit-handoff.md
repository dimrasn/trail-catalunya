# Handoff: final audit before merging Plan 1 (fixes + MCP parity + main merge)

**You are the outside auditor; this is your third pass on Plan 1.** Run in a
different harness (Codex). Prior verdicts: pass 1 (spec) "not ready" — correct;
pass 2 (`cb11696`) "not ready", 4 P1s — correct; those four plus a fifth were
then addressed. **This pass covers what changed since `cb11696`, and one thing
you have not seen: a merge of `main` that entangled this work with already-live
MCP filter code.** Read `docs/rules.md` and `AGENTS.md` first.

---

## Why this pass is different

Two independent bodies of change since your last review:

1. **The fixes to your pass-2 findings** (#1, #2, #3, #6) + two rule-wording
   corrections you asked for (R6 provenance, R13 key). Commits `2836330`,
   `9e86ffd`.
2. **A merge of `main`** (`041457c`). While this branch was open, another
   session shipped multi-select site filters + multi-value MCP filters and
   marked them **DEPLOYED & VERIFIED live**. This branch was 6 commits behind.
   The merge had two real conflicts — `tools.ts` and `RaceList.jsx` — because
   `main` extracted the filter logic both surfaces touched into pure modules
   (`app/lib/filters.js`, `supabase/functions/mcp/filters_core.ts`) and made
   `month` a multi-value array, exactly where this branch added expected-month
   handling. **The conflict resolution is the highest-risk artifact in this
   pass** — a subtle merge error would silently break either the live
   multi-value filters or the expected-month parity, and tests may not catch it.

Commit range since your last audit: `git log --oneline cb11696..HEAD`.
Start with `git show 9e86ffd` (MCP parity) and `git show 041457c` (the merge).

---

## Confirm the pass-2 fixes (fast — you defined these)

| # | Fix claimed | Where |
|---|---|---|
| #2 | Agreement gate no longer bypassed by an invalid sibling — extracted to pure `expectedMonthFromRows()`, 7 tests | `app/lib/format.js`, `format.test.mjs` |
| #3 | Meta description uses `completeMaxElevation`, not `maxElevation` | `app/race/[slug]/page.js:44` |
| #1 | Single-race Ask-AI prompt carries the expected month | `app/components/askPrompt.js` `buildRacePrompt` |
| #6 | Month filter chips include expected-only months | `app/components/RaceList.jsx` |

Author's reproduction (confirm/refute against a fresh build):
- 5 partial-elevation events publish no "up to" in title OR description.
- 77/77 expected-month pages carry the month in the Ask-AI prompt URL
  (URL-encoded — decode the `claude.ai`/`chatgpt` href, don't grep plaintext).
- `Radikal Estana` falls back to Date TBD.

---

## The merge — where to spend your time

**M1 — Did the resolution drop any of main's live multi-value behaviour?**
`main`'s multi-value OR filters are DEPLOYED. Confirm the merged
`filters_core.ts` and `app/lib/filters.js` still do everything main's versions
did — province[]/month[] OR-matching, drive band, dist/elev ranges — AND that
nothing from main's `tools.ts`/`RaceList.jsx` was lost when this branch took
main's side of the conflict. Diff the merged files against `main`'s versions:
```
git diff main:supabase/functions/mcp/filters_core.ts HEAD:supabase/functions/mcp/filters_core.ts
git diff main:app/lib/filters.js HEAD:app/lib/filters.js
git diff main:supabase/functions/mcp/tools.ts HEAD:supabase/functions/mcp/tools.ts
```
The only additions should be expected-month. Anything else is a merge defect.

**M2 — Is the expected-month contract identical across all THREE surfaces?**
`app/lib/format.js expectedMonthFromRows` (site derivation),
`supabase/functions/mcp/grouping.ts expectedMonthFromRows` (MCP derivation —
claimed an exact port), and the two filter matchers. Read the two derivation
copies side by side. R8 requires they agree; a divergence is the exact failure
R8 exists to catch. Are the mirrored tests genuinely mirrored, or do they assert
different things?

**M3 — Month filter semantics for expected-month races.** The claim: an
expected-month race matches a `month` filter but NOT a precise
`date_from`/`date_to` window (the day is unknown), and fully-undated races stay
excluded and counted in `tbd_excluded_count`. Verify in `filters_core.ts` and
its test. Is counting an expected-month race as *kept* (not tbd_excluded) the
right signal to an agent, or does it hide that the day is unconfirmed? The tool
description says "treat as unconfirmed" — is that enough?

**M4 — `tbdExcluded` accounting.** With expected-month races now kept on a month
filter but excluded on a date-window filter, is the count still meaningful and
consistent between the two paths? Construct the case where an agent filters by
month vs by window and check the counts tell a coherent story.

---

## Rule review (changed since pass 2)

- **R6**: now says an ultrescatalunya month is SOURCE/aggregator evidence, not
  organizer evidence (your CQ2 point). Is the wording now correct under R5?
- **R13**: now specifies the registry key as `race_url + town`, independent of
  name/slug. Does that actually remove the instability, or is `race_url` itself
  mutable (it appears in the data as a scraped field)?
- **R12, R14, R1**: unchanged since pass 2, where you judged them sound —
  re-flag only if the merge changed their implementation.

---

## Traps (unchanged)

- `deno test` type-check fails PRE-EXISTING on `main` at `difficulty_test.ts:96`
  (`drive_max`); use `--no-check`. Not this work.
- `--allow-read` required or 12 scrape-trails tests false-fail.
- Local `deno check` fails on `npm:@supabase/realtime-js` — do not fix.
- **Do NOT deploy.** The live MCP version is uncertain — the merged `AGENTS.md`
  contradicts itself (multi-value "DEPLOYED & VERIFIED" vs "still v11"); L17
  says verify via `initialize` before any deploy. Deploy is a separate,
  post-audit step and is the author's/Dima's to run.
- Counts apply `source='ultrescatalunya' AND status NOT IN ('REMOVED','SUSPESA')`.

## Current reproduction (confirm/refute)

```
node --test app/lib/*.test.mjs                                 # 70 pass
deno test --allow-read --no-check supabase/functions/ eval/    # 140 pass
npm run build                                                  # 238 pages
```
Note the counts moved since pass 2 (the dataset is re-scraped weekly and main
added tests). Recompute from live; do not trust the handoff's numbers — that is
rule R10, and it applies to this document too.

## What to send back

1. Per pass-2 finding (#1/#2/#3/#6): **closed / not / regressed**.
2. M1–M4 with evidence — especially M1 (did the merge drop live behaviour?) and
   M2 (do the two derivation copies agree?).
3. Any rule still wrong (R6, R13 changed).
4. **Merge verdict: is Plan 1 (as merged) safe to land on `main` and then
   deploy the MCP — yes / no?** If no, the single blocking item.

Do not fix. Do not push. Do not deploy. Review only.
