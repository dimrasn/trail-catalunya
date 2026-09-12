// Weekend grouping for the race list. Pure and framework-free so it can be
// unit-tested without React — mirrors app/lib/filters.js.
// Run: node --test app/lib/weekends.test.mjs
//
// WHY WEEKENDS AND NOT DAYS. Measured over the catalogue: 99% of dated races
// fall Fri–Sun, and Mon–Thu holds a single race across the whole season. A
// month grid therefore spends most of its area on days that never have a race,
// and it cannot seat a race whose day the organizer has not announced at all —
// a grid cell IS a claim about a day. Grouping by weekend states what we
// actually know about a race, which is one of three things:
//
//   an exact day        -> it belongs to that day's Fri–Sun window
//   a midweek day       -> its own rung, not bent into a weekend it is not in
//   only a month        -> the undated rung, a SIBLING of the weekends
//
// A multi-day race (dateEnd) is placed by its START date and keeps its full
// range in the card. That is also what makes stage races cheap to show
// honestly: a range is a row, where in a grid it is a span across week
// boundaries (docs/open-loops.md L8).

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const pad2 = (n) => String(n).padStart(2, '0')

// Parse 'YYYY-MM-DD' in UTC. Local-time parsing shifts the day either side of a
// DST boundary, which would move a Sunday race into the wrong weekend.
function parseIso(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function toIso(dt) {
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`
}

// The Friday that opens the Fri–Sun window containing this date, or null when
// the date is Mon–Thu.
export function weekendStart(iso) {
  const dt = parseIso(iso)
  const dow = dt.getUTCDay() // 0 = Sunday
  if (dow !== 5 && dow !== 6 && dow !== 0) return null
  const back = dow === 5 ? 0 : dow === 6 ? 1 : 2 // Fri, Sat, Sun
  return toIso(new Date(dt.getTime() - back * 86400000))
}

export function weekendLabel(fridayIso) {
  const fri = parseIso(fridayIso)
  const sun = new Date(fri.getTime() + 2 * 86400000)
  const sameMonth = fri.getUTCMonth() === sun.getUTCMonth()
  const friPart = sameMonth
    ? `Fri ${pad2(fri.getUTCDate())}`
    : `Fri ${pad2(fri.getUTCDate())} ${MONTH_SHORT[fri.getUTCMonth()]}`
  return `${friPart} – Sun ${pad2(sun.getUTCDate())} ${MONTH_SHORT[sun.getUTCMonth()]}`
}

export function dayLabel(iso) {
  const dt = parseIso(iso)
  return `${WEEKDAY_SHORT[dt.getUTCDay()]} ${pad2(dt.getUTCDate())} ${MONTH_SHORT[dt.getUTCMonth()]}`
}

// Group a month's races into rungs. Input order is preserved within a rung, so
// the caller's sort (date, then whatever it likes) still holds.
//
// Returns [{ key, kind, label, races }] with weekends and midweek days in date
// order and the undated rung last — it has no date to sort by, and putting it
// anywhere else would imply one.
export function groupIntoRungs(races) {
  const rungs = new Map()

  for (const race of races || []) {
    let key
    let kind
    let sortKey
    let label

    if (!race.date) {
      key = 'undated'
      kind = 'undated'
      sortKey = '9999-99-99'
      label = 'Date not announced'
    } else {
      const friday = weekendStart(race.date)
      if (friday) {
        key = `we-${friday}`
        kind = 'weekend'
        sortKey = friday
        label = weekendLabel(friday)
      } else {
        key = `day-${race.date}`
        kind = 'midweek'
        sortKey = race.date
        label = dayLabel(race.date)
      }
    }

    if (!rungs.has(key)) rungs.set(key, { key, kind, label, sortKey, races: [] })
    rungs.get(key).races.push(race)
  }

  return [...rungs.values()]
    .sort((a, b) => (a.sortKey < b.sortKey ? -1 : a.sortKey > b.sortKey ? 1 : 0))
    .map(({ sortKey, ...rung }) => rung)
}
