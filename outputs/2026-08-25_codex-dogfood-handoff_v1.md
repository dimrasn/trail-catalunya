# Handoff — independently dogfood the trail-catalunya MCP (unbiased pass)

**For:** an external agent (e.g. Codex), to run its **own** dogfood of the live
trail-races MCP and produce an independent gap list. The point is an unbiased
second view — so **form your own findings FIRST, before reading ours** (see the
last section). Today's date for judging "past/upcoming": **2026-08-25**.

## What the product is (so you can judge "good")

trailraces.cat aims to be the best AI-agent-friendly race-discovery layer for
Catalonia. A connected agent should be able to help a runner pick their next race:
- **Drive time from Barcelona is the primary axis** (`drive_minutes_from_barcelona`,
  measured from Plaça Glòries — NOT the user's location).
- **Difficulty** is on ITRA's published km-effort scale: a word
  (Easy/Moderate/Hard/Very hard/Extreme/Brutal), `itra_points` 0–6, `d_plus_per_km`.
- **Taste** is an honesty-labelled editorial layer (`taste_summary`, `taste_flags`
  {night, technicality}); organizer-tagged vs our_read/inference are distinct and
  must never be relayed as the organizer's claim.
- **"Best next race"**: the server instructions teach ranking a shortlist on drive
  time + difficulty + taste, fetching `get_race` only for finalists.
- **Readiness / projected finish** is composed *client-side* in the user's own agent
  by joining their training MCP — the server stores no training data and never
  fetches it.
- Honesty floor: registration status + start times are NOT in the data — the agent
  must tell the user to verify at the race url; never fabricate an attribute.

## The MCP under test

Public, authless JSON-RPC over HTTP (no key needed):
`https://qaebfhbdfjvzhmvcjroz.supabase.co/functions/v1/mcp`

- `tools/list` → the three tools + their input schemas.
- `tools/call` with `search_races` (filters: drive_min/max, dist_*, elev_*,
  dist_ranges/elev_ranges, province[], month[], difficulty[] {easy|moderate|hard|vh+},
  kids_run, date_from/date_to, limit), `whats_on` (date_from/date_to required + the
  same filters), `get_race` (`id` — a race's `id` from a search result; slug/url
  substrings also match).
- `initialize` returns the full agent INSTRUCTIONS — read them; part of the test is
  whether an agent following them can actually deliver.

Example call:
`{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_races","arguments":{"difficulty":["vh+"]}}}`

Read-only: this is the live prod MCP (it only reads). Don't attempt writes. If you
want to check the code behind a finding, read `origin/main` of the repo
(`supabase/functions/mcp/`), not the shared working tree (it's often on a feature
branch). The MCP was just redeployed (`ce161b5`); `initialize` serverInfo.build
should show that SHA.

## Your task

Act as a runner's connected agent and run a spread of **realistic** "find / plan my
next race" tasks — you design them; cover at least: near-BCN casual discovery; a
difficulty/distance-constrained goal; a vibe/taste goal (scenic, runnable, night,
family); a "best next race / something cool coming up" open request; a specific
race deep-dive; and at least one deliberately awkward ask (something the data
can't answer well) to test honest-unknown handling. For each, make the real tool
calls, look at what comes back, and judge: **could you give the runner a genuinely
good answer? What's missing, wrong, stale, un-rankable, or clumsy?**

## What to report

A ranked gap list, each item with: a one-line description; the **exact tool call**
and the salient part of the response (so it's reproducible); the **impact** on a
real user; and a tag — **fix-now** (a bug/parity break hurting a normal query) /
**enrich** (data-coverage) / **park**. Note what worked, too. Prefer a few decisive
findings over a long list. Judge honesty as strictly as correctness: a confidently
wrong recommendation is worse than a gap.

## Independence, then diff (do this in order)

1. Do the whole pass and **write your own gap list cold** — do not read our list
   until it's written.
2. **Then** read `docs/dogfood/2026-08-25-mcp-dogfood-gaps.md` (our internal
   agent-cold pass) and add a short **diff**: what you found that we missed, what we
   flagged that you'd downgrade/disagree with, and where you'd rank differently.
   That diff is the highest-value output — it's the blind-spot check.

Return your ranked gap list + the diff.
