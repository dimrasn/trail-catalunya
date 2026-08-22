#!/usr/bin/env node
// U1 — deterministic taste-layer generator (plan v3, KTD2-7).
// Parses docs/enrichment/2026-batch/chunk-*.md → parsed/taste.json. The corpus
// has 5+ inconsistent formats; this normalizes them, maps the messy tag
// vocabulary (taste-fields.md) to claim_strength, omits unknown sentinels,
// recovers leading-tag values, forces editorial to our-read, flags prior-edition
// profiles, excludes fix-list stubs precisely, sanitizes evidence, and routes
// anything unconfident to the exceptions report. Run: node scripts/build-taste.mjs

import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const BATCH = join(ROOT, 'docs/enrichment/2026-batch')
const OUT = join(BATCH, 'parsed')
const EVIDENCE_CAP = 300

const STRENGTH_ORDER = ['organizer_fact', 'derived', 'our_read', 'inference']
const OMIT = 'OMIT'
// geo is a geographic derivation, not an organizer statement (audit #6).
const TAG_ATOMS = new Map([
  ['scrape', 'organizer_fact'], ['scraped', 'organizer_fact'], ['site', 'organizer_fact'],
  ['source', 'organizer_fact'], ['stated', 'organizer_fact'],
  ['geo', 'derived'], ['derived', 'derived'],
  ['editorial', 'our_read'], ['infer', 'inference'], ['inference', 'inference'],
  ['unknown', OMIT], ['absent', OMIT], ['blocked', OMIT],
])
const UNKNOWN_VALUES = new Set(['unknown', 'not stated', 'cannot compute', 'n/a', 'na', 'none stated', 'none', ''])
// (or begins with) a sentinel — trailing text/parens don't make an unknown a fact.
function isUnknownValue(v) {
  const s = String(v).toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim()
  if (UNKNOWN_VALUES.has(s)) return true
  return /^(unknown|not stated|cannot compute|n\/a|none stated|tbd|tba|none mentioned|not mentioned|not named|silent|no .{0,20}(stated|mentioned|named))\b/.test(s)
}

function normalizeTag(raw) {
  let review_flag = false
  let t = String(raw).trim()
  const colon = t.indexOf(':')
  if (colon !== -1) t = t.slice(0, colon)
  t = t.toLowerCase().trim()
  if (t.includes('conflict-risk') || t.includes('flag')) review_flag = true
  if (t.includes('unknown') || t.includes('absent') || t.includes('blocked')) return { omit: true }
  const parts = t.split(/[/,+]/).map((p) => p.trim()).filter(Boolean)
  const mapped = []
  for (const p of parts) {
    const key = [...TAG_ATOMS.keys()].find((k) => p === k || p.startsWith(k))
    if (key) mapped.push(TAG_ATOMS.get(key))
  }
  const real = mapped.filter((m) => m !== OMIT)
  if (real.length === 0) return mapped.length ? { omit: true } : { unmapped: true }
  const weakest = real.reduce((a, b) => (STRENGTH_ORDER.indexOf(b) > STRENGTH_ORDER.indexOf(a) ? b : a))
  return { strength: weakest, review_flag }
}

