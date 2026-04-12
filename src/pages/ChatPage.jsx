import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Send, Plus, Calendar, Video, ClipboardList, History, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { sendMessage as chatSend, restorePreLoginChat } from '../api/chat'
import Logo from '../components/Logo'

/* ─── Triage colors ─── */
const triageColors = {
  low: 'var(--ok)',
  medium: 'var(--warn)',
  high: '#FF6D00',
  emergency: 'var(--err)',
}

/* ─── Session storage key ─── */
const CHAT_SESSION_KEY = 'medivora_chat_session'
const SPECIALTY_KEY    = 'medivora_recommended_specialty'

/* ─── Extract specialty from medical report text ─── */
function extractSpecialtyFromText(text) {
  if (!text) return null
  // Handles: "🏥 **Specialty Needed**: Gastroenterology" or "Specialist Needed: gastroenterology"
  // \*? handles optional bold markdown around "Needed"
  const m = text.match(/Special(?:ty|ist)\s+Needed\*?\*?[:\s]+([a-zA-Z_]+)/i)
  if (m) return m[1].toLowerCase().trim()
  // Fallback: "🏥 [anything]: Gastroenterology" (the hospital emoji line)
  const m2 = text.match(/🏥[^\n:]+:\s*([a-zA-Z_]{4,30})/)
  if (m2) return m2[1].toLowerCase().trim()
  return null
}

/* ─── Orb Component ─── */
function AiOrb({ isListening, isTyping }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 200, height: 200 }}>
      {/* Outer pulse ring */}
      <div style={{
        position: 'absolute', width: 200, height: 200, borderRadius: '50%',
        border: '1px solid rgba(0,188,212,0.25)',
        animation: 'orbPulse 3s ease-in-out infinite',
      }} />
      {/* Rotating particle ring */}
      <div style={{
        position: 'absolute', width: 180, height: 180, borderRadius: '50%',
        animation: 'orbRotate 20s linear infinite',
      }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 6, height: 6, borderRadius: '50%', background: '#00BCD4', boxShadow: '0 0 8px #00BCD4' }} />
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 5, height: 5, borderRadius: '50%', background: '#7C4DFF', boxShadow: '0 0 6px #7C4DFF' }} />
        <div style={{ position: 'absolute', top: '50%', left: 0, transform: 'translateY(-50%)', width: 4, height: 4, borderRadius: '50%', background: 'rgba(0,188,212,0.5)' }} />
        <div style={{ position: 'absolute', top: '50%', right: 0, transform: 'translateY(-50%)', width: 5, height: 5, borderRadius: '50%', background: 'rgba(124,77,255,0.5)' }} />
      </div>
      {/* Inner orb */}
      <div style={{
        width: 150, height: 150, borderRadius: '50%',
        background: 'radial-gradient(ellipse at 35% 35%, rgba(0,188,212,0.18), rgba(124,77,255,0.08) 60%, rgba(20,73,181,0.05))',
        border: '1px solid rgba(0,188,212,0.35)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: isTyping ? 'orbBreathe 1.5s ease-in-out infinite' : 'none',
      }}>
        <Logo size={52} />
      </div>
    </div>
  )
}

/* ─── Markdown-lite formatter ─── */
function formatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#1930AA">$1</strong>')
    .replace(/\n/g, '<br/>')
    .replace(/• /g, '&nbsp;&nbsp;• ')
}


