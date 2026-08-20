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
        For a long time, picking a trail race in Catalunya was harder than running one.
        There were no real filters and never enough information, so every time I&apos;d find
        a race and then do all the work by hand — how far is it to drive, how much climbing,
        is it even the kind of race I want. Every single time. It should be the easy part,
        and it was the opposite.
      </p>

      <h2 style={h2}>Because the races are worth it</h2>
      <p style={p}>
        There are a lot of them, but only 20 or 30 are truly special — and those are one of
        a kind. Some take you through the most beautiful places in Catalunya; I love running
        the trails on Montserrat, and a lot of these races are really just an excuse to
        explore the national parks and corners of this region you&apos;d never see otherwise.
        Others are simpler — you run, and at the finish there&apos;s butifarra and a cold
        beer waiting. I love mountain races, and no two are the same.
      </p>
      <p style={p}>
        My favorite is the Burriac Atac — great atmosphere, a proper race, real support on
        course, good food after, and even the start pack is done right. That&apos;s the whole
        package, and it&apos;s what I&apos;m always chasing.
      </p>

      <h2 style={h2}>Why an AI, not just filters</h2>
      <p style={p}>
        Here&apos;s the honest problem: I can&apos;t tell you what filters you need. Distance,
        drive time, elevation — sure. But &ldquo;a race with a great atmosphere and good food
        after,&rdquo; &ldquo;somewhere I&apos;ve never been,&rdquo; &ldquo;something my kid can
        do too&rdquo; — those aren&apos;t checkboxes. That&apos;s what pulled me to LLMs. You
        can ask an assistant the questions that don&apos;t fit a filter, and it just answers.
        To me that&apos;s the most personal search there is, and I wanted to play with it.
      </p>

      <h2 style={h2}>Built for agents, on purpose</h2>
      <p style={p}>
        So the whole thing is built to be used by an AI, not just read by a person. The race
        database is exposed as a live{' '}
        <Link href="/for-agents" style={{ ...back, color: '#8a8aff' }}>MCP server</Link> — a
        connector you can add to your own Claude or ChatGPT. You ask &ldquo;find me a scenic
        20&nbsp;km race under an hour from Barcelona in October,&rdquo; and it queries the live
        data and plans for you. No copy-pasting, no stale screenshots.
      </p>
      <p style={p}>
        And because it&apos;s your assistant doing the work, it can combine this with things
        I&apos;ll never see. Connect a Strava or Garmin MCP alongside it and your AI can tell
        you whether you&apos;re ready for a given race and roughly what time you&apos;d run —
        joining your training with these races locally, in your session. Your training data
        never touches my server.
      </p>

      <h2 style={h2}>What it is</h2>
      <p style={p}>
        Honestly, a pet project. I built it for me first, but I want it to be useful to
        anyone trying to find and explore races here — and it&apos;s my way of iterating on
        what a running marketplace could actually feel like.
      </p>

      <h2 style={h2}>Kept honest</h2>
      <p style={p}>
        The data is re-scraped every week from the source calendars, so dates and new races
        stay current. It&apos;s not perfect — organizers change things, and some facts (start
        times, whether registration is open) are volatile. That&apos;s why the site and the
        agent both tell you to verify a shortlisted race at its official page before you count
        on it.
      </p>

      <p style={{ ...p, marginTop: '32px', color: '#9a9ab0' }}>
        — Dima
      </p>
    </main>
  )
}
