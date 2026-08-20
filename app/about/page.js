import Link from 'next/link'

const TITLE = 'Why I built Trail Catalunya'
const DESCRIPTION =
  'One easy place to find the best trail races in Catalunya — built to be used ' +
  'by AI agents, not just read by people. Why it exists and how it works.'

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/about' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/about',
    siteName: 'Trail Catalunya',
    type: 'article',
    locale: 'en_US',
  },
}

const wrap = {
  maxWidth: '680px',
  margin: '0 auto',
  padding: '48px 20px 64px',
  lineHeight: 1.6,
}
const h1 = { fontSize: '28px', fontWeight: 700, marginBottom: '20px', letterSpacing: '-0.02em' }
const h2 = { fontSize: '18px', fontWeight: 700, margin: '32px 0 10px', color: '#e6e6ef' }
const p = { fontSize: '16px', color: '#c9c9d6', marginBottom: '14px' }
const back = { fontSize: '14px', color: '#8a8aff', textDecoration: 'underline' }

export default function AboutPage() {
  return (
    <main style={wrap}>
      <p style={{ marginBottom: '24px' }}>
        <Link href="/" style={back}>← All races</Link>
      </p>

      <h1 style={h1}>Why I built this</h1>

      <p style={p}>
        I run trails around Barcelona, and every season I ran into the same wall: there
        was no single place to answer a simple question — <em>what are the best races near
        me, on the weekends I&apos;m free, at a distance I actually want to run?</em> The
        calendars that exist are long lists. They don&apos;t tell you how far a race is
        from where you live, and they don&apos;t help you choose.
      </p>

      <p style={p}>
        So I built the thing I wanted: 200+ trail races in Catalunya in one place, each one
        tagged with how long it takes to drive there from Barcelona, its distance, its
        elevation gain, and the month — so you can filter down to the handful that fit your
        life instead of scrolling through everything.
      </p>

      <h2 style={h2}>The drive-time is the point</h2>
      <p style={p}>
        Nobody else publishes drive time from Barcelona per race, and it&apos;s the first
        thing that actually decides whether you enter a race. Every race here carries a
        real driving estimate from Plaça Glòries. That one field is what turns a calendar
        into a shortlist.
      </p>

      <h2 style={h2}>Built for agents, on purpose</h2>
      <p style={p}>
        The bigger bet: I wanted this to be usable by an AI, not just by a human reading a
        page. So the whole race database is exposed as a live{' '}
        <Link href="/for-agents" style={{ ...back, color: '#8a8aff' }}>MCP server</Link> —
        a connector you can add to your own Claude or ChatGPT. You ask your assistant
        &ldquo;find me a scenic 20&nbsp;km race under an hour from Barcelona in October,&rdquo;
        and it queries the live data and plans for you. No copy-pasting, no scraping, no
        stale screenshots.
      </p>
      <p style={p}>
        And because it&apos;s your assistant doing the work, it can combine this with things
        I&apos;ll never see. Connect a Strava or Garmin MCP alongside it and your AI can tell
        you whether you&apos;re ready for a given race and roughly what time you&apos;d run —
        joining your training with these races locally, in your session. Your training data
        never touches my server.
      </p>

      <h2 style={h2}>Kept honest</h2>
      <p style={p}>
        The data is re-scraped every week from the source calendars, so dates and new races
        stay current. It&apos;s not perfect — race organizers change things, and some facts
        (start times, whether registration is open) are volatile. That&apos;s why the site
        and the agent both tell you to verify a shortlisted race at its official page before
        you count on it. If you spot something wrong, the whole thing is open on{' '}
        <a href="https://github.com/dimrasn/trail-catalunya" style={{ ...back, color: '#8a8aff' }} rel="noopener">
          GitHub
        </a>{' '}— that&apos;s the correction channel.
      </p>

      <p style={{ ...p, marginTop: '32px', color: '#9a9ab0' }}>
        — Dima
      </p>
    </main>
  )
}
