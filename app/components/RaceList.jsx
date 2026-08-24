'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import FilterBar from './FilterBar'
import RaceCard from './RaceCard'
import AskAI from './AskAI'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

// Label a "YYYY-MM" group key (or "TBD"). Includes the year so it stays
// unambiguous once the calendar spans into the next year.
function monthLabel(key) {
  if (key === 'TBD') return 'Date TBD'
  const [y, m] = key.split('-')
  return `${MONTH_NAMES[parseInt(m) - 1]} ${y}`
}

// --- URL param helpers ---

const DRIVE_VALUES = ['u60', '60-120', '120+']
const DISTANCE_VALUES = ['u10', '10-15', '15-21', '21-42', '42+']
const ELEVATION_VALUES = ['u200', '200-500', '500-1000', '1000-2000', '2000+']
// Accept any calendar month — the visible chips are derived from the data,
// but a shared URL may carry any month, so validate against all 12.
const MONTH_VALUES = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
const PROVINCE_VALUES = ['BARCELONA', 'GIRONA', 'TARRAGONA', 'LLEIDA']

const DEFAULT_FILTERS = {
  drive: 'any',
  distance: 'any',
  elevation: 'any',
  month: 'all',
  province: 'all',
  showTBD: false,
  showPast: false,
  kidsRun: false,
}

// Local calendar date (YYYY-MM-DD). Client uses the visitor's clock; the SSR
// prerender uses build time, corrected on hydration (data revalidates daily).
function todayISO() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
}

function filtersFromParams(sp) {
  const raw = {
    drive: sp.get('drive'),
    distance: sp.get('dist'),
    elevation: sp.get('elev'),
    month: sp.get('month'),
    province: sp.get('prov'),
    showTBD: sp.get('tbd') === '1',
    showPast: sp.get('past') === '1',
    kidsRun: sp.get('kids') === '1',
  }
  return {
    drive: DRIVE_VALUES.includes(raw.drive) ? raw.drive : 'any',
    distance: DISTANCE_VALUES.includes(raw.distance) ? raw.distance : 'any',
    elevation: ELEVATION_VALUES.includes(raw.elevation) ? raw.elevation : 'any',
    month: MONTH_VALUES.includes(raw.month) ? raw.month : 'all',
    province: PROVINCE_VALUES.includes(raw.province) ? raw.province : 'all',
    showTBD: raw.showTBD,
    showPast: raw.showPast,
    kidsRun: raw.kidsRun,
  }
}

function filtersToParams(filters) {
  const p = new URLSearchParams()
  if (filters.drive !== 'any') p.set('drive', filters.drive)
  if (filters.distance !== 'any') p.set('dist', filters.distance)
  if (filters.elevation !== 'any') p.set('elev', filters.elevation)
  if (filters.month !== 'all') p.set('month', filters.month)
  if (filters.province !== 'all') p.set('prov', filters.province)
  if (filters.showTBD) p.set('tbd', '1')
  if (filters.showPast) p.set('past', '1')
  if (filters.kidsRun) p.set('kids', '1')
  return p.toString()
}

// --- Filter logic ---

function matchesDrive(race, filter) {
  if (filter === 'any') return true
  if (race.driveMinutes == null) return true
  const m = race.driveMinutes
  if (filter === 'u60') return m < 60
  if (filter === '60-120') return m >= 60 && m <= 120
  if (filter === '120+') return m > 120
  return true
}

function matchesDistance(race, filter) {
  if (filter === 'any') return true
  if (!race.distances.length) return true
  return race.distances.some(d => {
    const km = d.km
    if (filter === 'u10') return km < 10
    if (filter === '10-15') return km >= 10 && km <= 15
    if (filter === '15-21') return km > 15 && km <= 21
    if (filter === '21-42') return km > 21 && km <= 42
    if (filter === '42+') return km > 42
    return true
  })
}

function matchesElevation(race, filter) {
  if (filter === 'any') return true
  if (!race.distances.length) return true
  const hasAnyElev = race.distances.some(d => d.elevationGain != null)
  if (!hasAnyElev) return true
  return race.distances.some(d => {
    const e = d.elevationGain
    if (e == null) return false
    if (filter === 'u200') return e < 200
    if (filter === '200-500') return e >= 200 && e < 500
    if (filter === '500-1000') return e >= 500 && e < 1000
    if (filter === '1000-2000') return e >= 1000 && e < 2000
    if (filter === '2000+') return e >= 2000
    return true
  })
}

function matchesMonth(race, filter) {
  if (filter === 'all') return true
  // A race whose month is known but whose day is not still belongs in that
  // month's results — otherwise 91 events are invisible to every month search.
  // The card labels it "(expected)"; this only decides membership.
  if (!race.date) {
    return race.expectedMonth != null && String(race.expectedMonth).padStart(2, '0') === filter
  }
  return race.date.slice(5, 7) === filter
}

function matchesProvince(race, filter) {
  if (filter === 'all') return true
  return race.province === filter
}

// --- Components ---

