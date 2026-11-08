/**
 * Which notification surface currently owns the cards.
 *
 * The in-page overlay and the detached popup render the same store, so only one
 * of them may be visible at a time. The popup controller sets `popup` when its
 * root is ready and `inpage` when it closes; the overlay hides while the popup
 * owns the surface.
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
