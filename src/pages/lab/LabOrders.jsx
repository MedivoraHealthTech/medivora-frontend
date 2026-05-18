import { useState, useEffect } from 'react'
import { FlaskConical, RefreshCw, ChevronDown, Upload, CheckCircle, FileText } from 'lucide-react'
import { useBreakpoint } from '../../hooks/useBreakpoint'

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8000'

function getToken() { return localStorage.getItem('medivora_lab_token') }

const STATUS_COLORS = {
  pending:          { bg: '#FFF7ED', text: '#C2410C', label: 'Pending' },
  confirmed:        { bg: '#EFF6FF', text: '#1D4ED8', label: 'Confirmed' },
  processing:       { bg: '#F0F9FF', text: '#0369A1', label: 'Processing' },
  sample_collected: { bg: '#F5F3FF', text: '#6D28D9', label: 'Sample Collected' },
  report_ready:     { bg: '#ECFDF5', text: '#065F46', label: 'Report Ready' },
  completed:        { bg: '#F0FDF4', text: '#15803D', label: 'Completed' },
  cancelled:        { bg: '#FEF2F2', text: '#991B1B', label: 'Cancelled' },
}

const NEXT_STATUSES = {
  pending:          ['confirmed', 'cancelled'],
  confirmed:        ['processing', 'cancelled'],
  processing:       ['sample_collected'],
  sample_collected: ['report_ready'],
  report_ready:     ['completed'],
  completed:        [],
  cancelled:        [],
}

