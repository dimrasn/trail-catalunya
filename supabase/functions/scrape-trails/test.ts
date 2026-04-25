// Tests for the scrape-trails parser.
//
// Run with: deno test --allow-read supabase/functions/scrape-trails/test.ts
//
// Parity check: the Python baseline on the same fixture was 709 rows. We
// assert the TS parser produces a count within ±5% of that, and that
// specific known-row behaviors (SUSPESA, cross-month range, comma decimal,
// etc.) come through correctly.

import { assert, assertEquals, assertAlmostEquals } from 'jsr:@std/assert@1'
import { parseCalendar, type Race } from './parser.ts'

const FIXTURE_PATH = new URL('./fixture.html', import.meta.url)
const PYTHON_BASELINE = 709
const TOLERANCE_PCT = 0.05

async function loadFixture(): Promise<string> {
  return await Deno.readTextFile(FIXTURE_PATH)
}

Deno.test('parses roughly the same number of rows as Python', async () => {
  const html = await loadFixture()
  const races = await parseCalendar(html)

  console.log(`TS parser: ${races.length} rows | Python baseline: ${PYTHON_BASELINE}`)
  const lowerBound = Math.floor(PYTHON_BASELINE * (1 - TOLERANCE_PCT))
  const upperBound = Math.ceil(PYTHON_BASELINE * (1 + TOLERANCE_PCT))
  assert(
    races.length >= lowerBound && races.length <= upperBound,
    `Row count ${races.length} outside tolerance [${lowerBound}, ${upperBound}] of Python baseline ${PYTHON_BASELINE}`,
  )
})

Deno.test('at least one SUSPESA race', async () => {
  const html = await loadFixture()
  const races = await parseCalendar(html)
  const suspesa = races.filter((r) => r.status === 'SUSPESA')
  assert(suspesa.length > 0, 'Expected at least one SUSPESA race')
  console.log(`SUSPESA count: ${suspesa.length}`)
})

Deno.test('at least one TBD race (null date)', async () => {
  const html = await loadFixture()
  const races = await parseCalendar(html)
  const tbd = races.filter((r) => r.date === null && r.status === 'ACTIVA')
  assert(tbd.length > 0, 'Expected at least one ACTIVA race with null date (TBD)')
  console.log(`TBD count: ${tbd.length}`)
})

Deno.test('at least one cross-month or same-month date range', async () => {
  const html = await loadFixture()
  const races = await parseCalendar(html)
  const ranges = races.filter((r) => /[-–]/.test(r.date_display))
  assert(ranges.length > 0, 'Expected at least one date range (multi-day event)')
  console.log(`Date-range count: ${ranges.length}; sample: ${ranges[0].date_display}`)
})

Deno.test('comma-decimal distance parsing works (e.g. 22,22km, 3,5km)', async () => {
  const html = await loadFixture()
  const races = await parseCalendar(html)

  // Look for any race with a fractional distance — that proves comma parsing
  // survived the round-trip.
  const fractional = races.filter(
    (r) => r.distance_km != null && !Number.isInteger(r.distance_km),
  )
  assert(
    fractional.length > 0,
    'Expected at least one race with a fractional distance_km (comma-decimal parse)',
  )
  console.log(
    `Fractional distances: ${fractional.length}; sample: ${fractional[0].distance_km}km (${fractional[0].distance_elevation_raw})`,
  )
})

Deno.test('elevation extracted from D+XXXm format', async () => {
  const html = await loadFixture()
  const races = await parseCalendar(html)
  const withElev = races.filter((r) => r.elevation_m != null && r.elevation_m > 0)
  assert(withElev.length > 100, `Expected >100 rows with elevation; got ${withElev.length}`)
  console.log(`Rows with elevation: ${withElev.length}`)
})

Deno.test('province is uppercased and in expected set', async () => {
  const html = await loadFixture()
  const races = await parseCalendar(html)
  const expected = new Set(['BARCELONA', 'GIRONA', 'LLEIDA', 'TARRAGONA', ''])
  const unexpected = races.filter((r) => !expected.has(r.province))
  if (unexpected.length > 0) {
    console.log(`Unexpected provinces: ${unexpected.slice(0, 5).map((r) => r.province)}`)
  }
  // Allow a small number of oddities (e.g., region names not in standard list)
  assert(unexpected.length < races.length * 0.05, 'Too many unexpected provinces')
})

Deno.test('race_hash is 12 hex chars', async () => {
  const html = await loadFixture()
  const races = await parseCalendar(html)
  for (const r of races.slice(0, 10)) {
    assertEquals(r.race_hash.length, 12, `hash length for ${r.race_name}: ${r.race_hash}`)
    assert(/^[0-9a-f]{12}$/.test(r.race_hash), `hash format for ${r.race_name}: ${r.race_hash}`)
  }
})

Deno.test('months covered include April 2026 onward', async () => {
  const html = await loadFixture()
  const races = await parseCalendar(html)
  const months = new Set(races.map((r) => r.month))
  console.log(`Months: ${Array.from(months).sort().join(', ')}`)
  assert(months.has('Abril 2026'), 'Expected Abril 2026 section')
})

Deno.test('no race has empty race_name', async () => {
  const html = await loadFixture()
  const races = await parseCalendar(html)
  const empty = races.filter((r) => !r.race_name || r.race_name.trim() === '')
  assertEquals(empty.length, 0, `${empty.length} races with empty names`)
})

Deno.test('source field populated', async () => {
  const html = await loadFixture()
  const races = await parseCalendar(html)
  for (const r of races.slice(0, 5)) {
    assertEquals(r.source, 'ultrescatalunya')
  }
})

// Hash parity with Python. These values were computed by running
// scrape_trails.py --html-file fixture.html on the same fixture. If the
// parser logic drifts, these will break — which is the intent.
Deno.test('race_hash matches Python for known rows', async () => {
  const html = await loadFixture()
  const races = await parseCalendar(html)

  const expected: Array<{ name: string; town: string; km: number; hash: string }> = [
    { name: 'Volta a Peramola', town: 'Peramola', km: 25, hash: '9408d3b7b3de' },
    { name: 'Volta a Peramola', town: 'Peramola', km: 10, hash: '41b398f3909b' },
    { name: 'Cursa de l\'Airosa', town: 'Mas de Barberans', km: 21, hash: '4c78596bb4e5' },
  ]

  for (const exp of expected) {
    const match = races.find(
      (r) => r.race_name === exp.name && r.town === exp.town && r.distance_km === exp.km,
    )
    assert(match, `Could not find row: ${exp.name} ${exp.km}km in ${exp.town}`)
    assertEquals(
      match!.race_hash,
      exp.hash,
      `hash mismatch for ${exp.name} ${exp.km}km — Python says ${exp.hash}, TS says ${match!.race_hash}`,
    )
  }
})
