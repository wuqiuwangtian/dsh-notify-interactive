import { diffSessionStatus } from './diff.js'
import {
  findMainSessionId,
  gateChannels,
  isSubagentSession,
  sessionTitleOf,
} from './suppression.js'

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
    translate, resolveText, getVisibility, getFocused, onHostDelivery,
  } = options
  let previous = new Map()
  const t = translate

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

  function ingest(status, sessionList) {
    const { next, events } = diffSessionStatus(previous, status)
    previous = next
    const settings = settingsStore.getSnapshot()
    const mainSessionId = findMainSessionId(sessionList)
    for (const event of events) {
      if (!['interaction', 'completion'].includes(event.type) || isSubagentSession(sessionList, event.sessionId)) continue
      const { interaction, sessionId } = event
      const kind = interaction?.kind ?? 'completion'
      const gate = gateChannels({ settings, scenarioKey: kind === 'plan-review' ? 'planReview' : kind,
        sessionId, mainSessionId, visibility: getVisibility(), focused: getFocused() })
      if (!gate.notify && !gate.sound) continue
      const sessionTitle = sessionTitleOf(sessionList, sessionId)
      onHostDelivery({ kind, sessionId, sessionTitle, callId: interaction?.callId, title: fallbackTitle(kind),
        body: interaction ? interactionBody(interaction, sessionTitle) : t('notify.completion.body') })
    }
  }
  return { ingest, reset() { previous = new Map() } }
}
