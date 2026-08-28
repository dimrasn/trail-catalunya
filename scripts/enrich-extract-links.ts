// Link CANDIDATE extraction — deterministic, no LLM. Reads the durable corpus
// (docs/enrichment/2026-batch/_corpus/) and emits the host-allowlisted track/social
// URLs found on each race's own page, with per-page provenance.
//
// LINKS ARE SHELVED (2026-08-26). This writes ONLY link-candidates.json, an INTERNAL
// record — nothing in the site or MCP imports it. Publication was tried and pulled: a
// string identity-proof (does the link's slug/handle name the race?) cannot prove a
// link BELONGS to a race and leaked confidently-wrong links across 3 Codex rounds
// (town-named races collide with their municipality's account; sponsor handles contain
// the town; a followed route belongs to a sibling race). A future links slice must gate
// on link-LOCAL evidence (anchor text + nearest heading; "under a Sponsors heading?")
// or a human approval ledger. Closeout: outputs/2026-08-26_...-closeout_v1.md.
//
// The classifier (host-exact allowlist, route/social shape, spoof/CDN rejection) + the
// cross-event route dedup + the seed-page/tenancy rule remain sound and are the reusable
// groundwork. Run: deno run --allow-read --allow-write scripts/enrich-extract-links.ts

const CORPUS = 'docs/enrichment/2026-batch/_corpus'
const CANDIDATES = 'docs/enrichment/2026-batch/link-candidates.json' // internal, high-recall

type Page = { url: string; hash: string; chars: number; text: string; links: string[] }
type CorpusFile = { race: { race_url: string; town: string; race_name: string }; fetched_at: string; pages: Page[] }

// Social paths that are share widgets / pixels / SDK / platform chrome / CDN media,
// never an organizer's own channel. A confidently-wrong "official Instagram" is worse
// than a gap, so these are rejected outright (Codex B3).
const SOCIAL_NOISE_PATH = /^\/(sharer|share|share\.php|story\.php|search|dialog|plugins|intent|tr|l\.php|v2\.0|connect|login|policy|help|about|privacy|terms|hashtag|explore|reel|reels|p|stories|watch|media|pages|groups|profile\.php|events\/\w|v\/|o1\/)/i
// Bare numeric Facebook path (a page-ID or pixel ref, not a human profile).
const NUMERIC_HANDLE = /^\d{5,}$/
// Handles that are platform/CMS/vendor footers, not a race channel.
const SOCIAL_NOISE_HANDLE = /^(wordpresscom|wordpress|meta|facebookapp|instagram|metaai|wix|squarespace|godaddy)$/i
// A real profile handle: alphanumerics + . _ - , at least 3 chars.
const PROFILE_HANDLE = /^[a-z0-9][a-z0-9._-]{2,}$/i
const ASSET_EXT = /\.(js|css|json|xml|png|jpe?g|gif|svg|webp|ico|woff2?)$/i

// The registrable domain (last two labels) — so subdomains map to their owner but
// LOOKALIKE hosts do NOT. ca.wikiloc.com → wikiloc.com (kept); cdninstagram.com and
// evilwikiloc.example → themselves (rejected). Codex B3: substring host-matching let
// cdninstagram/strava-embeds/lookalikes through.
function registrable(host: string): string {
  return host.toLowerCase().split('.').slice(-2).join('.')
}
// The service that OWNS this host, or null. Exact registrable-domain allowlist.
function service(host: string): 'wikiloc' | 'komoot' | 'strava' | 'instagram' | 'facebook' | null {
  const r = registrable(host)
  if (r === 'wikiloc.com') return 'wikiloc'
  if (r === 'komoot.com') return 'komoot' // country versions are subdomains (de.komoot.com); NOT a *.komoot wildcard (Codex r2)
  if (r === 'strava.com') return 'strava' // NOT strava-embeds.com
  if (r === 'instagram.com') return 'instagram' // NOT cdninstagram.com
  if (r === 'facebook.com' || r === 'fb.com') return 'facebook'
  return null
}

