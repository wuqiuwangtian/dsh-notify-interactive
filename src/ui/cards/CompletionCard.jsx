import { createElement as h, useEffect, useState } from 'react'
import { CardButton, CardShell } from './shared.jsx'

/** A turn completion notice, with a direct route back to its session. */
export function CompletionCard({ item, t, onOpenSession, onDismiss }) {
  const [paused, setPaused] = useState(false)
  // Demo cards are test surfaces and stay until dismissed.
  const autoDismissMs = item.demo === true ? 0 : 8000

  useEffect(() => {
    if (paused || !(autoDismissMs > 0)) return undefined
    const timer = setTimeout(() => onDismiss?.(item.id), autoDismissMs)
    return () => clearTimeout(timer)
  }, [autoDismissMs, item.id, onDismiss, paused])

  return h(CardShell, {
    title: t('card.completion.title'),
    sessionTitle: item.sessionTitle,
    sessionId: item.sessionId,
    t,
    onOpenSession,
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
    ),
  })
}
