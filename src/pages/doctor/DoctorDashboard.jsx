import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, CalendarDays, ClipboardList, TrendingUp,
  Clock, CheckCircle, AlertTriangle, ChevronRight,
  Activity, Stethoscope, IndianRupee,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { doctorAPI } from '../../api/client'

export default function DoctorDashboard() {
  const { displayName, getToken } = useAuth()
  const navigate = useNavigate()

  const [stats,         setStats]         = useState(null)
  const [consultations, setConsultations] = useState([])
  const [approvals,     setApprovals]     = useState([])
  const [loading,       setLoading]       = useState(true)

  useEffect(() => {
    async function load() {
      const token = getToken()
      try {
        const [cData, aData] = await Promise.allSettled([
          doctorAPI.getConsultations(token),
          doctorAPI.getPendingApprovals(token),
        ])
        const cValue    = cData.status === 'fulfilled' ? cData.value : {}
        const consults  = cValue?.sessions || []
        const totalIncome = cValue?.total_income || 0
        const approvalList = aData.status === 'fulfilled' ? (aData.value?.approvals || []) : []
        setConsultations(consults)
        setApprovals(approvalList)
        setStats({
          total:       consults.length,
          pending:     consults.filter(c => c.status === 'requested').length,
          scheduled:   consults.filter(c => c.status === 'scheduled').length,
          completed:   consults.filter(c => c.status === 'completed').length,
          pendingRx:   approvalList.length,
          totalIncome,
        })
      } catch (e) {
        console.error('Dashboard load error:', e)
        setStats({ total: 0, pending: 0, scheduled: 0, completed: 0, pendingRx: 0 })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const statCards = stats ? [
    { label: 'Total Consultations', value: stats.total,     icon: Stethoscope, color: 'var(--blue)', bg: 'rgba(25,48,170,0.08)' },
    { label: 'Pending Requests',    value: stats.pending,   icon: Clock,       color: 'var(--warn)', bg: 'rgba(255,179,0,0.1)'   },
    { label: 'Scheduled',           value: stats.scheduled, icon: CalendarDays, color: 'var(--cyan)', bg: 'rgba(0,188,212,0.1)'   },
    { label: 'Pending Rx Review',   value: stats.pendingRx, icon: ClipboardList, color: 'var(--err)',  bg: 'rgba(255,61,0,0.08)'  },
    { label: 'Total Income',        value: `₹${stats.totalIncome.toLocaleString('en-IN')}`, icon: IndianRupee, color: '#00897b', bg: 'rgba(0,137,123,0.08)', raw: true },
  ] : []

  const recentConsults = consultations.slice(0, 5)
  const recentApprovals = approvals.slice(0, 4)

  const statusColor = s => {
    if (s === 'requested')  return 'var(--warn)'
    if (s === 'scheduled')  return 'var(--cyan)'
    if (s === 'completed')  return 'var(--ok)'
    if (s === 'cancelled')  return 'var(--err)'
    return 'var(--g500)'
  }
  const riskColor = r => {
    const l = (r || '').toLowerCase()
    if (l === 'emergency' || l === 'critical') return 'var(--err)'
    if (l === 'high')   return '#ff7043'
    if (l === 'medium') return 'var(--warn)'
    return 'var(--ok)'
  }

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(0,188,212,0.2)', borderTopColor: 'var(--cyan)', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ fontSize: 13, color: 'var(--g500)' }}>Loading dashboard…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', background: 'var(--dark)' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--g300)', fontFamily: 'var(--serif)', margin: '0 0 4px' }}>
          Good day, Dr. {displayName.replace(/^Dr\.\s*/i, '').split(' ')[0]}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--g500)', margin: 0 }}>Here's your practice overview for today.</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        {statCards.map((s, i) => (
          <div key={i} style={{ borderRadius: 14, padding: '18px 20px', background: 'var(--pw)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--g500)' }}>{s.label}</span>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={16} color={s.color} />
              </div>
            </div>
            <p style={{ fontSize: s.raw ? 22 : 28, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Two-column below */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Recent Consultations */}
        <div style={{ borderRadius: 14, background: 'var(--pw)', border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarDays size={16} color='var(--blue)' />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--g300)' }}>Recent Consultations</span>
            </div>
            <button onClick={() => navigate('/doctor/consultations')} style={{ fontSize: 12, color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
              View all <ChevronRight size={12} />
            </button>
          </div>
          {recentConsults.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--g500)', fontSize: 13 }}>No consultations yet</div>
          ) : (
            recentConsults.map((c, i) => (
              <div key={c.id || i} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'background 0.2s' }}
                onClick={() => navigate('/doctor/consultations')}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--g300)', margin: '0 0 2px' }}>
                    {c.patient_name || 'Patient'}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--g500)', margin: 0 }}>
                    {c.specialty || 'General'} · {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                  </p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 50, background: `${statusColor(c.status)}18`, color: statusColor(c.status) }}>
                  {c.status}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Pending Prescription Reviews */}
        <div style={{ borderRadius: 14, background: 'var(--pw)', border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClipboardList size={16} color='var(--err)' />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--g300)' }}>Pending Rx Reviews</span>
              {recentApprovals.length > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 50, background: 'var(--err)', color: '#fff' }}>{recentApprovals.length}</span>
              )}
            </div>
            <button onClick={() => navigate('/doctor/prescriptions')} style={{ fontSize: 12, color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
              Review all <ChevronRight size={12} />
            </button>
          </div>
          {recentApprovals.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--g500)', fontSize: 13 }}>
              <CheckCircle size={24} color='var(--ok)' style={{ margin: '0 auto 8px', display: 'block' }} />
              All caught up!
            </div>
          ) : (
            recentApprovals.map((a, i) => {
              const assessment = a.ai_assessment || a.assessment_data || {}
              const risk = assessment.risk_level || a.priority_label || 'ROUTINE'
              return (
                <div key={a.approval_id || i} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,0.04)', cursor: 'pointer', transition: 'background 0.2s' }}
                  onClick={() => navigate('/doctor/prescriptions')}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--g300)', margin: 0 }}>
                      {a.patient_name || 'Patient'}
                    </p>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 50, background: `${riskColor(risk)}18`, color: riskColor(risk) }}>
                      {risk}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--g500)', margin: 0 }}>
                    {assessment.primary_condition || assessment.diagnosis || 'Assessment pending'} · {a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}
                  </p>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
        <button onClick={() => navigate('/doctor/consultations')} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 10,
          border: '1.5px solid rgba(25,48,170,0.2)', background: 'rgba(25,48,170,0.04)',
          color: '#1930AA', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(25,48,170,0.08)'; e.currentTarget.style.borderColor = '#1930AA' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(25,48,170,0.04)'; e.currentTarget.style.borderColor = 'rgba(25,48,170,0.2)' }}
        >
          <CalendarDays size={15} /> Manage Consultations
        </button>
        <button onClick={() => navigate('/doctor/prescriptions')} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 10,
          border: '1.5px solid rgba(255,61,0,0.2)', background: 'rgba(255,61,0,0.04)',
          color: 'var(--err)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,61,0,0.08)'; e.currentTarget.style.borderColor = 'var(--err)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,61,0,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,61,0,0.2)' }}
        >
          <ClipboardList size={15} /> Review Prescriptions
        </button>
        <button onClick={() => navigate('/doctor/profile')} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 10,
          border: '1.5px solid rgba(0,188,212,0.2)', background: 'rgba(0,188,212,0.04)',
          color: 'var(--cyan)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,188,212,0.08)'; e.currentTarget.style.borderColor = 'var(--cyan)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,188,212,0.04)'; e.currentTarget.style.borderColor = 'rgba(0,188,212,0.2)' }}
        >
          <Activity size={15} /> Update Availability
        </button>
      </div>
    </div>
  )
}
