// Slice-1 CHARACTER prep — build the model-input file for races the curated
// taste.json does NOT cover, from the durable corpus. Deterministic; no LLM here.
// Downstream: a cheap model (Haiku) turns each entry's text into an `our_read`
// character profile (taste.js shape), which extends the taste layer to uncovered
// races. We attach the seed page's url+hash so every generated claim keeps a
// source_page + page_hash (freshness anchor) even though the read is editorial.
//
// Run: deno run --allow-read --allow-write scripts/enrich-character-input.ts

const CORPUS = 'docs/enrichment/2026-batch/_corpus'
const TASTE = 'docs/enrichment/2026-batch/parsed/taste.json'
const OUT = 'docs/enrichment/2026-batch/_character-input.json'
const MAX_TEXT = 7000

type Page = { url: string; hash: string; chars: number; text: string }
type CorpusFile = { race: { race_url: string; town: string; race_name: string }; fetched_at: string; pages: Page[] }

const taste: Array<{ url?: string; town?: string }> = JSON.parse(await Deno.readTextFile(TASTE))
const covered = new Set(taste.map((t) => `${(t.url || '').trim()}::${(t.town || '').trim()}`))

const files: string[] = []
for await (const e of Deno.readDir(CORPUS)) {
  if (e.isFile && e.name.endsWith('.json') && e.name !== '_manifest.json') files.push(e.name)
}
files.sort()

const out: unknown[] = []
for (const name of files) {
  const cf: CorpusFile = JSON.parse(await Deno.readTextFile(`${CORPUS}/${name}`))
  const key = `${cf.race.race_url.trim()}::${cf.race.town.trim()}`
  if (covered.has(key)) continue // taste already has a careful profile
  const seed = cf.pages[0]
  if (!seed) continue
  // seed page first, then the rest, capped — enough for editorial character.
  let text = ''
  for (const p of cf.pages) {
    if (text.length >= MAX_TEXT) break
    text += (text ? '\n\n' : '') + p.text
  }
  out.push({
    id: name.replace(/\.json$/, ''),
    race: cf.race.race_name,
    town: cf.race.town,
    url: cf.race.race_url,
    source_page: seed.url,
    page_hash: seed.hash,
    fetched_at: cf.fetched_at,
    text: text.slice(0, MAX_TEXT),
  })
}

await Deno.writeTextFile(OUT, JSON.stringify(out, null, 0))
console.log(`character input: ${out.length} uncovered races → ${OUT}`)
