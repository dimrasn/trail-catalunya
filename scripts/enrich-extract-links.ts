// Slice-1 LINK extraction — deterministic, no LLM (fields-spec.md "Slice 1").
// Reads the durable corpus (docs/enrichment/2026-batch/_corpus/) and emits, per
// race, the track/route + social URLs that OCCUR on the race's own official pages
// and pass a small host allowlist. Publishes nothing on its own — output is a
// candidate bundle for review + promotion.
//
// Honesty rules enforced here:
//  - A link is kept ONLY if it parses + host is allowlisted + it appears verbatim in
//    a captured page's `links` (evidence). No fabrication, no inference.
//  - Links are EVENT-LEVEL: "maps/socials linked from the official site", never
//    attached to a distance-variant as "THE gpx of the 42k" (a page links several).
//  - Every fact carries source_page + page_hash + fetched_at (freshness anchor).
//
// Run: deno run --allow-read --allow-write scripts/enrich-extract-links.ts

const CORPUS = 'docs/enrichment/2026-batch/_corpus'
const OUT = 'docs/enrichment/2026-batch/links.json'

type Page = { url: string; hash: string; chars: number; text: string; links: string[] }
type CorpusFile = { race: { race_url: string; town: string; race_name: string }; fetched_at: string; pages: Page[] }

// Social paths that are share widgets / pixels / SDK / platform chrome, never an
// organizer's own channel. A confidently-wrong "official Instagram" is worse than a
// gap, so these are rejected outright.
const SOCIAL_NOISE_PATH = /^\/(sharer|share|share\.php|dialog|plugins|intent|tr|v2\.0|connect|login|policy|help|about|privacy|terms|hashtag|explore|reel|reels|p|stories|watch|media|pages|groups|events\/\w)/i
// Bare numeric Facebook path (a page-ID or pixel ref, not a human profile).
const NUMERIC_HANDLE = /^\d{5,}$/
// Handles that are platform/CMS/vendor footers, not a race channel.
const SOCIAL_NOISE_HANDLE = /^(wordpresscom|wordpress|meta|facebookapp|instagram|metaai)$/i
const ASSET_EXT = /\.(js|css|json|xml|png|jpe?g|gif|svg|webp|ico|woff2?)$/i

// host → kind. `track` = a route/GPX with a profile; `social` = organizer channel.
// Strava clubs/athletes are community, NOT a route → classified social, not track.
// Returns null for anything that fails the honesty filter.
export function classifyLink(u: URL): 'track' | 'social' | null {
  const h = u.hostname.toLowerCase()
  const p = u.pathname.toLowerCase()
  if (ASSET_EXT.test(p)) return null // embed.js, sprite.png, etc.
  if (h.includes('wikiloc')) {
    if (/\/user\.do/.test(p)) return null // a Wikiloc USER profile, not a route
    // a route: a slug ending in the numeric id, or an embed carrying id=<n>
    if (/-\d{4,}\/?$/.test(p) || /\bid=\d{4,}/.test(u.search)) return 'track'
    return null // bare wikiloc.com root / homepage / logo link
  }
  if (h.includes('komoot')) {
    if (/\/(tour|smarttour|highlight)\/\d+/.test(p)) return 'track'
    return null
  }
  if (h === 'strava-embeds.com') return null // SDK host, not strava.com
  if (h.includes('strava')) {
    if (/\/(routes|activities|segments)\/\d+/.test(p)) return 'track'
    if (/\/(clubs|athletes)\/[\w-]+/.test(p)) return 'social'
    return null
  }
  const isFb = h === 'facebook.com' || h.endsWith('.facebook.com') || h === 'fb.com'
  const isIg = h.includes('instagram')
  if (!isFb && !isIg) return null
  // social must be a real handle path, not a root / widget / pixel / vendor footer
  const seg = p.replace(/^\/+|\/+$/g, '').split('/')[0]
  if (!seg) return null
  if (SOCIAL_NOISE_PATH.test(p)) return null
  if (SOCIAL_NOISE_HANDLE.test(seg)) return null
  if (NUMERIC_HANDLE.test(seg)) return null
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

  const out: unknown[] = []
  let withTrack = 0, withSocial = 0
  for (const name of files) {
    const cf: CorpusFile = JSON.parse(await Deno.readTextFile(`${CORPUS}/${name}`))
    // key = normalized url; value = first evidence seen (source page + hash)
    const seen = new Map<string, { kind: 'track' | 'social'; url: string; source_page: string; page_hash: string }>()
    for (const page of cf.pages) {
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

  await Deno.writeTextFile(OUT, JSON.stringify({ generated_from: CORPUS, races: out }, null, 2))
  console.log(`links: ${out.length} races have ≥1 link — ${withTrack} with a track/route, ${withSocial} with a social channel → ${OUT}`)
}
