/**
 * Pre-login chat persistence helpers.
 * Anonymous users' chat is saved here so it can be restored after they log in.
 */

const KEY     = 'medivora_prelogin_chat'
const TTL_MS  = 7 * 24 * 60 * 60 * 1000   // 7 days
const MAX_MSG = 20                           // keep the 20 most recent messages

/**
 * Save pre-login messages to localStorage.
 * Silently ignores write errors (private browsing, quota exceeded).
 * @param {string} anonSessionId - stable client-generated UUID for this anon session
 * @param {Array}  messages      - array of { id, side, text, isReport, isBooking }
 */
export function savePreLoginMessages(anonSessionId, messages) {
  try {
    // Exclude the static welcome message
    const toSave = messages
      .filter(m => m.id !== 'welcome' && m.text)
      .slice(-MAX_MSG)
      .map(m => ({
        role:      m.side === 'user' ? 'user' : 'ai',
        text:      m.text,
        timestamp: new Date().toISOString(),
        isReport:  !!m.isReport,
        isBooking: !!m.isBooking,
      }))

    if (toSave.length === 0) return

    localStorage.setItem(KEY, JSON.stringify({
      anonSessionId,
      savedAt: new Date().toISOString(),
      messages: toSave,
    }))
  } catch (_) {}
}

/**
 * Load pre-login chat from localStorage.
 * Returns null if nothing saved, expired, or too few messages to be useful.
 */
export function loadPreLoginChat() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null

    const data = JSON.parse(raw)
    if (!data?.messages?.length) return null

    // TTL check
    if (data.savedAt && Date.now() - new Date(data.savedAt).getTime() > TTL_MS) {
      clearPreLoginChat()
      return null
    }

    // Must have at least one real user message to be worth restoring
    const hasUserMsg = data.messages.some(m => m.role === 'user')
    if (!hasUserMsg) return null

    return data
  } catch (_) {
    return null
  }
}

/**
 * Remove pre-login chat from localStorage.
 */
export function clearPreLoginChat() {
  try { localStorage.removeItem(KEY) } catch (_) {}
}
