import { createElement as h, useEffect, useState } from 'react'
import { runtime } from '../client/runtime.js'
import { SOUND_PRESET_IDS, SCENARIO_KEYS } from '../state/settings.js'
import { useStore } from './useStore.js'
import { useLocale } from './locale.js'
import {
  Badge,
  Button,
  Field,
  Section,
  Select,
  Slider,
  Switch,
} from './controls.jsx'
import {
  AlertIcon,
  BellIcon,
  CheckIcon,
  QuestionIcon,
} from './icons.jsx'

/** Settings page registered into the DSH Settings panel. */
export function Settings() {
  const settings = useStore(runtime.settingsStore)
  const preferencesStatus = useStore(runtime.preferencesSync)
  const notifications = useStore(runtime.notificationStore)
  const popup = useStore(runtime.popupController)
  const { t } = useLocale(runtime.ctx)
  const storeStatus = runtime.settingsStore.getStatus()
  const [audioReady, setAudioReady] = useState(() => runtime.soundPlayer?.isReady?.() ?? false)
  const [previewStatus, setPreviewStatus] = useState(null)
  const [resetDone, setResetDone] = useState(false)
  const [desktop, setDesktop] = useState(null)
  const [desktopTest, setDesktopTest] = useState(null)
  useEffect(() => {
    let active = true
    runtime.getDesktopStatus().then(value => { if (active) setDesktop(value) })
    return () => { active = false }
  }, [])
  const desktopStatusKey = desktop === null ? 'desktopLoading'
    : desktop.reason === 'host-unavailable' ? 'desktopHostUnavailable'
      : desktop.mode === 'disabled' ? 'desktopDisabled'
        : !desktop.available ? 'desktopMissing' : 'desktopReady'

  async function testDesktop() {
    setDesktopTest('desktopTesting')
    try {
      const main = runtime.getMainSession?.() ?? {}
      const result = await runtime.windowsFallback({
        kind: 'demo-completion', sessionId: main.id ?? 'demo-session',
        title: t('settings.demoWindowsTitle'), body: t('settings.demoWindowsCompletion'), silent: !settings.sound.enabled,
      })
      setDesktopTest(result?.delivery === 'rendered' ? 'desktopDelivered'
        : result?.delivery === 'queued' ? 'desktopQueued'
          : result?.delivery === 'uncertain' ? 'desktopUncertain'
          : result?.delivery === 'process-started' ? 'desktopLegacy' : 'desktopFailed')
    } catch { setDesktopTest('desktopFailed') }
  }

  useEffect(() => {
    setPreviewStatus(null)
    setAudioReady(runtime.soundPlayer?.isReady?.() ?? false)
  }, [settings.sound.enabled, settings.sound.preset])

  const main = runtime.getMainSession?.() ?? { id: undefined, title: undefined }
  const mainSessionId = main.id
  const mainTitle = main.title
  const update = (patch) => runtime.settingsStore.update(patch)
  const soundOptions = SOUND_PRESET_IDS.map((id) => ({ value: id, label: t(`sound.${id}`) }))
  const previewLabel = previewStatus === null
    ? null
    : t(`settings.preview${previewStatus === 'played'
      ? 'Played'
      : previewStatus === 'fallback'
        ? 'Fallback'
        : previewStatus === 'silent'
          ? 'Silent'
          : previewStatus === 'unsupported'
            ? 'Unsupported'
            : 'Blocked'}`)

  async function previewSound() {
    try {
      const result = await runtime.previewSound(settings.sound.preset, settings.sound.volume)
      setPreviewStatus(result)
      setAudioReady(
        result === 'played'
        || result === 'fallback'
        || (runtime.soundPlayer?.isReady?.() ?? false),
      )
    } catch {
      setPreviewStatus('blocked')
    }
  }

  async function openPopup() {
    if (runtime.notificationStore.count() === 0) return
    try {
      await runtime.openPopup()
    } catch {
      // The controller reports a blocked popup through its snapshot.
    }
  }

  function addDemo(kind) {
    runtime.addDemo(kind, { sessionId: mainSessionId, sessionTitle: mainTitle })
    if (runtime.surfaceStore.isPopup()) return
    const suffix = kind === 'question' ? 'Question' : kind === 'completion' ? 'Completion' : 'Approval'
    runtime.windowsFallback({
      kind: `demo-${kind}`,
      sessionId: mainSessionId ?? 'demo-session',
      title: t('settings.demoWindowsTitle'),
      body: t(`settings.demoWindows${suffix}`),
      silent: false,
    })
  }

  function openPopupTest() {
    runtime.addDemo('approval', { sessionId: mainSessionId, sessionTitle: mainTitle })
    openPopup()
  }

  function reset() {
    runtime.resetSettings()
    setResetDone(true)
  }

  const warnings = []
  if (storeStatus.storageError === 'read') warnings.push(t('settings.storageReadError'))
  if (storeStatus.storageError === 'write') warnings.push(t('settings.storageWriteError'))
  if (storeStatus.storageAvailable === false) warnings.push(t('settings.storageUnavailable'))
  if (popup.error === 'blocked') warnings.push(t('settings.popupBlocked'))

  return h('div', { className: 'dni-settings' },
    h('header', { className: 'dni-settings-head' },
      h('div', { className: 'dni-settings-mark', 'aria-hidden': true }, h(BellIcon, { size: 22 })),
      h('div', { className: 'dni-settings-headtext' },
        h('h2', { className: 'dni-settings-title' }, t('settings.title')),
        h('p', { className: 'dni-settings-description' }, t('settings.description')),
      ),
    ),

    warnings.map((warning, index) => h('div', { key: `warning-${index}`, className: 'dni-warning' }, warning)),

    h('div', { className: 'dni-statusbar' },
      h(Badge, { tone: popup.open ? 'success' : 'neutral' },
        `${t('settings.popup')}: ${popup.open ? t('settings.popupOpenState') : t('settings.popupClosedState')}`),
      h(Badge, { tone: audioReady ? 'success' : 'warn' },
        `${t('settings.audio')}: ${audioReady ? t('settings.audioReady') : t('settings.audioBlocked')}`),
      notifications.length > 0
        ? h(Badge, { tone: 'neutral' }, `${t('settings.active')}: ${notifications.length}`)
        : null,
    ),

    h('p', { className: 'dni-hint', role: 'status' }, t(`settings.preferences.${preferencesStatus}`)),

    h(Section, { title: t('settings.master') },
      h(Field, { label: t('settings.master'), hint: t('settings.masterHint') },
        h(Switch, {
          checked: settings.enabled,
          label: t('settings.master'),
          onChange: (value) => update({ enabled: value }),
        }),
      ),
    ),

    h(Section, { title: t('settings.sound') },
      h(Field, { label: t('settings.soundEnabled'), hint: t('settings.soundHint') },
        h(Switch, {
          checked: settings.sound.enabled,
          label: t('settings.soundEnabled'),
          onChange: (value) => update({ sound: { enabled: value } }),
        }),
      ),
      h(Field, { label: t('settings.preset') },
        h(Select, {
          value: settings.sound.preset,
          label: t('settings.preset'),
          options: soundOptions,
          onChange: (value) => update({ sound: { preset: value } }),
        }),
      ),
      h(Field, { label: t('settings.volume') },
        h('div', { className: 'dni-inline' },
          h(Slider, {
            value: settings.sound.volume,
            min: 0,
            max: 1,
            step: 0.05,
            label: t('settings.volume'),
            onChange: (value) => update({ sound: { volume: value } }),
          }),
          h(Button, { variant: 'outline', size: 'sm', onClick: previewSound }, t('settings.preview')),
          previewLabel === null
            ? null
            : h(Badge, {
              tone: previewStatus === 'played' || previewStatus === 'fallback'
                ? 'success'
                : previewStatus === 'silent'
                  ? 'neutral'
                  : 'danger',
            }, previewLabel),
        ),
      ),
    ),

    h(Section, { title: t('settings.channels') },
      h('div', { className: 'dni-scenarios-master' }, h(Field, { label: t('settings.popupEnabled') }, h(Switch, {
        checked: settings.popup.enabled, label: t('settings.popupEnabled'),
        onChange: value => update({ popup: { enabled: value } }),
      }))),
      h('div', { className: 'dni-scenarios-wrap' }, h('table', { className: 'dni-scenarios' },
        h('thead', null, h('tr', null,
          h('th', { scope: 'col' }, t('settings.event')),
          h('th', { scope: 'col' }, t('settings.popupShort')),
          h('th', { scope: 'col' }, t('settings.soundShort')),
          h('th', { scope: 'col' }, t('settings.preset')),
        )),
        h('tbody', null, ...SCENARIO_KEYS.map(key => h('tr', { key },
          h('th', { scope: 'row' }, t(`settings.scenario.${key}`)),
          h('td', null, h(Switch, { checked: settings.scenarios[key].notify,
            label: `${t(`settings.scenario.${key}`)} ${t('settings.popupEnabled')}`,
            onChange: value => update({ scenarios: { [key]: { notify: value } } }),
          })),
          h('td', null, h(Switch, { checked: settings.scenarios[key].sound,
            label: `${t(`settings.scenario.${key}`)} ${t('settings.soundEnabled')}`,
            onChange: value => update({ scenarios: { [key]: { sound: value } } }),
          })),
          h('td', null, h(Select, { value: settings.scenarios[key].preset,
            label: `${t(`settings.scenario.${key}`)} ${t('settings.preset')}`,
            options: [{ value: 'inherit', label: t('settings.inheritSound') }, ...soundOptions],
            onChange: value => update({ scenarios: { [key]: { preset: value } } }),
          })),
        ))),
      )),
    ),

    h(Section, { title: t('settings.desktop') },
      h('p', { className: 'dni-hint' }, t(`settings.${desktopStatusKey}`)),
      h(Button, {
        variant: 'outline', size: 'sm',
        disabled: !desktop?.enabled || !desktop?.available || desktopTest === 'desktopTesting',
        onClick: testDesktop,
      }, t('settings.desktopTest')),
      desktopTest !== null ? h('p', { className: 'dni-hint', role: 'status' }, t(`settings.${desktopTest}`)) : null,
    ),

    h(Section, { title: t('settings.popup') },
      h(Field, { label: t('settings.popupAvailability'), hint: t('settings.popupHint') },
        h('div', { className: 'dni-inline' },
          h(Button, {
            variant: 'outline',
            size: 'sm',
            disabled: !popup.open && notifications.length === 0,
            onClick: popup.open ? () => runtime.closePopup() : openPopup,
          }, popup.open ? t('settings.popupClose') : t('settings.popupOpen')),
          h(Button, {
            variant: 'ghost',
            size: 'sm',
            onClick: openPopupTest,
          }, t('settings.popupTest')),
          h(Button, {
            variant: 'ghost',
            size: 'sm',
            onClick: () => runtime.windowsFallback({
              kind: 'test',
              sessionId: 'test',
              title: t('settings.testWindowsTitle'),
              body: t('settings.testWindowsBody'),
            }),
          }, t('settings.testWindows')),
        ),
      ),
      typeof globalThis.documentPictureInPicture?.requestWindow !== 'function'
        ? h('div', { className: 'dni-hint' }, t('settings.popupUnsupported'))
        : null,
    ),

    h(Section, { title: t('settings.tests') },
      h('div', { className: 'dni-test-grid' },
        h(Button, { variant: 'outline', size: 'sm', onClick: () => addDemo('approval') },
          h(AlertIcon, { size: 14 }), t('settings.testApproval')),
        h(Button, { variant: 'outline', size: 'sm', onClick: () => addDemo('question') },
          h(QuestionIcon, { size: 14 }), t('settings.testQuestion')),
        h(Button, { variant: 'outline', size: 'sm', onClick: () => addDemo('completion') },
          h(CheckIcon, { size: 14 }), t('settings.testCompletion')),
      ),
      h('div', { className: 'dni-hint' }, t('settings.testsHint')),
      mainSessionId !== undefined
        ? h('div', { className: 'dni-hint' }, `${t('card.openSession')}: ${mainTitle}`)
        : null,
    ),

    h(Section, { title: t('settings.reset') },
      h('div', { className: 'dni-inline' },
        h(Button, { variant: 'danger', size: 'sm', onClick: reset }, t('settings.reset')),
        resetDone ? h(Badge, { tone: 'success' }, t('settings.resetDone')) : null,
      ),
      h('div', { className: 'dni-hint' }, t('settings.resetHint')),
    ),
  )
}
