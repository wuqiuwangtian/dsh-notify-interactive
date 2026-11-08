/**
 * Whether the interactive popup currently owns delivery.
 *
 * The popup controller sets `popup` when its root is ready and `inpage` when it
 * closes or is blocked. The engine reads this flag to choose the interactive
 * popup or the host's Windows popup fallback.
 */
export function createSurfaceStore(initial = 'inpage') {
  let surface = initial
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

  return {
    getSnapshot: () => surface,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    set(next) {
      if (next !== 'popup' && next !== 'inpage') return
      if (surface === next) return
      surface = next
      emit()
    },
    isPopup: () => surface === 'popup',
  }
}
