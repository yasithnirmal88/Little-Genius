export function Input({ value, onChange, placeholder, style = {}, type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        border: '1.5px solid #e0e0e0',
        borderRadius: 10,
        padding: '10px 12px',
        fontSize: 'clamp(12px, 2vw, 14px)',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
        ...style,
      }}
    />
  )
}
