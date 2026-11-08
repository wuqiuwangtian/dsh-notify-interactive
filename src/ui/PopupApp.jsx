import { createElement as h, useEffect } from 'react'
import { runtime } from '../client/runtime.js'
import { CloseIcon } from './icons.jsx'
import { IconButton } from './controls.jsx'
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

  return h('div', { className: 'dni-popup' },
    h('header', { className: 'dni-popup-head' },
      h('div', { className: 'dni-popup-title' }, t('popup.title')),
      h(IconButton, {
        label: t('popup.close'),
        onClick: () => runtime.closePopup(),
      }, h(CloseIcon, { size: 16 })),
    ),
    h('main', { className: 'dni-popup-list' },
      notifications.length === 0
        ? h('div', { className: 'dni-empty' }, t('popup.empty'))
        : h(CardList, {
          items: notifications,
          t,
          resolveText: runtime.resolveText,
          onOpenSession: runtime.openSession,
          onDismiss: runtime.dismiss,
        }),
    ),
  )
}
