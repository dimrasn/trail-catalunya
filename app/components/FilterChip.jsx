// FdR chip: active = dark ink pill (state is weight + inversion, never colour
// alone). Difficulty chips pass their level tokens via activeBg/activeInk —
// the word is always present, so the colour never travels alone.
export default function FilterChip({ label, active, onClick, activeBg, activeInk }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        padding: '5px 12px',
        borderRadius: '999px',
        fontSize: '13px',
        fontWeight: active ? '600' : '400',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        border: '1px solid',
        borderColor: active ? 'transparent' : 'var(--fdr-border)',
        transition: 'background 0.1s, color 0.1s',
        backgroundColor: active ? (activeBg || 'var(--fdr-ink)') : 'var(--fdr-surface)',
        color: active ? (activeInk || 'var(--fdr-ink-inverse)') : 'var(--fdr-ink-muted)',
      }}
    >
      {label}
    </button>
  )
}
