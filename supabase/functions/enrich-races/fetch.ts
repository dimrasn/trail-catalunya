// U3 — SSRF-guarded fetch + same-domain page discovery + HTML→text (R7, R7a,
// R9 input bounds, KTD4). Crawled pages are hostile input: we resolve the host
// and check the RESOLVED IP against a private-range blocklist before every
// connection, handle redirects manually re-validating each hop's domain AND IP,
// cap fetch size and page count, and reduce HTML to bounded plain text. The
// crawler never follows results/participant links.
//
// RESIDUAL (documented): this is a check-then-fetch-by-hostname design, so a
// low-TTL DNS rebind between the resolveDns check and fetch()'s own resolution
// is not fully eliminated — Deno fetch gives no hook to pin the connection to
// the validated IP. The blocklist is deliberately conservative (default-deny on
// non-public ranges incl. IPv6 6to4/Teredo/NAT64/mapped) as defence in depth,
// and seed URLs come from the scraped calendar, not arbitrary user input. Full
// IP-pinning is a follow-up if the threat model tightens.
//
// DNS resolver and fetch are injectable so tests cover rebind/redirect attacks
// without real network. Run: deno test supabase/functions/enrich-races/fetch_test.ts

import { registeredDomain } from './classify.ts'

export const MAX_PAGE_CHARS = 12_000 // per-page plain-text ceiling fed to the LLM
export const MAX_PAGES_PER_RACE = 4 // seed + up to 3 relevant sub-pages
export const MAX_BYTES = 2_000_000 // fetch-size cap
export const MAX_REDIRECTS = 4
export const REQUEST_TIMEOUT_MS = 15_000

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

// Slugs worth following on the race's own domain (Catalan/Spanish variants).
const RELEVANT_SLUG = /(inscri|reglament|horari|programa|info|cursa|carrera|prova|preu|tarifa|schedule|registration)/i
// Never follow these — personal data / off-topic (data minimisation, R7).
const EXCLUDE_SLUG = /(result|classific|participant|ranquing|ranking|galeria|foto|patrocina|sponsor)/i

export interface Page {
  url: string
  text: string
}

export type Resolver = (host: string) => Promise<string[]>

// ---- IP blocklist (R7a) ---------------------------------------------------

export function isBlockedIp(ip: string): boolean {
  const addr = ip.trim().toLowerCase()
  if (!addr) return true

  // IPv6 — conservative default-deny on non-global ranges.
  if (addr.includes(':')) {
    if (addr === '::1' || addr === '::') return true // loopback / unspecified
    if (addr.startsWith('fe80')) return true // link-local
    if (addr.startsWith('fc') || addr.startsWith('fd')) return true // unique-local
    if (addr.startsWith('2002:')) return true // 6to4 (embeds arbitrary v4)
    if (addr.startsWith('2001:0') || addr.startsWith('2001:db8')) return true // Teredo / doc
    if (addr.startsWith('64:ff9b')) return true // NAT64
    // IPv4-mapped (::ffff:a.b.c.d)
    const mapped = addr.split(':').pop() || ''
    if (mapped.includes('.')) return isBlockedIp(mapped)
    // Any remaining ::-compressed/hex-mapped form (e.g. ::ffff:7f00:1) — block.
    if (addr.startsWith('::')) return true
    return false
  }

  // IPv4
  const parts = addr.split('.').map((p) => parseInt(p, 10))
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true
  const [a, b] = parts
  if (a === 0 || a === 10 || a === 127) return true // this-network / private / loopback
  if (a === 169 && b === 254) return true // link-local incl. 169.254.169.254 metadata
  if (a === 172 && b >= 16 && b <= 31) return true // private
  if (a === 192 && b === 168) return true // private
  if (a === 100 && b >= 64 && b <= 127) return true // CGNAT
  if (a >= 224) return true // multicast / reserved
  return false
}

async function defaultResolver(host: string): Promise<string[]> {
  const out: string[] = []
  for (const kind of ['A', 'AAAA'] as const) {
    try {
      out.push(...(await Deno.resolveDns(host, kind)))
    } catch {
      // one family may be absent; ignore
    }
  }
  return out
}

