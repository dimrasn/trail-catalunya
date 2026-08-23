---
type: feat
origin: docs/brainstorms/2026-06-22-race-enrichment-requirements.md (honesty patterns only — that doc excludes taste)
status: v3 — storage=JSON-bundled confirmed by Dima 2026-08-22; ready to build
created: 2026-08-22
revised: 2026-08-22 (v2 five-reviewer audit + v3 external audit folded in)
roadmap_step: 2
---

# Plan — Deploy the 91-race taste layer to live pages + MCP (v3)

## Audit log
- **v2** — 5 in-harness reviewers. Caught: omit-on-value-not-tag (unknowns are
  `value:"unknown"` under `[scraped]`); null/partial JSONB crashes SSG; make the
  diff mechanical; override model contradiction ([PDF] vs [RUNNER]); "91 rows"
  ambiguity; evidence sanitization.
- **v3** — external audit (`outputs/2026-08-22_taste-layer-deploy-plan-audit_v1.md`).
  Overturned two things and added a P0:
  - **[P0] Prior-edition facts as current.** e.g. Cursa de Sant Galderic's page
    describes its 2025 edition (08:30/09:30 starts). Every published field needs
    provenance (source_url, claim_strength, edition, last_checked) and operational
    facts need a staleness/edition gate, or a 2025 start ships as a 2026 fact.
  - **Storage → committed JSON bundled into BOTH surfaces** (confirmed by Dima).
    Git gives versioning/review/atomic-rollout/rollback/deletion-handling; no
    table, loader, RLS, or DB-vs-scraper key drift. Cost: an MCP redeploy on
    taste change (rare). Removes v2's U1 migration + U3 loader entirely.
  - Conversion contract couldn't process the real corpus (uppercase/compound
    tags like `[SCRAPE]`, `[INFER]`, `[SCRAPE-absent]`); byte-equality both
    proved nothing and contradicted the sanitize step; no product contract;
    partial-row self-contradiction; runner-note consent gate; per-tool MCP
    projection; page hierarchy/labels/mobile/a11y.

## Context (self-contained)

Roadmap Step 2 (`docs/ROADMAP.md`). Step 1 (ITRA difficulty) shipped 2026-08-22.
Source: `docs/enrichment/2026-batch/chunk-0..11.md` — 123 `##` race blocks, of
which ~32 are ⚠ fix-list stubs (the 29 un-fetchable races live *inside* the
chunks), leaving ~91 real profiles. Each block: `- **key:** value [tag] —
evidence` attributes + UNIQUE/COOL/CATCH/WHO/REFERENCE-POINT editorial + a
HONESTY line. Raw tags are dirty and mixed-case (`[scraped]`, `[SCRAPE]`,
`[derived]`, `[editorial]`, `[inference]`, `[editorial/inference]`,
`[SCRAPE-absent]`, `[unknown]`, and `[RUNNER]`/`[PDF]` in overrides); unknowns
are usually the literal value `unknown`. Overrides: `_overrides/burriac-atac.md`
(`[RUNNER]` — Dima ×4, lived experience) and `_overrides/burriac-xtrem.md`
(`[PDF]` — organizer reglament, and a fix-list race with no scraped card).

Live today: site (`app/lib/races.js`) + MCP (`mcp/tools.ts`) read the *stable
facts* from the Supabase `race_enrichment` table, gated by `app/lib/enrichment.js`
/ `mcp/enrichment_view.ts` (the provenance + staleness pattern we REUSE here).
The enrich pipeline stays DORMANT — this plan does not touch it.

## Product Contract (taste layer)

- **User outcome:** on a race page and via the MCP, a runner sees what makes a
  race special, who it suits, the catch, and practical character — each labelled
  by how we know it, never overstated, never stale-as-current.
- **Canonical fields:** a fixed registry (see `taste-fields.md`, produced in U1)
  with JSON names, value type, optionality, and per-field **claim_strength**
  (`organizer_fact` | `derived` | `our_read` | `inference` | `dima_firsthand`)
  separate from **provenance** (`source_url`, `edition`, `last_checked`).
- **Freshness:** operational fields (start_time, cutoffs, mandatory_kit,
  access/parking) are HIGH-BLAST — hidden or shown "previous edition — verify" if
  `edition=previous` or stale, exactly like `enrichment.js`. Evergreen character
  (topology, setting, UNIQUE/WHO) has no staleness gate.
- **Edition lifecycle:** each profile is stamped to the 2026 edition; it does not
  silently carry into 2027 (validity is edition-aware).
- **Ownership / attribution:** editorial is OUR read (labelled "Our read"),
  organizer facts labelled "Organizer fact", derived "Derived", inference
  "Inference", firsthand "Dima firsthand". Runner notes require Dima's explicit
  public-release approval per note.
