/**
 * Owns the detached notification window.
 *
 * Preferred backend: Document Picture-in-Picture (always on top, Chromium).
 * Fallback: a named `window.open` popup. Fallback of last resort: the in-page
 * overlay, which the caller already renders from the same notification store.
 */

import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { PopupApp } from '../ui/PopupApp.jsx'
import { applyTheme } from '../ui/theme.js'
import { POPUP_CSS } from '../ui/styles.js'

const WINDOW_NAME = 'dsh-notify-interactive'

function windowFeatures() {
  const screen = globalThis.screen
  const width = 420
  const height = 640
  const left = typeof screen?.availWidth === 'number'
    ? Math.max(0, screen.availWidth - width - 24)
    : 120
  const top = typeof screen?.availHeight === 'number'
    ? Math.max(0, Math.min(120, screen.availHeight - height - 80))
    : 120
  return `popup=yes,resizable=yes,width=${width},height=${height},left=${left},top=${top}`
}

/**
 * Create the popup controller.
 * @param {{ document?: Document, css?: string, translate?: (key: string, vars?: object) => string }} [options]
 * @returns popup controller.
 */
export function createPopupController(options = {}) {
  const sourceDocument = options.document ?? globalThis.document
  const css = options.css ?? POPUP_CSS
  const translate = options.translate ?? ((key) => key)
  const listeners = new Set()

  let win = null
  let root = null
  let backend = 'inpage'
  let error = null
  let watchdog = null
  let snapshot = { open: false, backend, error }

  function isOpen() {
    return win !== null && win.closed !== true
  }

  function publish() {
    const next = { open: isOpen(), backend, error }
    if (next.open !== snapshot.open || next.backend !== snapshot.backend || next.error !== snapshot.error) {
      snapshot = next
      for (const listener of listeners) {
        try {
          listener()
        } catch {
          // One broken subscriber must not stop the rest.
        }
      }
    }
  }

  function stopWatch() {
    if (watchdog !== null) {
      clearInterval(watchdog)
      watchdog = null
    }
  }

  function startWatch() {
    stopWatch()
    watchdog = setInterval(() => {
      if (win !== null && win.closed === true) handleClosed(win)
    }, 1000)
  }

  function prepare(targetWindow) {
    const doc = targetWindow.document
    if (doc === undefined || doc === null) throw new Error('popup document is unavailable')
    const rootElement = doc.documentElement
    if (rootElement === null || rootElement === undefined) throw new Error('popup documentElement is unavailable')
    let head = doc.head
    if (head === null || head === undefined) {
      head = doc.createElement('head')
      rootElement.append(head)
    }
    let body = doc.body
    if (body === null || body === undefined) {
      body = doc.createElement('body')
      rootElement.append(body)
    }
    doc.title = translate('popup.title')
    head.replaceChildren()
    const meta = doc.createElement('meta')
    meta.setAttribute('charset', 'utf-8')
    head.append(meta)
    const viewport = doc.createElement('meta')
    viewport.setAttribute('name', 'viewport')
    viewport.setAttribute('content', 'width=device-width, initial-scale=1')
    head.append(viewport)
    const style = doc.createElement('style')
    style.setAttribute('data-plugin', 'dsh-notify-interactive')
    style.textContent = css
    head.append(style)

    body.replaceChildren()
    body.className = 'dni-popup-body'
    body.style.margin = '0'
    body.style.height = '100%'
    body.style.overflow = 'hidden'
    rootElement.style.height = '100%'
    const container = doc.createElement('div')
    container.className = 'dni-popup-root'
    body.append(container)

    try {
      applyTheme(sourceDocument, doc)
    } catch {
      // Theme copying is best effort; the popup still renders with host tokens
      // if the source sheet is unavailable.
    }

    root = createRoot(container)
    root.render(createElement(PopupApp))
    targetWindow.addEventListener('pagehide', () => handleClosed(targetWindow))
    targetWindow.addEventListener('beforeunload', () => handleClosed(targetWindow))
    try {
      targetWindow.focus()
    } catch {
      // Focus is best effort.
    }
  }

  function handleClosed(targetWindow) {
    if (win !== targetWindow) return
    const currentRoot = root
    win = null
    root = null
    backend = 'inpage'
    stopWatch()
    try {
      currentRoot?.unmount?.()
    } catch {
      // React may already have disposed the detached root.
    }
    publish()
  }

  async function open() {
    if (isOpen()) {
      try {
        win.focus()
      } catch {
        // Focus is best effort.
      }
      return snapshot
    }
    error = null
    let candidate = null
    let nextBackend = 'inpage'

    const pictureInPicture = globalThis.documentPictureInPicture
    if (pictureInPicture !== undefined && typeof pictureInPicture.requestWindow === 'function') {
      try {
        candidate = await pictureInPicture.requestWindow({ width: 420, height: 640 })
        nextBackend = 'pip'
      } catch {
        candidate = null
      }
    }
    if (candidate === null) {
      try {
        candidate = globalThis.open('', WINDOW_NAME, windowFeatures())
      } catch {
        candidate = null
      }
      nextBackend = candidate === null ? 'inpage' : 'window'
    }
    if (candidate === null) {
      error = 'blocked'
      backend = 'inpage'
      publish()
      return snapshot
    }

    win = candidate
    backend = nextBackend
    try {
      prepare(candidate)
    } catch {
      error = 'blocked'
      try {
        candidate.close?.()
      } catch {
        // Ignore a window that already closed itself.
      }
      win = null
      root = null
      backend = 'inpage'
      publish()
      return snapshot
    }
    startWatch()
    publish()
    return snapshot
  }

  function close() {
    const currentWindow = win
    const currentRoot = root
    win = null
    root = null
    backend = 'inpage'
    stopWatch()
    try {
      currentRoot?.unmount?.()
    } catch {
      // React may already have disposed the detached root.
    }
    try {
      currentWindow?.close?.()
    } catch {
      // The OS may already have closed it.
    }
    publish()
  }

  function focus() {
    if (!isOpen()) return
    try {
      win.focus()
    } catch {
      // Focus is best effort.
    }
  }

  function syncTheme() {
    if (!isOpen()) return
    try {
      applyTheme(sourceDocument, win.document)
    } catch {
      // Best effort.
    }
  }

  function syncTitle() {
    if (!isOpen()) return
    try {
      win.document.title = translate('popup.title')
    } catch {
      // Best effort.
    }
  }

  function dispose() {
    close()
    listeners.clear()
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    open,
    close,
    focus,
    syncTheme,
    syncTitle,
    isOpen,
    dispose,
  }
}
