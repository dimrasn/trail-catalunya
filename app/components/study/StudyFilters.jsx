'use client'

// The study's filter panel: a bordered instrument of labelled cells, each
// asking one question in plain language. Two control shapes, chosen by whether
// the list GROWS rather than by importance —
//
//   menu      WHEN (months extend every season), HOW HARD (six ITRA levels, and
//             more if the catalogue leaves Catalunya), HOW MUCH CLIMB (the
//             longest labels of any filter).
//   segments  DISTANCE, DRIVE, WHERE — short, stable, always visible, one click.
//
// THREE ROWS, WHERE THE STUDY HAS TWO. The study asks four questions; the site
// also filters on climb and province. Climb is first-class by Dima's ruling of
// 2026-08-25 ("for trail running D+ is a primary decision axis"), so dropping it
// to match the study's cell count would quietly re-litigate a decision he
// already made. Both extra filters use the study's own control vocabulary and
// its two-per-row grid, so the panel still reads as one instrument.

import { useEffect, useRef, useState } from 'react'
import { LEVELS, LEVEL_ORDER } from '../../lib/semantics.js'
import { DIFFICULTY_SLUG, toggleValue } from '../../lib/filters.js'

const DISTANCE_OPTIONS = [
  { value: 'u10', label: '< 10 km' },
  { value: '10-21', label: '10–21 km' },
  { value: '21-42', label: '21–42 km' },
  { value: '42+', label: '42 + km' },
]

const DRIVE_OPTIONS = [
  { value: 'u60', word: 'NEAR', label: '< 1 h', index: 1 },
  { value: '60-120', word: 'MID', label: '1–2 h', index: 2 },
  { value: '120+', word: 'FAR', label: '2 h +', index: 3 },
]

const PROVINCE_OPTIONS = [
  { value: 'BARCELONA', label: 'Barcelona' },
  { value: 'GIRONA', label: 'Girona' },
  { value: 'TARRAGONA', label: 'Tarragona' },
  { value: 'LLEIDA', label: 'Lleida' },
]

const ELEVATION_OPTIONS = [
  { value: 'u200', label: 'under 200 m D+' },
  { value: '200-500', label: '200 – 500 m D+' },
  { value: '500-1000', label: '500 – 1000 m D+' },
  { value: '1000-2000', label: '1000 – 2000 m D+' },
  { value: '2000+', label: '2000 m D+ and up' },
]

/* A multi-select listbox. Picking does NOT close it — the whole point of a
   multi-select is picking more than one thing — and the picks render as TOKENS
   in the control itself rather than as "3 selected", because a wide control
   that only ever says "2 levels" wastes the room it just asked for. */