- **Degradation:** any race with no surviving field renders exactly as today.
- **Acceptance fixtures:** Burriac Atac (runner), Burriac Xtrem (PDF/organizer,
  override-only), Ultra Pirineu (rich scraped), Cursa de Sant Galderic
  (prior-edition → must NOT show 2025 start as current), a fix-list race (no row).

## Goal / done-when

The ~91 profiles show a taste section on their page and via the MCP; every field
labelled by claim-strength; operational prior-edition/stale facts never shown as
current; runner notes published only with Dima's approval; per-section render so
partial profiles show what survives and hide only what doesn't; the 29 fix-list
+ any un-scraped race render exactly as today on both surfaces. Verified in prod
on the five acceptance fixtures.

## Key technical decisions

### KTD1 — Storage: ONE committed `taste.json`, bundled into both surfaces
`docs/enrichment/2026-batch/parsed/taste.json` is authoritative and git-versioned.
The site imports it at build; the MCP gets the SAME file bundled into its deploy
`files` array (`mcp/taste.json`, read at cold start) — the MCP reads its own
bundled copy, not the Next repo. No table, migration, loader, or RLS. Taste
change → rebuild site (automatic) + redeploy MCP (manual, rare).

### KTD2 — Deterministic, source-addressable generator (NOT byte-equality)
A script (not an LLM) parses each chunk into records carrying the exact
`source_file` + `line`. Pipeline: raw extraction (verbatim value + raw_tag +
evidence + line) → normalization (KTD3) → sanitize (strip markup, cap length) →
publish JSON. Verification = (a) every source bullet is consumed (no silent
drops), (b) golden fixtures for the 5 acceptance races, (c) a fixed high-risk
sample reviewed by hand, (d) zero unmapped tags, (e) zero unknown-sentinel
values published. The LLM is used ONLY to resolve flagged irregular/compound
bullets, never as the primary extractor.

### KTD3 — Tag registry + normalization (fail loud on unmapped)
Inventory EVERY raw annotation across all 12 chunks; preserve `raw_tag`; map
through a reviewed table to canonical `claim_strength`. Compound tags map to the
weaker (`editorial/inference` → inference; `SCRAPE-absent` → omit). Any unmapped
raw tag fails the generator. (This is `taste-fields.md` + a `tag-map`.)

### KTD4 — Unknown is a VALUE, not a tag [CRITICAL]
Omit any field whose value ∈ {unknown, not stated, cannot compute, n/a, empty}
regardless of tag. Generator asserts zero unknown-sentinels published.

### KTD5 — Provenance + edition + staleness on every published field [P0]
Each field: `{value, claim_strength, source_url, edition, last_checked?}`.
Operational HIGH-BLAST fields (start_time, cutoffs, mandatory_kit, access/parking)
are hidden or shown "previous edition — verify" when `edition=previous` or past a
staleness ceiling — reuse `enrichment.js`'s gate. Profiles are edition-stamped
(2026); not carried to 2027 silently.

### KTD6 — Honesty gate on tagged objects, per-section independent render
A pure module (both runtimes) renders each field by claim_strength with a plain
label ("Organizer fact" / "Derived" / "Our read" / "Inference" / "Dima
firsthand"); never color-only. Editorial stored/gated as `{value, tag}` (not bare
text). **Each section (attributes / editorial / runner) renders independently;
the whole taste block hides only when NO field survives the gate.** Null / empty
/ missing never iterated unguarded. A render matrix covers attributes-only,
editorial-only, runner-only, mixed, all-empty, no-row — both surfaces.

