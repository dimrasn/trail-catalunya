import FilterChip from './FilterChip'
import { toggleValue } from '../lib/filters.js'

const DRIVE_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'u60', label: '< 1h' },
  { value: '60-120', label: '1–2h' },
  { value: '120+', label: '2h+' },
]

const DISTANCE_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'u10', label: '< 10 km' },
  { value: '10-15', label: '10–15 km' },
  { value: '15-21', label: '15–21 km' },
  { value: '21-42', label: '21–42 km' },
  { value: '42+', label: '42+ km' },
]

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

// Multi-select row. `selected` is an array of chosen bucket values; the first
// option is the "Any / All" sentinel that clears the row. A bucket chip toggles
// its own value; the sentinel is active only when nothing is selected.
function FilterRow({ label, options, selected, onChange }) {
  const anyValue = options[0].value
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '32px' }}>
      <span style={{ fontSize: '11px', color: '#666', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '60px', flexShrink: 0 }}>
        {label}
      </span>
      <div className="chips-row" style={{ flex: 1 }}>
        {options.map(opt => {
          const isAny = opt.value === anyValue
          return (
            <FilterChip
              key={opt.value}
              label={opt.label}
              active={isAny ? selected.length === 0 : selected.includes(opt.value)}
              onClick={() => onChange(isAny ? [] : toggleValue(selected, opt.value))}
            />
          )
        })}
      </div>
    </div>
  )
}

export default function FilterBar({ filters, setFilter, monthOptions = MONTH_OPTIONS_FALLBACK }) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backgroundColor: '#0a0a14',
        borderBottom: '1px solid #1a1a2e',
        padding: '10px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <FilterRow label="Drive" options={DRIVE_OPTIONS} selected={filters.drive} onChange={v => setFilter('drive', v)} />
      <FilterRow label="Distance" options={DISTANCE_OPTIONS} selected={filters.distance} onChange={v => setFilter('distance', v)} />
      <FilterRow label="Elevation" options={ELEVATION_OPTIONS} selected={filters.elevation} onChange={v => setFilter('elevation', v)} />
      <FilterRow label="Month" options={monthOptions} selected={filters.month} onChange={v => setFilter('month', v)} />
      <FilterRow label="Province" options={PROVINCE_OPTIONS} selected={filters.province} onChange={v => setFilter('province', v)} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '2px' }}>
        <span style={{ fontSize: '11px', color: '#666', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '60px' }}>
          More
        </span>
        <button
          onClick={() => setFilter('kidsRun', !filters.kidsRun)}
          style={{
            padding: '5px 12px',
            borderRadius: '999px',
            fontSize: '13px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: filters.kidsRun ? '#ffffff' : '#1a1a2e',
            color: filters.kidsRun ? '#0a0a14' : '#aaaaaa',
            fontWeight: filters.kidsRun ? '600' : '400',
            whiteSpace: 'nowrap',
          }}
        >
          Kids run
        </button>
        <button
          onClick={() => setFilter('showTBD', !filters.showTBD)}
          style={{
            padding: '5px 12px',
            borderRadius: '999px',
            fontSize: '13px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: filters.showTBD ? '#ffffff' : '#1a1a2e',
            color: filters.showTBD ? '#0a0a14' : '#aaaaaa',
            fontWeight: filters.showTBD ? '600' : '400',
            whiteSpace: 'nowrap',
          }}
        >
          Show unscheduled
        </button>
        <button
          onClick={() => setFilter('showPast', !filters.showPast)}
          style={{
            padding: '5px 12px',
            borderRadius: '999px',
            fontSize: '13px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: filters.showPast ? '#ffffff' : '#1a1a2e',
            color: filters.showPast ? '#0a0a14' : '#aaaaaa',
            fontWeight: filters.showPast ? '600' : '400',
            whiteSpace: 'nowrap',
          }}
        >
          Show past
        </button>
      </div>
    </div>
  )
}
