import { useEffect } from 'react'
import { X, Sparkles, Clock } from 'lucide-react'

export default function ComingSoonModal({ onClose, feature = '' }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, fontFamily: 'var(--font)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 380, borderRadius: 20,
          background: '#ffffff', boxShadow: '0 24px 64px rgba(25,48,170,0.18)',
          border: '1.5px solid rgba(25,48,170,0.1)',
          padding: '32px 28px 28px', textAlign: 'center', position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 14,
            background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: 8,
            width: 30, height: 30, display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: '#888',
          }}
        >
          <X size={15} />
        </button>

        <div style={{
          width: 60, height: 60, borderRadius: '50%', margin: '0 auto 18px',
          background: 'linear-gradient(135deg, rgba(25,48,170,0.1), rgba(0,175,239,0.1))',
          border: '1.5px solid rgba(0,175,239,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Clock size={26} color="#00AFEF" />
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: '#1930AA',
          background: 'rgba(25,48,170,0.07)', padding: '4px 12px',
          borderRadius: 50, marginBottom: 14,
        }}>
          <Sparkles size={11} /> Coming Soon
        </div>

        <h2 style={{
          fontSize: 20, fontWeight: 800, color: '#111111',
          margin: '0 0 10px', fontFamily: 'var(--serif)',
        }}>
          {feature || 'This feature'} is on the way!
        </h2>

        <p style={{ fontSize: 14, color: '#666666', lineHeight: 1.65, margin: '0 0 24px' }}>
          We're working hard to bring this to you. Stay tuned for updates!
        </p>

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '13px 0', borderRadius: 12,
            border: 'none', background: 'linear-gradient(135deg, #1930AA, #00AFEF)',
            color: '#ffffff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'var(--font)',
          }}
        >
          Got it
        </button>
      </div>
    </div>
  )
}
