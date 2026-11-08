import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { runtime } from '../src/client/runtime.js'
import { createSettingsStore } from '../src/state/settings.js'
import { createNotificationStore } from '../src/state/notifications.js'
import { createDemoItems } from '../src/ui/cards/index.jsx'
import { translate } from '../src/i18n/dict.js'
import { Settings } from '../src/ui/Settings.jsx'
import { Overlay } from '../src/ui/Overlay.jsx'
import { PopupApp } from '../src/ui/PopupApp.jsx'

const settingsStore = createSettingsStore(undefined)
const notificationStore = createNotificationStore()
const popupSnapshot = { open: false, backend: 'inpage', error: null }
const popupListeners = new Set()
const popupController = {
  getSnapshot: () => popupSnapshot,
  subscribe(listener) {
    popupListeners.add(listener)
    return () => popupListeners.delete(listener)
  },
  open: async () => popupSnapshot,
  close() {},
  focus() {},
  syncTheme() {},
  syncTitle() {},
  isOpen: () => false,
  dispose() {},
}

runtime.ctx = {
  locale: {
    getLocale: () => ({ active: 'zh', locales: [], revision: 0 }),
    subscribe: () => () => {},
  },
}
runtime.settingsStore = settingsStore
runtime.notificationStore = notificationStore
runtime.popupController = popupController
runtime.translate = (key, vars) => translate('zh', key, vars)
runtime.resolveText = (value) => value?.zh ?? value?.en ?? ''
runtime.getMainSession = () => ({ id: 's1', title: '演示会话' })
runtime.dismiss = (id) => notificationStore.remove(id)
runtime.openSession = () => {}
runtime.openPopup = async () => popupSnapshot
runtime.closePopup = () => {}
runtime.addDemo = () => {}
runtime.systemNotifier = {
  permission: () => 'default',
  requestPermission: async () => 'granted',
}
runtime.soundPlayer = {
  isReady: () => false,
  play: () => false,
}

settingsStore.update({ behavior: { maxVisibleCards: 5 } })
const demo = createDemoItems({ t: runtime.translate, sessionId: 's1', sessionTitle: '演示会话' })
notificationStore.upsert(demo.approval)
notificationStore.upsert(demo.question)
notificationStore.upsert(demo.completion)
notificationStore.upsert({
  id: 'demo:plan',
  kind: 'plan-review',
  scenario: 'planReview',
  sessionId: 's1',
  sessionTitle: '演示会话',
  demo: true,
  interaction: {
    kind: 'plan-review',
    key: 'demo-plan',
    questions: [{
      id: 'plan',
      question: '审核这份计划',
      detail: '# 计划\n1. 做一件事\n2. 再检查一遍',
      intent: { kind: 'plan-review', approve: '批准' },
      options: [{ label: '批准' }, { label: '继续规划' }],
    }],
  },
})

const settingsHtml = renderToStaticMarkup(h(Settings))
const overlayHtml = renderToStaticMarkup(h(Overlay))
const popupHtml = renderToStaticMarkup(h(PopupApp))

runtime.ctx.locale.getLocale = () => ({ active: 'en', locales: [], revision: 1 })
const settingsHtmlEn = renderToStaticMarkup(h(Settings))
runtime.ctx.locale.getLocale = () => ({ active: 'zh', locales: [], revision: 2 })
runtime.setSurface?.('popup')
const overlayHiddenHtml = renderToStaticMarkup(h(Overlay))
runtime.setSurface?.('inpage')

const checks = [
  ['settings title', settingsHtml.includes('互动提醒')],
  ['settings sound section', settingsHtml.includes('音效')],
  ['settings english title', settingsHtmlEn.includes('Interactive notifications')],
  ['overlay hidden while popup owns the surface', !overlayHiddenHtml.includes('需要你的批准')],
  ['overlay approval card', overlayHtml.includes('需要你的批准')],
  ['popup question card', popupHtml.includes('需要你的回答')],
  ['popup completion card', popupHtml.includes('本轮已结束')],
  ['popup plan card', popupHtml.includes('计划审核')],
]
const failed = checks.filter(([, ok]) => !ok)
if (failed.length > 0) {
  throw new Error(`render smoke failed: ${failed.map(([name]) => name).join(', ')}`)
}
console.log(`render smoke ok (settings ${settingsHtml.length}B, overlay ${overlayHtml.length}B, popup ${popupHtml.length}B)`)
