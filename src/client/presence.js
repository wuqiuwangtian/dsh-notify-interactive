/**
 * Report the web surface's focus state to the host.
 *
 * The host uses this presence to decide whether it must show its Windows popup
 * fallback (no web UI connected) or whether the web client owns delivery.
 */

const DEFAULT_ENDPOINT = '/dsh-notify-interactive/presence'
const DEFAULT_INTERVAL_MS = 5000

/**
 * Create the presence reporter.
 * @param {{
 *   getState?: () => { sessionId?: string, focused?: boolean, visible?: boolean },
 *   endpoint?: string,
 *   intervalMs?: number,
 * }} [options]
 * @returns {{ start: () => void, stop: () => void, report: () => void }}
 */
export function createPresenceReporter(options = {}) {
  const getState = options.getState ?? (() => ({}))
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS
  const doc = globalThis.document
  const nav = globalThis.navigator
  let timer = null
  let started = false
  let lastReportAt = 0

  function body(active) {
    const state = getState() ?? {}
    return JSON.stringify({
      active,
      sessionId: state.sessionId,
      focused: state.focused === true,
      visible: state.visible === true,
    })
  }

  function post(active) {
    try {
      const request = globalThis.fetch?.(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: body(active),
        keepalive: true,
      })
      request?.catch?.(() => {})
    } catch {
      // The host route may be absent (for example in a pure CLI profile).
    }
  }

  function beacon(active) {
    try {
      const payload = body(active)
      if (typeof nav?.sendBeacon === 'function') {
        nav.sendBeacon(endpoint, new Blob([payload], { type: 'application/json' }))
        return
      }
    } catch {
      // Fall through to fetch.
    }
    post(active)
  }

  function report() {
    if (!started) return
    const now = Date.now()
    if (now - lastReportAt < 1000) return
    lastReportAt = now
    post(true)
  }

  function onFocus() {
    report()
  }

  function onBlur() {
    report()
  }

  function onVisibility() {
    report()
  }

  function onPageHide() {
    beacon(false)
  }

  function start() {
    if (started) return
    started = true
    report()
    timer = setInterval(report, intervalMs)
    doc?.addEventListener('visibilitychange', onVisibility)
    globalThis.addEventListener('focus', onFocus)
    globalThis.addEventListener('blur', onBlur)
    globalThis.addEventListener('pagehide', onPageHide)
  }

  function stop() {
    if (!started) return
    started = false
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
    doc?.removeEventListener('visibilitychange', onVisibility)
    globalThis.removeEventListener('focus', onFocus)
    globalThis.removeEventListener('blur', onBlur)
    globalThis.removeEventListener('pagehide', onPageHide)
    beacon(false)
  }

  return { start, stop, report }
}
