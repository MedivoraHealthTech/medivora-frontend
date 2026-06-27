import { useState } from 'react'
import { X, User, Phone, Mail, CheckCircle } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8000'

export default function WaitlistModal({ onClose }) {
  const [form, setForm]     = useState({ name: '', phone: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)
  const [done, setDone]     = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim())  { setError('Please enter your name.'); return }
    if (!form.phone.trim()) { setError('Please enter your phone number.'); return }
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API_BASE}/waitlist/patient`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim() || undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail || 'Something went wrong.')
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20, padding: '32px 28px',
          width: '100%', maxWidth: 420,
          boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
          position: 'relative',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 50,
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={16} color="#555" />
        </button>

        {done ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(16,185,129,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <CheckCircle size={32} color="#10b981" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111', margin: '0 0 8px' }}>
              You're on the list!
            </h2>
            <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, margin: '0 0 24px' }}>
              Thanks for your interest in Medivora. We'll reach out to you when we're ready to onboard new patients.
            </p>
            <button
              onClick={onClose}
              style={{
                padding: '10px 28px', borderRadius: 50, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #1930AA, #00AFEF)',
                color: '#fff', fontWeight: 700, fontSize: 14,
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111', margin: '0 0 6px' }}>
                Join the Waitlist
              </h2>
              <p style={{ fontSize: 14, color: '#666', margin: 0, lineHeight: 1.6 }}>
                Be among the first patients to access Medivora's AI-powered healthcare platform.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Name */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 6 }}>
                  Full Name <span style={{ color: '#e53e3e' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={15} color="#aaa" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={form.name}
                    onChange={set('name')}
                    style={{
                      width: '100%', padding: '10px 12px 10px 36px',
                      borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.12)',
                      fontSize: 14, color: '#333', outline: 'none',
                      boxSizing: 'border-box', background: '#fafafa',
                    }}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 6 }}>
                  Phone Number <span style={{ color: '#e53e3e' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={15} color="#aaa" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={set('phone')}
                    style={{
                      width: '100%', padding: '10px 12px 10px 36px',
                      borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.12)',
                      fontSize: 14, color: '#333', outline: 'none',
                      boxSizing: 'border-box', background: '#fafafa',
                    }}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 6 }}>
                  Email <span style={{ fontSize: 11, fontWeight: 400, color: '#999' }}>(optional)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} color="#aaa" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={set('email')}
                    style={{
                      width: '100%', padding: '10px 12px 10px 36px',
                      borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.12)',
                      fontSize: 14, color: '#333', outline: 'none',
                      boxSizing: 'border-box', background: '#fafafa',
                    }}
                  />
                </div>
              </div>

              {error && (
                <p style={{ fontSize: 13, color: '#e53e3e', margin: 0, background: 'rgba(229,62,62,0.06)', padding: '8px 12px', borderRadius: 8 }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px', borderRadius: 50, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  background: loading ? '#ccc' : 'linear-gradient(135deg, #1930AA, #00AFEF)',
                  color: '#fff', fontWeight: 700, fontSize: 14, marginTop: 4,
                  transition: 'opacity 0.2s',
                }}
              >
                {loading ? 'Submitting…' : 'Join the Waitlist'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
