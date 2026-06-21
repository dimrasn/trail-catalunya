# Trail Catalunya AI Discovery: Conversation Summary

Date: 2026-06-11

This document summarizes the product-shaping conversation after the fresh Codex ideation pass. It is not an implementation plan yet. Its purpose is to preserve the context, product thesis, decisions, and open questions before moving into planning.

## Core Product Thesis

Trail Catalunya should not primarily be "a website." It should be a low-maintenance race data utility and AI-native discovery layer for trail running races in Catalunya.

The website is one client of the system. The deeper product is:

> Ask Catalunya trail-running questions and get trustworthy race answers.

That answer can appear through:

- deterministic website filters
- public dataset/API
- MCP tools for Claude, ChatGPT, or other agent clients
- Every.to-style "Ask in ChatGPT / Ask in Claude" handoff buttons
- future surfaces such as newsletter, Telegram, or alerts

The project should also work as a portfolio showcase: a small side hustle that demonstrates practical AI-native product thinking without requiring the owner to subsidize LLM usage.

## Primary Direction

We aligned on this framing:

> Power search is the engine. Ranked recommendations are the presentation.

The system should parse fuzzy human intent into structured constraints and preferences, search deterministically over known race data, rank the closest candidates, and explain why each candidate matched.

Example user request:

> I want something scenic, 15-25 km, not too technical, under 90 minutes from Barcelona, maybe with kids race.

The system should interpret this as:

- distance: 15-25 km
- drive time: <= 90 minutes from Barcelona
- origin: Barcelona / Plaça Glòries by default
- scenic: preferred unless explicitly required
- technicality: avoid very technical races if known
- kids race: preferred unless explicitly required
- date/status: confirmed active races first
- uncertain enrichment fields: do not exclude by default

The ranked output should include:

- exact matches first
- near matches second
- "maybe" matches where enrichment is unknown
- clear explanations and uncertainty labels

## Confidence and Soft Preferences

We aligned on a strong confidence rule:

> Hard filters only for reliable structured facts or explicit must-have language. Enriched or uncertain signals become soft preferences with explanations.

Examples:

- "must have kids race" means a hard filter if kids race is confirmed.
- "ideally with kids race" means a soft preference.
- "with butifarra at the end" should not be treated as confirmed unless the 2026 official source says so.
- If a previous year's page or photo suggests butifarra, the answer should say something like:
  "Likely food/botifarra signal: previous edition evidence mentions or shows it, but I do not see it confirmed for 2026."

This is an important product value:

> The product should use AI to be careful, not to sound falsely certain.

## Data Source Strategy

The enrichment strategy should be bounded and staged.

### Stage 1: Main Calendar

The main calendar remains the base source for race discovery:

- race name
- date / TBD status
- town
- province
- distance
- elevation
- price when available
- URL
- status

### Stage 2: Official Race Website Crawl

The next useful step is to crawl official race websites. The assumption is that many organizer sites are simple legacy/static HTML sites, so fetching and extracting visible content should be feasible.

Important caveat:

> Fetching 300 simple sites is likely easy. Extracting trustworthy facts from them is the hard part.

The crawler should start from the official race homepage only, then do a shallow same-domain crawl of obvious pages.

Good internal links to follow:

- inscripcions / registration
- recorregut / course
- reglament / rules
- programa / schedule
- serveis / services
- tracks / GPX
- classificacions / results
- fotos / photos

Suggested crawl limits:

- max 5-10 internal pages per race
- no broad web search in v2
- store raw text and source URLs for evidence

### Stage 3: Linked Assets

If the official page links directly to assets or platforms, those are worth collecting as source references or specialized extraction targets:

- GPX files
- PDFs
- Wikiloc
- Komoot
- Strava
- Instagram / Facebook links from the official site

These should be considered "linked evidence," not open-ended web search.

### Later: Broader Web Evidence

Broader web search, third-party pages, old social posts, and external historical evidence should wait until later. They are useful but risk higher maintenance and lower trust.

## Enrichment Scope

We agreed on a two-tier enrichment model.

### Required Practical Fields

These directly improve race choice and should be prioritized:

- registration status
- price
- start time / schedule
- kids race
- cutoff times when present
- GPX / Wikiloc / course links
- source URL
- last checked timestamp

### Best-Effort Taste Fields

These make the project special but should be confidence-labeled:

- scenic signals
- technicality
- runnable vs steep
- food / botifarra
- family or community vibe
- festival / after-race signals
- notable terrain/place terms:
  - coast
  - forest
  - river
  - castle
  - monastery
  - natural park
  - summit

## Evidence and Confidence Model

Every enriched field should carry:

- value
- confidence: high / medium / low
- evidence snippet
- source page
- edition: 2026 / previous edition / unknown
- last checked timestamp

Useful fact categories:

- Confirmed 2026 fact: official 2026 page explicitly says it.
- Likely recurring fact: official site mentions it historically or in previous edition material.
- Inferred fact: derived from route links, location, keywords, or page structure.
- Unknown: no evidence found.

This distinction is essential for both website trust and MCP/agent usefulness.

## Manual Admin Override

We agreed v2 should include a tiny admin override file before any public correction system.

Reason:

> There is no community yet, so do not build community moderation.

The override file should let the owner correct or enrich important races without building a CMS.

Possible override capabilities:

- force a field value
- add tags
- remove incorrect tags
- add evidence note
- set confidence manually
- hide or merge duplicate race entries

The override file should stay small and explicit. It is a human correction layer, not a second database.

## Website Surface

The website should remain deterministic and low-cost.

We explicitly decided:

> No hosted AI chat on the public website.

Reason:

