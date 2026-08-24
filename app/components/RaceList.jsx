'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import FilterBar from './FilterBar'
import RaceCard from './RaceCard'
import AskAI from './AskAI'
import {
  DEFAULT_FILTERS, filtersFromParams, filtersToParams,
  matchesDrive, matchesDistance, matchesElevation, matchesMonth, matchesProvince,
  matchesDifficulty,
} from '../lib/filters.js'
import { eventKmEffort, difficultyLevel } from '../lib/format.js'
import { verdictFor } from '../lib/semantics.js'

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

// Local calendar date (YYYY-MM-DD). Client uses the visitor's clock; the SSR
// prerender uses build time, corrected on hydration (data revalidates daily).
function todayISO() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
}

function addDaysISO(iso, days) {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d + days)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

// URL <-> filter round-trip and the OR-within-row matchers live in
// ../lib/filters.js (pure, unit-tested).

// --- Components ---

function SectionHeader({ label, count }) {
  return (
    <div style={{
      padding: '12px 16px 6px',
      display: 'flex',
      alignItems: 'baseline',
      gap: '8px',
      backgroundColor: 'var(--fdr-canvas)',
      borderBottom: '1px solid var(--fdr-border)',
    }}>
      <span className="fdr-mono" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--fdr-ink)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
        {label}
      </span>
      {count != null && (
        <span className="fdr-mono" style={{ fontSize: '11.5px', color: 'var(--fdr-ink-faint)' }}>
          {count} {count === 1 ? 'race' : 'races'}
        </span>
      )}
    </div>
  )
}

function Header({ total }) {
  return (
    <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--fdr-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '10px' }}>
        <h1 style={{ fontSize: '21px', fontWeight: 700, color: 'var(--fdr-ink)', letterSpacing: '-0.01em' }}>
          Find the race that fits
        </h1>
        <span className="fdr-mono" style={{ fontSize: '12.5px', color: 'var(--fdr-ink-faint)', whiteSpace: 'nowrap' }}>
          {total} races
        </span>
      </div>
      <p style={{ fontSize: '13px', color: 'var(--fdr-ink-muted)', marginTop: '4px', maxWidth: '60ch' }}>
        Every trail race in Catalunya — with drive times from Barcelona, honest difficulty, and AI that knows them all.
      </p>
    </div>
  )
}

function Footer({ lastUpdated }) {
  return (
    <div style={{ padding: '20px 16px', borderTop: '1px solid var(--fdr-border)', marginTop: '8px' }}>
      <p style={{ fontSize: '12px', color: 'var(--fdr-ink-muted)', textAlign: 'center', marginBottom: '8px' }}>
        <a href="/about" style={{ textDecoration: 'underline', color: 'inherit' }}>Why I built this</a>
        {' · '}
        <a href="/for-agents" style={{ textDecoration: 'underline', color: 'inherit' }}>For AI agents</a>
      </p>
      <p style={{ fontSize: '12px', color: 'var(--fdr-ink-faint)', textAlign: 'center' }}>
        Data from ultrescatalunya.com · Drive times from Plaça Glòries, Barcelona (estimated) · Last updated {lastUpdated}
      </p>
    </div>
  )
}

// One highlighted result once the user has spoken: deterministic (nearest
// drive, then earliest date), and honestly labelled as exactly that — never
// "our pick" (decision log: no picks before input; label how it was chosen).
function ClosestMatch({ race }) {
  const verdict = verdictFor(race)
  return (
    <div style={{ padding: '12px 16px 4px', backgroundColor: 'var(--fdr-canvas)' }}>
      <div style={{ border: '1px solid var(--fdr-action)', borderRadius: 'var(--fdr-radius-md)', overflow: 'hidden', background: 'var(--fdr-surface)' }}>
        <div className="fdr-mono" style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--fdr-action)', padding: '8px 16px 0' }}>
          ★ Closest match to your filters
        </div>
        <RaceCard race={race} />
        {!verdict && (
          <div style={{ fontSize: '11px', color: 'var(--fdr-ink-faint)', padding: '0 16px 10px' }}>
            Chosen as the shortest drive among your matches.
          </div>
        )}
      </div>
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
        matchesDifficulty(race, filters.difficulty, difficultyLevel(eventKmEffort(race.distances))) &&
        matchesMonth(race, filters.month) &&
        matchesProvince(race, filters.province)
      )
    })
  }, [races, filters])

  // Any URL-serializable state counts as "the user has spoken".
  const hasInput = filtersToParams(filters) !== ''

  // Deterministic orientation for the cold page: dated races in the next 14
  // days. It duplicates entries from the calendar below on purpose — this is
  // a horizon, the calendar stays complete. Hidden once any filter is active.
  const horizon = useMemo(() => {
    if (hasInput) return []
    const today = todayISO()
    const limit = addDaysISO(today, 13)
    return races
      .filter(r => r.date && (r.dateEnd || r.date) >= today && r.date <= limit)
      .sort((a, b) => a.date === b.date
        ? (a.driveMinutes ?? 9999) - (b.driveMinutes ?? 9999)
        : a.date < b.date ? -1 : 1)
  }, [races, hasInput])

  // The one highlighted result after input: nearest drive, then earliest
  // date; unknown drive sorts last. Deterministic, labelled in the UI.
  const closest = useMemo(() => {
    if (!hasInput || filtered.length === 0) return null
    return [...filtered].sort((a, b) => {
      const da = a.driveMinutes ?? 9999
      const db = b.driveMinutes ?? 9999
      if (da !== db) return da - db
      return (a.date || '9999') < (b.date || '9999') ? -1 : 1
    })[0]
  }, [filtered, hasInput])

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
    <div style={{ backgroundColor: 'var(--fdr-canvas)', minHeight: '100vh', maxWidth: '680px', margin: '0 auto', borderLeft: '1px solid var(--fdr-border)', borderRight: '1px solid var(--fdr-border)' }}>
      <Header total={filtered.length} />
      <FilterBar filters={filters} setFilter={setFilter} monthOptions={monthOptions} />
      <AskAI filteredRaces={filtered} filters={filters} />
      <main>
        {closest && <ClosestMatch race={closest} />}
        {horizon.length > 0 && (
          <div>
            <SectionHeader label="Next two weekends" count={horizon.length} />
            {horizon.map(race => (
              <RaceCard key={`h-${race.id}`} race={race} />
            ))}
          </div>
        )}
        {monthsWithRaces.map(month => (
          <div key={month}>
            <SectionHeader label={monthLabel(month)} count={grouped[month].length} />
            {grouped[month].map(race => (
              <RaceCard key={race.id} race={race} />
            ))}
          </div>
        ))}
        {hasTBD && (
          <div>
            <SectionHeader label="Date TBD" count={grouped['TBD'].length} />
            {grouped['TBD'].map(race => (
              <RaceCard key={race.id} race={race} />
            ))}
          </div>
        )}
        {filtered.length === 0 && (
          <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--fdr-ink-muted)', fontSize: '14px' }}>
            No races match these filters. Try widening the drive time.
          </div>
        )}
      </main>
      <Footer lastUpdated={lastUpdated} />
    </div>
  )
}
