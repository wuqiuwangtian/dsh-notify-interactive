/**
 * Observable queue of active notification cards.
 *
 * Both the in-page overlay and the detached popup render this one store, so a
 * card answered in either surface disappears everywhere.
 */

export const MAX_STORE_ITEMS = 30

/** Stable id for one pending interaction card. */
export function interactionNotificationId(sessionId, interactionKey) {
  return `interaction:${sessionId}:${interactionKey}`
}

/** Stable id for one completion card. */
export function completionNotificationId(sessionId, sequence) {
  return `completion:${sessionId}:${sequence}`
}

/**
 * Create the notification store.
 * @param {{ maxItems?: number }} [options] queue bound; the UI applies its own smaller visible cap.
 * @returns notification store.
 */
export function createNotificationStore(options = {}) {
  const maxItems = Number.isInteger(options.maxItems) && options.maxItems > 0
    ? options.maxItems
    : MAX_STORE_ITEMS
  let items = []
  const listeners = new Set()

  const emit = () => {
    for (const listener of listeners) {
      try {
        listener()
      } catch {
        // One broken subscriber must not stop the rest.
      }
    }
  }

  const findIndex = (id) => items.findIndex((item) => item.id === id)

  return {
    getSnapshot: () => items,
    count: () => items.length,
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    /**
     * Insert or replace one card. Replacing preserves the original position
     * and creation time so a refreshed card does not jump around.
     * @param {object} item card item; `id`, `kind`, and `sessionId` are required.
     * @returns the stored item.
     */
    upsert(item) {
      if (item === null || typeof item !== 'object' || item.id === undefined) {
        throw new TypeError('notification item requires an id')
      }
      const id = String(item.id)
      const index = findIndex(id)
      const now = Date.now()
      const stored = {
        ...item,
        id,
        createdAt: index >= 0 ? items[index].createdAt : (item.createdAt ?? now),
        updatedAt: now,
      }
      if (index >= 0) {
        const next = items.slice()
        next[index] = stored
        items = next
      } else {
        items = [...items, stored]
        if (items.length > maxItems) items = items.slice(items.length - maxItems)
      }
      emit()
      return stored
    },
    /**
     * Patch one existing card in place.
     * @param {string} id card id.
     * @param {object} patch fields to merge.
     * @returns the updated card, or undefined when the id is unknown.
     */
    update(id, patch) {
      const index = findIndex(String(id))
      if (index < 0) return undefined
      const next = items.slice()
      next[index] = { ...next[index], ...patch, id: next[index].id, updatedAt: Date.now() }
      items = next
      emit()
      return next[index]
    },
    remove(id) {
      const index = findIndex(String(id))
      if (index < 0) return false
      items = items.filter((item) => item.id !== String(id))
      emit()
      return true
    },
    removeWhere(predicate) {
      const next = items.filter((item) => !predicate(item))
      if (next.length === items.length) return 0
      const removed = items.length - next.length
      items = next
      emit()
      return removed
    },
    removeSession(sessionId) {
      return this.removeWhere((item) => item.sessionId === sessionId)
    },
    clear() {
      if (items.length === 0) return
      items = []
      emit()
    },
  }
}
