'use client'

// The homepage, in the design study's layout: masthead → hero → month glance →
// filter panel → sort/view controls → the race list (or the weekend ladder).
//
// What changed from the previous version, and why:
// - The 680px single-column card stack is gone. The study is a full-width
//   editorial sheet; a race is a ROW on a ruled list, not a card.
// - "Next two weekends" and the promoted "closest match" blocks are gone. The
//   study answers orientation with the glance panel (month metrics + NEXT UP)
//   and with the Weekends view, and both of those state their population. Two
//   more promoted blocks above the list would be a third and fourth answer to a
//   question already answered twice.
// - The ask-box (AskAI) STAYS. It is live on prod and logs real intent; the
//   study simply predates it.
//
// Filter semantics are untouched — matchers and the URL round-trip still come
// from app/lib/filters.js, which is unit-tested and mirrored in the MCP.

import { useState, useMemo, useEffect, useRef } from 'react'
import StudyFilters from './study/StudyFilters'
import Controls from './study/Controls'
import RaceRow from './study/RaceRow'
import Glance from './study/Glance'
import { SiteHeader, Hero, SiteFooter } from './study/Shell'
import AskAI from './AskAI'
import { groupIntoRungs } from '../lib/weekends.js'
import {
  DEFAULT_FILTERS, DIFFICULTY_SLUG, ELEVATION_VALUES, MONTH_VALUES,
  filtersFromParams, filtersToParams,
  matchesDrive, matchesDistance, matchesElevation, matchesMonth, matchesProvince,
  matchesDifficulty,
} from '../lib/filters.js'
import { LEVEL_ORDER } from '../lib/semantics.js'
import { eventKmEffort, difficultyLevel, completeMaxElevation, MONTHS_SHORT } from '../lib/format.js'

const SAVE_KEY = 'trailraces.saved'

function todayISO() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
}

// "YYYY-MM" for a dated race, its expected month for a dateless one, else TBD.
function monthKeyOf(race) {
  if (race.date) return race.date.slice(0, 7)
  if (race.expectedMonth != null) return `${race.expectedYear}-${String(race.expectedMonth).padStart(2, '0')}`
  return 'TBD'
}

/* Unrated races sort to the END of a climb or effort sort in BOTH directions.
   They are unknown, not zero — "desc" must not park them at the top as if they
   were the easiest races on the calendar. Date order breaks every tie. */
function sortKey(race, sort) {
  if (sort === 'drive') return race.driveMinutes
  if (sort === 'elev') return completeMaxElevation(race.distances)
  if (sort === 'diff') return eventKmEffort(race.distances)
  return null
}

function dateRank(race) {
  const key = monthKeyOf(race)
  if (key === 'TBD') return Number.MAX_SAFE_INTEGER
  const day = race.date ? Number(race.date.slice(8)) : 99
  return Number(key.slice(0, 4)) * 10000 + Number(key.slice(5, 7)) * 100 + day
}

function makeSorter(sort, dir) {
  return (a, b) => {
    if (sort !== 'date') {
      const ka = sortKey(a, sort)
      const kb = sortKey(b, sort)
      if (ka == null || kb == null) {
        if (ka != null) return -1
        if (kb != null) return 1
      } else if (ka !== kb) {
        return (ka - kb) * dir
      }
    } else {
      const d = (dateRank(a) - dateRank(b)) * dir
      if (d) return d
    }
    return dateRank(a) - dateRank(b)
  }
}

