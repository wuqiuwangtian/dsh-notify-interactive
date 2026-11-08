import { createElement as h } from 'react'
import { runtime } from '../client/runtime.js'
import { BellIcon } from './icons.jsx'
import { Button } from './controls.jsx'
import { useStore } from './useStore.js'
import { useLocale } from './locale.js'
import { CardList } from './cards/index.jsx'

/**
 * In-page fallback surface. The engine runs from the plugin's service
 * subscriptions; this component only renders the shared notification store.
 */
export function Overlay() {
  const settings = useStore(runtime.settingsStore)
  const notifications = useStore(runtime.notificationStore)
  const popup = useStore(runtime.popupController)
  const surface = useStore(runtime.surfaceStore)
  const { t } = useLocale(runtime.ctx)

  if (!settings?.enabled) return null
  if (!settings.popup.enabled) return null
  if (popup?.open === true || surface === 'popup') return null

  const maxVisible = Math.max(1, settings.behavior.maxVisibleCards)
  const visible = notifications.slice(-maxVisible)
  const hidden = notifications.length - visible.length

  return h('div', { className: 'dni-overlay', 'aria-live': 'polite' },
    notifications.length > 0
      ? [
        hidden > 0
          ? h('div', { key: 'more', className: 'dni-more' }, t('popup.more', { count: hidden }))
          : null,
        h(CardList, {
          key: 'cards',
          items: visible,
          t,
          settings,
          resolveText: runtime.resolveText,
          onOpenSession: runtime.openSession,
          onDismiss: runtime.dismiss,
        }),
        settings.popup.enabled
          ? h('div', { key: 'open', className: 'dni-overlay-foot' },
            h(Button, {
              variant: 'ghost',
              size: 'sm',
              onClick: () => {
                Promise.resolve(runtime.openPopup()).catch(() => {})
              },
            }, h(BellIcon, { size: 14 }), t('settings.popupOpen')),
          )
          : null,
      ]
      : null,
  )
}
