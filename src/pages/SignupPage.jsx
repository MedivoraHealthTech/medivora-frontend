import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { ArrowRight, Mail, Lock, Eye, EyeOff, User, ArrowLeft, CheckCircle, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useBreakpoint } from '../hooks/useBreakpoint'

const inp = {
  width: '100%', padding: '14px 18px', borderRadius: 12, fontSize: 15,
  border: '1.5px solid #d0daea', outline: 'none', background: '#ffffff',
  color: '#111111', fontFamily: 'var(--font)', boxSizing: 'border-box',
  transition: 'border-color 0.2s', display: 'block',
}

const STEPS = ['Details', 'Password']

export default function SignupPage() {
  const { isMobile } = useBreakpoint()
  const [step, setStep]           = useState(1)   // 1=Details, 2=Password, 3=ConfirmEmail
  const [fullName, setFullName]   = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPwd, setShowPwd]     = useState(false)
  const [showCfm, setShowCfm]     = useState(false)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [resent, setResent]       = useState(false)
  const { signup, isAuthenticated, loading: authLoading } = useAuth()
  const navigate                  = useNavigate()

  // Already logged in — redirect away
  if (!authLoading && isAuthenticated) return <Navigate to="/chat" replace />

  function handleDetails(e) {
    e.preventDefault()
    if (!fullName.trim())         { setError('Please enter your full name'); return }
    if (!email.trim())            { setError('Please enter your email'); return }
    if (!email.includes('@'))     { setError('Please enter a valid email address'); return }
    setError('')
    setStep(2)
  }

  async function handleSignup(e) {
    e.preventDefault()
    if (password.length < 6)  { setError('Password must be at least 6 characters'); return }
    if (password !== confirm)  { setError('Passwords do not match'); return }
    setError(''); setLoading(true)
    try {
      await signup(email.trim(), password, fullName.trim())
      // Supabase sends a confirmation email — show the "check inbox" screen
      setStep(3)
    } catch (err) {
      setError(err.message || 'Could not create account. Please try again.')
    } finally { setLoading(false) }
  }

  async function handleResend() {
    setResent(false); setLoading(true)
    try {
      await signup(email.trim(), password, fullName.trim())
      setResent(true)
    } catch {
      // silently ignore — Supabase rate-limits duplicates
      setResent(true)
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f8fc', padding: isMobile ? 16 : 24 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
              <span style={{ color: '#1930AA' }}>Medi</span>
              <span style={{ color: '#00AFEF' }}>vora</span>
            </span>
          </Link>
          <p style={{ color: '#666666', fontSize: 14, marginTop: 10 }}>Start your health journey — completely free</p>
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
          {STEPS.map((label, i) => {
            const n = i + 1; const done = step > n; const active = step === n
            return (
              <div key={n} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  <div style={{
                    width: isMobile ? 26 : 30, height: isMobile ? 26 : 30, borderRadius: '50%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: isMobile ? 11 : 12, fontWeight: 700,
                    background: done ? '#00C853' : active ? '#1930AA' : '#e0eaf8',
                    color: done || active ? '#ffffff' : '#aab',
                  }}>{done ? '✓' : n}</div>
                  <span style={{ fontSize: isMobile ? 10 : 11, color: active ? '#1930AA' : done ? '#00C853' : '#aab', fontWeight: active || done ? 600 : 400 }}>{label}</span>
                </div>
                {n < 2 && <div style={{ width: 60, height: 2, background: step > n ? '#1930AA' : '#e0eaf8', margin: '0 6px', marginBottom: 20, borderRadius: 2 }} />}
              </div>
            )
          })}
        </div>

        {/* Card */}
        <div style={{ padding: isMobile ? '16px' : '36px 36px', width: '100%', borderRadius: 20, background: '#ffffff', border: '1.5px solid #e0eaf8', boxShadow: '0 4px 24px rgba(25,48,170,0.07)', boxSizing: 'border-box' }}>

          {/* ── Step 1: Name + Email ── */}
          {step === 1 && (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111111', marginBottom: 6, textAlign: 'center', fontFamily: 'var(--serif)' }}>Create Account</h2>
              <p style={{ textAlign: 'center', fontSize: 13, color: '#666666', marginBottom: 28 }}>Tell us a bit about yourself</p>

              {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,61,0,0.07)', border: '1px solid rgba(255,61,0,0.18)', color: '#d93a00', fontSize: 13, marginBottom: 16 }}>{error}</div>}

              <form onSubmit={handleDetails}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#333333', marginBottom: 8 }}>Full Name</label>
                <div style={{ position: 'relative', marginBottom: 18 }}>
                  <User size={16} color="#aab" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    placeholder="Your full name"
                    required
                    autoFocus
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    style={{ ...inp, paddingLeft: 44 }}
                    onFocus={e => e.target.style.borderColor = '#1930AA'}
                    onBlur={e => e.target.style.borderColor = '#d0daea'}
                  />
                </div>

                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#333333', marginBottom: 8 }}>Email Address</label>
                <div style={{ position: 'relative', marginBottom: 28 }}>
                  <Mail size={16} color="#aab" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{ ...inp, paddingLeft: 44 }}
                    onFocus={e => e.target.style.borderColor = '#1930AA'}
                    onBlur={e => e.target.style.borderColor = '#d0daea'}
                  />
                </div>

                <button type="submit" style={{
                  width: '100%', padding: '15px 0', borderRadius: 12, fontSize: 15, fontWeight: 700,
                  border: 'none', background: 'linear-gradient(135deg, #1930AA, #00AFEF)',
                  color: '#ffffff', cursor: 'pointer', fontFamily: 'var(--font)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  <span>Continue</span><ArrowRight size={15} />
                </button>
              </form>
            </>
          )}

          {/* ── Step 2: Password ── */}
          {step === 2 && (
            <>
              <button
                onClick={() => { setStep(1); setError('') }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#1930AA', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font)', marginBottom: 20, fontWeight: 600 }}
              >
                <ArrowLeft size={14} /> Back
              </button>

              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(25,48,170,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Lock size={22} color="#1930AA" />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111111', marginBottom: 4, fontFamily: 'var(--serif)' }}>Set a Password</h2>
                <p style={{ fontSize: 13, color: '#666666' }}>Creating account for <strong style={{ color: '#111' }}>{email}</strong></p>
              </div>

              {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,61,0,0.07)', border: '1px solid rgba(255,61,0,0.18)', color: '#d93a00', fontSize: 13, marginBottom: 16 }}>{error}</div>}

              <form onSubmit={handleSignup}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#333333', marginBottom: 8 }}>Password</label>
                <div style={{ position: 'relative', marginBottom: 18 }}>
                  <Lock size={16} color="#aab" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    required
                    autoFocus
                    autoComplete="new-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ ...inp, paddingLeft: 44, paddingRight: 44 }}
                    onFocus={e => e.target.style.borderColor = '#1930AA'}
                    onBlur={e => e.target.style.borderColor = '#d0daea'}
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#aab' }} tabIndex={-1}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#333333', marginBottom: 8 }}>Confirm Password</label>
                <div style={{ position: 'relative', marginBottom: 28 }}>
                  <Lock size={16} color="#aab" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    type={showCfm ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    required
                    autoComplete="new-password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    style={{ ...inp, paddingLeft: 44, paddingRight: 44 }}
                    onFocus={e => e.target.style.borderColor = '#1930AA'}
                    onBlur={e => e.target.style.borderColor = '#d0daea'}
                  />
                  <button type="button" onClick={() => setShowCfm(v => !v)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#aab' }} tabIndex={-1}>
                    {showCfm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: '15px 0', borderRadius: 12, fontSize: 15, fontWeight: 700,
                  border: 'none', background: 'linear-gradient(135deg, #1930AA, #00AFEF)',
                  color: '#ffffff', cursor: loading ? 'wait' : 'pointer',
                  fontFamily: 'var(--font)', opacity: loading ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'opacity 0.2s',
                }}>
                  {loading
                    ? 'Creating account…'
                    : <><CheckCircle size={15} /><span>Create My Account</span><ArrowRight size={15} /></>
                  }
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: 11, color: '#aaaaaa', marginTop: 18, lineHeight: 1.5 }}>
                By signing up, you agree to our Terms of Service and Privacy Policy.<br />
                Medivora is not a substitute for professional medical advice.
              </p>
            </>
          )}

          {/* ── Step 3: Confirm email ── */}
          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              {/* Envelope animation */}
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(25,48,170,0.1), rgba(0,175,239,0.12))',
                border: '2px solid rgba(0,175,239,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
              }}>
                <Mail size={32} color="#1930AA" />
              </div>

              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111111', marginBottom: 10, fontFamily: 'var(--serif)' }}>
                Check your inbox
              </h2>
              <p style={{ fontSize: 14, color: '#444444', lineHeight: 1.6, marginBottom: 6 }}>
                We sent a confirmation link to
              </p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#1930AA', marginBottom: 20, wordBreak: 'break-all' }}>
                {email}
              </p>
              <p style={{ fontSize: 13, color: '#666666', lineHeight: 1.6, marginBottom: 24 }}>
                Click the link in that email to verify your account, then come back here to log in.
              </p>

              {/* Resend */}
              {resent
                ? <p style={{ fontSize: 13, color: '#00C853', fontWeight: 600, marginBottom: 16 }}>✓ Confirmation email resent!</p>
                : (
                  <button type="button" onClick={handleResend} disabled={loading}
                    style={{ background: 'none', border: 'none', color: '#00AFEF', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'var(--font)', display: 'inline-flex', alignItems: 'center', gap: 6, opacity: loading ? 0.6 : 1, marginBottom: 16 }}>
                    <RefreshCw size={13} /> Resend confirmation email
                  </button>
                )
              }

              <Link to="/login" replace style={{
                display: 'block', width: '100%', padding: '14px 0', borderRadius: 12, fontSize: 15, fontWeight: 700,
                background: 'linear-gradient(135deg, #1930AA, #00AFEF)', color: '#ffffff',
                textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box',
                fontFamily: 'var(--font)',
              }}>
                Go to Login
              </Link>
            </div>
          )}

          {step < 3 && (
            <p style={{ textAlign: 'center', fontSize: 13, color: '#666666', marginTop: 24 }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#00AFEF', fontWeight: 600 }}>Log in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
