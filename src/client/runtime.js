/** State used by the registered DSH settings section. */
export const runtime = {
  ready: false,
  preferencesSync: { getSnapshot: () => 'connecting', subscribe: () => () => {} },
}
