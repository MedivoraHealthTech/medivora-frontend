import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { Phone, ArrowLeft, Shield, Stethoscope } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useBreakpoint } from '../../hooks/useBreakpoint'

const inp = {
  width: '100%', padding: '14px 18px', borderRadius: 12, fontSize: 15,
  border: '1.5px solid #d0daea', outline: 'none', background: '#ffffff',
  color: '#111111', fontFamily: 'var(--font)', boxSizing: 'border-box',
  transition: 'border-color 0.2s', display: 'block',
}

export default function DoctorLoginPage() {
  const [phone,       setPhone]       = useState('')
  const [countryCode, setCountryCode] = useState('+91')
  const [otp,         setOtp]         = useState(['', '', '', '', '', ''])
  const [step,        setStep]        = useState('phone') // 'phone' | 'otp'
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [devOtp,      setDevOtp]      = useState('')   // shown in mock mode
  const [countdown,   setCountdown]   = useState(60)
  const [resendKey,   setResendKey]   = useState(0)
  const otpRefs = useRef([])

  useEffect(() => {
    if (step !== 'otp') return
    setCountdown(60)
    const id = setInterval(() => setCountdown(s => s > 0 ? s - 1 : 0), 1000)
    return () => clearInterval(id)
  }, [step, resendKey])

  const { sendDoctorOtp, verifyDoctorOtp, isAuthenticated, isDoctor, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()

  if (!authLoading && isAuthenticated && isDoctor) return <Navigate to="/doctor" replace />

  async function handleSendOtp(e) {
    e.preventDefault()
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 7) { setError('Please enter a valid phone number'); return }
    const full = `${countryCode}${digits}`
    setError(''); setLoading(true)
    try {
      await sendDoctorOtp(full)
      setOtp(['', '', '', '', '', ''])
      setStep('otp')
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch (err) {
      setError(err.message || 'Could not send OTP. Please try again.')
    } finally { setLoading(false) }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) { setError('Please enter the complete 6-digit OTP'); return }
    const full = `${countryCode}${phone.replace(/\D/g, '')}`
    setError(''); setLoading(true)
    try {
      await verifyDoctorOtp(full, code)
      navigate('/doctor', { replace: true })
    } catch (err) {
      setError(err.message || 'Incorrect OTP or no doctor account found.')
    } finally { setLoading(false) }
  }

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f8fc', padding: isMobile ? 16 : 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
              <span style={{ color: '#1930AA' }}>Medi</span>
              <span style={{ color: '#00AFEF' }}>vora</span>
            </span>
          </Link>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '4px 14px', borderRadius: 50, background: 'rgba(25,48,170,0.08)', color: '#1930AA' }}>
            <Stethoscope size={13} />
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>DOCTOR PORTAL</span>
          </div>
        </div>

        {/* Card */}
        <div style={{ padding: isMobile ? '16px' : '40px 36px', borderRadius: 20, background: '#ffffff', border: '1.5px solid #e0eaf8', boxShadow: '0 4px 24px rgba(25,48,170,0.07)', width: '100%', boxSizing: 'border-box' }}>

          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111111', marginBottom: 6, textAlign: 'center', fontFamily: 'var(--serif)' }}>Doctor Login</h2>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#666666', marginBottom: 28 }}>Sign in with your registered phone number</p>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,61,0,0.07)', border: '1px solid rgba(255,61,0,0.18)', color: '#d93a00', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          {/* Dev OTP hint */}
          {devOtp && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(0,175,239,0.07)', border: '1px solid rgba(0,175,239,0.2)', color: '#0077aa', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={13} />
              <span>Dev mode OTP: <strong>{devOtp}</strong></span>
            </div>
          )}

          {/* Step: enter phone */}
          {step === 'phone' && (
            <form onSubmit={handleSendOtp}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#333333', marginBottom: 8 }}>Registered Phone Number</label>
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

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '14px 0', borderRadius: 12, fontSize: 14, fontWeight: 700,
                border: '2px solid #1930AA', background: loading ? '#f0f6ff' : '#ffffff',
                color: '#1930AA', cursor: loading ? 'wait' : 'pointer',
                fontFamily: 'var(--font)', opacity: loading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s',
              }}>
                {loading ? 'Sending OTP…' : <><Phone size={15} /><span>Send OTP</span></>}
              </button>
            </form>
          )}

          {/* Step: enter OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp}>
              <button type="button"
                onClick={() => { setStep('phone'); setOtp(['','','','','','']); setError(''); setDevOtp('') }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#1930AA', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font)', marginBottom: 16, fontWeight: 600 }}>
                <ArrowLeft size={14} /> Change number
              </button>

              <p style={{ fontSize: 13, color: '#444444', marginBottom: 4, textAlign: 'center' }}>
                OTP sent to <strong style={{ color: '#111111' }}>{countryCode} {phone}</strong>
              </p>
              <p style={{ textAlign: 'center', fontSize: 12, color: countdown === 0 ? '#d93a00' : '#00AFEF', marginBottom: 20 }}>
                <Shield size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                {countdown > 0 ? `Expires in 0:${String(countdown).padStart(2, '0')}` : 'OTP expired — please resend'}
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
                <button type="button" disabled={loading || countdown > 0}
                  onClick={() => { setOtp(['','','','','','']); setResendKey(k => k + 1); handleSendOtp({ preventDefault: () => {} }) }}
                  style={{ background: 'none', border: 'none', color: '#1930AA', cursor: (loading || countdown > 0) ? 'default' : 'pointer', fontWeight: 600, fontSize: 12, fontFamily: 'var(--font)', opacity: (loading || countdown > 0) ? 0.35 : 1 }}>
                  Resend OTP
                </button>
              </div>

              <button type="submit" disabled={loading || otp.join('').length < 6} style={{
                width: '100%', padding: '15px 0', borderRadius: 12, fontSize: 15, fontWeight: 700,
                border: 'none', background: 'linear-gradient(135deg, #1930AA, #00AFEF)',
                color: '#ffffff', cursor: 'pointer', fontFamily: 'var(--font)',
                opacity: (loading || otp.join('').length < 6) ? 0.6 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'opacity 0.2s',
              }}>
                {loading ? 'Verifying…' : <><Shield size={15} /><span>Verify &amp; Sign In</span></>}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', fontSize: 13, color: '#666666', marginTop: 24 }}>
            Patient?{' '}
            <Link to="/login" style={{ color: '#00AFEF', fontWeight: 600 }}>Login here</Link>
          </p>

        </div>
      </div>
    </div>
  )
}
