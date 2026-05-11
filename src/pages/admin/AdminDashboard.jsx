import { useState, useEffect } from 'react'
import { Users, Stethoscope, MessageSquare, ClipboardList } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function token() { return localStorage.getItem('medivora_admin_token') || '' }

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '1.5rem',
      border: '1px solid #e8eef8', boxShadow: '0 2px 8px rgba(25,48,170,0.05)',
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#0A1B47', lineHeight: 1 }}>{value ?? '—'}</div>
        <div style={{ fontSize: 12, color: '#718096', marginTop: 4, fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then(r => r.json())
      .then(d => setStats(d.stats))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0A1B47', marginBottom: 4 }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: '#718096' }}>Platform overview at a glance</p>
      </div>

      {loading ? (
        <p style={{ color: '#a0aec0', fontSize: 14 }}>Loading stats…</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: '2rem' }}>
          <StatCard icon={Users}        label="Total Patients"      value={stats?.total_patients}  color="#1930AA" />
          <StatCard icon={Stethoscope}  label="Total Doctors"       value={stats?.total_doctors}   color="#00AFEF" />
          <StatCard icon={MessageSquare}label="Chat Sessions"       value={stats?.total_sessions}  color="#7C4DFF" />
          <StatCard icon={ClipboardList}label="Prescriptions"       value={stats?.total_prescriptions ?? '—'} color="#10b981" />
        </div>
      )}

      <div style={{
        background: '#fff', borderRadius: 14, padding: '1.5rem',
        border: '1px solid #e8eef8',
      }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0A1B47', marginBottom: 12 }}>Quick Links</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {[
            { label: 'View All Patients',  path: '/admin/patients' },
            { label: 'Manage Doctors',     path: '/admin/doctors'  },
            { label: 'Labs (Coming Soon)', path: null              },
            { label: 'Pharmacies (Coming Soon)', path: null        },
          ].map(item => (
            <a
              key={item.label}
              href={item.path || '#'}
              onClick={e => !item.path && e.preventDefault()}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: item.path ? '#f0f4ff' : '#f7f9fc',
                color: item.path ? '#1930AA' : '#a0aec0',
                textDecoration: 'none', border: `1px solid ${item.path ? '#c7d7ff' : '#e2e8f0'}`,
                cursor: item.path ? 'pointer' : 'default',
              }}
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
