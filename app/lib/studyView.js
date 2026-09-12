// Pure view-model for the design study's race row and glance panel.
//
// The study's markup asks questions the app's data layer does not answer
// directly: which of the six ticks are filled, which distance the rating is
// anchored to, whether the day cell shows a number or states its absence.
// Those derivations live here rather than in JSX so they can be tested — the
// study itself computed them inline in a <script>, which is exactly why its
// unrated and dayless cases went unverified for so long.
//
// Everything here READS the existing semantics; it defines no new ones.
// Difficulty comes from format.js (ITRA km-effort), drive bands from
// semantics.js. Run: node --test app/lib/studyView.test.mjs

import { eventKmEffort, kmEffort, difficultyLevel, MONTHS_SHORT, WEEKDAYS } from './format.js'
import { LEVEL_ORDER, driveBand } from './semantics.js'

// 1-based tick index, matching the study's .g1….g6 classes. Six ticks, one per
// ITRA level, so the level is carried by HOW MANY are filled and colour is only
// ever reinforcement (the study's note on LEVELS).
export function levelBand(levelWord) {
  const i = LEVEL_ORDER.indexOf(levelWord)
  return i === -1 ? null : i + 1
}

// The event's rating, plus the distance it is anchored to — the study prints
// "for 28 km ↑2000" under the word, so the anchor has to come back with it.
//
// R14: null when ANY distance lacks a published climb. The event is then
// UNRATED, not zero — six hollow ticks and "climb not published", never a word.
export function eventRating(distances) {
  const effort = eventKmEffort(distances)
  if (effort == null) {
    const missing = (distances || []).filter(d => d.elevationGain == null).length
    return { rated: false, missing, total: (distances || []).length }
  }
  const word = difficultyLevel(effort)
  // The anchor is the hardest variant, which is what eventKmEffort maxed over.
  let anchor = null
  let best = -Infinity
  for (const d of distances) {
    const e = kmEffort(d)
    if (e != null && e > best) { best = e; anchor = d }
  }
  return { rated: true, effort, word, band: levelBand(word), anchor }
}

export const DRIVE_WORD = { near: 'NEAR', mid: 'MID', far: 'FAR' }
const DRIVE_INDEX = { near: 1, mid: 2, far: 3 }

// The study colours the drive TIME by band and always prints the band word
// beside it, so the colour is never the only channel (Dima 2026-08-24).
export function driveCell(minutes) {
  const band = driveBand(minutes)
  if (!band) return { known: false }
  return { known: true, band, index: DRIVE_INDEX[band], word: DRIVE_WORD[band] }
}

// The day cell. A race with no exact date does NOT get a number: the study
// prints ∗ and the month, because the month is real source evidence and the day
// simply does not exist yet (R6).
export function dayCell(race) {
  if (!race.date) {
    return {
      dayless: true,
      month: race.expectedMonth != null ? MONTHS_SHORT[race.expectedMonth - 1] : null,
    }
  }
  const [y, m, d] = race.date.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return {
    dayless: false,
    day: String(d).padStart(2, '0'),
    dow: WEEKDAYS[dt.getUTCDay()],
    month: MONTHS_SHORT[m - 1],
  }
}

// Glance tiles for one month's surviving races. Every tile names the race it
// came from, so a number on the page can always be traced to a row in the list.
//
// HIGHEST ASCENT is complete-data-only (R14): if no race this month publishes a
// climb for every distance, the tile says so rather than crowning the highest
// KNOWN figure, which would be a maximum over a population we cannot see all of.
export function glanceTiles(races) {
  if (!races || races.length === 0) return null

  const withKm = races.filter(r => r.distances?.length)
  if (!withKm.length) return null

  let shortest = null; let longest = null
  for (const r of withKm) {
    for (const d of r.distances) {
      if (d.km == null) continue
      if (!shortest || d.km < shortest.km) shortest = { km: d.km, race: r }
      if (!longest || d.km > longest.km) longest = { km: d.km, race: r }
    }
  }

  const drivable = races.filter(r => r.driveMinutes != null)
  const nearest = drivable.length
    ? drivable.reduce((a, r) => (r.driveMinutes < a.driveMinutes ? r : a))
    : null

  const complete = races.filter(r =>
    r.distances?.length && r.distances.every(d => d.elevationGain != null))
  let highest = null
  for (const r of complete) {
    const max = Math.max(...r.distances.map(d => d.elevationGain))
    if (!highest || max > highest.m) highest = { m: max, race: r }
  }

  return { shortest, longest, nearest, highest }
}
