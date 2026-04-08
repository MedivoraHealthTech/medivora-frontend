import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'
import { useBreakpoint } from '../hooks/useBreakpoint'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { isAuthenticated, user, logout, displayName } = useAuth()
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  // Close menu when switching from mobile to desktop
  useEffect(() => {
    if (!isMobile) setMenuOpen(false)
  }, [isMobile])

  const handleLogout = () => {
    logout()
    navigate('/')
    setMenuOpen(false)
  }

  const navLinks = ['Features', 'Pricing', 'Contact']

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: scrolled ? 'rgba(6,14,31,0.95)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(0,188,212,0.06)' : 'none',
      transition: 'all 0.4s',
    }}>
      {/* Main bar */}
      <div style={{
        height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 16px' : '0 32px',
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <Logo size={30} />
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.5 }}>
            <span style={{ color: 'var(--blue)' }}>Medi</span>
            <span style={{ color: 'var(--cyan)' }}>vora</span>
          </span>
        </Link>

        {/* Desktop nav */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {navLinks.map(label => (
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
        )}

        {/* Mobile: hamburger */}
        {isMobile && (
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              alignItems: 'center', gap: 5, padding: 8, width: 40, height: 40,
            }}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <span style={{ display: 'block', width: 22, height: 2, background: 'var(--g400)', borderRadius: 2, transition: 'all 0.25s', transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <span style={{ display: 'block', width: 22, height: 2, background: 'var(--g400)', borderRadius: 2, transition: 'all 0.25s', opacity: menuOpen ? 0 : 1 }} />
            <span style={{ display: 'block', width: 22, height: 2, background: 'var(--g400)', borderRadius: 2, transition: 'all 0.25s', transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
          </button>
        )}
      </div>

      {/* Mobile dropdown drawer */}
      {isMobile && menuOpen && (
        <div style={{
          background: scrolled ? 'rgba(6,14,31,0.98)' : 'rgba(6,14,31,0.97)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(0,188,212,0.08)',
          padding: '16px 16px 24px',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {navLinks.map(label => (
            <a
              key={label}
              href={`/#${label.toLowerCase()}`}
              onClick={() => setMenuOpen(false)}
              style={{
                fontSize: 15, fontWeight: 500, color: 'var(--g400)',
                textDecoration: 'none', padding: '12px 8px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              {label}
            </a>
          ))}

          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {isAuthenticated ? (
              <>
                <span style={{ fontSize: 13, color: 'var(--g400)', padding: '0 8px' }}>
                  {user?.user_metadata?.first_name || displayName?.split(' ')[0]}
                </span>
                <Link to="/chat" onClick={() => setMenuOpen(false)} style={{
                  padding: '12px 20px', borderRadius: 50, fontSize: 14, fontWeight: 700,
                  background: 'linear-gradient(135deg, var(--blue), var(--cyan))', color: '#fff',
                  textDecoration: 'none', textAlign: 'center',
                }}>
                  AI Doctor
                </Link>
                <button onClick={handleLogout} style={{
                  padding: '12px 20px', borderRadius: 50, fontSize: 14, fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.12)', background: 'transparent',
                  color: 'var(--g400)', cursor: 'pointer',
                }}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} style={{
                  padding: '12px 20px', borderRadius: 50, fontSize: 14, fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.12)', color: 'var(--g300)',
                  textDecoration: 'none', textAlign: 'center',
                }}>
                  Log in
                </Link>
                <Link to="/signup" onClick={() => setMenuOpen(false)} style={{
                  padding: '12px 20px', borderRadius: 50, fontSize: 14, fontWeight: 700,
                  background: 'linear-gradient(135deg, var(--blue), var(--cyan))', color: '#fff',
                  textDecoration: 'none', textAlign: 'center',
                }}>
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
