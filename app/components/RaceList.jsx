'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import FilterBar from './FilterBar'
import RaceCard from './RaceCard'

const MONTH_ORDER = [
  '2026-04', '2026-05', '2026-06', '2026-07',
  '2026-08', '2026-09', '2026-10', '2026-11',
]
const MONTH_LABELS = {
  '2026-04': 'April',
  '2026-05': 'May',
  '2026-06': 'June',
  '2026-07': 'July',
  '2026-08': 'August',
  '2026-09': 'September',
  '2026-10': 'October',
  '2026-11': 'November',
  'TBD': 'Date TBD',
}

// --- URL param helpers ---

const DRIVE_VALUES = ['u60', '60-120', '120+']
const DISTANCE_VALUES = ['u10', '10-15', '15-21', '21-42', '42+']
const ELEVATION_VALUES = ['u200', '200-500', '500-1000', '1000-2000', '2000+']
const MONTH_VALUES = ['04', '05', '06', '07', '08', '09', '10', '11']
const PROVINCE_VALUES = ['BARCELONA', 'GIRONA', 'TARRAGONA', 'LLEIDA']

function filtersFromParams(sp) {
  const raw = {
    drive: sp.get('drive'),
    distance: sp.get('dist'),
    elevation: sp.get('elev'),
    month: sp.get('month'),
    province: sp.get('prov'),
    showTBD: sp.get('tbd') === '1',
    kidsRun: sp.get('kids') === '1',
  }
  return {
    drive: DRIVE_VALUES.includes(raw.drive) ? raw.drive : 'any',
    distance: DISTANCE_VALUES.includes(raw.distance) ? raw.distance : 'any',
    elevation: ELEVATION_VALUES.includes(raw.elevation) ? raw.elevation : 'any',
    month: MONTH_VALUES.includes(raw.month) ? raw.month : 'all',
    province: PROVINCE_VALUES.includes(raw.province) ? raw.province : 'all',
    showTBD: raw.showTBD,
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
  if (!race.date) return false
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
        {MONTH_LABELS[month] || month}
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
      <p style={{ fontSize: '12px', color: '#444', textAlign: 'center' }}>
        Data from ultrescatalunya.com · Drive times are estimates · Last updated {lastUpdated}
      </p>
    </div>
  )
}

export default function RaceList({ races, lastUpdated }) {
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState(() => filtersFromParams(searchParams))

  useEffect(() => {
    const qs = filtersToParams(filters)
    const url = qs ? `?${qs}` : window.location.pathname
    window.history.replaceState(null, '', url)
  }, [filters])

  const setFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }))

  const filtered = useMemo(() => {
    return races.filter(race => {
      if (!race.date && !filters.showTBD) return false
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
      const key = race.date ? race.date.slice(0, 7) : 'TBD'
      if (!groups[key]) groups[key] = []
      groups[key].push(race)
    }
    return groups
  }, [filtered])

  const monthsWithRaces = MONTH_ORDER.filter(m => grouped[m]?.length > 0)
  const hasTBD = filters.showTBD && grouped['TBD']?.length > 0

  return (
    <div style={{ backgroundColor: '#0a0a14', minHeight: '100vh', maxWidth: '680px', margin: '0 auto' }}>
      <Header total={filtered.length} />
      <FilterBar filters={filters} setFilter={setFilter} />
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
