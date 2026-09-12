'use client'

import { useEffect, useRef, useState } from 'react'
import FilterChip from './FilterChip'
import { toggleValue } from '../lib/filters.js'
import { LEVELS } from '../lib/semantics.js'

/* ── The filter panel ─────────────────────────────────────────────────────────
   Was eight stacked rows of chips — six filters plus two toggle rows — which is
   a lot of permanently sticky screen before a single race appears.

   This is the prototype's panel: each filter is a labelled CELL asking a
   question in plain language, and the cells tile instead of stacking. Two
   shapes of control, chosen by whether the list GROWS:

     menu      months (extends every season), difficulty (six ITRA levels, and
               more if the catalogue ever leaves Catalunya), climb (the longest
               labels). A menu absorbs a growing list; a chip row has to be
               re-laid-out each time.
     segments  the short, stable lists. Always visible, one click, never behind
               a menu.

   NOT ported from the prototype: it asks FOUR questions and this asks six. The
   prototype has no Climb row and no Province row. Climb is first-class by
   Dima's ruling of 2026-08-25 — "for trail running D+ is a primary decision
   axis... the earlier behind-'More' demotion over-corrected" — so dropping it
   here would quietly re-litigate that. Both stay.

   Cells auto-fit rather than sitting in a fixed grid, so the panel reflows on
   its own width instead of on breakpoints; segment tracks wrap rather than
   shrink, because the labels ARE the filter. */

const DRIVE_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'u60', label: '< 1h' },
  { value: '60-120', label: '1–2h' },
  { value: '120+', label: '2h+' },
]

// One option per ITRA level (filters.js DIFFICULTY_VALUES). 'V.hard+' used to
// bundle the top three; see the 2026-09-10 filters commit for why it no longer
// does. Each carries its own level token, and the WORD is always present, so
// the colour never travels alone.
const DIFFICULTY_OPTIONS = [
  { value: 'any', label: 'Any difficulty' },
  { value: 'easy', label: 'Easy', bg: LEVELS.Easy.bg, ink: LEVELS.Easy.ink },
  { value: 'moderate', label: 'Moderate', bg: LEVELS.Moderate.bg, ink: LEVELS.Moderate.ink },
  { value: 'hard', label: 'Hard', bg: LEVELS.Hard.bg, ink: LEVELS.Hard.ink },
  { value: 'very-hard', label: 'Very hard', bg: LEVELS['Very hard'].bg, ink: LEVELS['Very hard'].ink },
  { value: 'extreme', label: 'Extreme', bg: LEVELS.Extreme.bg, ink: LEVELS.Extreme.ink },
  { value: 'brutal', label: 'Brutal', bg: LEVELS.Brutal.bg, ink: LEVELS.Brutal.ink },
]

const DISTANCE_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'u10', label: '< 10 km' },
  { value: '10-21', label: '10–21 km' },
  { value: '21-42', label: '21–42 km' },
  { value: '42+', label: '42+ km' },
]

// Climb is a first-class row (Dima 2026-08-25). It is a menu here only because
// its labels are the longest of any filter, not because it is secondary.
const ELEVATION_OPTIONS = [
  { value: 'any', label: 'Any climb' },
  { value: 'u200', label: '< 200 m D+' },
  { value: '200-500', label: '200–500 m D+' },
  { value: '500-1000', label: '500–1000 m D+' },
  { value: '1000-2000', label: '1000–2000 m D+' },
  { value: '2000+', label: '2000+ m D+' },
]

const MONTH_OPTIONS_FALLBACK = [{ value: 'all', label: 'All' }]

const PROVINCE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'BARCELONA', label: 'Barcelona' },
  { value: 'GIRONA', label: 'Girona' },
  { value: 'TARRAGONA', label: 'Tarragona' },
  { value: 'LLEIDA', label: 'Lleida' },
]

// The clear-the-row sentinel carries one of these values. Detected by value,
// NOT by position — a reordered options list must not silently turn a real
// bucket into the clear-all control.
const CLEAR_VALUES = new Set(['any', 'all'])

function Cell({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', minWidth: 0 }}>
      <span className="fdr-label">{label}</span>
      {children}
    </div>
  )
}

/* Multi-select listbox. Picking does NOT close it — closing after one choice is
   what makes a multi-select feel broken. Selected values render as tokens in
   the control itself rather than as "3 selected": the control is wide enough to
   just say what is on. */
