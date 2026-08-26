// Slice-1 CHARACTER assembly — merge the Haiku batch outputs into a taste-shaped
// character.json that extends the taste layer (app/lib/taste.js) to uncovered races.
//
// HONESTY GUARDRAILS enforced here, not trusted to the model:
//  - EVERY generated field is forced to claim_strength 'our_read'. Never
//    organizer_fact/organizer_pdf — so tasteFlags() (organizer-only) can never turn
//    a generated line into a queryable night/technicality flag.
//  - Provenance (source_page + page_hash + fetched_at) is attached from the corpus
//    input by id, so a generated claim still carries a source + freshness anchor.
//  - `generated: true` marks the profile so nothing reads it as curated taste.
//  - A field survives only with a non-empty value; 'skip' entries are dropped.
//
// Run: deno run --allow-read --allow-write scripts/enrich-assemble-character.ts \
//        <out0.json> <out1.json> ...

const INPUT = 'docs/enrichment/2026-batch/_character-input.json'
const CORPUS = 'docs/enrichment/2026-batch/_corpus'
const OUT = 'docs/enrichment/2026-batch/parsed/character.json'
const EDITORIAL_KEYS = ['unique', 'catch', 'who', 'cool']
const ATTR_KEYS = ['setting', 'course_topology', 'food', 'season_heat']

type InputRow = { id: string; race: string; town: string; url: string; source_page: string; page_hash: string; fetched_at: string }
const inputs: InputRow[] = JSON.parse(await Deno.readTextFile(INPUT))
const byId = new Map(inputs.map((r) => [r.id, r]))

// Normalized corpus text per id — the ground truth an `evidence` quote must occur
// in verbatim. A quote the model stitched or paraphrased fails this and is dropped
// (the value stays: it is our_read editorial, never claimed as a verbatim quote).
const norm = (s: string) => s.normalize('NFC').toLowerCase().replace(/’/g, "'").replace(/\s+/g, ' ').trim()
const corpusText = new Map<string, string>()
for (const r of inputs) {
  try {
    const cf = JSON.parse(await Deno.readTextFile(`${CORPUS}/${r.id}.json`))
    corpusText.set(r.id, norm((cf.pages as Array<{ text: string }>).map((p) => p.text).join(' ')))
  } catch { /* missing corpus → no evidence verifiable for this race */ }
}

let evKept = 0, evDropped = 0
function field(raw: unknown, src: InputRow): { value: string; claim_strength: string; evidence: string | null; source_page: string; page_hash: string } | null {
  if (!raw || typeof raw !== 'object') return null
  const f = raw as Record<string, unknown>
  const value = typeof f.value === 'string' ? f.value.trim() : ''
  if (value.length < 3) return null
  let evidence: string | null = null
  const evRaw = typeof f.evidence === 'string' ? f.evidence.trim() : ''
  if (evRaw) {
    const text = corpusText.get(src.id) || ''
    if (norm(evRaw).length >= 8 && text.includes(norm(evRaw))) { evidence = evRaw; evKept++ }
    else evDropped++ // not verbatim in the page → drop the quote, keep the read
  }
  return {
    value,
    claim_strength: 'our_read', // FORCED — never trust the model to label provenance
    evidence,
    source_page: src.source_page,
    page_hash: src.page_hash,
  }
}

const profiles: unknown[] = []
let races = 0, fields = 0
for (const path of Deno.args) {
  let batch: Array<Record<string, unknown>>
  try {
    batch = JSON.parse(await Deno.readTextFile(path))
  } catch (e) {
    console.error(`skip ${path}: ${e}`)
    continue
  }
  for (const item of batch) {
    if (item.skip) continue
    const id = String(item.id || '')
    const src = byId.get(id)
    if (!src) { console.error(`no input row for id ${id}`); continue }
    const editorial: Record<string, unknown> = {}
    const attributes: Record<string, unknown> = {}
    const ed = (item.editorial || {}) as Record<string, unknown>
    for (const k of EDITORIAL_KEYS) { const f = field(ed[k], src); if (f) { editorial[k] = f; fields++ } }
    const at = (item.attributes || {}) as Record<string, unknown>
    for (const k of ATTR_KEYS) { const f = field(at[k], src); if (f) { attributes[k] = f; fields++ } }
    if (!Object.keys(editorial).length && !Object.keys(attributes).length) continue
    profiles.push({
      race: src.race,
      url: src.url,
      town: src.town,
      generated: true,
      source: 'haiku-character-2026-batch',
      fetched_at: src.fetched_at,
      editorial,
      attributes,
    })
    races++
  }
}

profiles.sort((a, b) => String((a as { url: string }).url).localeCompare(String((b as { url: string }).url)))
await Deno.writeTextFile(OUT, JSON.stringify(profiles, null, 1))
console.log(`character.json: ${races} races, ${fields} our_read fields → ${OUT}`)
console.log(`evidence quotes: ${evKept} kept (verbatim in corpus), ${evDropped} dropped (unverifiable)`)
