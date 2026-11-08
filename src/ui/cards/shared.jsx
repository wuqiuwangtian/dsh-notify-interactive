import { createElement as h, useSyncExternalStore } from 'react'
import { Button } from '../controls.jsx'

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

/** One minimal card frame. */
export function CardShell({
  title,
  subtitle,
  sessionTitle,
  sessionId,
  t,
  onOpenSession,
  demo = false,
  children,
  footer,
}) {
  return h('article', { className: 'dni-card', 'aria-label': title },
    h('div', { className: 'dni-card-head' },
      h('div', { className: 'dni-card-headtext' },
        h('div', { className: 'dni-card-titleline' },
          h('span', { className: 'dni-card-title' }, title),
          demo ? h('span', { className: 'dni-demo' }, t('card.demo')) : null,
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
            }, sessionTitle)
            : h('div', { className: 'dni-card-session' }, sessionTitle))
          : null,
      ),
    ),
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