function Menu({ label, options, selected, onChange, placeholder }) {
  const [open, setOpen] = useState(false)
  const root = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => { if (root.current && !root.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const chosen = options.filter(o => !CLEAR_VALUES.has(o.value) && selected.includes(o.value))
  const MAX_TOKENS = 3

  return (
    <div ref={root} style={{ position: 'relative' }}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', minHeight: '40px', display: 'flex', alignItems: 'center', gap: '8px',
          justifyContent: 'space-between', padding: '5px 12px', cursor: 'pointer',
          border: '1px solid var(--fdr-border)', borderRadius: 'var(--fdr-radius-pill)',
          background: 'var(--fdr-surface)', color: 'var(--fdr-ink)', textAlign: 'left',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', minWidth: 0 }}>
          {chosen.length === 0
            ? <span style={{ fontSize: '13px', color: 'var(--fdr-ink-muted)' }}>{placeholder}</span>
            : chosen.slice(0, MAX_TOKENS).map(o => (
              <span key={o.value} style={{
                fontSize: '12px', fontWeight: 600, padding: '3px 9px',
                borderRadius: 'var(--fdr-radius-pill)', whiteSpace: 'nowrap',
                background: o.bg || 'var(--fdr-ink)', color: o.ink || 'var(--fdr-ink-inverse)',
              }}>{o.label}</span>
            ))}
          {chosen.length > MAX_TOKENS && (
            <span className="fdr-mono" style={{ fontSize: '11.5px', color: 'var(--fdr-ink-muted)' }}>
              +{chosen.length - MAX_TOKENS}
            </span>
          )}
        </span>
        <span aria-hidden="true" style={{ fontSize: '10px', color: 'var(--fdr-action)', flexShrink: 0 }}>▾</span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          aria-label={label}
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, minWidth: '100%',
            maxHeight: '52vh', overflowY: 'auto', zIndex: 20, padding: '5px',
            display: 'flex', flexDirection: 'column', gap: '2px',
            background: 'var(--fdr-surface)', border: '1px solid var(--fdr-border-strong)',
            borderRadius: 'var(--fdr-radius-md)', boxShadow: '0 6px 18px rgba(17,17,15,.10)',
          }}
        >
          {options.map(opt => {
            const isAny = CLEAR_VALUES.has(opt.value)
            const active = isAny ? selected.length === 0 : selected.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => onChange(isAny ? [] : toggleValue(selected, opt.value))}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                  padding: '7px 10px', borderRadius: 'var(--fdr-radius-sm)', border: 0,
                  cursor: 'pointer', textAlign: 'left', fontSize: '13px', whiteSpace: 'nowrap',
                  background: active ? 'var(--fdr-sunk)' : 'transparent',
                  fontWeight: active ? 600 : 400, color: 'var(--fdr-ink)',
                }}
              >
                {/* selection is a tick, never colour alone */}
                <span aria-hidden="true" style={{ width: '12px', flexShrink: 0, color: 'var(--fdr-action)' }}>
                  {active ? '✓' : ''}
                </span>
                {opt.bg && (
                  <span aria-hidden="true" style={{
                    width: '16px', height: '10px', flexShrink: 0, borderRadius: '2px',
                    background: opt.bg, border: '1px solid var(--fdr-border)',
                  }} />
                )}
                <span>{opt.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* Always-visible multi-select. "Any" is a real, clickable answer that clears the
   row and lights up whenever the row is empty, so there is never a state with
   nothing selected. */
function Segments({ label, options, selected, onChange }) {
  return (
    <div role="group" aria-label={label} style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
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
  )
}

function Toggle({ label, active, onClick }) {
  return (
    <button onClick={onClick} aria-pressed={active} style={{
      padding: '5px 12px', borderRadius: 'var(--fdr-radius-pill)', fontSize: '13px',
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
  const activeCount =
    filters.drive.length + filters.difficulty.length + filters.distance.length +
    filters.elevation.length + filters.month.length + filters.province.length +
    (filters.kidsRun ? 1 : 0)

  const clearAll = () => {
    setFilter('drive', [])
    setFilter('difficulty', [])
    setFilter('distance', [])
    setFilter('elevation', [])
    setFilter('month', [])
    setFilter('province', [])
    setFilter('kidsRun', false)
  }

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 10,
      backgroundColor: 'var(--fdr-canvas)',
      borderBottom: '1px solid var(--fdr-border)',
      padding: '12px 16px 10px',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '12px 20px',
      }}>
        <Cell label="When">
          <Menu label="When" placeholder="All months" options={monthOptions}
            selected={filters.month} onChange={v => setFilter('month', v)} />
        </Cell>
        <Cell label="How hard">
          <Menu label="How hard" placeholder="Any difficulty" options={DIFFICULTY_OPTIONS}
            selected={filters.difficulty} onChange={v => setFilter('difficulty', v)} />
        </Cell>
        <Cell label="How much climb">
          <Menu label="How much climb" placeholder="Any climb" options={ELEVATION_OPTIONS}
            selected={filters.elevation} onChange={v => setFilter('elevation', v)} />
        </Cell>
        <Cell label="What · distance">
          <Segments label="Distance" options={DISTANCE_OPTIONS}
            selected={filters.distance} onChange={v => setFilter('distance', v)} />
        </Cell>
        <Cell label="How far · drive">
          <Segments label="Drive time" options={DRIVE_OPTIONS}
            selected={filters.drive} onChange={v => setFilter('drive', v)} />
        </Cell>
        <Cell label="Where">
          <Segments label="Province" options={PROVINCE_OPTIONS}
            selected={filters.province} onChange={v => setFilter('province', v)} />
        </Cell>
      </div>

      {/* Meta strip. "More" holds content filters; "Show" holds view toggles —
          mixing the two was confusing (a kids-run filter is not the same kind
          of thing as revealing past races). */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
        marginTop: '10px', paddingTop: '9px', borderTop: '1px solid var(--fdr-border)',
      }}>
        <Toggle label="Kids run" active={filters.kidsRun} onClick={() => setFilter('kidsRun', !filters.kidsRun)} />
        <Toggle label="No date yet" active={filters.showTBD} onClick={() => setFilter('showTBD', !filters.showTBD)} />
        <Toggle label="Past races" active={filters.showPast} onClick={() => setFilter('showPast', !filters.showPast)} />
        <span style={{ flex: 1 }} />
        {activeCount > 0 && (
          <button onClick={clearAll} className="fdr-mono" style={{
            fontSize: '12px', color: 'var(--fdr-ink-muted)', background: 'none',
            border: '1px solid var(--fdr-border)', borderRadius: 'var(--fdr-radius-pill)',
            padding: '5px 12px', cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            Clear {activeCount} filter{activeCount === 1 ? '' : 's'} ×
          </button>
        )}
      </div>
    </div>
  )
}
