import { useState, useEffect } from 'react'
import { Package, RefreshCw, ChevronDown, FileText, CheckCircle, Truck, XCircle, Clock } from 'lucide-react'
import { useBreakpoint } from '../../hooks/useBreakpoint'

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8000'

function getToken() { return localStorage.getItem('medivora_pharmacy_token') }

const STATUS_COLORS = {
  pending:          { bg: '#FFF7ED', text: '#C2410C', label: 'Pending' },
  confirmed:        { bg: '#EFF6FF', text: '#1D4ED8', label: 'Confirmed' },
  processing:       { bg: '#F0FDF4', text: '#15803D', label: 'Processing' },
  out_for_delivery: { bg: '#F5F3FF', text: '#6D28D9', label: 'Out for Delivery' },
  delivered:        { bg: '#ECFDF5', text: '#065F46', label: 'Delivered' },
  cancelled:        { bg: '#FEF2F2', text: '#991B1B', label: 'Cancelled' },
}

const NEXT_STATUSES = {
  pending:          ['confirmed', 'cancelled'],
  confirmed:        ['processing', 'cancelled'],
  processing:       ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered'],
  delivered:        [],
  cancelled:        [],
}

export default function PharmacyOrders() {
  const { isMobile } = useBreakpoint()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)
  const [updating, setUpdating] = useState(null)
  const [invoiceOrderId, setInvoiceOrderId] = useState(null)
  const [invoiceAmount, setInvoiceAmount] = useState('')
  const [invoiceNote, setInvoiceNote] = useState('')
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

  async function submitInvoice() {
    if (!invoiceAmount) return
    setSaving(true)
    try {
      await fetch(`${API_BASE}/portal/orders/${invoiceOrderId}/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ total_amount: parseFloat(invoiceAmount), invoice_data: { note: invoiceNote } }),
      })
      setInvoiceOrderId(null)
      setInvoiceAmount('')
      setInvoiceNote('')
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
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#064e3b', margin: 0 }}>Pharmacy Orders</h1>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>{orders.length} total orders</p>
        </div>
        <button onClick={load} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: '1.5px solid #d1fae5', background: '#fff', color: '#00875A', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '6px 14px', borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'inherit',
            background: filter === s ? '#00875A' : '#f0fdf4',
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
          <Package size={36} color="#d1fae5" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 4 }}>No orders</p>
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
            <div key={order.id} style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #d1fae5', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,135,90,0.06)' }}>
              {/* Order header row */}
              <div
                onClick={() => setExpanded(isExpanded ? null : order.id)}
                style={{ padding: isMobile ? '14px 16px' : '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Package size={20} color="#00875A" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>
                      {order.patient_name || 'Patient'}
                    </span>
                    {statusBadge(order.status)}
                  </div>
                  <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>
                    {items.length} item{items.length !== 1 ? 's' : ''} · {dateStr}
                    {order.delivery_type === 'home' ? ' · Home delivery' : ' · Pickup'}
                    {order.patient_phone ? ` · ${order.patient_phone}` : ''}
                  </p>
                </div>
                {order.total_amount && (
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#00875A', flexShrink: 0 }}>
                    ₹{Number(order.total_amount).toLocaleString('en-IN')}
                  </span>
                )}
                <ChevronDown size={16} color="#6B7280" style={{ transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none', flexShrink: 0 }} />
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid #d1fae5', padding: isMobile ? '14px 16px' : '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Items */}
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, margin: '0 0 8px' }}>Items</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, fontSize: 13 }}>
                          <span style={{ fontWeight: 600, color: '#064e3b' }}>{item.name}</span>
                          <span style={{ color: '#6B7280' }}>{item.dosage || ''} {item.frequency || ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery address */}
                  {order.delivery_address && (
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 4px' }}>Delivery Address</p>
                      <p style={{ fontSize: 13, color: '#374151', margin: 0 }}>{order.delivery_address}</p>
                    </div>
                  )}

                  {/* Notes */}
                  {order.notes && (
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 4px' }}>Patient Notes</p>
                      <p style={{ fontSize: 13, color: '#374151', margin: 0 }}>{order.notes}</p>
                    </div>
                  )}

                  {/* Invoice section */}
                  {invoiceOrderId === order.id ? (
                    <div style={{ background: '#f0fdf4', borderRadius: 10, padding: 14 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#064e3b', margin: '0 0 10px' }}>Generate Invoice</p>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                        <input
                          type="number" placeholder="Total Amount (₹)" value={invoiceAmount} onChange={e => setInvoiceAmount(e.target.value)}
                          style={{ flex: '1 1 140px', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #a7f3d0', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                        />
                        <input
                          type="text" placeholder="Note (optional)" value={invoiceNote} onChange={e => setInvoiceNote(e.target.value)}
                          style={{ flex: '2 1 200px', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #a7f3d0', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={submitInvoice} disabled={saving} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#00875A', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                          {saving ? 'Saving…' : 'Submit Invoice'}
                        </button>
                        <button onClick={() => setInvoiceOrderId(null)} style={{ padding: '9px 18px', borderRadius: 8, border: '1.5px solid #d1fae5', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    order.invoice_data && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#f0fdf4', borderRadius: 8 }}>
                        <FileText size={14} color="#00875A" />
                        <span style={{ fontSize: 13, color: '#064e3b', fontWeight: 600 }}>Invoice: ₹{order.total_amount?.toLocaleString('en-IN')}</span>
                      </div>
                    )
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {nexts.map(s => (
                      <button
                        key={s} onClick={() => updateStatus(order.id, s)}
                        disabled={updating === order.id}
                        style={{
                          padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'inherit',
                          background: s === 'cancelled' ? '#FEF2F2' : '#00875A',
                          color: s === 'cancelled' ? '#991B1B' : '#fff',
                          opacity: updating === order.id ? 0.6 : 1,
                        }}
                      >
                        {STATUS_COLORS[s]?.label || s}
                      </button>
                    ))}
                    {order.status === 'pending' || order.status === 'confirmed' ? (
                      <button
                        onClick={() => setInvoiceOrderId(order.id)}
                        style={{ padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1.5px solid #a7f3d0', background: '#fff', color: '#00875A', fontFamily: 'inherit' }}
                      >
                        <FileText size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />Generate Invoice
                      </button>
                    ) : null}
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
