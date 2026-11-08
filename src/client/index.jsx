import { createElement } from 'react'
import { runtime } from './runtime.js'
import { translate as translateKey } from '../i18n/dict.js'
import { createSettingsStore } from '../state/settings.js'
import { createNotificationStore } from '../state/notifications.js'
import { createPopupController } from '../state/popup.js'
import { createSoundPlayer } from '../audio/sounds.js'
import { createEngine } from '../engine/engine.js'
import { findMainSessionId, sessionTitleOf } from '../engine/suppression.js'
import { createDemoItems } from '../ui/cards/index.jsx'
import { POPUP_CSS } from '../ui/styles.js'
import { Settings } from '../ui/Settings.jsx'
import { createPresenceReporter } from './presence.js'

/** Hard dependencies: slots, locale, the session list, and the session UI adapter. */
export const inject = ['slots', 'locale', 'sessions', 'uiSession']

/**
 * Browser half. It reports presence, owns the interactive popup, and falls
 * back to the host's Windows popup when no interactive surface is available.
 * @param {object} ctx Client Cordis context.
 */
export function apply(ctx) {
  if (runtime.ready) return
  runtime.ctx = ctx

  const localeId = () => {
    try {
      const snapshot = ctx.locale?.getLocale?.()
      return snapshot?.active ?? snapshot?.id ?? 'en'
    } catch {
      return 'en'
    }
  }
  const translate = (key, vars) => translateKey(localeId(), key, vars)
  const resolveText = (value) => {
    try {
      return ctx.locale?.resolveText?.(value) ?? (value?.en ?? '')
    } catch {
      return value?.en ?? ''
    }
  }

  let storage
  try {
    storage = globalThis.localStorage
  } catch {
    storage = undefined
  }
  const settingsStore = createSettingsStore(storage)
  const notificationStore = createNotificationStore()
  const soundPlayer = createSoundPlayer()
  const popupController = createPopupController({
    document: globalThis.document,
    css: POPUP_CSS,
    translate,
    onOpen: () => runtime.setSurface('popup'),
    onClose: () => runtime.setSurface('inpage'),
  })

  function openSession(sessionId) {
    try {
      globalThis.focus?.()
    } catch {
      // Focus is best effort.
    }
    try {
      const workspace = ctx.get('uiWorkspace')
      if (workspace !== undefined && typeof workspace.openSession === 'function') {
        workspace.openSession(sessionId)
      }
    } catch {
      // A missing workspace service leaves the main window focused.
    }
  }

  function getMainSession() {
    try {
      const list = ctx.get('sessions')?.list?.getSnapshot?.()
      const id = findMainSessionId(list)
      return { id, title: id === undefined ? undefined : sessionTitleOf(list, id) }
    } catch {
      return { id: undefined, title: undefined }
    }
  }

  /**
   * Ask the host to show a Windows popup. Used only when the interactive
   * popup is closed or unavailable; the Windows dialog is reminder-only.
   */
  function windowsFallback(payload) {
    try {
      const body = JSON.stringify({
        kind: payload?.kind,
        sessionId: payload?.sessionId,
        title: payload?.title,
        body: payload?.body,
      })
      globalThis.fetch?.('/dsh-notify-interactive/windows-notify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        keepalive: true,
      })?.catch?.(() => {})
    } catch {
      // A missing host route or fetch failure leaves the sound-only path.
    }
  }

  const engine = createEngine({
    settingsStore,
    notificationStore,
    soundPlayer,
    translate,
    resolveText,
    getVisibility: () => (typeof globalThis.document !== 'undefined' ? globalThis.document.visibilityState : 'visible'),
    getFocused: () => {
      try {
        return globalThis.document?.hasFocus?.() ?? false
      } catch {
        return false
      }
    },
    isPopupOpen: () => runtime.surfaceStore.isPopup(),
    onWindowsFallback: windowsFallback,
  })

  runtime.settingsStore = settingsStore
  runtime.notificationStore = notificationStore
  runtime.soundPlayer = soundPlayer
  runtime.popupController = popupController
  runtime.engine = engine
  runtime.translate = translate
  runtime.resolveText = resolveText
  runtime.openSession = openSession
  runtime.getMainSession = getMainSession
  runtime.windowsFallback = windowsFallback
  runtime.openPopup = () => popupController.open()
  runtime.closePopup = () => popupController.close()
  runtime.resetSettings = () => settingsStore.reset()
  runtime.previewSound = (preset, volume) => soundPlayer.preview(preset, volume)
  runtime.dismiss = (id) => notificationStore.remove(id)
  runtime.addDemo = (kind, info = {}) => {
    const item = createDemoItems({
      t: translate,
      sessionId: info.sessionId,
      sessionTitle: info.sessionTitle,
    })[kind]
    if (item !== undefined) notificationStore.upsert(item)
  }
  runtime.ready = true
  runtime.version = '0.2.0'
  try {
    // Diagnostics/support handle; the settings page is the normal entry point.
    globalThis.__dshNotifyInteractive = runtime
  } catch {
    // A hardened page may forbid globals; the plugin still works.
  }

  // Presence lets the host know whether a web surface is currently connected.
  // Without it, the host assumes CLI/TUI and uses the Windows popup fallback.
  const presence = createPresenceReporter({
    getState: () => {
      const main = getMainSession()
      return {
        sessionId: main?.id,
        focused: (() => {
          try {
            return globalThis.document?.hasFocus?.() ?? false
          } catch {
            return false
          }
        })(),
        visible: globalThis.document?.visibilityState === 'visible',
      }
    },
  })
  runtime.presence = presence
  ctx.effect(() => {
    presence.start()
    return () => presence.stop()
  }, 'dsh-notify-interactive: presence')

  // Shared stylesheet for the settings page and the popup.
  ctx.effect(() => {
    const style = globalThis.document.createElement('style')
    style.setAttribute('data-plugin', 'dsh-notify-interactive')
    style.textContent = POPUP_CSS
    globalThis.document.head.append(style)
    return () => style.remove()
  }, 'dsh-notify-interactive: styles')

  // AudioContext creation needs a user gesture; unlock on the first input.
  ctx.effect(() => {
    const unlock = () => soundPlayer.unlock()
    const options = { capture: true, once: true }
    globalThis.document.addEventListener('pointerdown', unlock, options)
    globalThis.document.addEventListener('keydown', unlock, options)
    return () => {
      globalThis.document.removeEventListener('pointerdown', unlock, true)
      globalThis.document.removeEventListener('keydown', unlock, true)
    }
  }, 'dsh-notify-interactive: audio unlock')

  ctx.effect(() => () => {
    engine.dispose()
    popupController.dispose()
    runtime.ready = false
  }, 'dsh-notify-interactive: runtime cleanup')

  // The engine is driven by the same live services the sidebar uses.
  const uiSession = ctx.get('uiSession')
  const sessionsService = ctx.get('sessions')
  const ingest = () => {
    try {
      const status = uiSession?.sessionStatus?.getSnapshot?.()
      if (status === undefined) return
      engine.ingest(status, sessionsService?.list?.getSnapshot?.())
      presence.report()
    } catch {
      // A transient service replacement is retried by the next subscription tick.
    }
  }
  ctx.effect(() => {
    const disposers = []
    if (typeof uiSession?.sessionStatus?.subscribe === 'function') {
      disposers.push(uiSession.sessionStatus.subscribe(ingest))
    }
    if (typeof sessionsService?.list?.subscribe === 'function') {
      disposers.push(sessionsService.list.subscribe(ingest))
    }
    ingest()
    return () => {
      for (const dispose of disposers) {
        try {
          dispose()
        } catch {
          // The service may already be disposed.
        }
      }
    }
  }, 'dsh-notify-interactive: session status bridge')

  // Turning the master switch off clears live cards.
  ctx.effect(() => settingsStore.subscribe(() => {
    if (!settingsStore.getSnapshot().enabled) {
      notificationStore.clear()
      engine.reset()
    }
  }), 'dsh-notify-interactive: settings bridge')

  ctx.on('connection/reset', () => engine.reset())
  ctx.on('theme/change', () => popupController.syncTheme())
  ctx.on('locale/change', () => popupController.syncTitle())

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'notify-interactive',
    order: 16,
    label: () => translate('settings.nav'),
  }, (props) => createElement(Settings, props)))
}
