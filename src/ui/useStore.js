import { useSyncExternalStore } from 'react'

/** Subscribe a React component to one of the plugin's observable stores. */
export function useStore(store) {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
}
