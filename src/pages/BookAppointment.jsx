import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Star, MapPin, Clock, IndianRupee, CheckCircle, CreditCard, Stethoscope, Video, CalendarClock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from './supabase'
import TimeSlotPicker from '../components/TimeSlotPicker'

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8000'

/* ─── Load Razorpay checkout script once ─── */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload  = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

/* ─── Auth token helper (same pattern as DoctorsPage) ─── */
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

export default function BookAppointment() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user, displayName } = useAuth()

  const recommendedSpecialty = resolveSpecialty(location.state)
  const preSelectedDoctor    = location.state?.preSelectedDoctor || null
  const videoConsultation    = location.state?.videoConsultation || false

  const [doctors,         setDoctors]         = useState([])
  const [loading,         setLoading]         = useState(true)
  const [selectedDoctor,  setSelectedDoctor]  = useState(preSelectedDoctor || null)
  const [selectedSlot,    setSelectedSlot]    = useState(location.state?.selectedSlot || null)
  const [showSlotPicker,  setShowSlotPicker]  = useState(false)
  const [paymentDone,     setPaymentDone]     = useState(false)
  const [paying,          setPaying]          = useState(false)
  const [payError,        setPayError]        = useState(null)

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

  const IS_DEV = import.meta.env.DEV

  /* ─── Razorpay checkout ─── */
  const handlePay = async () => {
    if (!selectedDoctor || paying) return
    // Require a time slot before payment
    if (!selectedSlot) {
      setShowSlotPicker(true)
      return
    }

    // Dev mode — skip payment, confirm booking in DB directly
    if (IS_DEV) {
      try {
        const token = await getAuthToken()
        await fetch(`${API_BASE}/payment/dev-confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            doctor_id:         selectedDoctor.id,
            specialty:         (selectedDoctor.specialties?.[0] || selectedDoctor.specialization || 'general_medicine'),
            patient_note:      `Dev booking with ${selectedDoctor.full_name || selectedDoctor.name}`,
            scheduled_at:      selectedSlot?.iso || null,
            consultation_type: videoConsultation ? 'video' : 'in_person',
          }),
        })
      } catch { /* non-fatal — show success anyway */ }
      setPaymentDone(true)
      return
    }

    setPaying(true)
    setPayError(null)

    // 1. Load Razorpay SDK
    const loaded = await loadRazorpayScript()
    if (!loaded) {
      setPayError('Unable to load payment gateway. Check your internet connection.')
      setPaying(false)
      return
    }

    const fee     = selectedDoctor.consultation_fee || 500
    const gst     = Math.round(fee * 0.18)
    const total   = fee + gst
    const docName = stripDr(selectedDoctor.full_name || selectedDoctor.name || 'Doctor')

    try {
      // 2. Create Razorpay order from backend
      const token = await getAuthToken()
      const orderRes = await fetch(`${API_BASE}/payment/create-order`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          amount:      total,
          doctor_id:   selectedDoctor.id,
          doctor_name: docName,
        }),
      })

      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({}))
        throw new Error(err.detail || `Order creation failed (${orderRes.status})`)
      }

      const { order_id, amount, currency, key_id } = await orderRes.json()

      // 3. Open Razorpay checkout
      const options = {
        key:         key_id,
        amount,
        currency,
        name:        'Medivora',
        description: `${videoConsultation ? 'Video Consultation' : 'Consultation'} with Dr. ${docName}`,
        order_id,
        prefill: {
          name:    displayName || '',
          email:   user?.email || '',
          contact: '',
        },
        theme: { color: '#1930AA' },
        handler: async (response) => {
          try {
            const token = await getAuthToken()
            const verifyRes = await fetch(`${API_BASE}/payments/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                doctor_id:           selectedDoctor.id,
                specialty:           (selectedDoctor.specialties?.[0] || selectedDoctor.specialization || 'general_medicine'),
                note:                `Consultation with ${selectedDoctor.full_name || selectedDoctor.name || 'Doctor'}`,
                scheduled_at:        selectedSlot?.iso || '',
                consultation_type:   videoConsultation ? 'video' : 'in_person',
              }),
            })
            if (!verifyRes.ok) {
              const err = await verifyRes.json().catch(() => ({}))
              throw new Error(err.detail || 'Booking confirmation failed')
            }
            setPaymentDone(true)
          } catch (err) {
            setPayError(err.message || 'Payment received but booking failed. Please contact support.')
          }
          setPaying(false)
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      setPayError(err.message || 'Payment could not be initiated. Please try again.')
      setPaying(false)
    }
  }

  /* ─── Derived values ─── */
  const fee   = selectedDoctor?.consultation_fee || 500
  const gst   = Math.round(fee * 0.18)
  const total = fee + gst
  const specs = selectedDoctor?.specialties?.length
    ? selectedDoctor.specialties
    : [selectedDoctor?.specialization || 'General Physician']

  return (
    <>
    <div style={{ height: '100%', background: '#f0f4fa', fontFamily: 'var(--font, Inter, sans-serif)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{ padding: '14px 24px', background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)', background: 'none', cursor: 'pointer', fontSize: 13, color: '#444', fontFamily: 'inherit' }}
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontSize: 17, fontWeight: 700, color: '#111', margin: 0 }}>
              {videoConsultation ? 'Book Video Consultation' : 'Book Appointment'}
            </h1>
            {videoConsultation && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, #1930AA, #00AFEF)', padding: '3px 10px', borderRadius: 20 }}>
                <Video size={11} /> Video
              </span>
            )}
          </div>
          {recommendedSpecialty && !preSelectedDoctor && (
            <p style={{ fontSize: 11, color: '#1930AA', margin: '2px 0 0', fontWeight: 600 }}>
              Recommended specialty: {recommendedSpecialty}
            </p>
          )}
          {preSelectedDoctor && (
            <p style={{ fontSize: 11, color: '#1930AA', margin: '2px 0 0', fontWeight: 600 }}>
              Dr. {stripDr(preSelectedDoctor.full_name || preSelectedDoctor.name)} selected
            </p>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', gap: 20, maxWidth: 1060, margin: '24px auto', width: '100%', padding: '0 24px', alignItems: 'flex-start', boxSizing: 'border-box', overflow: 'hidden', minHeight: 0 }}>

        {/* ── LEFT: Doctor list ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0, height: '100%', overflowY: 'auto', paddingRight: 4, flexBasis: 0, paddingBottom: 24 }}>
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
              const name       = stripDr(doc.full_name || doc.name || 'Doctor')

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
                  {isSelected && (
                    <div style={{ position: 'absolute', top: 14, right: 14 }}>
                      <CheckCircle size={16} color="#1930AA" />
                    </div>
                  )}

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
                        {docSpecs.slice(0, 2).join(' · ')}
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
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* ── RIGHT: Payment panel ── */}
        <div style={{ flex: 1, flexBasis: 0, position: 'sticky', top: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid rgba(0,0,0,0.08)', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>

            {/* Panel header */}
            <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #1930AA, #00AFEF)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}>
                {videoConsultation ? <Video size={15} /> : <CreditCard size={15} />}
                <span style={{ fontSize: 14, fontWeight: 700 }}>
                  {videoConsultation ? 'Video Consultation' : 'Payment Summary'}
                </span>
              </div>
            </div>

            <div style={{ padding: '20px' }}>
              {paymentDone ? (
                <div style={{ textAlign: 'center', padding: '28px 0' }}>
                  <CheckCircle size={48} color="#00c853" style={{ marginBottom: 12 }} />
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 6 }}>
                    {videoConsultation ? 'Video Consultation Booked!' : 'Booking Confirmed!'}
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 20, lineHeight: 1.6 }}>
                    {videoConsultation
                      ? <>Your video consultation has been booked.<br />You will receive a meeting link shortly.</>
                      : <>Your appointment has been booked.<br />The doctor will be in touch shortly.</>
                    }
                  </div>
                  <button
                    onClick={() => navigate('/consultations')}
                    style={{
                      padding: '10px 22px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: '#1930AA', color: '#fff', fontSize: 13, fontWeight: 600,
                      fontFamily: 'inherit',
                    }}
                  >
                    View My Consultations
                  </button>
                </div>
              ) : (
                <>
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
                          {initials(selectedDoctor.full_name || selectedDoctor.name)}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>
                            Dr. {stripDr(selectedDoctor.full_name || selectedDoctor.name || 'Doctor')}
                          </div>
                          <div style={{ fontSize: 11, color: '#1930AA' }}>{specs.slice(0, 2).join(' · ')}</div>
                        </div>
                      </div>

                      {/* Time slot selector */}
                      <div
                        onClick={() => setShowSlotPicker(true)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                          borderRadius: 10, border: selectedSlot ? '1.5px solid rgba(25,48,170,0.2)' : '1.5px dashed rgba(0,0,0,0.15)',
                          cursor: 'pointer', marginBottom: 14, transition: 'all 0.18s',
                          background: selectedSlot ? 'rgba(25,48,170,0.04)' : 'rgba(0,0,0,0.02)',
                        }}
                      >
                        <CalendarClock size={14} color={selectedSlot ? '#1930AA' : '#aaa'} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {selectedSlot ? (
                            <>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#1930AA' }}>Appointment Slot</div>
                              <div style={{ fontSize: 12, color: '#333', marginTop: 1 }}>{selectedSlot.label}</div>
                            </>
                          ) : (
                            <div style={{ fontSize: 12, color: '#aaa', fontWeight: 600 }}>Select appointment slot →</div>
                          )}
                        </div>
                      </div>

                      {/* Fee breakdown */}
                      <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)', paddingTop: 14, marginBottom: 16 }}>
                        {[
                          { label: videoConsultation ? 'Video Consultation Fee' : 'Consultation Fee', value: `₹${fee}` },
                          { label: 'Platform Fee',     value: '₹0' },
                          { label: 'GST (18%)',        value: `₹${gst}` },
                        ].map(({ label, value }) => (
                          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', marginBottom: 8 }}>
                            <span>{label}</span>
                            <span style={{ fontWeight: 600, color: '#333' }}>{value}</span>
                          </div>
                        ))}
                        <div style={{
                          display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800,
                          color: '#111', borderTop: '1.5px solid rgba(0,0,0,0.08)', paddingTop: 10, marginTop: 4,
                        }}>
                          <span>Total</span>
                          <span style={{ color: '#1930AA' }}>₹{total}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: 13, color: '#999', textAlign: 'center', padding: '18px 0', marginBottom: 16 }}>
                      Select a doctor to continue
                    </div>
                  )}

                  {payError && (
                    <div style={{
                      fontSize: 12, color: '#c62828', background: 'rgba(198,40,40,0.07)',
                      padding: '9px 12px', borderRadius: 8, marginBottom: 12, lineHeight: 1.5,
                    }}>
                      {payError}
                    </div>
                  )}

                  <button
                    onClick={handlePay}
                    disabled={!selectedDoctor || paying}
                    style={{
                      width: '100%', padding: '13px 0', borderRadius: 10, border: 'none',
                      cursor: selectedDoctor && !paying ? 'pointer' : 'default',
                      background: selectedDoctor && !paying
                        ? 'linear-gradient(135deg, #1930AA, #00AFEF)'
                        : 'rgba(0,0,0,0.07)',
                      color: selectedDoctor && !paying ? '#fff' : '#bbb',
                      fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                      boxShadow: selectedDoctor && !paying ? '0 4px 16px rgba(25,48,170,0.22)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    {paying
                      ? 'Opening Payment…'
                      : !selectedDoctor
                        ? 'Pay'
                        : !selectedSlot
                          ? 'Select a Time Slot'
                          : IS_DEV
                            ? `Book Free (Dev Mode)`
                            : `Pay ₹${total}`
                    }
                  </button>

                  {/* Razorpay badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 }}>
                    <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
                      <rect width="32" height="32" rx="6" fill="#072654"/>
                      <path d="M8 22l4-12h4l-2 6h4l-4 6H8z" fill="#00BAF2"/>
                      <path d="M16 10l4 6h-4l-2-6h2z" fill="#fff"/>
                    </svg>
                    <span style={{ fontSize: 10, color: '#bbb' }}>Secured by Razorpay</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

    {showSlotPicker && selectedDoctor && (
      <TimeSlotPicker
        doctor={selectedDoctor}
        onClose={() => setShowSlotPicker(false)}
        onConfirm={(slot) => {
          setSelectedSlot(slot)
          setShowSlotPicker(false)
        }}
      />
    )}
    </>
  )
}
