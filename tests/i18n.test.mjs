import test from 'node:test'
import assert from 'node:assert/strict'
import { localeIdOf, translate } from '../src/i18n/dict.js'

test('Chinese locales resolve to the Chinese dictionary', () => {
  assert.equal(localeIdOf('zh'), 'zh')
  assert.equal(localeIdOf('zh-CN'), 'zh')
  assert.equal(localeIdOf('zh-TW'), 'zh')
  assert.match(translate('zh-CN', 'settings.title'), /互动提醒/)
})

test('non-Chinese locales fall back to English', () => {
  assert.equal(localeIdOf('en'), 'en')
  assert.equal(localeIdOf('en-US'), 'en')
  assert.equal(localeIdOf('fr'), 'en')
  assert.equal(localeIdOf(undefined), 'en')
  assert.match(translate('fr', 'settings.title'), /Interactive notifications/)
})

test('placeholder interpolation works in both dictionaries', () => {
  assert.equal(translate('zh', 'popup.more', { count: 3 }), '还有 3 条')
  assert.equal(translate('en', 'popup.more', { count: 3 }), '3 more')
})
