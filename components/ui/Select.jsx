export function Select({ value, onChange, options, style = {} }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        border: '1.5px solid #e0e0e0',
        borderRadius: 10,
        padding: '10px 12px',
        fontSize: 'clamp(12px, 2vw, 14px)',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
        background: 'white',
        ...style,
      }}
    >
      {options.map((o) => (
        <option key={o.value ?? o} value={o.value ?? o}>
          {o.label ?? o}
        </option>
      ))}
    </select>
  )
}
