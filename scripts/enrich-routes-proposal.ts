// ROUTES-ONLY publication PROPOSAL (under Codex review, not wired to runtime).
// Reads link-candidates.json and applies a tightened deterministic route-identity rule,
// writing routes-only-proposal.json for review. Socials are EXCLUDED entirely (the
// town-named-race ↔ municipality collision is unsolvable from strings — shelved).
//
// Route identity rule (auto, no human):
//   1. The route's own slug contains a DISTINCTIVE token of this race's name or town —
//      ≥5 chars and NOT generic trail-vocabulary or a generic geographic word (sant,
//      serra, pont…). This is the identity proof; it kills the round-3 `sant` collision.
//   2. No prior-edition year: after stripping the trailing numeric route id, the slug
//      has no 19xx/20xx before 2026 (drops 2025 routes and `aristot2007`).
//   3. (Already applied upstream in candidates: host-exact allowlist, route shape,
//      seed-page/tenancy, cross-event dedup.)
// Framing if shipped: "Route map (from the official page) — confirm the exact course on
// the site." Low-blast; the residual risk is a sibling-distance route, not a wrong race.
//
// Run: deno run --allow-read --allow-write scripts/enrich-routes-proposal.ts

const CANDIDATES = 'docs/enrichment/2026-batch/link-candidates.json'
const OUT = 'docs/enrichment/2026-batch/routes-only-proposal.json'

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
let published = 0, rejected = 0
const rejects: string[] = []
for (const r of cands) {
  const tokens = distinctiveTokens(r)
  const tracks = r.tracks.filter((t) => {
    const s = slugText(t.url)
    const ok = tokens.length > 0 && namesRace(s, tokens) && !isPriorEdition(s)
    ok ? published++ : (rejected++, rejects.push(`${r.town}: ${s}`))
    return ok
  })
  if (tracks.length) {
    out.push({ id: r.id, town: r.town, race_name: r.race_name, source_url: r.source_url, fetched_at: r.fetched_at, tracks })
  }
}

await Deno.writeTextFile(OUT, JSON.stringify({
  proposal: 'routes-only; identity = distinctive (≥5-char, non-generic) name/town token in slug; no prior-edition year',
  generated_from: CANDIDATES,
  races: out,
}, null, 2))
console.log(`routes-only proposal: ${out.length} races, ${published} routes published, ${rejected} candidate routes rejected → ${OUT}`)
console.log('sample rejects:', rejects.slice(0, 8))
