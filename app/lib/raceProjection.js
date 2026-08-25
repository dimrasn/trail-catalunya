// Event-level projection for the AI handoff (Step 3, plan U2 / external review #6).
//
// A site race object carries distances + (server-attached) tasteSummary/tasteFlags,
// but NOT a computed difficulty — difficulty is derived from distances via format.js,
// and taste_summary/taste_flags are produced by the taste gate. This helper mirrors
// the MCP list projection ON THE SITE so the "best next race" prompt can rank on
// difficulty + taste without a fetch.
//
// Honesty rule (same as the MCP gate): OMIT any field that is unknown — never
// fabricate. taste_summary keeps its claim-strength label so the agent never relays
// our read as an organizer fact.
import { eventKmEffort, difficultyLevel, itraPoints, dPlusPerKm } from './format.js'

export function projectRaceForPrompt(ev) {
  const out = {}

  const kmEffort = eventKmEffort(ev && ev.distances)
  if (kmEffort != null) {
    out.difficulty = {
      level: difficultyLevel(kmEffort), // Easy · Moderate · Hard · Very hard · Extreme · Brutal
      itraPoints: itraPoints(kmEffort),
      kmEffort,
    }
    // Vertical density from the longest distance (distances are sorted longest-first
    // upstream), when its elevation is known.
    const longest = (ev.distances || [])[0]
    const dpk = longest ? dPlusPerKm(longest) : null
    if (dpk != null) out.difficulty.dPlusPerKm = dpk
  }

  // Server-attached in races.js from the raw taste profile (raw profile stays off
  // the client). { value, strength, strengthLabel } / { night?, technicality? }.
  if (ev && ev.tasteSummary && ev.tasteSummary.value) out.tasteSummary = ev.tasteSummary
  if (ev && ev.tasteFlags && Object.keys(ev.tasteFlags).length) out.tasteFlags = ev.tasteFlags

  return out
}
