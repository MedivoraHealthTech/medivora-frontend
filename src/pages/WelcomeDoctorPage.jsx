import { useState } from 'react'
import { apiFetch } from '../api/client'

export default function WelcomeDoctorPage() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Please enter your name.'); return }
    if (!/^\+?[0-9]{10,15}$/.test(phone.replace(/\s/g, ''))) {
      setError('Please enter a valid phone number.')
      return
    }
    setLoading(true)
    try {
      await apiFetch('/waitlist/doctor', {
        method: 'POST',
        body: { name: name.trim(), phone: phone.trim() },
      })
      setDone(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f5ff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '1.5rem',
        boxShadow: '0 8px 40px rgba(59,130,246,0.12)',
        padding: '3rem 2.5rem',
        width: '100%',
        maxWidth: '460px',
        textAlign: 'center',
      }}>
        {/* Logo / brand mark */}
        <div style={{
          width: 56, height: 56,
          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
          borderRadius: '1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
          boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" fill="rgba(255,255,255,0.2)" />
            <path d="M12 7v5l3 3" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <path d="M9 12h6M12 9v6" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        {done ? (
          /* ─── Thank-you state ─── */
          <div>
            <div style={{
              width: 72, height: 72,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 4px 20px rgba(16,185,129,0.3)',
              animation: 'popIn 0.4s cubic-bezier(.34,1.56,.64,1)',
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#111827', marginBottom: '0.75rem' }}>
              Thank you, Dr. {name.split(' ')[0]}!
            </h2>
            <p style={{ color: '#6b7280', fontSize: '1rem', lineHeight: 1.6 }}>
              We've received your details. Our team will reach out to you at <strong>{phone}</strong> to get you onboarded.
            </p>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '1rem' }}>
              Welcome to the Medivora network — we're excited to have you.
            </p>
          </div>
        ) : (
          /* ─── Form state ─── */
          <>
            <h1 style={{ fontSize: '1.7rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
              Join Medivora
            </h1>
            <p style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.5 }}>
              Register your interest and we'll contact you to complete your onboarding as a doctor.
            </p>

            <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.4rem' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Dr. Firstname Lastname"
                  required
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '0.75rem 1rem',
                    border: '1.5px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    fontFamily: 'inherit',
                  }}
                  onFocus={e => e.target.style.borderColor = '#3b82f6'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.4rem' }}>
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '0.75rem 1rem',
                    border: '1.5px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    fontFamily: 'inherit',
                  }}
                  onFocus={e => e.target.style.borderColor = '#3b82f6'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {error && (
                <p style={{
                  color: '#ef4444', fontSize: '0.875rem',
                  background: '#fef2f2', border: '1px solid #fecaca',
                  borderRadius: '0.5rem', padding: '0.6rem 0.9rem',
                  marginBottom: '1rem',
                }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  background: loading ? '#93c5fd' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 4px 16px rgba(59,130,246,0.35)',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                }}
              >
                {loading ? 'Submitting…' : 'Join the Waitlist'}
              </button>
            </form>

            <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: '1.5rem' }}>
              Already registered?{' '}
              <a href="/doctor/login" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}>
                Doctor Login
              </a>
            </p>
          </>
        )}
      </div>

      <style>{`
        @keyframes popIn {
          from { transform: scale(0.5); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  )
}
