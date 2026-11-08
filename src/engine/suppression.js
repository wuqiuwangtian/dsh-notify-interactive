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
 * Whether the user is already looking at this exact session in a focused,
 * visible page. Focus + main view is the only case the plugin suppresses.
 */
export function isAttended({
  visibility,
  focused,
  mainSessionId,
  sessionId,
  suppressWhenFocused,
}) {
  return Boolean(
    suppressWhenFocused
    && focused
    && visibility === 'visible'
    && mainSessionId !== undefined
    && String(mainSessionId) === String(sessionId),
  )
}

/**
 * Resolve the three independent delivery channels for one event.
 *
 * Surface rule:
 * - The page is active (focused + visible): the in-page card is the primary
 *   surface; a Windows toast would duplicate it, so the system channel is off.
 * - The page is inactive: the system toast (or an already-open popup) is the
 *   outside alert; the in-page card remains a record for when the user returns.
 *
 * @param {object} input settings, scenario key, focus state, and session identity.
 * @returns {{ attended: boolean, pageActive: boolean, sound: boolean, popup: boolean, system: boolean }}
 */
export function gateChannels({
  settings,
  scenarioKey,
  sessionId,
  mainSessionId,
  visibility,
  focused,
}) {
  const scenario = settings?.scenarios?.[scenarioKey] ?? { sound: true, popup: true, system: true }
  const attended = isAttended({
    visibility,
    focused,
    mainSessionId,
    sessionId,
    suppressWhenFocused: settings?.behavior?.suppressWhenFocused !== false,
  })
  const enabled = settings?.enabled !== false && !attended
  const pageActive = Boolean(focused && visibility === 'visible')
  return {
    attended,
    pageActive,
    sound: enabled && settings?.sound?.enabled !== false && scenario.sound !== false,
    popup: enabled && settings?.popup?.enabled !== false && scenario.popup !== false,
    // A Windows toast while the user is looking at DSH duplicates the in-page
    // card; the popup-open check is applied by the engine as well.
    system: enabled && !pageActive && settings?.system?.enabled !== false && scenario.system !== false,
  }
}
