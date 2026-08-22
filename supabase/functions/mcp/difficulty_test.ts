// Tests for the MCP difficulty + variant-matching helpers. Mirrors the site's
// app/lib/format.test.mjs case-for-case (the parity guard) and adds the
// filtered-search / same-variant cases the site doesn't have.
// Run: deno test supabase/functions/mcp/difficulty_test.ts

import { assert, assertEquals } from 'jsr:@std/assert@1'
import {
  difficultyLevel, distanceMatches, dPlusPerKm, eventKmEffort, hasVariantFilter, itraPoints, kmEffort,
} from './difficulty.ts'

Deno.test('kmEffort: missing inputs → null, never zero-climb', () => {
  assertEquals(kmEffort({ km: 42 }), null)
  assertEquals(kmEffort({ km: 42, elevationGain: null }), null)
})

Deno.test('kmEffort: 21.4 + 1090/100 → 32.3; 100 + 6600/100 → 166', () => {
  assertEquals(kmEffort({ km: 21.4, elevationGain: 1090 }), 32.3)
  assertEquals(kmEffort({ km: 100, elevationGain: 6600 }), 166)
})

Deno.test('itraPoints: exact ITRA table boundaries (0-24→0 … 210+→6)', () => {
  assertEquals(itraPoints(24), 0)
  assertEquals(itraPoints(25), 1)
  assertEquals(itraPoints(44), 1)
  assertEquals(itraPoints(45), 2)
  assertEquals(itraPoints(74), 2)
  assertEquals(itraPoints(75), 3)
  assertEquals(itraPoints(114), 3)
  assertEquals(itraPoints(115), 4)
  assertEquals(itraPoints(154), 4)
  assertEquals(itraPoints(155), 5)
  assertEquals(itraPoints(209), 5)
  assertEquals(itraPoints(210), 6)
  assertEquals(itraPoints(null), null)
})

Deno.test('difficultyLevel: 6-level words on ITRA boundaries (4+5 merged to Extreme)', () => {
  assertEquals(difficultyLevel(24), 'Easy')
  assertEquals(difficultyLevel(25), 'Moderate')
  assertEquals(difficultyLevel(45), 'Hard')
  assertEquals(difficultyLevel(75), 'Very hard')
  assertEquals(difficultyLevel(115), 'Extreme')
  assertEquals(difficultyLevel(209), 'Extreme')
  assertEquals(difficultyLevel(210), 'Brutal')
  assertEquals(difficultyLevel(null), null)
})

Deno.test('dPlusPerKm: rounds D+/km; null when either input missing', () => {
  assertEquals(dPlusPerKm({ km: 50, elevationGain: 2500 }), 50)
  assertEquals(dPlusPerKm({ km: 21.4, elevationGain: 1090 }), 51)
  assertEquals(dPlusPerKm({ km: 42 }), null)
  assertEquals(dPlusPerKm({ km: 0, elevationGain: 500 }), null)
})

Deno.test('eventKmEffort: partial event → null (Cursa de l\'Alba shape)', () => {
  assertEquals(eventKmEffort([
    { km: 42 },
    { km: 22, elevationGain: 1200 },
    { km: 12, elevationGain: 600 },
  ]), null)
})

Deno.test('eventKmEffort: complete Ultra-Pirineu-shape → 166', () => {
  const ds = [
    { km: 100, elevationGain: 6600 },
    { km: 42, elevationGain: 2800 },
    { km: 21, elevationGain: 1450 },
    { km: 5, elevationGain: 860 },
  ]
  assertEquals(eventKmEffort(ds), 166)
  assertEquals(ds.map(kmEffort), [166, 70, 35.5, 13.6])
})

Deno.test('distanceMatches: dist_max:10 keeps the 5k, rejects the 100k', () => {
  assert(distanceMatches({ km: 5, elevationGain: 860 }, { dist_max: 10 }))
  assert(!distanceMatches({ km: 100, elevationGain: 6600 }, { dist_max: 10 }))
})

Deno.test('distanceMatches: same variant must satisfy BOTH dist and elev', () => {
  const short = { km: 5, elevationGain: 200 }
  const long = { km: 20, elevationGain: 1500 }
  // Neither single variant satisfies dist_max:10 AND elev_min:1000.
  assert(!distanceMatches(short, { dist_max: 10, elev_min: 1000 }))
  assert(!distanceMatches(long, { dist_max: 10, elev_min: 1000 }))
  // Widen the distance bound and the long variant satisfies both.
  assert(distanceMatches(long, { dist_max: 25, elev_min: 1000 }))
})

Deno.test('distanceMatches: elevation predicate fails a distance with unknown D+', () => {
  assert(!distanceMatches({ km: 20 }, { elev_min: 500 }))
})

Deno.test('hasVariantFilter reflects the distance/elevation predicates only', () => {
  assert(hasVariantFilter({ dist_max: 10 }))
  assert(hasVariantFilter({ elev_min: 500 }))
  assert(!hasVariantFilter({ drive_max: 60, month: 10 }))
})
