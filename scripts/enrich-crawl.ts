// Local crawl of the race pages → a DURABLE, content-addressed corpus for the
// enrichment slice (plan 2026-08-25-002; Codex r3-P1-5: the corpus must be
// reproducible + provenanced). Reuses supabase/functions/enrich-races/fetch.ts.
// Publishes nothing. The corpus is git-TRACKED under docs/enrichment/2026-batch/_corpus/
// so extraction is reproducible and every fact can cite {source_url, page_hash,
// fetched_at}. The page hash is SHA-256 of the FULL cleaned text (it deliberately
// includes dates/times, so a start-time change flips the hash — the freshness anchor).
//
// Run: deno run --allow-net --allow-env --allow-read --allow-write \
//   --env-file=.env.local scripts/enrich-crawl.ts

import { fetchRacePagesWithLinks } from '../supabase/functions/enrich-races/fetch.ts'

const SUPABASE_URL = Deno.env.get('NEXT_PUBLIC_SUPABASE_URL')
const ANON = Deno.env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')
if (!SUPABASE_URL || !ANON) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY (use --env-file=.env.local)')
  Deno.exit(1)
}

const CORPUS = 'docs/enrichment/2026-batch/_corpus'
await Deno.mkdir(CORPUS, { recursive: true })

function slug(s: string): string {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60) || 'x'
}
async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const q = `${SUPABASE_URL}/rest/v1/races?select=race_url,town,race_name` +
  `&source=eq.ultrescatalunya&status=neq.REMOVED&status=neq.SUSPESA`
const rows = await (await fetch(q, { headers: { apikey: ANON, authorization: `Bearer ${ANON}` } })).json()
const byEvent = new Map<string, { race_url: string; town: string; race_name: string }>()
for (const r of rows) {
  const key = `${(r.race_url || '').trim()}::${(r.town || '').trim()}`
  if (r.race_url && !byEvent.has(key)) byEvent.set(key, r)
}
const races = [...byEvent.values()]
console.log(`crawling ${races.length} distinct races → ${CORPUS} (durable, hashed)`)

const fetchedAt = new Date().toISOString()
const manifest = { generated_at: fetchedAt, total: races.length, fetched: [] as unknown[], failed: [] as unknown[] }
let i = 0
for (const r of races) {
  i++
  const id = `${slug(r.town)}--${slug(r.race_name)}`
  try {
    const pages = await fetchRacePagesWithLinks(r.race_url)
    const good = pages.filter((p) => p.text && p.text.length >= 200)
    if (!good.length) {
      manifest.failed.push({ id, url: r.race_url, town: r.town, reason: 'empty/thin (likely JS-only)' })
    } else {
      const hashed = []
      for (const p of good) {
        hashed.push({ url: p.url, hash: await sha256(p.text), chars: p.text.length, text: p.text, links: p.links })
      }
      await Deno.writeTextFile(`${CORPUS}/${id}.json`,
        JSON.stringify({ race: r, fetched_at: fetchedAt, pages: hashed }, null, 0))
      const totalLinks = hashed.reduce((n, h) => n + h.links.length, 0)
      manifest.fetched.push({ id, source_url: r.race_url, town: r.town, links: totalLinks,
        pages: hashed.map((h) => ({ url: h.url, hash: h.hash, chars: h.chars, links: h.links.length })) })
    }
  } catch (e) {
    manifest.failed.push({ id, url: r.race_url, town: r.town, reason: String(e).slice(0, 140) })
  }
  if (i % 20 === 0) console.log(`  ${i}/${races.length} (ok ${manifest.fetched.length}, failed ${manifest.failed.length})`)
  await new Promise((res) => setTimeout(res, 400))
}
await Deno.writeTextFile(`${CORPUS}/_manifest.json`, JSON.stringify(manifest, null, 2))
console.log(`done: ${manifest.fetched.length} fetched, ${manifest.failed.length} failed → ${CORPUS}/_manifest.json`)
