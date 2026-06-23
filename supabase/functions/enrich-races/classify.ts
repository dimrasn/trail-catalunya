// U2 — URL classification (R6a). Decides whether a race's URL is a crawlable
// own-site, a shared registration platform, a social page, a document, or
// nothing usable. Non-crawlable classes yield "unknown" facts rather than
// being silently dropped, so coverage can be measured honestly.
//
// Pure function — no DB, no network. Run: deno test classify_test.ts

export type UrlClass = 'own-site' | 'platform' | 'social' | 'doc' | 'none'

// Social hosts: pages with no meaningful same-domain crawl surface.
const SOCIAL_DOMAINS = new Set([
  'instagram.com',
  'facebook.com',
  'fb.com',
  'fb.me',
  'twitter.com',
  'x.com',
])

// Document/site-builder hosts: not an own-site with crawlable race pages.
const DOC_DOMAINS = new Set([
  'docs.google.com',
  'sites.google.com',
  'drive.google.com',
])

// Shared registration platforms: one domain hosts hundreds of unrelated
// races, so a generic same-domain crawl has the wrong semantics. NOTE: this
// list needs periodic review as new platforms appear (residual risk in plan).
const PLATFORM_DOMAINS = new Set([
  'curses.cat',
  'inscripcions.cat',
  'avaibooksports.com',
  'naturetime.es',
  'rockthesport.com',
  'dorsalchip.es',
  'emesports.es',
  'sportmaniacs.com',
  'elitechip.net',
])

// Registered domain = last two labels, lowercased, www. stripped. Adequate for
// the .cat/.com/.es TLDs in this dataset; multi-part TLDs (.co.uk) are not a
// concern for Catalan race sites.
export function registeredDomain(hostname: string): string {
  const host = hostname.toLowerCase().replace(/^www\./, '')
  const labels = host.split('.').filter(Boolean)
  if (labels.length <= 2) return host
  return labels.slice(-2).join('.')
}

export function classifyUrl(rawUrl: string | null | undefined): UrlClass {
  const url = (rawUrl || '').trim()
  if (!url) return 'none'

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return 'none'
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return 'none'

  // A direct document link is a doc regardless of host.
  if (/\.(pdf|docx?|odt)$/i.test(parsed.pathname)) return 'doc'

  const fullHost = parsed.hostname.toLowerCase().replace(/^www\./, '')
  if (DOC_DOMAINS.has(fullHost)) return 'doc'

  const domain = registeredDomain(parsed.hostname)
  if (SOCIAL_DOMAINS.has(domain)) return 'social'
  if (DOC_DOMAINS.has(domain)) return 'doc'
  if (PLATFORM_DOMAINS.has(domain)) return 'platform'

  return 'own-site'
}

// Crawlable this phase: own-site only. Platform domains host hundreds of
// unrelated races, so a same-domain crawl would pull facts from the wrong event
// (per-platform extraction is deferred — see plan Scope Boundaries). social,
// doc, platform, and none all yield unknown facts in Phase 2a.
export function isCrawlable(cls: UrlClass): boolean {
  return cls === 'own-site'
}
