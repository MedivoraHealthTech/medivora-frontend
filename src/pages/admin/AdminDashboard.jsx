import { useState, useEffect } from 'react'
import {
  Users, Stethoscope, MessageSquare, ClipboardList,
  Activity, TrendingUp, Heart, UserCheck,
} from 'lucide-react'

const API_BASE = '/api'
function token() { return localStorage.getItem('medivora_admin_token') || '' }

// ── Palette ───────────────────────────────────────────────────────────────────
const PALETTE = [
  '#1930AA', '#00AFEF', '#10b981', '#f59e0b', '#8b5cf6',
  '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#f97316',
]

// ── Donut Chart (pure SVG) ────────────────────────────────────────────────────
function DonutChart({ data = [], size = 160, thickness = 36, centerLabel }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (!total) return <div style={{ height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0aec0', fontSize: 13 }}>No data</div>

  const r = (size - thickness) / 2
  const cx = size / 2
  const cy = size / 2
  const circ = 2 * Math.PI * r

  let cumulative = 0
  const slices = data.map((d, i) => {
    const pct = d.value / total
    const dash = pct * circ
    const gap  = circ - dash
    const offset = circ - cumulative * circ
    cumulative += pct
    return { ...d, dash, gap, offset, color: PALETTE[i % PALETTE.length] }
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <svg width={size} height={size} style={{ flexShrink: 0 }}>
        {slices.map((s, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={s.offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray 0.4s ease' }}
          />
        ))}
        {centerLabel && (
          <>
            <text x={cx} y={cy - 8} textAnchor="middle" fontSize={22} fontWeight={800} fill="#0A1B47">{total}</text>
            <text x={cx} y={cy + 12} textAnchor="middle" fontSize={11} fill="#718096">{centerLabel}</text>
          </>
        )}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ color: '#4a5568' }}>{s.label}</span>
            <span style={{ marginLeft: 'auto', fontWeight: 700, color: '#0A1B47', paddingLeft: 8 }}>
              {s.value} <span style={{ color: '#a0aec0', fontWeight: 400 }}>({Math.round(s.value / total * 100)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Horizontal Bar Chart (pure SVG) ──────────────────────────────────────────
function BarChart({ data = [], color = '#1930AA', maxBarWidth = 240, rowH = 36 }) {
  if (!data.length) return <div style={{ color: '#a0aec0', fontSize: 13 }}>No data</div>
  const maxVal = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {data.map((d, i) => {
        const barW = Math.max((d.value / maxVal) * maxBarWidth, d.value > 0 ? 4 : 0)
        const c = Array.isArray(color) ? PALETTE[i % PALETTE.length] : color
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, height: rowH }}>
            <div style={{ width: 110, fontSize: 12, color: '#4a5568', textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label}</div>
            <div style={{ flex: 1, height: 20, background: '#f0f4ff', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{
                width: barW, height: '100%', background: c,
                borderRadius: 6, transition: 'width 0.5s ease',
                display: 'flex', alignItems: 'center',
              }} />
            </div>
            <div style={{ width: 28, fontSize: 12, fontWeight: 700, color: '#0A1B47', flexShrink: 0 }}>{d.value}</div>
          </div>
        )
      })}
    </div>
  )
}

// ── Grouped Month Bar Chart ───────────────────────────────────────────────────
function MonthlyChart({ data = [] }) {
  if (!data.length) return null
  const maxVal = Math.max(...data.map(d => Math.max(d.patients, d.consultations)), 1)
  const barH = 100
  const barW = 18
  const gap  = 4
  const groupW = barW * 2 + gap + 16

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#4a5568' }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: '#1930AA' }} /> Patients
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#4a5568' }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: '#10b981' }} /> Consultations
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap }}>
              <div style={{
                width: barW,
                height: Math.max((d.patients / maxVal) * barH, d.patients > 0 ? 4 : 0),
                background: '#1930AA', borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease',
              }} title={`${d.patients} patients`} />
              <div style={{
                width: barW,
                height: Math.max((d.consultations / maxVal) * barH, d.consultations > 0 ? 4 : 0),
                background: '#10b981', borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease',
              }} title={`${d.consultations} consultations`} />
            </div>
            <div style={{ fontSize: 11, color: '#718096', fontWeight: 600 }}>{d.month}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Card wrapper ──────────────────────────────────────────────────────────────
function Card({ title, subtitle, children, span = 1 }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '20px 22px',
      border: '1px solid #e8eef8', boxShadow: '0 2px 8px rgba(25,48,170,0.04)',
      gridColumn: span > 1 ? `span ${span}` : undefined,
    }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0A1B47' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: '#a0aec0', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  )
}

// ── KPI stat card ─────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '18px 20px',
      border: '1px solid #e8eef8', boxShadow: '0 2px 8px rgba(25,48,170,0.05)',
      display: 'flex', alignItems: 'flex-start', gap: 14,
    }}>
      <div style={{
        width: 46, height: 46, borderRadius: 12,
        background: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
      }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#0A1B47', lineHeight: 1 }}>{value ?? '—'}</div>
        <div style={{ fontSize: 12, color: '#718096', marginTop: 4, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: '#a0aec0', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [data,    setData]    = useState(null)
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const h = { Authorization: `Bearer ${token()}` }
    Promise.all([
      fetch(`${API_BASE}/admin/stats`,     { headers: h }).then(r => r.json()),
      fetch(`${API_BASE}/admin/analytics`, { headers: h }).then(r => r.json()),
    ])
      .then(([s, a]) => { setStats(s.stats); setData(a) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ padding: 32, color: '#a0aec0', fontSize: 14 }}>Loading analytics…</div>
  )

  const p = data?.patients        || {}
  const c = data?.consultations   || {}
  const d = data?.doctors         || {}
  const s = data?.sessions        || {}
  const px = data?.prescriptions  || {}
  const mg = data?.monthly_growth || []

  // Completion rate
  const completedCount = c.by_status?.find(x => x.label === 'Completed')?.value || 0
  const completionRate = c.total ? Math.round(completedCount / c.total * 100) : 0

  return (
    <div style={{ fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0A1B47', marginBottom: 4 }}>Analytics Dashboard</h1>
        <p style={{ fontSize: 13, color: '#718096' }}>Platform health, patient demographics, and consultation insights</p>
      </div>

      {/* ── KPI Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        <KpiCard icon={Users}        label="Total Patients"     value={stats?.total_patients}         color="#1930AA" sub={`${p.total || 0} with profile`} />
        <KpiCard icon={Stethoscope}  label="Total Doctors"      value={stats?.total_doctors}          color="#00AFEF" />
        <KpiCard icon={Activity}     label="Consultations"       value={c.total}                       color="#10b981" sub={`${completionRate}% completion rate`} />
        <KpiCard icon={MessageSquare}label="Chat Sessions"       value={stats?.total_sessions}         color="#8b5cf6" />
        <KpiCard icon={ClipboardList}label="Prescriptions"       value={px.total}                     color="#f59e0b" />
        <KpiCard icon={UserCheck}    label="Doctor Requests"     value={d.join_requests?.reduce((s,x)=>s+x.value,0)||0} color="#ef4444" />
      </div>

      {/* ── Charts grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, marginBottom: 16 }}>

        {/* 1. Gender distribution */}
        <Card title="Patient Gender Distribution" subtitle="Based on patient profiles">
          <DonutChart data={p.gender || []} centerLabel="patients" />
        </Card>

        {/* 2. Age groups */}
        <Card title="Patient Age Groups" subtitle="Distribution across age brackets">
          <BarChart data={p.age_groups || []} color={PALETTE} />
        </Card>

        {/* 3. Consultation status */}
        <Card title="Consultation Status" subtitle="Breakdown of all consultations">
          <DonutChart data={c.by_status || []} centerLabel="total" />
        </Card>

        {/* 4. Consultation type */}
        <Card title="Consultation Type" subtitle="Video vs In-Person bookings">
          <DonutChart data={c.by_type || []} centerLabel="total" />
        </Card>

        {/* 5. Blood groups */}
        <Card title="Blood Group Distribution" subtitle="Patient blood types on record">
          <DonutChart data={(p.blood_groups || []).filter(x => x.label !== 'Unknown')} centerLabel="recorded" />
        </Card>

        {/* 6. Doctor status */}
        <Card title="Doctor Account Status" subtitle="Current status of all doctors">
          <DonutChart data={d.by_status || []} centerLabel="doctors" />
        </Card>

      </div>

      {/* ── Full-width: Consultations by Doctor ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, marginBottom: 16 }}>

        <Card title="Consultations by Doctor" subtitle="Top doctors by consultation volume" span={1}>
          <BarChart data={c.by_doctor || []} color="#1930AA" maxBarWidth={180} />
        </Card>

        {/* 7. Lifestyle & health flags */}
        <Card title="Lifestyle & Health Flags" subtitle="Self-reported by patients">
          <BarChart data={p.lifestyle || []} color={['#ef4444','#f59e0b','#8b5cf6','#ec4899']} maxBarWidth={180} />
        </Card>

        {/* 8. Chronic conditions */}
        <Card title="Health Conditions" subtitle="Most common reported conditions" span={1}>
          {(p.conditions || []).length > 0
            ? <BarChart data={p.conditions} color={PALETTE} maxBarWidth={180} />
            : <div style={{ color: '#a0aec0', fontSize: 13, padding: '20px 0' }}>No condition data recorded yet.</div>
          }
        </Card>

        {/* 9. Chat session status */}
        <Card title="Chat Session Status" subtitle="AI triage session outcomes">
          <DonutChart data={s.by_status || []} centerLabel="sessions" />
        </Card>

        {/* 10. Doctor join requests pipeline */}
        <Card title="Doctor Join Requests" subtitle="Approval pipeline status">
          <DonutChart data={d.join_requests || []} centerLabel="requests" />
        </Card>

      </div>

      {/* ── Monthly growth — full width ── */}
      <div style={{
        background: '#fff', borderRadius: 16, padding: '20px 22px',
        border: '1px solid #e8eef8', boxShadow: '0 2px 8px rgba(25,48,170,0.04)',
        marginBottom: 16,
      }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0A1B47' }}>Monthly Growth</div>
          <div style={{ fontSize: 12, color: '#a0aec0', marginTop: 2 }}>New patients and consultations over the last 6 months</div>
        </div>
        <MonthlyChart data={mg} />
      </div>

      {/* Quick links */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: '1px solid #e8eef8' }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0A1B47', marginBottom: 12 }}>Quick Links</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {[
            { label: 'View All Patients',     path: '/admin/patients'  },
            { label: 'Manage Doctors',        path: '/admin/doctors'   },
            { label: 'Doctor Requests',       path: '/admin/requests'  },
            { label: 'Labs (Coming Soon)',     path: null               },
            { label: 'Pharmacies (Coming Soon)', path: null            },
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
