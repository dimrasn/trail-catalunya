'use client'

// Sort control, view toggle and the colour legend — the study's .ctl and
// .legendbar strips.
//
// The study's segmented control has a sliding indicator (.ind) that its script
// positioned by measuring the active button. Same here, via refs: the CSS gives
// the ACTIVE button white text, so without the dark indicator behind it the
// label would be cream on cream. It is recomputed on resize because the buttons
// reflow.

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { LEVELS, LEVEL_ORDER } from '../../lib/semantics.js'

function Seg({ label, options, value, onPick }) {
  const wrapRef = useRef(null)
  const [ind, setInd] = useState({ width: 0, x: 0 })

  const place = () => {
    const wrap = wrapRef.current
    if (!wrap) return
    const active = wrap.querySelector('[aria-checked="true"]')
    if (!active) return
    setInd({ width: active.offsetWidth, x: active.offsetLeft })
  }

  useLayoutEffect(place, [value, options.length])
  useEffect(() => {
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [])

  return (
    <div className="seg" role="radiogroup" aria-label={label} ref={wrapRef}>
      <div className="ind" style={{ width: `${ind.width}px`, transform: `translateX(${ind.x}px)` }} />
      {options.map(o => (
        <button
          type="button" role="radio" key={o.value}
          aria-checked={value === o.value}
          onClick={() => onPick(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export const SORT_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'drive', label: 'Drive' },
  { value: 'elev', label: 'Elevation' },
  { value: 'diff', label: 'Difficulty' },
]

const VIEW_OPTIONS = [
  { value: 'list', label: 'List' },
  { value: 'weekends', label: 'Weekends' },
]

export default function Controls({ sort, dir, view, onSort, onDir, onView }) {
  const [legendOpen, setLegendOpen] = useState(false)

  return (
    <>
      <div className="ctl">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Seg label="Sort by" options={SORT_OPTIONS} value={sort} onPick={onSort} />
          <button className="dir" type="button" title="Flip sort direction" onClick={onDir}>
            {dir === 1 ? 'asc ↑' : 'desc ↓'}
          </button>
        </div>
        <Seg label="View" options={VIEW_OPTIONS} value={view} onPick={onView} />
      </div>

      <div className="legendbar">
        <span><b>Difficulty</b> = ITRA km-effort (km + climb ÷ 100), on ITRA&apos;s published scale</span>
        <button
          className="lgtoggle" type="button"
          aria-expanded={legendOpen}
          onClick={() => setLegendOpen(v => !v)}
        >
          Colour legend <i aria-hidden="true">▾</i>
        </button>
      </div>

      <div className={`legends${legendOpen ? ' open' : ''}`}>
        <div className="lgbox">
          <div className="legend">
            <span><b>Distance</b> — rounded pills, no colour</span>
            <span style={{ gridColumn: '2/-1', whiteSpace: 'normal' }}>
              A distance is a menu option, not a severity. Only difficulty and drive are colour-encoded.
            </span>
          </div>
          <div className="legend">
            <span><b>Difficulty</b> — skewed ticks · ITRA levels</span>
            {LEVEL_ORDER.map((word, i) => (
              <span key={word}>
                <i className="sw" style={{ backgroundColor: LEVELS[word].bg }} />
                {word}
              </span>
            ))}
            {view === 'weekends' && (
              <span style={{ gridColumn: '1/-1', paddingTop: '6px' }}>
                · Weekends view groups by the Fri–Sun window a race falls in — 99% of dated races land
                there. A midweek race gets its own dated rung; a race whose day is unannounced gets one too
              </span>
            )}
            <span style={{ gridColumn: '1/-1', paddingTop: '6px' }}>
              <i className="ast">∗</i> Exact date not announced — the month comes from the source calendar,
              the day does not exist yet. These races sit under their month, never on a day
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