function Menu({ id, label, placeholder, options, selected, onToggle, tokenClass }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = e => { if (!wrapRef.current?.contains(e.target)) setOpen(false) }
    const onKey = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const picked = options.filter(o => selected.includes(o.value))

  return (
    <div className={`sel${open ? ' open' : ''}${picked.length ? ' on' : ''}`} ref={wrapRef}>
      <button
        className="selbtn"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`l-${id}`}
        onClick={() => setOpen(v => !v)}
      >
        <span className="selv">
          {picked.length === 0
            ? <span className="ph">{placeholder}</span>
            : picked.map(o => (
                <span className={`tk${tokenClass ? ` ${tokenClass(o.value)}` : ''}`} key={o.value}>
                  {o.label}
                </span>
              ))}
        </span>
        <i aria-hidden="true">▾</i>
      </button>
      <div className="selmenu" role="listbox" aria-label={label} aria-multiselectable="true">
        {options.map(o => {
          const on = selected.includes(o.value)
          return (
            <button
              className={`selopt${o.count === 0 ? ' zero' : ''}`}
              type="button"
              role="option"
              aria-selected={on}
              key={o.value}
              onClick={() => onToggle(o.value)}
            >
              {/* the check column, so "selected" is never carried by colour alone */}
              <span className="tick" aria-hidden="true">{on ? '✓' : ''}</span>
              {o.swatch && <i className="swx" style={{ '--dc': o.swatch }} aria-hidden="true" />}
              <span className="olb">{o.label}</span>
              {o.count != null && <span className="cnt">{o.count}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* Segmented control. Multi-select, so the study's sliding single indicator is
   gone — it can only ever point at one thing. Each selected segment fills in
   place, and "Any" is the sentinel that clears the row. */
function Segments({ label, options, selected, onToggle, onClear, className = '' }) {
  return (
    <div className={`seg segf ${className}`} role="group" aria-label={label}>
      <button type="button" aria-pressed={selected.length === 0} onClick={onClear}>
        <span className="sgi">Any</span>
      </button>
      {options.map(o => (
        <button
          type="button"
          key={o.value}
          data-v={o.index ?? undefined}
          aria-pressed={selected.includes(o.value)}
          onClick={() => onToggle(o.value)}
        >
          <span className="sgi">
            {o.word && <i className="sgw">{o.word}</i>}
            <b>{o.label}</b>
          </span>
        </button>
      ))}
    </div>
  )
}

export default function StudyFilters({
  filters, setFilter, monthOptions, counts, shown, total,
  savedOnly, onToggleSavedOnly, onClearAll,
}) {
  const [openOnMobile, setOpenOnMobile] = useState(false)

  const activeCount =
    filters.drive.length + filters.distance.length + filters.elevation.length +
    filters.difficulty.length + filters.month.length + filters.province.length +
    (filters.kidsRun ? 1 : 0) + (filters.showTBD ? 1 : 0) + (filters.showPast ? 1 : 0) +
    (savedOnly ? 1 : 0)

  // One option per ITRA level, in scale order, straight off LEVEL_ORDER and
  // DIFFICULTY_SLUG. Six since 2026-09-10, when 'vh+' was un-bundled; adding a
  // level to semantics.js adds it here with no edit, and the token colour comes
  // from the same LEVELS entry the ticks use.
  const difficultyOptions = LEVEL_ORDER.map((word, i) => ({
    value: DIFFICULTY_SLUG[word],
    label: word,
    swatch: LEVELS[word].bg,
    band: i + 1,
    count: counts?.difficulty?.[DIFFICULTY_SLUG[word]],
  }))
  const bandOf = Object.fromEntries(difficultyOptions.map(o => [o.value, o.band]))

  const monthMenuOptions = monthOptions
    .filter(o => o.value !== 'all')
    .map(o => ({ ...o, count: counts?.month?.[o.value] }))

  return (
    <div className={`bar${openOnMobile ? ' open' : ''}`}>
      <div className="inner">
        <div className="fgrid">
          <div className="fcell">
            <span className="fl" id="l-when">WHEN</span>
            <Menu
              id="when" label="When" placeholder="All months"
              options={monthMenuOptions} selected={filters.month}
              onToggle={v => setFilter('month', toggleValue(filters.month, v))}
            />
          </div>
          <div className="fcell">
            <span className="fl" id="l-diff">HOW HARD</span>
            <Menu
              id="diff" label="How hard" placeholder="Any difficulty"
              options={difficultyOptions} selected={filters.difficulty}
              onToggle={v => setFilter('difficulty', toggleValue(filters.difficulty, v))}
              tokenClass={v => `g${bandOf[v]}`}
            />
          </div>
        </div>

        <div className="fgrid">
          <div className="fcell">
            <span className="fl">WHAT · DISTANCE</span>
            <Segments
              label="Distance" options={DISTANCE_OPTIONS} selected={filters.distance}
              onToggle={v => setFilter('distance', toggleValue(filters.distance, v))}
              onClear={() => setFilter('distance', [])}
            />
          </div>
          <div className="fcell">
            <span className="fl">HOW FAR · DRIVE</span>
            {/* drive is colour-encoded, so a selected segment wears its OWN band
                colour — otherwise picking "< 1 h" would paint NEAR the same
                colour as FAR and quietly undo the encoding */}
            <Segments
              className="drivesg" label="Drive time" options={DRIVE_OPTIONS} selected={filters.drive}
              onToggle={v => setFilter('drive', toggleValue(filters.drive, v))}
              onClear={() => setFilter('drive', [])}
            />
          </div>
        </div>

        <div className="fgrid">
          <div className="fcell">
            <span className="fl" id="l-climb">HOW MUCH CLIMB</span>
            <Menu
              id="climb" label="How much climb" placeholder="Any climb"
              options={ELEVATION_OPTIONS.map(o => ({ ...o, count: counts?.elevation?.[o.value] }))}
              selected={filters.elevation}
              onToggle={v => setFilter('elevation', toggleValue(filters.elevation, v))}
            />
          </div>
          <div className="fcell">
            <span className="fl">WHERE</span>
            <Segments
              label="Province" options={PROVINCE_OPTIONS} selected={filters.province}
              onToggle={v => setFilter('province', toggleValue(filters.province, v))}
              onClear={() => setFilter('province', [])}
            />
          </div>
        </div>

        <div className="fmeta">
          <button
            className="chip fbtoggle" type="button"
            aria-expanded={openOnMobile}
            onClick={() => setOpenOnMobile(v => !v)}
          >
            Filters {activeCount > 0 && <b>{activeCount}</b>}
          </button>
          <span className="count mono"><b>{shown}</b> / {total} races</span>
          <span className="mspacer" />
          <button
            className="chip" type="button"
            aria-pressed={filters.kidsRun}
            onClick={() => setFilter('kidsRun', !filters.kidsRun)}
          >
            Kids run
          </button>
          <button
            className="chip" type="button"
            aria-pressed={filters.showTBD}
            onClick={() => setFilter('showTBD', !filters.showTBD)}
          >
            No date yet
          </button>
          <button
            className="chip" type="button"
            aria-pressed={filters.showPast}
            onClick={() => setFilter('showPast', !filters.showPast)}
          >
            Past races
          </button>
          <button
            className="chip save" type="button"
            aria-pressed={savedOnly}
            aria-label="Show saved races only"
            onClick={onToggleSavedOnly}
          >
            <svg className="stx" viewBox="0 0 24 22.3" width="13" height="13" aria-hidden="true">
              <path d="M12 1.6 14.9 8.1 22 8.9 16.7 13.7 18.2 20.7 12 17.2 5.8 20.7 7.3 13.7 2 8.9 9.1 8.1Z" fill="currentColor" />
            </svg>
            <b>{counts?.saved ?? 0}</b>
          </button>
          <button
            className={`chip clear${activeCount ? ' live' : ''}`}
            type="button"
            onClick={onClearAll}
          >
            Clear all ×
          </button>
        </div>
      </div>
    </div>
  )
}
