# SEO roadmap, measurement loop, keyword targets

From the SEO-architect engagement, 2026-08-20 (grounded in a live audit of the
site + this repo). Step 1 (quick wins) shipped in `46eae0e`: server-rendered
race list (was 1 char of crawlable text, now ~12k), robots/sitemap/canonical,
`lang=en`, USP-led head, SportsEvent ItemList JSON-LD, build-time og-image.
Base URL follows `NEXT_PUBLIC_SITE_URL`.

## Roadmap (dependency order)

- **R0. Domain → GSC → Bing → IndexNow** — ✅ DONE 2026-08-20. trailraces.cat
  live (DNS + SSL + 308s verified); GSC verified (HTML-tag meta in layout.js),
  sitemap submitted, homepage indexing requested; Bing Webmaster imported from
  GSC. Still TODO: IndexNow ping on deploy (~20 lines) — ship with R1.
- **R1. Per-race pages** — M. `/race/{slug}` via `generateStaticParams`;
  **year-agnostic URLs** (no year in slug — editions update in place so URL
  equity compounds). Anti-thin contract per page: lead with the drive-time
  block (the sentence nobody else has); distances table (km/D+/price/variant);
  enrichment facts WITH visible "checked DD Mon" freshness stamp; registration
  link out; maps link from lat/lng; related races (same month ±30 drive-min +
  same province) as the internal-link mesh; per-page SportsEvent JSON-LD
  (offers, eventStatus, geo); per-race og-image via the existing next/og
  pattern; title "{Name} 2026 — {DD Mon}, {Town} · {km} km / {D+} m · {drive}
  min from Barcelona". **No AI-generated "about" prose** — unique data reads as
  a resource, boilerplate reads as a doorway farm. Lifecycle: past → page stays
  ("2027 edition TBD"); cancelled → stays with EventCancelled; source-REMOVED →
  never 404 a URL with equity; TBD-date → include, no startDate.
- **R2. Sitemap extension** — S, ships with R1. All race URLs; per-event honest
  `lastmod` = max(scrape run_at, enrichment last_checked) — never the build
  timestamp (teaches Google to distrust lastmod).
- **R3. Internal links** — S, ships with R1. RaceCard links to `/race/{slug}`
  (small external-link icon kept for direct-out); related-races mesh. Without
  this all race pages are orphans.
- **R4. Five curated pages** — M. Trigger: race pages >60% indexed AND first
  Tier-2 impressions (realistically 8–12 weeks post-R1). `/near-barcelona`,
  `/ultras`, `/verticals-skyraces`, `/beginner`, `/kids`. Each = server-filtered
  list + 3–4 sentences of real curation + own meta. NOT month archives, NOT
  filter-combination dumps (doorway risk at zero authority).
- **R5. Localization** — M, after R4. Owner decision: UI-chrome-first (~50
  strings; race data is already Catalan). CA at `/ca/` then ES, hreflang
  cluster, x-default → `/`. Localize homepage + curated pages ONLY — do NOT
  generate `/ca/race/*` × 226 (proper nouns + numbers; tripling URLs for zero
  query gain).

Parked deliberately: blog content, FAQ/breadcrumb schema, month archives, CWV
chasing, multilingual race pages.

## Measurement loop ("see the index → improve → repeat")

Stack (€0): GSC (primary), Bing Webmaster (secondary; feeds ChatGPT search),
Vercel Analytics (referrers), plus a ~30-line middleware logging crawler UAs
(Googlebot, Bingbot, GPTBot, ClaudeBot, PerplexityBot) to a Supabase table —
Vercel hobby logs evaporate in ~1h; crawl rate is the earliest signal we have.
Keep AI bots allowed in robots: being the cited source in AI answers is
distribution for a data-lookup product.

Indicator chain (leading → lagging): crawl rate → indexed coverage →
impressions → position → clicks → returning direct users (the real north
star). Each stage diagnoses the next; never diagnose from clicks alone.

Timeline calibration (new .cat domain — silence ≠ failure):
- Weeks 0–4: only indexed-page count matters. Impressions ≈ 0 is normal.
- Weeks 4–12: first impressions at position 20–60 = system proving out.
- Months 4–6: judge category terms. Seasonality: planning demand peaks
  Dec–Feb; the real harvest for 2026 work is the spring-2027 season.

Weekly 15-min ritual (fixed agenda, 28-day windows — 7-day is noise):
1. GSC Indexing→Pages: indexed vs submitted. <60% at week 6 → audit
   "Crawled – not indexed" pages (need more unique data / internal links).
2. GSC Performance, regex `/race/` vs homepage: impressions per page type;
   position 8–20 with impressions → rewrite that page's title (CTR play);
   growing query cluster → build the matching R4 curated page.
3. Supabase bot table: Googlebot trend = trust compounding; GPTBot/Perplexity
   presence = AI channel forming.
4. Vercel Analytics referrers: chatgpt.com / perplexity.ai = AI-channel
   outcome; strava/whatsapp = share loop.
5. Tracer hand-check (below) from incognito google.es with `gl=ES&pws=0`;
   log to `docs/seo/tracker.md`, same weekday weekly. Never daily.

## Keyword universe (3 tiers)

- **Tier 1 — race-name navigational → race pages.** `{race} 2026 /
  inscripcions / preu / horari / recorregut / cancel·lada` × ~226. Easy where
  the race has only Facebook (Montlude Skyrace, Trail Moixeró, Lo Trail de
  Secà, Vilaverd Skyrace); medium (Marató del Montseny, Prades Epic Trail,
  Olla de Núria); ceiling races (Ultra Pirineu) — position 5–10 max, don't
  measure success there. Enrichment answers the modifier queries literally.
- **Tier 2 — near-Barcelona USP → homepage, later /near-barcelona.** EN "trail
  races near barcelona" (near-zero competition, moves first), ES "carreras de
  montaña cerca de barcelona" (ultrescatalunya is CA-only → ES searchers
  structurally underserved), CA "curses de muntanya prop de barcelona".
- **Tier 3 — category CA/ES → curated pages (months 4–6).** Target month/
  province/type modifiers ("curses de muntanya setembre 2026", "skyrace
  catalunya", "curses per a nens"). **Concede** "calendari trail catalunya" —
  ultrescatalunya's turf and our data source; do not antagonize.

8 tracer bullets (weekly canaries): trail races near barcelona · carreras de
montaña cerca de barcelona · curses de muntanya prop de barcelona · trail
moixeró 2026 · montlude skyrace (moves first) · marató del montseny 2026 ·
prades epic trail inscripcions (canary for enrichment value) · trail races
catalonia 2026.

Decision rule: 4+ tracers moving within 8 weeks of R1 → thesis confirmed,
build R4. Nothing at week 8 → indexing problem: fix coverage, not content.
