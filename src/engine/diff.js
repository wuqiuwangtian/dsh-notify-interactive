/**
 * Pure state diff between two SessionStatus snapshots.
 *
 * A session's first appearance is a baseline: existing pending interactions and
 * current running state are recorded without producing events, so a page reload
 * or reconnect never replays a backlog of notifications.
 */

/**
 * @typedef {object} PreviousSessionState
 * @property {boolean | undefined} running
 * @property {string | null} pendingKey
 * @property {boolean} completionUnread
 */

/**
 * @typedef {object} InteractionEvent
 * @property {'interaction'} type
 * @property {string} sessionId
 * @property {object} interaction PendingApproval | PendingQuestion carrier.
 */

/**
 * @typedef {object} InteractionClearedEvent
 * @property {'interaction-cleared'} type
 * @property {string} sessionId
 * @property {string} interactionKey
 */

/**
 * @typedef {object} CompletionEvent
 * @property {'completion'} type
 * @property {string} sessionId
 * @property {'running' | 'unread'} source
 */

/**
 * @typedef {object} SessionRemovedEvent
 * @property {'session-removed'} type
 * @property {string} sessionId
 */

/**
 * Diff one status snapshot.
 * @param {Map<string, PreviousSessionState>} previous previous per-session state.
 * @param {Map<string, object>} status current SessionStatus by session id.
 * @returns {{ next: Map<string, PreviousSessionState>, events: Array<InteractionEvent | InteractionClearedEvent | CompletionEvent | SessionRemovedEvent> }}
 */
export function diffSessionStatus(previous, status) {
  const next = new Map()
  const events = []

  for (const [sessionId, sessionStatus] of status) {
    const current = sessionStatus ?? {}
    const pending = current.pendingInteraction
    const pendingKey = pending?.key ?? null
    const before = previous.get(sessionId)
    const unread = current.completionUnread === true
    const running = current.running

    if (before === undefined) {
      next.set(sessionId, { running, pendingKey, completionUnread: unread })
      continue
    }

    if (before.pendingKey !== null && before.pendingKey !== pendingKey) {
      events.push({ type: 'interaction-cleared', sessionId, interactionKey: before.pendingKey })
    }
    if (pendingKey !== null && pendingKey !== before.pendingKey) {
      events.push({ type: 'interaction', sessionId, interaction: pending })
    }

    if (before.running === true && running === false) {
      events.push({ type: 'completion', sessionId, source: 'running' })
    } else if (before.running !== true && before.completionUnread !== true && unread) {
      // Fallback for a completion the running edge missed. The engine also
      // applies a short cooldown so both signals never produce two cards.
      events.push({ type: 'completion', sessionId, source: 'unread' })
    }

    next.set(sessionId, { running, pendingKey, completionUnread: unread })
  }

  for (const sessionId of previous.keys()) {
    if (!next.has(sessionId)) events.push({ type: 'session-removed', sessionId })
  }

  return { next, events }
}
