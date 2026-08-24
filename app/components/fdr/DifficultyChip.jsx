import { difficultyToken } from '../../lib/semantics.js'

// Word + km-effort number, always together — colour never travels alone.
// There is deliberately no way to hide the label.
export default function DifficultyChip({ level, effort, size = 'md' }) {
  const t = difficultyToken(level)
  const word = level || 'Unrated'
  const num = effort != null ? effort : '—'
  const pad = size === 'sm' ? '4px 8px' : '7px 10px'
  const numSize = size === 'sm' ? '14px' : '18px'
  return (
    <span
      aria-label={`Difficulty: ${word}${effort != null ? `, ${effort} km-effort` : ''}`}
      style={{
        display: 'inline-flex', flexDirection: 'column', gap: '1px', padding: pad,
        borderRadius: 'var(--fdr-radius-sm)', background: t.bg, color: t.ink,
      }}
    >
      <span className="fdr-mono" style={{ fontSize: numSize, fontWeight: 700, lineHeight: 1 }}>{num}</span>
      <span className="fdr-mono" style={{ fontSize: '8.5px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'inherit', opacity: 0.9 }}>
        {word}
      </span>
    </span>
  )
}
