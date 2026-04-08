import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import {
  LayoutDashboard, CalendarDays, ClipboardList, UserCircle,
  Bell, Moon, Sun, X, CheckCircle, Info, AlertTriangle, LogOut,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Logo from '../../components/Logo'

const navItems = [
  { id: 'dashboard',     label: 'Dashboard',     icon: LayoutDashboard, path: '/doctor' },
  { id: 'consultations', label: 'Consultations',  icon: CalendarDays,    path: '/doctor/consultations' },
  { id: 'prescriptions', label: 'Prescriptions',  icon: ClipboardList,   path: '/doctor/prescriptions' },
  { id: 'profile',       label: 'My Profile',     icon: UserCircle,      path: '/doctor/profile' },
]

const sampleNotifs = [
  { id: 1, type: 'info',    title: 'New Consultation Request', body: 'Patient Priya Sharma requested a consultation.', time: '5 min ago',  read: false },
  { id: 2, type: 'success', title: 'Prescription Approved',    body: 'Your prescription for Rohit Kumar was signed.', time: '1 hr ago',   read: false },
  { id: 3, type: 'warning', title: 'Pending Review',           body: '3 prescriptions are awaiting your review.',    time: '2 hrs ago',  read: true },
]

const notifIcon = type => {
  if (type === 'success') return <CheckCircle size={14} color='var(--ok)' />
  if (type === 'warning') return <AlertTriangle size={14} color='var(--warn)' />
  return <Info size={14} color='var(--cyan)' />
}

export default function DoctorLayout() {
  const { displayName, logout, getToken } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const { isMobile, isSmallScreen } = useBreakpoint()

  const [darkMode,   setDarkMode]   = useState(() => localStorage.getItem('darkMode') === 'true')
  const [notifOpen,  setNotifOpen]  = useState(false)
  const [notifs,     setNotifs]     = useState(sampleNotifs)
  const unreadCount = notifs.filter(n => !n.read).length

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('darkMode', String(darkMode))
  }, [darkMode])

  const handleLogout = () => { logout(); navigate('/') }
  const cleanName = displayName.replace(/^Dr\.\s*/i, '')
  const initials = cleanName.charAt(0).toUpperCase()
  const markRead = id => setNotifs(p => p.map(n => n.id === id ? { ...n, read: true } : n))
  const markAllRead = () => setNotifs(p => p.map(n => ({ ...n, read: true })))

  const borderCol  = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const sidebarBg  = darkMode ? '#161b22' : '#ffffff'
  const headerBg   = darkMode ? 'rgba(13,17,23,0.97)' : 'rgba(245,248,252,0.97)'

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--dark)', fontFamily: 'var(--font)' }}>

      {/* ── Header ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 12px' : '0 24px', height: 56, flexShrink: 0, zIndex: 100,
        borderBottom: `1px solid ${borderCol}`,
        background: headerBg, backdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Logo size={36} showText={true} />
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 50,
            background: 'rgba(25,48,170,0.1)', color: '#1930AA', letterSpacing: 0.5,
          }}>DOCTOR PORTAL</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: 5, marginRight: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ok)' }} />
            <span style={{ fontSize: 11, color: 'var(--ok)' }}>Online</span>
          </div>

          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setNotifOpen(o => !o)} style={{ ...btnIcon, background: notifOpen ? 'rgba(0,188,212,0.1)' : 'transparent' }}>
              <Bell size={15} color={notifOpen ? 'var(--cyan)' : 'var(--g500)'} />
              {unreadCount > 0 && <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: 'var(--err)', border: '1.5px solid var(--dark)' }} />}
            </button>
          </div>

          <button onClick={() => setDarkMode(d => !d)} style={{ ...btnIcon }}>
            {darkMode ? <Sun size={15} color='var(--cyan)' /> : <Moon size={15} color='var(--g500)' />}
          </button>

          <button onClick={() => navigate('/doctor/profile')} style={{
            width: 34, height: 34, borderRadius: '50%', border: '2px solid rgba(25,48,170,0.35)',
            background: 'linear-gradient(135deg, #1930AA, #00AFEF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginLeft: 6,
          }}>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{initials}</span>
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0, position: 'relative' }}>

        {/* ── Sidebar ── */}
        <aside style={{
          width: 220, flexShrink: 0, borderRight: `1px solid ${borderCol}`,
          background: sidebarBg, display: 'flex', flexDirection: 'column',
          padding: '20px 12px 24px', overflowY: 'auto',
        }} className="hide-mobile">

          {/* Doctor profile block */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 8px 20px', borderBottom: `1px solid ${borderCol}`, marginBottom: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #1930AA, #00AFEF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{initials}</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--g300)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Dr. {cleanName}
              </p>
              <p style={{ fontSize: 11, color: 'var(--cyan)', margin: 0 }}>Doctor</p>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20 }}>
            {navItems.map(item => {
              const isActive = location.pathname === item.path
              return (
                <button key={item.id} onClick={() => navigate(item.path)} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font)', fontSize: 14, fontWeight: isActive ? 600 : 500,
                  textAlign: 'left', transition: 'all 0.2s',
                  background: isActive ? 'rgba(25,48,170,0.07)' : 'transparent',
                  color: isActive ? '#1930AA' : 'var(--g400)',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  <item.icon size={18} color={isActive ? '#1930AA' : 'var(--g500)'} strokeWidth={isActive ? 2.2 : 1.8} />
                  {item.label}
                  {isActive && <span style={{ marginLeft: 'auto', color: '#1930AA' }}>›</span>}
                </button>
              )
            })}
          </nav>

          <div style={{ height: 1, background: borderCol, margin: '0 4px 16px' }} />

          {/* Logout */}
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10,
            border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 14, fontWeight: 500,
            background: 'transparent', color: 'var(--err)', textAlign: 'left', transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,61,0,0.06)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={18} color='var(--err)' strokeWidth={1.8} />
            Logout
          </button>
        </aside>

        {/* ── Main content ── */}
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          className={isSmallScreen ? 'has-bottom-nav' : ''}>
          <Outlet />
        </div>

        {/* ── Notifications overlay ── */}
        {notifOpen && (
          <div onClick={() => setNotifOpen(false)} style={{ position: 'absolute', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.25)' }} />
        )}
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: isMobile ? '100%' : 320, zIndex: 201,
          background: darkMode ? '#161b22' : '#ffffff',
          borderLeft: `1px solid ${borderCol}`,
          display: 'flex', flexDirection: 'column',
          transform: notifOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: notifOpen ? '-4px 0 24px rgba(0,0,0,0.12)' : 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${borderCol}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={15} color='var(--cyan)' />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--g300)' }}>Notifications</span>
              {unreadCount > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 50, background: 'var(--err)', color: '#fff' }}>{unreadCount}</span>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {unreadCount > 0 && <button onClick={markAllRead} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--cyan)' }}>Mark all read</button>}
              <button onClick={() => setNotifOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={16} color='var(--g500)' />
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {notifs.map(n => (
              <div key={n.id} onClick={() => markRead(n.id)} style={{
                padding: '12px 16px', cursor: 'pointer', transition: 'background 0.2s',
                background: n.read ? 'transparent' : (darkMode ? 'rgba(0,188,212,0.06)' : 'rgba(0,188,212,0.04)'),
                borderBottom: `1px solid ${borderCol}`,
              }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {notifIcon(n.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: n.read ? 500 : 700, color: 'var(--g300)' }}>{n.title}</span>
                      {!n.read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', flexShrink: 0 }} />}
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--g500)', margin: '0 0 4px', lineHeight: 1.45 }}>{n.body}</p>
                    <span style={{ fontSize: 10, color: 'var(--g700)' }}>{n.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile Bottom Navigation ── */}
      {isSmallScreen && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 300,
          height: 64, display: 'flex', alignItems: 'stretch',
          background: darkMode ? '#161b22' : '#ffffff',
          borderTop: `1px solid ${borderCol}`,
          boxShadow: '0 -2px 16px rgba(0,0,0,0.08)',
        }}>
          {navItems.map(item => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: 4, border: 'none', cursor: 'pointer',
                  background: 'transparent', fontFamily: 'var(--font)',
                  color: isActive ? '#1930AA' : 'var(--g500)',
                  borderTop: isActive ? '2px solid #1930AA' : '2px solid transparent',
                }}
              >
                <item.icon size={20} color={isActive ? '#1930AA' : 'var(--g500)'} strokeWidth={isActive ? 2.2 : 1.8} />
                <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
              </button>
            )
          })}
        </nav>
      )}

      <style>{`@media (max-width: 1023px) { .hide-mobile { display: none !important; } }`}</style>
    </div>
  )
}

const btnIcon = {
  position: 'relative', width: 32, height: 32, borderRadius: 8, background: 'transparent',
  border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', transition: 'background 0.25s',
}
