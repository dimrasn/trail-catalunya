'use client'

import { useState } from 'react'
import FilterChip from './FilterChip'
import { toggleValue } from '../lib/filters.js'
import { LEVELS } from '../lib/semantics.js'

const DRIVE_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'u60', label: '< 1h' },
  { value: '60-120', label: '1–2h' },
  { value: '120+', label: '2h+' },
]

// Difficulty replaces raw D+ buckets as the visible axis — human words,
// coloured by their own level token when active (word always present).
const DIFFICULTY_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'easy', label: 'Easy', bg: LEVELS.Easy.bg, ink: LEVELS.Easy.ink },
  { value: 'moderate', label: 'Moderate', bg: LEVELS.Moderate.bg, ink: LEVELS.Moderate.ink },
  { value: 'hard', label: 'Hard', bg: LEVELS.Hard.bg, ink: LEVELS.Hard.ink },
  { value: 'vh+', label: 'V.hard+', bg: LEVELS['Very hard'].bg, ink: LEVELS['Very hard'].ink },
]

const DISTANCE_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'u10', label: '< 10 km' },
  { value: '10-15', label: '10–15 km' },
  { value: '15-21', label: '15–21 km' },
  { value: '21-42', label: '21–42 km' },
  { value: '42+', label: '42+ km' },
]

// Raw climb buckets live behind "More" — expert units, demoted not deleted.
const ELEVATION_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'u200', label: '< 200 D+' },
  { value: '200-500', label: '200–500 D+' },
  { value: '500-1000', label: '500–1000 D+' },
  { value: '1000-2000', label: '1000–2000 D+' },
  { value: '2000+', label: '2000+ D+' },
]

// Month options are passed in from RaceList, derived from the data so the
// list never drifts out of sync with which months actually have races.
const MONTH_OPTIONS_FALLBACK = [{ value: 'all', label: 'All' }]

const PROVINCE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'BARCELONA', label: 'Barcelona' },
  { value: 'GIRONA', label: 'Girona' },
  { value: 'TARRAGONA', label: 'Tarragona' },
  { value: 'LLEIDA', label: 'Lleida' },
]

// The clear-the-row sentinel chip carries one of these values. Detected by
// value, NOT by position.
const CLEAR_VALUES = new Set(['any', 'all'])

function FilterRow({ label, options, selected, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '32px' }}>
      <span className="fdr-label" style={{ minWidth: '64px', flexShrink: 0 }}>{label}</span>
      <div className="chips-row" style={{ flex: 1 }}>
        {options.map(opt => {
          const isAny = CLEAR_VALUES.has(opt.value)
          return (
            <FilterChip
              key={opt.value}
              label={opt.label}
              active={isAny ? selected.length === 0 : selected.includes(opt.value)}
              activeBg={opt.bg}
              activeInk={opt.ink}
              onClick={() => onChange(isAny ? [] : toggleValue(selected, opt.value))}
            />
          )
        })}
      </div>
    </div>
  )
}

function Toggle({ label, active, onClick }) {
  return (
    <button onClick={onClick} aria-pressed={active} style={{
      padding: '5px 12px', borderRadius: '999px', fontSize: '13px',
      border: '1px solid', borderColor: active ? 'transparent' : 'var(--fdr-border)',
      cursor: 'pointer', whiteSpace: 'nowrap',
      backgroundColor: active ? 'var(--fdr-ink)' : 'var(--fdr-surface)',
      color: active ? 'var(--fdr-ink-inverse)' : 'var(--fdr-ink-muted)',
      fontWeight: active ? '600' : '400',
    }}>
      {label}
    </button>
  )
}

export default function FilterBar({ filters, setFilter, monthOptions = MONTH_OPTIONS_FALLBACK }) {
  // Climb row is hidden by default but must surface when a shared URL
  // arrives carrying elevation filters — hidden active filters lie.
  const [showElev, setShowElev] = useState(false)
  const elevVisible = showElev || filters.elevation.length > 0

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backgroundColor: 'var(--fdr-canvas)',
        borderBottom: '1px solid var(--fdr-border)',
        padding: '10px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <FilterRow label="Drive" options={DRIVE_OPTIONS} selected={filters.drive} onChange={v => setFilter('drive', v)} />
      <FilterRow label="Difficulty" options={DIFFICULTY_OPTIONS} selected={filters.difficulty} onChange={v => setFilter('difficulty', v)} />
      <FilterRow label="Distance" options={DISTANCE_OPTIONS} selected={filters.distance} onChange={v => setFilter('distance', v)} />
      <FilterRow label="Month" options={monthOptions} selected={filters.month} onChange={v => setFilter('month', v)} />
      <FilterRow label="Province" options={PROVINCE_OPTIONS} selected={filters.province} onChange={v => setFilter('province', v)} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '2px' }}>
        <span className="fdr-label" style={{ minWidth: '64px' }}>More</span>
        <Toggle label="Kids run" active={filters.kidsRun} onClick={() => setFilter('kidsRun', !filters.kidsRun)} />
        <Toggle label="Show unscheduled" active={filters.showTBD} onClick={() => setFilter('showTBD', !filters.showTBD)} />
        <Toggle label="Show past" active={filters.showPast} onClick={() => setFilter('showPast', !filters.showPast)} />
        <Toggle label={elevVisible ? 'Climb (D+) ▴' : 'Climb (D+) ▾'} active={filters.elevation.length > 0} onClick={() => setShowElev(s => !s)} />
      </div>
      {elevVisible && (
        <FilterRow label="Climb" options={ELEVATION_OPTIONS} selected={filters.elevation} onChange={v => setFilter('elevation', v)} />
      )}
    </div>
  )
}
