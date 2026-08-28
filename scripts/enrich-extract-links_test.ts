// Tests for the honesty-critical link classifier + URL extractor (Slice 1).
// A confidently-wrong "official Instagram" is worse than a gap, so the filter that
// separates real route/social links from widgets, pixels, and vendor footers is the
// load-bearing piece. Run: deno test scripts/enrich-extract-links_test.ts
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { extractOutboundUrls } from '../supabase/functions/enrich-races/fetch.ts'
import { classifyLink } from './enrich-extract-links.ts'

Deno.test('tracks: real routes classify, profiles/roots/assets do not', () => {
  const track = [
    'https://www.wikiloc.com/running-trails/absoluta-pujada-al-montsia-2026-276429776',
    'https://ca.wikiloc.com/rutes-correr/duextrem-trail-2024-179985364',
    'https://es.wikiloc.com/wikiloc/embedv2.do?id=209154158',
    'https://ca.komoot.com/tour/998877',
    'https://www.strava.com/routes/3312345',
  ]
  for (const u of track) assertEquals(classifyLink(new URL(u)), 'track', u)

  const notTrack = [
    'https://www.wikiloc.com', // bare root / logo
    'https://www.wikiloc.com/', // root
    'https://es.wikiloc.com/wikiloc/user.do?id=1938544', // a USER profile, not a route
    'https://strava-embeds.com/embed.js', // SDK asset host
    'https://www.strava.com/', // root
  ]
  for (const u of notTrack) assertEquals(classifyLink(new URL(u)), null, u)
})

Deno.test('socials: real handles classify, widgets/pixels/vendor footers do not', () => {
  assertEquals(classifyLink(new URL('https://www.instagram.com/congosttrailchallenge')), 'social')
  assertEquals(classifyLink(new URL('https://www.facebook.com/agramuntesports')), 'social')
  assertEquals(classifyLink(new URL('https://www.strava.com/clubs/999')), 'social')

  const notSocial = [
    'https://www.instagram.com', // root / share icon
    'https://facebook.com/', // root
    'https://www.facebook.com/sharer/sharer.php?u=x', // share widget
    'https://www.facebook.com/tr?id=628547603278475&ev=PageView', // pixel
    'https://www.facebook.com/WordPresscom', // CMS footer credit
    'https://www.facebook.com/109439738811100', // bare numeric page-id
    'https://www.facebook.com/media/set/?vanity=x', // photo album
    'https://www.instagram.com/p/ABC123', // a single post, not a channel
    'https://m.facebook.com/story.php?story_fbid=pfbid02x', // Codex B3: a story
    'https://www.facebook.com/wix', // Codex B3: CMS vendor
    'https://instagram.com/wix', // Codex B3: CMS vendor
    'https://www.facebook.com/search/top?q=trail', // Codex B3: search result
    'https://www.facebook.com/l.php?u=x', // link shim
  ]
  for (const u of notSocial) assertEquals(classifyLink(new URL(u)), null, u)
})

// Codex B3: substring host-matching admitted lookalikes + CDN hosts. Only the exact
// registrable domain (and its subdomains) may classify.
Deno.test('spoof + CDN hosts are rejected (registrable-domain match, not substring)', () => {
  const spoof = [
    'https://evilwikiloc.example/trails/view/1234-999999', // lookalike host
    'https://wikiloc.com.attacker.net/rutes-correr/x-999999', // suffix trick
    'https://scontent-mad1-1.cdninstagram.com/v/t51.82787-15/img', // IG CDN media
    'https://scontent.cdninstagram.com/o1/v/t2/f2/m86', // IG CDN media
    'https://strava-embeds.com/embed.js', // SDK host, not strava.com
    'https://notfacebook.com/realrace', // lookalike
  ]
  for (const u of spoof) assertEquals(classifyLink(new URL(u)), null, u)
  // real subdomains still work
  assertEquals(classifyLink(new URL('https://ca.wikiloc.com/rutes-correr/x-138622583')), 'track')
  assertEquals(classifyLink(new URL('https://m.facebook.com/agramuntesports')), 'social')
})

// Links are SHELVED (2026-08-26): no runtime publication bundle exists, so there is no
// publication invariant here. The candidate extractor's honesty-critical piece is the
// CLASSIFIER (host-exact allowlist + spoof/CDN rejection), covered above. If a future
// slice reintroduces publication, its gate must be validated against an INDEPENDENT
// hand-verified rejection corpus (municipality/sponsor/collaborator/prior-year), not by
// re-running the publisher's own predicate — a circular test certifies its own bugs.
Deno.test('link-candidates.json (when built) contains only re-classifiable links', async () => {
  let bundle: { races: Array<{ tracks: { url: string }[]; socials: { url: string }[] }> }
  try {
    bundle = JSON.parse(await Deno.readTextFile('docs/enrichment/2026-batch/link-candidates.json'))
  } catch {
    return // candidates are an internal artifact; absence is fine
  }
  for (const r of bundle.races) {
    for (const t of r.tracks) assertEquals(classifyLink(new URL(t.url)), 'track', `track: ${t.url}`)
    for (const s of r.socials) assertEquals(classifyLink(new URL(s.url)), 'social', `social: ${s.url}`)
  }
})

Deno.test('extractOutboundUrls pulls href, iframe src, and bare urls; drops mailto', () => {
  const html = `<a href="https://www.wikiloc.com/trails/view/12345">t</a>
    <iframe src="https://ca.komoot.com/tour/998877/embed"></iframe>
    <a href="/inscripcio">reg</a> ig https://www.instagram.com/x
    <a href="mailto:a@b.com">m</a>`
  const urls = extractOutboundUrls(html, 'https://example.cat/race')
  assertEquals(urls.includes('https://www.wikiloc.com/trails/view/12345'), true)
  assertEquals(urls.includes('https://ca.komoot.com/tour/998877/embed'), true)
  assertEquals(urls.includes('https://example.cat/inscripcio'), true)
  assertEquals(urls.includes('https://www.instagram.com/x'), true)
  assertEquals(urls.some((u) => u.startsWith('mailto')), false)
})
