window.__ModuleLoader__.load({
  id: 'dsh-notify-interactive',
  factory(require) {
    const module = { exports: {} };
    (function (module, exports, require) {
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.jsx
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);
var import_react5 = require("react");

// src/client/runtime.js
var runtime = {
  ready: false,
  preferencesSync: { getSnapshot: () => "connecting", subscribe: () => () => {
  } }
};

// src/i18n/dict.js
var dictionaries = {
  en: {
    "settings.popupShort": "Notification",
    "settings.soundShort": "Sound",
    "settings.event": "Event",
    "settings.channels": "Notifications by event",
    "settings.popupEnabled": "Show Windows notifications",
    "settings.inheritSound": "Use the default sound",
    "settings.scenario.approval": "Permission requests",
    "settings.scenario.question": "Questions",
    "settings.scenario.planReview": "Plan reviews",
    "settings.scenario.completion": "Turn completion",
    "settings.completionTiming": "Completion notification timing",
    "settings.timing.always": "Always",
    "settings.timing.session-away": "When away from this conversation",
    "settings.timing.window-away": "When outside DSH",
    "settings.timing.never": "Never",
    "settings.preferences.connecting": "Syncing profile settings\u2026",
    "settings.preferences.synced": "Settings saved to the DSH profile.",
    "settings.preferences.offline": "Profile settings unavailable; local changes are queued. Reload the updated host or check the connection.",
    "settings.desktop": "Desktop reminders",
    "settings.desktopLoading": "Checking Windows notifications\u2026",
    "settings.desktopHostUnavailable": "Desktop status is unavailable. Restart the DSH host to load the updated plugin, then refresh this page.",
    "settings.desktopDisabled": "Windows notifications are disabled in the host environment.",
    "settings.desktopMissing": "Windows PowerShell is unavailable. Check Windows or WSL interop.",
    "settings.desktopNative": "Windows Notification Center",
    "settings.desktopOrigin": "Set DSH_NOTIFY_WINDOWS_ORIGIN to the reachable Web origin and restart DSH.",
    "settings.desktopActions": "Session links are available. Restart DSH and check the Windows activator to restore buttons.",
    "settings.selectSession": "Open a conversation to test its notification.",
    "settings.nativeAccepted": "Windows accepted the notification.",
    "settings.nativeSound": "The notification sound was played.",
    "settings.nativeMuted": "Windows notification settings suppressed this reminder.",
    "settings.nativeSuppressed": "Your preferences suppressed this reminder.",
    "settings.desktopTest": "Test desktop completion reminder",
    "settings.desktopTesting": "Waiting for desktop confirmation\u2026",
    "settings.desktopFailed": "Delivery failed. Check the DSH host diagnostics.",
    "settings.nav": "Interactive notifications",
    "settings.title": "Interactive notifications",
    "settings.description": "By default, notify when you are away from the conversation. Configure popups and sound independently.",
    "settings.master": "Enable notifications",
    "settings.sound": "Sound",
    "settings.soundHint": "Choose the default sound and volume. Each event can override the sound.",
    "settings.soundEnabled": "Play a sound",
    "settings.preset": "Sound preset",
    "settings.volume": "Volume",
    "settings.preview": "Preview",
    "settings.previewPlayed": "Played",
    "settings.previewFallback": "Played (fallback audio)",
    "settings.previewSilent": "The selected sound is silent",
    "settings.previewBlocked": "The browser blocked audio; try again or check the system volume",
    "settings.previewUnsupported": "Audio playback is unavailable",
    "settings.demoWindowsTitle": "DSH demo reminder",
    "settings.demoWindowsCompletion": "Demo: a session has finished.",
    "settings.reset": "Reset preferences",
    "settings.resetHint": "Restore the defaults. This does not remove the plugin.",
    "settings.resetDone": "Preferences restored.",
    "settings.storageUnavailable": "Browser storage is unavailable; changes last for this page only.",
    "settings.storageReadError": "Stored preferences could not be read; defaults are in use.",
    "settings.storageWriteError": "Preferences could not be saved; changes last for this page only.",
    "notify.approval.title": "Approval needed",
    "notify.question.title": "Question waiting",
    "notify.plan.title": "Plan review waiting",
    "notify.completion.title": "Turn finished",
    "notify.completion.body": "This turn has ended.",
    "sound.chime": "Chime",
    "sound.pulse": "Pulse",
    "sound.complete": "Complete",
    "sound.soft": "Soft ping",
    "sound.alert": "Alert",
    "sound.none": "Silent"
  },
  zh: {
    "settings.popupShort": "\u901A\u77E5",
    "settings.soundShort": "\u58F0\u97F3",
    "settings.event": "\u4E8B\u4EF6",
    "settings.channels": "\u6309\u4E8B\u4EF6\u8BBE\u7F6E\u63D0\u9192",
    "settings.popupEnabled": "\u663E\u793A Windows \u901A\u77E5",
    "settings.inheritSound": "\u8DDF\u968F\u9ED8\u8BA4\u97F3\u6548",
    "settings.scenario.approval": "\u6743\u9650\u7533\u8BF7",
    "settings.scenario.question": "\u63D0\u95EE",
    "settings.scenario.planReview": "\u8BA1\u5212\u5BA1\u6838",
    "settings.scenario.completion": "\u672C\u8F6E\u7ED3\u675F",
    "settings.completionTiming": "\u5B8C\u6210\u901A\u77E5\u65F6\u673A",
    "settings.timing.always": "\u59CB\u7EC8",
    "settings.timing.session-away": "\u79BB\u5F00\u5F53\u524D\u4F1A\u8BDD\u65F6",
    "settings.timing.window-away": "\u79BB\u5F00\u6574\u4E2A DSH \u7A97\u53E3\u65F6",
    "settings.timing.never": "\u4ECE\u4E0D",
    "settings.preferences.connecting": "\u6B63\u5728\u540C\u6B65 profile \u8BBE\u7F6E\u2026",
    "settings.preferences.synced": "\u8BBE\u7F6E\u5DF2\u4FDD\u5B58\u5230 DSH profile\u3002",
    "settings.preferences.offline": "\u5C1A\u672A\u8FDE\u63A5 profile \u8BBE\u7F6E\uFF0C\u672C\u5730\u4FEE\u6539\u7B49\u5F85\u540C\u6B65\uFF1B\u8BF7\u52A0\u8F7D\u65B0\u7248\u5BBF\u4E3B\u6216\u68C0\u67E5\u8FDE\u63A5\u3002",
    "settings.desktop": "\u684C\u9762\u63D0\u9192",
    "settings.desktopLoading": "\u6B63\u5728\u68C0\u67E5 Windows \u901A\u77E5\u2026",
    "settings.desktopHostUnavailable": "\u65E0\u6CD5\u8BFB\u53D6\u684C\u9762\u72B6\u6001\u3002\u8BF7\u91CD\u542F DSH \u5BBF\u4E3B\u52A0\u8F7D\u65B0\u7248\u63D2\u4EF6\uFF0C\u518D\u5237\u65B0\u9875\u9762\u3002",
    "settings.desktopDisabled": "\u5BBF\u4E3B\u73AF\u5883\u53D8\u91CF\u5DF2\u5173\u95ED Windows \u63D0\u9192\u3002",
    "settings.desktopMissing": "\u65E0\u6CD5\u8FDE\u63A5 Windows PowerShell\uFF0C\u8BF7\u68C0\u67E5 Windows \u6216 WSL \u4E92\u64CD\u4F5C\u3002",
    "settings.desktopNative": "Windows \u901A\u77E5\u4E2D\u5FC3",
    "settings.desktopOrigin": "\u8BF7\u8BBE\u7F6E Windows \u53EF\u8FBE\u7684 DSH_NOTIFY_WINDOWS_ORIGIN \u5E76\u91CD\u542F DSH\u3002",
    "settings.desktopActions": "\u901A\u77E5\u53EF\u56DE\u4F1A\u8BDD\u3002\u8BF7\u91CD\u542F DSH \u5E76\u68C0\u67E5 Windows \u6FC0\u6D3B\u7A0B\u5E8F\uFF0C\u4EE5\u6062\u590D\u4F5C\u7B54\u6309\u94AE\u3002",
    "settings.selectSession": "\u5148\u6253\u5F00\u4F1A\u8BDD\uFF0C\u518D\u6D4B\u8BD5\u8BE5\u4F1A\u8BDD\u7684\u901A\u77E5\u3002",
    "settings.nativeAccepted": "Windows \u5DF2\u63A5\u53D7\u901A\u77E5\u3002",
    "settings.nativeSound": "\u5DF2\u64AD\u653E\u901A\u77E5\u97F3\u3002",
    "settings.nativeMuted": "Windows \u901A\u77E5\u8BBE\u7F6E\u5DF2\u6291\u5236\u8FD9\u6B21\u63D0\u9192\u3002",
    "settings.nativeSuppressed": "\u5F53\u524D\u504F\u597D\u5DF2\u6291\u5236\u8FD9\u6B21\u63D0\u9192\u3002",
    "settings.desktopTest": "\u6D4B\u8BD5\u684C\u9762\u63D0\u9192",
    "settings.desktopTesting": "\u6B63\u5728\u7B49\u5F85\u684C\u9762\u786E\u8BA4\u2026",
    "settings.desktopFailed": "\u6295\u9012\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5 DSH \u5BBF\u4E3B\u8BCA\u65AD\u3002",
    "settings.nav": "\u4E92\u52A8\u63D0\u9192",
    "settings.title": "\u4E92\u52A8\u63D0\u9192",
    "settings.description": "\u9ED8\u8BA4\u5728\u672A\u5173\u6CE8\u4F1A\u8BDD\u65F6\u63D0\u9192\uFF0C\u901A\u77E5\u548C\u58F0\u97F3\u53EF\u5206\u522B\u8BBE\u7F6E\u3002",
    "settings.master": "\u542F\u7528\u63D0\u9192",
    "settings.sound": "\u97F3\u6548",
    "settings.soundHint": "\u8BBE\u7F6E\u9ED8\u8BA4\u97F3\u6548\u4E0E\u97F3\u91CF\uFF0C\u5404\u573A\u666F\u53EF\u4EE5\u5355\u72EC\u9009\u62E9\u97F3\u6548\u3002",
    "settings.soundEnabled": "\u64AD\u653E\u63D0\u793A\u97F3",
    "settings.preset": "\u97F3\u6548",
    "settings.volume": "\u97F3\u91CF",
    "settings.preview": "\u8BD5\u542C",
    "settings.previewPlayed": "\u5DF2\u64AD\u653E",
    "settings.previewFallback": "\u5DF2\u901A\u8FC7\u5907\u7528\u97F3\u9891\u64AD\u653E",
    "settings.previewSilent": "\u5F53\u524D\u97F3\u6548\u4E3A\u9759\u97F3",
    "settings.previewBlocked": "\u6D4F\u89C8\u5668\u963B\u6B62\u4E86\u97F3\u9891\uFF0C\u8BF7\u518D\u70B9\u4E00\u6B21\u6216\u68C0\u67E5\u7CFB\u7EDF\u97F3\u91CF",
    "settings.previewUnsupported": "\u5F53\u524D\u73AF\u5883\u4E0D\u652F\u6301\u97F3\u9891\u64AD\u653E",
    "settings.demoWindowsTitle": "DSH \u6F14\u793A\u63D0\u9192",
    "settings.demoWindowsCompletion": "\u6F14\u793A\uFF1A\u4E00\u4E2A\u4F1A\u8BDD\u5DF2\u5B8C\u6210\u3002",
    "settings.reset": "\u6062\u590D\u9ED8\u8BA4\u8BBE\u7F6E",
    "settings.resetHint": "\u6062\u590D\u9ED8\u8BA4\u503C\uFF0C\u4E0D\u4F1A\u5378\u8F7D\u63D2\u4EF6\u3002",
    "settings.resetDone": "\u5DF2\u6062\u590D\u9ED8\u8BA4\u8BBE\u7F6E\u3002",
    "settings.storageUnavailable": "\u6D4F\u89C8\u5668\u5B58\u50A8\u4E0D\u53EF\u7528\uFF1B\u672C\u6B21\u4FEE\u6539\u53EA\u5728\u5F53\u524D\u9875\u9762\u6709\u6548\u3002",
    "settings.storageReadError": "\u8BFB\u53D6\u5DF2\u4FDD\u5B58\u7684\u8BBE\u7F6E\u5931\u8D25\uFF0C\u6B63\u5728\u4F7F\u7528\u9ED8\u8BA4\u503C\u3002",
    "settings.storageWriteError": "\u8BBE\u7F6E\u4FDD\u5B58\u5931\u8D25\uFF1B\u672C\u6B21\u4FEE\u6539\u53EA\u5728\u5F53\u524D\u9875\u9762\u6709\u6548\u3002",
    "notify.approval.title": "\u9700\u8981\u4F60\u7684\u6279\u51C6",
    "notify.question.title": "\u6709\u95EE\u9898\u7B49\u4F60\u56DE\u7B54",
    "notify.plan.title": "\u6709\u8BA1\u5212\u7B49\u4F60\u5BA1\u6838",
    "notify.completion.title": "\u672C\u8F6E\u5DF2\u7ED3\u675F",
    "notify.completion.body": "\u8FD9\u4E00\u8F6E\u5DF2\u7ECF\u7ED3\u675F\u3002",
    "sound.chime": "\u6E05\u8106\u94C3\u97F3",
    "sound.pulse": "\u77ED\u4FC3\u8109\u51B2",
    "sound.complete": "\u5B8C\u6210\u4E0A\u884C\u97F3",
    "sound.soft": "\u8F7B\u67D4\u63D0\u793A",
    "sound.alert": "\u8B66\u793A\u97F3",
    "sound.none": "\u9759\u97F3"
  }
};
function localeIdOf(value) {
  return typeof value === "string" && value.toLowerCase().startsWith("zh") ? "zh" : "en";
}
function translate(localeId, key, vars) {
  const id = localeIdOf(localeId);
  const dict = dictionaries[id];
  let text = dict[key] ?? dictionaries.en[key] ?? key;
  if (vars !== void 0 && vars !== null) {
    text = text.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name) => {
      const value = vars[name];
      return value === void 0 || value === null ? match : String(value);
    });
  }
  return text;
}

// src/state/settings.js
var SETTINGS_KEY = "dsh.notify-interactive.settings.v2";
var SOUND_PRESET_IDS = Object.freeze(["chime", "pulse", "complete", "soft", "alert", "none"]);
var SCENARIO_KEYS = Object.freeze(["approval", "question", "planReview", "completion"]);
var COMPLETION_MODES = Object.freeze(["always", "session-away", "window-away", "never"]);
function visualAllowed(kind, mode, attended, windowFocused) {
  if (kind === "completion") {
    if (mode === "always") return true;
    if (mode === "never") return false;
    if (mode === "window-away") return !windowFocused;
  }
  return !attended;
}
var DEFAULT_PRESET = "chime";
function createDefaultSettings() {
  return {
    version: 3,
    enabled: true,
    popup: { enabled: true, completionMode: "session-away" },
    sound: {
      enabled: true,
      preset: DEFAULT_PRESET,
      volume: 0.7
    },
    // Each event controls its own channels and optional sound override.
    scenarios: {
      approval: scenarioDefaults(),
      question: scenarioDefaults(),
      planReview: scenarioDefaults(),
      completion: scenarioDefaults()
    }
  };
}
function scenarioDefaults() {
  return { sound: true, notify: true, preset: "inherit" };
}
function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function bool(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}
function numberIn(value, fallback, min, max) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}
function presetOf(value) {
  return SOUND_PRESET_IDS.includes(value) ? value : DEFAULT_PRESET;
}
function scenarioOf(raw) {
  const value = isObject(raw) ? raw : {};
  return {
    sound: bool(value.sound, true),
    notify: bool(value.notify, true),
    preset: value.preset === void 0 || value.preset === "inherit" ? "inherit" : presetOf(value.preset)
  };
}
function normalizeSettings(raw) {
  const value = isObject(raw) ? raw : {};
  const sound = isObject(value.sound) ? value.sound : {};
  const scenarios = isObject(value.scenarios) ? value.scenarios : {};
  return {
    version: 3,
    enabled: bool(value.enabled, true),
    popup: {
      enabled: bool(value.popup?.enabled, true),
      completionMode: COMPLETION_MODES.includes(value.popup?.completionMode) ? value.popup.completionMode : "session-away"
    },
    sound: {
      enabled: bool(sound.enabled, true),
      preset: presetOf(sound.preset),
      volume: numberIn(sound.volume, 0.7, 0, 1)
    },
    scenarios: {
      approval: scenarioOf(scenarios.approval),
      question: scenarioOf(scenarios.question),
      planReview: scenarioOf(scenarios.planReview),
      completion: scenarioOf(scenarios.completion)
    }
  };
}
function mergeSettings(current, patch) {
  const base = normalizeSettings(current);
  const next = isObject(patch) ? patch : {};
  const scenarios = { ...base.scenarios };
  if (isObject(next.scenarios)) {
    for (const key of SCENARIO_KEYS) {
      if (isObject(next.scenarios[key])) {
        scenarios[key] = { ...base.scenarios[key], ...next.scenarios[key] };
      }
    }
  }
  return normalizeSettings({
    ...base,
    ...next,
    popup: { ...base.popup, ...isObject(next.popup) ? next.popup : {} },
    sound: { ...base.sound, ...isObject(next.sound) ? next.sound : {} },
    scenarios
  });
}
function createSettingsStore(storage) {
  const target = storage ?? globalThis.localStorage;
  const listeners = /* @__PURE__ */ new Set();
  let storageError = null;
  let current;
  let hasSavedSettings = false;
  try {
    const text = target?.getItem(SETTINGS_KEY);
    const saved = text == null ? null : JSON.parse(text);
    hasSavedSettings = isObject(saved);
    current = normalizeSettings(saved);
  } catch {
    current = createDefaultSettings();
    storageError = "read";
  }
  const emit = () => {
    for (const listener of listeners) {
      try {
        listener();
      } catch {
      }
    }
  };
  const persist = () => {
    try {
      target?.setItem(SETTINGS_KEY, JSON.stringify(current));
      storageError = null;
    } catch {
      storageError = "write";
    }
  };
  return {
    hasSavedSettings,
    getSnapshot: () => current,
    getStatus: () => ({ storageAvailable: Boolean(target), storageError }),
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    update(patch) {
      current = mergeSettings(current, patch);
      persist();
      emit();
      return current;
    },
    replace(next) {
      current = normalizeSettings(next);
      persist();
      emit();
      return current;
    },
    reset() {
      current = createDefaultSettings();
      persist();
      emit();
      return current;
    }
  };
}

// src/audio/wav.js
var SAMPLE_RATE = 22050;
function writeAscii(view, offset, text) {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, text.charCodeAt(index));
  }
}
function bytesToBase64(bytes) {
  if (typeof globalThis.btoa === "function") {
    let binary = "";
    const chunk = 32768;
    for (let offset = 0; offset < bytes.length; offset += chunk) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + chunk));
    }
    return globalThis.btoa(binary);
  }
  if (typeof globalThis.Buffer !== "undefined") {
    return globalThis.Buffer.from(bytes).toString("base64");
  }
  return "";
}
function renderPresetToDataUrl(preset, volume = 1) {
  const notes = Array.isArray(preset?.notes) ? preset.notes : [];
  if (notes.length === 0) return "";
  const duration = Math.max(...notes.map((note) => note.start + note.duration), 0) + 0.06;
  const length = Math.max(1, Math.ceil(duration * SAMPLE_RATE));
  const samples = new Float32Array(length);
  for (const note of notes) {
    const start = Math.round(note.start * SAMPLE_RATE);
    const end = Math.min(length, Math.round((note.start + note.duration) * SAMPLE_RATE));
    for (let index = start; index < end; index += 1) {
      const local = (index - start) / SAMPLE_RATE;
      const attack = Math.min(1, local / 8e-3);
      const decay = Math.exp(-5 * local / note.duration);
      samples[index] += Math.sin(2 * Math.PI * note.freq * local) * note.gain * attack * decay;
    }
  }
  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  const normalize = peak > 0 ? 0.92 * Math.min(1, Math.max(0, volume)) / peak : 0;
  const buffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(buffer);
  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + length * 2, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, length * 2, true);
  for (let index = 0; index < length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index] * normalize));
    view.setInt16(44 + index * 2, sample < 0 ? sample * 32768 : sample * 32767, true);
  }
  const base64 = bytesToBase64(new Uint8Array(buffer));
  return base64 === "" ? "" : `data:audio/wav;base64,${base64}`;
}

