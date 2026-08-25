import { test, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { POST } from './route.js'

const realFetch = globalThis.fetch
let calls
beforeEach(() => {
  calls = []
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
  globalThis.fetch = async (u, opts) => { calls.push({ u, opts }); return new Response('{}', { status: 200 }) }
})
afterEach(() => { globalThis.fetch = realFetch })

function req(body, { origin = 'https://trailraces.cat', host = 'trailraces.cat', ctype = 'application/json' } = {}) {
  const headers = { host }
  if (origin) headers.origin = origin
  if (ctype) headers['content-type'] = ctype
  return new Request('https://trailraces.cat/api/intent', {
    method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

test('valid same-origin JSON POST → 204 + exactly one awaited RPC call with normalized payload', async () => {
  const res = await POST(req({ provider: 'claude', goal_text: 'scenic', chips: ['chase-pb', 'bogus'], filters: { province: ['GIRONA'], bad: 1 } }))
  assert.equal(res.status, 204)
  assert.equal(calls.length, 1)
  assert.match(calls[0].u, /\/rest\/v1\/rpc\/log_intent$/)
  const sent = JSON.parse(calls[0].opts.body)
  assert.equal(sent.p_provider, 'claude')
  assert.deepEqual(sent.p_chips, ['chase-pb'])          // bogus dropped
  assert.deepEqual(sent.p_filters, { province: ['GIRONA'] }) // junk key dropped
  assert.equal(sent.p_has_intent, true)                 // server-derived
})

test('cross-origin POST → 204 and NO RPC call', async () => {
  const res = await POST(req({ provider: 'claude' }, { origin: 'https://evil.com', host: 'trailraces.cat' }))
  assert.equal(res.status, 204)
  assert.equal(calls.length, 0)
})

test('non-JSON content-type → 204, no RPC call', async () => {
  const res = await POST(req('x', { ctype: 'text/plain' }))
  assert.equal(res.status, 204)
  assert.equal(calls.length, 0)
})

test('body over 4KB → 204, no RPC call', async () => {
  const big = JSON.stringify({ provider: 'claude', goal_text: 'x'.repeat(5000) })
  const res = await POST(req(big))
  assert.equal(res.status, 204)
  assert.equal(calls.length, 0)
})

test('invalid provider → 204, no RPC call (normalize returns null)', async () => {
  const res = await POST(req({ provider: 'junk' }))
  assert.equal(res.status, 204)
  assert.equal(calls.length, 0)
})

test('RPC fetch rejection is swallowed → still 204', async () => {
  globalThis.fetch = async () => { throw new Error('network') }
  const res = await POST(req({ provider: 'copy' }))
  assert.equal(res.status, 204)
})
