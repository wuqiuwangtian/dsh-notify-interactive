import { createElement as h, useEffect, useState } from 'react'
import { CheckIcon } from '../icons.jsx'
import { CardButton, CardShell } from './shared.jsx'

/** A turn completion notice, with a direct route back to its session. */
export function CompletionCard({ item, t, onOpenSession, onDismiss, settings }) {
  const [paused, setPaused] = useState(false)
  const autoDismissMs = settings?.behavior?.completionAutoDismissMs ?? 8000
  // A demo card is a test surface, so keep it until the user closes it.
  const effectiveAutoDismissMs = item.demo === true ? 0 : autoDismissMs

  useEffect(() => {
    if (paused || !(effectiveAutoDismissMs > 0)) return undefined
    const timer = setTimeout(() => onDismiss?.(item.id), effectiveAutoDismissMs)
    return () => clearTimeout(timer)
  }, [effectiveAutoDismissMs, item.id, onDismiss, paused])

  return h(CardShell, {
    tone: 'success',
    icon: h(CheckIcon, { size: 18 }),
    title: t('card.completion.title'),
    subtitle: t('card.completion.body'),
    sessionTitle: item.sessionTitle,
    sessionId: item.sessionId,
    t,
    onOpenSession,
    onDismiss: () => onDismiss?.(item.id),
    dismissible: true,
    demo: item.demo === true,
    footer: h('div', {
      className: 'dni-card-actions-row',
      onMouseEnter: () => setPaused(true),
      onMouseLeave: () => setPaused(false),
    },
    h(CardButton, {
      variant: 'primary',
      onClick: () => {
        onOpenSession?.(item.sessionId)
        onDismiss?.(item.id)
      },
    }, t('card.completion.open')),
    h(CardButton, {
      variant: 'ghost',
      onClick: () => onDismiss?.(item.id),
    }, t('card.completion.dismiss')),
    ),
  })
}