export default function RaceList({ races, lastUpdated }) {
  // Filters start at defaults and shared-link params are read AFTER mount.
  // Deliberate: useSearchParams in the render path forces a client-side-render
  // bailout, which made the server HTML empty — invisible to crawlers.
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [sort, setSort] = useState('date')
  const [dir, setDir] = useState(1)
  const [view, setView] = useState('list')
  const [saved, setSaved] = useState(() => new Set())
  const [savedOnly, setSavedOnly] = useState(false)
  const skipFirstUrlWrite = useRef(true)

  useEffect(() => {
    const fromUrl = filtersFromParams(new URLSearchParams(window.location.search))
    if (filtersToParams(fromUrl)) setFilters(fromUrl)
    try {
      const stored = JSON.parse(localStorage.getItem(SAVE_KEY) || '[]')
      if (Array.isArray(stored) && stored.length) setSaved(new Set(stored))
    } catch { /* a corrupt or blocked store is not worth breaking the page over */ }
  }, [])

  useEffect(() => {
    if (skipFirstUrlWrite.current) {
      skipFirstUrlWrite.current = false
      return
    }
    const qs = filtersToParams(filters)
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
  }, [filters])

  const setFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }))

  const toggleSave = id => {
    setSaved(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      try { localStorage.setItem(SAVE_KEY, JSON.stringify([...next])) } catch { /* ignore */ }
      return next
    })
  }

  const clearAll = () => {
    setFilters(DEFAULT_FILTERS)
    setSavedOnly(false)
  }

  const filtered = useMemo(() => {
    const today = todayISO()
    return races.filter(race => {
      // A race whose month is known is NOT "date TBD" — it belongs in that
      // month, labelled expected. Only a race with no month at all (R6's
      // agreement gate failing) sits behind the toggle.
      if (!race.date && race.expectedMonth == null && !filters.showTBD) return false
      if (race.date && !filters.showPast && (race.dateEnd || race.date) < today) return false
      if (filters.kidsRun && !race.kidsRun) return false
      if (savedOnly && !saved.has(race.id)) return false
      return (
        matchesDrive(race, filters.drive) &&
        matchesDistance(race, filters.distance) &&
        matchesElevation(race, filters.elevation) &&
        matchesDifficulty(race, filters.difficulty, difficultyLevel(eventKmEffort(race.distances))) &&
        matchesMonth(race, filters.month) &&
        matchesProvince(race, filters.province)
      )
    })
  }, [races, filters, savedOnly, saved])

  // Menu counts are computed over the SURVIVING set, so a count tells you what
  // picking that option would actually return rather than what the catalogue
  // holds in the abstract. An option that would return nothing is dimmed, not
  // hidden — a level with no races this season is information.
  const counts = useMemo(() => {
    // Every option starts at 0 rather than absent, so an option that would
    // return nothing renders "0" and picks up the study's .zero dim. Leaving it
    // undefined hid the count entirely, which makes an empty level look like an
    // unmeasured one — and the study is explicit that a level with no races
    // this season is information, not noise.
    const difficulty = Object.fromEntries(LEVEL_ORDER.map(w => [DIFFICULTY_SLUG[w], 0]))
    const elevation = Object.fromEntries(ELEVATION_VALUES.map(v => [v, 0]))
    const month = Object.fromEntries(MONTH_VALUES.map(v => [v, 0]))
    for (const r of filtered) {
      for (const v of ELEVATION_VALUES) {
        if (matchesElevation(r, [v])) elevation[v] += 1
      }
      // DIFFICULTY_SLUG, not a string transform. The mapping lives in exactly
      // one place (filters.js) so matchesDifficulty, the menu and these counts
      // cannot drift — re-deriving 'Very hard' -> 'very-hard' here would put a
      // second copy of it in the codebase, which is what that export exists to
      // prevent.
      const word = difficultyLevel(eventKmEffort(r.distances))
      const slug = DIFFICULTY_SLUG[word]
      if (slug) difficulty[slug] += 1
      const key = monthKeyOf(r)
      if (key !== 'TBD') month[key.slice(5, 7)] += 1
    }
    return { difficulty, month, elevation, saved: saved.size }
  }, [filtered, saved])

  const monthOptions = useMemo(() => {
    const months = new Set()
    for (const race of races) {
      if (race.date) months.add(race.date.slice(5, 7))
      else if (race.expectedMonth != null) months.add(String(race.expectedMonth).padStart(2, '0'))
    }
    return [...months].sort().map(m => ({ value: m, label: MONTHS_SHORT[parseInt(m) - 1] }))
  }, [races])

  const sorted = useMemo(() => [...filtered].sort(makeSorter(sort, dir)), [filtered, sort, dir])

  // Grouped by month for the date sort and for the ladder; one flat group for
  // every other sort, because "By drive" that restarts each month is not sorted
  // by drive.
  const groups = useMemo(() => {
    const byKey = new Map()
    for (const race of sorted) {
      const key = monthKeyOf(race)
      if (!byKey.has(key)) byKey.set(key, [])
      byKey.get(key).push(race)
    }
    return [...byKey.entries()].sort(([a], [b]) =>
      a === 'TBD' ? 1 : b === 'TBD' ? -1 : a < b ? -1 : 1)
  }, [sorted])

  // The month the glance panel summarises: the one WHEN pins, else the first
  // with a surviving race — the same set the list renders.
  const pinnedMonth = filters.month.length === 1 ? filters.month[0] : null
  const glanceGroup = useMemo(() => {
    if (pinnedMonth) {
      const hit = groups.find(([k]) => k !== 'TBD' && k.slice(5, 7) === pinnedMonth)
      return hit || [null, []]
    }
    return groups.find(([k]) => k !== 'TBD') || [null, []]
  }, [groups, pinnedMonth])

  const headingFor = key => {
    if (key === 'TBD') return { head: 'TBD', sub: 'no month published' }
    const [y, m] = key.split('-')
    return { head: MONTHS_SHORT[Number(m) - 1], sub: y }
  }

  const empty = filtered.length === 0

  return (
    <div className="wrap">
      <SiteHeader />
      <Hero total={races.length} shown={filtered.length} />
      <Glance monthKey={glanceGroup[0]} races={glanceGroup[1]} pinned={!!pinnedMonth} />

      <div id="races" />
      <StudyFilters
        filters={filters}
        setFilter={setFilter}
        monthOptions={monthOptions}
        counts={counts}
        shown={filtered.length}
        total={races.length}
        savedOnly={savedOnly}
        onToggleSavedOnly={() => setSavedOnly(v => !v)}
        onClearAll={clearAll}
      />

      <AskAI filteredRaces={filtered} filters={filters} />

      <Controls
        sort={sort} dir={dir} view={view}
        onSort={setSort}
        onDir={() => setDir(d => -d)}
        onView={setView}
      />

      {empty ? (
        <div className="empty">
          <h3>No races match</h3>
          <p>
            {savedOnly && saved.size === 0
              ? 'You have not saved any races yet.'
              : 'Nothing in the calendar fits every filter at once.'} Drop one and try again.
          </p>
          <button className="chip" type="button" onClick={clearAll}>Clear all filters ×</button>
        </div>
      ) : view === 'weekends' ? (
        <div className="view cal">
          {groups.map(([key, rs]) => {
            const { head, sub } = headingFor(key)
            const undated = rs.filter(r => !r.date).length
            return (
              <div className="cmonth" key={key}>
                <h2>{head}<small>{sub} · {rs.length} race{rs.length === 1 ? '' : 's'}
                  {undated ? ` · ${undated} undated` : ''}</small></h2>
                <div className="ladder">
                  {groupIntoRungs(rs).map(rung => (
                    <div className={`wk${rung.kind === 'undated' ? ' tba' : ''}`} key={rung.key}>
                      <div className="wkh">
                        {rung.kind === 'undated' && <i className="ast">∗</i>}
                        <b>{rung.label}</b>
                        <span className="wkn">{rung.races.length} race{rung.races.length === 1 ? '' : 's'}</span>
                      </div>
                      <div className="list">
                        {rung.races.map(race => (
                          <RaceRow
                            key={race.id} race={race}
                            saved={saved.has(race.id)} onToggleSave={toggleSave}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : sort === 'date' ? (
        <div className="view">
          {groups.map(([key, rs]) => {
            const { head, sub } = headingFor(key)
            return (
              <div className="month" key={key}>
                <h2>{head}<small>{sub} · {rs.length} race{rs.length === 1 ? '' : 's'}</small></h2>
                <div className="list">
                  {rs.map(race => (
                    <RaceRow
                      key={race.id} race={race}
                      saved={saved.has(race.id)} onToggleSave={toggleSave}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="view">
          <div className="month">
            <h2>
              {{ drive: 'By drive', elev: 'By climb', diff: 'By effort' }[sort]}
              <small>{sorted.length} race{sorted.length === 1 ? '' : 's'}</small>
            </h2>
            <div className="list wide">
              {sorted.map(race => (
                <RaceRow
                  key={race.id} race={race} showMonth
                  saved={saved.has(race.id)} onToggleSave={toggleSave}
                  distanceLimit={4}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <SiteFooter lastUpdated={lastUpdated} />
    </div>
  )
}
