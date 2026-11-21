/** Pull remote changes, replay only local edits on revision conflicts. */
export function settingsDiff(before, after) {
  const patch = {}
  for (const key of Object.keys(after)) {
    if (after[key] && typeof after[key] === 'object' && !Array.isArray(after[key])) {
      const child = settingsDiff(before?.[key] ?? {}, after[key])
      if (Object.keys(child).length) patch[key] = child
    } else if (before?.[key] !== after[key]) patch[key] = after[key]
  }
  return patch
}
export function createPreferencesSync(store, options = {}) {
  const fetcher = options.fetch ?? globalThis.fetch.bind(globalThis)
  const endpoint = '/dsh-notify-interactive/settings'
  let previous = store.getSnapshot()
  const initial = previous
  let revision = 0
  let applying = false
  let stopped = false
  let busy = false
  let initialized = false
  let timer
  let syncStatus = 'connecting'
  const listeners = new Set()
  const publish = status => { if (status !== syncStatus) { syncStatus = status; for (const listener of listeners) listener() } }
  const queue = []
  const unsubscribe = store.subscribe(() => {
    const next = store.getSnapshot()
    if (!applying) {
      const patch = settingsDiff(previous, next)
      if (Object.keys(patch).length) { queue.push(patch); publish('connecting') }
    }
    previous = next
    if (!applying) void synchronize()
  })
  function apply(remote) {
    revision = remote.revision
    initialized = remote.initialized
    applying = true
    store.replace(remote.settings)
    applying = false
    previous = store.getSnapshot()
  }
  async function synchronize() {
    if (busy || stopped) return
    busy = true
    let reschedule = false
    try {
      const response = await fetcher(endpoint, { cache: 'no-store' })
      if (!response.ok) throw Error('preferences-fetch-failed')
      const remote = await response.json()
      if (stopped) return
      // Do not overwrite edits until their patches have been applied on the server.
      revision = remote.revision
      initialized = remote.initialized
      if (!initialized && store.hasSavedSettings) {
        const migrated = await fetcher(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ revision, initial }) })
        if (!migrated.ok && migrated.status !== 409) throw Error('preferences-migration-failed')
        const result = await migrated.json()
        revision = result.revision; initialized = result.initialized
      }
      let conflicts = 0
      while (queue.length && !stopped) {
        const patch = queue[0]
        const response = await fetcher(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ revision, patch }) })
        const value = await response.json()
        if (response.status === 409) { revision = value.revision; if (++conflicts > 3) throw Error('preferences-conflict'); continue }
        if (!response.ok) throw Error('preferences-update-failed')
        queue.shift()
        revision = value.revision
      }
      if (!stopped && !queue.length) {
        const latest = await fetcher(endpoint, { cache: 'no-store' })
        if (latest.ok) {
          const value = await latest.json()
          if (queue.length) reschedule = true
          else if (!stopped && value.initialized) apply(value)
        }
      }
      publish(queue.length ? 'connecting' : 'synced')
      options.onStatus?.('synced')
    } catch { publish('offline'); options.onStatus?.('offline') }
    finally { busy = false; if (reschedule && !stopped) void synchronize() }
  }
  return {
    getSnapshot: () => syncStatus,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    start() { void synchronize(); timer = setInterval(synchronize, options.intervalMs ?? 5000) },
    stop() { stopped = true; clearInterval(timer); unsubscribe() },
    synchronize,
  }
}
