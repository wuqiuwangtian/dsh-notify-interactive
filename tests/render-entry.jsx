import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { runtime } from '../src/client/runtime.js'
import { createSettingsStore } from '../src/state/settings.js'
import { createNotificationStore } from '../src/state/notifications.js'
import { createDemoItems } from '../src/ui/cards/index.jsx'
import { translate } from '../src/i18n/dict.js'
import { Settings } from '../src/ui/Settings.jsx'
import { PopupApp } from '../src/ui/PopupApp.jsx'

const settingsStore = createSettingsStore(undefined)
const notificationStore = createNotificationStore()
const popupSnapshot = { open: true, backend: 'pip', error: null }
const popupController = {
  getSnapshot: () => popupSnapshot,
  subscribe: () => () => {},
  open: async () => popupSnapshot,
  close() {},
  focus() {},
  syncTheme() {},
  syncTitle() {},
  isOpen: () => true,
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
runtime.soundPlayer = {
  isReady: () => false,
  play: () => false,
}
runtime.previewSound = async () => 'played'

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
const popupHtml = renderToStaticMarkup(h(PopupApp))

runtime.ctx.locale.getLocale = () => ({ active: 'en', locales: [], revision: 1 })
const settingsHtmlEn = renderToStaticMarkup(h(Settings))

const checks = [
  ['settings title', settingsHtml.includes('互动提醒')],
  ['settings sound section', settingsHtml.includes('音效')],
  ['settings popup section', settingsHtml.includes('交互弹窗')],
  ['settings english title', settingsHtmlEn.includes('Interactive notifications')],
  ['popup question card', popupHtml.includes('需要你的回答')],
  ['popup completion card', popupHtml.includes('本轮已结束')],
  ['popup plan card', popupHtml.includes('计划审核')],
  ['popup has no backend badge', !popupHtml.includes('始终置顶')],
  ['popup has no decorative subtitle', !popupHtml.includes('审批、提问与完成提醒')],
  ['popup has no settings footer', !popupHtml.includes('配置通道')],
  ['popup cards have no decorative icon block', !popupHtml.includes('dni-card-icon')],
  ['settings has no old system-notification section', !settingsHtml.includes('Windows 系统通知')],
  ['settings has no old do-not-disturb section', !settingsHtml.includes('当前会话不打扰')],
]
const failed = checks.filter(([, ok]) => !ok)
if (failed.length > 0) {
  throw new Error(`render smoke failed: ${failed.map(([name]) => name).join(', ')}`)
}
console.log(`render smoke ok (settings ${settingsHtml.length}B, popup ${popupHtml.length}B)`)
