import { createElement as h, useEffect } from 'react'
import { runtime } from '../client/runtime.js'
import { useStore } from './useStore.js'
import { useLocale } from './locale.js'
import { CardList } from './cards/index.jsx'

/** The React root rendered into the detached popup document. */
export function PopupApp() {
  const notifications = useStore(runtime.notificationStore)
  const { t } = useLocale(runtime.ctx)

  useEffect(() => {
    runtime.setSurface?.('popup')
    return () => runtime.setSurface?.('inpage')
  }, [])

  useEffect(() => {
    if (notifications.length !== 0) return undefined
    const timer = setTimeout(() => runtime.closePopup(), 0)
    return () => clearTimeout(timer)
  }, [notifications.length])

  if (notifications.length === 0) return null

  return h('div', { className: 'dni-popup' },
    h('main', { className: 'dni-popup-list' },
      h(CardList, {
        items: notifications,
        t,
        resolveText: runtime.resolveText,
        onOpenSession: runtime.openSession,
        onDismiss: runtime.dismiss,
      }),
    ),
  )
}
