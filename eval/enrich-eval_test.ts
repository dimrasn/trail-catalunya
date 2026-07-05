// Tests for U8 eval scoring (R17, R18, AE6). Scoring is pure and deterministic;
// the live extraction run is exercised separately with a real key.
// Run: deno test eval/enrich-eval_test.ts

import { assertEquals } from 'jsr:@std/assert@1'
import { type EvalEntry, type Graded, score } from './enrich-eval.ts'
import { type Confidence, type Fact, emptyFactSet } from '../supabase/functions/enrich-races/types.ts'

function fact(value: string | null, confidence: Confidence): Fact {
  return { value, confidence, evidence: null, source_url: null, edition: '2026', last_checked: null }
}

function entry(id: string, truth: Partial<Record<'start_time' | 'price' | 'confirmed_status', string | null>>): EvalEntry {
  return {
    id,
    source: 'ultrescatalunya',
    race_url: `https://${id}.cat/`,
    town: 'X',
    fixture: '',
    truth: { start_time: null, price: null, confirmed_status: null, ...truth },
  }
}

Deno.test('per-field accuracy counts correct matches', () => {
  const graded: Graded[] = [
    { entry: entry('a', { start_time: '08:00' }), facts: { ...emptyFactSet(), start_time: fact('08:00', 'high') } },
    { entry: entry('b', { start_time: '09:00' }), facts: { ...emptyFactSet(), start_time: fact('07:00', 'high') } },
  ]
  const r = score(graded)
  assertEquals(r.perField.start_time.accuracy, 0.5)
  assertEquals(r.perField.start_time.correct, 1)
})

Deno.test('null truth matched by null extraction counts as correct', () => {
  const graded: Graded[] = [
    { entry: entry('a', {}), facts: emptyFactSet() }, // truth null, extracted null
  ]
  const r = score(graded)
  assertEquals(r.perField.price.accuracy, 1)
})

Deno.test('coverage counts races with a displayable start_time or confirmed', () => {
  const graded: Graded[] = [
    { entry: entry('a', { start_time: '08:00' }), facts: { ...emptyFactSet(), start_time: fact('08:00', 'high') } },
    { entry: entry('b', {}), facts: { ...emptyFactSet(), start_time: fact('08:00', 'low') } }, // low → not displayable
    { entry: entry('c', {}), facts: emptyFactSet() }, // all unknown
  ]
  const r = score(graded)
  assertEquals(r.coverage, 1 / 3)
})

Deno.test('calibration is insufficient below the minimum sample', () => {
  const graded: Graded[] = [
    { entry: entry('a', { start_time: '08:00' }), facts: { ...emptyFactSet(), start_time: fact('08:00', 'high') } },
  ]
  const r = score(graded)
  assertEquals(r.calibration.start_time, 'insufficient')
})

Deno.test('AE6: calibration reports the high-confidence hit rate at/above min sample', () => {
  // 6 high-confidence start_time facts, 4 correct → 0.666...
  const graded: Graded[] = []
  for (let i = 0; i < 6; i++) {
    const correct = i < 4
    graded.push({
      entry: entry(`r${i}`, { start_time: '08:00' }),
      facts: { ...emptyFactSet(), start_time: fact(correct ? '08:00' : '23:59', 'high') },
    })
  }
  const r = score(graded)
  assertEquals(r.calibration.start_time, 4 / 6)
})
