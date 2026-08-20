import Link from 'next/link'

const MCP_URL = 'https://qaebfhbdfjvzhmvcjroz.supabase.co/functions/v1/mcp'

const TITLE = 'Trail Catalunya for AI agents — the MCP server'
const DESCRIPTION =
  'Trail Catalunya exposes every trail race in Catalunya as a live MCP server. ' +
  'Connect it to Claude or ChatGPT to search races, get drive times from Barcelona, ' +
  'and — with a Strava or Garmin connector — estimate race readiness and finish time.'

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/for-agents' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/for-agents',
    siteName: 'Trail Catalunya',
    type: 'article',
    locale: 'en_US',
  },
}

const wrap = {
  maxWidth: '720px',
  margin: '0 auto',
  padding: '48px 20px 64px',
  lineHeight: 1.6,
}
const h1 = { fontSize: '28px', fontWeight: 700, marginBottom: '8px', letterSpacing: '-0.02em' }
const lede = { fontSize: '16px', color: '#9a9ab0', marginBottom: '28px' }
const h2 = { fontSize: '19px', fontWeight: 700, margin: '34px 0 8px', color: '#e6e6ef' }
const p = { fontSize: '16px', color: '#c9c9d6', marginBottom: '12px' }
const li = { fontSize: '16px', color: '#c9c9d6', marginBottom: '6px' }
const code = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: '14px',
  background: '#15152a',
  border: '1px solid #26264a',
  borderRadius: '6px',
  padding: '2px 6px',
  color: '#c9c9ff',
}
const codeBlock = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: '14px',
  background: '#15152a',
  border: '1px solid #26264a',
  borderRadius: '8px',
  padding: '12px 14px',
  color: '#c9c9ff',
  overflowX: 'auto',
  marginBottom: '14px',
}
const back = { fontSize: '14px', color: '#8a8aff', textDecoration: 'underline' }

// This page is written in an extractable Q&A shape on purpose: it's the most
// citable surface on the site for AI-search engines and for agents deciding
// whether to connect. Each heading is a question; each answer is self-contained.
export default function ForAgentsPage() {
  return (
    <main style={wrap}>
      <p style={{ marginBottom: '24px' }}>
        <Link href="/" style={back}>← All races</Link>
      </p>

      <h1 style={h1}>Trail Catalunya for AI agents</h1>
      <p style={lede}>
        A live, read-only MCP server for every trail race in Catalunya. Connect it to your
        own Claude or ChatGPT and plan races off current data.
      </p>

      <h2 style={h2}>What is this?</h2>
      <p style={p}>
        Trail Catalunya publishes 200+ trail-running races in Catalunya as a Model Context
        Protocol (MCP) server. Any MCP-capable assistant — Claude (any plan, including Free with
        a single custom connector) or ChatGPT on a paid plan (Plus and up) — can add it as a
        connector and query the live race database directly, instead of reading a static web page.
      </p>

      <h2 style={h2}>What is the server endpoint?</h2>
      <div style={codeBlock}>{MCP_URL}</div>
      <p style={p}>
        It&apos;s a public, no-auth, read-only HTTP MCP server (JSON-RPC, protocol version
        2025-03-26). No API key needed. Queries are logged anonymously — no IP, no identity —
        for 90 days to improve the tool.
      </p>

      <h2 style={h2}>How do I connect it?</h2>
      <ul style={{ paddingLeft: '20px', marginBottom: '12px' }}>
        <li style={li}>
          <strong>Claude:</strong> Settings → Connectors → Add custom connector → paste the
          URL above. On Team/Enterprise an Owner must add it first under Organization Settings →
          Connectors.
        </li>
        <li style={li}>
          <strong>ChatGPT:</strong> turn on Developer mode in settings (under Apps/Connectors),
          add a custom MCP server, and paste the URL above.
        </li>
      </ul>
      <p style={p}>
        The <Link href="/" style={{ ...back, color: '#8a8aff' }}>homepage</Link> also has an
        &ldquo;Ask AI&rdquo; button with the URL and copy-paste steps, plus a zero-setup path
        that sends the currently filtered races straight into a chat.
      </p>

      <h2 style={h2}>What tools does it expose?</h2>
      <ul style={{ paddingLeft: '20px', marginBottom: '12px' }}>
        <li style={li}>
          <code style={code}>search_races</code> — filter races by drive time from Barcelona,
          distance, elevation gain, month, province, and kids-run availability.
        </li>
        <li style={li}>
          <code style={code}>get_race</code> — full detail for one race: all distances, official
          URL, drive time from Barcelona, and data freshness.
        </li>
        <li style={li}>
          <code style={code}>whats_on</code> — the soonest upcoming races in a given window.
        </li>
      </ul>
      <p style={p}>
        Every race carries its distances (km + elevation gain in metres D+), a real driving
        estimate from Plaça Glòries in Barcelona (not the user&apos;s location), province,
        dates, and best-effort enriched facts.
      </p>

      <h2 style={h2}>Can it use my training data?</h2>
      <p style={p}>
        Yes — locally, in your session. If you also have a Strava or Garmin MCP connected to
        the same assistant, it can join your recent training with these races and add three
        things: <strong>race readiness</strong> (are you prepared for the distance and climb),
        a rough <strong>projected finish time</strong>, and a <strong>suitability ranking</strong>{' '}
        by fitness fit. Ask &ldquo;Am I ready for this race, and what time would I run?&rdquo;
      </p>
      <p style={p}>
        This join happens entirely inside your assistant. Your training data is never sent to
        this server — the server only takes race filters. If you don&apos;t have a training
        connector, add one to unlock this; without it, the assistant answers from race facts
        alone and won&apos;t guess.
      </p>

      <h2 style={h2}>Where does the data come from, and how fresh is it?</h2>
      <p style={p}>
        Races are re-scraped weekly from the Catalan trail-race calendars. Distances,
        elevation and dates are stable; volatile facts (start time, registration status,
        sold-out) should be verified at the race&apos;s official URL before you rely on them —
        the tools say so, and so should you.
      </p>

      <p style={{ marginTop: '36px' }}>
        <Link href="/about" style={back}>Why I built it →</Link>
      </p>
    </main>
  )
}
