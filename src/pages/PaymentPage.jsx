import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle, ArrowLeft, Video, Stethoscope, Calendar, ShieldCheck } from 'lucide-react'
import { supabase } from './supabase'

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8000'
const IS_DEV   = import.meta.env.VITE_DEV_PAYMENT === 'true'

async function getAuthToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  } catch { return null }
}

function stripDr(name = '') { return name.replace(/^Dr\.?\s*/i, '').trim() }

export default function PaymentPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const formRef   = useRef(null)

  const params = new URLSearchParams(location.search)
  const isSuccess  = params.get('success') === 'true'
  const sessionId  = params.get('session_id') || ''
  const isError    = params.get('error') || ''

  // Booking state passed from BookAppointment
  const { doctor, slot, videoConsultation, fee, gst, total } = location.state || {}

  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(isError ? 'Payment could not be verified. Please try again.' : '')
  const [formFields, setFormFields] = useState(null)  // set when order is ready to submit

  const docName = stripDr(doctor?.full_name || doctor?.name || 'Doctor')
  const specs   = doctor?.specialties?.length
    ? doctor.specialties
    : [doctor?.specialization || 'General Physician']

  // Auto-submit form when fields are ready
  useEffect(() => {
    if (formFields && formRef.current) {
      formRef.current.submit()
    }
  }, [formFields])

  // Redirect back if no booking state and not a success/error callback
  useEffect(() => {
    if (!isSuccess && !isError && !doctor) {
      navigate('/book-appointment', { replace: true })
    }
  }, [])

  const handleDevPay = async () => {
    setLoading(true)
    setError('')
    try {
      const token = await getAuthToken()
      const res = await fetch(`${API_BASE}/payment/dev-confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          doctor_id:         doctor.id,
          specialty:         (doctor.specialties?.[0] || doctor.specialization || 'general_medicine'),
          patient_note:      `Dev booking with Dr. ${docName}`,
          scheduled_at:      slot?.iso || null,
          consultation_type: videoConsultation ? 'video' : 'in_person',
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Booking failed')
      }
      const { session_id } = await res.json()
      navigate(`/payment?success=true&session_id=${session_id || ''}`, { replace: true })
    } catch (err) {
      setError(err.message || 'Booking failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRazorpayPay = async () => {
    setLoading(true)
    setError('')
    try {
      const token = await getAuthToken()
      const res = await fetch(`${API_BASE}/payments/create-hosted-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          amount:            total * 100,   // paise
          doctor_id:         doctor.id,
          doctor_name:       docName,
          specialty:         (doctor.specialties?.[0] || doctor.specialization || 'general_medicine'),
          scheduled_at:      slot?.iso || '',
          consultation_type: videoConsultation ? 'video' : 'in_person',
          patient_note:      `Consultation with Dr. ${docName}`,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Could not create payment order')
      }
      const fields = await res.json()
      setFormFields(fields)   // triggers useEffect → form.submit()
    } catch (err) {
      setError(err.message || 'Payment could not be initiated. Please try again.')
      setLoading(false)
    }
  }

  /* ── Success screen ── */
  if (isSuccess) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f8ff 100%)',
        fontFamily: 'var(--font, Inter, sans-serif)', padding: 24,
      }}>
        <div style={{
          background: '#fff', borderRadius: 24, padding: '48px 40px', maxWidth: 420, width: '100%',
          textAlign: 'center', boxShadow: '0 20px 60px rgba(25,48,170,0.12)',
        }}>
          <CheckCircle size={64} color="#00c853" style={{ marginBottom: 20 }} />
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', margin: '0 0 10px', fontFamily: 'var(--serif, serif)' }}>
            Booking Confirmed!
          </h1>
          <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7, margin: '0 0 32px' }}>
            Your {videoConsultation ? 'video consultation' : 'appointment'} has been booked successfully.
            The doctor will be in touch shortly.
          </p>
          {sessionId && (
            <p style={{ fontSize: 11, color: '#aaa', marginBottom: 24 }}>
              Booking ID: <code style={{ fontSize: 11 }}>{sessionId.slice(0, 8)}…</code>
            </p>
          )}
          <button
            onClick={() => navigate('/consultations')}
            style={{
              display: 'block', width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #1930AA, #00AFEF)', color: '#fff',
              fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 6px 20px rgba(25,48,170,0.25)', marginBottom: 12,
            }}
          >
            View My Consultations
          </button>
          <button
            onClick={() => navigate('/chat')}
            style={{
              display: 'block', width: '100%', padding: '12px 0', borderRadius: 12,
              border: '1.5px solid rgba(25,48,170,0.15)', background: 'none',
              color: '#1930AA', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Back to AI Chat
          </button>
        </div>
      </div>
    )
  }

  /* ── Payment page ── */
  return (
    <div style={{
      minHeight: '100vh', background: '#f0f4fa',
      fontFamily: 'var(--font, Inter, sans-serif)', display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 24px', background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.07)',
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
            borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)', background: 'none',
            cursor: 'pointer', fontSize: 13, color: '#444', fontFamily: 'inherit',
          }}
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: '#111', margin: 0 }}>Complete Payment</h1>
          {IS_DEV && (
            <span style={{ fontSize: 10, background: '#ff6d00', color: '#fff', padding: '1px 7px', borderRadius: 4, fontWeight: 700 }}>
              DEV MODE
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '40px 24px', gap: 24, flexWrap: 'wrap',
      }}>

        {/* Left: Order summary */}
        <div style={{ flex: '1 1 320px', maxWidth: 440 }}>
          <div style={{
            background: '#fff', borderRadius: 20, overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1.5px solid rgba(0,0,0,0.06)',
          }}>
            {/* Gradient header */}
            <div style={{ padding: '24px 28px', background: 'linear-gradient(135deg, #1930AA, #00AFEF)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px' }}>
                Order Summary
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {videoConsultation ? <Video size={18} color="#fff" /> : <Stethoscope size={18} color="#fff" />}
                <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
                  {videoConsultation ? 'Video Consultation' : 'In-Person Consultation'}
                </span>
              </div>
            </div>

            <div style={{ padding: '24px 28px' }}>
              {/* Doctor */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '16px',
                background: 'rgba(25,48,170,0.04)', borderRadius: 14, marginBottom: 20,
                border: '1px solid rgba(25,48,170,0.08)',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #1930AA, #00AFEF)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, color: '#fff',
                }}>
                  {docName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>Dr. {docName}</div>
                  <div style={{ fontSize: 12, color: '#1930AA', fontWeight: 600, marginTop: 2 }}>
                    {specs.slice(0, 2).join(' · ')}
                  </div>
                </div>
              </div>

              {/* Slot */}
              {slot && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                  background: 'rgba(0,188,212,0.05)', borderRadius: 12, marginBottom: 20,
                  border: '1px solid rgba(0,188,212,0.15)',
                }}>
                  <Calendar size={15} color="#00AFEF" />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#00AFEF', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Appointment Slot
                    </div>
                    <div style={{ fontSize: 13, color: '#333', fontWeight: 600, marginTop: 1 }}>{slot.label}</div>
                  </div>
                </div>
              )}

              {/* Price breakdown */}
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)', paddingTop: 16 }}>
                {[
                  { label: videoConsultation ? 'Video Consultation Fee' : 'Consultation Fee', value: `₹${fee}` },
                  { label: 'Platform Fee',  value: '₹0' },
                  { label: 'GST (18%)',     value: `₹${gst}` },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 13, color: '#666', marginBottom: 10,
                  }}>
                    <span>{label}</span>
                    <span style={{ fontWeight: 600, color: '#333' }}>{value}</span>
                  </div>
                ))}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 18, fontWeight: 800, color: '#111',
                  borderTop: '2px solid rgba(0,0,0,0.08)', paddingTop: 12, marginTop: 6,
                }}>
                  <span>Total</span>
                  <span style={{ color: '#1930AA' }}>₹{total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trust badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
            marginTop: 16, color: '#999', fontSize: 12,
          }}>
            <ShieldCheck size={14} color="#00c853" />
            <span>256-bit SSL encryption · Secured by Razorpay</span>
          </div>
        </div>

        {/* Right: Pay button card */}
        <div style={{ flex: '1 1 280px', maxWidth: 340 }}>
          <div style={{
            background: '#fff', borderRadius: 20, padding: '32px 28px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1.5px solid rgba(0,0,0,0.06)',
          }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111', margin: '0 0 8px' }}>
              Ready to Pay?
            </h2>
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 28px', lineHeight: 1.6 }}>
              Your booking will be confirmed immediately after payment.
            </p>

            {error && (
              <div style={{
                fontSize: 13, color: '#c62828', background: 'rgba(198,40,40,0.07)',
                padding: '12px 14px', borderRadius: 10, marginBottom: 20, lineHeight: 1.5,
              }}>
                {error}
              </div>
            )}

            <button
              onClick={IS_DEV ? handleDevPay : handleRazorpayPay}
              disabled={loading}
              style={{
                display: 'block', width: '100%', padding: '15px 0', borderRadius: 12, border: 'none',
                background: loading ? 'rgba(0,0,0,0.07)' : 'linear-gradient(135deg, #1930AA, #00AFEF)',
                color: loading ? '#bbb' : '#fff',
                fontSize: 15, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
                fontFamily: 'inherit', transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 6px 20px rgba(25,48,170,0.25)',
              }}
            >
              {loading
                ? 'Redirecting…'
                : IS_DEV
                  ? `Confirm Booking (Dev)`
                  : `Pay ₹${total} via Razorpay`
              }
            </button>

            <button
              onClick={() => navigate(-1)}
              disabled={loading}
              style={{
                display: 'block', width: '100%', padding: '12px 0', borderRadius: 12,
                border: '1.5px solid rgba(0,0,0,0.1)', background: 'none',
                color: '#666', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', marginTop: 12,
              }}
            >
              Cancel
            </button>

            {!IS_DEV && (
              <p style={{ fontSize: 11, color: '#bbb', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
                By proceeding you agree to Razorpay's Terms of Service.
                You will be redirected to Razorpay's secure payment page.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Hidden form submitted to Razorpay hosted checkout */}
      {formFields && (
        <form
          ref={formRef}
          action="https://api.razorpay.com/v1/checkout/embedded"
          method="POST"
          style={{ display: 'none' }}
        >
          {Object.entries(formFields).map(([key, val]) => (
            <input key={key} type="hidden" name={key} value={val ?? ''} />
          ))}
        </form>
      )}
    </div>
  )
}
