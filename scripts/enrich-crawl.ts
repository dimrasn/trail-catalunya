// Local crawl of the race pages for the enrichment batch (plan 2026-08-25-002, U3).
// Reuses supabase/functions/enrich-races/fetch.ts (SSRF-guarded fetch + clean +
// sub-page discovery). Publishes NOTHING — it only caches page text + a manifest.
// The cache dir is git-ignored; only the manifest is committed.
//
// Run: deno run --allow-net --allow-env --allow-read --allow-write \
//   --env-file=.env.local scripts/enrich-crawl.ts

import { fetchRacePages } from '../supabase/functions/enrich-races/fetch.ts'

const SUPABASE_URL = Deno.env.get('NEXT_PUBLIC_SUPABASE_URL')
const ANON = Deno.env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')
if (!SUPABASE_URL || !ANON) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY (use --env-file=.env.local)')
  Deno.exit(1)
}

const CACHE = 'docs/enrichment/2026-batch/_crawl'
await Deno.mkdir(CACHE, { recursive: true })

function slug(s: string): string {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60) || 'x'
}

// Distinct races (url::town), like the site/MCP grouping.
const q = `${SUPABASE_URL}/rest/v1/races?select=race_url,town,race_name` +
  `&source=eq.ultrescatalunya&status=neq.REMOVED&status=neq.SUSPESA`
const rows = await (await fetch(q, { headers: { apikey: ANON, authorization: `Bearer ${ANON}` } })).json()
const byEvent = new Map<string, { race_url: string; town: string; race_name: string }>()
for (const r of rows) {
  const key = `${(r.race_url || '').trim()}::${(r.town || '').trim()}`
  if (r.race_url && !byEvent.has(key)) byEvent.set(key, r)
}
const races = [...byEvent.values()]
console.log(`crawling ${races.length} distinct races → ${CACHE}`)

const manifest = { started_at: new Date().toISOString(), total: races.length, fetched: [] as unknown[], failed: [] as unknown[] }
let i = 0
for (const r of races) {
  i++
  const id = `${slug(r.town)}--${slug(r.race_name)}`
  try {
    const pages = await fetchRacePages(r.race_url)
    if (!pages.length || pages.every((p) => !p.text || p.text.length < 200)) {
      manifest.failed.push({ url: r.race_url, town: r.town, reason: 'empty/thin (likely JS-only)' })
    } else {
      await Deno.writeTextFile(`${CACHE}/${id}.json`, JSON.stringify({ race: r, pages }, null, 0))
      manifest.fetched.push({ id, url: r.race_url, town: r.town, pages: pages.length })
    }
  } catch (e) {
    manifest.failed.push({ url: r.race_url, town: r.town, reason: String(e).slice(0, 140) })
  }
  if (i % 20 === 0) console.log(`  ${i}/${races.length} (ok ${manifest.fetched.length}, failed ${manifest.failed.length})`)
  await new Promise((res) => setTimeout(res, 400)) // polite delay
}
await Deno.writeTextFile(`${CACHE}/_manifest.json`, JSON.stringify(manifest, null, 2))
console.log(`done: ${manifest.fetched.length} fetched, ${manifest.failed.length} failed → ${CACHE}/_manifest.json`)
