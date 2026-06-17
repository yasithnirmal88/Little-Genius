export function Badge({ color, children }) {
  return (
    <span
      style={{
        background: `${color}22`,
        color,
        border: `1px solid ${color}44`,
        borderRadius: 20,
        padding: '2px 8px',
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  )
}
