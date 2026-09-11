// Page furniture from the study: the sticky masthead, the hero band, and the
// footer. Server components — none of this holds state.
//
// THE ORIGIN IS A STATEMENT, NOT A PICKER. The study's 13-city selector was
// deleted after it was found to compute every city as "Barcelona time + a flat
// constant", which put Albons at 137 minutes from Girona when it is about 25.
// The dataset holds one origin, so the header states one origin. Bringing a real
// picker back needs, in order: the geocode backfill (L4), a province check on
// ambiguous town names (R4), the drivable/no_road_access contract (R12), an
// origin × town matrix on OSRM, and both consumers updated (R7).

export function SiteHeader() {
  return (
    <header>
      <a className="mark" href="/">trailraces<b>.</b>cat</a>
      <div className="nav">
        <a className="navlbl" href="/about">Why I built this</a>
        <a className="navlbl" href="/for-agents">For agents</a>
        <span className="origin" title="Every drive time is measured from Plaça Glòries, Barcelona">
          <span className="otrig"><span className="ol">DRIVE FROM</span><b>Barcelona</b></span>
        </span>
        <a className="circ" href="#races" aria-label="Jump to the filters and races">↓</a>
      </div>
    </header>
  )
}

export function Hero({ total, shown }) {
  return (
    <div className="hero">
      <div className="top">
        <p>The race calendar for Catalunya — filtered by distance, elevation and the time it takes to get there.</p>
      </div>
      <div className="h1wrap">
        <div className="heroart" aria-hidden="true" />
        <h1 id="home">
          <span className="w"><span>Pick a trail.</span></span>
          <span className="l2 w"><span className="acc">Go run.</span></span>
        </h1>
      </div>
      {/* R10: a count about "the catalogue" states its filter. */}
      <div className="hint">
        {total} active races in the source calendar
        {shown != null && shown !== total ? ` — ${shown} match your filters` : ''}
      </div>
    </div>
  )
}

export function SiteFooter({ lastUpdated }) {
  return (
    <footer>
      Data from ultrescatalunya.com · Drive times from Plaça Glòries, Barcelona (estimated)
      <br />
      Last updated {lastUpdated} · <a href="/about">Why I built this</a> · <a href="/for-agents">For AI agents</a>
    </footer>
  )
}
