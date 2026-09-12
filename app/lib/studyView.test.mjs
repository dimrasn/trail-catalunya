// Tests for the study's row/glance view-model, plus the CSS↔JS ramp parity
// guard. Run: node --test app/lib/studyView.test.mjs

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { levelBand, eventRating, driveCell, dayCell, glanceTiles } from './studyView.js'
import { LEVELS, LEVEL_ORDER } from './semantics.js'

test('levelBand: one tick per ITRA level, in scale order', () => {
  assert.equal(levelBand('Easy'), 1)
  assert.equal(levelBand('Brutal'), 6)
  assert.equal(levelBand(LEVEL_ORDER[3]), 4)
  assert.equal(levelBand('Nonsense'), null)
})

test('eventRating: rated event carries the word, the band and its anchor distance', () => {
  const r = eventRating([{ km: 28, elevationGain: 2000 }, { km: 15, elevationGain: 900 }])
  assert.equal(r.rated, true)
  // 28 + 2000/100 = 48 km-effort, which is the harder of the two variants
  assert.equal(Math.round(r.effort), 48)
  assert.equal(r.anchor.km, 28)
  assert.equal(r.band, levelBand(r.word))
})

test('eventRating: R14 — one unpublished climb makes the whole EVENT unrated', () => {
  // Not "rate the two we know about". A partial rating is a claim about a
  // course we cannot see, and the study renders six hollow ticks instead.
  const r = eventRating([{ km: 41, elevationGain: null }, { km: 22, elevationGain: 800 }])
  assert.equal(r.rated, false)
  assert.equal(r.missing, 1)
  assert.equal(r.total, 2)
  assert.equal(r.word, undefined)
})

test('eventRating: an unpublished climb is not a flat course', () => {
  // The study's sample once encoded "no published climb" as 0, which printed a
  // confident "Easy" on five events. 0 rates; null does not.
  assert.equal(eventRating([{ km: 10, elevationGain: 0 }]).rated, true)
  assert.equal(eventRating([{ km: 10, elevationGain: null }]).rated, false)
})

test('driveCell: bands carry a word, and an unknown drive claims nothing', () => {
  assert.deepEqual(driveCell(24), { known: true, band: 'near', index: 1, word: 'NEAR' })
  assert.equal(driveCell(90).word, 'MID')
  assert.equal(driveCell(200).word, 'FAR')
  assert.equal(driveCell(null).known, false)
  // boundaries, as semantics.js defines them
  assert.equal(driveCell(60).band, 'near')
  assert.equal(driveCell(61).band, 'mid')
  assert.equal(driveCell(120).band, 'mid')
  assert.equal(driveCell(121).band, 'far')
})

test('dayCell: a dated race gets its day and weekday, parsed in UTC', () => {
  // UTC matters: local parsing shifts a day across a DST boundary and would
  // print the wrong weekday for a Sunday race.
  const c = dayCell({ date: '2026-10-25' })
  assert.equal(c.dayless, false)
  assert.equal(c.day, '25')
  assert.equal(c.dow, 'Sun')
  assert.equal(c.month, 'Oct')
})

test('dayCell: a dateless race states the absence and keeps its expected month', () => {
  const c = dayCell({ date: null, expectedMonth: 9, expectedYear: 2026 })
  assert.equal(c.dayless, true)
  assert.equal(c.month, 'Sep')
  assert.equal(c.day, undefined)
  // and a race with no month at all still renders, saying nothing it cannot
  assert.equal(dayCell({ date: null, expectedMonth: null }).month, null)
})

test('glanceTiles: each tile names the race behind the number', () => {
  const races = [
    { id: 'a', name: 'A', driveMinutes: 24, distances: [{ km: 6.6, elevationGain: 200 }] },
    { id: 'b', name: 'B', driveMinutes: 102, distances: [{ km: 28, elevationGain: 2000 }, { km: 15, elevationGain: 900 }] },
  ]
  const t = glanceTiles(races)
  assert.equal(t.shortest.km, 6.6)
  assert.equal(t.shortest.race.id, 'a')
  assert.equal(t.longest.km, 28)
  assert.equal(t.nearest.id, 'a')
  assert.equal(t.highest.m, 2000)
})

test('glanceTiles: R14 — highest ascent needs a COMPLETE climb, or no tile', () => {
  // The 2000 here is real, but its event hides a distance with no published
  // climb, so it cannot be crowned the month's highest.
  const races = [
    { id: 'b', name: 'B', driveMinutes: 60, distances: [{ km: 28, elevationGain: 2000 }, { km: 15, elevationGain: null }] },
  ]
  assert.equal(glanceTiles(races).highest, null)
})

test('glanceTiles: a month with no drivable race still summarises what it can', () => {
  const races = [{ id: 'a', name: 'A', driveMinutes: null, distances: [{ km: 10, elevationGain: 300 }] }]
  const t = glanceTiles(races)
  assert.equal(t.nearest, null)
  assert.equal(t.shortest.km, 10)
})

test('glanceTiles: empty input summarises nothing rather than crashing', () => {
  assert.equal(glanceTiles([]), null)
  assert.equal(glanceTiles([{ id: 'x', distances: [] }]), null)
})

test('CSS↔JS parity: study.css --d1..--d6 restate semantics.js LEVELS exactly', () => {
  // study.css cannot import a JS module, so the six ramp colours are duplicated
  // there. This is the guard that keeps the duplicate honest: change a level in
  // semantics.js and this fails until the stylesheet follows.
  const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'study.css'), 'utf8')
  const declared = [...css.matchAll(/--d([1-6]):\s*(#[0-9A-Fa-f]{6})/g)]
    .reduce((acc, [, n, hex]) => ({ ...acc, [n]: hex.toUpperCase() }), {})

  LEVEL_ORDER.forEach((word, i) => {
    assert.equal(declared[String(i + 1)], LEVELS[word].bg.toUpperCase(),
      `study.css --d${i + 1} must equal LEVELS['${word}'].bg`)
  })
})
