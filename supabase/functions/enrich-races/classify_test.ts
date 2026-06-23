// Tests for U2 URL classification (R6a, AE7).
// Run: deno test supabase/functions/enrich-races/classify_test.ts

import { assertEquals } from 'jsr:@std/assert@1'
import { classifyUrl, isCrawlable, registeredDomain } from './classify.ts'

Deno.test('social hosts classify as social', () => {
  assertEquals(classifyUrl('https://www.instagram.com/lamaasaiada/'), 'social')
  assertEquals(classifyUrl('https://facebook.com/events/123'), 'social')
  assertEquals(classifyUrl('https://m.facebook.com/somerace'), 'social')
})

Deno.test('google docs/sites and pdf classify as doc', () => {
  assertEquals(classifyUrl('https://docs.google.com/document/d/abc'), 'doc')
  assertEquals(classifyUrl('https://sites.google.com/view/cursa'), 'doc')
  assertEquals(classifyUrl('https://club.cat/reglament.pdf'), 'doc')
})

Deno.test('known registration platforms classify as platform', () => {
  assertEquals(classifyUrl('https://www.curses.cat/cursa/123'), 'platform')
  assertEquals(classifyUrl('https://inscripcions.cat/x'), 'platform')
  assertEquals(classifyUrl('https://avaibooksports.com/inscripcion/9'), 'platform')
})

Deno.test('a club domain classifies as own-site', () => {
  assertEquals(classifyUrl('https://www.lamaasaiada.cat/'), 'own-site')
  assertEquals(classifyUrl('https://ultrapirineu.com/en/'), 'own-site')
})

Deno.test('subdomain and www variants resolve by registered domain', () => {
  assertEquals(classifyUrl('https://inscripcio.curses.cat/x'), 'platform')
  assertEquals(registeredDomain('www.foo.curses.cat'), 'curses.cat')
  assertEquals(registeredDomain('LaMaasaiada.CAT'), 'lamaasaiada.cat')
})

Deno.test('empty, missing, and malformed urls classify as none', () => {
  assertEquals(classifyUrl(''), 'none')
  assertEquals(classifyUrl('   '), 'none')
  assertEquals(classifyUrl(null), 'none')
  assertEquals(classifyUrl(undefined), 'none')
  assertEquals(classifyUrl('not a url'), 'none')
  assertEquals(classifyUrl('ftp://files.cat/x'), 'none')
})

Deno.test('isCrawlable only for own-site and platform', () => {
  assertEquals(isCrawlable('own-site'), true)
  assertEquals(isCrawlable('platform'), true)
  assertEquals(isCrawlable('social'), false)
  assertEquals(isCrawlable('doc'), false)
  assertEquals(isCrawlable('none'), false)
})
