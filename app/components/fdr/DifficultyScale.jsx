import { LEVELS, LEVEL_ORDER } from '../../lib/semantics.js'

const SHORT = ['Easy', 'Mod', 'Hard', 'V.hard', 'Extreme', 'Brutal']

// Six segments, filled up to the race's level — position carries the rank,
// so the equal-lightness pastels never have to order themselves.
export default function DifficultyScale({ level }) {
  const idx = LEVEL_ORDER.indexOf(level)
  if (idx === -1) return null
  return (
    <div role="img" aria-label={`Difficulty ${level}, level ${idx + 1} of 6`}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '3px' }}>
        {LEVEL_ORDER.map((word, i) => (
          <div key={word} style={{
            height: '9px', borderRadius: '3px',
            background: i <= idx ? LEVELS[word].bg : 'var(--fdr-sunk)',
            border: i <= idx ? 'none' : '1px solid var(--fdr-border)',
          }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '3px', marginTop: '4px' }}>
        {SHORT.map((word, i) => (
          <span key={word} className="fdr-mono" style={{
            fontSize: '8.5px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.03em',
            color: i === idx ? 'var(--fdr-ink)' : 'var(--fdr-ink-faint)',
            fontWeight: i === idx ? 700 : 400,
          }}>{word}</span>
        ))}
      </div>
    </div>
  )
}
