/**
 * Per-page runtime shared by the slot components and the popup root.
 * The client entry fills this object in `apply`; UI modules only read it.
 */
import { createSurfaceStore } from '../state/surface.js'

const surfaceStore = createSurfaceStore()

export const runtime = {
  surfaceStore,
  setSurface: (value) => surfaceStore.set(value),
  ready: false,
  ctx: undefined,
  settingsStore: undefined,
  notificationStore: undefined,
  popupController: undefined,
  engine: undefined,
  soundPlayer: undefined,
  translate: (key) => key,
  resolveText: (value) => (value?.en ?? ''),
  openSession: () => {},
  openPopup: async () => {},
  closePopup: () => {},
  dismiss: () => {},
  addDemo: () => {},
  getMainSession: () => ({ id: undefined, title: undefined }),
  resetSettings: () => {},
  windowsFallback: () => {},
  previewSound: () => false,
}
