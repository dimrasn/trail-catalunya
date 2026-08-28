# Codex handoff — routes-ONLY publication proposal (pre-build review)

2026-08-27 · For: Codex (outside auditor) · From: the Claude session on the branch
Target: branch `feat/enrich-links-character`, files `scripts/enrich-routes-proposal.ts`
and `docs/enrichment/2026-batch/routes-only-proposal.json`.
Report only — do NOT fix, commit, or touch main.

## Context

Round 3 blocked the auto-safe links bundle; the owner then shelved links (commit
`d9ab343`) — see `outputs/2026-08-26_enrichment-links-closeout_v1.md`. On reflection the
owner asked: routes and socials aren't equal — **socials are unsalvageable from strings**
(the town-named-race ↔ municipality collision, `ajllavaneres`), but a route map whose
slug names the race is defensible. So this is a **routes-ONLY** proposal, socials stay
shelved. It is NOT yet wired to the runtime — this is a pre-build review of the rule + its
output. If you clear it, I wire it and ship routes only.

The honesty bar is unchanged: a confidently-wrong published link is worse than a gap. For
a route MAP the product framing is "Route map (from the official page) — confirm the exact
course on the site," and the owner accepts the residual risk of a *sibling-distance* route
(low-harm) — but NOT a *different race's* route or a stale edition.

## The proposed route-identity rule (`scripts/enrich-routes-proposal.ts`)

A candidate route (already host-exact-allowlisted, route-shaped, seed-page/tenancy-gated,
and cross-event-deduped upstream in `link-candidates.json`) is published ONLY if:
1. its slug contains a **distinctive** token of the race name or town — ≥5 chars AND not
   in a generic set (trail vocabulary + generic geographic words: `sant`, `serra`,
   `pont`, `nadal`…). This is the identity proof; it kills round-3's `sant` collision.
2. it carries **no prior-edition year**: after stripping the trailing numeric route id,
   no 19xx/20xx before 2026 (drops 2025 and `aristot2007`).

Output: `routes-only-proposal.json` — **12 races, 25 routes**.

## What to check

1. **False positives:** read every one of the 25 published routes in
   `routes-only-proposal.json`. Is any route NOT this race's course? Push hardest on the
   weaker distinctive tokens — e.g. Bigues i Riells "Rural Trail" via `rural`, Vielha
   "15 pobles" via `pobles`, Bocafoscant's `panta-de-la-torrassa` via `torrassa`. Is
   `rural`/`pobles` distinctive enough, or a generic that could match an unrelated route?
2. **Defeatability:** can the ≥5-char-non-generic + no-year rule still admit a wrong route
   (a race whose distinctive token coincidentally appears in a neighbouring race's route
   slug on a shared domain that passed the tenancy gate)?
3. **Edition:** is the prior-edition check sound (glued years, two-digit years, the
   `2026` inclusion, the id-strip)? Any current-looking stale route left?
4. **Scope discipline:** confirm socials are entirely excluded, and that this proposal
   file is a review artifact only — nothing in `app/` or `supabase/` imports it (the
   runtime is still reverted to pre-links; `links.json` is gone).
5. **The rejects** (46 candidate routes withheld — e.g. `junior-juvenil-2026`, embed/
   numeric slugs): are any of these a FALSE NEGATIVE severe enough to matter, or is
   withholding them correct?

## The one question

If this rule shipped as-is (routes only, socials shelved), would any runner or agent be
shown a confidently-wrong route? If nothing blocks, say so in one line, and flag any of
the 25 you'd personally withhold.

## Note (not for this review)

The owner's direction is that these algorithmic validation passes (link identity, char
grounding, edition, freshness) should become a dedicated pass-runner service rather than
per-slice scripts. That's future architecture; this review is only whether the routes-only
rule is honest enough to ship now.

## Setup

```
git -C ../trail-catalunya-codex fetch origin && \
git -C ../trail-catalunya-codex reset --hard origin/feat/enrich-links-character
deno run --allow-read --allow-write scripts/enrich-routes-proposal.ts   # regenerates the json
```
Baselines still green: `deno test --allow-read --allow-net scripts/enrich-extract-links_test.ts` (5),
`node --test app/lib/*.test.mjs` (97), `deno test --allow-read supabase/functions/ eval/` (151),
`npm run build` (238). Append findings to your existing findings file.
