# Independent audit — taste-layer deploy plan v2

Date: 2026-08-22  
Reviewed from: `outputs/2026-08-22_taste-layer-deploy-handoff_v1.md`  
Primary target: `docs/plans/2026-08-22-001-feat-taste-layer-deploy-plan.md`

## Verdict

Do not execute v2 as written. The migration is inert and the basic RLS posture is reasonable, but the content contract can publish stale prior-edition facts as current, the proposed conversion gate cannot process the actual corpus, and the plan contradicts itself on partial-row rendering.

KTD1 verdict: use committed JSON, bundled into both the Next.js build and the Edge Function, for v1. The corpus is static, hand-curated, small, and already committed. A mutable table adds a second copy, a loader, key drift, and rollback complexity without buying a current product need.

## Ranked findings

### [P0] Prior-edition race-day facts can be published as current facts

Location: [plan:89](/Users/dima/Claude/Trails/trail-catalunya/docs/plans/2026-08-22-001-feat-taste-layer-deploy-plan.md:89), [plan:124](/Users/dima/Claude/Trails/trail-catalunya/docs/plans/2026-08-22-001-feat-taste-layer-deploy-plan.md:124), [chunk-9:36](/Users/dima/Claude/Trails/trail-catalunya/docs/enrichment/2026-batch/chunk-9.md:36).

Failure scenario: Cursa de Sant Galderic explicitly says its page still describes the 2025 edition, including 08:30/09:30 start times and logistics. The proposed schema stores none of `source_url`, edition, or last-checked per field, while the honesty gate renders scraped content as fact. A 2026 visitor can therefore receive a 2025 start time as a confirmed current fact. The edition-free primary key also lets the same profile survive into 2027 when URL and town stay unchanged.

Fix: every public field needs source address, source kind, edition or as-of status, and last-checked metadata. Prior-edition operational facts must be hidden or rendered explicitly as “previous edition — verify.” Make profile validity edition-aware and require a high-blast-radius gate for start time, cutoffs, mandatory kit, and access logistics. This is the strongest part of the earlier enrichment contract, even though that contract excludes taste fields ([requirements:87](/Users/dima/Claude/Trails/trail-catalunya/docs/brainstorms/2026-06-22-race-enrichment-requirements.md:87)).

### [P1] The conversion and verification contract cannot process the source corpus

Location: [plan:108](/Users/dima/Claude/Trails/trail-catalunya/docs/plans/2026-08-22-001-feat-taste-layer-deploy-plan.md:108), [plan:118](/Users/dima/Claude/Trails/trail-catalunya/docs/plans/2026-08-22-001-feat-taste-layer-deploy-plan.md:118), [plan:168](/Users/dima/Claude/Trails/trail-catalunya/docs/plans/2026-08-22-001-feat-taste-layer-deploy-plan.md:168), [chunk-7:3](/Users/dima/Claude/Trails/trail-catalunya/docs/enrichment/2026-batch/chunk-7.md:3), [chunk-11:3](/Users/dima/Claude/Trails/trail-catalunya/docs/enrichment/2026-batch/chunk-11.md:3).

Failure scenario: the allowed set rejects real annotations such as uppercase `[SCRAPE]`, `[INFER]`, `[SCRAPE-absent]`, `[stated]`, `[source]`, and compound source text. Some bullets combine known and unknown sub-values, so exact sentinel filtering cannot safely keep or omit the whole field. The plan also asks for coverage against “KTD1's canonical key list,” but KTD1 defines no key list. The build either fails immediately or someone weakens the gate ad hoc and silently changes meaning.

The byte-equality claim does not repair this. It asks an agent-produced JSON file and a second parser to agree, which proves shared interpretation rather than semantic grounding. It also conflicts with the same unit's HTML stripping and length cap: sanitized output cannot remain byte-identical to verbatim source content.

Fix: define one typed field registry with canonical JSON names, value types, optionality, and separate provenance and claim-strength enums. Inventory every raw annotation, preserve it as `raw_tag`, map it through reviewed normalization rules, and require zero unmapped cases. Use one deterministic generator as the publish source: first produce source-addressable raw extraction with file and exact line/span, then produce sanitized publish JSON. Verify complete source consumption, golden fixtures, and a fixed sample of high-risk claims rather than equality between two derived files.

### [P1] The plan has no valid product contract for the feature it deploys

