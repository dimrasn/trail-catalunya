// Builds the prompt sent to Claude / ChatGPT from the currently-filtered
// races. Pure function so it's reused across both deep links and copy, and is
// testable. The prompt carries the data inline so the agent can answer with
// zero setup (no MCP connector required) — the universal-access path.

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const DRIVE_LABEL = { u60: 'under 1h', '60-120': '1–2h', '120+': 'over 2h' }
const DIST_LABEL = {
  u10: 'under 10 km', '10-15': '10–15 km', '15-21': '15–21 km',
  '21-42': '21–42 km', '42+': '42+ km',
}
const ELEV_LABEL = {
  u200: 'under 200 D+', '200-500': '200–500 D+', '500-1000': '500–1000 D+',
  '1000-2000': '1000–2000 D+', '2000+': '2000+ D+',
}
const PROV_LABEL = {
  BARCELONA: 'Barcelona', GIRONA: 'Girona', TARRAGONA: 'Tarragona', LLEIDA: 'Lleida',
}

// Cap inline races so the deep-link URL stays within practical length limits.
const MAX_INLINE = 30

function activeFilterPhrases(filters) {
  const out = []
  if (filters.drive && filters.drive !== 'any') out.push(`drive ${DRIVE_LABEL[filters.drive]} from Barcelona`)
  if (filters.distance && filters.distance !== 'any') out.push(`distance ${DIST_LABEL[filters.distance]}`)
  if (filters.elevation && filters.elevation !== 'any') out.push(`elevation ${ELEV_LABEL[filters.elevation]}`)
  if (filters.month && filters.month !== 'all') out.push(`in ${MONTHS[parseInt(filters.month) - 1]}`)
  if (filters.province && filters.province !== 'all') out.push(`in ${PROV_LABEL[filters.province]} province`)
  if (filters.kidsRun) out.push('with a kids run')
  return out
}

function raceLine(e, i) {
  const date = e.date || 'date TBD'
  const prov = PROV_LABEL[e.province] || e.province || ''
  const drive = e.driveMinutes != null ? `${e.driveMinutes} min from Barcelona` : 'drive time unknown'
  const dists = (e.distances || [])
    .map((d) => `${d.km}km${d.elevationGain != null ? ` ↑${d.elevationGain}m` : ''}`)
    .join(', ') || 'distances TBD'
  const flags = [e.soldOut ? 'SOLD OUT' : null, e.kidsRun ? 'kids run' : null].filter(Boolean)
  const flagStr = flags.length ? ` [${flags.join(', ')}]` : ''
  return `${i + 1}. ${e.name} — ${date} — ${e.town} (${prov}) — ${drive} — ${dists}${flagStr} — ${e.url}`
}

