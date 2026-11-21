/**
 * Client-side dictionaries for every surface this plugin owns.
 * The bundle locale files only supply the Plugins-page metadata; these
 * dictionaries power the settings page and event text.
 */

export const LOCALE_NAMESPACE = 'notifyInteractive'

export const dictionaries = {
  en: {
    'settings.popupShort': 'Notification',
    'settings.soundShort': 'Sound',
    'settings.event': 'Event',
    'settings.channels': 'Notifications by event',
    'settings.popupEnabled': 'Show Windows notifications',
    'settings.inheritSound': 'Use the default sound',
    'settings.scenario.approval': 'Permission requests',
    'settings.scenario.question': 'Questions',
    'settings.scenario.planReview': 'Plan reviews',
    'settings.scenario.completion': 'Turn completion',
    'settings.completionTiming': 'Completion notification timing',
    'settings.timing.always': 'Always',
    'settings.timing.session-away': 'When away from this conversation',
    'settings.timing.window-away': 'When outside DSH',
    'settings.timing.never': 'Never',
    'settings.preferences.connecting': 'Syncing profile settings…',
    'settings.preferences.synced': 'Settings saved to the DSH profile.',
    'settings.preferences.offline': 'Profile settings unavailable; local changes are queued. Reload the updated host or check the connection.',

    'settings.desktop': 'Desktop reminders',
    'settings.desktopLoading': 'Checking Windows notifications…',
    'settings.desktopHostUnavailable': 'Desktop status is unavailable. Restart the DSH host to load the updated plugin, then refresh this page.',
    'settings.desktopDisabled': 'Windows notifications are disabled in the host environment.',
    'settings.desktopMissing': 'Windows PowerShell is unavailable. Check Windows or WSL interop.',
    'settings.desktopNative': 'Windows Notification Center',
    'settings.desktopOrigin': 'Set DSH_NOTIFY_WINDOWS_ORIGIN to the reachable Web origin and restart DSH.',
    'settings.desktopActions': 'Session links are available. Restart DSH and check the Windows activator to restore buttons.',
    'settings.selectSession': 'Open a conversation to test its notification.',
    'settings.nativeAccepted': 'Windows accepted the notification.',
    'settings.nativeSound': 'The notification sound was played.',
    'settings.nativeMuted': 'Windows notification settings suppressed this reminder.',
    'settings.nativeSuppressed': 'Your preferences suppressed this reminder.',
    'settings.desktopTest': 'Test desktop completion reminder',
    'settings.desktopTesting': 'Waiting for desktop confirmation…',
    'settings.desktopFailed': 'Delivery failed. Check the DSH host diagnostics.',

    'settings.nav': 'Interactive notifications',
    'settings.title': 'Interactive notifications',
    'settings.description': 'By default, notify when you are away from the conversation. Configure popups and sound independently.',
    'settings.master': 'Enable notifications',
    'settings.sound': 'Sound',
    'settings.soundHint': 'Choose the default sound and volume. Each event can override the sound.',
    'settings.soundEnabled': 'Play a sound',
    'settings.preset': 'Sound preset',
    'settings.volume': 'Volume',
    'settings.preview': 'Preview',
    'settings.previewPlayed': 'Played',
    'settings.previewFallback': 'Played (fallback audio)',
    'settings.previewSilent': 'The selected sound is silent',
    'settings.previewBlocked': 'The browser blocked audio; try again or check the system volume',
    'settings.previewUnsupported': 'Audio playback is unavailable',
    'settings.demoWindowsTitle': 'DSH demo reminder',
    'settings.demoWindowsCompletion': 'Demo: a session has finished.',
    'settings.reset': 'Reset preferences',
    'settings.resetHint': 'Restore the defaults. This does not remove the plugin.',
    'settings.resetDone': 'Preferences restored.',
    'settings.storageUnavailable': 'Browser storage is unavailable; changes last for this page only.',
    'settings.storageReadError': 'Stored preferences could not be read; defaults are in use.',
    'settings.storageWriteError': 'Preferences could not be saved; changes last for this page only.',
    'notify.approval.title': 'Approval needed',
    'notify.question.title': 'Question waiting',
    'notify.plan.title': 'Plan review waiting',
    'notify.completion.title': 'Turn finished',
    'notify.completion.body': 'This turn has ended.',
    'sound.chime': 'Chime',
    'sound.pulse': 'Pulse',
    'sound.complete': 'Complete',
    'sound.soft': 'Soft ping',
    'sound.alert': 'Alert',
    'sound.none': 'Silent',
  },
  zh: {
    'settings.popupShort': '通知',
    'settings.soundShort': '声音',
    'settings.event': '事件',
    'settings.channels': '按事件设置提醒',
    'settings.popupEnabled': '显示 Windows 通知',
    'settings.inheritSound': '跟随默认音效',
    'settings.scenario.approval': '权限申请',
    'settings.scenario.question': '提问',
    'settings.scenario.planReview': '计划审核',
    'settings.scenario.completion': '本轮结束',
    'settings.completionTiming': '完成通知时机',
    'settings.timing.always': '始终',
    'settings.timing.session-away': '离开当前会话时',
    'settings.timing.window-away': '离开整个 DSH 窗口时',
    'settings.timing.never': '从不',
    'settings.preferences.connecting': '正在同步 profile 设置…',
    'settings.preferences.synced': '设置已保存到 DSH profile。',
    'settings.preferences.offline': '尚未连接 profile 设置，本地修改等待同步；请加载新版宿主或检查连接。',

    'settings.desktop': '桌面提醒',
    'settings.desktopLoading': '正在检查 Windows 通知…',
    'settings.desktopHostUnavailable': '无法读取桌面状态。请重启 DSH 宿主加载新版插件，再刷新页面。',
    'settings.desktopDisabled': '宿主环境变量已关闭 Windows 提醒。',
    'settings.desktopMissing': '无法连接 Windows PowerShell，请检查 Windows 或 WSL 互操作。',
    'settings.desktopNative': 'Windows 通知中心',
    'settings.desktopOrigin': '请设置 Windows 可达的 DSH_NOTIFY_WINDOWS_ORIGIN 并重启 DSH。',
    'settings.desktopActions': '通知可回会话。请重启 DSH 并检查 Windows 激活程序，以恢复作答按钮。',
    'settings.selectSession': '先打开会话，再测试该会话的通知。',
    'settings.nativeAccepted': 'Windows 已接受通知。',
    'settings.nativeSound': '已播放通知音。',
    'settings.nativeMuted': 'Windows 通知设置已抑制这次提醒。',
    'settings.nativeSuppressed': '当前偏好已抑制这次提醒。',
    'settings.desktopTest': '测试桌面提醒',
    'settings.desktopTesting': '正在等待桌面确认…',
    'settings.desktopFailed': '投递失败，请检查 DSH 宿主诊断。',

    'settings.nav': '互动提醒',
    'settings.title': '互动提醒',
    'settings.description': '默认在未关注会话时提醒，通知和声音可分别设置。',
    'settings.master': '启用提醒',
    'settings.sound': '音效',
    'settings.soundHint': '设置默认音效与音量，各场景可以单独选择音效。',
    'settings.soundEnabled': '播放提示音',
    'settings.preset': '音效',
    'settings.volume': '音量',
    'settings.preview': '试听',
    'settings.previewPlayed': '已播放',
    'settings.previewFallback': '已通过备用音频播放',
    'settings.previewSilent': '当前音效为静音',
    'settings.previewBlocked': '浏览器阻止了音频，请再点一次或检查系统音量',
    'settings.previewUnsupported': '当前环境不支持音频播放',
    'settings.demoWindowsTitle': 'DSH 演示提醒',
    'settings.demoWindowsCompletion': '演示：一个会话已完成。',
    'settings.reset': '恢复默认设置',
    'settings.resetHint': '恢复默认值，不会卸载插件。',
    'settings.resetDone': '已恢复默认设置。',
    'settings.storageUnavailable': '浏览器存储不可用；本次修改只在当前页面有效。',
    'settings.storageReadError': '读取已保存的设置失败，正在使用默认值。',
    'settings.storageWriteError': '设置保存失败；本次修改只在当前页面有效。',
    'notify.approval.title': '需要你的批准',
    'notify.question.title': '有问题等你回答',
    'notify.plan.title': '有计划等你审核',
    'notify.completion.title': '本轮已结束',
    'notify.completion.body': '这一轮已经结束。',
    'sound.chime': '清脆铃音',
    'sound.pulse': '短促脉冲',
    'sound.complete': '完成上行音',
    'sound.soft': '轻柔提示',
    'sound.alert': '警示音',
    'sound.none': '静音',
  },
}

/** Normalize a locale id to one of the dictionaries we ship. */
export function localeIdOf(value) {
  return typeof value === 'string' && value.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

/** Translate one key with optional `{placeholder}` interpolation. */
export function translate(localeId, key, vars) {
  const id = localeIdOf(localeId)
  const dict = dictionaries[id]
  let text = dict[key] ?? dictionaries.en[key] ?? key
  if (vars !== undefined && vars !== null) {
    text = text.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name) => {
      const value = vars[name]
      return value === undefined || value === null ? match : String(value)
    })
  }
  return text
}
