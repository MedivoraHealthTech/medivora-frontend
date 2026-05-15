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
      background: '#ffffff',
      borderBottom: '1px solid rgba(0,0,0,0.07)',
      boxShadow: scrolled ? '0 2px 16px rgba(0,0,0,0.06)' : 'none',
      transition: 'box-shadow 0.3s',
    }}>
      <div style={{
        height: 68,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 16px' : '0 32px',
        maxWidth: 1280,
        margin: '0 auto',
      }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 18,
            background: 'linear-gradient(135deg, #1930AA, #00AFEF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,175,239,0.35)',
            flexShrink: 0,
          }}>
            <Logo size={44} />
          </div>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#111111', letterSpacing: '-0.3px' }}>
            Medivora
          </span>
        </Link>

        {/* Desktop nav links — centered */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 36, position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            {navLinks.map(label => (
              <a
                key={label}
                href={`/#${label.toLowerCase()}`}
                style={{ fontSize: 14, fontWeight: 500, color: '#555555', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = '#111111'}
                onMouseLeave={e => e.target.style.color = '#555555'}
              >
                {label}
              </a>
            ))}
          </div>
        )}

        {/* Desktop auth */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
            {isAuthenticated ? (
              <>
                <span style={{ fontSize: 13, color: '#555555' }}>
                  {user?.user_metadata?.first_name || displayName?.split(' ')[0]}
                </span>
                <button onClick={handleLogout} style={{
                  padding: '8px 18px', borderRadius: 50, fontSize: 13, fontWeight: 600,
                  border: '1px solid rgba(0,0,0,0.12)', background: 'transparent',
                  color: '#444444', cursor: 'pointer', transition: 'border-color 0.2s',
                }}>
                  Logout
                </button>
                <Link to="/chat" style={{
                  padding: '9px 22px', borderRadius: 50, fontSize: 13, fontWeight: 700,
                  background: 'linear-gradient(135deg, #1930AA, #00AFEF)',
                  color: '#fff', textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(0,175,239,0.4)',
                }}>
                  AI Doctor
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" style={{
                  fontSize: 14, fontWeight: 500, color: '#333333', textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                  onMouseEnter={e => e.target.style.color = '#1930AA'}
                  onMouseLeave={e => e.target.style.color = '#333333'}
                >
                  Sign In
                </Link>
                <Link to="/signup" style={{
                  padding: '9px 22px', borderRadius: 50, fontSize: 13, fontWeight: 700,
                  background: 'linear-gradient(135deg, #1930AA, #00AFEF)',
                  color: '#fff', textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(0,175,239,0.35)',
                }}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        )}

        {/* Mobile hamburger */}
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
            <span style={{ display: 'block', width: 22, height: 2, background: '#444', borderRadius: 2, transition: 'all 0.25s', transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <span style={{ display: 'block', width: 22, height: 2, background: '#444', borderRadius: 2, transition: 'all 0.25s', opacity: menuOpen ? 0 : 1 }} />
            <span style={{ display: 'block', width: 22, height: 2, background: '#444', borderRadius: 2, transition: 'all 0.25s', transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
          </button>
        )}
      </div>

      {/* Mobile dropdown */}
      {isMobile && menuOpen && (
        <div style={{
          background: '#ffffff',
          borderTop: '1px solid rgba(0,0,0,0.07)',
          padding: '16px 20px 24px',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {navLinks.map(label => (
            <a
              key={label}
              href={`/#${label.toLowerCase()}`}
              onClick={() => setMenuOpen(false)}
              style={{
                fontSize: 15, fontWeight: 500, color: '#444444',
                textDecoration: 'none', padding: '12px 8px',
                borderBottom: '1px solid rgba(0,0,0,0.05)',
              }}
            >
              {label}
            </a>
          ))}

          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {isAuthenticated ? (
              <>
                <span style={{ fontSize: 13, color: '#555555', padding: '0 8px' }}>
                  {user?.user_metadata?.first_name || displayName?.split(' ')[0]}
                </span>
                <Link to="/chat" onClick={() => setMenuOpen(false)} style={{
                  padding: '12px 20px', borderRadius: 50, fontSize: 14, fontWeight: 700,
                  background: 'linear-gradient(135deg, #1930AA, #00AFEF)', color: '#fff',
                  textDecoration: 'none', textAlign: 'center',
                }}>
                  AI Doctor
                </Link>
                <button onClick={handleLogout} style={{
                  padding: '12px 20px', borderRadius: 50, fontSize: 14, fontWeight: 600,
                  border: '1px solid rgba(0,0,0,0.12)', background: 'transparent',
                  color: '#444444', cursor: 'pointer',
                }}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} style={{
                  padding: '12px 20px', borderRadius: 50, fontSize: 14, fontWeight: 600,
                  border: '1px solid rgba(0,0,0,0.12)', color: '#333333',
                  textDecoration: 'none', textAlign: 'center',
                }}>
                  Sign In
                </Link>
                <Link to="/signup" onClick={() => setMenuOpen(false)} style={{
                  padding: '12px 20px', borderRadius: 50, fontSize: 14, fontWeight: 700,
                  background: 'linear-gradient(135deg, #1930AA, #00AFEF)', color: '#fff',
                  textDecoration: 'none', textAlign: 'center',
                }}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
