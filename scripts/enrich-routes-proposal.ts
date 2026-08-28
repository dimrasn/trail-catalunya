// ROUTES-ONLY route-map publication — the REVIEWED slice (runtime imports this).
// Reads link-candidates.json, applies a tightened deterministic route-identity rule,
// then subtracts the routes an outside reviewer (Codex, 2026-08-27) withheld — i.e. this
// is the candidate → approval-ledger → publish flow, with Codex as the one-time reviewer.
// Socials are EXCLUDED entirely (town-named-race ↔ municipality collision, shelved).
//
// Route identity rule (auto):
//   1. slug contains a DISTINCTIVE (≥5-char, non-generic) token of the race name/town.
//   2. no prior-edition year (strip the route id, then no 19xx/20xx < 2026).
//   3. (upstream in candidates: host-exact allowlist, route shape, seed-page/tenancy,
//      cross-event dedup.)
// Reviewer ledger (WITHHELD): the rule is URL-only, so it cannot see an edition year that
// lives in the route TITLE (not the slug) or a weak town-token match. Codex read all 25
// and withheld 5 for those reasons; recorded below by route id.
//
// Framing shipped: "Route map (from the official page) — confirm the exact course on the
// site." Low-blast; residual risk is a sibling-distance route, not a wrong race.
//
// Run: deno run --allow-read --allow-write scripts/enrich-routes-proposal.ts

const CANDIDATES = 'docs/enrichment/2026-batch/link-candidates.json'
const OUT = 'docs/enrichment/2026-batch/routes.json'

// Reviewer ledger — Wikiloc route ids withheld by Codex (2026-08-27) with reason.
// (See outputs/2026-08-26_codex-enrichment-slice1-review-findings_v1.md, round-3 routes.)
const WITHHELD: Record<string, string> = {
  '154590713': 'Colldejou route explicitly labelled 2025 (edition year in the route title, not the slug)',
  '154591103': 'Colldejou route explicitly labelled 2025',
  '154591561': 'Colldejou route explicitly labelled 2025',
  '154993569': 'Folguerolenca route with explicit 2023 evidence',
  '266728239': 'Bocafoscant: matches only the town token `guingueta`; a hike near the town, not the race course',
}
function routeId(url: string): string {
  return (url.match(/(\d{5,})(?:\D*)$/)?.[1]) ?? ''
}

// Generic trail vocabulary + generic geographic/common words: a match on these is NOT
// distinctive (many races share them; `sant` matched an unrelated route in round 3).
const GENERIC = new Set([
  'cursa', 'curses', 'trail', 'trails', 'marato', 'vertical', 'cros', 'cross', 'milla',
  'nocturna', 'nocturn', 'popular', 'muntanya', 'cami', 'pujada', 'volta', 'ultra',
  'mitja', 'skyrace', 'race', 'running', 'trailrunning', 'caminada', 'marxa', 'travessa',
  'duatlo', 'oficial', 'edicio', 'senderisme', 'senderismo', 'rutes', 'rutas', 'correr',
  'carrera', 'serra', 'trailseries', 'series', 'sant', 'santa', 'mare', 'nova', 'vella',
  'alta', 'baix', 'pont', 'coll', 'riera', 'vila', 'roca', 'font', 'mont', 'nadal',
])
const norm = (s: string) =>
  (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

function distinctiveTokens(r: { race_name: string; town: string }): string[] {
  const out = new Set<string>()
  for (const src of [r.race_name, r.town]) {
    for (const t of norm(src).split(' ')) if (t.length >= 5 && !GENERIC.has(t)) out.add(t)
  }
  return [...out]
}
function slugText(url: string): string {
  return norm(url.split('?')[0].replace(/\/$/, '').split('/').pop() || '')
}
function namesRace(slug: string, tokens: string[]): boolean {
  const compact = slug.replace(/ /g, '')
  return tokens.some((t) => compact.includes(t))
}
function isPriorEdition(slug: string): boolean {
  const noId = slug.replace(/\s+\d{5,}\s*$/, '')
  const m = noId.match(/(19|20)\d\d/)
  return m ? Number(m[0]) < 2026 : false
}

type Cand = {
  id: string; town: string; race_name: string; source_url: string; fetched_at: string
  tracks: { url: string; source_page: string; page_hash: string }[]
}
const cands: Cand[] = JSON.parse(await Deno.readTextFile(CANDIDATES)).races

const out: unknown[] = []
let published = 0, ruleRejected = 0, reviewerWithheld = 0
for (const r of cands) {
  const tokens = distinctiveTokens(r)
  const tracks = r.tracks.filter((t) => {
    const s = slugText(t.url)
    if (!(tokens.length > 0 && namesRace(s, tokens) && !isPriorEdition(s))) { ruleRejected++; return false }
    if (WITHHELD[routeId(t.url)]) { reviewerWithheld++; return false } // reviewer ledger
    published++
    return true
  }).map((t) => ({ url: t.url, source_page: t.source_page, page_hash: t.page_hash }))
  if (tracks.length) {
    out.push({ id: r.id, town: r.town, race_name: r.race_name, source_url: r.source_url, fetched_at: r.fetched_at, tracks })
  }
}

await Deno.writeTextFile(OUT, JSON.stringify({
  publication: 'routes-only route maps (socials shelved)',
  identity_rule: 'distinctive (≥5-char, non-generic) name/town token in slug; no prior-edition year',
  reviewed_by: 'Codex 2026-08-27',
  withheld: WITHHELD,
  generated_from: CANDIDATES,
  races: out,
}, null, 2))
console.log(`routes.json (reviewed): ${out.length} races, ${published} routes published — ${ruleRejected} rule-rejected, ${reviewerWithheld} reviewer-withheld → ${OUT}`)