Location: [plan:3](/Users/dima/Claude/Trails/trail-catalunya/docs/plans/2026-08-22-001-feat-taste-layer-deploy-plan.md:3), [requirements:90](/Users/dima/Claude/Trails/trail-catalunya/docs/brainstorms/2026-06-22-race-enrichment-requirements.md:90), [roadmap:41](/Users/dima/Claude/Trails/trail-catalunya/docs/ROADMAP.md:41).

Failure scenario: the declared origin explicitly says taste fields are out of scope and no race detail page is built. The roadmap supplies the mandate but not the field semantics, freshness policy, editorial ownership, retirement rule, or public attribution contract. Two implementers can follow the plan faithfully and still ship different products, especially when a 2026 profile becomes stale.

Fix: add a compact taste-specific Product Contract before planning implementation. It must define the user outcome, canonical fields, claim and provenance semantics, edition lifecycle, ownership, public attribution, graceful-degradation examples, and acceptance fixtures. Cite the June enrichment requirements only for reusable honesty patterns, not as the feature's origin.

### [P1] Partial rows are both required to render and required to disappear

Location: [plan:65](/Users/dima/Claude/Trails/trail-catalunya/docs/plans/2026-08-22-001-feat-taste-layer-deploy-plan.md:65), [plan:138](/Users/dima/Claude/Trails/trail-catalunya/docs/plans/2026-08-22-001-feat-taste-layer-deploy-plan.md:138), [plan:189](/Users/dima/Claude/Trails/trail-catalunya/docs/plans/2026-08-22-001-feat-taste-layer-deploy-plan.md:189).

Failure scenario: the goal and KTD6 make attributes-only, editorial-only, and runner-only rows first-class. The site unit then says “any partial/null combination” renders nothing. Burriac Xtrem is deliberately override-only with `runner_notes=null`; a literal implementation of the site unit suppresses the showcase race that the done-when requires.

Fix: render each populated section independently. Hide the entire taste block only when no field survives the honesty gate. Add an explicit render matrix for attributes-only, editorial-only, runner-only, mixed, all-empty, and no-row states on both site and MCP.

### [P1] The table is not one source of truth and its loader is not convergent

Location: [plan:79](/Users/dima/Claude/Trails/trail-catalunya/docs/plans/2026-08-22-001-feat-taste-layer-deploy-plan.md:79), [plan:183](/Users/dima/Claude/Trails/trail-catalunya/docs/plans/2026-08-22-001-feat-taste-layer-deploy-plan.md:183), [plan:230](/Users/dima/Claude/Trails/trail-catalunya/docs/plans/2026-08-22-001-feat-taste-layer-deploy-plan.md:230).

Failure scenario: the plan commits `taste.json`, copies it into `race_taste`, and calls the table the source of truth. An upsert-only rerun does not remove a row deleted or renamed in JSON, so stale profiles remain public. The document also calls the choice “CONFIRMED by audit” while still asking Dima to decide it.

Fix: for this version, make committed JSON authoritative and bundle the same generated artifact into both runtimes. Git then supplies review, versioning, atomic rollout, and rollback. Move to a table only when content must change independently of a code deploy. If a table is retained, state that JSON is authoritative, load through a staging table, compare exact keys and a content digest, transactionally replace the projection including deletions, and make the key edition-aware.

### [P1] The aid-station penalty is an unspecified change to an already-shipped metric

Location: [plan:154](/Users/dima/Claude/Trails/trail-catalunya/docs/plans/2026-08-22-001-feat-taste-layer-deploy-plan.md:154), [plan:232](/Users/dima/Claude/Trails/trail-catalunya/docs/plans/2026-08-22-001-feat-taste-layer-deploy-plan.md:232), [roadmap:49](/Users/dima/Claude/Trails/trail-catalunya/docs/ROADMAP.md:49).

Failure scenario: KTD8 says difficulty is not touched, but the open decision proposes feeding aid counts back into the shipped difficulty number. The plan supplies no formula, missing-data behavior, parity tests, or migration semantics. A taste deployment can therefore change Ultra Pirineu's public difficulty differently on the site and MCP, or make races without aid counts incomparable.

Fix: defer the penalty from this deployment and record the roadmap deviation. Expose aid count or self-sufficiency as a taste attribute now. Treat any later difficulty adjustment as its own contract and parity-tested change after dogfood shows it improves selection.

### [P1] Named firsthand notes have no public-release gate

