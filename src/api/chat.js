// Chat API helpers — connects to the Medivora backend chat agent (api.py)
// The chat endpoint uses multipart form data (not JSON).

import { supabase } from '../pages/supabase'

const CHAT_API_BASE = import.meta.env.VITE_CHAT_API_URL || import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

/**
 * Get the Supabase access token from the current session (if logged in).
 */
async function getToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  } catch {
    return null
  }
}

// Timeout for AI responses — the multi-agent pipeline can take 60-90 s on complex queries.
// Give it 120 s before surfacing a friendly timeout error to the user.
const CHAT_TIMEOUT_MS = 120_000

/**
 * Call the chat endpoint to get an AI response.
 * The backend uses Form(...) so we send multipart/form-data.
 *
 * @param {string} message - The user's message text
 * @param {string|null} sessionId - Existing session ID, or null to start a new session
 * @returns {Promise<{ response: string, session_id: string, status: string, additional_data: object }>}
 */
export async function sendMessage(message, sessionId = null) {
  const formData = new FormData()
  formData.append('message', message)
  if (sessionId) {
    formData.append('session_id', sessionId)
  }

  const headers = {}
  const token = await getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS)

  let res
  try {
    res = await fetch(`${CHAT_API_BASE}/chat`, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('The AI is taking a bit longer than usual. Please try again in a moment.')
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const detail = data?.detail || `Chat request failed (${res.status})`
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
  }

  return data
}

/**
 * Get all chat sessions for the current user.
 */
export async function getActiveSessions(userId) {
  const token = await getToken()
  if (!token || !userId) return []

  const res = await fetch(`${CHAT_API_BASE}/chat/sessions/${userId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })

  if (!res.ok) return []
  const data = await res.json().catch(() => null)
  return data?.sessions || []
}

/**
 * Get all messages in a session, ordered chronologically.
 */
export async function getSessionHistory(sessionId) {
  const token = await getToken()
  if (!token || !sessionId) return []

  const res = await fetch(`${CHAT_API_BASE}/chat/history/${sessionId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })

  if (!res.ok) return []
  const data = await res.json().catch(() => null)
  return data?.messages || []
}

/**
 * Delete (soft-delete) a chat session.
 */
export async function deleteSession(sessionId) {
  const token = await getToken()
  if (!token || !sessionId) return

  await fetch(`${CHAT_API_BASE}/chat/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  })
}

/**
 * Insert user message — handled server-side by the chat endpoint,
 * so this is a no-op on the frontend.
 */
export async function insertUserMessage(sessionId, userId, content) {
  return { id: crypto.randomUUID(), session_id: sessionId, user_id: userId, role: 'user', content, created_at: new Date().toISOString() }
}

/**
 * Create a new chat session — handled automatically by the chat endpoint
 * when no session_id is provided, so this is a no-op.
 */
export async function createSession(userId) {
  return { id: crypto.randomUUID(), user_id: userId, title: `Session ${new Date().toLocaleDateString()}`, is_active: true }
}

/**
 * Subscribe to new messages — not yet implemented (will use WebSocket/SSE later).
 */
export function subscribeToSession(sessionId, onNewMessage) {
  return { id: `chat:${sessionId}` }
}

/**
 * Unsubscribe — no-op for now.
 */
export function unsubscribeFromSession(channel) {
  // no-op
}

/**
 * Restore a pre-login anonymous chat into an authenticated session.
 * Sends the message history to the backend which replays it into the ADK session
 * so the agent can continue with full context.
 *
 * @param {Array} messages - array of { role: 'user'|'ai', text, timestamp, isReport, isBooking }
 * @returns {Promise<{ session_id: string, message_count: number }>}
 */
export async function restorePreLoginChat(messages) {
  const token = await getToken()
  if (!token) throw new Error('Not authenticated')

  const res = await fetch(`${CHAT_API_BASE}/chat/restore`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ messages }),
  })

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(data?.detail || `Restore failed (${res.status})`)
  }
  return data
}
