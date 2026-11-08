import test from 'node:test'
import assert from 'node:assert/strict'
import { createSystemNotifier } from '../src/system/notify.js'

test('system notifications request persistent completion toasts', () => {
  const Original = globalThis.Notification
  const created = []
  class FakeNotification {
    static permission = 'granted'
    static async requestPermission() {
      return 'granted'
    }
    constructor(title, options) {
      this.title = title
      this.options = options
      created.push(this)
    }
    close() {}
  }
  globalThis.Notification = FakeNotification
  try {
    const notifier = createSystemNotifier()
    assert.equal(notifier.supported, true)
    const notification = notifier.show({
      title: 'Turn finished',
      body: 'Session one',
      tag: 's1:completion',
      kind: 'completion',
      onClick() {},
    })
    assert.equal(notification, created[0])
    assert.equal(created[0].options.requireInteraction, true)
    assert.equal(created[0].options.silent, true)
    assert.equal(created[0].options.tag, 's1:completion')
    notifier.closeAll()
  } finally {
    globalThis.Notification = Original
  }
})
