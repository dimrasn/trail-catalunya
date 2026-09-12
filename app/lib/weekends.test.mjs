import test from 'node:test'
import assert from 'node:assert/strict'
import { groupIntoRungs, weekendStart, weekendLabel, dayLabel } from './weekends.js'

const race = (id, date) => ({ id, date: date ?? null })

test('weekendStart: Fri, Sat and Sun all resolve to the same Friday', () => {
  // 2026-10-02 is a Friday
  assert.equal(weekendStart('2026-10-02'), '2026-10-02')
  assert.equal(weekendStart('2026-10-03'), '2026-10-02')
  assert.equal(weekendStart('2026-10-04'), '2026-10-02')
})

test('weekendStart: Mon–Thu are not in a weekend', () => {
  for (const d of ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08']) {
    assert.equal(weekendStart(d), null, `${d} should not open a weekend`)
  }
})

test('weekendStart: parsed in UTC, so a DST boundary cannot move a race', () => {
  // Europe/Madrid leaves DST on 2026-10-25, a Sunday. Local parsing has been
  // known to shift such a date by a day and file it under the wrong weekend.
  assert.equal(weekendStart('2026-10-25'), '2026-10-23')
  assert.equal(weekendStart('2026-03-29'), '2026-03-27') // DST starts
})

test('weekendLabel: names one month when the window sits inside it, two when it straddles', () => {
  assert.equal(weekendLabel('2026-10-02'), 'Fri 02 – Sun 04 Oct')
  // 2026-10-30 Fri → 2026-11-01 Sun
  assert.equal(weekendLabel('2026-10-30'), 'Fri 30 Oct – Sun 01 Nov')
})

test('dayLabel: a midweek race is named by its own day', () => {
  assert.equal(dayLabel('2026-10-07'), 'Wed 07 Oct')
})

test('groupIntoRungs: a weekend collects its Fri, Sat and Sun races', () => {
  const rungs = groupIntoRungs([
    race('fri', '2026-10-02'), race('sat', '2026-10-03'), race('sun', '2026-10-04'),
  ])
  assert.equal(rungs.length, 1)
  assert.equal(rungs[0].kind, 'weekend')
  assert.deepEqual(rungs[0].races.map(r => r.id), ['fri', 'sat', 'sun'])
})

test('groupIntoRungs: a midweek race gets its own rung, never folded into a weekend', () => {
  const rungs = groupIntoRungs([race('sat', '2026-10-03'), race('wed', '2026-10-07')])
  assert.deepEqual(rungs.map(r => r.kind), ['weekend', 'midweek'])
  assert.deepEqual(rungs[1].races.map(r => r.id), ['wed'])
})

test('groupIntoRungs: rungs come out in date order', () => {
  const rungs = groupIntoRungs([
    race('late', '2026-10-24'), race('early', '2026-10-03'), race('mid', '2026-10-17'),
  ])
  assert.deepEqual(rungs.map(r => r.races[0].id), ['early', 'mid', 'late'])
})

test('groupIntoRungs: the undated rung is last, and it is a rung — not a footnote', () => {
  const rungs = groupIntoRungs([
    race('tba1', null), race('sat', '2026-10-03'), race('tba2', null),
  ])
  assert.equal(rungs.length, 2)
  assert.equal(rungs[0].kind, 'weekend')
  const last = rungs[rungs.length - 1]
  assert.equal(last.kind, 'undated')
  assert.equal(last.label, 'Date not announced')
  // both undated races land together rather than one per rung
  assert.deepEqual(last.races.map(r => r.id), ['tba1', 'tba2'])
})

test('groupIntoRungs: every race lands on exactly one rung', () => {
  const input = [
    race('a', '2026-10-02'), race('b', '2026-10-03'), race('c', '2026-10-07'),
    race('d', '2026-10-17'), race('e', null), race('f', '2026-10-30'),
  ]
  const rungs = groupIntoRungs(input)
  const placed = rungs.flatMap(r => r.races.map(x => x.id))
  assert.equal(placed.length, input.length)
  assert.deepEqual([...placed].sort(), input.map(r => r.id).sort())
})

test('groupIntoRungs: a multi-day race is placed by its START date', () => {
  // L8 — Pyrenees Stage Run runs 8 days. It belongs to the weekend it starts in
  // and keeps its full range on the card; a grid would need a span across weeks.
  const stage = { id: 'stage', date: '2026-10-03', dateEnd: '2026-10-10' }
  const rungs = groupIntoRungs([stage])
  assert.equal(rungs.length, 1)
  assert.equal(rungs[0].label, 'Fri 02 – Sun 04 Oct')
  assert.equal(rungs[0].races[0].dateEnd, '2026-10-10')
})

test('groupIntoRungs: empty and null inputs are safe', () => {
  assert.deepEqual(groupIntoRungs([]), [])
  assert.deepEqual(groupIntoRungs(null), [])
})