/* ══════════════════════════════ MAIN PAGE ══════════════════════════════ */
export default function ChatPage() {
  const { user, displayName, pendingChatRestore, clearPendingRestore } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const lastAutoMsg = useRef(null)

  /* ─── Build welcome message ─── */
  const buildWelcome = useCallback((name) => ({
    id: 'welcome',
    sender: 'ai',
    content: `Hello${name ? `, ${name}` : ''}! I'm your Medivora AI health assistant. 💙\n\nThis is a **completely private, zero-judgment space**. Nothing is recorded or shared.\n\nDescribe what you're experiencing in your own words, or tap a quick option on the left. I'm here to listen and guide you to the right care.`,
  }), [])

  const [messages,       setMessages]       = useState(() => {
    try { const p = JSON.parse(sessionStorage.getItem(CHAT_SESSION_KEY) || '{}'); return p.messages?.length ? p.messages : [] } catch { return [] }
  })
  const [conversationId, setConversationId] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(CHAT_SESSION_KEY) || '{}').conversationId || null } catch { return null }
  })
  const [lastSpecialty,  setLastSpecialty]  = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(CHAT_SESSION_KEY) || '{}').lastSpecialty || null } catch { return null }
  })
  const [input,          setInput]          = useState('')
  const [isTyping,       setIsTyping]       = useState(false)
  const [lastTriage,     setLastTriage]     = useState(null)

  const [error, setError] = useState(null)
  const [isRestoring, setIsRestoring] = useState(false)
  const [restoreError, setRestoreError] = useState(null)
  const endRef  = useRef(null)
  const inputRef = useRef(null)

  /* ─── Show welcome message if no history ─── */
  useEffect(() => {
    if (messages.length === 0) setMessages([buildWelcome(displayName)])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const showOrb = messages.length <= 1 && !isTyping

  /* ─── Persist messages + specialty to sessionStorage on every change ─── */
  useEffect(() => {
    try {
      sessionStorage.setItem(CHAT_SESSION_KEY, JSON.stringify({ messages, conversationId, lastSpecialty }))
    } catch (_) {}
  }, [messages, conversationId, lastSpecialty])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  /* ─── Send message ─── */
  const sendMessage = async (text) => {
    const trimmed = text.trim()
    if (!trimmed) return
    if (isTyping) return
    setError(null)

    const userMsg = { id: Date.now(), sender: 'user', content: trimmed }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      const data = await chatSend(trimmed, conversationId)
      if (data.session_id) setConversationId(data.session_id)
      if (data.triage) setLastTriage(data.triage)
      const responseText = data.response || ''
      const isMedicalReport = data.additional_data?.is_medical_report || false
      // Extract specialty: backend field first, then parse from response text
      const specialty = data.additional_data?.recommended_specialty
        || data.additional_data?.consultation_booked?.specialty
        || (isMedicalReport ? extractSpecialtyFromText(responseText) : null)
        || null
      if (specialty) {
        setLastSpecialty(specialty)
        sessionStorage.setItem(SPECIALTY_KEY, specialty)
      }
      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        content: responseText || "I'm sorry, I couldn't process your message. Please try again.",
        triage: data.triage || null,
        specialty: specialty,
        is_medical_report: isMedicalReport,
        is_book_appointment: data.additional_data?.is_book_appointment || false,
      }
      setMessages(prev => [...prev, aiMsg])
    } catch (err) {
      setError('Connection issue. Please try again.')
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
      }])
    } finally {
      setIsTyping(false)
      inputRef.current?.focus()
    }
  }

  /* ─── New Chat ─── */
  const startNewChat = () => {
    const welcome = buildWelcome(displayName)
    setMessages([welcome])
    setConversationId(null)
    setLastTriage(null)
    setLastSpecialty(null)
    setInput('')
    setError(null)
    sessionStorage.removeItem(CHAT_SESSION_KEY)
    sessionStorage.removeItem(SPECIALTY_KEY)
    inputRef.current?.focus()
  }

  /* ─── Restore pre-login chat ─── */
  const handleRestore = async () => {
    if (!pendingChatRestore || isRestoring) return
    setIsRestoring(true)
    setRestoreError(null)
    try {
      const data = await restorePreLoginChat(pendingChatRestore.messages)
      // Map pre-login messages to ChatPage format
      const restored = pendingChatRestore.messages.map((m, i) => ({
        id: `restored_${i}`,
        sender: m.role === 'user' ? 'user' : 'ai',
        content: m.text,
        is_medical_report: m.isReport || false,
        is_book_appointment: m.isBooking || false,
      }))
      setMessages(restored)
      setConversationId(data.session_id)
      clearPendingRestore()
      setTimeout(() => inputRef.current?.focus(), 100)
    } catch (err) {
      setRestoreError(err.message || 'Could not restore. Please try again.')
    } finally {
      setIsRestoring(false)
    }
  }

  const handleDismissRestore = () => {
    clearPendingRestore()
    setRestoreError(null)
  }

  /* ─── Auto-send from navigation state (quick symptoms or any external trigger) ─── */
  useEffect(() => {
    const msg = location.state?.autoMessage
    if (!msg || typeof msg !== 'string' || msg === lastAutoMsg.current) return
    lastAutoMsg.current = msg
    navigate(location.pathname, { replace: true, state: {} })
    sendMessage(msg)
  }, [location.state])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  return (
    <div style={{ height: '100%', minHeight: 0, flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--dark)', fontFamily: 'var(--font)', position: 'relative' }}>

      {/* ── Triage banner ── */}
      {lastTriage && lastTriage.level !== 'low' && (
        <div style={{
          margin: '8px 16px 0', padding: '10px 14px', borderRadius: 10, flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 12,
          background: `${triageColors[lastTriage.level]}0C`,
          border: `1px solid ${triageColors[lastTriage.level]}25`,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: triageColors[lastTriage.level] }} />
          <span style={{ color: 'var(--g400)' }}>
            Triage: <strong style={{ color: triageColors[lastTriage.level] }}>{lastTriage.level.toUpperCase()}</strong>
            {' · '}Recommended: <strong style={{ color: 'var(--g300)' }}>{lastTriage.recommended_speciality}</strong>
            {lastTriage.risk_score && <span> · Risk: {lastTriage.risk_score}%</span>}
          </span>
        </div>
      )}

      {/* ── Pre-login chat restore banner ── */}
      {pendingChatRestore && (
        <div style={{
          margin: '8px 16px 0', padding: '12px 16px', borderRadius: 12, flexShrink: 0,
          background: 'rgba(25,48,170,0.05)', border: '1.5px solid rgba(25,48,170,0.18)',
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <History size={16} color="#1930AA" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1930AA' }}>
              You had a conversation before logging in.
            </span>
            <span style={{ fontSize: 12, color: 'var(--g500)', marginLeft: 6 }}>
              Restore it so I can continue helping you.
            </span>
            {restoreError && (
              <div style={{ fontSize: 11, color: 'var(--err)', marginTop: 4 }}>{restoreError}</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={handleRestore}
              disabled={isRestoring}
              style={{
                padding: '7px 16px', borderRadius: 8, border: 'none', cursor: isRestoring ? 'default' : 'pointer',
                background: isRestoring ? 'rgba(0,0,0,0.07)' : 'linear-gradient(135deg,#1930AA,#00AFEF)',
                color: isRestoring ? '#aaa' : '#fff', fontSize: 12, fontWeight: 700,
                fontFamily: 'var(--font)', transition: 'all 0.2s',
              }}
            >
              {isRestoring ? 'Restoring…' : 'Restore Chat'}
            </button>
            <button
              onClick={handleDismissRestore}
              style={{
                width: 28, height: 28, borderRadius: '50%', border: 'none',
                background: 'rgba(0,0,0,0.06)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={13} color="var(--g500)" />
            </button>
          </div>
        </div>
      )}

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, position: 'relative' }}>

        {/* ── NEW CHAT floating button ── */}
        <button
          onClick={startNewChat}
          title="Start a new chat"
          style={{
            position: 'absolute', top: 12, right: 16, zIndex: 10,
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
            background: 'rgba(25,48,170,0.08)', color: '#1930AA',
            fontSize: 12, fontWeight: 600, fontFamily: 'var(--font)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(25,48,170,0.14)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(25,48,170,0.18)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(25,48,170,0.08)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)' }}
        >
          <Plus size={13} />
          New Chat
        </button>

        {/* ── Messages area ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {showOrb ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
              <AiOrb isListening={false} isTyping={isTyping} />
              <p style={{ fontSize: 13, color: 'var(--g500)', textAlign: 'center', maxWidth: 280 }}>
                Describe your symptoms or ask a health question
              </p>
            </div>
          ) : (
            <div style={{ maxWidth: 680, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4 }}>
              {messages.map((msg, idx) => {
                // If this message triggers booking but has no report, find the last report
                const lastReport = (msg.is_book_appointment && !msg.is_medical_report)
                  ? messages.slice(0, idx).reverse().find(m => m.is_medical_report)
                  : null

                return (
                <div key={msg.id} style={{ display: 'flex', gap: 10, flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row', animation: 'fadeUp 0.3s ease-out' }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    ...(msg.sender === 'ai'
                      ? { background: 'linear-gradient(135deg, var(--blue), var(--cyan))' }
                      : { background: 'var(--g800)', border: '1px solid rgba(0,0,0,0.1)' }
                    )
                  }}>
                    {msg.sender === 'ai' ? <Logo size={16} /> : <span style={{ fontSize: 12 }}>👤</span>}
                  </div>
                  <div style={{ maxWidth: '80%' }}>
                    {/* Re-show last medical report before the booking button if needed */}
                    {lastReport && (
                      <div style={{
                        padding: '12px 16px', borderRadius: 18, fontSize: 13, lineHeight: 1.75,
                        background: '#f0f7ff', border: '1.5px solid rgba(25,48,170,0.18)',
                        borderBottomLeftRadius: 4, color: 'var(--g300)', marginBottom: 8,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid rgba(25,48,170,0.12)' }}>
                          <ClipboardList size={14} color="#1930AA" />
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#1930AA', textTransform: 'uppercase', letterSpacing: 0.5 }}>Medical Assessment Report</span>
                        </div>
                        <div dangerouslySetInnerHTML={{ __html: formatMessage(lastReport.content) }} />
                      </div>
                    )}
                    <div
                      style={{
                        padding: '12px 16px', borderRadius: 18, fontSize: 13, lineHeight: 1.75,
                        ...(msg.sender === 'ai'
                          ? msg.is_medical_report
                            ? { background: '#f0f7ff', border: '1.5px solid rgba(25,48,170,0.18)', borderBottomLeftRadius: 4, color: 'var(--g300)' }
                            : { background: '#ffffff', border: '1px solid var(--g800)', borderBottomLeftRadius: 4, color: 'var(--g300)' }
                          : { background: 'rgba(20,73,181,0.15)', border: '1px solid rgba(20,73,181,0.25)', borderBottomRightRadius: 4, color: 'var(--g300)' }
                        )
                      }}
                    >
                      {msg.is_medical_report && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid rgba(25,48,170,0.12)' }}>
                          <ClipboardList size={14} color="#1930AA" />
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#1930AA', textTransform: 'uppercase', letterSpacing: 0.5 }}>Medical Assessment Report</span>
                        </div>
                      )}
                      <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                    </div>
                    {msg.triage && msg.triage.level !== 'low' && (
                      <div style={{ marginTop: 5, paddingLeft: 4, fontSize: 10, color: 'var(--g500)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: triageColors[msg.triage.level] }} />
                        Risk: {msg.triage.risk_score}% · {msg.triage.category}
                      </div>
                    )}
                    {(msg.is_medical_report || msg.is_book_appointment) && (
                      <div style={{ marginTop: 10 }}>
                        <button
                          onClick={() => {
                            // Resolve specialty from every available source
                            const fromStorage = sessionStorage.getItem(SPECIALTY_KEY)
                            const scanSpecialty = messages
                              .filter(m => m.is_medical_report && m.content)
                              .map(m => m.specialty || extractSpecialtyFromText(m.content))
                              .filter(Boolean)
                              .pop() || null
                            const resolvedSpecialty = msg.specialty || lastSpecialty || fromStorage || scanSpecialty || msg.triage?.recommended_speciality
                            navigate('/book-appointment', {
                              state: {
                                triage: {
                                  ...(msg.triage || lastReport?.triage || {}),
                                  ...(resolvedSpecialty ? { recommended_speciality: resolvedSpecialty } : {}),
                                },
                              },
                            })
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
                            borderRadius: 10, border: 'none', cursor: 'pointer',
                            background: 'linear-gradient(135deg, #1930AA, #00AFEF)',
                            color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font)',
                            boxShadow: '0 4px 14px rgba(25,48,170,0.25)',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(25,48,170,0.38)'}
                          onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(25,48,170,0.25)'}
                        >
                          <Calendar size={13} />
                          Book Appointment
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                )
              })}

              {isTyping && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, var(--blue), var(--cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Logo size={16} />
                  </div>
                  <div style={{ padding: '14px 16px', borderRadius: 18, background: '#ffffff', border: '1px solid var(--g800)', borderBottomLeftRadius: 4, display: 'flex', gap: 5 }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', animation: `typing 1.4s infinite ${i * 0.2}s` }} />
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div style={{ textAlign: 'center', padding: '8px 16px', fontSize: 12, color: 'var(--err)' }}>
                  {error} <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'var(--cyan)', cursor: 'pointer', fontSize: 12 }}>Dismiss</button>
                </div>
              )}
              <div ref={endRef} />
            </div>
          )}
        </div>

        {/* ── Input Bar ── */}
        <div style={{ padding: '6px 20px 14px', flexShrink: 0, borderTop: '1px solid rgba(0,0,0,0.04)' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: 680, margin: '0 auto' }}>

            {/* Text input */}
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center',
              background: 'rgba(0,0,0,0.025)', border: '1.5px solid rgba(0,0,0,0.09)',
              borderRadius: 14, padding: '0 16px', transition: 'border-color 0.3s',
            }}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(0,188,212,0.35)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.09)'}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your symptoms or ask a health question…"
                style={{
                  flex: 1, padding: '12px 0', background: 'transparent', border: 'none',
                  outline: 'none', fontSize: 13, color: 'var(--g300)', fontFamily: 'var(--font)',
                }}
              />
            </div>

            {/* Send button */}
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              style={{
                width: 44, height: 44, borderRadius: '50%', border: 'none', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: input.trim() ? 'pointer' : 'default',
                background: input.trim() ? 'linear-gradient(135deg, var(--blue), var(--cyan))' : 'rgba(0,0,0,0.04)',
                boxShadow: input.trim() ? '0 4px 18px rgba(0,188,212,0.25)' : 'none',
                transition: 'all 0.3s',
              }}
            >
              <Send size={16} color={input.trim() ? '#fff' : 'var(--g700)'} />
            </button>
          </div>
          {user && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap', maxWidth: 680, margin: '8px auto 0' }}>
              <button
                onClick={() => navigate('/doctors')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px',
                  borderRadius: 20, border: '1px solid rgba(0,175,239,0.3)', cursor: 'pointer',
                  background: 'rgba(0,175,239,0.06)', color: '#0077a8',
                  fontSize: 12, fontWeight: 600, fontFamily: 'var(--font)', transition: 'all 0.18s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,175,239,0.12)'; e.currentTarget.style.borderColor = 'rgba(0,175,239,0.5)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,175,239,0.06)'; e.currentTarget.style.borderColor = 'rgba(0,175,239,0.3)' }}
              >
                <Video size={13} /> Book Video Consultation
              </button>
              <button
                onClick={() => navigate('/book-appointment')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px',
                  borderRadius: 20, border: '1px solid rgba(25,48,170,0.22)', cursor: 'pointer',
                  background: 'rgba(25,48,170,0.06)', color: '#1930AA',
                  fontSize: 12, fontWeight: 600, fontFamily: 'var(--font)', transition: 'all 0.18s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(25,48,170,0.12)'; e.currentTarget.style.borderColor = 'rgba(25,48,170,0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(25,48,170,0.06)'; e.currentTarget.style.borderColor = 'rgba(25,48,170,0.22)' }}
              >
                <Calendar size={13} /> Book Physical Appointment
              </button>
            </div>
          )}
          <p style={{ textAlign: 'center', fontSize: 10, color: 'var(--g700)', marginTop: 8 }}>
            🔒 Private · No data stored · Not a substitute for professional medical advice
          </p>
        </div>
      </main>

      <style>{`
        @keyframes orbPulse {
          0%, 100% { box-shadow: 0 0 40px 10px rgba(0,188,212,0.2), 0 0 80px 20px rgba(0,188,212,0.07); }
          50% { box-shadow: 0 0 60px 20px rgba(0,188,212,0.35), 0 0 120px 40px rgba(0,188,212,0.12); }
        }
        @keyframes orbRotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes orbBreathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.03); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes typing { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1.1); } }
      `}</style>
    </div>
  )
}
