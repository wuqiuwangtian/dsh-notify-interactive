import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { runtime } from '../src/client/runtime.js'
import { createSettingsStore } from '../src/state/settings.js'
import { Settings } from '../src/ui/Settings.jsx'
runtime.ctx = {
  locale: {
    getLocale: () => ({ active: 'zh', locales: [], revision: 0 }),
    subscribe: () => () => {},
  },
}
runtime.settingsStore = createSettingsStore(undefined)
const zh = renderToStaticMarkup(h(Settings))
runtime.ctx.locale.getLocale = () => ({ active: 'en', locales: [], revision: 1 })
const en = renderToStaticMarkup(h(Settings))
if (!zh.includes('按事件设置提醒') || !en.includes('Completion notification timing') ||
    !en.includes('Test desktop completion reminder') || en.includes('Browser answer window')) {
  throw Error('native settings render failed')
}
console.log(`native settings render ok (zh ${zh.length}B, en ${en.length}B)`)
