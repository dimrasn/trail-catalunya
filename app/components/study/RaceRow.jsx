'use client'

// The study's race row, reproduced class-for-class from outputs/prototype's
// rowHTML(). Every class name here has a rule in app/study.css; the derivations
// (which ticks are filled, what the day cell says) are in app/lib/studyView.js.
//
// ONE DELIBERATE DEPARTURE from the study: the study's row surface opened a
// quick-view overlay and the name opened its SPA route. Here the row is not
// interactive at all and the NAME is a real <a> to the statically generated
// /race/<slug>. A link nested inside a button is invalid and reads badly in a
// screen reader — the study said so in its own comment, and the app has real
// pages to link to, so the quick view has nothing left to do.

import { eventRating, driveCell, dayCell } from '../../lib/studyView.js'
import { formatDrive } from '../../lib/format.js'

function Star({ on }) {
  // SVG rather than ★/☆: the glyphs sit off-centre in their em box and differ
  // in width between states, so the button visibly shifted when toggled.
  return (
    <svg className="stx" viewBox="0 0 24 22.3" width="14" height="14" aria-hidden="true">
      <path
        d="M12 1.6 14.9 8.1 22 8.9 16.7 13.7 18.2 20.7 12 17.2 5.8 20.7 7.3 13.7 2 8.9 9.1 8.1Z"
        fill={on ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={on ? 1 : 1.8}
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Distance pills are NEUTRAL — distance is a menu of options, not a severity,
// and the difficulty ticks beside them already own the ramp. The study caps the
// list so a five-variant race cannot push the drive column off the row.
function Distances({ distances, limit }) {
  const shown = distances.slice(0, limit)
  const rest = distances.length - shown.length
  return (
    <>
      {shown.map((d, i) => (
        <span className="v" key={i}>
          <b>{d.km} km</b>
          <span>{d.elevationGain == null ? 'climb n/p' : `↑${d.elevationGain}`}</span>
        </span>
      ))}
      {rest > 0 && <span className="n">+{rest}</span>}
    </>
  )
}

function Ticks({ distances }) {
  const r = eventRating(distances)

  if (!r.rated) {
    // R14. Six hollow ticks keep the scale legible while stating an absence —
    // a word here would be a claim the data does not support.
    const title = `No ITRA rating: ${r.missing} of ${r.total} distance${r.total === 1 ? '' : 's'} has no published climb`
    return (
      <>
        <div className="ticks unrated" title={title}>
          {[1, 2, 3, 4, 5, 6].map(i => <i key={i} />)}
        </div>
        <b className="urw">Not rated</b>
        <small>climb not published</small>
      </>
    )
  }

  const title = `ITRA km-effort ${r.effort.toFixed(1)} = ${r.anchor.km} km + ${r.anchor.elevationGain} m ÷ 100 — ${r.word}`
  return (
    <>
      <div className={`ticks g${r.band}`} title={title}>
        {[1, 2, 3, 4, 5, 6].map(i => <i key={i} className={i <= r.band ? 'f' : ''} />)}
      </div>
      <b>{r.word}</b>
      <small>for {r.anchor.km} km ↑{r.anchor.elevationGain}</small>
    </>
  )
}

export default function RaceRow({ race, showMonth = false, saved = false, onToggleSave, distanceLimit = 3 }) {
  const day = dayCell(race)
  const drive = driveCell(race.driveMinutes)

  return (
    <div className={`row${saved ? ' saved' : ''}`}>
      {day.dayless ? (
        <div className="day dayless" title="The organizer has not announced the exact date">
          <i className="ast">∗</i>
          <small>{day.month ? `${day.month} · TBA` : 'TBA'}</small>
        </div>
      ) : (
        <div className="day">
          {day.day}
          <small>{showMonth ? `${day.month} · ` : ''}{day.dow}</small>
        </div>
      )}

      <div className="info">
        <div className="name">
          <a className="rname" href={`/race/${race.id}`}>
            {race.name}
            <span className="sr"> — full race page</span>
          </a>
        </div>
        <div className="town">{race.town}</div>
      </div>

      <div className="kms">
        <Distances distances={race.distances || []} limit={distanceLimit} />
      </div>

      <div className="diff"><Ticks distances={race.distances || []} /></div>

      {/* The origin is stated once, in the header — the study measured that
          repeating "from Barcelona" on every row cost 127px in a 116px column
          and printed under the save star. The row carries the time and its band
          word; the word always rides with the time, so colour is never alone. */}
      <div className={drive.known ? `drive dt${drive.index}` : 'drive'}>
        {drive.known ? formatDrive(race.driveMinutes) : '—'}
        <small>{drive.known ? <i className="dw">{drive.word}</i> : 'drive unknown'}</small>
      </div>

      <div className="ract">
        <button
          className="rsave"
          type="button"
          aria-pressed={saved}
          aria-label={`${saved ? 'Remove' : 'Save'} ${race.name}`}
          onClick={() => onToggleSave?.(race.id)}
        >
          <Star on={saved} />
        </button>
      </div>
    </div>
  )
}
