/**
 * Per-page runtime shared by the slot components and the popup root.
 * The client entry fills this object in `apply`; UI modules only read it.
 */
export const runtime = {
  ready: false,
  ctx: undefined,
  settingsStore: undefined,
  notificationStore: undefined,
  popupController: undefined,
  engine: undefined,
  soundPlayer: undefined,
  systemNotifier: undefined,
  translate: (key) => key,
  resolveText: (value) => (value?.en ?? ''),
  openSession: () => {},
  openPopup: async () => {},
  closePopup: () => {},
  dismiss: () => {},
  addDemo: () => {},
  getMainSession: () => ({ id: undefined, title: undefined }),
  resetSettings: () => {},
  requestNotificationPermission: async () => 'default',
  testSystemNotification: () => {},
  previewSound: () => false,
}
