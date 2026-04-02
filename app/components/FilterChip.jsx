export default function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 12px',
        borderRadius: '999px',
        fontSize: '13px',
        fontWeight: active ? '600' : '400',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        border: 'none',
        transition: 'background 0.1s, color 0.1s',
        backgroundColor: active ? '#ffffff' : '#1a1a2e',
        color: active ? '#0a0a14' : '#aaaaaa',
      }}
    >
      {label}
    </button>
  )
}
