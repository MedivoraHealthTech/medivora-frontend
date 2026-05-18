import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FlaskConical, Eye, EyeOff } from 'lucide-react'
import { useBreakpoint } from '../../hooks/useBreakpoint'

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8000'

export default function LabLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/portal/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Login failed')
      if (data.portal_type !== 'lab') throw new Error('Invalid portal credentials')
      localStorage.setItem('medivora_lab_token', data.token)
      localStorage.setItem('medivora_lab_user', JSON.stringify(data))
      navigate('/lab', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inp = {
    width: '100%', boxSizing: 'border-box',
    padding: '12px 16px', border: '1.5px solid #e2e8f0',
    borderRadius: 10, fontSize: 14, outline: 'none',
    fontFamily: 'inherit', background: '#fff', color: '#1a202c',
    transition: 'border-color 0.2s',
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)',
      fontFamily: "'Inter', system-ui, sans-serif", padding: isMobile ? 16 : 24,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: isMobile ? '2rem 1.5rem' : '2.5rem 2rem',
        width: '100%', maxWidth: 400,
        boxShadow: '0 8px 40px rgba(25,48,170,0.1)',
        border: '1px solid #bfdbfe',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #1D4ED8, #0EA5E9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 4px 16px rgba(29,78,216,0.3)',
          }}>
            <FlaskConical size={26} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e3a5f', marginBottom: 4 }}>
            Lab Portal
          </h1>
          <p style={{ fontSize: 13, color: '#718096' }}>Medivora — Diagnostics Dashboard</p>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, marginBottom: 16,
            background: '#fff5f5', border: '1px solid #fed7d7', color: '#c53030', fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4a5568', marginBottom: 6 }}>
              USERNAME
            </label>
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="medivora_lab" required style={inp}
              onFocus={e => e.target.style.borderColor = '#1D4ED8'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4a5568', marginBottom: 6 }}>
              PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••" required style={{ ...inp, paddingRight: 44 }}
                onFocus={e => e.target.style.borderColor = '#1D4ED8'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
              <button type="button" onClick={() => setShowPw(v => !v)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0', padding: 0,
              }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '13px 0', borderRadius: 10, fontSize: 14,
            fontWeight: 700, border: 'none', fontFamily: 'inherit',
            background: loading ? '#a0aec0' : 'linear-gradient(135deg, #1D4ED8, #0EA5E9)',
            color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 4px 16px rgba(29,78,216,0.3)',
            transition: 'all 0.2s',
          }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
