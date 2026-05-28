import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Send, Plus, Calendar, Video, ClipboardList, History, X, Camera, Mic, MicOff, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { sendMessage as chatSend, restorePreLoginChat, uploadChatImage, sendVoiceMessage } from '../api/chat'
import Logo from '../components/Logo'
import { useBreakpoint } from '../hooks/useBreakpoint'

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
  const m = text.match(/Special(?:ty|ist)\s+Needed\*?\*?[:\s]+([a-zA-Z_]+)/i)
  if (m) return m[1].toLowerCase().trim()
  const m2 = text.match(/🏥[^\n:]+:\s*([a-zA-Z_]{4,30})/)
  if (m2) return m2[1].toLowerCase().trim()
  return null
}

/* ─── Strip markdown for TTS ─── */
function stripMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s*/g, '')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/&nbsp;/g, ' ')
    .replace(/•/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .trim()
}

/* ─── Detect Hindi (Devanagari) in text ─── */
function containsHindi(text) {
  return /[\u0900-\u097F]/.test(text)
}

/* ─── Orb Component (welcome orb + voice state animations) ─── */
function AiOrb({ isTyping, orbState }) {
  const waveRings  = orbState === 'speaking'  ? [0, 1, 2] : []
  const listenRings = orbState === 'listening' ? [0, 1]    : []

  const innerAnim = orbState === 'thinking'
    ? 'orbBreathe 1.2s ease-in-out infinite'
    : orbState === 'speaking'
    ? 'orbBreathe 0.7s ease-in-out infinite'
    : isTyping ? 'orbBreathe 1.5s ease-in-out infinite'
    : 'none'

  const rotateAnim = orbState === 'thinking'
    ? 'orbRotateFast 4s linear infinite'
    : 'orbRotate 20s linear infinite'

  const innerBg = orbState === 'speaking'
    ? 'radial-gradient(ellipse at 35% 35%, rgba(124,77,255,0.28), rgba(0,188,212,0.12) 60%, rgba(20,73,181,0.06))'
    : orbState === 'thinking'
    ? 'radial-gradient(ellipse at 35% 35%, rgba(20,73,181,0.28), rgba(0,188,212,0.12) 60%, rgba(124,77,255,0.06))'
    : orbState === 'listening'
    ? 'radial-gradient(ellipse at 35% 35%, rgba(0,188,212,0.28), rgba(124,77,255,0.12) 60%, rgba(20,73,181,0.06))'
    : 'radial-gradient(ellipse at 35% 35%, rgba(0,188,212,0.18), rgba(124,77,255,0.08) 60%, rgba(20,73,181,0.05))'

  const innerShadow = orbState === 'speaking'
    ? '0 0 40px 12px rgba(124,77,255,0.22), 0 0 80px 24px rgba(124,77,255,0.08)'
    : orbState === 'listening'
    ? '0 0 50px 16px rgba(0,188,212,0.25), 0 0 100px 32px rgba(0,188,212,0.08)'
    : orbState === 'thinking'
    ? '0 0 40px 12px rgba(20,73,181,0.18), 0 0 80px 24px rgba(20,73,181,0.06)'
    : undefined

  const borderColor = orbState === 'speaking' ? 'rgba(124,77,255,0.45)' : 'rgba(0,188,212,0.35)'

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 200, height: 200 }}>
      {/* Outer pulse ring */}
      <div style={{
        position: 'absolute', width: 200, height: 200, borderRadius: '50%',
        border: '1px solid rgba(0,188,212,0.25)',
        animation: 'orbPulse 3s ease-in-out infinite',
      }} />
      {/* Listening: expanding pulse rings */}
      {listenRings.map(i => (
        <div key={i} style={{
          position: 'absolute',
          width: 200 + i * 45, height: 200 + i * 45, borderRadius: '50%',
          border: `1px solid rgba(0,188,212,${0.3 - i * 0.1})`,
          animation: `orbPulse ${2.5 + i * 0.6}s ease-in-out infinite`,
          animationDelay: `${i * 0.4}s`,
        }} />
      ))}
      {/* Speaking: radiating wave rings */}
      {waveRings.map(i => (
        <div key={i} style={{
          position: 'absolute', width: 150, height: 150, borderRadius: '50%',
          border: '1.5px solid rgba(124,77,255,0.45)',
          animation: 'voiceWave 1.6s ease-out infinite',
          animationDelay: `${i * 0.5}s`,
        }} />
      ))}
      {/* Rotating particle ring */}
      <div style={{
        position: 'absolute', width: 180, height: 180, borderRadius: '50%',
        animation: rotateAnim,
      }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 6, height: 6, borderRadius: '50%', background: '#00BCD4', boxShadow: '0 0 8px #00BCD4' }} />
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 5, height: 5, borderRadius: '50%', background: '#7C4DFF', boxShadow: '0 0 6px #7C4DFF' }} />
        <div style={{ position: 'absolute', top: '50%', left: 0, transform: 'translateY(-50%)', width: 4, height: 4, borderRadius: '50%', background: 'rgba(0,188,212,0.5)' }} />
        <div style={{ position: 'absolute', top: '50%', right: 0, transform: 'translateY(-50%)', width: 5, height: 5, borderRadius: '50%', background: 'rgba(124,77,255,0.5)' }} />
      </div>
      {/* Inner orb */}
      <div style={{
        width: 150, height: 150, borderRadius: '50%',
        background: innerBg,
        border: `1px solid ${borderColor}`,
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: innerAnim,
        boxShadow: innerShadow,
        transition: 'box-shadow 0.5s ease, border-color 0.5s ease',
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

/* Render the structured triage card as formatted HTML.
   Works whether newlines are present (text chat) or stripped (voice header). */
function formatTriageCard(text) {
  if (!text) return ''

  // Decode all percent-encoded chars (Devanagari, emoji, etc.) from _safe_header
  try { text = decodeURIComponent(text) } catch (_) {}

  // Normalise line endings (%0A was already decoded above, but keep the explicit
  // replace as a fallback for any partial-encoding edge cases)
  let t = text.replace(/%0A/g, '\n').replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // If no newlines survived, inject them before known section markers
  if (!t.includes('\n')) {
    const sectionMarkers = ['📋', '👤 PATIENT', '⚕️ SEVERITY', '🩺 CLINICAL', '💊 TREATMENT',
      'Provisional —', 'No medicines should', '⚕️ This is a preliminary']
    sectionMarkers.forEach(m => {
      t = t.replace(new RegExp(m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '\n\n' + m)
    })
    const fieldLabels = ['Name:', 'Age:', 'Gender:', 'Case Reference:', 'Assessment Date:',
      'Condition:', 'Specialist:', 'Also consider:', 'AI Triage:', 'Doctor Recommended:', 'Approval ID:']
    fieldLabels.forEach(f => { t = t.replace(new RegExp(f, 'g'), '\n' + f) })
  }

  const lines = t.split('\n').map(l => l.trim())

  // Split routing block (before 📋) from the card body
  const cardIdx = lines.findIndex(l => l.startsWith('📋'))
  const routingLines = cardIdx > 0 ? lines.slice(0, cardIdx).filter(Boolean) : []
  const cardLines   = cardIdx >= 0 ? lines.slice(cardIdx) : lines

  let html = ''

  // Routing banner (NEXT STEP / EMERGENCY block)
  if (routingLines.length) {
    html += `<div style="background:rgba(25,48,170,0.07);border-radius:8px;padding:10px 12px;margin-bottom:12px;font-size:12px;line-height:1.65;">${
      routingLines.join('<br/>')
    }</div>`
  }

  for (const line of cardLines) {
    if (!line || line === '---' || /^═+$/.test(line)) continue

    if (line.startsWith('📋')) {
      html += `<div style="font-size:13px;font-weight:700;color:#1930AA;margin-bottom:2px;">${line}</div>`
    } else if (line.startsWith('Provisional')) {
      html += `<div style="font-size:10px;color:#999;font-style:italic;margin-bottom:10px;">${line}</div>`
    } else if (/^(👤|⚕️ SEVERITY|🩺|💊)/.test(line)) {
      html += `<div style="font-size:11px;font-weight:700;color:#1930AA;margin:10px 0 5px;padding-top:8px;border-top:1px solid rgba(25,48,170,0.08);">${line}</div>`
    } else if (/^(🟢|🟡|🔴|🆘)/.test(line)) {
      html += `<div style="font-size:12px;font-weight:600;margin:2px 0;">${line}</div>`
    } else if (/^(Name|Age|Gender|Case Reference|Assessment Date|Condition|Specialist|Also consider|AI Triage|Doctor Recommended|Approval ID):/.test(line)) {
      const ci = line.indexOf(':')
      html += `<div style="font-size:12px;margin:2px 0;"><span style="color:#777;">${line.slice(0, ci)}:</span> <span style="color:#222;">${line.slice(ci + 1).trim()}</span></div>`
    } else if (line.startsWith('No medicines')) {
      html += `<div style="font-size:11px;color:#c0392b;font-weight:600;margin-top:10px;">${line}</div>`
    } else if (line.startsWith('⚕️ This is')) {
      html += `<div style="font-size:10px;color:#999;font-style:italic;margin-top:6px;line-height:1.5;">${line}</div>`
    } else if (line.startsWith('_Just a reminder') || line.startsWith('Just a reminder')) {
      html += `<div style="font-size:10px;color:#aaa;font-style:italic;margin-top:8px;">${line.replace(/_/g, '')}</div>`
    } else {
      html += `<div style="font-size:12px;color:#444;margin:2px 0;line-height:1.55;">${line}</div>`
    }
  }

  return html
}


/* ══════════════════════════════ MAIN PAGE ══════════════════════════════ */
export default function ChatPage() {
  const { user, displayName, pendingChatRestore, clearPendingRestore } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const lastAutoMsg = useRef(null)
  const bp = useBreakpoint()

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
  const endRef   = useRef(null)
  const inputRef = useRef(null)

  // ── Image upload state ──────────────────────────────────────────────────
  const [isAnalysingImage, setIsAnalysingImage] = useState(false)
  const [imageError,       setImageError]       = useState(null)
  const imageInputRef = useRef(null)

  // ── Voice state ─────────────────────────────────────────────────────────
  // orbState: null (hidden) | 'listening' | 'thinking' | 'speaking'
  const [orbState,        setOrbState]        = useState(null)
  const [voiceSupported,  setVoiceSupported]  = useState(true)
  const [voiceError,      setVoiceError]      = useState(null)
  const mediaRecorderRef  = useRef(null)
  const audioChunksRef    = useRef([])
  const audioPlayerRef    = useRef(null)  // current playing Audio element
  const voiceActiveRef    = useRef(false) // tracks whether voice session is intentionally active
  const orbStateRef       = useRef(null)  // mirror of orbState for callbacks
  const silenceTimerRef   = useRef(null)  // silence-detection auto-stop timer
  const audioContextRef   = useRef(null)
  const analyserRef       = useRef(null)
  const silenceRAFRef     = useRef(null)  // requestAnimationFrame id for silence detection

  /* ─── Check MediaRecorder support on mount ─── */
  useEffect(() => {
    if (!window.MediaRecorder) {
      setVoiceSupported(false)
    }
  }, [])

  /* ─── Show welcome message if no history ─── */
  useEffect(() => {
    if (messages.length === 0) setMessages([buildWelcome(displayName)])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ─── Keep orbStateRef in sync ─── */
  useEffect(() => { orbStateRef.current = orbState }, [orbState])

  const showOrb = (messages.length <= 1 && !isTyping) || orbState !== null

  /* ─── Persist messages + specialty to sessionStorage on every change ─── */
  useEffect(() => {
    try {
      sessionStorage.setItem(CHAT_SESSION_KEY, JSON.stringify({ messages, conversationId, lastSpecialty }))
    } catch (_) {}
  }, [messages, conversationId, lastSpecialty])

  /* ─── Notify AppLayout right pane when specialty is identified ─── */
  useEffect(() => {
    if (!lastSpecialty) return
    window.dispatchEvent(new CustomEvent('medivora:specialty-changed', { detail: { specialty: lastSpecialty } }))
  }, [lastSpecialty])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  /* ─── Stop all voice activity ─── */
  const stopVoice = useCallback(() => {
    voiceActiveRef.current = false

    // Stop silence detection
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    if (silenceRAFRef.current) {
      cancelAnimationFrame(silenceRAFRef.current)
      silenceRAFRef.current = null
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close() } catch (_) {}
      audioContextRef.current = null
    }
    analyserRef.current = null

    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop() } catch (_) {}
    }
    mediaRecorderRef.current = null
    audioChunksRef.current = []

    // Stop audio playback
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause()
      audioPlayerRef.current.src = ''
      audioPlayerRef.current = null
    }

    setOrbState(null)
  }, [])

  /* ─── Speak a waiting message using the same TTS pipeline as AI responses ─── */
  const waitingPlayerRef = useRef(null)

  const speakWaiting = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || ''}/chat/waiting-audio`)
      if (!res.ok) return
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const player = new Audio(url)
      waitingPlayerRef.current = player
      player.onended = () => { URL.revokeObjectURL(url); waitingPlayerRef.current = null }
      player.play().catch(() => {})
    } catch (_) {}
  }, [])

  const stopWaiting = useCallback(() => {
    if (waitingPlayerRef.current) {
      waitingPlayerRef.current.pause()
      waitingPlayerRef.current = null
    }
  }, [])

  /* ─── Play TTS audio and loop back to listening ─── */
  const playAudioAndLoop = useCallback((audioUrl) => {
    if (!voiceActiveRef.current) return
    setOrbState('speaking')

    const player = new Audio(audioUrl)
    audioPlayerRef.current = player

    player.onended = () => {
      URL.revokeObjectURL(audioUrl)
      audioPlayerRef.current = null
      if (voiceActiveRef.current) {
        // Loop back: start a fresh recording turn
        startRecordingTurn()
      }
    }
    player.onerror = () => {
      URL.revokeObjectURL(audioUrl)
      audioPlayerRef.current = null
      if (voiceActiveRef.current) {
        startRecordingTurn()
      }
    }

    player.play().catch(() => {
      if (voiceActiveRef.current) startRecordingTurn()
    })
  }, []) // startRecordingTurn added below via ref pattern

  // Ref to break circular dependency between playAudioAndLoop and startRecordingTurn
  const startRecordingTurnRef = useRef(null)
  // Patch playAudioAndLoop to call via ref
  const playAudioAndLoopStable = useCallback((audioUrl) => {
    if (!voiceActiveRef.current) return
    setOrbState('speaking')

    const player = new Audio(audioUrl)
    audioPlayerRef.current = player

    player.onended = () => {
      URL.revokeObjectURL(audioUrl)
      audioPlayerRef.current = null
      if (voiceActiveRef.current) {
        startRecordingTurnRef.current?.()
      }
    }
    player.onerror = () => {
      URL.revokeObjectURL(audioUrl)
      audioPlayerRef.current = null
      if (voiceActiveRef.current) {
        startRecordingTurnRef.current?.()
      }
    }
    player.play().catch(() => {
      if (voiceActiveRef.current) startRecordingTurnRef.current?.()
    })
  }, [])

  /* ─── Play audio then end voice session (used after triage report) ─── */
  const playAudioAndStop = useCallback((audioUrl) => {
    setOrbState('speaking')

    const player = new Audio(audioUrl)
    audioPlayerRef.current = player

    const finish = () => {
      URL.revokeObjectURL(audioUrl)
      audioPlayerRef.current = null
      stopVoice()
    }
    player.onended = finish
    player.onerror = finish
    player.play().catch(finish)
  }, [stopVoice])

  /* ─── Send message (text path, unchanged) ─── */
  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim()
    if (!trimmed) return
    if (isTyping) return
    setError(null)

    const userMsg = { id: Date.now(), sender: 'user', content: trimmed }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // After 5s of silence, speak a waiting message — assessment takes ~11s, quick turns ~3s
    const waitTimer = setTimeout(() => { speakWaiting() }, 5000)

    try {
      const data = await chatSend(trimmed, conversationId)
      clearTimeout(waitTimer)
      stopWaiting()
      if (data.session_id) setConversationId(data.session_id)
      if (data.triage) setLastTriage(data.triage)
      const responseText = data.response || ''
      const isMedicalReport = data.additional_data?.is_medical_report || false
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
      clearTimeout(waitTimer)
      stopWaiting()
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
  }, [isTyping, conversationId, speakWaiting, stopWaiting])

  /* ─── Start a single recording turn (tap-to-stop or silence-auto-stop) ─── */
  const startRecordingTurn = useCallback(async () => {
    if (!voiceActiveRef.current) return
    setOrbState('listening')
    audioChunksRef.current = []

    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    } catch (err) {
      setVoiceError('Microphone access denied. Please allow microphone permissions.')
      stopVoice()
      return
    }

    // Pick supported MIME type
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : MediaRecorder.isTypeSupported('audio/mp4')
      ? 'audio/mp4'
      : ''

    let recorder
    try {
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    } catch (err) {
      setVoiceError('Could not start audio recording. Please try Chrome or Safari.')
      stream.getTracks().forEach(t => t.stop())
      stopVoice()
      return
    }

    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data)
    }

    recorder.onstop = async () => {
      // Stop all mic tracks to release the microphone
      stream.getTracks().forEach(t => t.stop())

      // Stop silence detection
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
      if (silenceRAFRef.current) { cancelAnimationFrame(silenceRAFRef.current); silenceRAFRef.current = null }
      if (audioContextRef.current) { try { audioContextRef.current.close() } catch (_) {} audioContextRef.current = null }
      analyserRef.current = null

      if (!voiceActiveRef.current) return

      const chunks = audioChunksRef.current
      audioChunksRef.current = []
      if (chunks.length === 0) {
        if (voiceActiveRef.current) startRecordingTurnRef.current?.()
        return
      }

      const blob = new Blob(chunks, { type: mimeType || 'audio/webm' })
      if (blob.size < 1000) {
        // Too small — likely silence only; loop back
        if (voiceActiveRef.current) startRecordingTurnRef.current?.()
        return
      }

      setOrbState('thinking')

      // After 5s of "thinking" silence, speak a warm waiting message
      const voiceWaitTimer = setTimeout(() => { speakWaiting() }, 5000)

      try {
        const result = await sendVoiceMessage(blob, conversationId)
        clearTimeout(voiceWaitTimer)
        stopWaiting()

        if (result.sessionId) setConversationId(result.sessionId)

        // Only surface the triage card + Book button — never show transcript or regular text bubbles
        if (result.isMedicalReport || result.isBookAppointment) {
          const aiMsg = {
            id:                  `${Date.now()}-a`,
            sender:              'ai',
            content:             result.aiText,
            is_medical_report:   result.isMedicalReport,
            is_book_appointment: result.isBookAppointment,
            triage:              result.triage,
            specialty:           result.specialty,
          }
          setMessages(prev => [...prev, aiMsg])
          if (result.specialty) sessionStorage.setItem(SPECIALTY_KEY, result.specialty)
        }

        // Play audio response — stop voice after triage report, loop otherwise
        if (result.audioUrl) {
          if (result.isMedicalReport) {
            playAudioAndStop(result.audioUrl)
          } else if (voiceActiveRef.current) {
            playAudioAndLoopStable(result.audioUrl)
          }
        } else if (result.isMedicalReport) {
          stopVoice()
        } else if (voiceActiveRef.current) {
          startRecordingTurnRef.current?.()
        }
      } catch (err) {
        clearTimeout(voiceWaitTimer)
        stopWaiting()
        setVoiceError(err.message || 'Voice request failed. Please try again.')
        stopVoice()
      }
    }

    recorder.onerror = () => {
      stream.getTracks().forEach(t => t.stop())
      if (voiceActiveRef.current) {
        setVoiceError('Recording error. Please try again.')
        stopVoice()
      }
    }

    // Start recording (collect data every 250ms for progressive chunks)
    recorder.start(250)

    // ── Silence detection via AnalyserNode (voice-band energy, adaptive floor) ─
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      const ctx = new AudioContext()
      audioContextRef.current = ctx
      const analyser = ctx.createAnalyser()
      analyserRef.current = analyser
      // 2048-point FFT → ~21 Hz/bin at 44.1 kHz — enough resolution to isolate voice band
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.3
      const source = ctx.createMediaStreamSource(stream)
      source.connect(analyser)

      const freqData = new Uint8Array(analyser.frequencyBinCount)
      let silenceStart = null
      const SILENCE_DURATION_MS = 2200  // 2.2s of silence auto-stops
      const MAX_RECORDING_MS = 25000    // 25s hard cap
      const recordingStartTime = Date.now()

      // Calibrate noise floor for first 800ms using voice-band energy only.
      // Voice band (300–3400 Hz) excludes most fan/AC noise which lives below 300 Hz.
      // Threshold = max(8, voiceBandNoiseFloor × 2.2) — generous multiplier so normal
      // speech pauses don't trigger false silence.
      let calibrated = false
      let calibrationSamples = []
      let SILENCE_THRESHOLD = 8  // fallback floor

      const getVoiceBandEnergy = () => {
        analyser.getByteFrequencyData(freqData)
        const sampleRate = ctx.sampleRate
        const binHz = sampleRate / analyser.fftSize
        // Voice fundamental + harmonics: 300 Hz – 3400 Hz
        const loIdx = Math.floor(300 / binHz)
        const hiIdx = Math.min(Math.ceil(3400 / binHz), freqData.length - 1)
        let sum = 0
        for (let i = loIdx; i <= hiIdx; i++) sum += freqData[i]
        return sum / (hiIdx - loIdx + 1)  // average energy in voice band (0–255 scale)
      }

      const checkSilence = () => {
        if (!voiceActiveRef.current || !analyserRef.current) return
        if (mediaRecorderRef.current?.state !== 'recording') return

        if (Date.now() - recordingStartTime > MAX_RECORDING_MS) {
          if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
          return
        }

        const energy = getVoiceBandEnergy()

        if (!calibrated) {
          calibrationSamples.push(energy)
          if (Date.now() - recordingStartTime >= 800) {
            const avg = calibrationSamples.reduce((a, b) => a + b, 0) / calibrationSamples.length
            SILENCE_THRESHOLD = Math.max(8, avg * 2.2)
            calibrated = true
          }
          silenceRAFRef.current = requestAnimationFrame(checkSilence)
          return
        }

        if (energy < SILENCE_THRESHOLD) {
          if (silenceStart === null) silenceStart = Date.now()
          if (Date.now() - silenceStart > SILENCE_DURATION_MS) {
            if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
            return
          }
        } else {
          silenceStart = null
        }
        silenceRAFRef.current = requestAnimationFrame(checkSilence)
      }
      silenceRAFRef.current = requestAnimationFrame(checkSilence)
    } catch (_) {
      // Silence detection is optional — if it fails, user taps to stop
    }
  }, [conversationId, stopVoice, playAudioAndLoopStable])

  // Keep startRecordingTurnRef in sync
  useEffect(() => { startRecordingTurnRef.current = startRecordingTurn }, [startRecordingTurn])

  /* ─── Start a voice session (first tap) ─── */
  const startListening = useCallback(() => {
    if (!window.MediaRecorder) {
      setVoiceError('Voice input is not supported in this browser. Please use Chrome or Safari.')
      return
    }
    setVoiceError(null)
    voiceActiveRef.current = true
    startRecordingTurn()
  }, [startRecordingTurn])

  /* ─── Mic button handler ─── */
  const handleMicClick = () => {
    if (orbState === 'listening') {
      // Tap while recording — stop the recorder to trigger send (not full stop)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      } else {
        stopVoice()
      }
    } else if (orbState !== null) {
      // Tap while thinking/speaking — cancel everything
      stopVoice()
    } else {
      startListening()
    }
  }

  /* ─── Orb tap handler ─── */
  const handleOrbTap = () => {
    stopVoice()
  }

  /* ─── New Chat ─── */
  const startNewChat = () => {
    stopVoice()
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

  /* ─── Image upload ─── */
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    e.target.value = ''

    const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!ALLOWED.includes(file.type)) {
      setImageError('Please upload a JPEG, PNG, WEBP, or GIF image.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setImageError('Image must be under 10 MB.')
      return
    }

    setImageError(null)
    setIsAnalysingImage(true)

    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.readAsDataURL(file)
    })

    const userMsgId = `img_user_${Date.now()}`
    setMessages(prev => [...prev, {
      id: userMsgId,
      sender: 'user',
      content: '',
      image_preview: dataUrl,
      is_image_upload: true,
    }])

    try {
      const data = await uploadChatImage(file, conversationId)

      if (data.session_id && !conversationId) setConversationId(data.session_id)

      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        content: data.description
          + (data.medical_context ? `\n\n${data.medical_context}` : ''),
        is_image_analysis: true,
      }
      setMessages(prev => [...prev, aiMsg])
    } catch (err) {
      setImageError(err.message || 'Image analysis failed. Please try again.')
      setMessages(prev => prev.filter(m => m.id !== userMsgId))
    } finally {
      setIsAnalysingImage(false)
    }
  }

  /* ─── Auto-send from navigation state ─── */
  useEffect(() => {
    const msg = location.state?.autoMessage
    if (!msg || typeof msg !== 'string' || msg === lastAutoMsg.current) return
    lastAutoMsg.current = msg
    navigate(location.pathname, { replace: true, state: {} })
    sendMessage(msg)
  }, [location.state])

  /* ─── Cleanup voice on unmount ─── */
  useEffect(() => {
    return () => {
      voiceActiveRef.current = false
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      if (silenceRAFRef.current) cancelAnimationFrame(silenceRAFRef.current)
      if (audioContextRef.current) { try { audioContextRef.current.close() } catch (_) {} }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop() } catch (_) {}
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause()
        audioPlayerRef.current.src = ''
      }
    }
  }, [])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  const orbVisible = orbState !== null

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
        <div style={{
          flex: 1, overflowY: 'auto', padding: '20px 20px 8px',
          display: 'flex', flexDirection: 'column', gap: 14,
          position: 'relative',
        }}>

          {showOrb ? (
            <div
              onClick={orbState !== null ? handleOrbTap : undefined}
              style={{
                height: '100%', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 20,
                cursor: orbState !== null ? 'pointer' : 'default',
              }}
            >
              <AiOrb isTyping={isTyping} orbState={orbState} />
              {orbState !== null ? (
                <div style={{ textAlign: 'center' }}>
                  <p style={{
                    fontSize: 15, fontWeight: 600, margin: 0, letterSpacing: 0.3,
                    color: orbState === 'speaking' ? '#7C4DFF' : '#00BCD4',
                  }}>
                    {orbState === 'listening' ? 'Listening…' : orbState === 'thinking' ? 'Thinking…' : 'Speaking…'}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--g600)', marginTop: 4 }}>Tap to stop</p>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--g500)', textAlign: 'center', maxWidth: 280 }}>
                  Describe your symptoms or ask a health question
                </p>
              )}
            </div>
          ) : (
            <div style={{ maxWidth: 680, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4 }}>
              {messages.map((msg, idx) => {
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
                  <div style={{ maxWidth: bp.isMobile ? '88%' : '80%' }}>
                    {/* ── Image upload preview bubble ── */}
                    {msg.is_image_upload && msg.image_preview && (
                      <div style={{
                        borderRadius: 14, overflow: 'hidden',
                        border: '1px solid rgba(20,73,181,0.2)',
                        maxWidth: bp.isMobile ? 200 : 260,
                        marginLeft: 'auto',
                      }}>
                        <img
                          src={msg.image_preview}
                          alt="Shared photo"
                          style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: 220 }}
                        />
                      </div>
                    )}

                    {/* ── Image analysis result bubble ── */}
                    {msg.is_image_analysis && (
                      <div style={{
                        padding: '12px 16px', borderRadius: 18, borderBottomLeftRadius: 4,
                        background: '#ffffff', border: '1px solid var(--g800)',
                        fontSize: 13, lineHeight: 1.75, color: 'var(--g300)',
                      }}>
                        <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                      </div>
                    )}

                    {/* Re-show last medical report before the booking button if needed */}
                    {!msg.is_image_upload && !msg.is_image_analysis && lastReport && (
                      <div style={{
                        padding: '12px 16px', borderRadius: 18, fontSize: 13, lineHeight: 1.75,
                        background: '#f0f7ff', border: '1.5px solid rgba(25,48,170,0.18)',
                        borderBottomLeftRadius: 4, color: 'var(--g300)', marginBottom: 8,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid rgba(25,48,170,0.12)' }}>
                          <ClipboardList size={14} color="#1930AA" />
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#1930AA', textTransform: 'uppercase', letterSpacing: 0.5 }}>Medical Triage</span>
                        </div>
                        <div dangerouslySetInnerHTML={{ __html: formatTriageCard(lastReport.content) }} />
                      </div>
                    )}
                    {/* Standard text bubble */}
                    {!msg.is_image_upload && !msg.is_image_analysis && (
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
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#1930AA', textTransform: 'uppercase', letterSpacing: 0.5 }}>Medical Triage</span>
                        </div>
                      )}
                      <div dangerouslySetInnerHTML={{ __html: msg.is_medical_report ? formatTriageCard(msg.content) : formatMessage(msg.content) }} />
                    </div>
                    )}
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
        <div style={{ padding: '6px 20px 14px', flexShrink: 0, borderTop: '1px solid rgba(0,0,0,0.04)', position: 'relative', zIndex: 30 }}>

          {/* Image upload error */}
          {imageError && (
            <div style={{
              maxWidth: 680, margin: '0 auto 6px', padding: '7px 12px', borderRadius: 8,
              background: 'rgba(211,47,47,0.07)', border: '1px solid rgba(211,47,47,0.2)',
              display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#c62828',
            }}>
              <AlertTriangle size={12} />
              {imageError}
              <button
                onClick={() => setImageError(null)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#c62828', padding: 0 }}
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Voice error */}
          {voiceError && (
            <div style={{
              maxWidth: 680, margin: '0 auto 6px', padding: '7px 12px', borderRadius: 8,
              background: 'rgba(124,77,255,0.07)', border: '1px solid rgba(124,77,255,0.2)',
              display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#5e35b1',
            }}>
              <MicOff size={12} />
              {voiceError}
              <button
                onClick={() => setVoiceError(null)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#5e35b1', padding: 0 }}
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Hidden file input for image upload */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: 680, margin: '0 auto' }}>

            {/* Image upload button */}
            <button
              onClick={() => imageInputRef.current?.click()}
              disabled={isAnalysingImage || isTyping}
              title="Upload a photo (wound, rash, prescription, etc.)"
              style={{
                width: 44, height: 44, borderRadius: '50%', border: '1.5px solid rgba(0,0,0,0.09)',
                flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: isAnalysingImage || isTyping ? 'default' : 'pointer',
                background: isAnalysingImage ? 'rgba(0,188,212,0.08)' : 'rgba(0,0,0,0.025)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!isAnalysingImage && !isTyping) e.currentTarget.style.borderColor = 'rgba(0,188,212,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.09)' }}
            >
              {isAnalysingImage
                ? <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(0,188,212,0.3)', borderTopColor: '#00BCD4', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                : <Camera size={16} color="var(--g500)" />
              }
            </button>

            {/* Mic button */}
            {voiceSupported && (
              <button
                onClick={handleMicClick}
                disabled={isAnalysingImage}
                title={orbState !== null ? 'Stop voice' : 'Speak your question'}
                style={{
                  width: 44, height: 44, borderRadius: '50%',
                  border: orbState === 'listening'
                    ? '1.5px solid rgba(0,188,212,0.7)'
                    : orbState !== null
                    ? '1.5px solid rgba(124,77,255,0.5)'
                    : '1.5px solid rgba(0,0,0,0.09)',
                  flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: isAnalysingImage ? 'default' : 'pointer',
                  background: orbState === 'listening'
                    ? 'rgba(0,188,212,0.12)'
                    : orbState !== null
                    ? 'rgba(124,77,255,0.1)'
                    : 'rgba(0,0,0,0.025)',
                  transition: 'all 0.2s',
                  animation: orbState === 'listening' ? 'micActivePulse 1.8s ease-in-out infinite' : 'none',
                }}
                onMouseEnter={e => { if (!isAnalysingImage && orbState === null) e.currentTarget.style.borderColor = 'rgba(0,188,212,0.4)' }}
                onMouseLeave={e => { if (orbState === null) e.currentTarget.style.borderColor = 'rgba(0,0,0,0.09)' }}
              >
                {orbState !== null
                  ? <MicOff size={16} color={orbState === 'listening' ? '#00BCD4' : '#7C4DFF'} />
                  : <Mic size={16} color="var(--g500)" />
                }
              </button>
            )}

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
                placeholder={isAnalysingImage ? 'Analysing your image…' : orbVisible ? 'Voice mode active — tap orb to stop' : 'Describe your symptoms or ask a health question…'}
                disabled={isAnalysingImage || orbVisible}
                style={{
                  flex: 1, padding: '12px 0', background: 'transparent', border: 'none',
                  outline: 'none', fontSize: 13, color: 'var(--g300)', fontFamily: 'var(--font)',
                }}
              />
            </div>

            {/* Send button */}
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping || isAnalysingImage || orbVisible}
              style={{
                width: 44, height: 44, borderRadius: '50%', border: 'none', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: input.trim() && !isTyping && !isAnalysingImage && !orbVisible ? 'pointer' : 'default',
                background: input.trim() && !isAnalysingImage && !orbVisible ? 'linear-gradient(135deg, var(--blue), var(--cyan))' : 'rgba(0,0,0,0.04)',
                boxShadow: input.trim() && !isAnalysingImage && !orbVisible ? '0 4px 18px rgba(0,188,212,0.25)' : 'none',
                transition: 'all 0.3s',
              }}
            >
              <Send size={16} color={input.trim() && !isAnalysingImage && !orbVisible ? '#fff' : 'var(--g700)'} />
            </button>
          </div>
          {user && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap', maxWidth: 680, margin: '8px auto 0' }}>
              <button
                onClick={() => {
                  const sp = lastSpecialty || sessionStorage.getItem(SPECIALTY_KEY)
                  navigate('/doctors', sp ? { state: { specialty: sp } } : undefined)
                }}
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
        @keyframes orbRotateFast { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes orbBreathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.03); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes typing { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1.1); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes voiceOrbFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes voiceWave {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes micActivePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0,188,212,0.4); }
          50% { box-shadow: 0 0 0 6px rgba(0,188,212,0); }
        }
      `}</style>
    </div>
  )
}