// host → kind. `track` = a route/GPX with a profile; `social` = organizer channel.
// Strava clubs/athletes are community, NOT a route → classified social, not track.
// Returns null for anything that fails the honesty filter.
export function classifyLink(u: URL): 'track' | 'social' | null {
  const p = u.pathname.toLowerCase()
  if (ASSET_EXT.test(p)) return null // embed.js, sprite.png, etc.
  const svc = service(u.hostname)
  if (!svc) return null
  if (svc === 'wikiloc') {
    if (/\/user\.do/.test(p)) return null // a Wikiloc USER profile, not a route
    // a route: a slug ending in the numeric id, or an embed carrying id=<n>
    if (/-\d{4,}\/?$/.test(p) || /\bid=\d{4,}/.test(u.search)) return 'track'
    return null // bare wikiloc.com root / homepage / logo link
  }
  if (svc === 'komoot') {
    if (/\/(tour|smarttour|highlight)\/\d+/.test(p)) return 'track'
    return null
  }
  if (svc === 'strava') {
    if (/\/(routes|activities|segments)\/\d+/.test(p)) return 'track'
    if (/\/(clubs|athletes)\/[\w-]+/.test(p)) return 'social'
    return null
  }
  // facebook | instagram social — must be a real profile handle, not a widget /
  // pixel / vendor footer / CDN media / navigation endpoint.
  const seg = p.replace(/^\/+|\/+$/g, '').split('/')[0]
  if (!seg) return null
  if (SOCIAL_NOISE_PATH.test(p)) return null
  if (SOCIAL_NOISE_HANDLE.test(seg)) return null
  if (NUMERIC_HANDLE.test(seg)) return null
  if (!PROFILE_HANDLE.test(seg)) return null
  return 'social'
}

// Prefer a clean Wikiloc route URL over its spatialArtifacts embed twin.
function isUglyEmbed(u: string): boolean {
  return /spatialArtifacts\.do|embedv2?\.do|[?&]embed|\/embed\b/i.test(u)
}

// Stable key for a social account: platform + first path segment, lowercased.
// facebook.com/Naturetime and facebook.com/naturetime collapse to one handle.
function socialHandle(url: string): string {
  try {
    const u = new URL(url)
    const plat = u.hostname.includes('instagram') ? 'ig' : 'fb'
    const seg = u.pathname.replace(/^\/+|\/+$/g, '').split('/')[0].toLowerCase()
    return `${plat}:${seg}`
  } catch {
    return `?:${url}`
  }
}

// Drop tracking cruft + decode leaked HTML entities so dedupe works and URLs are clean.
function normalize(raw: string): string | null {
  try {
    const decoded = raw.replace(/&amp;/gi, '&')
    const u = new URL(decoded)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
    u.protocol = 'https:'
    u.hash = ''
    for (const k of [...u.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid|mc_|ref|share|igsh|hl|_rd)/i.test(k)) u.searchParams.delete(k)
    }
    u.search = u.searchParams.toString() ? `?${u.searchParams}` : ''
    return u.href.replace(/\/$/, '')
  } catch {
    return null
  }
}

