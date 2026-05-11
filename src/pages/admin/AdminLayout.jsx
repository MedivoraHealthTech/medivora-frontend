import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, Stethoscope, FlaskConical,
  ShoppingBag, LogOut, Shield, Menu, X,
} from 'lucide-react'
import Logo from '../../components/Logo'

const NAV = [
  { path: '/admin',           label: 'Dashboard',   icon: LayoutDashboard },
  { path: '/admin/patients',  label: 'Patients',    icon: Users },
  { path: '/admin/doctors',   label: 'Doctors',     icon: Stethoscope },
  { path: '/admin/labs',      label: 'Labs',        icon: FlaskConical,  soon: true },
  { path: '/admin/pharmacies',label: 'Pharmacies',  icon: ShoppingBag,   soon: true },
]

export default function AdminLayout() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [open, setOpen] = useState(false)

  // Guard — redirect if no token
  useEffect(() => {
    if (!localStorage.getItem('medivora_admin_token')) {
      navigate('/admin/login', { replace: true })
    }
  }, [navigate])

  function logout() {
    localStorage.removeItem('medivora_admin_token')
    localStorage.removeItem('medivora_admin_user')
    navigate('/admin/login', { replace: true })
  }

  const adminUser = (() => {
    try { return JSON.parse(localStorage.getItem('medivora_admin_user') || '{}') } catch { return {} }
  })()

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      fontFamily: "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif",
      background: '#f7f9fc',
    }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, background: '#0A1B47', color: '#fff',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
        transition: 'transform 0.25s',
      }}>
        {/* Brand */}
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Logo size={32} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.3 }}>Medivora</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: 1 }}>ADMIN PORTAL</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map(item => {
            const active = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => !item.soon && navigate(item.path)}
                disabled={item.soon}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10, border: 'none',
                  cursor: item.soon ? 'default' : 'pointer',
                  background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                  fontFamily: 'inherit', fontSize: 13, fontWeight: active ? 700 : 500,
                  textAlign: 'left', width: '100%',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!active && !item.soon) e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                <item.icon size={16} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.soon && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, background: 'rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.4)', padding: '2px 6px', borderRadius: 4,
                    letterSpacing: 0.5,
                  }}>SOON</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 8, paddingLeft: 4 }}>
            {adminUser.first_name} {adminUser.last_name}
          </div>
          <button onClick={logout} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 12px', borderRadius: 10, border: 'none',
            background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
            width: '100%', transition: 'all 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,80,80,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: 240, flex: 1, minHeight: '100vh', padding: '2rem' }}>
        <Outlet />
      </main>
    </div>
  )
}