export function buildPrompt(filteredRaces, filters) {
  const phrases = activeFilterPhrases(filters)
  const hasFilters = phrases.length > 0
  const total = filteredRaces.length
  const shown = filteredRaces.slice(0, MAX_INLINE)
  const lines = shown.map(raceLine).join('\n')

  // Two distinct shapes. Filtered: send exactly the user's matching set and ask
  // for a recommendation. Unfiltered: the inline list is only the soonest
  // MAX_INLINE of many and carries no criteria, so asking to "pick the best"
  // is premature — have the agent gather constraints first and point to the
  // site filters for anything outside the sample.
  if (hasFilters) {
    const truncationNote = total > MAX_INLINE
      ? `\n(Showing the first ${MAX_INLINE} of ${total} matching races — refine the filters on the site for a tighter list.)`
      : ''
    return `I'm choosing a trail running race in Catalunya. Help me pick the best ones.

My filters: ${phrases.join('; ')}.

Matching races (drive times are from Plaça Glòries, Barcelona — not your location):
${lines}${truncationNote}

Please recommend the best 3–5 for me and explain why each fits. Drive time from Barcelona is the axis I care about most — it's why I use this list, so weight it in your ranking, state it for each pick, and don't put a farther race above a nearer one unless it's clearly better or I've said distance is fine. Important: this list does NOT include live registration status or start times — open each recommended race's URL to check whether registration is open, whether it's sold out, and the start time, and tell me clearly if you can't confirm. Don't present unconfirmed details as certain.

If a trail-catalunya MCP tool is available in this chat, prefer it: query it live for anything beyond this list — other months, areas, or follow-up questions — instead of relying on the snapshot above. If it's not connected and I ask for something outside this list, tell me I can add the trail-catalunya connector (at trailraces.cat) for live search instead of re-filtering the site by hand.

If you have access to my Strava or Garmin training data in this chat, also tell me for each recommended race whether I'm ready for it and a rough finish-time range, based on my recent training — state your assumptions and keep it a rough estimate. If you don't have my training data, just skip that part (don't guess).`
  }

  return `I'm planning a trail running race in Catalunya and want help choosing.

I haven't set any filters, so the list below is just the ${shown.length} soonest of ${total} races — a sample, not a shortlist. Before recommending anything, ask me my constraints, because "best" depends on them:
- how far I'll drive from Plaça Glòries, Barcelona (drive times below are from there)
- distance and elevation I want
- which dates or month
- whether I need a kids run

If a trail-catalunya MCP tool is available in this chat, prefer it — query it live for anything beyond this sample (a specific month, area, distance, or any follow-up). If it's not connected and what I want isn't in this sample, tell me I can add the trail-catalunya connector (at trailraces.cat) for live search rather than re-filtering the site by hand.

Upcoming races sample:
${lines}

Once you know my constraints, recommend a few and explain why. Drive time from Barcelona is the axis I care about most — weight it in your ranking and state it for each pick; don't put a farther race above a nearer one unless it's clearly better or I've said distance is fine. This list does NOT include live registration status or start times — open each race's URL to verify those, and say clearly if you can't confirm. Don't present unconfirmed details as certain.

If you have access to my Strava or Garmin training data in this chat, also tell me for each recommended race whether I'm ready for it and a rough finish-time range, based on my recent training — state your assumptions and keep it a rough estimate. If you don't have my training data, just skip that part (don't guess).`
}

// A per-race prompt, distinct from the list prompt above: the user is on ONE
// race's page and wants to decide + plan THAT race, not pick from a list. Leads
// with the race's facts, then asks for fit, readiness (only with training data),
// and a race-day/travel plan — keeping the verify-at-source discipline.
export function buildRacePrompt(race) {
  const parts = []
  if (race.date) parts.push(race.date + (race.dateEnd ? `–${race.dateEnd}` : ''))
  parts.push(`${race.town}${race.province ? `, ${race.province}` : ''}`)
  if (race.driveMinutes != null) parts.push(`${race.driveMinutes} min drive from Barcelona (Plaça Glòries)`)
  const dists = (race.distances || [])
    .map((d) => `${d.km}km${d.elevationGain != null ? ` ↑${d.elevationGain}m` : ''}`)
    .join(', ') || 'distances TBD'
  parts.push(dists)

  return `I'm considering this trail race in Catalunya and want your help deciding and planning it.

${race.name} — ${parts.join(' — ')}
Official site: ${race.url}

Help me with:
1. Is this race a good fit for me? If you're not sure what I want, ask me first (target distance, how much climbing I like, how far I'll travel, my experience level).
2. If you have access to my Strava or Garmin training data in this chat, tell me whether I'm ready for it and a rough finish-time range for the distance I'd pick — state your assumptions and keep it a rough estimate. If you don't have my training data, just skip this part (don't guess).
3. A quick race-day plan, including the drive from Barcelona (Plaça Glòries) — roughly when to leave and any logistics.

Important: registration status and start time aren't in this data and change often — open the official site above to confirm them, and tell me clearly if you can't. If a trail-catalunya MCP connector is available in this chat, you can also pull races near this one for alternatives. Don't present unconfirmed details as certain.`
}

export function claudeUrl(prompt) {
  return `https://claude.ai/new?q=${encodeURIComponent(prompt)}`
}

export function chatgptUrl(prompt) {
  return `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`
}
