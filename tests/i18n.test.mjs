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

test('event labels use the selected language', () => {
  assert.equal(translate('zh', 'settings.scenario.approval'), '权限申请')
  assert.equal(translate('en', 'settings.scenario.approval'), 'Permission requests')
})
