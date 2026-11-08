/**
 * Windows notification-center delivery through the browser Notification API.
 *
 * This is a browser-owned toast, not a native WinRT service: it works while the
 * DSH page is open and requires the page-origin notification permission.
 */

const BODY_LIMIT = 200

function truncate(value, limit = BODY_LIMIT) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim()
  if (text.length <= limit) return text
  return `${text.slice(0, Math.max(0, limit - 1))}…`
}

/**
 * Create the system notifier.
 * @returns notifier handle; every method is safe when Notification is missing.
 */
export function createSystemNotifier() {
  const active = new Map()
  const supported = typeof globalThis.Notification === 'function'

  function permission() {
    if (!supported) return 'unsupported'
    return globalThis.Notification.permission
  }

  async function requestPermission() {
    if (!supported) return 'unsupported'
    try {
      return await globalThis.Notification.requestPermission()
    } catch {
      return 'default'
    }
  }

  function show({ title, body, tag, kind, onClick }) {
    if (!supported || globalThis.Notification.permission !== 'granted') return null
    const key = tag === undefined || tag === null ? `${Date.now()}:${Math.random()}` : String(tag)
    try {
      const notification = new globalThis.Notification(String(title), {
        body: truncate(body),
        tag: key,
        // Keep completion toasts in the notification center as well, so an
        // away user who returns later can still see what happened. Browsers
        // and the OS treat this as a hint, not a guarantee.
        requireInteraction: true,
        silent: true,
      })
      notification.onclick = () => {
        try {
          globalThis.focus?.()
        } catch {
          // Focus is best effort; the caller still receives the click.
        }
        try {
          onClick?.()
        } catch {
          // A broken callback must not keep the toast alive.
        }
        try {
          notification.close?.()
        } catch {
          // Some browsers do not expose close on page notifications.
        }
      }
      notification.onclose = () => {
        active.delete(key)
      }
      active.set(key, notification)
      return notification
    } catch {
      return null
    }
  }

  function closeAll() {
    for (const notification of active.values()) {
      try {
        notification.close?.()
      } catch {
        // Ignore an already-closed notification.
      }
    }
    active.clear()
  }

  return { supported, permission, requestPermission, show, closeAll }
}