if (import.meta.main) {
  const files: string[] = []
  for await (const e of Deno.readDir(CORPUS)) {
    if (e.isFile && e.name.endsWith('.json') && e.name !== '_manifest.json') files.push(e.name)
  }
  files.sort()

  const corpus = new Map<string, CorpusFile>()
  for (const name of files) corpus.set(name, JSON.parse(await Deno.readTextFile(`${CORPUS}/${name}`)))

  // Domain tenancy (Codex B1): a registrable domain hosting ≥2 distinct race seed URLs
  // is a shared-organizer site (naturetime.es) where a crawled subpage may be ANOTHER
  // race — so trust only the seed page there. A single-tenant race domain
  // (trobadaaristot.cat) is safe to read across its own subpages.
  const seedsByDomain = new Map<string, Set<string>>()
  for (const cf of corpus.values()) {
    let host = ''
    try { host = new URL(cf.race.race_url).hostname } catch { continue }
    const d = registrable(host)
    if (!seedsByDomain.has(d)) seedsByDomain.set(d, new Set())
    seedsByDomain.get(d)!.add((cf.race.race_url || '').trim().replace(/\/$/, ''))
  }

  const out: unknown[] = []
  let withTrack = 0, withSocial = 0
  for (const name of files) {
    const cf = corpus.get(name)!
    // key = normalized url; value = first evidence seen (source page + hash)
    const seen = new Map<string, { kind: 'track' | 'social'; url: string; source_page: string; page_hash: string }>()
    const seedUrl = (cf.race.race_url || '').trim().replace(/\/$/, '')
    let domain = ''
    try { domain = registrable(new URL(cf.race.race_url).hostname) } catch { /* keep '' */ }
    const shared = (seedsByDomain.get(domain)?.size ?? 0) >= 2
    // Shared domain → seed page only; single-tenant → all own subpages.
    const seedPages = cf.pages.filter((p) => (p.url || '').trim().replace(/\/$/, '') === seedUrl)
    const pages = shared ? (seedPages.length ? seedPages : cf.pages.slice(0, 1)) : cf.pages
    for (const page of pages) {
      for (const raw of page.links || []) {
        const norm = normalize(raw)
        if (!norm) continue
        let u: URL
        try { u = new URL(norm) } catch { continue }
        const kind = classifyLink(u)
        if (!kind) continue
        if (!seen.has(norm)) seen.set(norm, { kind, url: norm, source_page: page.url, page_hash: page.hash })
      }
    }
    const facts = [...seen.values()]
    if (!facts.length) continue
    let tracks = facts.filter((f) => f.kind === 'track')
    // drop the spatialArtifacts embed twin when a clean route URL is present
    if (tracks.some((t) => !isUglyEmbed(t.url))) tracks = tracks.filter((t) => !isUglyEmbed(t.url))
    const socials = facts.filter((f) => f.kind === 'social')
    if (tracks.length) withTrack++
    if (socials.length) withSocial++
    out.push({
      id: name.replace(/\.json$/, ''),
      town: cf.race.town,
      race_name: cf.race.race_name,
      source_url: cf.race.race_url,
      fetched_at: cf.fetched_at,
      tracks: tracks.map((f) => ({ url: f.url, source_page: f.source_page, page_hash: f.page_hash })),
      socials: socials.map((f) => ({
        url: f.url,
        handle: socialHandle(f.url),
        source_page: f.source_page,
        page_hash: f.page_hash,
      })),
    })
  }

  // Cross-event route dedup (Codex B1 safety net): a route URL claimed by ≥2 DISTINCT
  // events cannot have its identity proven — drop it from ALL of them. On a shared
  // organizer domain a route reused across races is exactly the contamination signal;
  // a route on one event only is trusted.
  type Track = { url: string; source_page: string; page_hash: string }
  const eventsByTrack = new Map<string, Set<string>>()
  for (const r of out as Array<{ id: string; tracks: Track[] }>) {
    for (const t of r.tracks) {
      if (!eventsByTrack.has(t.url)) eventsByTrack.set(t.url, new Set())
      eventsByTrack.get(t.url)!.add(r.id)
    }
  }
  let droppedShared = 0
  for (const r of out as Array<{ tracks: Track[] }>) {
    const before = r.tracks.length
    r.tracks = r.tracks.filter((t) => (eventsByTrack.get(t.url)?.size ?? 0) < 2)
    droppedShared += before - r.tracks.length
  }

  // Shared-vendor scope: a handle linked from ≥3 DISTINCT races is an organizer /
  // timing company / host town, not this race's own channel. Tag it so the runtime
  // can say "Organizer: @x" instead of the confidently-wrong "the race's Instagram".
  type Social = { url: string; handle: string; source_page: string; page_hash: string; scope?: string }
  const racesByHandle = new Map<string, Set<string>>()
  for (const r of out as Array<{ id: string; socials: Social[] }>) {
    for (const s of r.socials) {
      if (!racesByHandle.has(s.handle)) racesByHandle.set(s.handle, new Set())
      racesByHandle.get(s.handle)!.add(r.id)
    }
  }
  const SHARED_THRESHOLD = 3
  for (const r of out as Array<{ socials: Social[] }>) {
    for (const s of r.socials) {
      s.scope = (racesByHandle.get(s.handle)?.size ?? 0) >= SHARED_THRESHOLD ? 'organizer' : 'race'
    }
  }

  // ---- CANDIDATES (internal, high recall) — all host-allowlisted links post-gates.
  // This is the ONLY output: links are SHELVED (2026-08-26). No publication bundle is
  // written and nothing in the site or MCP imports this. A string identity-proof was
  // tried and rejected (3 Codex rounds): URL/handle text overlap cannot prove a link
  // BELONGS to a race — a town-named race collides with its municipality's account, a
  // sponsor handle contains the town, a followed route belongs to a sibling race.
  // A future links slice must gate on link-LOCAL evidence (anchor text + nearest
  // heading, "under a Sponsors/Col·laboradors heading?") or a human approval ledger.
  // See docs/enrichment/fields-spec.md and outputs/2026-08-26_...-closeout_v1.md.
  type Race = {
    id: string; town: string; race_name: string; source_url: string; fetched_at: string
    tracks: Track[]; socials: Social[]
  }
  const candidates = (out as Race[]).filter((r) => r.tracks.length || r.socials.length)
  await Deno.writeTextFile(CANDIDATES, JSON.stringify({ generated_from: CORPUS, races: candidates }, null, 2))
  console.log(`candidates: ${candidates.length} races (internal only — links shelved; ${droppedShared} cross-event route(s) dropped) → ${CANDIDATES}`)
}
