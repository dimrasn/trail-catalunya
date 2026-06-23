// Tests for U3 safe fetch + discovery + HTML→text (R7, R7a, KTD4).
// DNS resolver and fetch are injected so SSRF attacks are covered offline.
// Run: deno test --allow-net=0.0.0.0 supabase/functions/enrich-races/fetch_test.ts
// (no real network is used; --allow-net is not required for the injected paths)

import { assert, assertEquals, assertRejects } from 'jsr:@std/assert@1'
import {
  discoverPageLinks,
  fetchRacePages,
  htmlToText,
  isBlockedIp,
  safeFetch,
} from './fetch.ts'

const PUBLIC = async (_host: string) => ['93.184.216.34']
const ok = (body: string, headers: Record<string, string> = {}) =>
  new Response(body, { status: 200, headers })
const redirect = (location: string) =>
  new Response('', { status: 301, headers: { location } })

Deno.test('isBlockedIp flags private/loopback/link-local/metadata/CGNAT/multicast', () => {
  for (
    const ip of [
      '127.0.0.1', '10.0.0.5', '172.16.9.9', '192.168.1.1', '169.254.169.254', '0.0.0.0',
      '100.64.0.1', '100.127.0.1', '224.0.0.1', '255.255.255.255',
      '::1', 'fe80::1', 'fc00::1', 'fd00::1',
      '2002:0a00:0001::', '2001:0::1', '64:ff9b::1', '::ffff:7f00:1', '::ffff:10.0.0.1',
    ]
  ) {
    assertEquals(isBlockedIp(ip), true, ip)
  }
  for (const ip of ['93.184.216.34', '8.8.8.8', '1.1.1.1', '2606:4700:4700::1111']) {
    assertEquals(isBlockedIp(ip), false, ip)
  }
  assertEquals(isBlockedIp('garbage'), true)
})

Deno.test('htmlToText strips scripts/styles/nav and decodes entities', () => {
  const html = `<html><head><title>x</title></head><body>
    <nav>menu</nav><script>evil()</script><style>.a{}</style>
    <h1>Cursa</h1><p>Sortida 08:00 &amp; preu 25&euro;</p></body></html>`
  const text = htmlToText(html)
  assert(!text.includes('evil'))
  assert(!text.includes('menu'))
  assert(text.includes('Cursa'))
  assert(text.includes('Sortida 08:00'))
  assert(text.includes('&'))
})

Deno.test('discoverPageLinks picks relevant same-domain pages, skips results + cross-domain', () => {
  const html = `
    <a href="/inscripcions">Inscripcions</a>
    <a href="https://race.cat/horaris">Horaris</a>
    <a href="/resultats-2025">Resultats</a>
    <a href="https://facebook.com/race">FB</a>
    <a href="#top">top</a>`
  const links = discoverPageLinks(html, 'https://race.cat/')
  assert(links.includes('https://race.cat/inscripcions'))
  assert(links.includes('https://race.cat/horaris'))
  assert(!links.some((l) => l.includes('resultats')))
  assert(!links.some((l) => l.includes('facebook')))
})

Deno.test('safeFetch returns body for a public host', async () => {
  const body = await safeFetch('https://race.cat/', { resolver: PUBLIC, fetchImpl: async () => ok('hello') })
  assertEquals(body, 'hello')
})

Deno.test('safeFetch rejects non-https', async () => {
  await assertRejects(() => safeFetch('http://race.cat/', { resolver: PUBLIC, fetchImpl: async () => ok('x') }))
})

Deno.test('safeFetch rejects DNS-rebind to a private address', async () => {
  const rebind = async (_h: string) => ['10.0.0.7'] // resolves to private at fetch time
  await assertRejects(
    () => safeFetch('https://evil.cat/', { resolver: rebind, fetchImpl: async () => ok('x') }),
    Error,
    'blocked address',
  )
})

Deno.test('safeFetch rejects a redirect to a bare private IP', async () => {
  await assertRejects(
    () => safeFetch('https://race.cat/', { resolver: PUBLIC, fetchImpl: async () => redirect('https://169.254.169.254/') }),
    Error,
  )
})

Deno.test('safeFetch rejects an off-domain redirect', async () => {
  await assertRejects(
    () => safeFetch('https://race.cat/', { resolver: PUBLIC, fetchImpl: async () => redirect('https://evil.com/') }),
    Error,
    'off-domain',
  )
})

Deno.test('safeFetch truncates oversized bodies', async () => {
  const body = await safeFetch('https://race.cat/', {
    resolver: PUBLIC,
    fetchImpl: async () => ok('0123456789ABCDEFG'),
    maxBytes: 10,
  })
  assertEquals(body.length, 10)
})

Deno.test('safeFetch rejects a redirect with no Location header', async () => {
  await assertRejects(
    () => safeFetch('https://race.cat/', { resolver: PUBLIC, fetchImpl: async () => new Response('', { status: 301 }) }),
    Error,
    'redirect without location',
  )
})

Deno.test('safeFetch rejects oversized bodies declared via Content-Length before reading', async () => {
  await assertRejects(
    () => safeFetch('https://race.cat/', { resolver: PUBLIC, fetchImpl: async () => ok('x', { 'content-length': '9999999' }), maxBytes: 100 }),
    Error,
    'too large',
  )
})

Deno.test('safeFetch rejects a DNS resolver that throws or returns nothing', async () => {
  await assertRejects(
    () => safeFetch('https://race.cat/', { resolver: async () => { throw new Error('nx') }, fetchImpl: async () => ok('x') }),
    Error,
    'dns resolution failed',
  )
  await assertRejects(
    () => safeFetch('https://race.cat/', { resolver: async () => [], fetchImpl: async () => ok('x') }),
    Error,
    'no addresses',
  )
})

Deno.test('fetchRacePages returns seed + relevant sub-page, skips results', async () => {
  const seedHtml = `<h1>Cursa</h1><a href="/inscripcions">Inscr</a><a href="/resultats">Res</a>`
  const fetchImpl = (async (url: string | URL) => {
    const u = String(url)
    if (u.endsWith('/inscripcions')) return ok('<p>Inscripcions obertes</p>')
    return ok(seedHtml)
  }) as typeof fetch
  const pages = await fetchRacePages('https://race.cat/', { resolver: PUBLIC, fetchImpl })
  assertEquals(pages.length, 2)
  assert(pages[0].text.includes('Cursa'))
  assert(pages.some((p) => p.url.endsWith('/inscripcions')))
  assert(!pages.some((p) => p.url.includes('resultats')))
})

Deno.test('fetchRacePages returns empty when the seed is unreachable', async () => {
  const pages = await fetchRacePages('https://race.cat/', {
    resolver: PUBLIC,
    fetchImpl: async () => {
      throw new Error('network down')
    },
  })
  assertEquals(pages.length, 0)
})
