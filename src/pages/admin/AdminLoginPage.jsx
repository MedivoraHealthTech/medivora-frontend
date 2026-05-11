import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function AdminLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Login failed')
      localStorage.setItem('medivora_admin_token', data.token)
      localStorage.setItem('medivora_admin_user', JSON.stringify(data.admin))
      navigate('/admin', { replace: true })
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
      justifyContent: 'center', background: '#f0f4ff',
      fontFamily: "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif",
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '2.5rem 2rem',
        width: '100%', maxWidth: 400,
        boxShadow: '0 8px 40px rgba(25,48,170,0.1)',
        border: '1px solid #e0eaf8',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #1930AA, #00AFEF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <Shield size={24} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0A1B47', marginBottom: 4 }}>
            Admin Portal
          </h1>
          <p style={{ fontSize: 13, color: '#718096' }}>Medivora — Internal Dashboard</p>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, marginBottom: 16,
            background: '#fff5f5', border: '1px solid #fed7d7', color: '#c53030',
            fontSize: 13,
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
              placeholder="medivora_admin" required style={inp}
              onFocus={e => e.target.style.borderColor = '#1930AA'}
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
                onFocus={e => e.target.style.borderColor = '#1930AA'}
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
            background: loading ? '#a0aec0' : 'linear-gradient(135deg, #1930AA, #00AFEF)',
            color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 4px 16px rgba(25,48,170,0.3)',
            transition: 'all 0.2s',
          }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
