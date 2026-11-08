/**
 * Notification engine.
 *
 * One rule decides silence: if the user is focused on the exact conversation,
 * nothing happens. Otherwise the engine plays the optional sound and delivers
 * the event through the best available surface:
 * - the detached popup when it is already open (interactive);
 * - otherwise the host's Windows popup fallback (reminder only).
 */

import {
  completionNotificationId,
  interactionNotificationId,
} from '../state/notifications.js'
import { diffSessionStatus } from './diff.js'
import {
  findMainSessionId,
  gateChannels,
  isSubagentSession,
  scenarioForInteraction,
  sessionTitleOf,
} from './suppression.js'

const COMPLETION_COOLDOWN_MS = 2000
const BODY_LIMIT = 200

/** Keep notification bodies short and free of HTML. */
export function truncate(value, limit = BODY_LIMIT) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim()
  if (text.length <= limit) return text
  return `${text.slice(0, Math.max(0, limit - 1))}…`
}

/**
 * Create the engine.
 * @param {object} options stores, effects, and callbacks supplied by the plugin runtime.
 * @returns engine handle.
 */
export function createEngine(options) {
  const {
    settingsStore,
    notificationStore,
    soundPlayer,
    translate,
    resolveText,
    getVisibility,
    getFocused,
    isPopupOpen = () => false,
    onWindowsFallback,
    now = () => Date.now(),
  } = options

  let previous = new Map()
  let lastStatus = null
  let lastSessions = null
  const completionSequence = new Map()
  const completionCooldown = new Map()

  const t = (key, vars) => translate(key, vars)
  const visibility = () => (typeof getVisibility === 'function' ? getVisibility() : 'visible')
  const focused = () => (typeof getFocused === 'function' ? Boolean(getFocused()) : false)

  function fallbackTitle(kind) {
    if (kind === 'approval') return t('notify.approval.title')
    if (kind === 'plan-review') return t('notify.plan.title')
    if (kind === 'completion') return t('notify.completion.title')
    return t('notify.question.title')
  }

  function interactionBody(interaction, sessionTitle) {
    if (interaction?.kind === 'approval') {
      const reason = interaction.displayReason !== undefined && typeof resolveText === 'function'
        ? resolveText(interaction.displayReason)
        : interaction.reason
      return truncate([sessionTitle, interaction.toolName, reason].filter(Boolean).join(' · '))
    }
    const question = interaction?.questions?.[0]?.question
    return truncate([sessionTitle, question].filter(Boolean).join(' · '))
  }

  function playSound(settings) {
    if (settings.sound.enabled === false) return false
    if (settings.sound.preset === 'none') return false
    return soundPlayer?.play?.(settings.sound.preset, settings.sound.volume) === true
  }

  function deliverWindows(kind, sessionId, sessionTitle, title, body, silent) {
    onWindowsFallback?.({
      kind,
      sessionId,
      sessionTitle,
      title,
      body,
      silent: silent === true,
    })
  }

  function handleInteraction(event, settings, sessionList, mainSessionId) {
    const interaction = event.interaction
    const kind = interaction?.kind === 'approval'
      ? 'approval'
      : interaction?.kind === 'plan-review'
        ? 'plan-review'
        : 'question'
    const scenarioKey = scenarioForInteraction(interaction)
    const sessionId = String(event.sessionId)
    const sessionTitle = sessionTitleOf(sessionList, sessionId)

    if (isSubagentSession(sessionList, sessionId)) return

    const gate = gateChannels({
      settings,
      scenarioKey,
      sessionId,
      mainSessionId,
      visibility: visibility(),
      focused: focused(),
    })
    if (!gate.sound && !gate.notify) return

    const soundPlayed = gate.sound ? playSound(settings) : false
    if (!gate.notify) return

    if (isPopupOpen()) {
      notificationStore.upsert({
        id: interactionNotificationId(sessionId, interaction.key),
        kind,
        scenario: scenarioKey,
        sessionId,
        sessionTitle,
        interaction,
        sticky: true,
        demo: false,
      })
      return
    }
    deliverWindows(kind, sessionId, sessionTitle, fallbackTitle(kind), interactionBody(interaction, sessionTitle), soundPlayed)
  }

  function handleCompletion(event, settings, sessionList, mainSessionId) {
    const sessionId = String(event.sessionId)
    if (isSubagentSession(sessionList, sessionId)) return

    const timestamp = now()
    const last = completionCooldown.get(sessionId)
    if (last !== undefined && timestamp - last < COMPLETION_COOLDOWN_MS) return

    const gate = gateChannels({
      settings,
      scenarioKey: 'completion',
      sessionId,
      mainSessionId,
      visibility: visibility(),
      focused: focused(),
    })
    if (!gate.sound && !gate.notify) return

    completionCooldown.set(sessionId, timestamp)
    const sessionTitle = sessionTitleOf(sessionList, sessionId)
    const soundPlayed = gate.sound ? playSound(settings) : false
    if (!gate.notify) return

    if (isPopupOpen()) {
      const sequence = (completionSequence.get(sessionId) ?? 0) + 1
      completionSequence.set(sessionId, sequence)
      notificationStore.removeWhere(
        (item) => item.sessionId === sessionId && item.kind === 'completion',
      )
      notificationStore.upsert({
        id: completionNotificationId(sessionId, sequence),
        kind: 'completion',
        scenario: 'completion',
        sessionId,
        sessionTitle,
        sticky: false,
        completedAt: timestamp,
        demo: false,
      })
      return
    }
    deliverWindows(
      'completion',
      sessionId,
      sessionTitle,
      fallbackTitle('completion'),
      truncate([sessionTitle, t('notify.completion.body')].filter(Boolean).join(' · ')),
      soundPlayed,
    )
  }

  function clearInteractionCard(sessionId, interactionKey) {
    notificationStore.remove(interactionNotificationId(sessionId, interactionKey))
  }

  /** Reconcile live popup cards with the latest status snapshot. */
  function reconcileInteractions(statusMap) {
    const snapshot = notificationStore.getSnapshot()
    for (const item of snapshot) {
      if (item.demo === true) continue
      if (item.kind !== 'approval' && item.kind !== 'question' && item.kind !== 'plan-review') continue
      const status = statusMap.get(item.sessionId)
      if (status === undefined) continue
      const pending = status.pendingInteraction
      const currentKey = pending?.key ?? null
      const cardKey = item.interaction?.key ?? null
      if (pending === undefined || pending === null || currentKey !== cardKey) {
        notificationStore.remove(item.id)
        continue
      }
      if (pending !== item.interaction) {
        notificationStore.update(item.id, { interaction: pending })
      }
    }
  }

  /** Ingest one SessionStatus snapshot. */
  function ingest(status, sessionList) {
    if (status === lastStatus && sessionList === lastSessions) return
    lastStatus = status
    lastSessions = sessionList
    const settings = settingsStore.getSnapshot()

    if (!settings.enabled) {
      previous = new Map()
      notificationStore.clear()
      return
    }

    const statusMap = status instanceof Map ? status : new Map()
    const mainSessionId = findMainSessionId(sessionList)
    const { next, events } = diffSessionStatus(previous, statusMap)
    previous = next
    reconcileInteractions(statusMap)

    for (const event of events) {
      if (event.type === 'interaction') {
        handleInteraction(event, settings, sessionList, mainSessionId)
      } else if (event.type === 'completion') {
        handleCompletion(event, settings, sessionList, mainSessionId)
      } else if (event.type === 'interaction-cleared') {
        clearInteractionCard(event.sessionId, event.interactionKey)
      } else if (event.type === 'session-removed') {
        notificationStore.removeSession(event.sessionId)
        completionCooldown.delete(event.sessionId)
        completionSequence.delete(event.sessionId)
      }
    }
  }

  /** Forget the baseline after a connection reset without dropping live cards. */
  function reset() {
    previous = new Map()
    lastStatus = null
    lastSessions = null
  }

  /** Drop all in-memory state (plugin unload / master switch off). */
  function dispose() {
    previous = new Map()
    lastStatus = null
    lastSessions = null
    completionCooldown.clear()
    completionSequence.clear()
  }

  return { ingest, reset, dispose }
}