// src/audio/sounds.js
var SOUND_PRESETS = Object.freeze([
  {
    id: "chime",
    notes: [
      { freq: 659.25, start: 0, duration: 0.18, gain: 0.35, type: "sine" },
      { freq: 880, start: 0.12, duration: 0.36, gain: 0.3, type: "sine" }
    ]
  },
  {
    id: "pulse",
    notes: [
      { freq: 520, start: 0, duration: 0.08, gain: 0.28, type: "triangle" },
      { freq: 660, start: 0.1, duration: 0.08, gain: 0.26, type: "triangle" }
    ]
  },
  {
    id: "complete",
    notes: [
      { freq: 523.25, start: 0, duration: 0.14, gain: 0.28, type: "sine" },
      { freq: 659.25, start: 0.1, duration: 0.14, gain: 0.28, type: "sine" },
      { freq: 783.99, start: 0.2, duration: 0.3, gain: 0.3, type: "sine" }
    ]
  },
  {
    id: "soft",
    notes: [
      { freq: 440, start: 0, duration: 0.55, gain: 0.18, type: "sine" }
    ]
  },
  {
    id: "alert",
    notes: [
      { freq: 880, start: 0, duration: 0.1, gain: 0.3, type: "square" },
      { freq: 880, start: 0.2, duration: 0.1, gain: 0.3, type: "square" }
    ]
  },
  { id: "none", notes: [] }
]);
var THROTTLE_MS = 300;
var wavCache = /* @__PURE__ */ new Map();
function clampVolume(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0.7;
  return Math.min(1, Math.max(0, value));
}
function getPreset(id) {
  return SOUND_PRESETS.find((preset) => preset.id === id) ?? SOUND_PRESETS[0];
}
function createSoundPlayer(options = {}) {
  const audioContextFactory = options.audioContextFactory;
  const now = options.now ?? (() => Date.now());
  let audio = null;
  let lastPlayedAt = 0;
  const activeElements = /* @__PURE__ */ new Set();
  function ensureContext() {
    if (audio !== null) {
      if (audio.state === "suspended") {
        try {
          audio.resume?.();
        } catch {
        }
      }
      return audio;
    }
    const Ctor = audioContextFactory ?? globalThis.AudioContext ?? globalThis.webkitAudioContext;
    if (typeof Ctor !== "function") return null;
    try {
      audio = Ctor();
    } catch {
      audio = null;
    }
    return audio;
  }
  function schedule(context, preset, level) {
    const startAt = context.currentTime + 0.01;
    for (const note of preset.notes) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = note.type;
      oscillator.frequency.setValueAtTime(note.freq, startAt + note.start);
      const peak = Math.max(1e-4, level * note.gain);
      gain.gain.setValueAtTime(1e-4, startAt + note.start);
      gain.gain.exponentialRampToValueAtTime(peak, startAt + note.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(1e-4, startAt + note.start + note.duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startAt + note.start);
      oscillator.stop(startAt + note.start + note.duration + 0.03);
    }
  }
  function startAudioElement(preset, volume) {
    if (typeof globalThis.Audio !== "function") return null;
    let url = wavCache.get(preset.id);
    if (url === void 0) {
      url = renderPresetToDataUrl(preset);
      wavCache.set(preset.id, url);
    }
    if (url === "") return null;
    try {
      const element = new globalThis.Audio(url);
      element.volume = clampVolume(volume);
      const cleanup = () => activeElements.delete(element);
      element.addEventListener?.("ended", cleanup, { once: true });
      element.addEventListener?.("error", cleanup, { once: true });
      activeElements.add(element);
      const started = element.play();
      if (started !== void 0 && typeof started.then === "function") {
        return started.then(() => true).catch(() => {
          cleanup();
          return false;
        });
      }
      return Promise.resolve(true);
    } catch {
      return Promise.resolve(false);
    }
  }
  async function playViaAudioElement(preset, volume) {
    const started = startAudioElement(preset, volume);
    return started === null ? false : started;
  }
  function play(presetId, volume) {
    const preset = getPreset(presetId);
    if (preset.notes.length === 0) return false;
    const timestamp = now();
    if (timestamp - lastPlayedAt < THROTTLE_MS) return false;
    lastPlayedAt = timestamp;
    const level = clampVolume(volume);
    const context = ensureContext();
    if (context !== null && context !== void 0 && context.state === "running") {
      schedule(context, preset, level);
      return true;
    }
    const elementAttempt = startAudioElement(preset, level);
    if (elementAttempt !== null) {
      void elementAttempt;
      return true;
    }
    if (context !== null && context !== void 0) {
      try {
        const resumed = context.resume?.();
        if (resumed !== void 0 && typeof resumed.then === "function") {
          resumed.then(() => {
            if (context.state === "running") schedule(context, preset, level);
          }).catch(() => {
          });
        } else {
          schedule(context, preset, level);
        }
        return true;
      } catch {
      }
    }
    return false;
  }
  async function preview(presetId, volume) {
    const preset = getPreset(presetId);
    if (preset.notes.length === 0) return "silent";
    const level = clampVolume(volume);
    const context = ensureContext();
    if (context !== null && context !== void 0 && context.state === "running") {
      schedule(context, preset, level);
      return "played";
    }
    const elementAttempt = startAudioElement(preset, level);
    if (elementAttempt !== null) {
      const played = await elementAttempt;
      if (played) return "fallback";
    }
    if (context !== null && context !== void 0) {
      try {
        await context.resume?.();
        if (context.state === "running") {
          schedule(context, preset, level);
          return "played";
        }
      } catch {
      }
    }
    if (typeof globalThis.Audio !== "function" && (context === null || context === void 0)) {
      return "unsupported";
    }
    return "blocked";
  }
  return {
    presets: SOUND_PRESETS,
    play,
    preview,
    unlock: ensureContext,
    isReady: () => audio !== null && audio.state === "running"
  };
}

