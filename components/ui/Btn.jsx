export function Btn({ onClick, color = '#667eea', children, outline, style = {} }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: outline ? 'transparent' : color,
        color: outline ? color : 'white',
        border: `2px solid ${color}`,
        borderRadius: 10,
        padding: '8px 14px',
        fontWeight: 700,
        fontSize: 'clamp(11px, 1.5vw, 13px)',
        cursor: 'pointer',
        ...style,
      }}
    >
      {children}
    </button>
  )
}
