import { createElement as h, useState } from 'react'
import { CardButton, CardShell } from './shared.jsx'

/** One pending tool approval. */
export function ApprovalCard({ item, t, onOpenSession, onDismiss, resolveText }) {
  const pending = item.interaction
  const [busy, setBusy] = useState(false)
  const [answered, setAnswered] = useState(false)
  const [error, setError] = useState(null)

  const reason = pending?.displayReason !== undefined && typeof resolveText === 'function'
    ? resolveText(pending.displayReason)
    : pending?.reason
  const subtitle = [pending?.toolName, reason].filter(Boolean).join(' · ')

  async function answer(outcome) {
    if (busy || answered) return
    setBusy(true)
    setError(null)
    if (item.demo === true) {
      setAnswered(true)
      setBusy(false)
      onDismiss?.(item.id)
      return
    }
    if (pending === undefined || pending === null || pending.answerable === false) {
      setBusy(false)
      setError(t('card.approval.invalid'))
      return
    }
    try {
      await pending.answer(outcome)
      setAnswered(true)
      onDismiss?.(item.id)
    } catch {
      setBusy(false)
      setError(t('card.approval.invalid'))
    }
  }

  return h(CardShell, {
    title: t('card.approval.title'),
    subtitle,
    sessionTitle: item.sessionTitle,
    sessionId: item.sessionId,
    t,
    onOpenSession,
    demo: item.demo === true,
    footer: h('div', { className: 'dni-card-actions-row' },
      h(CardButton, {
        variant: 'outline',
        onClick: () => answer('rejected'),
        disabled: busy || answered,
      }, t('card.approval.reject')),
      h(CardButton, {
        variant: 'primary',
        onClick: () => answer('allowed-once'),
        disabled: busy || answered,
      }, t('card.approval.allow')),
    ),
  },
  error !== null
    ? h('div', { className: 'dni-error', role: 'alert' }, error)
    : null,
  )
}