// src/engine/diff.js
function diffSessionStatus(previous, status) {
  const next = /* @__PURE__ */ new Map();
  const events = [];
  for (const [sessionId, sessionStatus] of status) {
    const current = sessionStatus ?? {};
    const pending = current.pendingInteraction;
    const pendingKey = pending?.key ?? null;
    const before = previous.get(sessionId);
    const unread = current.completionUnread === true;
    const running = current.running;
    if (before === void 0) {
      next.set(sessionId, { running, pendingKey, completionUnread: unread });
      continue;
    }
    if (before.pendingKey !== null && before.pendingKey !== pendingKey) {
      events.push({ type: "interaction-cleared", sessionId, interactionKey: before.pendingKey });
    }
    if (pendingKey !== null && pendingKey !== before.pendingKey) {
      events.push({ type: "interaction", sessionId, interaction: pending });
    }
    if (before.running === true && running === false) {
      events.push({ type: "completion", sessionId, source: "running" });
    } else if (before.running !== true && before.completionUnread !== true && unread) {
      events.push({ type: "completion", sessionId, source: "unread" });
    }
    next.set(sessionId, { running, pendingKey, completionUnread: unread });
  }
  for (const sessionId of previous.keys()) {
    if (!next.has(sessionId)) events.push({ type: "session-removed", sessionId });
  }
  return { next, events };
}

