import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Star, MapPin, Clock, IndianRupee, Stethoscope, Video, CreditCard, Building2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from './supabase'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { formatSpecialty } from '../utils/labels'

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8000'
const IS_DEV   = import.meta.env.VITE_DEV_PAYMENT === 'true'

/* ─── Auth token helper ─── */
async function getAuthToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  } catch { return null }
}

/* ─── Strip leading "Dr." prefix ─── */
function stripDr(name = '') { return name.replace(/^Dr\.?\s*/i, '').trim() }

/* ─── Initials helper ─── */
function initials(name = '') {
  const parts = stripDr(name).split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?'
}

/* ─── Extract specialty from medical report text ─── */
function extractSpecialtyFromText(text) {
  if (!text) return null
  const m = text.match(/Special(?:ty|ist)\s+Needed\*?\*?[:\s]+([a-zA-Z_]+)/i)
  if (m) return m[1].toLowerCase().trim()
  const m2 = text.match(/🏥[^\n:]+:\s*([a-zA-Z_]{4,30})/)
  if (m2) return m2[1].toLowerCase().trim()
  return null
}

/* ─── Get recommended specialty from all available sources ─── */
function resolveSpecialty(locationState) {
  // 1. Explicit navigate state
  const fromNav = locationState?.triage?.recommended_speciality
  if (fromNav) return fromNav

  // 2. Dedicated sessionStorage key (set by ChatPage)
  const fromKey = sessionStorage.getItem('medivora_recommended_specialty')
  if (fromKey) return fromKey

  // 3. Scan chat history in sessionStorage for medical report text
  try {
    const session = JSON.parse(sessionStorage.getItem('medivora_chat_session') || '{}')
    const messages = session.messages || []
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]
      if (msg.specialty) return msg.specialty
      if ((msg.is_medical_report || (msg.content && msg.content.includes('📋'))) && msg.content) {
        const sp = extractSpecialtyFromText(msg.content)
        if (sp) return sp
      }
    }
  } catch (_) {}

  return null
}

/* ─── Derive consultation mode from available_slots ─── */
function getConsultationMode(doctor) {
  const slots = doctor?.available_slots
  // No slots configured → default to both (no restriction set)
  if (!Array.isArray(slots) || slots.length === 0) return 'both'
  const types = slots.map(s => s.type || 'both')
  const allOnline  = types.every(t => t === 'online')
  const allOffline = types.every(t => t === 'offline')
  if (allOnline)  return 'online'
  if (allOffline) return 'offline'
  return 'both'
}

