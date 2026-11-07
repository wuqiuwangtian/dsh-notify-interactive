import { createElement } from 'react'
import { runtime } from './runtime.js'
import { translate as translateKey } from '../i18n/dict.js'
import { createSettingsStore } from '../state/settings.js'
import { createNotificationStore } from '../state/notifications.js'
import { createPopupController } from '../state/popup.js'
import { createSoundPlayer } from '../audio/sounds.js'
import { createSystemNotifier } from '../system/notify.js'
import { createEngine } from '../engine/engine.js'
import { findMainSessionId, sessionTitleOf } from '../engine/suppression.js'
import { createDemoItems } from '../ui/cards/index.jsx'
import { POPUP_CSS } from '../ui/styles.js'
import { Overlay } from '../ui/Overlay.jsx'
import { Settings } from '../ui/Settings.jsx'

/** Hard dependencies: slots, locale, the session list, and the session UI adapter. */
export const inject = ['slots', 'locale', 'sessions', 'uiSession']

/**
 * Browser half. It owns the settings, the notification engine, the in-page
 * overlay, the detached popup, and the Settings page.
 * @param {object} ctx Client Cordis context.
 */
export function apply(ctx) {
  if (runtime.ready) return
  runtime.ctx = ctx

  const localeId = () => {
    try {
      return ctx.locale?.getLocale?.()?.id ?? 'en'
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
  const systemNotifier = createSystemNotifier()
  const popupController = createPopupController({
    document: globalThis.document,
    css: POPUP_CSS,
    translate,
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

  const engine = createEngine({
    settingsStore,
    notificationStore,
    soundPlayer,
    systemNotifier,
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
    onActivate: (sessionId) => {
      openSession(sessionId)
      if (settingsStore.getSnapshot().popup.enabled && !popupController.isOpen()) {
        popupController.open().catch(() => {})
      }
    },
  })

  runtime.settingsStore = settingsStore
  runtime.notificationStore = notificationStore
  runtime.soundPlayer = soundPlayer
  runtime.systemNotifier = systemNotifier
  runtime.popupController = popupController
  runtime.engine = engine
  runtime.translate = translate
  runtime.resolveText = resolveText
  runtime.openSession = openSession
  runtime.openPopup = () => popupController.open()
  runtime.closePopup = () => popupController.close()
  runtime.resetSettings = () => settingsStore.reset()
  runtime.previewSound = (preset, volume) => soundPlayer.play(preset, volume)
  runtime.requestNotificationPermission = () => systemNotifier.requestPermission()
  runtime.testSystemNotification = () => {
    systemNotifier.show({
      title: translate('settings.title'),
      body: translate('settings.testNotification'),
      tag: 'dsh-notify-interactive-test',
      kind: 'completion',
    })
  }
  runtime.getMainSession = () => {
    try {
      const list = ctx.get('sessions')?.list?.getSnapshot?.()
      const id = findMainSessionId(list)
      return { id, title: id === undefined ? undefined : sessionTitleOf(list, id) }
    } catch {
      return { id: undefined, title: undefined }
    }
  }
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
  runtime.version = '0.1.0'
  try {
    // Diagnostics/support handle; the settings page is the normal entry point.
    globalThis.__dshNotifyInteractive = runtime
  } catch {
    // A hardened page may forbid globals; the plugin still works.
  }

  // Shared stylesheet for the in-page cards and the settings page.
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
    systemNotifier.closeAll()
    runtime.ready = false
  }, 'dsh-notify-interactive: runtime cleanup')

  // The engine is driven by the same live services the sidebar uses, not by a
  // slot component. That keeps notifications working even if the overlay
  // entry is not currently rendering anything.
  const uiSession = ctx.get('uiSession')
  const sessionsService = ctx.get('sessions')
  const ingest = () => {
    try {
      const status = uiSession?.sessionStatus?.getSnapshot?.()
      if (status === undefined) return
      engine.ingest(status, sessionsService?.list?.getSnapshot?.())
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

  // Turning the master switch or the popup channel off should not leave stale
  // cards behind when it is turned back on later.
  ctx.effect(() => settingsStore.subscribe(() => {
    const next = settingsStore.getSnapshot()
    if (!next.enabled || !next.popup.enabled) {
      notificationStore.clear()
      engine.reset()
      if (!next.popup.enabled) popupController.close()
    }
  }), 'dsh-notify-interactive: settings bridge')

  ctx.on('connection/reset', () => engine.reset())
  ctx.on('theme/change', () => popupController.syncTheme())
  ctx.on('locale/change', () => popupController.syncTitle())

  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'notify-interactive.overlay',
    order: 100,
    label: () => translate('popup.title'),
  }, (props) => createElement(Overlay, props)))

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'notify-interactive',
    order: 16,
    label: () => translate('settings.nav'),
  }, (props) => createElement(Settings, props)))
}
