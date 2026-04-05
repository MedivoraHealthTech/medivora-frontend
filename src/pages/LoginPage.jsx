import { useState, useRef } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { Phone, ArrowLeft, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

/* ── shared input style ── */
const inp = {
  width: '100%', padding: '14px 18px', borderRadius: 12, fontSize: 15,
  border: '1.5px solid #d0daea', outline: 'none', background: '#ffffff',
  color: '#111111', fontFamily: 'var(--font)', boxSizing: 'border-box',
  transition: 'border-color 0.2s', display: 'block',
}

export default function LoginPage() {
  const [phone, setPhone]             = useState('')
  const [countryCode, setCountryCode] = useState('+91')
  const [otp, setOtp]                 = useState(['', '', '', '', '', ''])
  const [phoneStep, setPhoneStep]     = useState('input') // 'input' | 'otp'
  const [phoneError, setPhoneError]   = useState('')
  const [phoneLoading, setPhoneLoading] = useState(false)
  const otpRefs = useRef([])

  const { sendPhoneOtp, verifyPhoneOtp, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  if (!authLoading && isAuthenticated) return <Navigate to="/chat" replace />

  /* ── Send OTP ── */
  async function handleSendOtp(e) {
    e.preventDefault()
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 7) { setPhoneError('Please enter a valid phone number'); return }
    const full = `${countryCode}${digits}`
    setPhoneError(''); setPhoneLoading(true)
    try {
      await sendPhoneOtp(full)
      setOtp(['', '', '', '', '', ''])
      setPhoneStep('otp')
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch (err) {
      setPhoneError(err.message || 'Could not send OTP. Please try again.')
    } finally { setPhoneLoading(false) }
  }

  /* ── Verify OTP ── */
  async function handleVerifyOtp(e) {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) { setPhoneError('Please enter the complete 6-digit OTP'); return }
    const full = `${countryCode}${phone.replace(/\D/g, '')}`
    setPhoneError(''); setPhoneLoading(true)
    try {
      await verifyPhoneOtp(full, code)
      navigate('/chat', { replace: true })
    } catch (err) {
      setPhoneError(err.message || 'Incorrect OTP. Please try again.')
    } finally { setPhoneLoading(false) }
  }

  /* ── OTP box helpers ── */
  function handleOtpInput(val, idx) {
    const v = val.replace(/\D/g, '').slice(-1)
    const next = [...otp]; next[idx] = v; setOtp(next)
    if (v && idx < 5) otpRefs.current[idx + 1]?.focus()
  }
  function handleOtpKey(e, idx) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus()
  }
  function handleOtpPaste(e) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!text) return
    e.preventDefault()
    const next = Array(6).fill('')
    text.split('').forEach((ch, i) => { next[i] = ch })
    setOtp(next)
    otpRefs.current[Math.min(text.length, 5)]?.focus()
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f8fc', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
              <span style={{ color: '#1930AA' }}>Medi</span>
              <span style={{ color: '#00AFEF' }}>vora</span>
            </span>
          </Link>
          <p style={{ color: '#666666', fontSize: 14, marginTop: 10 }}>Welcome back — your health assistant is ready</p>
        </div>

        {/* Card */}
        <div style={{ padding: '40px 36px', borderRadius: 20, background: '#ffffff', border: '1.5px solid #e0eaf8', boxShadow: '0 4px 24px rgba(25,48,170,0.07)' }}>

          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111111', marginBottom: 6, textAlign: 'center', fontFamily: 'var(--serif)' }}>Log In</h2>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#666666', marginBottom: 28 }}>Sign in with your phone number</p>

          {phoneError && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,61,0,0.07)', border: '1px solid rgba(255,61,0,0.18)', color: '#d93a00', fontSize: 13, marginBottom: 16 }}>
              {phoneError}
            </div>
          )}

          {/* Step: enter phone */}
          {phoneStep === 'input' && (
            <form onSubmit={handleSendOtp}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#333333', marginBottom: 8 }}>Phone Number</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <select
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value)}
                  style={{ ...inp, width: 'auto', minWidth: 82, paddingLeft: 10, paddingRight: 6, cursor: 'pointer', background: '#f5f8fc', color: '#444444', flexShrink: 0 }}
                >
                  <option value="+91">🇮🇳 +91</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+971">🇦🇪 +971</option>
                  <option value="+61">🇦🇺 +61</option>
                  <option value="+65">🇸🇬 +65</option>
                </select>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Phone size={15} color="#aab" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    type="tel" placeholder="Phone number" required maxLength={10}
                    value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    style={{ ...inp, paddingLeft: 40 }}
                    onFocus={e => e.target.style.borderColor = '#1930AA'}
                    onBlur={e => e.target.style.borderColor = '#d0daea'}
                  />
                </div>
              </div>

              <button type="submit" disabled={phoneLoading} style={{
                width: '100%', padding: '14px 0', borderRadius: 12, fontSize: 14, fontWeight: 700,
                border: '2px solid #1930AA', background: phoneLoading ? '#f0f6ff' : '#ffffff',
                color: '#1930AA', cursor: phoneLoading ? 'wait' : 'pointer',
                fontFamily: 'var(--font)', opacity: phoneLoading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s',
              }}>
                {phoneLoading ? 'Sending OTP…' : <><Phone size={15} /><span>Send OTP</span></>}
              </button>
            </form>
          )}

          {/* Step: enter OTP */}
          {phoneStep === 'otp' && (
            <form onSubmit={handleVerifyOtp}>
              <button type="button"
                onClick={() => { setPhoneStep('input'); setOtp(['','','','','','']); setPhoneError('') }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#1930AA', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font)', marginBottom: 16, fontWeight: 600 }}>
                <ArrowLeft size={14} /> Change number
              </button>

              <p style={{ fontSize: 13, color: '#444444', marginBottom: 4, textAlign: 'center' }}>
                OTP sent to <strong style={{ color: '#111111' }}>{countryCode} {phone}</strong>
              </p>
              <p style={{ textAlign: 'center', fontSize: 12, color: '#00AFEF', marginBottom: 20 }}>
                <Shield size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />Expires in 10 minutes
              </p>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => otpRefs.current[idx] = el}
                    type="tel" maxLength={1} inputMode="numeric"
                    value={digit}
                    onChange={e => handleOtpInput(e.target.value, idx)}
                    onKeyDown={e => handleOtpKey(e, idx)}
                    onPaste={idx === 0 ? handleOtpPaste : undefined}
                    style={{
                      width: 46, height: 54, borderRadius: 12, textAlign: 'center',
                      fontSize: 22, fontWeight: 700, fontFamily: 'var(--font)',
                      border: `2px solid ${digit ? '#1930AA' : '#d0daea'}`,
                      background: digit ? '#f0f6ff' : '#ffffff',
                      color: '#111111', outline: 'none', transition: 'all 0.15s',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => e.target.style.borderColor = '#1930AA'}
                    onBlur={e => e.target.style.borderColor = digit ? '#1930AA' : '#d0daea'}
                  />
                ))}
              </div>

              <div style={{ textAlign: 'right', marginBottom: 20 }}>
                <button type="button" disabled={phoneLoading}
                  onClick={() => { setOtp(['','','','','','']); handleSendOtp({ preventDefault: () => {} }) }}
                  style={{ background: 'none', border: 'none', color: '#1930AA', cursor: 'pointer', fontWeight: 600, fontSize: 12, fontFamily: 'var(--font)', opacity: phoneLoading ? 0.5 : 1 }}>
                  Resend OTP
                </button>
              </div>

              <button type="submit" disabled={phoneLoading || otp.join('').length < 6} style={{
                width: '100%', padding: '15px 0', borderRadius: 12, fontSize: 15, fontWeight: 700,
                border: 'none', background: 'linear-gradient(135deg, #1930AA, #00AFEF)',
                color: '#ffffff', cursor: 'pointer', fontFamily: 'var(--font)',
                opacity: (phoneLoading || otp.join('').length < 6) ? 0.6 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'opacity 0.2s',
              }}>
                {phoneLoading ? 'Verifying…' : <><Shield size={15} /><span>Verify &amp; Sign In</span></>}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', fontSize: 13, color: '#666666', marginTop: 24 }}>
            Don&apos;t have an account?{' '}
            <Link to="/signup" style={{ color: '#00AFEF', fontWeight: 600 }}>Sign up free</Link>
          </p>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#666666', marginTop: 10 }}>
            Are you a doctor?{' '}
            <Link to="/doctor/login" style={{ color: '#1930AA', fontWeight: 600 }}>Doctor login →</Link>
          </p>

        </div>
      </div>
    </div>
  )
}
