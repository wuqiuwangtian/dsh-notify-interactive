import test from 'node:test'
import assert from 'node:assert/strict'
import { createSurfaceStore } from '../src/state/surface.js'

test('surface defaults to no popup', () => {
  const store = createSurfaceStore()
  assert.equal(store.getSnapshot(), 'inpage')
  assert.equal(store.isPopup(), false)
})

test('surface switch notifies once and rejects unknown values', () => {
  const store = createSurfaceStore()
  let calls = 0
  const unsubscribe = store.subscribe(() => {
    calls += 1
  })
  store.set('popup')
  assert.equal(store.getSnapshot(), 'popup')
  assert.equal(store.isPopup(), true)
  store.set('popup')
  store.set('nonsense')
  assert.equal(calls, 1)
  store.set('inpage')
  assert.equal(calls, 2)
  unsubscribe()
  store.set('popup')
  assert.equal(calls, 2)
})
