/**
 * Notification engine.
 *
 * One engine instance owns the per-session baseline, de-duplication, channel
 * gating, and the side effects for one browser tab. It never answers anything
 * by itself: only an explicit user click in a card does that.
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
    systemNotifier,
    translate,
    resolveText,
    getVisibility,
    getFocused,
    onActivate,
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

  function systemTitle(kind) {
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

  function scenarioOf(kind) {
    if (kind === 'approval') return 'approval'
    if (kind === 'plan-review') return 'planReview'
    if (kind === 'completion') return 'completion'
    return 'question'
  }

  function systemChannelAllowed(settings) {
    return settings.system.onlyWhenHidden === false || visibility() === 'hidden'
  }

  function notifySystem(kind, title, body, sessionId) {
    if (systemNotifier === undefined || systemNotifier === null) return
    systemNotifier.show({
      title,
      body,
      tag: `${sessionId}:${kind}`,
      kind,
      onClick: () => {
        try {
          onActivate?.(sessionId, kind)
        } catch {
          // A failed navigation must not break the notification click handler.
        }
      },
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

    if (!settings.behavior.includeSubagents && isSubagentSession(sessionList, sessionId)) return

    const gate = gateChannels({
      settings,
      scenarioKey,
      sessionId,
      mainSessionId,
      visibility: visibility(),
      focused: focused(),
    })
    if (!gate.sound && !gate.popup && !gate.system) return

    const id = interactionNotificationId(sessionId, interaction.key)
    if (gate.popup) {
      notificationStore.upsert({
        id,
        kind,
        scenario: scenarioKey,
        sessionId,
        sessionTitle,
        interaction,
        sticky: true,
        demo: false,
      })
    }
    if (gate.sound && settings.sound.preset !== 'none') {
      soundPlayer?.play?.(settings.sound.preset, settings.sound.volume)
    }
    if (gate.system && systemChannelAllowed(settings)) {
      notifySystem(kind, systemTitle(kind), interactionBody(interaction, sessionTitle), sessionId)
    }
  }

  function handleCompletion(event, settings, sessionList, mainSessionId) {
    const sessionId = String(event.sessionId)
    const timestamp = now()
    const last = completionCooldown.get(sessionId)
    if (last !== undefined && timestamp - last < COMPLETION_COOLDOWN_MS) return
    if (!settings.behavior.includeSubagents && isSubagentSession(sessionList, sessionId)) return

    const gate = gateChannels({
      settings,
      scenarioKey: 'completion',
      sessionId,
      mainSessionId,
      visibility: visibility(),
      focused: focused(),
    })
    if (!gate.sound && !gate.popup && !gate.system) return

    completionCooldown.set(sessionId, timestamp)
    const sequence = (completionSequence.get(sessionId) ?? 0) + 1
    completionSequence.set(sessionId, sequence)
    const sessionTitle = sessionTitleOf(sessionList, sessionId)
    const id = completionNotificationId(sessionId, sequence)

    if (gate.popup) {
      notificationStore.removeWhere(
        (item) => item.sessionId === sessionId && item.kind === 'completion',
      )
      notificationStore.upsert({
        id,
        kind: 'completion',
        scenario: 'completion',
        sessionId,
        sessionTitle,
        sticky: false,
        completedAt: timestamp,
        demo: false,
      })
    }
    if (gate.sound && settings.sound.preset !== 'none') {
      soundPlayer?.play?.(settings.sound.preset, settings.sound.volume)
    }
    if (gate.system && systemChannelAllowed(settings)) {
      notifySystem(
        'completion',
        systemTitle('completion'),
        truncate([sessionTitle, t('notify.completion.body')].filter(Boolean).join(' · ')),
        sessionId,
      )
    }
  }

  function clearInteractionCard(sessionId, interactionKey) {
    notificationStore.remove(interactionNotificationId(sessionId, interactionKey))
  }

  /**
   * Reconcile live interaction cards with the latest status snapshot.
   * This keeps a card answerable across a reconnect while dropping cards whose
   * request was answered in another surface.
   */
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

  /**
   * Ingest one SessionStatus snapshot.
   * @param {Map<string, object>} status Snapshot from `useSessionStatus`.
   * @param {object} sessionList Snapshot from `useSessions`.
   */
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
