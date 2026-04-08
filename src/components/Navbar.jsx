import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const { isAuthenticated, user, logout, displayName } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100, height: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px',
      background: scrolled ? 'rgba(6,14,31,0.95)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(0,188,212,0.06)' : 'none',
      transition: 'all 0.4s',
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
        <Logo size={30} />
        <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.5 }}>
          <span style={{ color: 'var(--blue)' }}>Medi</span>
          <span style={{ color: 'var(--cyan)' }}>vora</span>
        </span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        {['Features', 'Pricing', 'Contact'].map(label => (
          <a key={label} href={`/#${label.toLowerCase()}`}
            style={{ fontSize: 13, fontWeight: 500, color: 'var(--g400)', textDecoration: 'none', transition: 'color 0.3s' }}
            onMouseEnter={e => e.target.style.color = 'var(--cyan)'}
            onMouseLeave={e => e.target.style.color = 'var(--g400)'}>
            {label}
          </a>
        ))}

        {isAuthenticated ? (
          <>
            <span style={{ fontSize: 12, color: 'var(--g400)' }}>
              {user?.user_metadata?.first_name || displayName?.split(' ')[0]}
            </span>
            <button onClick={handleLogout} style={{
              padding: '7px 16px', borderRadius: 50, fontSize: 12, fontWeight: 600,
              border: '1px solid rgba(255,255,255,0.08)', background: 'transparent',
              color: 'var(--g400)', cursor: 'pointer',
            }}>
              Logout
            </button>
            <Link to="/chat" style={{
              padding: '9px 24px', borderRadius: 50, fontSize: 13, fontWeight: 700,
              background: 'linear-gradient(135deg, var(--blue), var(--cyan))', color: '#fff',
              textDecoration: 'none',
            }}>
              AI Doctor
            </Link>
          </>
        ) : (
          <>
            <Link to="/login" style={{ fontSize: 13, fontWeight: 600, color: 'var(--g300)', textDecoration: 'none' }}>
              Log in
            </Link>
            <Link to="/signup" style={{
              padding: '9px 24px', borderRadius: 50, fontSize: 13, fontWeight: 700,
              background: 'linear-gradient(135deg, var(--blue), var(--cyan))', color: '#fff',
              textDecoration: 'none',
            }}>
              Get Started Free
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