// src/engine/suppression.js
function findMainSessionId(sessionList) {
  const ids = sessionList?.ids;
  if (!Array.isArray(ids)) return void 0;
  for (const id of ids) {
    const row = sessionList.byId?.[id];
    if (Number(row?.retainedBy?.mainView ?? 0) > 0) return id;
  }
  return void 0;
}
function sessionTitleOf(sessionList, sessionId) {
  const row = sessionList?.byId?.[sessionId];
  if (row === void 0) return String(sessionId);
  return row.displayTitle ?? row.title ?? String(sessionId);
}
function isSubagentSession(sessionList, sessionId) {
  return sessionList?.byId?.[sessionId]?.origin === "subagent";
}
function isAttended({
  visibility,
  focused,
  mainSessionId,
  sessionId
}) {
  return Boolean(
    focused && visibility === "visible" && mainSessionId !== void 0 && String(mainSessionId) === String(sessionId)
  );
}
function gateChannels({
  settings,
  scenarioKey,
  sessionId,
  mainSessionId,
  visibility,
  focused
}) {
  const scenario = settings?.scenarios?.[scenarioKey] ?? { sound: true, notify: true };
  const attended = isAttended({ visibility, focused, mainSessionId, sessionId });
  const enabled = settings?.enabled !== false && !attended;
  return {
    attended,
    sound: enabled && settings?.sound?.enabled !== false && scenario.sound !== false,
    notify: settings?.enabled !== false && visualAllowed(scenarioKey, settings?.popup?.completionMode, attended, focused && visibility === "visible") && settings?.popup?.enabled !== false && scenario.notify !== false
  };
}

