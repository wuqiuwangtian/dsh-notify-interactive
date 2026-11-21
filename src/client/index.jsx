import { createElement } from 'react'
import { runtime } from './runtime.js'
import { translate as translateKey } from '../i18n/dict.js'
import { createSettingsStore } from '../state/settings.js'
import { createSoundPlayer } from '../audio/sounds.js'
import { createEngine } from '../engine/engine.js'
import { findMainSessionId, sessionTitleOf } from '../engine/suppression.js'
import { SETTINGS_CSS } from '../ui/styles.js'
import { Settings } from '../ui/Settings.jsx'
import { createPreferencesSync } from './preferences.js'
import { createPresenceReporter } from './presence.js'
import { createInteractionBridge } from './interactions.js'

/** Hard dependencies: slots, locale, the session list, and the session UI adapter. */
export const inject = ['slots', 'locale', 'sessions', 'uiSession']

/**
 * Reports attention and live requests, and registers the settings page.
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
  const preferencesSync = createPreferencesSync(settingsStore)
  runtime.preferencesSync = preferencesSync
  ctx.effect(() => { preferencesSync.start(); return () => preferencesSync.stop() }, 'dsh-notify-interactive: shared preferences')
  const clientId = globalThis.crypto?.randomUUID?.() ?? (globalThis.crypto?.getRandomValues
    ? Array.from(globalThis.crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('')
    : `page-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  const capability = globalThis.fetch('/dsh-notify-interactive/desktop-status', { cache: 'no-store' })
    .then(response => response.ok ? response.json() : null).catch(() => null)
  const interactionBridge = createInteractionBridge({ clientId, resolveText,
    getStatus: () => ctx.get('uiSession')?.sessionStatus?.getSnapshot?.(),
    makeToken: () => `${clientId}-${Date.now()}-${Math.random().toString(36).slice(2)}` })
  ctx.effect(() => { interactionBridge.start(); return () => interactionBridge.stop() }, 'dsh-notify-interactive: desktop interaction owner')
  const soundPlayer = createSoundPlayer()
  function getMainSession() {
    try {
      const list = ctx.get('sessions')?.list?.getSnapshot?.()
      const id = findMainSessionId(list)
      return { id, title: id === undefined ? undefined : sessionTitleOf(list, id) }
    } catch {
      return { id: undefined, title: undefined }
    }
  }

  async function postNotification(path, payload) {
    try {
      const response = await fetch(`/dsh-notify-interactive/${path}`, { method: 'POST',
        headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
      return await response.json()
    } catch { return { delivery: 'network-error' } }
  }

  const engine = createEngine({
    settingsStore,
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
    onHostDelivery: async payload => {
      await interactionBridge.sync()
      await postNotification('deliver', payload)
    },
  })

  runtime.settingsStore = settingsStore
  runtime.getMainSession = getMainSession
  runtime.testNotification = payload => postNotification('windows-notify', payload)
  runtime.getDesktopStatus = async () => {
    try {
      const response = await globalThis.fetch('/dsh-notify-interactive/desktop-status', { cache: 'no-store' })
      if (!response.ok) return { reason: 'host-unavailable' }
      return await response.json()
    } catch { return { reason: 'host-unavailable' } }
  }
  runtime.resetSettings = () => settingsStore.reset()
  runtime.previewSound = (preset, volume) => soundPlayer.preview(preset, volume)
  runtime.ready = true
  runtime.version = '0.3.0'
  ctx.effect(() => {
    const url = new URL(globalThis.location.href)
    const requestedSession = url.searchParams.get('dsh-notify-session')
    if (!requestedSession) return
    const targetProfile = url.searchParams.get('dsh-notify-profile')
    let verified = targetProfile === null // Older notifications only carried a session id.
    if (!verified) void capability.then(status => {
      verified = status?.profileId === targetProfile
      if (!verified) console.warn('[dsh-notify-interactive] notification profile could not be verified')
    })
    let attempts = 0
    const timer = setInterval(() => {
      attempts += 1
      try {
        const workspace = ctx.get('uiWorkspace')
        const list = ctx.get('sessions')?.list?.getSnapshot?.()
        if (verified && workspace && list?.byId?.[requestedSession]) {
          workspace.openSession(requestedSession)
          url.searchParams.delete('dsh-notify-session')
          url.searchParams.delete('dsh-notify-profile')
          globalThis.history.replaceState(null, '', url)
          clearInterval(timer)
        }
      } catch { /* Retry while the initial session list is loading. */ }
      if (attempts >= 40) clearInterval(timer)
    }, 250)
    return () => clearInterval(timer)
  }, 'dsh-notify-interactive: return to session')

  try {
    // Diagnostics/support handle; the settings page is the normal entry point.
    globalThis.__dshNotifyInteractive = runtime
  } catch {
    // A hardened page may forbid globals; the plugin still works.
  }

  // Presence lets the host know whether a web surface is currently connected.
  const presence = createPresenceReporter({
    clientId, intervalMs: 1000,
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

  // Settings stylesheet.
  ctx.effect(() => {
    const style = globalThis.document.createElement('style')
    style.setAttribute('data-plugin', 'dsh-notify-interactive')
    style.textContent = SETTINGS_CSS
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
    runtime.ready = false
  }, 'dsh-notify-interactive: runtime cleanup')

  // The engine is driven by the same live services the sidebar uses.
  const uiSession = ctx.get('uiSession')
  const sessionsService = ctx.get('sessions')
  const ingest = () => {
    try {
      const status = uiSession?.sessionStatus?.getSnapshot?.()
      if (status === undefined) return
      presence.report()
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

  ctx.on('connection/reset', () => { engine.reset(); interactionBridge.reset() })

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'notify-interactive',
    order: 16,
    label: () => translate('settings.nav'),
  }, (props) => createElement(Settings, props)))
}
