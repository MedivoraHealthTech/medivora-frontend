export default function Logo({ size = 34 }) {
  return (
    <img
      src="/medivora-logo.png"
      alt="Medivora Logo"
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        display: 'block',
      }}
    />
  )
}
