import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Pill, ClipboardList, LogOut, Menu, X } from 'lucide-react'

const NAV = [
  { path: '/pharmacy', label: 'Orders', icon: ClipboardList },
]

export default function PharmacyLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  useEffect(() => { setOpen(false) }, [location.pathname])

  useEffect(() => {
    if (!localStorage.getItem('medivora_pharmacy_token')) {
      navigate('/pharmacy/login', { replace: true })
    }
  }, [navigate])

  function logout() {
    localStorage.removeItem('medivora_pharmacy_token')
    localStorage.removeItem('medivora_pharmacy_user')
    navigate('/pharmacy/login', { replace: true })
  }

  const user = (() => { try { return JSON.parse(localStorage.getItem('medivora_pharmacy_user') || '{}') } catch { return {} } })()

  const ACCENT = '#00875A'
  const BG = '#064e3b'

  const SidebarContent = () => (
    <>
      <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#00875A,#00C896)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Pill size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.3 }}>Pharmacy</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: 1 }}>MEDIVORA</div>
          </div>
        </div>
        {isMobile && (
          <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', padding: 4 }}>
            <X size={18} />
          </button>
        )}
      </div>

      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV.map(item => {
          const active = location.pathname === item.path
          return (
            <button key={item.path} onClick={() => navigate(item.path)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: active ? 'rgba(255,255,255,0.14)' : 'transparent', color: active ? '#fff' : 'rgba(255,255,255,0.65)', fontFamily: 'inherit', fontSize: 13, fontWeight: active ? 700 : 500, textAlign: 'left', width: '100%', transition: 'all 0.15s' }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <item.icon size={16} />{item.label}
            </button>
          )
        })}
      </nav>

      <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 8, paddingLeft: 4 }}>{user.name}</div>
        <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, width: '100%', transition: 'all 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,80,80,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
        >
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif", background: '#f0fdf4' }}>
      {!isMobile && (
        <aside style={{ width: 220, background: BG, color: '#fff', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100 }}>
          <SidebarContent />
        </aside>
      )}

      {isMobile && open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 199 }} />
          <aside style={{ width: 220, background: BG, color: '#fff', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 200 }}>
            <SidebarContent />
          </aside>
        </>
      )}

      <main style={{ marginLeft: isMobile ? 0 : 220, flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: BG, position: 'sticky', top: 0, zIndex: 100 }}>
            <button onClick={() => setOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 4, display: 'flex' }}>
              <Menu size={22} />
            </button>
            <Pill size={18} color="#00C896" />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Pharmacy Portal</span>
          </div>
        )}
        <div style={{ padding: isMobile ? 16 : '2rem', flex: 1 }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
