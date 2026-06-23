# Frozen page fixtures (U8 eval harness)

These are **frozen HTML snapshots** of race pages used by `eval/enrich-eval.ts`
so extraction is scored against fixed inputs, not the live (drifting) web.

The three files here are **synthetic seeds** that exercise the harness end to end
(full / partial / sparse facts). Before the eval gate (KTD7) can be trusted, the
maintainer must add real snapshots of the 7 golden races (and a handful more,
~20–30 total), each with hand-verified truth recorded in `eval/eval-set.json`.
Capturing those real pages + verifying their facts is maintainer time, not codegen.
