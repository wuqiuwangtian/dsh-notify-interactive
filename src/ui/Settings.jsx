import { createElement as h, useEffect, useState } from 'react'
import { runtime } from '../client/runtime.js'
import { SOUND_PRESET_IDS } from '../state/settings.js'
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

const PERMISSION_TONE = {
  granted: 'success',
  denied: 'danger',
  default: 'warn',
  unsupported: 'neutral',
}

/** Settings page registered into the DSH Settings panel. */
export function Settings() {
  const settings = useStore(runtime.settingsStore)
  const notifications = useStore(runtime.notificationStore)
  const popup = useStore(runtime.popupController)
  const { t } = useLocale(runtime.ctx)
  const storeStatus = runtime.settingsStore.getStatus()
  const [permission, setPermission] = useState(() => runtime.systemNotifier?.permission?.() ?? 'unsupported')
  const [audioReady, setAudioReady] = useState(() => runtime.soundPlayer?.isReady?.() ?? false)
  const [previewStatus, setPreviewStatus] = useState(null)
  const [resetDone, setResetDone] = useState(false)

  useEffect(() => {
    setPreviewStatus(null)
    setAudioReady(runtime.soundPlayer?.isReady?.() ?? false)
  }, [settings.sound.enabled, settings.sound.preset])

  const main = runtime.getMainSession?.() ?? { id: undefined, title: undefined }
  const mainSessionId = main.id
  const mainTitle = main.title
  const update = (patch) => runtime.settingsStore.update(patch)
  const soundOptions = SOUND_PRESET_IDS.map((id) => ({ value: id, label: t(`sound.${id}`) }))
  const permissionLabel = t(`settings.permission${permission === 'granted'
    ? 'Granted'
    : permission === 'denied'
      ? 'Denied'
      : permission === 'unsupported'
        ? 'Unsupported'
        : 'Default'}`)
  const backendLabel = t(`popup.backend${popup.backend === 'pip'
    ? 'Pip'
    : popup.backend === 'window'
      ? 'Window'
      : 'Inpage'}`)

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

  async function authorize() {
    const result = await runtime.requestNotificationPermission()
    setPermission(result)
    if (result === 'granted') runtime.testSystemNotification()
  }

  async function testNotification() {
    if (permission !== 'granted') {
      const result = await runtime.requestNotificationPermission()
      setPermission(result)
      if (result !== 'granted') return
    }
    runtime.testSystemNotification()
  }

  async function openPopup() {
    try {
      await runtime.openPopup()
    } catch {
      // The controller reports a blocked popup through its snapshot.
    }
  }

  function addDemo(kind) {
    runtime.addDemo(kind, { sessionId: mainSessionId, sessionTitle: mainTitle })
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
      h(Badge, { tone: 'neutral' }, `${t('settings.active')}: ${notifications.length}`),
      h(Badge, { tone: 'neutral' }, `${t('settings.backend')}: ${backendLabel}`),
      h(Badge, { tone: PERMISSION_TONE[permission] ?? 'neutral' }, `${t('settings.permission')}: ${permissionLabel}`),
      h(Badge, { tone: audioReady ? 'success' : 'warn' }, `${t('settings.audio')}: ${audioReady ? t('settings.audioReady') : t('settings.audioBlocked')}`),
    ),

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
          previewStatus === null
            ? null
            : h(Badge, {
              tone: previewStatus === 'played' || previewStatus === 'fallback'
                ? 'success'
                : previewStatus === 'silent'
                  ? 'neutral'
                  : 'danger',
            }, t(`settings.preview${previewStatus === 'played'
              ? 'Played'
              : previewStatus === 'fallback'
                ? 'Fallback'
                : previewStatus === 'silent'
                  ? 'Silent'
                  : previewStatus === 'unsupported'
                    ? 'Unsupported'
                    : 'Blocked'}`)),
        ),
      ),
    ),

    h(Section, { title: t('settings.popup') },
      h(Field, { label: t('settings.popupEnabled'), hint: t('settings.popupHint') },
        h(Switch, {
          checked: settings.popup.enabled,
          label: t('settings.popupEnabled'),
          onChange: (value) => update({ popup: { enabled: value } }),
        }),
      ),
      h(Field, { label: t('settings.popupBackend') },
        h('div', { className: 'dni-inline' },
          h(Badge, { tone: popup.backend === 'pip' ? 'success' : 'neutral' }, backendLabel),
          h(Button, {
            variant: 'outline',
            size: 'sm',
            onClick: popup.open ? () => runtime.closePopup() : openPopup,
          }, popup.open ? t('settings.popupClose') : t('settings.popupOpen')),
          h(Button, {
            variant: 'ghost',
            size: 'sm',
            onClick: () => addDemo('approval'),
          }, t('settings.popupTest')),
        ),
      ),
      typeof globalThis.documentPictureInPicture?.requestWindow !== 'function'
        ? h('div', { className: 'dni-hint' }, t('settings.popupUnsupported'))
        : null,
    ),

    h(Section, { title: t('settings.system') },
      h(Field, { label: t('settings.systemEnabled'), hint: t('settings.systemHint') },
        h(Switch, {
          checked: settings.system.enabled,
          label: t('settings.systemEnabled'),
          onChange: (value) => update({ system: { enabled: value } }),
        }),
      ),
      h(Field, { label: t('settings.permission') },
        h('div', { className: 'dni-inline' },
          h(Badge, { tone: PERMISSION_TONE[permission] ?? 'neutral' }, permissionLabel),
          h(Button, {
            variant: 'outline',
            size: 'sm',
            onClick: authorize,
            disabled: permission === 'unsupported' || permission === 'granted',
          }, t('settings.authorize')),
          h(Button, {
            variant: 'ghost',
            size: 'sm',
            onClick: testNotification,
            disabled: permission === 'unsupported',
          }, t('settings.testNotification')),
        ),
      ),
    ),

    h(Section, { title: t('settings.behavior') },
      h(Field, {
        label: t('settings.suppressWhenFocused'),
        hint: t('settings.suppressWhenFocusedHint'),
      },
      h(Switch, {
        checked: settings.behavior.suppressWhenFocused,
        label: t('settings.suppressWhenFocused'),
        onChange: (value) => update({ behavior: { suppressWhenFocused: value } }),
      })),
      h(Field, {
        label: t('settings.includeSubagents'),
        hint: t('settings.includeSubagentsHint'),
      },
      h(Switch, {
        checked: settings.behavior.includeSubagents,
        label: t('settings.includeSubagents'),
        onChange: (value) => update({ behavior: { includeSubagents: value } }),
      })),
      h(Field, {
        label: t('settings.autoDismiss'),
        hint: t('settings.autoDismissHint'),
      },
      h('div', { className: 'dni-inline' },
        h(Slider, {
          value: settings.behavior.completionAutoDismissMs / 1000,
          min: 0,
          max: 30,
          step: 1,
          label: t('settings.autoDismiss'),
          onChange: (value) => update({ behavior: { completionAutoDismissMs: Math.round(value * 1000) } }),
        }),
        h('span', { className: 'dni-value' }, `${Math.round(settings.behavior.completionAutoDismissMs / 1000)}${t('settings.seconds')}`),
      )),
      h(Field, {
        label: t('settings.maxCards'),
        hint: t('settings.maxCardsHint'),
      },
      h('div', { className: 'dni-inline' },
        h(Slider, {
          value: settings.behavior.maxVisibleCards,
          min: 1,
          max: 5,
          step: 1,
          label: t('settings.maxCards'),
          onChange: (value) => update({ behavior: { maxVisibleCards: Math.round(value) } }),
        }),
        h('span', { className: 'dni-value' }, String(settings.behavior.maxVisibleCards)),
      )),
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