async function assertHostAllowed(host: string, resolver: Resolver): Promise<void> {
  let ips: string[]
  try {
    ips = await resolver(host)
  } catch {
    throw new Error(`dns resolution failed for ${host}`)
  }
  if (ips.length === 0) throw new Error(`no addresses for ${host}`)
  for (const ip of ips) {
    if (isBlockedIp(ip)) throw new Error(`blocked address ${ip} for ${host}`)
  }
}

export interface FetchOpts {
  resolver?: Resolver
  fetchImpl?: typeof fetch
  maxRedirects?: number
  maxBytes?: number
}

// Fetch one URL safely, following redirects manually with per-hop domain + IP
// re-validation. Returns the response body text (size-capped), or throws.
export async function safeFetch(rawUrl: string, opts: FetchOpts = {}): Promise<string> {
  const resolver = opts.resolver ?? defaultResolver
  const doFetch = opts.fetchImpl ?? fetch
  const maxRedirects = opts.maxRedirects ?? MAX_REDIRECTS
  const maxBytes = opts.maxBytes ?? MAX_BYTES

  let current = new URL(rawUrl)
  const seedDomain = registeredDomain(current.hostname)

  for (let hop = 0; hop <= maxRedirects; hop++) {
    if (current.protocol !== 'https:') throw new Error(`non-https url ${current.href}`)
    if (registeredDomain(current.hostname) !== seedDomain) {
      throw new Error(`off-domain redirect to ${current.hostname}`)
    }
    await assertHostAllowed(current.hostname, resolver)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    let res: Response
    try {
      res = await doFetch(current.href, {
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'ca,es,en;q=0.8' },
      })
    } finally {
      clearTimeout(timer)
    }

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location')
      if (!loc) throw new Error('redirect without location')
      current = new URL(loc, current) // resolve relative; re-validated at loop top
      continue
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${current.href}`)

    const len = Number(res.headers.get('content-length') || '0')
    if (len && len > maxBytes) throw new Error(`response too large (${len})`)
    return await readCapped(res, maxBytes)
  }
  throw new Error('too many redirects')
}

// Read a response body streaming, stopping once maxBytes is reached. A
// hostile/compromised host can omit Content-Length and stream an unbounded
// body; res.text() would buffer all of it into memory first. This caps it.
async function readCapped(res: Response, maxBytes: number): Promise<string> {
  if (!res.body) return (await res.text()).slice(0, maxBytes)
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (total < maxBytes) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    total += value.length
  }
  try {
    await reader.cancel()
  } catch {
    // already closed
  }
  const out = new Uint8Array(Math.min(total, maxBytes))
  let offset = 0
  for (const c of chunks) {
    if (offset >= out.length) break
    const take = Math.min(c.length, out.length - offset)
    out.set(c.subarray(0, take), offset)
    offset += take
  }
  return new TextDecoder().decode(out)
}

// ---- HTML → text (pure) ---------------------------------------------------

export function htmlToText(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|head|nav|footer|svg)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#?\w+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ---- Page discovery (pure) ------------------------------------------------

// Find same-registered-domain links worth crawling (registration/schedule/…),
// excluding results/participant pages. Returns absolute URLs, de-duplicated.
export function discoverPageLinks(html: string, baseUrl: string): string[] {
  const base = new URL(baseUrl)
  const seedDomain = registeredDomain(base.hostname)
  const out = new Set<string>()
  const hrefRe = /<a\b[^>]*href\s*=\s*["']([^"']+)["']/gi
  let m: RegExpExecArray | null
  while ((m = hrefRe.exec(html)) !== null) {
    const href = m[1]
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue
    let u: URL
    try {
      u = new URL(href, base)
    } catch {
      continue
    }
    if (u.protocol !== 'https:' && u.protocol !== 'http:') continue
    if (registeredDomain(u.hostname) !== seedDomain) continue
    const path = (u.pathname + u.search).toLowerCase()
    if (EXCLUDE_SLUG.test(path)) continue
    if (!RELEVANT_SLUG.test(path)) continue
    u.hash = ''
    out.add(u.href)
  }
  return [...out]
}

// Extract every outbound http(s) URL from raw HTML — from href/src attributes
// AND bare URLs in text/JS (Wikiloc/Komoot embeds often sit in an iframe src or a
// script blob). Pure, absolute-resolved against baseUrl, de-duplicated. This is the
// LINK EVIDENCE the text-only Page cannot carry: htmlToText strips every tag, so a
// track/social URL only survives here. Not filtered to a domain — the enrichment
// batch applies the host allowlist; capturing everything keeps the corpus honest.
export function extractOutboundUrls(html: string, baseUrl: string): string[] {
  const base = new URL(baseUrl)
  const out = new Set<string>()
  const push = (raw: string) => {
    const s = raw.trim()
    if (!s || s.startsWith('#') || s.startsWith('mailto:') || s.startsWith('tel:')) return
    try {
      const u = new URL(s, base)
      if (u.protocol !== 'https:' && u.protocol !== 'http:') return
      u.hash = ''
      out.add(u.href)
    } catch { /* skip unparseable */ }
  }
  const attrRe = /\b(?:href|src|data-src|content)\s*=\s*["']([^"']+)["']/gi
  let m: RegExpExecArray | null
  while ((m = attrRe.exec(html)) !== null) push(m[1])
  const bareRe = /https?:\/\/[^\s"'<>()\\]+/gi
  while ((m = bareRe.exec(html)) !== null) push(m[0].replace(/[.,;:]+$/, ''))
  return [...out]
}

// ---- Orchestration --------------------------------------------------------

// Fetch the seed page plus a few relevant same-domain pages, each reduced to
// bounded plain text. Best-effort: a page that fails is skipped, never thrown.
export async function fetchRacePages(seedUrl: string, opts: FetchOpts = {}): Promise<Page[]> {
  const pages: Page[] = []
  let seedHtml: string
  try {
    seedHtml = await safeFetch(seedUrl, opts)
  } catch {
    return pages // seed unreachable → no pages → caller records "unknown"
  }
  pages.push({ url: seedUrl, text: htmlToText(seedHtml).slice(0, MAX_PAGE_CHARS) })

  const links = discoverPageLinks(seedHtml, seedUrl).slice(0, MAX_PAGES_PER_RACE - 1)
  for (const link of links) {
    try {
      const html = await safeFetch(link, opts)
      pages.push({ url: link, text: htmlToText(html).slice(0, MAX_PAGE_CHARS) })
    } catch {
      // skip unreachable sub-page
    }
  }
  return pages
}

// Same crawl as fetchRacePages, but each page also carries `links` — every
// outbound URL found in its raw HTML (see extractOutboundUrls). Used to build the
// durable corpus for the enrichment slice; the runtime pipeline uses the text-only
// variant above. Bounded identically.
export async function fetchRacePagesWithLinks(
  seedUrl: string,
  opts: FetchOpts = {},
): Promise<Array<Page & { links: string[] }>> {
  const pages: Array<Page & { links: string[] }> = []
  let seedHtml: string
  try {
    seedHtml = await safeFetch(seedUrl, opts)
  } catch {
    return pages
  }
  pages.push({
    url: seedUrl,
    text: htmlToText(seedHtml).slice(0, MAX_PAGE_CHARS),
    links: extractOutboundUrls(seedHtml, seedUrl),
  })
  const links = discoverPageLinks(seedHtml, seedUrl).slice(0, MAX_PAGES_PER_RACE - 1)
  for (const link of links) {
    try {
      const html = await safeFetch(link, opts)
      pages.push({
        url: link,
        text: htmlToText(html).slice(0, MAX_PAGE_CHARS),
        links: extractOutboundUrls(html, link),
      })
    } catch {
      // skip unreachable sub-page
    }
  }
  return pages
}