export default function BookAppointment() {
  const { isMobile } = useBreakpoint()
  const navigate  = useNavigate()
  const location  = useLocation()
  useAuth()

  const recommendedSpecialty = resolveSpecialty(location.state)
  const preSelectedDoctor    = location.state?.preSelectedDoctor || null
  const videoConsultation    = location.state?.videoConsultation || false

  const [doctors,        setDoctors]        = useState([])
  const [loading,        setLoading]        = useState(true)
  const [selectedDoctor, setSelectedDoctor] = useState(preSelectedDoctor || null)
  const [paying,          setPaying]          = useState(false)
  const [payError,        setPayError]        = useState(null)
  const [promoCode,       setPromoCode]       = useState('')
  const [promoApplied,    setPromoApplied]    = useState(null)  // { discount_percent, discount_amount, description }
  const [promoError,      setPromoError]      = useState(null)
  const [promoLoading,    setPromoLoading]    = useState(false)

  const fee            = selectedDoctor?.consultation_fee || 500
  const discountAmount = promoApplied ? Math.round(fee * promoApplied.discount_percent / 100) : 0
  const total          = fee - discountAmount

  // Show error from Razorpay cancel redirect, then clean up the URL
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('payment_error') === 'cancelled') {
      setPayError('Payment was cancelled. Please try again.')
      navigate('/book-appointment', { replace: true, state: location.state })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps



  /* ─── Fetch doctors with auth token ─── */
  useEffect(() => {
    (async () => {
      try {
        const token   = await getAuthToken()
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const url     = recommendedSpecialty && !preSelectedDoctor
          ? `${API_BASE}/doctors?specialty=${encodeURIComponent(recommendedSpecialty)}`
          : `${API_BASE}/doctors`
        console.log('[BookAppointment] specialty:', recommendedSpecialty, '| url:', url)
        const res     = await fetch(url, { headers })
        if (!res.ok) throw new Error(`${res.status}`)
        const data    = await res.json()
        const list    = data.doctors || []
        setDoctors(list)

        // Auto-select first doctor (list is already filtered by specialty)
        if (!preSelectedDoctor && list.length) {
          setSelectedDoctor(list[0])
        }
      } catch {
        setDoctors([])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  /* ─── Pay: call backend then redirect to Razorpay ─── */
  const handlePay = async () => {
    if (!selectedDoctor) return
    setPaying(true)
    // Save doctor to sessionStorage so PaymentPage can show the slot picker after payment
    sessionStorage.setItem('medivora_booking_doctor', JSON.stringify(selectedDoctor))
    sessionStorage.setItem('medivora_booking_video', JSON.stringify(videoConsultation))
    setPayError(null)
    try {
      const token   = await getAuthToken()
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      const docName = stripDr([selectedDoctor.first_name, selectedDoctor.last_name].filter(Boolean).join(' ') || selectedDoctor.name || 'Doctor')

      if (IS_DEV) {
        const res = await fetch(`${API_BASE}/payment/dev-confirm`, {
          method: 'POST', headers,
          body: JSON.stringify({
            doctor_id:         selectedDoctor.id,
            specialty:         selectedDoctor.specialties?.[0] || selectedDoctor.specialization || 'general_medicine',
            patient_note:      `Dev booking with Dr. ${docName}`,
            consultation_type: videoConsultation ? 'video' : 'in_person',
          }),
        })
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Booking failed') }
        const { session_id } = await res.json()
        navigate(`/payment?success=true&session_id=${session_id || ''}`, { replace: true })
      } else {
        if (!window.Razorpay) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://checkout.razorpay.com/v1/checkout.js'
            script.onload = resolve
            script.onerror = () => reject(new Error('Failed to load payment gateway'))
            document.body.appendChild(script)
          })
        }
        const res = await fetch(`${API_BASE}/payments/create-hosted-order`, {
          method: 'POST', headers,
          body: JSON.stringify({
            amount:            total * 100,
            doctor_id:         selectedDoctor.id,
            doctor_name:       docName,
            specialty:         selectedDoctor.specialties?.[0] || selectedDoctor.specialization || 'general_medicine',
            consultation_type: videoConsultation ? 'video' : 'in_person',
            patient_note:      `Consultation with Dr. ${docName}`,
          }),
        })
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Could not initiate payment') }
        const fields = await res.json()
        const rzp = new window.Razorpay({
          key:         fields.key_id,
          amount:      fields.amount,
          currency:    fields.currency,
          name:        fields.name,
          description: fields.description,
          order_id:    fields.order_id,
          prefill: {
            name:    fields['prefill[name]']    || '',
            contact: fields['prefill[contact]'] || '',
            email:   fields['prefill[email]']   || 'user@medivora.in',
          },
          theme: { color: '#1930AA' },
          modal: {
            ondismiss: () => setPaying(false),
          },
          handler: async (response) => {
            try {
              const verifyRes = await fetch(`${API_BASE}/payments/verify`, {
                method: 'POST', headers,
                body: JSON.stringify({
                  razorpay_order_id:   response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature:  response.razorpay_signature,
                  doctor_id:           selectedDoctor.id,
                  specialty:           selectedDoctor.specialties?.[0] || selectedDoctor.specialization || 'general_medicine',
                  consultation_type:   videoConsultation ? 'video' : 'in_person',
                  patient_note:        `Consultation with Dr. ${docName}`,
                }),
              })
              if (!verifyRes.ok) { const e = await verifyRes.json().catch(() => ({})); throw new Error(e.detail || 'Payment verification failed') }
              const { session_id } = await verifyRes.json()
              navigate(`/payment?success=true&session_id=${session_id}`, { replace: true })
            } catch (err) {
              setPayError(err.message || 'Payment verification failed. Please contact support.')
              setPaying(false)
            }
          },
        })
        rzp.open()
        setPaying(false)
      }
    } catch (err) {
      setPayError(err.message || 'Payment could not be initiated. Please try again.')
      setPaying(false)
    }
  }

  /* ─── Promo code ─── */
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return
    setPromoLoading(true)
    setPromoError(null)
    setPromoApplied(null)
    try {
      const token = await getAuthToken()
      const res = await fetch(`${API_BASE}/promocode/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ code: promoCode.trim().toUpperCase(), amount: fee + Math.round(fee * 0.18) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Invalid promo code')
      setPromoApplied({ discount_percent: data.discount_percent, discount_amount: data.discount_amount, description: data.description })
    } catch (err) {
      setPromoError(err.message || 'Could not apply promo code')
    } finally {
      setPromoLoading(false)
    }
  }

  const handleRemovePromo = () => {
    setPromoApplied(null)
    setPromoCode('')
    setPromoError(null)
  }

  /* ─── Derived values ─── */
  const specs = selectedDoctor?.specialties?.length
    ? selectedDoctor.specialties
    : [selectedDoctor?.specialization || 'General Physician']

  return (
    <>
    <div style={{ height: '100%', background: '#f0f4fa', fontFamily: 'var(--font, Inter, sans-serif)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{ padding: isMobile ? '10px 16px' : '14px 24px', background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)', background: 'none', cursor: 'pointer', fontSize: 13, color: '#444', fontFamily: 'inherit' }}
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontSize: 17, fontWeight: 700, color: '#111', margin: 0 }}>
              Book Appointment
            </h1>
          </div>
          {recommendedSpecialty && !preSelectedDoctor && (
            <p style={{ fontSize: 11, color: '#1930AA', margin: '2px 0 0', fontWeight: 600 }}>
              Recommended specialty: {formatSpecialty(recommendedSpecialty)}
            </p>
          )}
          {preSelectedDoctor && (
            <p style={{ fontSize: 11, color: '#1930AA', margin: '2px 0 0', fontWeight: 600 }}>
              Dr. {stripDr([preSelectedDoctor.first_name, preSelectedDoctor.last_name].filter(Boolean).join(' ') || preSelectedDoctor.name)} selected
            </p>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 20, maxWidth: 1060, margin: isMobile ? '16px auto' : '24px auto', width: '100%', padding: isMobile ? '0 16px' : '0 24px', alignItems: 'flex-start', boxSizing: 'border-box', overflow: isMobile ? 'auto' : 'hidden', minHeight: 0 }}>

        {/* ── LEFT: Doctor list ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0, height: isMobile ? 'auto' : '100%', overflowY: isMobile ? 'visible' : 'auto', paddingRight: isMobile ? 0 : 4, flexBasis: 0, paddingBottom: 24 }}>
          {loading ? (
            [0, 1, 2].map(i => (
              <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '18px', border: '1.5px solid rgba(0,0,0,0.07)', opacity: 0.6 }}>
                <div style={{ height: 14, background: '#e5e9f0', borderRadius: 6, width: '60%', marginBottom: 10 }} />
                <div style={{ height: 11, background: '#e5e9f0', borderRadius: 6, width: '40%' }} />
              </div>
            ))
          ) : doctors.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#999', fontSize: 13 }}>
              <Stethoscope size={32} color="#ddd" style={{ marginBottom: 12 }} />
              <div>No doctors available right now.</div>
            </div>
          ) : (
            doctors.map(doc => {
              const isSelected = selectedDoctor?.id === doc.id
              const docSpecs   = doc.specialties?.length ? doc.specialties : [doc.specialization || 'General Physician']
              const docFee     = doc.consultation_fee || 500
              const exp        = doc.years_of_experience ?? doc.experience ?? null
              const rating     = doc.rating || 4.5
              const clinic     = doc.clinic_name || 'Medivora Clinic'
              const name       = stripDr([doc.first_name, doc.last_name].filter(Boolean).join(' ') || doc.name || 'Doctor')

              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoctor(doc)}
                  style={{
                    background: '#fff', borderRadius: 14, padding: '16px 18px',
                    border: isSelected ? '2px solid #1930AA' : '1.5px solid rgba(0,0,0,0.08)',
                    cursor: 'pointer', transition: 'all 0.16s',
                    boxShadow: isSelected ? '0 4px 18px rgba(25,48,170,0.1)' : '0 1px 4px rgba(0,0,0,0.04)',
                    position: 'relative',
                  }}
                >

                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    {/* Avatar */}
                    <div style={{
                      width: 50, height: 50, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #1930AA, #00AFEF)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: 1,
                    }}>
                      {initials(name)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Dr. {name}</div>
                      <div style={{ fontSize: 12, color: '#1930AA', fontWeight: 600, marginTop: 2 }}>
                        {docSpecs.map(formatSpecialty).slice(0, 2).join(' · ')}
                      </div>

                      <div style={{ display: 'flex', gap: 16, marginTop: 9, flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#666' }}>
                          <Star size={11} color="#f59e0b" fill="#f59e0b" /> {rating}
                        </span>
                        {exp !== null && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#666' }}>
                            <Clock size={11} /> {exp} yrs exp
                          </span>
                        )}
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#666' }}>
                          <MapPin size={11} /> {clinic}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: '#1930AA' }}>
                          <IndianRupee size={11} /> {docFee}
                        </span>
                      </div>

                      {doc.nmc_number && (
                        <div style={{ marginTop: 6, fontSize: 10, color: '#aaa' }}>NMC Reg: {doc.nmc_number}</div>
                      )}
                    </div>

                    {/* Consultation mode badge — top right */}
                    {(() => {
                      const mode = getConsultationMode(doc)
                      if (mode === 'online') return (
                        <div style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#1930AA', background: 'rgba(25,48,170,0.08)', padding: '4px 9px', borderRadius: 6, height: 'fit-content' }}>
                          <Video size={11} /> Online Only
                        </div>
                      )
                      if (mode === 'offline') return (
                        <div style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#00875A', background: 'rgba(0,135,90,0.08)', padding: '4px 9px', borderRadius: 6, height: 'fit-content' }}>
                          <Building2 size={11} /> In-Clinic Only
                        </div>
                      )
                      return (
                        <div style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#7B5EA7', background: 'rgba(123,94,167,0.08)', padding: '4px 9px', borderRadius: 6, height: 'fit-content' }}>
                          <Video size={11} /><Building2 size={11} /> Online & In-Clinic
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* ── RIGHT: Payment panel ── */}
        <div style={{ flex: 1, flexBasis: 0, position: isMobile ? 'static' : 'sticky', top: 24, width: isMobile ? '100%' : undefined, paddingBottom: isMobile ? 24 : 0 }}>
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid rgba(0,0,0,0.08)', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>

            {/* Panel header */}
            <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #1930AA, #00AFEF)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}>
                <CreditCard size={15} />
                <span style={{ fontSize: 14, fontWeight: 700 }}>Payment Summary</span>
              </div>
            </div>

            <div style={{ padding: '20px' }}>
              {selectedDoctor ? (
                <>
                  {/* Doctor summary */}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #1930AA, #00AFEF)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, color: '#fff',
                    }}>
                      {initials([selectedDoctor.first_name, selectedDoctor.last_name].filter(Boolean).join(' ') || selectedDoctor.name)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>
                        Dr. {stripDr([selectedDoctor.first_name, selectedDoctor.last_name].filter(Boolean).join(' ') || selectedDoctor.name || 'Doctor')}
                      </div>
                      <div style={{ fontSize: 11, color: '#1930AA' }}>{specs.map(formatSpecialty).slice(0, 2).join(' · ')}</div>
                    </div>
                  </div>

                  {/* Fee breakdown */}
                  <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)', paddingTop: 14, marginBottom: 12 }}>
                    {[
                      { label: 'Consultation Fee', value: `₹${fee}` },
                      { label: 'Platform Fee', value: '₹0' },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', marginBottom: 8 }}>
                        <span>{label}</span>
                        <span style={{ fontWeight: 600, color: '#333' }}>{value}</span>
                      </div>
                    ))}
                    {promoApplied && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#00a040', marginBottom: 8 }}>
                        <span>Promo ({promoApplied.discount_percent}% off)</span>
                        <span style={{ fontWeight: 700 }}>− ₹{discountAmount}</span>
                      </div>
                    )}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800,
                      color: '#111', borderTop: '1.5px solid rgba(0,0,0,0.08)', paddingTop: 10, marginTop: 4,
                    }}>
                      <span>Total</span>
                      <div style={{ textAlign: 'right' }}>
                        {promoApplied && (
                          <div style={{ fontSize: 11, color: '#aaa', textDecoration: 'line-through', fontWeight: 400 }}>₹{fee}</div>
                        )}
                        <span style={{ color: '#1930AA' }}>₹{total}</span>
                      </div>
                    </div>
                  </div>

                  {/* Promo code */}
                  {!promoApplied ? (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input
                          type="text"
                          placeholder="Enter promo code"
                          value={promoCode}
                          onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(null) }}
                          onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
                          style={{
                            flex: 1, padding: '8px 10px', borderRadius: 8, fontSize: 12, fontFamily: 'inherit',
                            border: promoError ? '1.5px solid #c62828' : '1.5px solid rgba(0,0,0,0.12)',
                            outline: 'none', letterSpacing: 1,
                          }}
                        />
                        <button
                          onClick={handleApplyPromo}
                          disabled={promoLoading || !promoCode.trim()}
                          style={{
                            padding: '8px 12px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 700,
                            cursor: (promoLoading || !promoCode.trim()) ? 'default' : 'pointer',
                            background: (promoLoading || !promoCode.trim()) ? 'rgba(0,0,0,0.07)' : 'linear-gradient(135deg, #1930AA, #00AFEF)',
                            color: (promoLoading || !promoCode.trim()) ? '#bbb' : '#fff',
                            fontFamily: 'inherit', transition: 'all 0.2s', whiteSpace: 'nowrap',
                          }}
                        >
                          {promoLoading ? '…' : 'Apply'}
                        </button>
                      </div>
                      {promoError && (
                        <div style={{ fontSize: 11, color: '#c62828', marginTop: 5 }}>{promoError}</div>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'rgba(0,160,64,0.07)', border: '1px solid rgba(0,160,64,0.2)',
                      borderRadius: 8, padding: '8px 10px', marginBottom: 14,
                    }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#00a040' }}>
                          {promoCode} applied — {promoApplied.discount_percent}% off
                        </div>
                        {promoApplied.description && (
                          <div style={{ fontSize: 10, color: '#666', marginTop: 1 }}>{promoApplied.description}</div>
                        )}
                      </div>
                      <button
                        onClick={handleRemovePromo}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#aaa', padding: '0 2px', lineHeight: 1 }}
                      >✕</button>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ fontSize: 13, color: '#999', textAlign: 'center', padding: '18px 0', marginBottom: 16 }}>
                  Select a doctor to continue
                </div>
              )}

              {payError && (
                <div style={{ fontSize: 12, color: '#c62828', background: 'rgba(198,40,40,0.07)', padding: '10px 12px', borderRadius: 8, marginBottom: 10 }}>
                  {payError}
                </div>
              )}

              <button
                onClick={handlePay}
                disabled={!selectedDoctor || paying}
                style={{
                  width: '100%', padding: '13px 0', borderRadius: 10, border: 'none',
                  cursor: (selectedDoctor && !paying) ? 'pointer' : 'default',
                  background: (selectedDoctor && !paying) ? 'linear-gradient(135deg, #1930AA, #00AFEF)' : 'rgba(0,0,0,0.07)',
                  color: (selectedDoctor && !paying) ? '#fff' : '#bbb',
                  fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                  boxShadow: (selectedDoctor && !paying) ? '0 4px 16px rgba(25,48,170,0.22)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {paying ? 'Loading…' : !selectedDoctor ? 'Select a Doctor' : `Pay ₹${total}`}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 }}>
                <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
                  <rect width="32" height="32" rx="6" fill="#072654"/>
                  <path d="M8 22l4-12h4l-2 6h4l-4 6H8z" fill="#00BAF2"/>
                  <path d="M16 10l4 6h-4l-2-6h2z" fill="#fff"/>
                </svg>
                <span style={{ fontSize: 10, color: '#bbb' }}>Secured by Razorpay</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>


</>
  )
}