// src/engine/engine.js
var BODY_LIMIT = 200;
function truncate(value, limit = BODY_LIMIT) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, Math.max(0, limit - 1))}\u2026`;
}
function createEngine(options) {
  const {
    settingsStore,
    translate: translate2,
    resolveText,
    getVisibility,
    getFocused,
    onHostDelivery
  } = options;
  let previous = /* @__PURE__ */ new Map();
  const t = translate2;
  function fallbackTitle(kind) {
    if (kind === "approval") return t("notify.approval.title");
    if (kind === "plan-review") return t("notify.plan.title");
    if (kind === "completion") return t("notify.completion.title");
    return t("notify.question.title");
  }
  function interactionBody(interaction, sessionTitle) {
    if (interaction?.kind === "approval") {
      const reason = interaction.displayReason !== void 0 && typeof resolveText === "function" ? resolveText(interaction.displayReason) : interaction.reason;
      return truncate([sessionTitle, interaction.toolName, reason].filter(Boolean).join(" \xB7 "));
    }
    const question = interaction?.questions?.[0]?.question;
    return truncate([sessionTitle, question].filter(Boolean).join(" \xB7 "));
  }
  function ingest(status, sessionList) {
    const { next, events } = diffSessionStatus(previous, status);
    previous = next;
    const settings = settingsStore.getSnapshot();
    const mainSessionId = findMainSessionId(sessionList);
    for (const event of events) {
      if (!["interaction", "completion"].includes(event.type) || isSubagentSession(sessionList, event.sessionId)) continue;
      const { interaction, sessionId } = event;
      const kind = interaction?.kind ?? "completion";
      const gate = gateChannels({
        settings,
        scenarioKey: kind === "plan-review" ? "planReview" : kind,
        sessionId,
        mainSessionId,
        visibility: getVisibility(),
        focused: getFocused()
      });
      if (!gate.notify && !gate.sound) continue;
      const sessionTitle = sessionTitleOf(sessionList, sessionId);
      onHostDelivery({
        kind,
        sessionId,
        sessionTitle,
        callId: interaction?.callId,
        title: fallbackTitle(kind),
        body: interaction ? interactionBody(interaction, sessionTitle) : t("notify.completion.body")
      });
    }
  }
  return { ingest, reset() {
    previous = /* @__PURE__ */ new Map();
  } };
}

// src/ui/styles.js
var SETTINGS_CSS = String.raw`
.dni-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-sizing: border-box;
  padding: 8px 12px;
  border: 1px solid transparent;
  border-radius: 8px;
  font: inherit;
  font-size: 13px;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
}
.dni-btn:disabled { opacity: 0.5; cursor: default; }
.dni-btn-sm { padding: 6px 10px; border-radius: 7px; font-size: 12px; }
.dni-btn-primary {
  background: var(--dsw-alias-button-primary-fill, var(--dsw-alias-brand-primary));
  color: var(--dsw-alias-label-primary-foreground, var(--dsw-alias-label-primary));
}
.dni-btn-primary:hover:not(:disabled) {
  background: var(--dsw-alias-button-primary-hover, var(--dsw-alias-brand-primary));
}
.dni-btn-outline {
  background: transparent;
  border-color: var(--dsw-alias-border-l2, var(--dsw-alias-border-l1));
  color: var(--dsw-alias-label-primary);
}
.dni-btn-outline:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-2)); }
.dni-btn-ghost { background: transparent; color: var(--dsw-alias-label-secondary); }
.dni-btn-ghost:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-2)); color: var(--dsw-alias-label-primary); }
.dni-btn-danger {
  background: transparent;
  border-color: var(--dsw-alias-state-error-primary);
  color: var(--dsw-alias-state-error-primary);
}
.dni-btn-danger:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover-danger, transparent); }
.dni-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 999px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-secondary);
  font-size: 11px;
  line-height: 16px;
  white-space: nowrap;
}
.dni-badge-success {
  border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 35%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 12%, transparent);
  color: var(--dsw-alias-state-success-primary);
}
.dni-badge-warn {
  border-color: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 35%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 12%, transparent);
  color: var(--dsw-alias-state-warn-primary);
}
.dni-badge-danger {
  border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 35%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 12%, transparent);
  color: var(--dsw-alias-state-error-primary);
}
.dni-warning {
  padding: 10px 12px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-state-warn-primary) 35%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 12%, transparent);
  color: var(--dsw-alias-state-warn-primary);
  font-size: 12px;
  line-height: 18px;
}
.dni-hint { color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; }
.dni-settings { display: flex; flex-direction: column; gap: 16px; max-width: 760px; padding: 4px 0 40px; color: var(--dsw-alias-label-primary); }
.dni-settings-head { display: flex; align-items: flex-start; gap: 12px; }
.dni-settings-headtext { min-width: 0; }
.dni-settings-title { margin: 0; font-size: 20px; font-weight: 600; line-height: 28px; }
.dni-settings-description { margin: 4px 0 0; max-width: 620px; color: var(--dsw-alias-label-secondary); font-size: 13px; line-height: 20px; }
.dni-statusbar { display: flex; flex-wrap: wrap; gap: 8px; }
.dni-section { overflow: hidden; border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); }
.dni-section-title { margin: 0; padding: 12px 16px 0; color: var(--dsw-alias-label-secondary); font-size: 12px; font-weight: 600; line-height: 18px; }
.dni-section-body { display: flex; flex-direction: column; }
.dni-scenarios-master .dni-field { flex-direction: row; align-items: center; }
.dni-scenarios-master .dni-field-control { width: auto; }
.dni-scenarios-wrap { padding: 0 16px 12px; overflow-x: auto; }
.dni-scenarios { width: 100%; border-collapse: collapse; font-size: 13px; }
.dni-scenarios th, .dni-scenarios td { padding: 10px 6px; text-align: left; border-top: 1px solid var(--dsw-alias-border-l1); }
.dni-scenarios thead th { color: var(--dsw-alias-label-secondary); font-size: 12px; font-weight: 500; }
.dni-scenarios tbody th { font-weight: 500; white-space: nowrap; }
.dni-scenarios .dni-select { min-width: 110px; max-width: 100%; }
.dni-field { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 16px; border-top: 1px solid var(--dsw-alias-border-l1); }
.dni-section-title + .dni-section-body .dni-field:first-child { border-top: none; }
.dni-field-text { min-width: 0; }
.dni-field-label { font-size: 13px; font-weight: 500; line-height: 20px; }
.dni-field-hint { margin-top: 2px; color: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary)); font-size: 12px; line-height: 18px; }
.dni-field-control { display: flex; align-items: center; gap: 8px; flex: none; }
.dni-inline { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dni-switch { position: relative; width: 40px; height: 22px; padding: 0; border: 1px solid var(--dsw-alias-border-l2, var(--dsw-alias-border-l1)); border-radius: 999px; background: var(--dsw-alias-bg-layer-2); cursor: pointer; flex: none; }
.dni-switch.is-on { border-color: transparent; background: var(--dsw-alias-brand-primary); }
.dni-switch-knob { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: var(--dsw-alias-label-secondary); transition: transform 140ms ease; }
.dni-switch.is-on .dni-switch-knob { transform: translateX(18px); background: var(--dsw-alias-label-primary-foreground, var(--dsw-alias-bg-base)); }
.dni-select { padding: 6px 8px; border: 1px solid var(--dsw-alias-border-l2, var(--dsw-alias-border-l1)); border-radius: 8px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; }
.dni-slider { width: 140px; accent-color: var(--dsw-alias-brand-primary); }
.dni-test-grid { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px 16px 0; }
.dni-section-body > .dni-hint { padding: 8px 16px 12px; }
.dni-settings .dni-section-body > .dni-inline { padding: 12px 16px; }
.dni-settings .dni-section-body > .dni-inline + .dni-hint { padding-top: 0; }
.dni-settings .dni-section-body > .dni-field + .dni-hint { padding: 0 16px 12px; }
.dni-btn:focus-visible,
.dni-switch:focus-visible,
.dni-select:focus-visible,
.dni-slider:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 2px;
}
@media (max-width: 640px) {
  .dni-field { flex-direction: column; align-items: flex-start; }
  .dni-field-control { width: 100%; justify-content: flex-start; }
  .dni-slider { width: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .dni-btn, .dni-switch, .dni-switch-knob { transition: none; }
}
`;

// src/ui/Settings.jsx
var import_react4 = require("react");

// src/ui/useStore.js
var import_react = require("react");
function useStore(store) {
  return (0, import_react.useSyncExternalStore)(store.subscribe, store.getSnapshot, store.getSnapshot);
}

// src/ui/locale.js
var import_react2 = require("react");
function readLocale(ctx) {
  try {
    return ctx?.locale?.getLocale?.() ?? { id: "en" };
  } catch {
    return { id: "en" };
  }
}
function useLocale(ctx) {
  const [snapshot, setSnapshot] = (0, import_react2.useState)(() => readLocale(ctx));
  (0, import_react2.useEffect)(() => {
    if (typeof ctx?.locale?.subscribe !== "function") return void 0;
    return ctx.locale.subscribe(() => setSnapshot(readLocale(ctx)));
  }, [ctx]);
  const id = localeIdOf(snapshot?.active ?? snapshot?.id);
  return {
    id,
    t: (key, vars) => translate(id, key, vars)
  };
}

// src/ui/controls.jsx
var import_react3 = require("react");
function Button({
  variant = "outline",
  size = "md",
  type = "button",
  className = "",
  disabled = false,
  onClick,
  title,
  children,
  ...rest
}) {
  return (0, import_react3.createElement)("button", {
    ...rest,
    type,
    className: `dni-btn dni-btn-${variant} dni-btn-${size}${className === "" ? "" : ` ${className}`}`,
    disabled,
    onClick,
    title
  }, children);
}
function Switch({ checked, onChange, label, disabled = false }) {
  return (0, import_react3.createElement)("button", {
    type: "button",
    role: "switch",
    "aria-checked": Boolean(checked),
    "aria-label": label,
    className: `dni-switch${checked ? " is-on" : ""}`,
    disabled,
    onClick: () => onChange(!checked)
  }, (0, import_react3.createElement)("span", { className: "dni-switch-knob", "aria-hidden": true }));
}
function Field({ label, hint, children }) {
  return (0, import_react3.createElement)(
    "div",
    { className: "dni-field" },
    (0, import_react3.createElement)(
      "div",
      { className: "dni-field-text" },
      (0, import_react3.createElement)("div", { className: "dni-field-label" }, label),
      hint !== void 0 && hint !== null ? (0, import_react3.createElement)("div", { className: "dni-field-hint" }, hint) : null
    ),
    (0, import_react3.createElement)("div", { className: "dni-field-control" }, children)
  );
}
function Section({ title, children }) {
  return (0, import_react3.createElement)(
    "section",
    { className: "dni-section" },
    title !== void 0 ? (0, import_react3.createElement)("h3", { className: "dni-section-title" }, title) : null,
    (0, import_react3.createElement)("div", { className: "dni-section-body" }, children)
  );
}
function Select({ value, onChange, options, label }) {
  return (0, import_react3.createElement)("select", {
    className: "dni-select",
    value,
    "aria-label": label,
    onChange: (event) => onChange(event.target.value)
  }, options.map((option) => (0, import_react3.createElement)("option", { key: option.value, value: option.value }, option.label)));
}
function Slider({ value, min = 0, max = 1, step = 0.05, onChange, label }) {
  return (0, import_react3.createElement)("input", {
    type: "range",
    className: "dni-slider",
    value,
    min,
    max,
    step,
    "aria-label": label,
    onChange: (event) => onChange(Number(event.target.value))
  });
}
function Badge({ tone = "neutral", children }) {
  return (0, import_react3.createElement)("span", { className: `dni-badge dni-badge-${tone}` }, children);
}

// src/ui/Settings.jsx
function Settings() {
  const settings = useStore(runtime.settingsStore);
  const preferencesStatus = useStore(runtime.preferencesSync);
  const { t } = useLocale(runtime.ctx);
  const storeStatus = runtime.settingsStore.getStatus();
  const [previewStatus, setPreviewStatus] = (0, import_react4.useState)(null);
  const [resetDone, setResetDone] = (0, import_react4.useState)(false);
  const [desktop, setDesktop] = (0, import_react4.useState)(null);
  const [desktopTest, setDesktopTest] = (0, import_react4.useState)(null);
  (0, import_react4.useEffect)(() => {
    let active = true;
    runtime.getDesktopStatus().then((value) => {
      if (active) setDesktop(value);
    });
    return () => {
      active = false;
    };
  }, []);
  const desktopStatusKey = desktop === null ? "desktopLoading" : !desktop.native && desktop.reason !== "host-unavailable" ? "desktopHostUnavailable" : {
    "host-unavailable": "desktopHostUnavailable",
    disabled: "desktopDisabled",
    "missing-windows": "desktopMissing",
    "missing-origin": "desktopOrigin",
    "actions-unavailable": "desktopActions",
    "delivery-failed": "desktopFailed"
  }[desktop.reason] ?? "desktopNative";
  async function testDesktop() {
    setDesktopTest("desktopTesting");
    try {
      const main2 = runtime.getMainSession?.() ?? {};
      const result = await runtime.testNotification({
        kind: "demo-completion",
        sessionId: main2.id,
        title: t("settings.demoWindowsTitle"),
        sessionTitle: main2.title,
        body: t("settings.demoWindowsCompletion")
      });
      const nativeStatus = { accepted: "nativeAccepted", "sound-only": "nativeSound", "system-muted": "nativeMuted", suppressed: "nativeSuppressed" };
      setDesktopTest(nativeStatus[result?.delivery] ?? "desktopFailed");
      setDesktop(await runtime.getDesktopStatus());
    } catch {
      setDesktopTest("desktopFailed");
    }
  }
  (0, import_react4.useEffect)(() => {
    setPreviewStatus(null);
  }, [settings.sound.enabled, settings.sound.preset]);
  const main = runtime.getMainSession?.() ?? { id: void 0, title: void 0 };
  const mainSessionId = main.id;
  const update = (patch) => runtime.settingsStore.update(patch);
  const soundOptions = SOUND_PRESET_IDS.map((id) => ({ value: id, label: t(`sound.${id}`) }));
  const previewLabel = previewStatus === null ? null : t(`settings.preview${previewStatus === "played" ? "Played" : previewStatus === "fallback" ? "Fallback" : previewStatus === "silent" ? "Silent" : previewStatus === "unsupported" ? "Unsupported" : "Blocked"}`);
  async function previewSound() {
    try {
      const result = await runtime.previewSound(settings.sound.preset, settings.sound.volume);
      setPreviewStatus(result);
    } catch {
      setPreviewStatus("blocked");
    }
  }
  function reset() {
    runtime.resetSettings();
    setResetDone(true);
  }
  const warnings = [];
  if (storeStatus.storageError === "read") warnings.push(t("settings.storageReadError"));
  if (storeStatus.storageError === "write") warnings.push(t("settings.storageWriteError"));
  if (storeStatus.storageAvailable === false) warnings.push(t("settings.storageUnavailable"));
  return (0, import_react4.createElement)(
    "div",
    { className: "dni-settings" },
    (0, import_react4.createElement)(
      "header",
      { className: "dni-settings-head" },
      (0, import_react4.createElement)(
        "div",
        { className: "dni-settings-headtext" },
        (0, import_react4.createElement)("h2", { className: "dni-settings-title" }, t("settings.title")),
        (0, import_react4.createElement)("p", { className: "dni-settings-description" }, t("settings.description"))
      )
    ),
    warnings.map((warning, index) => (0, import_react4.createElement)("div", { key: `warning-${index}`, className: "dni-warning" }, warning)),
    (0, import_react4.createElement)("p", { className: "dni-hint", role: "status" }, t(`settings.preferences.${preferencesStatus}`)),
    (0, import_react4.createElement)(
      Section,
      { title: t("settings.master") },
      (0, import_react4.createElement)(
        Field,
        { label: t("settings.master") },
        (0, import_react4.createElement)(Switch, {
          checked: settings.enabled,
          label: t("settings.master"),
          onChange: (value) => update({ enabled: value })
        })
      )
    ),
    (0, import_react4.createElement)(
      Section,
      { title: t("settings.sound") },
      (0, import_react4.createElement)(
        Field,
        { label: t("settings.soundEnabled"), hint: t("settings.soundHint") },
        (0, import_react4.createElement)(Switch, {
          checked: settings.sound.enabled,
          label: t("settings.soundEnabled"),
          onChange: (value) => update({ sound: { enabled: value } })
        })
      ),
      (0, import_react4.createElement)(
        Field,
        { label: t("settings.preset") },
        (0, import_react4.createElement)(Select, {
          value: settings.sound.preset,
          label: t("settings.preset"),
          options: soundOptions,
          onChange: (value) => update({ sound: { preset: value } })
        })
      ),
      (0, import_react4.createElement)(
        Field,
        { label: t("settings.volume") },
        (0, import_react4.createElement)(
          "div",
          { className: "dni-inline" },
          (0, import_react4.createElement)(Slider, {
            value: settings.sound.volume,
            min: 0,
            max: 1,
            step: 0.05,
            label: t("settings.volume"),
            onChange: (value) => update({ sound: { volume: value } })
          }),
          (0, import_react4.createElement)(Button, { variant: "outline", size: "sm", onClick: previewSound }, t("settings.preview")),
          previewLabel === null ? null : (0, import_react4.createElement)(Badge, {
            tone: previewStatus === "played" || previewStatus === "fallback" ? "success" : previewStatus === "silent" ? "neutral" : "danger"
          }, previewLabel)
        )
      )
    ),
    (0, import_react4.createElement)(
      Section,
      { title: t("settings.channels") },
      (0, import_react4.createElement)("div", { className: "dni-scenarios-master" }, (0, import_react4.createElement)(Field, { label: t("settings.popupEnabled") }, (0, import_react4.createElement)(Switch, {
        checked: settings.popup.enabled,
        label: t("settings.popupEnabled"),
        onChange: (value) => update({ popup: { enabled: value } })
      }))),
      (0, import_react4.createElement)(Field, { label: t("settings.completionTiming") }, (0, import_react4.createElement)(Select, {
        value: settings.popup.completionMode,
        label: t("settings.completionTiming"),
        options: COMPLETION_MODES.map((value) => ({ value, label: t(`settings.timing.${value}`) })),
        onChange: (completionMode) => update({ popup: { completionMode } })
      })),
      (0, import_react4.createElement)("div", { className: "dni-scenarios-wrap" }, (0, import_react4.createElement)(
        "table",
        { className: "dni-scenarios" },
        (0, import_react4.createElement)("thead", null, (0, import_react4.createElement)(
          "tr",
          null,
          (0, import_react4.createElement)("th", { scope: "col" }, t("settings.event")),
          (0, import_react4.createElement)("th", { scope: "col" }, t("settings.popupShort")),
          (0, import_react4.createElement)("th", { scope: "col" }, t("settings.soundShort")),
          (0, import_react4.createElement)("th", { scope: "col" }, t("settings.preset"))
        )),
        (0, import_react4.createElement)("tbody", null, ...SCENARIO_KEYS.map((key) => (0, import_react4.createElement)(
          "tr",
          { key },
          (0, import_react4.createElement)("th", { scope: "row" }, t(`settings.scenario.${key}`)),
          (0, import_react4.createElement)("td", null, (0, import_react4.createElement)(Switch, {
            checked: settings.scenarios[key].notify,
            label: `${t(`settings.scenario.${key}`)} ${t("settings.popupEnabled")}`,
            onChange: (value) => update({ scenarios: { [key]: { notify: value } } })
          })),
          (0, import_react4.createElement)("td", null, (0, import_react4.createElement)(Switch, {
            checked: settings.scenarios[key].sound,
            label: `${t(`settings.scenario.${key}`)} ${t("settings.soundEnabled")}`,
            onChange: (value) => update({ scenarios: { [key]: { sound: value } } })
          })),
          (0, import_react4.createElement)("td", null, (0, import_react4.createElement)(Select, {
            value: settings.scenarios[key].preset,
            label: `${t(`settings.scenario.${key}`)} ${t("settings.preset")}`,
            options: [{ value: "inherit", label: t("settings.inheritSound") }, ...soundOptions],
            onChange: (value) => update({ scenarios: { [key]: { preset: value } } })
          }))
        )))
      ))
    ),
    (0, import_react4.createElement)(
      Section,
      { title: t("settings.desktop") },
      (0, import_react4.createElement)("p", { className: "dni-hint" }, t(`settings.${desktopStatusKey}`)),
      (0, import_react4.createElement)("div", { className: "dni-inline" }, (0, import_react4.createElement)(Button, {
        variant: "outline",
        size: "sm",
        disabled: !mainSessionId || !desktop?.enabled || !desktop?.available || desktopTest === "desktopTesting",
        onClick: testDesktop
      }, t("settings.desktopTest"))),
      !mainSessionId && (0, import_react4.createElement)("p", { className: "dni-hint" }, t("settings.selectSession")),
      desktopTest !== null ? (0, import_react4.createElement)("p", { className: "dni-hint", role: "status" }, t(`settings.${desktopTest}`)) : null
    ),
    (0, import_react4.createElement)(
      Section,
      { title: t("settings.reset") },
      (0, import_react4.createElement)(
        "div",
        { className: "dni-inline" },
        (0, import_react4.createElement)(Button, { variant: "danger", size: "sm", onClick: reset }, t("settings.reset")),
        resetDone ? (0, import_react4.createElement)(Badge, { tone: "success" }, t("settings.resetDone")) : null
      ),
      (0, import_react4.createElement)("div", { className: "dni-hint" }, t("settings.resetHint"))
    )
  );
}

// src/client/preferences.js
function settingsDiff(before, after) {
  const patch = {};
  for (const key of Object.keys(after)) {
    if (after[key] && typeof after[key] === "object" && !Array.isArray(after[key])) {
      const child = settingsDiff(before?.[key] ?? {}, after[key]);
      if (Object.keys(child).length) patch[key] = child;
    } else if (before?.[key] !== after[key]) patch[key] = after[key];
  }
  return patch;
}
function createPreferencesSync(store, options = {}) {
  const fetcher = options.fetch ?? globalThis.fetch.bind(globalThis);
  const endpoint = "/dsh-notify-interactive/settings";
  let previous = store.getSnapshot();
  const initial = previous;
  let revision = 0;
  let applying = false;
  let stopped = false;
  let busy = false;
  let initialized = false;
  let timer;
  let syncStatus = "connecting";
  const listeners = /* @__PURE__ */ new Set();
  const publish = (status) => {
    if (status !== syncStatus) {
      syncStatus = status;
      for (const listener of listeners) listener();
    }
  };
  const queue = [];
  const unsubscribe = store.subscribe(() => {
    const next = store.getSnapshot();
    if (!applying) {
      const patch = settingsDiff(previous, next);
      if (Object.keys(patch).length) {
        queue.push(patch);
        publish("connecting");
      }
    }
    previous = next;
    if (!applying) void synchronize();
  });
  function apply2(remote) {
    revision = remote.revision;
    initialized = remote.initialized;
    applying = true;
    store.replace(remote.settings);
    applying = false;
    previous = store.getSnapshot();
  }
  async function synchronize() {
    if (busy || stopped) return;
    busy = true;
    let reschedule = false;
    try {
      const response = await fetcher(endpoint, { cache: "no-store" });
      if (!response.ok) throw Error("preferences-fetch-failed");
      const remote = await response.json();
      if (stopped) return;
      revision = remote.revision;
      initialized = remote.initialized;
      if (!initialized && store.hasSavedSettings) {
        const migrated = await fetcher(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ revision, initial }) });
        if (!migrated.ok && migrated.status !== 409) throw Error("preferences-migration-failed");
        const result = await migrated.json();
        revision = result.revision;
        initialized = result.initialized;
      }
      let conflicts = 0;
      while (queue.length && !stopped) {
        const patch = queue[0];
        const response2 = await fetcher(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ revision, patch }) });
        const value = await response2.json();
        if (response2.status === 409) {
          revision = value.revision;
          if (++conflicts > 3) throw Error("preferences-conflict");
          continue;
        }
        if (!response2.ok) throw Error("preferences-update-failed");
        queue.shift();
        revision = value.revision;
      }
      if (!stopped && !queue.length) {
        const latest = await fetcher(endpoint, { cache: "no-store" });
        if (latest.ok) {
          const value = await latest.json();
          if (queue.length) reschedule = true;
          else if (!stopped && value.initialized) apply2(value);
        }
      }
      publish(queue.length ? "connecting" : "synced");
      options.onStatus?.("synced");
    } catch {
      publish("offline");
      options.onStatus?.("offline");
    } finally {
      busy = false;
      if (reschedule && !stopped) void synchronize();
    }
  }
  return {
    getSnapshot: () => syncStatus,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    start() {
      void synchronize();
      timer = setInterval(synchronize, options.intervalMs ?? 5e3);
    },
    stop() {
      stopped = true;
      clearInterval(timer);
      unsubscribe();
    },
    synchronize
  };
}

// src/client/presence.js
var DEFAULT_ENDPOINT = "/dsh-notify-interactive/presence";
var DEFAULT_INTERVAL_MS = 5e3;
function createPresenceReporter(options = {}) {
  const getState = options.getState ?? (() => ({}));
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
  const doc = globalThis.document;
  const nav = globalThis.navigator;
  let timer = null;
  let started = false;
  let lastReportAt = 0;
  let lastBody = null;
  function body(active) {
    const state = getState() ?? {};
    return JSON.stringify({
      active,
      clientId: options.clientId,
      sessionId: state.sessionId,
      focused: state.focused === true,
      visible: state.visible === true
    });
  }
  function post(active) {
    try {
      const request = globalThis.fetch?.(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: body(active),
        keepalive: true
      });
      request?.catch?.(() => {
      });
    } catch {
    }
  }
  function beacon(active) {
    try {
      const payload = body(active);
      if (typeof nav?.sendBeacon === "function") {
        nav.sendBeacon(endpoint, new Blob([payload], { type: "application/json" }));
        return;
      }
    } catch {
    }
    post(active);
  }
  function report(force = false) {
    if (!started) return;
    const now = Date.now();
    const nextBody = body(true);
    if (!force && nextBody === lastBody && now - lastReportAt < 1e3) return;
    lastBody = nextBody;
    lastReportAt = now;
    post(true);
  }
  function onFocus() {
    report();
  }
  function onBlur() {
    report();
  }
  function onVisibility() {
    report();
  }
  function onPageHide() {
    beacon(false);
  }
  function start() {
    if (started) return;
    started = true;
    report();
    timer = setInterval(() => report(true), intervalMs);
    doc?.addEventListener("visibilitychange", onVisibility);
    globalThis.addEventListener("focus", onFocus);
    globalThis.addEventListener("blur", onBlur);
    globalThis.addEventListener("pagehide", onPageHide);
  }
  function stop() {
    if (!started) return;
    started = false;
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
    doc?.removeEventListener("visibilitychange", onVisibility);
    globalThis.removeEventListener("focus", onFocus);
    globalThis.removeEventListener("blur", onBlur);
    globalThis.removeEventListener("pagehide", onPageHide);
    beacon(false);
  }
  return { start, stop, report };
}

// src/interaction/schema.js
function presentationOf(pending, resolveText = (value) => value?.en ?? "") {
  if (!pending) return null;
  if (pending.kind === "approval") {
    if (pending.answerable !== true || typeof pending.callId !== "string" || !pending.callId) return null;
    return {
      kind: "approval",
      callId: pending.callId,
      toolName: String(pending.toolName ?? ""),
      reason: String(pending.reason ?? ""),
      description: String(pending.displayReason ? resolveText(pending.displayReason) : pending.reason ?? "")
    };
  }
  const state = pending.snapshot?.();
  if (!["question", "plan-review"].includes(pending.kind) || state?.closed || !["waterfall", "rpc"].includes(state?.channel)) return null;
  const questions = pending.questions;
  if (!Array.isArray(questions) || !questions.length) return null;
  const intentCallId = pending.kind === "plan-review" && questions.length === 1 ? questions[0].intent?.callId : void 0;
  const callId = pending.callId ?? intentCallId ?? "";
  return {
    kind: pending.kind,
    callId,
    channel: state.channel,
    questions: questions.map((q) => ({
      id: q.id,
      question: q.question,
      multiSelect: q.multiSelect === true,
      ...q.header ? { header: q.header } : {},
      ...q.detail ? { detail: q.detail } : {},
      ...q.intent?.kind === "plan-review" ? { intent: { kind: "plan-review", approve: q.intent.approve } } : {},
      options: (q.options ?? []).map((o) => ({ label: o.label, ...o.description ? { description: o.description } : {} }))
    })),
    ...state.countdown ? { countdown: { remainingMs: state.countdown.remainingMs, running: state.countdown.running === true } } : {}
  };
}
function validAnswer(view, answer) {
  if (JSON.stringify(answer)?.length > 48e3) return false;
  if (view.kind === "approval") return answer === "allowed-once" || answer === "rejected";
  if (!answer || !Array.isArray(answer.answers) || answer.answers.length !== view.questions.length) return false;
  return view.questions.every((q, index) => {
    const a = answer.answers[index];
    return a?.id === q.id && Array.isArray(a.selected) && new Set(a.selected).size === a.selected.length && a.selected.every((label) => q.options.some((option) => option.label === label)) && (a.custom === void 0 || typeof a.custom === "string" && a.custom.length <= 8e3) && (q.multiSelect || a.selected.length <= 1 && !(a.selected.length && a.custom?.trim()));
  });
}
function presentationKey(view) {
  if (!view) return "";
  const { countdown, ...stable } = view;
  return JSON.stringify(stable);
}

// src/client/interactions.js
function createInteractionBridge({ clientId, getStatus, resolveText, fetch: fetch2 = globalThis.fetch, intervalMs = 500, makeToken = () => globalThis.crypto.randomUUID() }) {
  const references = /* @__PURE__ */ new Map(), seen = /* @__PURE__ */ new Set();
  let instanceId, timer, running = false, stopped = false, inflight;
  const post = async (path, data) => {
    const response = await fetch2(`/dsh-notify-interactive/${path}`, { method: "POST", headers: { "content-type": "application/json" }, cache: "no-store", body: JSON.stringify({ clientId, ...data }) });
    if (!response.ok) throw new Error("bridge-unavailable");
    return response.json();
  };
  function registrations() {
    const live = /* @__PURE__ */ new Set(), rows = [];
    let bytes = 0;
    for (const [sessionId, status] of getStatus() ?? []) {
      const pending = status.pendingInteraction;
      const view = presentationOf(pending, resolveText);
      if (!view) continue;
      bytes += JSON.stringify(view).length;
      if (rows.length >= 128 || bytes > 13e4) break;
      let ref = references.get(pending);
      if (!ref) {
        ref = { token: makeToken(), pending, sessionId, key: pending.key };
        references.set(pending, ref);
      }
      live.add(pending);
      rows.push({ sessionId: String(sessionId), token: ref.token, view });
    }
    for (const [pending, ref] of references) if (!live.has(pending)) {
      if (ref.focused) pending.releaseFocus?.();
      references.delete(pending);
    }
    return rows;
  }
  function current(command) {
    const ref = [...references.values()].find((value) => value.token === command.token);
    if (!ref || ref.pending.key !== ref.key || String(ref.sessionId) !== command.sessionId || ref.eventId !== command.eventId || instanceId !== command.instanceId || getStatus()?.get(ref.sessionId)?.pendingInteraction !== ref.pending) return null;
    const view = presentationOf(ref.pending, resolveText);
    if (!view || presentationKey(view) !== command.viewKey || command.action === "answer" && !validAnswer(view, command.answer)) return null;
    return ref;
  }
  async function handle(command) {
    if (seen.has(command.id)) return;
    seen.add(command.id);
    if (seen.size > 512) seen.delete(seen.values().next().value);
    let status = "unavailable";
    try {
      if (current(command)) {
        const allowed = await post("interaction-execute", { id: command.id, token: command.token, eventId: command.eventId, instanceId });
        const ref = allowed.allowed ? current(command) : null;
        if (ref && !stopped) {
          const pending = ref.pending;
          if (command.action === "answer") {
            status = "uncertain";
            await pending.answer(command.answer);
            if (pending.kind !== "approval" && pending.snapshot?.().channel === "rpc") {
              try {
                await pending.dismiss?.();
              } catch {
              }
            }
          } else if (command.action === "focus") {
            pending.holdFocus?.();
            ref.focused = true;
            ref.focusedAt = Date.now();
          } else if (command.action === "blur") {
            pending.releaseFocus?.();
            ref.focused = false;
          } else if (command.action === "engage") pending.engage?.();
          else if (command.action === "take-time") pending.takeTime?.();
          status = "success";
        }
      }
    } catch {
    }
    try {
      await post("interaction-result", { id: command.id, status, instanceId });
    } catch {
    }
  }
  async function sync() {
    if (stopped) return;
    if (running) return inflight;
    for (const ref of references.values()) if (ref.focused && Date.now() - ref.focusedAt > 8e3) {
      ref.pending.releaseFocus?.();
      ref.focused = false;
    }
    running = true;
    inflight = (async () => {
      try {
        const response = await post("interactions", { registrations: registrations() });
        if (stopped) return;
        if (instanceId && instanceId !== response.instanceId) {
          for (const ref of references.values()) ref.eventId = void 0;
        }
        instanceId = response.instanceId;
        for (const binding of response.bindings ?? []) {
          const ref = [...references.values()].find((value) => value.token === binding.token);
          if (ref && (!ref.eventId || ref.eventId === binding.eventId)) ref.eventId = binding.eventId;
        }
        for (const command of response.commands ?? []) await handle(command);
      } catch {
      } finally {
        running = false;
      }
    })();
    return inflight;
  }
  return {
    sync,
    start() {
      stopped = false;
      void sync();
      timer = setInterval(() => void sync(), intervalMs);
    },
    reset() {
      for (const ref of references.values()) if (ref.focused) ref.pending.releaseFocus?.();
      references.clear();
      instanceId = void 0;
    },
    stop() {
      stopped = true;
      clearInterval(timer);
      for (const ref of references.values()) if (ref.focused) ref.pending.releaseFocus?.();
      references.clear();
    }
  };
}

// src/client/index.jsx
var inject = ["slots", "locale", "sessions", "uiSession"];
function apply(ctx) {
  if (runtime.ready) return;
  runtime.ctx = ctx;
  const localeId = () => {
    try {
      const snapshot = ctx.locale?.getLocale?.();
      return snapshot?.active ?? snapshot?.id ?? "en";
    } catch {
      return "en";
    }
  };
  const translate2 = (key, vars) => translate(localeId(), key, vars);
  const resolveText = (value) => {
    try {
      return ctx.locale?.resolveText?.(value) ?? (value?.en ?? "");
    } catch {
      return value?.en ?? "";
    }
  };
  let storage;
  try {
    storage = globalThis.localStorage;
  } catch {
    storage = void 0;
  }
  const settingsStore = createSettingsStore(storage);
  const preferencesSync = createPreferencesSync(settingsStore);
  runtime.preferencesSync = preferencesSync;
  ctx.effect(() => {
    preferencesSync.start();
    return () => preferencesSync.stop();
  }, "dsh-notify-interactive: shared preferences");
  const clientId = globalThis.crypto?.randomUUID?.() ?? (globalThis.crypto?.getRandomValues ? Array.from(globalThis.crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("") : `page-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const capability = globalThis.fetch("/dsh-notify-interactive/desktop-status", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).catch(() => null);
  const interactionBridge = createInteractionBridge({
    clientId,
    resolveText,
    getStatus: () => ctx.get("uiSession")?.sessionStatus?.getSnapshot?.(),
    makeToken: () => `${clientId}-${Date.now()}-${Math.random().toString(36).slice(2)}`
  });
  ctx.effect(() => {
    interactionBridge.start();
    return () => interactionBridge.stop();
  }, "dsh-notify-interactive: desktop interaction owner");
  const soundPlayer = createSoundPlayer();
  function getMainSession() {
    try {
      const list = ctx.get("sessions")?.list?.getSnapshot?.();
      const id = findMainSessionId(list);
      return { id, title: id === void 0 ? void 0 : sessionTitleOf(list, id) };
    } catch {
      return { id: void 0, title: void 0 };
    }
  }
  async function postNotification(path, payload) {
    try {
      const response = await fetch(`/dsh-notify-interactive/${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      return await response.json();
    } catch {
      return { delivery: "network-error" };
    }
  }
  const engine = createEngine({
    settingsStore,
    translate: translate2,
    resolveText,
    getVisibility: () => typeof globalThis.document !== "undefined" ? globalThis.document.visibilityState : "visible",
    getFocused: () => {
      try {
        return globalThis.document?.hasFocus?.() ?? false;
      } catch {
        return false;
      }
    },
    onHostDelivery: async (payload) => {
      await interactionBridge.sync();
      await postNotification("deliver", payload);
    }
  });
  runtime.settingsStore = settingsStore;
  runtime.getMainSession = getMainSession;
  runtime.testNotification = (payload) => postNotification("windows-notify", payload);
  runtime.getDesktopStatus = async () => {
    try {
      const response = await globalThis.fetch("/dsh-notify-interactive/desktop-status", { cache: "no-store" });
      if (!response.ok) return { reason: "host-unavailable" };
      return await response.json();
    } catch {
      return { reason: "host-unavailable" };
    }
  };
  runtime.resetSettings = () => settingsStore.reset();
  runtime.previewSound = (preset, volume) => soundPlayer.preview(preset, volume);
  runtime.ready = true;
  runtime.version = "0.3.0";
  ctx.effect(() => {
    const url = new URL(globalThis.location.href);
    const requestedSession = url.searchParams.get("dsh-notify-session");
    if (!requestedSession) return;
    const targetProfile = url.searchParams.get("dsh-notify-profile");
    let verified = targetProfile === null;
    if (!verified) void capability.then((status) => {
      verified = status?.profileId === targetProfile;
      if (!verified) console.warn("[dsh-notify-interactive] notification profile could not be verified");
    });
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      try {
        const workspace = ctx.get("uiWorkspace");
        const list = ctx.get("sessions")?.list?.getSnapshot?.();
        if (verified && workspace && list?.byId?.[requestedSession]) {
          workspace.openSession(requestedSession);
          url.searchParams.delete("dsh-notify-session");
          url.searchParams.delete("dsh-notify-profile");
          globalThis.history.replaceState(null, "", url);
          clearInterval(timer);
        }
      } catch {
      }
      if (attempts >= 40) clearInterval(timer);
    }, 250);
    return () => clearInterval(timer);
  }, "dsh-notify-interactive: return to session");
  try {
    globalThis.__dshNotifyInteractive = runtime;
  } catch {
  }
  const presence = createPresenceReporter({
    clientId,
    intervalMs: 1e3,
    getState: () => {
      const main = getMainSession();
      return {
        sessionId: main?.id,
        focused: (() => {
          try {
            return globalThis.document?.hasFocus?.() ?? false;
          } catch {
            return false;
          }
        })(),
        visible: globalThis.document?.visibilityState === "visible"
      };
    }
  });
  runtime.presence = presence;
  ctx.effect(() => {
    presence.start();
    return () => presence.stop();
  }, "dsh-notify-interactive: presence");
  ctx.effect(() => {
    const style = globalThis.document.createElement("style");
    style.setAttribute("data-plugin", "dsh-notify-interactive");
    style.textContent = SETTINGS_CSS;
    globalThis.document.head.append(style);
    return () => style.remove();
  }, "dsh-notify-interactive: styles");
  ctx.effect(() => {
    const unlock = () => soundPlayer.unlock();
    const options = { capture: true, once: true };
    globalThis.document.addEventListener("pointerdown", unlock, options);
    globalThis.document.addEventListener("keydown", unlock, options);
    return () => {
      globalThis.document.removeEventListener("pointerdown", unlock, true);
      globalThis.document.removeEventListener("keydown", unlock, true);
    };
  }, "dsh-notify-interactive: audio unlock");
  ctx.effect(() => () => {
    runtime.ready = false;
  }, "dsh-notify-interactive: runtime cleanup");
  const uiSession = ctx.get("uiSession");
  const sessionsService = ctx.get("sessions");
  const ingest = () => {
    try {
      const status = uiSession?.sessionStatus?.getSnapshot?.();
      if (status === void 0) return;
      presence.report();
      engine.ingest(status, sessionsService?.list?.getSnapshot?.());
    } catch {
    }
  };
  ctx.effect(() => {
    const disposers = [];
    if (typeof uiSession?.sessionStatus?.subscribe === "function") {
      disposers.push(uiSession.sessionStatus.subscribe(ingest));
    }
    if (typeof sessionsService?.list?.subscribe === "function") {
      disposers.push(sessionsService.list.subscribe(ingest));
    }
    ingest();
    return () => {
      for (const dispose of disposers) {
        try {
          dispose();
        } catch {
        }
      }
    };
  }, "dsh-notify-interactive: session status bridge");
  ctx.on("connection/reset", () => {
    engine.reset();
    interactionBridge.reset();
  });
  ctx.slots.inject("settings.section", () => ctx.slots.register({
    name: "settings.section",
    id: "notify-interactive",
    order: 16,
    label: () => translate2("settings.nav")
  }, (props) => (0, import_react5.createElement)(Settings, props)));
}

    })(module, module.exports, require);
    return module.exports;
  },
});