const KEY_MAP = new Map([
  ['night race', 'night_race'], ['night-race', 'night_race'], ['night race?', 'night_race'], ['night-race?', 'night_race'], ['night_race', 'night_race'],
  ['start time of day', 'start_time'], ['start_time_of_day', 'start_time'], ['start time', 'start_time'], ['start_time', 'start_time'], ['start times', 'start_time'],
  ['course topology', 'course_topology'], ['course_topology', 'course_topology'], ['topology', 'course_topology'],
  ['setting character', 'setting'], ['setting/character', 'setting'], ['setting', 'setting'], ['character', 'setting'], ['setting tags', 'setting'],
  ['championship circuit', 'championship'], ['championship/circuit', 'championship'], ['championship', 'championship'],
  ['cutoffs', 'cutoffs'], ['cutoff', 'cutoffs'],
  ['aid self-sufficiency', 'aid_stations'], ['aid/self-sufficiency', 'aid_stations'], ['aid self sufficiency', 'aid_stations'], ['aid', 'aid_stations'], ['aid/cups', 'aid_stations'], ['aid cups', 'aid_stations'],
  ['start logistics parking', 'logistics_parking'], ['start logistics/parking', 'logistics_parking'], ['logistics parking', 'logistics_parking'], ['logistics/parking', 'logistics_parking'], ['parking', 'logistics_parking'], ['logistics', 'logistics_parking'], ['start logistics', 'logistics_parking'],
  ['tradition edition-count', 'tradition_editions'], ['tradition/edition-count', 'tradition_editions'], ['tradition/edition', 'tradition_editions'], ['tradition', 'tradition_editions'], ['edition-count', 'tradition_editions'], ['edition', 'tradition_editions'],
  ['post-race food', 'food'], ['post-race food / kids race', 'food'], ["post-race food / kids' race", 'food'], ['post-race food/kids', 'food'], ['food', 'food'],
  ['kids race', 'kids_race'], ["kids' race", 'kids_race'], ['kids race?', 'kids_race'], ['kids', 'kids_race'],
  ['technicality', 'technicality'], ['capacity', 'capacity'], ['price', 'price'], ['format', 'format'],
  ['feec license gate', 'feec_gate'], ['feec gate', 'feec_gate'], ['license gate', 'feec_gate'], ['feec/day-license gate', 'feec_gate'], ['feec/license gate', 'feec_gate'], ['feec/day-license', 'feec_gate'], ['feec', 'feec_gate'],
  ['season heat', 'season_heat'], ['season/heat', 'season_heat'],
])
const EDITORIAL_KEYS = new Map([
  ['unique', 'unique'], ['cool', 'cool'], ['catch', 'catch'], ['who', 'who'],
  ['reference point', 'reference_point'], ['reference', 'reference_point'], ['reference-point', 'reference_point'],
])
// Header fields (parsed separately) + numeric fields already in the races table.
const SKIP_LABELS = new Set(['url', 'town', 'date', 'date/town', 'town/date'])
const DROP_LABELS = new Set(['km-esforç', 'km-esfor', 'km esforç', 'km-effort', 'distances', 'distance', 'd+', 'distance/d+', 'distances/d+'])
// High-blast operational fields — hidden at render when the profile is prior-edition (KTD5 / Trade 3).
const HIGH_BLAST = new Set(['start_time', 'cutoffs', 'logistics_parking', 'mandatory_kit'])

