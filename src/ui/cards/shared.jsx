import { createElement as h, useSyncExternalStore } from 'react'
import { Button, IconButton } from '../controls.jsx'
import { CloseIcon } from '../icons.jsx'

const noopSubscribe = () => () => {}
const emptySnapshot = () => undefined

/** Subscribe a card to one live PendingQuestion carrier without breaking hook order. */
export function usePendingSnapshot(pending) {
  return useSyncExternalStore(
    pending?.subscribe ?? noopSubscribe,
    pending?.getSnapshot ?? emptySnapshot,
    pending?.getSnapshot ?? emptySnapshot,
  )
}

/** One card frame shared by every notification kind. */
export function CardShell({
  tone = 'info',
  icon,
  title,
  subtitle,
  sessionTitle,
  sessionId,
  t,
  onOpenSession,
  onDismiss,
  dismissible = false,
  demo = false,
  badge,
  children,
  footer,
}) {
  const head = h('div', { className: 'dni-card-head' },
    h('div', { className: 'dni-card-icon', 'aria-hidden': true }, icon),
    h('div', { className: 'dni-card-headtext' },
      h('div', { className: 'dni-card-titleline' },
        h('span', { className: 'dni-card-title' }, title),
        demo ? h('span', { className: 'dni-badge dni-badge-neutral' }, t('card.demo')) : null,
        badge ?? null,
      ),
      subtitle !== undefined && subtitle !== null && subtitle !== ''
        ? h('div', { className: 'dni-card-subtitle' }, subtitle)
        : null,
      sessionTitle !== undefined && sessionTitle !== null
        ? (typeof onOpenSession === 'function'
          ? h('button', {
            type: 'button',
            className: 'dni-session-link',
            onClick: () => onOpenSession(sessionId),
            title: t('card.openSession'),
          }, sessionTitle)
          : h('div', { className: 'dni-card-session' }, sessionTitle))
        : null,
    ),
    dismissible
      ? h(IconButton, {
        label: t('card.dismiss'),
        onClick: () => onDismiss?.(),
      }, h(CloseIcon, { size: 14 }))
      : null,
  )
  return h('article', { className: `dni-card dni-card-${tone}`, 'aria-label': title },
    head,
    h('div', { className: 'dni-card-body' }, children),
    footer !== undefined && footer !== null
      ? h('footer', { className: 'dni-card-actions' }, footer)
      : null,
  )
}

/** Footer button helper for a primary action and an optional secondary one. */
export function CardButton({ variant = 'outline', onClick, disabled, children }) {
  return h(Button, { variant, size: 'sm', onClick, disabled }, children)
}
