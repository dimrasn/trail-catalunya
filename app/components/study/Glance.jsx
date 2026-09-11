'use client'

// "<Month> at a glance" — the study's featured() panel.
//
// The tiles summarise ONE month: the one the WHEN filter pins, else the first
// month that still has a match. They are computed from the same filtered set
// the list renders, so a number here can always be traced to a row below.

import { glanceTiles, driveCell } from '../../lib/studyView.js'
import { formatDrive, MONTHS_LONG, MONTHS_SHORT } from '../../lib/format.js'

// The study splits the drive figure so the unit can be set small: "1h 42m"
// renders as 1h 42 + m, "24 min" as 24 + min.
function splitDrive(minutes) {
  const s = formatDrive(minutes)
  const m = s.match(/^(\d+)\s*(min)$/)
  return m ? [m[1], m[2]] : [s, '']
}

function Tile({ label, value, unit, race, note }) {
  if (!race) {
    return (
      <div className="stat nodata">
        <span className="sl">{label}</span>
        <span className="sv">
          <strong>{value}</strong>
          <span className="n">{note}</span>
        </span>
      </div>
    )
  }
  return (
    <a className="stat seen still" href={`/race/${race.id}`} aria-label={`${label}: ${race.name} — open the race page`}>
      <span className="sl">{label}</span>
      <span className="sv">
        <strong>{value}{unit ? <small>{unit}</small> : null}</strong>
        <span className="n">{race.name}</span>
      </span>
    </a>
  )
}

export default function Glance({ monthKey, races, pinned }) {
  const monthNum = monthKey ? Number(monthKey.split('-')[1]) : null
  const monthName = monthNum ? MONTHS_LONG[monthNum - 1] : ''
  const tiles = glanceTiles(races)

  // Next up must be a REAL date — a race whose day is unannounced cannot be next.
  const dated = races.filter(r => r.date).sort((a, b) => (a.date < b.date ? -1 : 1))
  const next = dated[0] || null
  const nextDrive = next ? driveCell(next.driveMinutes) : null

  return (
    <div className="glance">
      <section className="lead">
        <div>
          <span className="mini">CATALUNYA · TRAIL CALENDAR</span>
          <h2><span>{monthName}</span><span className="l2">at a glance</span></h2>
        </div>
        <div className="leadbottom">
          <p>
            {tiles
              ? `${races.length} race${races.length === 1 ? '' : 's'} in ${monthName} match your filters. Drive times from Plaça Glòries, Barcelona.`
              : pinned
                ? `Nothing in ${monthName} matches your filters.`
                : 'No races match your filters.'}
          </p>
          <div className="nextup">
            <span>NEXT UP</span>
            {next ? (
              <>
                <b>{next.name}</b>
                <i className={nextDrive.known ? `dt${nextDrive.index}` : ''}>
                  {next.date.slice(8)} {MONTHS_SHORT[Number(next.date.slice(5, 7)) - 1]}
                  {nextDrive.known && <> · {formatDrive(next.driveMinutes)} <b className="dw">{nextDrive.word}</b></>}
                </i>
              </>
            ) : (
              <>
                <b>Nothing dated yet</b>
                <i>Every {monthName} race is still awaiting its date</i>
              </>
            )}
          </div>
        </div>
      </section>

      {tiles ? (
        <aside className="stats" aria-live="polite">
          <Tile label="SHORTEST" value={tiles.shortest?.km} unit="km" race={tiles.shortest?.race} />
          <Tile label="LONGEST" value={tiles.longest?.km} unit="km" race={tiles.longest?.race} />
          {tiles.nearest
            ? <Tile label="NEAREST DRIVE" value={splitDrive(tiles.nearest.driveMinutes)[0]} unit={splitDrive(tiles.nearest.driveMinutes)[1]} race={tiles.nearest} />
            : <Tile label="NEAREST DRIVE" value="—" note="no drive time for this month's races" />}
          {/* R14: only a race publishing a climb for EVERY distance can be
              crowned the month's highest. Otherwise the tile says so, rather
              than reporting a maximum over a population we cannot see all of. */}
          {tiles.highest
            ? <Tile
                label="HIGHEST ASCENT"
                value={tiles.highest.m >= 1000 ? `${(tiles.highest.m / 1000).toFixed(1)}K` : tiles.highest.m}
                unit="m D+"
                race={tiles.highest.race}
              />
            : <Tile label="HIGHEST ASCENT" value="—" note="no climb published this month" />}
        </aside>
      ) : (
        <aside className="stats none" aria-live="polite">
          <p className="statempty">Nothing to summarise yet — loosen a filter and the month metrics come back.</p>
        </aside>
      )}
    </div>
  )
}