### KTD7 — One override model + runner consent gate
Overrides merge onto the single `(race_url, town)` record (each override file
gets an explicit `race_url:`+`town:` header). `burriac-atac.md` → `runner_notes`
(dima_firsthand). `burriac-xtrem.md` → `organizer_fact` attributes/editorial
(it is fix-list + PDF; the deliberate override-only exception, not part of "the
29 render as today"). **Every runner note carries an explicit
`public_approved:true` flag; the generator rejects unapproved runner notes, and
the U4 deploy checklist reviews the exact public wording with Dima.**

### KTD8 — Per-tool MCP projection
`search_races` / `whats_on` return a compact `taste_available` + a short summary
(special + who), NOT the full evidence payload. `get_race` returns the full
profile. A worst-case response-size fixture guards the 50-race case.

### KTD9 — Difficulty not duplicated; aid-penalty deferred
Generator drops the km-esforç line. Aid count IS surfaced as a taste attribute,
but feeding it into the Step-1 difficulty number is deferred (its own parity-
tested contract later) — recorded as a roadmap deviation.

### KTD10 — Centralize the event key before using it as a contract
Extract the `(race_url, town)` key builder from `mcp/grouping.ts` /
`app/lib/races.js` into one exported function; the generator's join-check and
both renders use it byte-identically.

## Implementation units

### U1 — Generator + `taste.json` + field registry (safe, reviewable, nothing live)
- **Files:** `scripts/build-taste.mjs` (deterministic parser), `docs/enrichment/
  2026-batch/parsed/taste.json`, `docs/enrichment/2026-batch/taste-fields.md`
  (registry + tag-map), `scripts/build-taste.test.mjs`.
- **Approach:** KTD2/3/4/5/7/9. Exclude fix-list/⚠ blocks incl. their editorial.
  Emit a coverage + exceptions report. Apply overrides + consent gate.
- **Test:** golden fixtures for the 5 acceptance races; zero unmapped tags; zero
  unknown-sentinels; all keys unique + join-check via the KTD10 key vs a live
  `races` snapshot; every runner note `public_approved`.
- **Gate:** Dima eyeballs the exceptions report + the 5 fixtures before U2.

### U2 — Site render
- **Files:** `app/lib/taste.js` (pure gate KTD5/6) + `app/lib/taste.test.mjs` +
  `app/lib/races.js` (import + attach, tolerate absent) + `app/race/[slug]/page.js`.
- **Approach:** the page contract below; per-section render + full partial matrix;
  operational-fact staleness gate. og-image ride-along ships here as its OWN unit
  with its own acceptance check (or parked with a reason).
- **Test:** the render matrix on both partial + full rows; Sant Galderic shows no
  2025 start as current; a no-taste race unchanged.

### U3 — MCP render
- **Files:** `mcp/taste.json` (bundled), `mcp/taste_view.ts` (pure) +
  `mcp/taste_view_test.ts` + `mcp/tools.ts` (per-tool projection KTD8) +
  `mcp/protocol.ts` + descriptions + `public/llms.txt` + `app/for-agents`.
- **Approach:** read the bundled JSON at cold start; tolerate its absence
  (`taste:null`, never throw); projection per KTD8; extend the untrusted notice +
  INSTRUCTIONS to name `evidence` (nested) + `honesty`.
- **Test:** `get_race` full; `search_races` compact; bundled-file-absent → clean
  `taste:null`; response-size fixture within budget.

### U4 — Deploy + verify + docs
- **Approach:** commit taste.json + site (push → Vercel); redeploy MCP from
  encoded source with `mcp/taste.json` in the files array (v11). Runner-note
  wording review with Dima in the checklist. Verify the 5 fixtures live. Update
  AGENTS.md + ROADMAP (Step 2 done).

## Page contract (U2)
Order: special / catch / who → course-fit + constraints → logistics → atmosphere
→ runner notes. Plain labels ("Organizer fact" / "Derived" / "Our read" /
"Inference" / "Dima firsthand"), never color-only. Acceptance: semantic headings,
keyboard + screen-reader, long-Catalan-text wrap, 320 px + 375 px.

## Tensions resolved
- **Untrusted label (security ↔ coherence):** sanitize evidence + keep the MCP
  data-not-instructions guardrail (agents); on the page, organizer facts read as
  fact via their label. Both hold — different surfaces.

## Scope boundaries (NOT this step)
Enrich pipeline dormant. 29 fix-list un-profiled (Xtrem the PDF-override
exception). 226 rollout parked. Mountain Level parked. Aid→difficulty deferred.
Ask-box = Step 3.

## Risks (residual)
- **Post-load key drift** — taste keyed on `(race_url, town)` which the weekly
  scraper can rewrite; a build-time join-check warns, and JSON+git means the fix
  is a commit, but a mid-week drift silently blanks a page until rebuild.
- **Irregular bullets** — the deterministic parser flags them as exceptions for
  human/LLM resolution rather than guessing; residual risk is a mis-resolved
  exception, bounded by the fixtures + sample review.

## Rollback
Revert the taste.json + site commit (Vercel rebuilds); the live MCP self-heals to
`taste:null` if the bundled file is removed on a redeploy. No DB to unwind.

## Corrections (2026-08-23 — post-implementation audit)
Appended, not edited into the body above (issued-deliverable rule). Two items the
build surfaced after this plan was issued:
- **U6 / any MCP deploy: do NOT "redeploy from encoded source" (inline).** The
  Supabase `deploy_edge_function` tool is inline-only and `mcp/taste.json` is
  ~165KB — too large to hand-inline safely (a JSON error 500s the public MCP). The
  correct path is the **Supabase CLI from disk, run on a clean `main` worktree**:
  `supabase functions deploy mcp --no-verify-jwt` (from the repo root, NOT `~`).
  See `AGENTS.md` "Deploy trap". This supersedes any inline-deploy wording earlier
  in the plan.
- **`taste_flags` (added post-plan) are gated to organizer-stated fields only** and
  require affirmative wording (a negation like "no night mention" never sets
  night:true), and **R2-2's projection anchor excludes interval reps** (no valid
  continuous `(D1,T1)` pair) — both per the 2026-08-23 review. The generator's
  unknown-sentinel set + quote-strip were also hardened (source-silence no longer
  publishes as an organizer fact; only matched enclosing quote-pairs are trimmed).
