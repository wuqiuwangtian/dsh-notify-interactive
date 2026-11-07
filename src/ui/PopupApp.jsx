import { createElement as h } from 'react'
import { runtime } from '../client/runtime.js'
import { PopupIcon, CloseIcon } from './icons.jsx'
import { IconButton } from './controls.jsx'
import { useStore } from './useStore.js'
import { useLocale } from './locale.js'
import { CardList } from './cards/index.jsx'

const BACKEND_LABEL = {
  pip: 'popup.backendPip',
  window: 'popup.backendWindow',
  inpage: 'popup.backendInpage',
}

/** The React root rendered into the detached popup document. */
export function PopupApp() {
  const notifications = useStore(runtime.notificationStore)
  const settings = useStore(runtime.settingsStore)
  const popup = useStore(runtime.popupController)
  const { t } = useLocale(runtime.ctx)
  const backendLabel = t(BACKEND_LABEL[popup?.backend] ?? 'popup.backendInpage')

  return h('div', { className: 'dni-popup' },
    h('header', { className: 'dni-popup-head' },
      h('div', { className: 'dni-popup-icon', 'aria-hidden': true }, h(PopupIcon, { size: 18 })),
      h('div', { className: 'dni-popup-headtext' },
        h('div', { className: 'dni-popup-title' }, t('popup.title')),
        h('div', { className: 'dni-popup-subtitle' },
          h('span', { className: 'dni-popup-backend' }, backendLabel),
          h('span', { className: 'dni-dot', 'aria-hidden': true }, '·'),
          t('popup.subtitle'),
        ),
      ),
      h(IconButton, {
        label: t('popup.close'),
        onClick: () => runtime.closePopup(),
      }, h(CloseIcon, { size: 16 })),
    ),
    h('main', { className: 'dni-popup-list' },
      notifications.length === 0
        ? h('div', { className: 'dni-empty' },
          h('div', { className: 'dni-empty-title' }, t('popup.empty')),
          h('div', { className: 'dni-empty-hint' }, t('popup.emptyHint')),
        )
        : h(CardList, {
          items: notifications,
          t,
          settings,
          resolveText: runtime.resolveText,
          onOpenSession: runtime.openSession,
          onDismiss: runtime.dismiss,
        }),
    ),
    h('footer', { className: 'dni-popup-foot' }, t('popup.settingsHint')),
  )
}