export default function LabOrders() {
  const { isMobile } = useBreakpoint()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)
  const [updating, setUpdating] = useState(null)
  const [reportOrderId, setReportOrderId] = useState(null)
  const [reportUrl, setReportUrl] = useState('')
  const [reportNotes, setReportNotes] = useState('')
  const [testNames, setTestNames] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/portal/orders`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const data = await res.json()
      setOrders(data.orders || [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function updateStatus(orderId, status) {
    setUpdating(orderId)
    try {
      await fetch(`${API_BASE}/portal/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ status }),
      })
      await load()
    } finally { setUpdating(null) }
  }

  async function submitReport() {
    setSaving(true)
    try {
      await fetch(`${API_BASE}/portal/orders/${reportOrderId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ report_url: reportUrl, report_notes: reportNotes, test_names: testNames }),
      })
      setReportOrderId(null)
      setReportUrl('')
      setReportNotes('')
      setTestNames('')
      await load()
    } finally { setSaving(false) }
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const statusBadge = (status) => {
    const s = STATUS_COLORS[status] || { bg: '#F3F4F6', text: '#6B7280', label: status }
    return (
      <span style={{ padding: '3px 10px', borderRadius: 50, fontSize: 11, fontWeight: 700, background: s.bg, color: s.text }}>
        {s.label}
      </span>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', marginBottom: 24, flexDirection: isMobile ? 'column' : 'row', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e3a5f', margin: 0 }}>Test Orders</h1>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>{orders.length} total orders</p>
        </div>
        <button onClick={load} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: '1.5px solid #bfdbfe', background: '#fff', color: '#1D4ED8', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'pending', 'confirmed', 'processing', 'sample_collected', 'report_ready', 'completed', 'cancelled'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '6px 14px', borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'inherit',
            background: filter === s ? '#1D4ED8' : '#eff6ff',
            color: filter === s ? '#fff' : '#374151',
          }}>
            {s === 'all' ? 'All' : STATUS_COLORS[s]?.label || s}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 48, color: '#6B7280' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 10 }} />
          <p style={{ margin: 0, fontSize: 14 }}>Loading orders…</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, color: '#6B7280' }}>
          <FlaskConical size={36} color="#bfdbfe" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 4 }}>No test orders</p>
          <p style={{ fontSize: 13 }}>New orders will appear here</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(order => {
          const isExpanded = expanded === order.id
          const nexts = NEXT_STATUSES[order.status] || []
          const dateStr = new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          const items = order.items || []

          return (
            <div key={order.id} style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #bfdbfe', overflow: 'hidden', boxShadow: '0 2px 8px rgba(29,78,216,0.06)' }}>
              {/* Order header */}
              <div
                onClick={() => setExpanded(isExpanded ? null : order.id)}
                style={{ padding: isMobile ? '14px 16px' : '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FlaskConical size={20} color="#1D4ED8" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>
                      {order.patient_name || 'Patient'}
                    </span>
                    {statusBadge(order.status)}
                  </div>
                  <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>
                    {items.length} test{items.length !== 1 ? 's' : ''} · {dateStr}
                    {order.delivery_type === 'home' ? ' · Home visit' : ' · Visit lab'}
                    {order.patient_phone ? ` · ${order.patient_phone}` : ''}
                  </p>
                </div>
                <ChevronDown size={16} color="#6B7280" style={{ transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none', flexShrink: 0 }} />
              </div>

              {/* Expanded */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid #bfdbfe', padding: isMobile ? '14px 16px' : '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Tests */}
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 8px' }}>Tests Requested</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#eff6ff', borderRadius: 8, fontSize: 13 }}>
                          <span style={{ fontWeight: 600, color: '#1e3a5f' }}>{item.name}</span>
                          <span style={{ color: '#6B7280' }}>{item.dosage || ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery type info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#f8fafc', borderRadius: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#1D4ED8' }}>
                      {order.delivery_type === 'home' ? '🏠 Home Collection' : '🏥 Visit Lab'}
                    </span>
                    {order.delivery_address && <span style={{ fontSize: 12, color: '#6B7280' }}>· {order.delivery_address}</span>}
                  </div>

                  {/* Existing report */}
                  {order.report_url && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#f0f9ff', borderRadius: 10, border: '1px solid #bae6fd' }}>
                      <FileText size={16} color="#0369A1" />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#0369A1', margin: 0 }}>Report uploaded</p>
                        {order.report_notes && <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>{order.report_notes}</p>}
                        {order.report_url.startsWith('http') && (
                          <a href={order.report_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#1D4ED8' }}>View Report →</a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Upload report form */}
                  {reportOrderId === order.id ? (
                    <div style={{ background: '#eff6ff', borderRadius: 10, padding: 14 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#1e3a5f', margin: '0 0 10px' }}>Upload Report</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                        <input
                          type="text" placeholder="Test names (e.g. CBC, LFT, Lipid Profile)" value={testNames} onChange={e => setTestNames(e.target.value)}
                          style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid #bfdbfe', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                        />
                        <input
                          type="text" placeholder="Report URL (link to PDF/image)" value={reportUrl} onChange={e => setReportUrl(e.target.value)}
                          style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid #bfdbfe', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                        />
                        <textarea
                          placeholder="Report summary / doctor's note (optional)" value={reportNotes} onChange={e => setReportNotes(e.target.value)}
                          rows={2}
                          style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid #bfdbfe', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={submitReport} disabled={saving} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#1D4ED8', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                          {saving ? 'Uploading…' : 'Share Report with Patient'}
                        </button>
                        <button onClick={() => setReportOrderId(null)} style={{ padding: '9px 18px', borderRadius: 8, border: '1.5px solid #bfdbfe', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {nexts.map(s => (
                      <button
                        key={s} onClick={() => updateStatus(order.id, s)}
                        disabled={updating === order.id}
                        style={{
                          padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'inherit',
                          background: s === 'cancelled' ? '#FEF2F2' : '#1D4ED8',
                          color: s === 'cancelled' ? '#991B1B' : '#fff',
                          opacity: updating === order.id ? 0.6 : 1,
                        }}
                      >
                        {STATUS_COLORS[s]?.label || s}
                      </button>
                    ))}
                    {['sample_collected', 'report_ready', 'processing'].includes(order.status) && reportOrderId !== order.id && (
                      <button
                        onClick={() => setReportOrderId(order.id)}
                        style={{ padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1.5px solid #bfdbfe', background: '#fff', color: '#1D4ED8', fontFamily: 'inherit' }}
                      >
                        <Upload size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />Upload Report
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