function MonthHeader({ month, count }) {
  return (
    <div style={{
      padding: '10px 16px 6px',
      display: 'flex',
      alignItems: 'baseline',
      gap: '8px',
      backgroundColor: '#0a0a14',
      borderBottom: '1px solid #1a1a2e',
    }}>
      <span style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {monthLabel(month)}
      </span>
      <span style={{ fontSize: '12px', color: '#555', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
        {count} {count === 1 ? 'race' : 'races'}
      </span>
    </div>
  )
}

function Header({ total }) {
  return (
    <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #1a1a2e' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.01em' }}>
          Trail Catalunya 2026
        </h1>
        <span style={{ fontSize: '13px', color: '#555', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
          {total} races
        </span>
      </div>
      <p style={{ fontSize: '12px', color: '#555', marginTop: '3px' }}>
        Drive times from Plaça Glòries, Barcelona (estimated)
      </p>
    </div>
  )
}

function Footer({ lastUpdated }) {
  return (
    <div style={{ padding: '20px 16px', borderTop: '1px solid #1a1a2e', marginTop: '8px' }}>
      <p style={{ fontSize: '12px', color: '#666', textAlign: 'center', marginBottom: '8px' }}>
        <a href="/about" style={{ textDecoration: 'underline' }}>Why I built this</a>
        {' · '}
        <a href="/for-agents" style={{ textDecoration: 'underline' }}>For AI agents</a>
      </p>
      <p style={{ fontSize: '12px', color: '#444', textAlign: 'center' }}>
        Data from ultrescatalunya.com · Drive times are estimates · Last updated {lastUpdated}
      </p>
    </div>
  )
}

export default function RaceList({ races, lastUpdated }) {
  // Filters start at defaults and shared-link URL params are read AFTER mount.
  // Deliberate: useSearchParams in the render path forces a client-side-render
  // bailout, which made the server HTML empty — invisible to crawlers. With
  // defaults, the full race list prerenders as real HTML (SEO), at the cost of
  // a one-frame flash for visitors arriving via a shared filter link.
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const skipFirstUrlWrite = useRef(true)

  useEffect(() => {
    const fromUrl = filtersFromParams(new URLSearchParams(window.location.search))
    if (filtersToParams(fromUrl)) setFilters(fromUrl)
  }, [])

  useEffect(() => {
    // Skip the mount run so we never clobber a shared link's params before
    // the read-effect above has applied them.
    if (skipFirstUrlWrite.current) {
      skipFirstUrlWrite.current = false
      return
    }
    const qs = filtersToParams(filters)
    const url = qs ? `?${qs}` : window.location.pathname
    window.history.replaceState(null, '', url)
  }, [filters])

  const setFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }))

  const filtered = useMemo(() => {
    const today = todayISO()
    return races.filter(race => {
      // A race whose month is known is NOT "date TBD" — it belongs in that
      // month, labelled "(expected)". Only a race with no month at all (the
      // source disagreeing with itself, per R6's agreement gate) stays behind
      // the Show-TBD toggle.
      if (!race.date && race.expectedMonth == null && !filters.showTBD) return false
      // Hide finished races by default (use dateEnd so a multi-day race stays
      // visible through its last day); "Show past" brings them back.
      if (race.date && !filters.showPast && (race.dateEnd || race.date) < today) return false
      if (filters.kidsRun && !race.kidsRun) return false
      return (
        matchesDrive(race, filters.drive) &&
        matchesDistance(race, filters.distance) &&
        matchesElevation(race, filters.elevation) &&
        matchesMonth(race, filters.month) &&
        matchesProvince(race, filters.province)
      )
    })
  }, [races, filters])

  const grouped = useMemo(() => {
    const groups = {}
    for (const race of filtered) {
      const key = race.date
        ? race.date.slice(0, 7)
        : race.expectedMonth != null
          ? `${race.expectedYear}-${String(race.expectedMonth).padStart(2, '0')}`
          : 'TBD'
      if (!groups[key]) groups[key] = []
      groups[key].push(race)
    }
    return groups
  }, [filtered])

  // Group order derived from the data: every dated month present, sorted
  // chronologically (YYYY-MM sorts lexically). No month can silently drop.
  const monthsWithRaces = Object.keys(grouped).filter(m => m !== 'TBD').sort()
  const hasTBD = filters.showTBD && grouped['TBD']?.length > 0

  // Month filter chips reflect the months actually present in the full
  // dataset, so December / next-year races appear automatically once dated.
  const monthOptions = useMemo(() => {
    const months = new Set()
    for (const race of races) {
      if (race.date) months.add(race.date.slice(5, 7))
      // A race with only a source-published month must be selectable too, or a
      // future expected-only month has races that no chip can reach (audit #6).
      else if (race.expectedMonth != null) months.add(String(race.expectedMonth).padStart(2, '0'))
    }
    const opts = [...months].sort().map(m => ({ value: m, label: MONTH_NAMES_SHORT[parseInt(m) - 1] }))
    return [{ value: 'all', label: 'All' }, ...opts]
  }, [races])

  return (
    <div style={{ backgroundColor: '#0a0a14', minHeight: '100vh', maxWidth: '680px', margin: '0 auto' }}>
      <Header total={filtered.length} />
      <FilterBar filters={filters} setFilter={setFilter} monthOptions={monthOptions} />
      <AskAI filteredRaces={filtered} filters={filters} />
      <main>
        {monthsWithRaces.map(month => (
          <div key={month}>
            <MonthHeader month={month} count={grouped[month].length} />
            {grouped[month].map(race => (
              <RaceCard key={race.id} race={race} />
            ))}
          </div>
        ))}
        {hasTBD && (
          <div>
            <MonthHeader month="TBD" count={grouped['TBD'].length} />
            {grouped['TBD'].map(race => (
              <RaceCard key={race.id} race={race} />
            ))}
          </div>
        )}
        {filtered.length === 0 && (
          <div style={{ padding: '48px 16px', textAlign: 'center', color: '#555' }}>
            No races match your filters.
          </div>
        )}
      </main>
      <Footer lastUpdated={lastUpdated} />
    </div>
  )
}
