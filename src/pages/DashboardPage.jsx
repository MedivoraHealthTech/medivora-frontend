import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBreakpoint } from '../hooks/useBreakpoint'
import {
  MessageSquare, Users, ClipboardList, CalendarDays,
  Heart, Clock, FileText, Calendar,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from './supabase'
import { formatSpecialty } from '../utils/labels'

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8000'

async function getToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  } catch { return null }
}

function greeting(name) {
  const h = new Date().getHours()
  const tod = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
  return `Good ${tod}, ${name} 👋`
}

function fmtDate() {
  return new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtShort(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}

const statusColor = {
  pending:  { bg: 'rgba(255,160,0,0.12)',  color: '#e08000', label: 'Pending' },
  approved: { bg: 'rgba(0,200,83,0.12)',   color: '#00a040', label: 'Approved' },
  rejected: { bg: 'rgba(255,61,0,0.1)',    color: '#c0390a', label: 'Rejected' },
  expired:  { bg: 'rgba(120,120,120,0.1)', color: '#777',    label: 'Expired' },
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { displayName, session, initialized } = useAuth()
  const { isMobile, isTablet } = useBreakpoint()

  const [consultations, setConsultations] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!initialized) return
    ;(async () => {
      try {
        const token   = session?.access_token || await getToken()
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const [cRes, pRes] = await Promise.all([
          fetch(`${API_BASE}/consultation/my`, { headers }),
          fetch(`${API_BASE}/my/prescriptions`, { headers }),
        ])
        const cData = cRes.ok ? await cRes.json() : {}
        const pData = pRes.ok ? await pRes.json() : {}
        setConsultations(cData.sessions || [])
        setPrescriptions(pData.prescriptions || [])
      } catch { /* ignore */ }
      finally { setLoading(false) }
    })()
  }, [initialized])

  const pendingCount = prescriptions.filter(p => (p.status || '').toLowerCase() === 'pending').length

  /* ── Styles ── */
  const card = {
    background: '#fff', borderRadius: 14,
    border: '1px solid rgba(0,0,0,0.07)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#f0f4fa', fontFamily: 'var(--font)', padding: isMobile ? '16px' : isTablet ? '20px 24px' : '28px 32px', minHeight: 0 }}>

      {/* Greeting */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: '0 0 4px' }}>
          {greeting(displayName)}
        </h1>
        <p style={{ fontSize: 13, color: '#888', margin: 0 }}>{fmtDate()}</p>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { icon: <Calendar size={20} color="#1930AA" />, value: loading ? '—' : consultations.length, label: 'Total Consultations' },
          { icon: <FileText size={20} color="#7C3AED" />, value: loading ? '—' : prescriptions.length, label: 'Prescriptions' },
          { icon: <Clock size={20} color="#E08000" />, value: loading ? '—' : pendingCount, label: 'Pending Review' },
        ].map(({ icon, value, label }) => (
          <div key={label} style={{ ...card, padding: '20px 22px' }}>
            {icon}
            <div style={{ fontSize: 28, fontWeight: 800, color: '#111', margin: '10px 0 4px' }}>{value}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div style={{ marginBottom: 8 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#333', margin: '0 0 14px' }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 14 }}>
          {[
            { icon: MessageSquare, color: '#1930AA', bg: 'rgba(25,48,170,0.07)', label: 'Chat with AI', sub: 'Describe symptoms', path: '/chat' },
            { icon: Users,         color: '#0EA5E9', bg: 'rgba(14,165,233,0.07)', label: 'Find a Doctor',  sub: 'Book consultation', path: '/doctors' },
            { icon: ClipboardList, color: '#7C3AED', bg: 'rgba(124,58,237,0.07)', label: 'Prescriptions',  sub: 'View & download',   path: '/prescriptions' },
            { icon: CalendarDays,  color: '#059669', bg: 'rgba(5,150,105,0.07)',  label: 'Consultations',  sub: 'Past & upcoming',   path: '/consultations' },
          ].map(({ icon: Icon, color, bg, label, sub, path }) => (
            <div
              key={label}
              onClick={() => navigate(path)}
              style={{ ...card, padding: '22px 16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.18s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)' }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Icon size={20} color={color} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 11, color: '#999' }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom two panels ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginTop: 20 }}>

        {/* Recent Consultations */}
        <div style={{ ...card, padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Recent Consultations</span>
            <span onClick={() => navigate('/consultations')} style={{ fontSize: 12, color: '#1930AA', fontWeight: 600, cursor: 'pointer' }}>View all →</span>
          </div>
          {loading ? (
            <div style={{ height: 60, background: '#f5f5f5', borderRadius: 8 }} />
          ) : consultations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <CalendarDays size={32} color="#ddd" style={{ marginBottom: 10 }} />
              <p style={{ fontSize: 13, color: '#aaa', margin: '0 0 14px' }}>No consultations yet</p>
              <button
                onClick={() => navigate('/doctors')}
                style={{ padding: '9px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #1930AA, #00AFEF)', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}
              >
                Book Your First
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {consultations.slice(0, 3).map((c, i) => {
                const topic = c.patient_note || (c.specialty ? formatSpecialty(c.specialty) : '') || 'Consultation'
                const date  = c.created_at ? fmtShort(c.created_at) : '—'
                const st    = (c.status || 'requested').toLowerCase()
                const sc    = statusColor[st] || statusColor.pending
                return (
                  <div key={c.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: '#f8fafc', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#222' }}>{topic}</div>
                      <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{date}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: sc.bg, color: sc.color }}>{sc.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Prescriptions */}
        <div style={{ ...card, padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Prescriptions</span>
            <span onClick={() => navigate('/prescriptions')} style={{ fontSize: 12, color: '#1930AA', fontWeight: 600, cursor: 'pointer' }}>View all →</span>
          </div>
          {loading ? (
            <div style={{ height: 60, background: '#f5f5f5', borderRadius: 8 }} />
          ) : prescriptions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <ClipboardList size={32} color="#ddd" style={{ marginBottom: 10 }} />
              <p style={{ fontSize: 13, color: '#aaa', margin: 0 }}>No prescriptions yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {prescriptions.slice(0, 4).map((p, i) => {
                const st = (p.status || 'pending').toLowerCase()
                const sc = statusColor[st] || statusColor.pending
                const date = fmtShort(p.created_at)
                return (
                  <div key={p.id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: '#f8fafc', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: sc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Clock size={13} color={sc.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#222' }}>Prescription</div>
                      <div style={{ fontSize: 11, color: '#aaa' }}>{date}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: sc.bg, color: sc.color }}>{sc.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom CTA banner ── */}
    </div>
  )
}