- The owner should not subsidize user token usage.
- Hosted AI chat adds cost, abuse risk, and operational complexity.
- The project should remain alive, useful, and low-maintenance.

The website should provide:

- deterministic filters
- enriched race cards
- confidence/provenance indicators
- public dataset/API links
- Every.to-style AI handoff buttons
- MCP setup instructions

The current hosted AI chat should be removed, disabled, or kept private/dev-only for now.

## Every.to-Style AI Handoff

We liked the Every.to pattern: simple buttons near content such as:

- Read with ChatGPT
- Read with Claude

Trail Catalunya can adapt this as:

- Ask in ChatGPT
- Ask in Claude
- Copy prompt

The site should not run the AI itself. It should prepare a useful prompt and send the user to their own AI client.

Potential deep-link patterns:

- `https://chatgpt.com/?q=<encoded prompt>`
- `https://claude.ai/new?q=<encoded prompt>`

These should be treated as convenience links, not guaranteed stable APIs. Always provide copy-to-clipboard fallback.

## Prompt Payload

The prompt is important and should be engineered/tested.

The generated prompt should include:

- user intent
- current filters
- compact race data
- source dataset/search URL
- confidence rules
- instruction not to oversell uncertain enrichment
- instruction to rank candidates and explain tradeoffs

Potential payload modes:

1. Current filtered results
   - If filters are active and result count is manageable, include those races directly.

2. Full compact dataset
   - Since the dataset is around 300 races by 20-30 columns, it may be feasible to include a compact representation for broad exploration.

3. MCP mode
   - Do not paste data; let the model call tools like `search_races`, `compare_races`, and `get_race_details`.

The likely v2 behavior:

- If filters are active, prompt says "ask about these results."
- If no filters are active, prompt says "ask about all Catalunya races."
- If result count is too large, include a compact subset plus a dataset link.

## Intent Composer

We aligned on a lightweight hybrid flow rather than a raw one-click prompt.

Flow:

1. User filters races normally.
2. User clicks "Ask in ChatGPT" or "Ask in Claude."
3. A small modal opens with a prefilled intent:

   "Find me the best races from these filtered results."

4. The modal shows examples:

   - scenic 15-25 km near Barcelona
   - first trail race with kids activities
   - compare these races for a May weekend
   - something with good food or botifarra after

5. User can edit or continue.
6. User opens ChatGPT, opens Claude, or copies the prompt.

This is not a chat box. It is a tiny intent composer.

Why this is useful:

- preserves Every.to-like simplicity
- improves prompt quality
- captures what people are trying to do
- avoids paying for tokens
- creates a product learning loop

## Capturing User Intent

Even without hosting AI, the website can capture intent before handoff.

Useful events to record:

- free-text intent from the modal
- active filters
- number of races included in prompt
- destination clicked: ChatGPT / Claude / copy prompt
- prompt template version
- timestamp
- anonymous session id

Do not capture:

- the user’s AI conversation
- private model outputs
- anything that feels like surveillance

The learning loop:

> People use deterministic filters -> click "talk to AI" -> the site learns what prompts/search intents they wanted -> future filters, fields, MCP tools, and enrichment improve.

## MCP Direction

MCP remains a priority because the project is partly for learning AI systems and partly for portfolio value.

The MCP server should expose product-level tools, not just raw JSON.

Possible tools:

- `search_races`
- `recommend_races`
- `compare_races`
- `get_race_details`
- `get_race_changes`
- `fetch_source_evidence`

Useful resources:

- full race dataset snapshot
- compact dataset snapshot
- schema/capabilities document
- examples of good prompts

The MCP and website should share the same underlying race intelligence/search logic.

## Portfolio Story

The project can tell a strong story:

> AI-native, but not AI-expensive.

It demonstrates:

- practical scraping
- data enrichment
- provenance and confidence design
- deterministic ranking/search
- MCP-first architecture
- user-owned AI handoff
- low-maintenance side-project constraints

This is stronger than simply embedding a chatbot.

## Non-Goals For V2

Do not build these yet:

- public accounts
- payment or monetization
- hosted public AI chat
- community correction/moderation flow
- full map-first redesign
- deep historical results database
- broad web search for every race
- complex personal dashboards
- notification system
- organizer portal

These may be good later, but they conflict with the current goal of useful, alive, low-maintenance.

## Planning-Ready V2 Shape

The emerging v2 can be summarized as:

> A deterministic Trail Catalunya race explorer with enriched, confidence-labeled race facts; an Every.to-style AI handoff that lets users ask ChatGPT/Claude using their own accounts; and an MCP/API layer exposing the same race intelligence to agent clients.

Core deliverables likely needed for planning:

1. Shared race search/recommendation core.
2. Official-site enrichment crawler.
3. Evidence/confidence data model.
4. Tiny admin override file.
5. Deterministic website filter/card upgrades.
6. Intent composer + ChatGPT/Claude/copy handoff.
7. Intent capture analytics.
8. Public compact dataset/API.
9. MCP server with search/recommend/compare/detail tools.
10. Removal or private-gating of hosted AI chat.

## Open Questions Before Planning

These are the remaining decisions worth resolving before implementation planning:

1. What exact fields are included in the compact AI prompt payload?
2. What is the maximum number of races to include directly in a prompt?
3. Should full compact dataset export be JSON, CSV, markdown table, or multiple formats?
4. What is the first version of the confidence scoring rubric?
5. Which enrichment tags are allowed in v2?
6. What exact fields can the admin override file modify?
7. What analytics backend, if any, should capture handoff intent events?
8. Should MCP be hosted publicly in v2 or documented as a local/server install first?
9. How should the site explain uncertainty to normal users without becoming too verbose?
10. What is the demo story for the portfolio page?