Location: [plan:49](/Users/dima/Claude/Trails/trail-catalunya/docs/plans/2026-08-22-001-feat-taste-layer-deploy-plan.md:49), [plan:69](/Users/dima/Claude/Trails/trail-catalunya/docs/plans/2026-08-22-001-feat-taste-layer-deploy-plan.md:69), [plan:144](/Users/dima/Claude/Trails/trail-catalunya/docs/plans/2026-08-22-001-feat-taste-layer-deploy-plan.md:144).

Failure scenario: Dima's lived-experience notes are transformed from internal markdown into named public claims. Source tagging and sanitization do not prove consent to publish each statement. A loader can expose a private or draft observation merely because it carries `[RUNNER]`.

Fix: require explicit public approval for every named runner-note record, separate from its provenance tag. The load must reject runner notes without that approval, and the deploy checklist must include a final review of the exact public wording and attribution.

### [P2] Every MCP tool may inherit the full taste and evidence payload

Location: [plan:201](/Users/dima/Claude/Trails/trail-catalunya/docs/plans/2026-08-22-001-feat-taste-layer-deploy-plan.md:201).

Failure scenario: attaching the complete taste object to the common event shape can make `search_races` or `whats_on` return dozens of full editorial profiles and evidence snippets. A 50-race response becomes large, slower, and harder for an agent to use even when the caller only needs shortlist fields.

Fix: define a per-tool projection. Search and listing tools should return a compact taste summary or `taste_available`; `get_race` should carry the full profile and evidence. Add a worst-case response-size budget and fixture.

### [P2] The page contract does not specify hierarchy, labels, attribution language, or mobile behavior

Location: [plan:189](/Users/dima/Claude/Trails/trail-catalunya/docs/plans/2026-08-22-001-feat-taste-layer-deploy-plan.md:189).

Failure scenario: raw source tags can leak into user-facing copy, editorial text can dominate objective race facts, and long Catalan evidence or runner notes can overflow or become unreadable on a 320–375 px screen. Different developers can produce incompatible attribute ordering and visual meanings for fact, derivation, inference, and firsthand opinion.

Fix: specify placement, information order, and user-facing labels. Recommended order is special/catch/who first, then course fit and constraints, logistics, atmosphere, and runner notes. Use plain labels such as “Organizer fact,” “Derived,” “Our read,” “Inference,” and “Dima firsthand”; never rely on color alone. Add semantic-heading, keyboard, screen-reader, long-text, 320 px, and 375 px acceptance checks.

## KTD and scope decisions

1. Storage: committed JSON wins for v1. Bundle one reviewed artifact into both surfaces.
2. Aid-station penalty: defer. It is a difficulty change, not a taste-layer deployment detail.
3. OG-image ride-along: keep only as an independent, already-specified page unit with its own acceptance check. Otherwise park it explicitly; sharing a file is not a product reason.

## Top three fixes before build

1. Write the taste Product Contract and canonical publish schema, including per-field provenance, edition validity, staleness, public attribution, and personal-note approval.
2. Replace the two-interpreter byte-equality design with one deterministic, source-addressable generator plus reviewed normalization, golden fixtures, and zero-unmapped-tag checks.
3. Rebase the implementation on one committed JSON artifact, define per-tool MCP projections, and add the full partial-row render matrix for both surfaces.

## Secondary controls

- If the table option survives, test anonymous and authenticated INSERT, UPDATE, and DELETE denial, plus service-role load success. The current anon-INSERT and post-load SELECT checks are necessary but incomplete.
- Make the site tolerate an absent taste source as explicitly as the MCP. The existing stable-enrichment join already treats a missing optional table as non-fatal ([races.js:237](/Users/dima/Claude/Trails/trail-catalunya/app/lib/races.js:237)).
- Centralize the event-key builder before using it as a contract. It is currently inline in the MCP grouping loop rather than an exported canonical function ([grouping.ts:98](/Users/dima/Claude/Trails/trail-catalunya/supabase/functions/mcp/grouping.ts:98)).
- Treat every string in the public taste subtree as untrusted data, including attributes, editorial, runner notes, honesty text, and evidence.

## Review coverage

Seven in-process lenses completed: coherence, feasibility, product, design, security, scope, and adversarial. Duplicate findings were merged when one fix resolves them. No low-confidence finding was promoted into the actionable set.

Four independent cross-model passes were attempted. The configured Claude CLI first rejected a stale `--safe-mode` option; the compatible retry then hit an execution-context authentication failure. No cross-model output was used or represented as corroboration.

This was a read-only audit. The reviewed handoff and plan were not edited, and no deploy, migration, push, or public change was performed.
