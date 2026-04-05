export default function Logo({ size = 34 }) {
  return (
    <img
      src="/company-logo.jpeg"
      alt="Medivora Logo"
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        borderRadius: '6px',
        display: 'block',
      }}
    />
  )
}