function normStr(s) {
  return s.toLowerCase().replace(/[’‘]/g, "'").replace(/\([^)]*\)/g, ' ')
    .replace(/\s*&\s*/g, '/').replace(/\s*\/\s*/g, '/').replace(/\s+/g, ' ').trim().replace(/[:?]+$/, '').trim()
}
const KEY_MAP_N = new Map([...KEY_MAP].map(([k, v]) => [normStr(k), v]))
const EDITORIAL_N = new Map([...EDITORIAL_KEYS].map(([k, v]) => [normStr(k), v]))
function normalizeLabel(label) {
  const l = normStr(label)
  return { key: KEY_MAP_N.get(l), editorial: EDITORIAL_N.get(l), raw: l }
}
// Strip accents/case for matching block names against the fix-list.
function normName(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
}
function sanitizeEvidence(s) {
  if (!s) return null
  let e = s.trim().replace(/^["'"'«]+|["'"'»]+$/g, '').trim().replace(/[*_`]/g, '')
  if (e.length > EVIDENCE_CAP) e = e.slice(0, EVIDENCE_CAP).trimEnd() + '…'
  return e || null
}
function fieldColon(s) {
  let depth = 0
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (c === '[') depth++
    else if (c === ']') depth = Math.max(0, depth - 1)
    else if ((c === ':' || c === '：') && depth === 0) return i
  }
  return -1
}

function parseBullet(line, loc, exceptions) {
  let raw = line.replace(/^\s*[-*]\s+/, '')
  if (!raw.trim()) return null
  raw = raw.replace(/`/g, '')
  const ci = fieldColon(raw)
  if (ci === -1) return null
  let labelPart = raw.slice(0, ci).replace(/\*/g, '').trim()
  const valuePart = raw.slice(ci + 1).trim()

  const bareLabel = labelPart.replace(/\[[^\]]*\]/g, '').trim()
  if (/^honesty/i.test(bareLabel)) return { honesty: valuePart.replace(/[*`]/g, '').trim() }

  let rawTag = null
  const lTag = labelPart.match(/\[([^\]]*)\]/)
  if (lTag) { rawTag = lTag[1]; labelPart = bareLabel }
  const vTag = valuePart.match(/\[([^\]]*)\]/)
  if (!rawTag && vTag) rawTag = vTag[1]

  const norm = normalizeLabel(labelPart)
  if (SKIP_LABELS.has(norm.raw)) return null
  if (DROP_LABELS.has(norm.raw)) return { omit: true }
  if (!norm.key && !norm.editorial) { exceptions.push({ ...loc, reason: 'unmapped_label', label: labelPart, snippet: line.trim() }); return { skip: true } }

  // Remove the tag bracket from wherever it sits (recovers leading-tag values,
  // audit #3), then split quoted evidence from the plain value.
  // Strip EVERY [tag] (compound bullets carry a second one — audit finding #5a),
  // keep intra-word hyphens (trim only leading/trailing dashes).
  let content = valuePart.replace(/\[[^\]]*\]/g, ' ').replace(/[*]/g, '').replace(/\s+/g, ' ').trim()
    .replace(/^[\s—–-]+/, '').replace(/[\s—–-]+$/, '').trim()
  let evidence = null
  const q = content.match(/"([^"]+)"|“([^”]+)”|«([^»]+)»/)
  if (q) evidence = (q[1] || q[2] || q[3]).trim()
  // Value keeps prose intact (inner quotes + hyphens preserved); only a quote
  // wrapping the WHOLE value is trimmed (leading-tag case: `[SCRAPE] "09:00"`).
  let value = content.replace(/^["“«]\s*/, '').replace(/\s*["”»]$/, '').trim()
  if (!evidence && rawTag) { const inside = rawTag.indexOf(':'); if (inside !== -1) evidence = rawTag.slice(inside + 1).replace(/^["'“«\s]+|["'”»\s]+$/g, '').trim() || null }

  if (isUnknownValue(value)) return { omit: true }

  let strength = null, review_flag = false
  if (rawTag) {
    const tag = normalizeTag(rawTag)
    if (tag.unmapped) { exceptions.push({ ...loc, reason: 'unmapped_tag', tag: rawTag, snippet: line.trim() }); return { skip: true } }
    if (tag.omit) return { omit: true }
    strength = tag.strength; review_flag = tag.review_flag
  }
  // Editorial is OUR authorship by definition; its tag cites the evidence basis,
  // not authorship. Force our_read (inference stays inference). Fixes audit #6.
  if (norm.editorial) strength = (strength === 'inference') ? 'inference' : 'our_read'
  else if (!strength) { exceptions.push({ ...loc, reason: 'no_tag', label: labelPart, snippet: line.trim() }); return { skip: true } }

  return {
    editorial: norm.editorial || null,
    key: norm.key || null,
    field: { value, claim_strength: strength, evidence: sanitizeEvidence(evidence), source_file: loc.file, source_line: loc.line, ...(review_flag ? { review_flag: true } : {}) },
  }
}

function parseHeader(blockLines) {
  const clean = blockLines.map((l) => l.text).join('\n').replace(/[*`]/g, '')
  const urlM = clean.match(/url:\s*(\S+)/i)
  if (!urlM) return null
  const url = urlM[1].replace(/[·,\s]+$/, '')
  const dateM = clean.match(/\b(20\d{2}-\d{2}-\d{2})\b/)
  const date = dateM ? dateM[1] : null
  let town = null
  const tM = clean.match(/(?:^|[^/])\btown:\s*([^·\n(]+)/i)      // "town:" but not "date/town:"
  if (tM) town = tM[1].trim()
  if (!town) {                                                    // "date/town:" OR "town / date:" (either order, spaces ok)
    const dt = clean.match(/(?:date\s*\/\s*town|town\s*\/\s*date):\s*([^\n]+)/i)
    if (dt) for (const p of dt[1].split('·').map((s) => s.trim())) { if (/20\d{2}-\d{2}-\d{2}/.test(p)) continue; const c = p.replace(/\s*\(.*\)\s*/, '').trim(); if (c) { town = c; break } }
  }
  if (!town) {                                                    // positional: url · town · date
    const hl = clean.split('\n').find((l) => /url:/i.test(l)) || ''
    for (const p of hl.split('·').map((s) => s.trim())) {
      if (/url:/i.test(p) || /^https?:/i.test(p) || /20\d{2}-\d{2}-\d{2}/.test(p)) continue
      const c = p.replace(/^(date\/town|town|date)[:：]?\s*/i, '').replace(/\s*\(.*\)\s*/, '').trim()
      if (c) { town = c; break }
    }
  }
  if (town && /^\d{1,4}[-/]\d/.test(town)) town = null            // reject date-shaped town
  return { url, town: town || null, date }
}

// Prior-edition signal: the honesty note flags a pre-2026 year tied to "edition".
function detectPriorEdition(honesty) {
  if (!honesty) return false
  const m = honesty.match(/\b(20(1\d|2[0-5]))\b[^.]{0,25}(edition|edici[oó])/i) || honesty.match(/figures? are\s+(20(1\d|2[0-5]))/i)
  return m ? parseInt(m[1]) < 2026 : false
}

// --- fix-list exclusion set (precise, by name) ---
const fixNames = new Set()
for (const line of readFileSync(join(BATCH, '_fix-list.md'), 'utf8').split('\n')) {
  const m = line.match(/^-\s+(.+?)\s+[—–-]\s/)
  if (m) fixNames.add(normName(m[1]))
}

const chunkFiles = readdirSync(BATCH).filter((f) => /^chunk-\d+\.md$/.test(f))
  .sort((a, b) => parseInt(a.match(/\d+/)) - parseInt(b.match(/\d+/)))

const profiles = []
const exceptions = []
let totalBlocks = 0, excludedFixList = 0, excludedMeta = 0, excludedEmpty = 0, noJoin = 0

for (const file of chunkFiles) {
  const lines = readFileSync(join(BATCH, file), 'utf8').split('\n')
  const blocks = []
  let cur = null
  lines.forEach((line, i) => {
    if (/^##\s+/.test(line) && !/^###/.test(line)) {
      if (cur) blocks.push(cur)
      cur = { name: line.replace(/^##\s+/, '').trim(), startLine: i + 1, lines: [] }
    } else if (cur) cur.lines.push({ text: line, n: i + 1 })
  })
  if (cur) blocks.push(cur)

  for (const b of blocks) {
    const nm = normName(b.name)
    if (/^enrichment/i.test(b.name)) continue
    if (/(honesty|summary|data gaps|data honesty|chunk summary|^notes|^data\b|^batch\b)/i.test(nm)) { excludedMeta++; continue }
    totalBlocks++
    if (fixNames.has(nm)) { excludedFixList++; continue }          // precise fix-list stub exclusion

    const header = parseHeader(b.lines)
    const profile = {
      race: b.name, url: header?.url || null, town: header?.town || null, date: header?.date || null,
      source_file: file, prior_edition: false, attributes: {}, editorial: {}, honesty: null, field_count: 0,
    }
    for (const { text, n } of b.lines) {
      if (text.includes('⚠')) continue                            // skip the warning LINE, not the block (audit #5)
      if (!/^\s*[-*]\s+/.test(text)) continue
      const r = parseBullet(text, { file, line: n, race: b.name }, exceptions)
      if (!r || r.skip || r.omit) continue
      if (r.honesty != null) { profile.honesty = r.honesty; continue }
      if (r.editorial) profile.editorial[r.editorial] = { value: r.field.value, claim_strength: r.field.claim_strength, source_line: r.field.source_line }
      else if (r.key) profile.attributes[r.key] = r.field
    }
    profile.prior_edition = detectPriorEdition(profile.honesty)
    profile.field_count = Object.keys(profile.attributes).length + Object.keys(profile.editorial).length
    if (profile.field_count === 0) { excludedEmpty++; continue }   // pure stub after ⚠-line skip
    if (!profile.url || !profile.town) { noJoin++; exceptions.push({ file, line: b.startLine, race: b.name, reason: 'missing_url_or_town' }); continue }
    profiles.push(profile)
  }
}

writeFileSync(join(OUT, 'taste.json'), JSON.stringify(profiles, null, 2) + '\n')
writeFileSync(join(OUT, 'taste-exceptions.json'), JSON.stringify(exceptions, null, 2) + '\n')
// Same artifact bundled into the MCP deploy (KTD1 — one source, two bundles).
// Minified; only the fields the MCP reads.
const mcpProfiles = profiles.map((p) => ({ url: p.url, town: p.town, attributes: p.attributes, editorial: p.editorial }))
writeFileSync(join(ROOT, 'supabase/functions/mcp/taste.json'), JSON.stringify(mcpProfiles) + '\n')

const priorEd = profiles.filter((p) => p.prior_edition).length
const byReason = {}
for (const e of exceptions) byReason[e.reason] = (byReason[e.reason] || 0) + 1
const counts = profiles.map((p) => p.field_count).sort((a, b) => a - b)
console.log(`chunks ${chunkFiles.length} | race blocks ${totalBlocks} | excluded: fixlist ${excludedFixList}, meta ${excludedMeta}, empty ${excludedEmpty}`)
console.log(`publishable profiles (url+town): ${profiles.length} | dropped no-join (logged): ${noJoin} | prior-edition flagged: ${priorEd}`)
console.log(`fields/profile — median ${counts[Math.floor(counts.length / 2)]}, min ${counts[0]}, max ${counts[counts.length - 1]}`)
console.log(`editorial-as-organizer_fact (should be 0): ${profiles.reduce((a, p) => a + Object.values(p.editorial).filter((e) => e.claim_strength === 'organizer_fact').length, 0)}`)
console.log(`exceptions: ${exceptions.length} ${JSON.stringify(byReason)}`)
