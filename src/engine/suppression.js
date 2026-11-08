/**
 * Pure gates shared by the engine and the cards.
 * Keeping these pure makes the "do not disturb" rules testable without a DOM.
 */

/** Resolve the session currently shown by the main conversation view. */
export function findMainSessionId(sessionList) {
  const ids = sessionList?.ids
  if (!Array.isArray(ids)) return undefined
  for (const id of ids) {
    const row = sessionList.byId?.[id]
    if (Number(row?.retainedBy?.mainView ?? 0) > 0) return id
  }
  return undefined
}

/** Human-facing session label with a stable fallback. */
export function sessionTitleOf(sessionList, sessionId) {
  const row = sessionList?.byId?.[sessionId]
  if (row === undefined) return String(sessionId)
  return row.displayTitle ?? row.title ?? String(sessionId)
}

/** Whether this session belongs to a subagent / background child. */
export function isSubagentSession(sessionList, sessionId) {
  return sessionList?.byId?.[sessionId]?.origin === 'subagent'
}

/** Map a pending interaction carrier to its scenario key. */
export function scenarioForInteraction(interaction) {
  if (interaction?.kind === 'approval') return 'approval'
  if (interaction?.kind === 'plan-review') return 'planReview'
  return 'question'
}

/**
 * Whether the user is focused on this exact conversation.
 * This is the one rule the plugin uses to stay silent: focused page + visible +
 * the event belongs to the session currently shown in the main view.
 */
export function isAttended({
  visibility,
  focused,
  mainSessionId,
  sessionId,
}) {
  return Boolean(
    focused
    && visibility === 'visible'
    && mainSessionId !== undefined
    && String(mainSessionId) === String(sessionId),
  )
}

/**
 * Resolve delivery for one event.
 *
 * One rule: if the user is focused on the exact conversation, stay silent.
 * Otherwise play the optional sound and deliver a notification through the
 * best available surface (the engine chooses popup vs Windows fallback).
 *
 * @param {object} input settings, scenario key, focus state, and session identity.
 * @returns {{ attended: boolean, sound: boolean, notify: boolean }}
 */
export function gateChannels({
  settings,
  scenarioKey,
  sessionId,
  mainSessionId,
  visibility,
  focused,
}) {
  const scenario = settings?.scenarios?.[scenarioKey] ?? { sound: true, notify: true }
  const attended = isAttended({ visibility, focused, mainSessionId, sessionId })
  const enabled = settings?.enabled !== false && !attended
  return {
    attended,
    sound: enabled && settings?.sound?.enabled !== false && scenario.sound !== false,
    notify: enabled && scenario.notify !== false,
  }
}
