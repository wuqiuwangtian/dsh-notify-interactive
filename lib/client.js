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
var import_react15 = require("react");

// src/state/surface.js
function createSurfaceStore(initial = "inpage") {
  let surface = initial;
  const listeners = /* @__PURE__ */ new Set();
  const emit = () => {
    for (const listener of listeners) {
      try {
        listener();
      } catch {
      }
    }
  };
  return {
    getSnapshot: () => surface,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    set(next) {
      if (next !== "popup" && next !== "inpage") return;
      if (surface === next) return;
      surface = next;
      emit();
    },
    isPopup: () => surface === "popup"
  };
}

// src/client/runtime.js
var surfaceStore = createSurfaceStore();
var runtime = {
  surfaceStore,
  setSurface: (value) => surfaceStore.set(value),
  ready: false,
  ctx: void 0,
  settingsStore: void 0,
  notificationStore: void 0,
  popupController: void 0,
  engine: void 0,
  soundPlayer: void 0,
  systemNotifier: void 0,
  translate: (key) => key,
  resolveText: (value) => value?.en ?? "",
  openSession: () => {
  },
  openPopup: async () => {
  },
  closePopup: () => {
  },
  dismiss: () => {
  },
  addDemo: () => {
  },
  getMainSession: () => ({ id: void 0, title: void 0 }),
  resetSettings: () => {
  },
  requestNotificationPermission: async () => "default",
  testSystemNotification: () => {
  },
  previewSound: () => false
};

// src/i18n/dict.js
var dictionaries = {
  en: {
    "settings.nav": "Interactive notifications",
    "settings.title": "Interactive notifications",
    "settings.description": "Get sound, an always-on-top DSH-styled popup, and Windows notifications when a session needs approval, asks a question, or finishes a turn.",
    "settings.master": "Enable notifications",
    "settings.masterHint": "Turn every channel off without losing your preferences.",
    "settings.sound": "Sound",
    "settings.soundHint": "Synthesized locally with Web Audio; no audio files are downloaded.",
    "settings.soundEnabled": "Play a sound",
    "settings.preset": "Sound",
    "settings.volume": "Volume",
    "settings.preview": "Preview",
    "settings.previewSound": "Preview sound",
    "settings.previewPlayed": "Played",
    "settings.previewFallback": "Played (fallback audio)",
    "settings.previewSilent": "The selected sound is silent",
    "settings.previewBlocked": "The browser blocked audio; try again or check the system volume",
    "settings.previewUnsupported": "Audio playback is unavailable",
    "settings.popup": "Interactive popup",
    "settings.popupHint": "An always-on-top window in the DSH theme. Answer approvals and questions directly in it. Browser security requires one click to open it; after closing, the in-page card or Windows notification takes over.",
    "settings.popupEnabled": "Show the interactive popup",
    "settings.popupOpen": "Open popup",
    "settings.popupClose": "Close popup",
    "settings.popupTest": "Test popup",
    "settings.popupBackend": "Current backend",
    "settings.popupBlocked": "The browser blocked the popup. Click the button again, or keep the in-page cards.",
    "settings.popupUnsupported": "Always-on-top popups are not available in this browser. A normal popup window is used instead.",
    "settings.system": "Windows notification",
    "settings.systemHint": "Uses the browser Notification API and appears in the Windows notification center when the DSH page is unfocused or hidden. It is not sent while the page is focused, to avoid duplicating the in-page card.",
    "settings.systemEnabled": "Show a Windows notification",
    "settings.permission": "Permission",
    "settings.permissionGranted": "Granted",
    "settings.permissionDenied": "Denied by the browser",
    "settings.permissionDefault": "Not granted yet",
    "settings.permissionUnsupported": "Not supported by this browser",
    "settings.authorize": "Allow notifications",
    "settings.testNotification": "Test notification",
    "settings.behavior": "Behavior",
    "settings.suppressWhenFocused": "Do not disturb the current session",
    "settings.suppressWhenFocusedHint": "Skip alerts when the page is focused and you are already looking at the session that needs attention.",
    "settings.includeSubagents": "Include subagent sessions",
    "settings.includeSubagentsHint": "Subagent and background child sessions stay quiet by default.",
    "settings.autoDismiss": "Completion card timeout",
    "settings.autoDismissHint": "Seconds before a completion card closes itself. Set 0 to keep it until dismissed.",
    "settings.maxCards": "Maximum visible cards",
    "settings.maxCardsHint": "Approvals and questions stay queued even when this limit is reached.",
    "settings.tests": "Tests",
    "settings.testsHint": "These cards are local demos: they never answer a real request.",
    "settings.testApproval": "Test approval card",
    "settings.testQuestion": "Test question card",
    "settings.testCompletion": "Test completion card",
    "settings.reset": "Reset preferences",
    "settings.resetHint": "Restore the defaults. This does not remove the plugin.",
    "settings.resetDone": "Preferences restored.",
    "settings.active": "Active cards",
    "settings.backend": "Popup backend",
    "settings.audio": "Audio",
    "settings.audioReady": "Ready",
    "settings.audioBlocked": "Click the page to unlock sound",
    "settings.storageUnavailable": "Browser storage is unavailable; changes last for this page only.",
    "settings.storageReadError": "Stored preferences could not be read; defaults are in use.",
    "settings.storageWriteError": "Preferences could not be saved; changes last for this page only.",
    "settings.seconds": "s",
    "popup.title": "Notifications",
    "popup.subtitle": "Approvals, questions, and finished turns",
    "popup.empty": "No reminders right now",
    "popup.emptyHint": "New approvals, questions, and completion notices appear here.",
    "popup.close": "Close",
    "popup.backendPip": "Always on top",
    "popup.backendWindow": "Popup window",
    "popup.backendInpage": "In-page",
    "popup.more": "{count} more",
    "popup.settingsHint": "Configure channels in DSH Settings \u2192 Interactive notifications.",
    "card.approval.title": "Approval required",
    "card.approval.waiting": "Waiting for your approval",
    "card.approval.tool": "Tool",
    "card.approval.allow": "Allow once",
    "card.approval.reject": "Reject",
    "card.approval.open": "Open in DSH",
    "card.approval.invalid": "This request is no longer answerable.",
    "card.question.title": "Question",
    "card.question.submit": "Submit answer",
    "card.question.skip": "Skip this question",
    "card.question.unskip": "Undo skip",
    "card.question.skipped": "Skipped",
    "card.question.other": "Other answer",
    "card.question.otherPlaceholder": "Type a custom answer\u2026",
    "card.question.required": "Choose an option, type an answer, or skip every question.",
    "card.question.sent": "Answer submitted.",
    "card.question.error": "The answer could not be submitted. It may have been answered elsewhere.",
    "card.question.takeTime": "Take time",
    "card.question.countdown": "Continuing in {seconds}s",
    "card.question.paused": "Paused while you answer",
    "card.question.multi": "Select one or more",
    "card.question.open": "Open in DSH",
    "card.plan.title": "Plan review",
    "card.plan.approve": "Approve plan",
    "card.plan.decline": "Decline",
    "card.plan.open": "Open plan in DSH",
    "card.plan.preview": "Plan preview",
    "card.completion.title": "Turn finished",
    "card.completion.body": "This turn has ended. Open the session to continue.",
    "card.completion.open": "Back to conversation",
    "card.completion.dismiss": "Dismiss",
    "card.dismiss": "Dismiss",
    "card.openSession": "Open session",
    "card.answered": "Answered",
    "card.failed": "Something went wrong",
    "card.demo": "Demo",
    "demo.approvalTitle": "Demo approval request",
    "demo.approvalBody": "The Bash tool asks to run a command. This demo never approves anything.",
    "demo.question": "Which release channel should this demo use?",
    "demo.questionOptionA": "Stable",
    "demo.questionOptionB": "Beta",
    "demo.questionOptionC": "Nightly",
    "demo.completionTitle": "Demo completion",
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
    "settings.nav": "\u4E92\u52A8\u63D0\u9192",
    "settings.title": "\u4E92\u52A8\u63D0\u9192",
    "settings.description": "\u4F1A\u8BDD\u9700\u8981\u6743\u9650\u5BA1\u6279\u3001\u5411\u4F60\u63D0\u95EE\u6216\u5B8C\u6210\u4E00\u8F6E\u4EFB\u52A1\u65F6\uFF0C\u7528\u97F3\u6548\u3001DSH \u98CE\u683C\u7F6E\u9876\u5F39\u7A97\u548C Windows \u7CFB\u7EDF\u901A\u77E5\u63D0\u9192\u4F60\u3002",
    "settings.master": "\u542F\u7528\u63D0\u9192",
    "settings.masterHint": "\u4E00\u952E\u5173\u95ED\u6240\u6709\u901A\u9053\uFF0C\u4F46\u4FDD\u7559\u4F60\u7684\u504F\u597D\u8BBE\u7F6E\u3002",
    "settings.sound": "\u97F3\u6548",
    "settings.soundHint": "\u5168\u90E8\u7528 Web Audio \u5728\u672C\u5730\u5408\u6210\uFF0C\u4E0D\u4E0B\u8F7D\u97F3\u9891\u6587\u4EF6\u3002",
    "settings.soundEnabled": "\u64AD\u653E\u63D0\u793A\u97F3",
    "settings.preset": "\u97F3\u6548",
    "settings.volume": "\u97F3\u91CF",
    "settings.preview": "\u8BD5\u542C",
    "settings.previewSound": "\u8BD5\u542C\u97F3\u6548",
    "settings.previewPlayed": "\u5DF2\u64AD\u653E",
    "settings.previewFallback": "\u5DF2\u901A\u8FC7\u5907\u7528\u97F3\u9891\u64AD\u653E",
    "settings.previewSilent": "\u5F53\u524D\u97F3\u6548\u4E3A\u9759\u97F3",
    "settings.previewBlocked": "\u6D4F\u89C8\u5668\u963B\u6B62\u4E86\u97F3\u9891\uFF0C\u8BF7\u518D\u70B9\u4E00\u6B21\u6216\u68C0\u67E5\u7CFB\u7EDF\u97F3\u91CF",
    "settings.previewUnsupported": "\u5F53\u524D\u73AF\u5883\u4E0D\u652F\u6301\u97F3\u9891\u64AD\u653E",
    "settings.popup": "\u4EA4\u4E92\u5F39\u7A97",
    "settings.popupHint": "DSH \u4E3B\u9898\u7684\u59CB\u7EC8\u7F6E\u9876\u7A97\u53E3\uFF1B\u53EF\u76F4\u63A5\u5728\u7A97\u5185\u6279\u51C6\u3001\u62D2\u7EDD\u548C\u56DE\u7B54\u95EE\u9898\u3002\u6D4F\u89C8\u5668\u5B89\u5168\u7B56\u7565\u8981\u6C42\u5148\u70B9\u51FB\u4E00\u6B21\u624D\u80FD\u6253\u5F00\uFF1B\u5173\u95ED\u540E\u7531\u9875\u5185\u5361\u7247\u6216 Windows \u901A\u77E5\u63A5\u7BA1\u3002",
    "settings.popupEnabled": "\u663E\u793A\u4EA4\u4E92\u5F39\u7A97",
    "settings.popupOpen": "\u6253\u5F00\u5F39\u7A97",
    "settings.popupClose": "\u5173\u95ED\u5F39\u7A97",
    "settings.popupTest": "\u6D4B\u8BD5\u5F39\u7A97",
    "settings.popupBackend": "\u5F53\u524D\u540E\u7AEF",
    "settings.popupBlocked": "\u6D4F\u89C8\u5668\u62E6\u622A\u4E86\u5F39\u7A97\u3002\u8BF7\u518D\u70B9\u4E00\u6B21\u6309\u94AE\uFF0C\u6216\u7EE7\u7EED\u4F7F\u7528\u9875\u5185\u5361\u7247\u3002",
    "settings.popupUnsupported": "\u5F53\u524D\u6D4F\u89C8\u5668\u4E0D\u652F\u6301\u59CB\u7EC8\u7F6E\u9876\u5F39\u7A97\uFF0C\u5C06\u56DE\u9000\u4E3A\u666E\u901A\u5F39\u7A97\u7A97\u53E3\u3002",
    "settings.system": "Windows \u7CFB\u7EDF\u901A\u77E5",
    "settings.systemHint": "\u4F7F\u7528\u6D4F\u89C8\u5668 Notification API\uFF1BDSH \u9875\u9762\u5931\u7126\u6216\u9690\u85CF\u65F6\uFF0C\u901A\u77E5\u4F1A\u51FA\u73B0\u5728 Windows \u901A\u77E5\u4E2D\u5FC3\u3002\u9875\u9762\u805A\u7126\u65F6\u4E0D\u4F1A\u53D1\u9001\uFF0C\u907F\u514D\u548C\u9875\u5185\u5361\u7247\u91CD\u590D\u3002",
    "settings.systemEnabled": "\u663E\u793A Windows \u7CFB\u7EDF\u901A\u77E5",
    "settings.permission": "\u901A\u77E5\u6743\u9650",
    "settings.permissionGranted": "\u5DF2\u6388\u6743",
    "settings.permissionDenied": "\u5DF2\u88AB\u6D4F\u89C8\u5668\u62D2\u7EDD",
    "settings.permissionDefault": "\u5C1A\u672A\u6388\u6743",
    "settings.permissionUnsupported": "\u5F53\u524D\u6D4F\u89C8\u5668\u4E0D\u652F\u6301",
    "settings.authorize": "\u6388\u6743\u901A\u77E5",
    "settings.testNotification": "\u6D4B\u8BD5\u7CFB\u7EDF\u901A\u77E5",
    "settings.behavior": "\u884C\u4E3A",
    "settings.suppressWhenFocused": "\u5F53\u524D\u4F1A\u8BDD\u4E0D\u6253\u6270",
    "settings.suppressWhenFocusedHint": "\u9875\u9762\u805A\u7126\u4E14\u4F60\u6B63\u5728\u770B\u9700\u8981\u5904\u7406\u7684\u4F1A\u8BDD\u65F6\uFF0C\u8DF3\u8FC7\u63D0\u9192\u3002",
    "settings.includeSubagents": "\u5305\u542B\u5B50\u667A\u80FD\u4F53\u4F1A\u8BDD",
    "settings.includeSubagentsHint": "\u5B50\u667A\u80FD\u4F53\u548C\u540E\u53F0\u5B50\u4F1A\u8BDD\u9ED8\u8BA4\u4FDD\u6301\u5B89\u9759\u3002",
    "settings.autoDismiss": "\u5B8C\u6210\u5361\u7247\u81EA\u52A8\u5173\u95ED",
    "settings.autoDismissHint": "\u5B8C\u6210\u5361\u7247\u81EA\u52A8\u5173\u95ED\u524D\u7684\u79D2\u6570\u3002\u8BBE\u4E3A 0 \u5219\u4E00\u76F4\u4FDD\u7559\u5230\u624B\u52A8\u5173\u95ED\u3002",
    "settings.maxCards": "\u9875\u5185\u6700\u591A\u663E\u793A\u5361\u7247",
    "settings.maxCardsHint": "\u5BA1\u6279\u548C\u63D0\u95EE\u4E0D\u4F1A\u88AB\u4E22\u5F03\uFF0C\u4F1A\u7EE7\u7EED\u6392\u961F\u3002",
    "settings.tests": "\u6D4B\u8BD5",
    "settings.testsHint": "\u8FD9\u4E9B\u662F\u672C\u5730\u6F14\u793A\u5361\u7247\uFF0C\u4E0D\u4F1A\u771F\u6B63\u56DE\u7B54\u4EFB\u4F55\u8BF7\u6C42\u3002",
    "settings.testApproval": "\u6D4B\u8BD5\u5BA1\u6279\u5361",
    "settings.testQuestion": "\u6D4B\u8BD5\u63D0\u95EE\u5361",
    "settings.testCompletion": "\u6D4B\u8BD5\u5B8C\u6210\u5361",
    "settings.reset": "\u6062\u590D\u9ED8\u8BA4\u8BBE\u7F6E",
    "settings.resetHint": "\u6062\u590D\u9ED8\u8BA4\u503C\uFF0C\u4E0D\u4F1A\u5378\u8F7D\u63D2\u4EF6\u3002",
    "settings.resetDone": "\u5DF2\u6062\u590D\u9ED8\u8BA4\u8BBE\u7F6E\u3002",
    "settings.active": "\u5F53\u524D\u5361\u7247",
    "settings.backend": "\u5F39\u7A97\u540E\u7AEF",
    "settings.audio": "\u97F3\u9891",
    "settings.audioReady": "\u5DF2\u5C31\u7EEA",
    "settings.audioBlocked": "\u70B9\u51FB\u9875\u9762\u4EE5\u542F\u7528\u97F3\u6548",
    "settings.storageUnavailable": "\u6D4F\u89C8\u5668\u5B58\u50A8\u4E0D\u53EF\u7528\uFF1B\u672C\u6B21\u4FEE\u6539\u53EA\u5728\u5F53\u524D\u9875\u9762\u6709\u6548\u3002",
    "settings.storageReadError": "\u8BFB\u53D6\u5DF2\u4FDD\u5B58\u7684\u8BBE\u7F6E\u5931\u8D25\uFF0C\u6B63\u5728\u4F7F\u7528\u9ED8\u8BA4\u503C\u3002",
    "settings.storageWriteError": "\u8BBE\u7F6E\u4FDD\u5B58\u5931\u8D25\uFF1B\u672C\u6B21\u4FEE\u6539\u53EA\u5728\u5F53\u524D\u9875\u9762\u6709\u6548\u3002",
    "settings.seconds": "\u79D2",
    "popup.title": "\u4E92\u52A8\u63D0\u9192",
    "popup.subtitle": "\u5BA1\u6279\u3001\u63D0\u95EE\u4E0E\u5B8C\u6210\u63D0\u9192",
    "popup.empty": "\u6682\u65E0\u63D0\u9192",
    "popup.emptyHint": "\u65B0\u7684\u5BA1\u6279\u3001\u63D0\u95EE\u548C\u5B8C\u6210\u63D0\u9192\u4F1A\u51FA\u73B0\u5728\u8FD9\u91CC\u3002",
    "popup.close": "\u5173\u95ED",
    "popup.backendPip": "\u59CB\u7EC8\u7F6E\u9876",
    "popup.backendWindow": "\u666E\u901A\u5F39\u7A97",
    "popup.backendInpage": "\u9875\u5185\u6D6E\u5C42",
    "popup.more": "\u8FD8\u6709 {count} \u6761",
    "popup.settingsHint": "\u5728 DSH \u8BBE\u7F6E \u2192 \u4E92\u52A8\u63D0\u9192 \u4E2D\u914D\u7F6E\u901A\u9053\u3002",
    "card.approval.title": "\u9700\u8981\u4F60\u7684\u6279\u51C6",
    "card.approval.waiting": "\u7B49\u5F85\u4F60\u7684\u6279\u51C6",
    "card.approval.tool": "\u5DE5\u5177",
    "card.approval.allow": "\u5141\u8BB8\u4E00\u6B21",
    "card.approval.reject": "\u62D2\u7EDD",
    "card.approval.open": "\u5728 DSH \u4E2D\u6253\u5F00",
    "card.approval.invalid": "\u8BE5\u8BF7\u6C42\u5DF2\u5931\u6548\uFF0C\u65E0\u6CD5\u518D\u4F5C\u7B54\u3002",
    "card.question.title": "\u9700\u8981\u4F60\u7684\u56DE\u7B54",
    "card.question.submit": "\u63D0\u4EA4\u56DE\u7B54",
    "card.question.skip": "\u8DF3\u8FC7\u6B64\u9898",
    "card.question.unskip": "\u53D6\u6D88\u8DF3\u8FC7",
    "card.question.skipped": "\u5DF2\u8DF3\u8FC7",
    "card.question.other": "\u81EA\u5B9A\u4E49\u56DE\u7B54",
    "card.question.otherPlaceholder": "\u8F93\u5165\u81EA\u5B9A\u4E49\u56DE\u7B54\u2026",
    "card.question.required": "\u8BF7\u9009\u62E9\u9009\u9879\u3001\u8F93\u5165\u56DE\u7B54\uFF0C\u6216\u663E\u5F0F\u8DF3\u8FC7\u6BCF\u4E00\u9898\u3002",
    "card.question.sent": "\u56DE\u7B54\u5DF2\u63D0\u4EA4\u3002",
    "card.question.error": "\u56DE\u7B54\u63D0\u4EA4\u5931\u8D25\uFF0C\u53EF\u80FD\u5DF2\u5728\u5176\u4ED6\u4F4D\u7F6E\u4F5C\u7B54\u3002",
    "card.question.takeTime": "\u6162\u6162\u56DE\u7B54",
    "card.question.countdown": "{seconds} \u79D2\u540E\u7EE7\u7EED\u5DE5\u4F5C",
    "card.question.paused": "\u4F5C\u7B54\u671F\u95F4\u5DF2\u6682\u505C\u8BA1\u65F6",
    "card.question.multi": "\u53EF\u591A\u9009",
    "card.question.open": "\u5728 DSH \u4E2D\u6253\u5F00",
    "card.plan.title": "\u8BA1\u5212\u5BA1\u6838",
    "card.plan.approve": "\u6279\u51C6\u8BA1\u5212",
    "card.plan.decline": "\u62D2\u7EDD",
    "card.plan.open": "\u5728 DSH \u4E2D\u67E5\u770B\u5B8C\u6574\u8BA1\u5212",
    "card.plan.preview": "\u8BA1\u5212\u9884\u89C8",
    "card.completion.title": "\u672C\u8F6E\u5DF2\u7ED3\u675F",
    "card.completion.body": "\u8FD9\u4E00\u8F6E\u5DF2\u7ECF\u7ED3\u675F\uFF0C\u6253\u5F00\u4F1A\u8BDD\u7EE7\u7EED\u3002",
    "card.completion.open": "\u56DE\u5230\u5BF9\u8BDD",
    "card.completion.dismiss": "\u5173\u95ED",
    "card.dismiss": "\u5173\u95ED",
    "card.openSession": "\u6253\u5F00\u4F1A\u8BDD",
    "card.answered": "\u5DF2\u4F5C\u7B54",
    "card.failed": "\u64CD\u4F5C\u5931\u8D25",
    "card.demo": "\u6F14\u793A",
    "demo.approvalTitle": "\u6F14\u793A\u5BA1\u6279\u8BF7\u6C42",
    "demo.approvalBody": "Bash \u5DE5\u5177\u8BF7\u6C42\u6267\u884C\u4E00\u6761\u547D\u4EE4\u3002\u6B64\u6F14\u793A\u4E0D\u4F1A\u771F\u6B63\u6279\u51C6\u4EFB\u4F55\u64CD\u4F5C\u3002",
    "demo.question": "\u8FD9\u4E2A\u6F14\u793A\u5E94\u8BE5\u4F7F\u7528\u54EA\u4E2A\u53D1\u5E03\u901A\u9053\uFF1F",
    "demo.questionOptionA": "\u7A33\u5B9A\u7248",
    "demo.questionOptionB": "\u6D4B\u8BD5\u7248",
    "demo.questionOptionC": "\u6BCF\u65E5\u6784\u5EFA",
    "demo.completionTitle": "\u6F14\u793A\u5B8C\u6210\u63D0\u9192",
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
var SETTINGS_KEY = "dsh.notify-interactive.settings.v1";
var SOUND_PRESET_IDS = Object.freeze(["chime", "pulse", "complete", "soft", "alert", "none"]);
var SCENARIO_KEYS = Object.freeze(["approval", "question", "planReview", "completion"]);
var DEFAULT_PRESET = "chime";
var MAX_VOLUME = 1;
var MIN_VOLUME = 0;
var MAX_AUTO_DISMISS_MS = 6e4;
var MIN_AUTO_DISMISS_MS = 0;
var MIN_CARDS = 1;
var MAX_CARDS = 5;
function createDefaultSettings() {
  return {
    version: 1,
    enabled: true,
    sound: {
      enabled: true,
      preset: DEFAULT_PRESET,
      volume: 0.7
    },
    popup: {
      enabled: true,
      fallbackInPage: true
    },
    system: {
      enabled: true
    },
    behavior: {
      suppressWhenFocused: true,
      includeSubagents: false,
      completionAutoDismissMs: 8e3,
      maxVisibleCards: 3
    },
    // Phase 1 does not expose this in the settings UI, but the engine reads it
    // from day one so phase 2 only has to add the rows.
    scenarios: {
      approval: scenarioDefaults(),
      question: scenarioDefaults(),
      planReview: scenarioDefaults(),
      completion: scenarioDefaults()
    }
  };
}
function scenarioDefaults() {
  return { sound: true, popup: true, system: true };
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
    popup: bool(value.popup, true),
    system: bool(value.system, true)
  };
}
function normalizeSettings(raw) {
  const value = isObject(raw) ? raw : {};
  const sound = isObject(value.sound) ? value.sound : {};
  const popup = isObject(value.popup) ? value.popup : {};
  const system = isObject(value.system) ? value.system : {};
  const behavior = isObject(value.behavior) ? value.behavior : {};
  const scenarios = isObject(value.scenarios) ? value.scenarios : {};
  return {
    version: 1,
    enabled: bool(value.enabled, true),
    sound: {
      enabled: bool(sound.enabled, true),
      preset: presetOf(sound.preset),
      volume: numberIn(sound.volume, 0.7, MIN_VOLUME, MAX_VOLUME)
    },
    popup: {
      enabled: bool(popup.enabled, true),
      fallbackInPage: bool(popup.fallbackInPage, true)
    },
    system: {
      enabled: bool(system.enabled, true)
    },
    behavior: {
      suppressWhenFocused: bool(behavior.suppressWhenFocused, true),
      includeSubagents: bool(behavior.includeSubagents, false),
      completionAutoDismissMs: numberIn(
        behavior.completionAutoDismissMs,
        8e3,
        MIN_AUTO_DISMISS_MS,
        MAX_AUTO_DISMISS_MS
      ),
      maxVisibleCards: numberIn(
        behavior.maxVisibleCards,
        3,
        MIN_CARDS,
        MAX_CARDS
      )
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
    sound: { ...base.sound, ...isObject(next.sound) ? next.sound : {} },
    popup: { ...base.popup, ...isObject(next.popup) ? next.popup : {} },
    system: { ...base.system, ...isObject(next.system) ? next.system : {} },
    behavior: { ...base.behavior, ...isObject(next.behavior) ? next.behavior : {} },
    scenarios
  });
}
function createSettingsStore(storage) {
  const target = storage ?? globalThis.localStorage;
  const listeners = /* @__PURE__ */ new Set();
  let storageError = null;
  let current;
  try {
    const text = target?.getItem(SETTINGS_KEY);
    current = text === null || text === void 0 ? createDefaultSettings() : normalizeSettings(JSON.parse(text));
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

// src/state/notifications.js
var MAX_STORE_ITEMS = 30;
function interactionNotificationId(sessionId, interactionKey) {
  return `interaction:${sessionId}:${interactionKey}`;
}
function completionNotificationId(sessionId, sequence) {
  return `completion:${sessionId}:${sequence}`;
}
function createNotificationStore(options = {}) {
  const maxItems = Number.isInteger(options.maxItems) && options.maxItems > 0 ? options.maxItems : MAX_STORE_ITEMS;
  let items = [];
  const listeners = /* @__PURE__ */ new Set();
  const emit = () => {
    for (const listener of listeners) {
      try {
        listener();
      } catch {
      }
    }
  };
  const findIndex = (id) => items.findIndex((item) => item.id === id);
  return {
    getSnapshot: () => items,
    count: () => items.length,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    /**
     * Insert or replace one card. Replacing preserves the original position
     * and creation time so a refreshed card does not jump around.
     * @param {object} item card item; `id`, `kind`, and `sessionId` are required.
     * @returns the stored item.
     */
    upsert(item) {
      if (item === null || typeof item !== "object" || item.id === void 0) {
        throw new TypeError("notification item requires an id");
      }
      const id = String(item.id);
      const index = findIndex(id);
      const now = Date.now();
      const stored = {
        ...item,
        id,
        createdAt: index >= 0 ? items[index].createdAt : item.createdAt ?? now,
        updatedAt: now
      };
      if (index >= 0) {
        const next = items.slice();
        next[index] = stored;
        items = next;
      } else {
        items = [...items, stored];
        if (items.length > maxItems) items = items.slice(items.length - maxItems);
      }
      emit();
      return stored;
    },
    /**
     * Patch one existing card in place.
     * @param {string} id card id.
     * @param {object} patch fields to merge.
     * @returns the updated card, or undefined when the id is unknown.
     */
    update(id, patch) {
      const index = findIndex(String(id));
      if (index < 0) return void 0;
      const next = items.slice();
      next[index] = { ...next[index], ...patch, id: next[index].id, updatedAt: Date.now() };
      items = next;
      emit();
      return next[index];
    },
    remove(id) {
      const index = findIndex(String(id));
      if (index < 0) return false;
      items = items.filter((item) => item.id !== String(id));
      emit();
      return true;
    },
    removeWhere(predicate) {
      const next = items.filter((item) => !predicate(item));
      if (next.length === items.length) return 0;
      const removed = items.length - next.length;
      items = next;
      emit();
      return removed;
    },
    removeSession(sessionId) {
      return this.removeWhere((item) => item.sessionId === sessionId);
    },
    clear() {
      if (items.length === 0) return;
      items = [];
      emit();
    }
  };
}

// src/state/popup.js
var import_react12 = require("react");
var import_client = require("react-dom/client");

// src/ui/PopupApp.jsx
var import_react11 = require("react");

// src/ui/icons.jsx
var import_react = require("react");
function svg(props, children) {
  return (0, import_react.createElement)("svg", {
    viewBox: "0 0 24 24",
    width: props.size ?? 16,
    height: props.size ?? 16,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    focusable: false,
    className: props.className
  }, children);
}
function BellIcon(props = {}) {
  return svg(props, [
    (0, import_react.createElement)("path", { key: "bell", d: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" }),
    (0, import_react.createElement)("path", { key: "clapper", d: "M10.3 21a1.9 1.9 0 0 0 3.4 0" })
  ]);
}
function AlertIcon(props = {}) {
  return svg(props, [
    (0, import_react.createElement)("path", { key: "triangle", d: "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" }),
    (0, import_react.createElement)("path", { key: "line", d: "M12 9v4" }),
    (0, import_react.createElement)("path", { key: "dot", d: "M12 17h.01" })
  ]);
}
function QuestionIcon(props = {}) {
  return svg(props, [
    (0, import_react.createElement)("circle", { key: "circle", cx: 12, cy: 12, r: 9 }),
    (0, import_react.createElement)("path", { key: "q", d: "M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4" }),
    (0, import_react.createElement)("path", { key: "dot", d: "M12 17h.01" })
  ]);
}
function CheckIcon(props = {}) {
  return svg(props, [
    (0, import_react.createElement)("path", { key: "check", d: "M20 6 9 17l-5-5" })
  ]);
}
function CloseIcon(props = {}) {
  return svg(props, [
    (0, import_react.createElement)("path", { key: "x", d: "M18 6 6 18" }),
    (0, import_react.createElement)("path", { key: "x2", d: "m6 6 12 12" })
  ]);
}
function PlanIcon(props = {}) {
  return svg(props, [
    (0, import_react.createElement)("path", { key: "page", d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
    (0, import_react.createElement)("path", { key: "fold", d: "M14 2v6h6" }),
    (0, import_react.createElement)("path", { key: "lines", d: "M8 13h8M8 17h5" })
  ]);
}
function PopupIcon(props = {}) {
  return svg(props, [
    (0, import_react.createElement)("rect", { key: "rect", x: 3, y: 3, width: 18, height: 14, rx: 2 }),
    (0, import_react.createElement)("path", { key: "line", d: "M3 9h18" })
  ]);
}

// src/ui/controls.jsx
var import_react2 = require("react");
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
  return (0, import_react2.createElement)("button", {
    ...rest,
    type,
    className: `dni-btn dni-btn-${variant} dni-btn-${size}${className === "" ? "" : ` ${className}`}`,
    disabled,
    onClick,
    title
  }, children);
}
function Switch({ checked, onChange, label, disabled = false }) {
  return (0, import_react2.createElement)("button", {
    type: "button",
    role: "switch",
    "aria-checked": Boolean(checked),
    "aria-label": label,
    className: `dni-switch${checked ? " is-on" : ""}`,
    disabled,
    onClick: () => onChange(!checked)
  }, (0, import_react2.createElement)("span", { className: "dni-switch-knob", "aria-hidden": true }));
}
function Field({ label, hint, children }) {
  return (0, import_react2.createElement)(
    "div",
    { className: "dni-field" },
    (0, import_react2.createElement)(
      "div",
      { className: "dni-field-text" },
      (0, import_react2.createElement)("div", { className: "dni-field-label" }, label),
      hint !== void 0 && hint !== null ? (0, import_react2.createElement)("div", { className: "dni-field-hint" }, hint) : null
    ),
    (0, import_react2.createElement)("div", { className: "dni-field-control" }, children)
  );
}
function Section({ title, children }) {
  return (0, import_react2.createElement)(
    "section",
    { className: "dni-section" },
    title !== void 0 ? (0, import_react2.createElement)("h3", { className: "dni-section-title" }, title) : null,
    (0, import_react2.createElement)("div", { className: "dni-section-body" }, children)
  );
}
function Select({ value, onChange, options, label }) {
  return (0, import_react2.createElement)("select", {
    className: "dni-select",
    value,
    "aria-label": label,
    onChange: (event) => onChange(event.target.value)
  }, options.map((option) => (0, import_react2.createElement)("option", { key: option.value, value: option.value }, option.label)));
}
function Slider({ value, min = 0, max = 1, step = 0.05, onChange, label }) {
  return (0, import_react2.createElement)("input", {
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
  return (0, import_react2.createElement)("span", { className: `dni-badge dni-badge-${tone}` }, children);
}
function IconButton({ label, onClick, disabled = false, children }) {
  return (0, import_react2.createElement)("button", {
    type: "button",
    className: "dni-icon-button",
    "aria-label": label,
    title: label,
    disabled,
    onClick
  }, children);
}

// src/ui/useStore.js
var import_react3 = require("react");
function useStore(store) {
  return (0, import_react3.useSyncExternalStore)(store.subscribe, store.getSnapshot, store.getSnapshot);
}

// src/ui/locale.js
var import_react4 = require("react");
function readLocale(ctx) {
  try {
    return ctx?.locale?.getLocale?.() ?? { id: "en" };
  } catch {
    return { id: "en" };
  }
}
function useLocale(ctx) {
  const [snapshot, setSnapshot] = (0, import_react4.useState)(() => readLocale(ctx));
  (0, import_react4.useEffect)(() => {
    if (typeof ctx?.locale?.subscribe !== "function") return void 0;
    return ctx.locale.subscribe(() => setSnapshot(readLocale(ctx)));
  }, [ctx]);
  const id = localeIdOf(snapshot?.active ?? snapshot?.id);
  return {
    id,
    t: (key, vars) => translate(id, key, vars)
  };
}

// src/ui/cards/index.jsx
var import_react10 = require("react");

// src/ui/cards/ApprovalCard.jsx
var import_react6 = require("react");

// src/ui/cards/shared.jsx
var import_react5 = require("react");
var noopSubscribe = () => () => {
};
var emptySnapshot = () => void 0;
function usePendingSnapshot(pending) {
  return (0, import_react5.useSyncExternalStore)(
    pending?.subscribe ?? noopSubscribe,
    pending?.getSnapshot ?? emptySnapshot,
    pending?.getSnapshot ?? emptySnapshot
  );
}
function CardShell({
  tone = "info",
  icon,
  title,
  subtitle,
  sessionTitle,
  sessionId,
  t,
  onOpenSession,
  onDismiss,
  dismissible = false,
  demo = false,
  badge,
  children,
  footer
}) {
  const head = (0, import_react5.createElement)(
    "div",
    { className: "dni-card-head" },
    (0, import_react5.createElement)("div", { className: "dni-card-icon", "aria-hidden": true }, icon),
    (0, import_react5.createElement)(
      "div",
      { className: "dni-card-headtext" },
      (0, import_react5.createElement)(
        "div",
        { className: "dni-card-titleline" },
        (0, import_react5.createElement)("span", { className: "dni-card-title" }, title),
        demo ? (0, import_react5.createElement)("span", { className: "dni-badge dni-badge-neutral" }, t("card.demo")) : null,
        badge ?? null
      ),
      subtitle !== void 0 && subtitle !== null && subtitle !== "" ? (0, import_react5.createElement)("div", { className: "dni-card-subtitle" }, subtitle) : null,
      sessionTitle !== void 0 && sessionTitle !== null ? typeof onOpenSession === "function" ? (0, import_react5.createElement)("button", {
        type: "button",
        className: "dni-session-link",
        onClick: () => onOpenSession(sessionId),
        title: t("card.openSession")
      }, sessionTitle) : (0, import_react5.createElement)("div", { className: "dni-card-session" }, sessionTitle) : null
    ),
    dismissible ? (0, import_react5.createElement)(IconButton, {
      label: t("card.dismiss"),
      onClick: () => onDismiss?.()
    }, (0, import_react5.createElement)(CloseIcon, { size: 14 })) : null
  );
  return (0, import_react5.createElement)(
    "article",
    { className: `dni-card dni-card-${tone}`, "aria-label": title },
    head,
    (0, import_react5.createElement)("div", { className: "dni-card-body" }, children),
    footer !== void 0 && footer !== null ? (0, import_react5.createElement)("footer", { className: "dni-card-actions" }, footer) : null
  );
}
function CardButton({ variant = "outline", onClick, disabled, children }) {
  return (0, import_react5.createElement)(Button, { variant, size: "sm", onClick, disabled }, children);
}

// src/ui/cards/ApprovalCard.jsx
function ApprovalCard({ item, t, onOpenSession, onDismiss, resolveText }) {
  const pending = item.interaction;
  const [busy, setBusy] = (0, import_react6.useState)(false);
  const [answered, setAnswered] = (0, import_react6.useState)(false);
  const [error, setError] = (0, import_react6.useState)(null);
  const reason = pending?.displayReason !== void 0 && typeof resolveText === "function" ? resolveText(pending.displayReason) : pending?.reason;
  const subtitle = [pending?.toolName, reason].filter(Boolean).join(" \xB7 ");
  async function answer(outcome) {
    if (busy || answered) return;
    setBusy(true);
    setError(null);
    if (item.demo === true) {
      setAnswered(true);
      setBusy(false);
      onDismiss?.(item.id);
      return;
    }
    if (pending === void 0 || pending === null || pending.answerable === false) {
      setBusy(false);
      setError(t("card.approval.invalid"));
      return;
    }
    try {
      await pending.answer(outcome);
      setAnswered(true);
      onDismiss?.(item.id);
    } catch {
      setBusy(false);
      setError(t("card.approval.invalid"));
    }
  }
  return (0, import_react6.createElement)(
    CardShell,
    {
      tone: "warn",
      icon: (0, import_react6.createElement)(AlertIcon, { size: 18 }),
      title: t("card.approval.title"),
      subtitle,
      sessionTitle: item.sessionTitle,
      sessionId: item.sessionId,
      t,
      onOpenSession,
      onDismiss: () => onDismiss?.(item.id),
      dismissible: item.demo === true,
      demo: item.demo === true,
      badge: (0, import_react6.createElement)("span", { className: "dni-badge dni-badge-warn" }, t("card.approval.waiting")),
      footer: (0, import_react6.createElement)(
        "div",
        { className: "dni-card-actions-row" },
        (0, import_react6.createElement)(CardButton, {
          variant: "outline",
          onClick: () => answer("rejected"),
          disabled: busy || answered
        }, t("card.approval.reject")),
        (0, import_react6.createElement)(CardButton, {
          variant: "primary",
          onClick: () => answer("allowed-once"),
          disabled: busy || answered
        }, t("card.approval.allow"))
      )
    },
    error !== null ? (0, import_react6.createElement)("div", { className: "dni-error", role: "alert" }, error) : null
  );
}

// src/ui/cards/QuestionCard.jsx
var import_react7 = require("react");

// src/engine/question-answer.js
function emptyDraft() {
  return { selected: [], custom: "", skipped: false };
}
function createDrafts(questions) {
  return (questions ?? []).map(() => emptyDraft());
}
function toggleOption(draft, label, multiSelect) {
  const current = draft ?? emptyDraft();
  if (multiSelect === true) {
    const selected = current.selected.includes(label) ? current.selected.filter((item) => item !== label) : [...current.selected, label];
    return { ...current, selected, skipped: false };
  }
  return { ...current, selected: [label], custom: "", skipped: false };
}
function updateCustom(draft, value, multiSelect) {
  const current = draft ?? emptyDraft();
  return {
    ...current,
    selected: multiSelect === true ? current.selected : [],
    custom: value,
    skipped: false
  };
}
function skipDraft() {
  return { selected: [], custom: "", skipped: true };
}
function isDraftComplete(draft) {
  if (draft === void 0 || draft === null) return false;
  if (draft.skipped === true) return true;
  return draft.selected.length > 0 || String(draft.custom ?? "").trim() !== "";
}
function firstIncompleteIndex(drafts) {
  return (drafts ?? []).findIndex((draft) => !isDraftComplete(draft));
}
function buildAnswer(questions, drafts) {
  const list = questions ?? [];
  return {
    answers: list.map((question, index) => {
      const draft = drafts[index] ?? emptyDraft();
      if (draft.skipped === true) {
        return { id: question.id, selected: [] };
      }
      const custom = String(draft.custom ?? "").trim();
      return {
        id: question.id,
        selected: custom === "" || question.multiSelect === true ? [...draft.selected] : [],
        ...custom === "" ? {} : { custom }
      };
    })
  };
}
function planReviewOptions(question) {
  const intent = question?.intent;
  if (intent?.kind !== "plan-review") return null;
  const options = Array.isArray(question.options) ? question.options : [];
  const approve = options.find((option) => option?.label === intent.approve);
  if (approve === void 0) return null;
  const decline = options.find((option) => option?.label !== intent.approve);
  return {
    approve,
    decline,
    plan: String(question.detail ?? "")
  };
}
function planAnswer(question, label) {
  return { answers: [{ id: question.id, selected: [label] }] };
}

// src/ui/cards/QuestionCard.jsx
var COUNTDOWN_STATES = /* @__PURE__ */ new Set(["waiting", "editing", "continued"]);
function QuestionCard({ item, t, onOpenSession, onDismiss }) {
  const pending = item.interaction;
  const snapshot = usePendingSnapshot(pending);
  const questions = Array.isArray(pending?.questions) ? pending.questions : [];
  const [drafts, setDrafts] = (0, import_react7.useState)(() => createDrafts(questions));
  const [busy, setBusy] = (0, import_react7.useState)(false);
  const [sent, setSent] = (0, import_react7.useState)(false);
  const [error, setError] = (0, import_react7.useState)(null);
  const demo = item.demo === true;
  (0, import_react7.useEffect)(() => {
    setDrafts(createDrafts(questions));
  }, [item.id]);
  const channel = snapshot?.channel ?? (demo ? "demo" : "none");
  const countdown = snapshot?.countdown;
  const showCountdown = countdown !== void 0 && !COUNTDOWN_STATES.has(snapshot?.waitState);
  const disabled = busy || sent;
  function update(index, next) {
    setDrafts((current) => current.map((draft, draftIndex) => draftIndex === index ? next : draft));
    setError(null);
    setSent(false);
    pending?.engage?.();
  }
  async function submit() {
    if (disabled) return;
    const incomplete = firstIncompleteIndex(drafts);
    if (incomplete >= 0) {
      setError(t("card.question.required"));
      return;
    }
    setBusy(true);
    setError(null);
    if (demo) {
      setSent(true);
      setBusy(false);
      onDismiss?.(item.id);
      return;
    }
    if (pending === void 0 || pending === null || channel === "none") {
      setBusy(false);
      setError(t("card.question.error"));
      return;
    }
    try {
      await pending.answer(buildAnswer(questions, drafts));
      setSent(true);
      if (channel === "rpc" && typeof pending.dismiss === "function") {
        try {
          await pending.dismiss();
        } catch {
        }
      }
      onDismiss?.(item.id);
    } catch {
      setBusy(false);
      setError(t("card.question.error"));
    }
  }
  function holdFocus() {
    pending?.holdFocus?.();
  }
  function releaseFocus(event) {
    if (event?.relatedTarget !== null && event?.relatedTarget !== void 0) {
      if (event.currentTarget.contains(event.relatedTarget)) return;
    }
    pending?.releaseFocus?.();
  }
  const body = (0, import_react7.createElement)(
    "div",
    {
      className: "dni-question-body",
      onPointerDownCapture: holdFocus,
      onFocusCapture: holdFocus,
      onBlurCapture: releaseFocus
    },
    questions.map((question, index) => {
      const draft = drafts[index] ?? { selected: [], custom: "", skipped: false };
      const options = Array.isArray(question.options) ? question.options : [];
      const multi = question.multiSelect === true;
      return (0, import_react7.createElement)(
        "div",
        { key: question.id ?? index, className: "dni-question" },
        question.header !== void 0 ? (0, import_react7.createElement)("div", { className: "dni-question-header" }, question.header) : null,
        (0, import_react7.createElement)("div", { className: "dni-question-text" }, question.question),
        question.detail !== void 0 && question.detail !== "" ? (0, import_react7.createElement)("div", { className: "dni-question-detail" }, question.detail) : null,
        multi ? (0, import_react7.createElement)("div", { className: "dni-question-hint" }, t("card.question.multi")) : null,
        options.length > 0 ? (0, import_react7.createElement)(
          "div",
          { className: "dni-options", role: "group" },
          options.map((option) => {
            const selected = draft.selected.includes(option.label);
            return (0, import_react7.createElement)(
              "button",
              {
                key: option.label,
                type: "button",
                className: `dni-option${selected ? " is-selected" : ""}`,
                "aria-pressed": selected,
                disabled: disabled || draft.skipped === true,
                onClick: () => update(index, toggleOption(draft, option.label, multi))
              },
              (0, import_react7.createElement)("span", { className: "dni-option-mark", "aria-hidden": true }, selected ? "\u2713" : ""),
              (0, import_react7.createElement)(
                "span",
                { className: "dni-option-text" },
                (0, import_react7.createElement)("span", { className: "dni-option-label" }, option.label),
                option.description !== void 0 ? (0, import_react7.createElement)("span", { className: "dni-option-description" }, option.description) : null
              )
            );
          })
        ) : null,
        (0, import_react7.createElement)(
          "div",
          { className: `dni-custom-row${draft.custom !== "" ? " is-active" : ""}` },
          (0, import_react7.createElement)("label", { className: "dni-custom-label", htmlFor: `dni-question-${item.id}-${index}` }, t("card.question.other")),
          (0, import_react7.createElement)("input", {
            id: `dni-question-${item.id}-${index}`,
            className: "dni-input",
            type: "text",
            value: draft.custom,
            placeholder: t("card.question.otherPlaceholder"),
            disabled: disabled || draft.skipped === true,
            onChange: (event) => update(index, updateCustom(draft, event.target.value, multi)),
            onKeyDown: (event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
                event.preventDefault();
                submit();
              }
            }
          })
        ),
        (0, import_react7.createElement)(
          "div",
          { className: "dni-question-footer" },
          draft.skipped === true ? (0, import_react7.createElement)("span", { className: "dni-question-skipped" }, t("card.question.skipped")) : null,
          (0, import_react7.createElement)("button", {
            type: "button",
            className: "dni-link-button",
            disabled,
            onClick: () => {
              update(index, draft.skipped === true ? { selected: [], custom: "", skipped: false } : skipDraft());
            }
          }, draft.skipped === true ? t("card.question.unskip") : t("card.question.skip"))
        )
      );
    })
  );
  const footerChildren = [];
  if (showCountdown) {
    footerChildren.push((0, import_react7.createElement)(
      "span",
      { key: "countdown", className: "dni-countdown" },
      countdown.running ? t("card.question.countdown", { seconds: Math.ceil(countdown.remainingMs / 1e3) }) : t("card.question.paused")
    ));
    if (countdown.running) {
      footerChildren.push((0, import_react7.createElement)("button", {
        key: "take-time",
        type: "button",
        className: "dni-link-button",
        onClick: () => pending?.takeTime?.()
      }, t("card.question.takeTime")));
    }
  }
  footerChildren.push((0, import_react7.createElement)(CardButton, {
    key: "submit",
    variant: "primary",
    onClick: submit,
    disabled
  }, sent ? t("card.question.sent") : t("card.question.submit")));
  return (0, import_react7.createElement)(
    CardShell,
    {
      tone: "info",
      icon: (0, import_react7.createElement)(QuestionIcon, { size: 18 }),
      title: t("card.question.title"),
      sessionTitle: item.sessionTitle,
      sessionId: item.sessionId,
      t,
      onOpenSession,
      onDismiss: () => onDismiss?.(item.id),
      dismissible: demo,
      demo,
      badge: questions.length > 1 ? (0, import_react7.createElement)("span", { className: "dni-badge dni-badge-neutral" }, String(questions.length)) : null,
      footer: (0, import_react7.createElement)("div", { className: "dni-card-actions-row dni-card-actions-wrap" }, footerChildren)
    },
    body,
    sent ? (0, import_react7.createElement)("div", { className: "dni-success" }, t("card.question.sent")) : null,
    error !== null ? (0, import_react7.createElement)("div", { className: "dni-error", role: "alert" }, error) : null
  );
}

// src/ui/cards/PlanReviewCard.jsx
var import_react8 = require("react");
var PLAN_PREVIEW_LIMIT = 6e3;
function PlanReviewCard(props) {
  const { item, t, onOpenSession, onDismiss } = props;
  const pending = item.interaction;
  const question = Array.isArray(pending?.questions) ? pending.questions[0] : void 0;
  const review = question === void 0 ? null : planReviewOptions(question);
  const [busy, setBusy] = (0, import_react8.useState)(false);
  const [sent, setSent] = (0, import_react8.useState)(false);
  const [error, setError] = (0, import_react8.useState)(null);
  if (review === null || question === void 0) {
    return (0, import_react8.createElement)(QuestionCard, props);
  }
  const demo = item.demo === true;
  const planText = review.plan.length > PLAN_PREVIEW_LIMIT ? `${review.plan.slice(0, PLAN_PREVIEW_LIMIT)}\u2026` : review.plan;
  async function answer(label) {
    if (busy || sent) return;
    setBusy(true);
    setError(null);
    if (demo) {
      setSent(true);
      setBusy(false);
      onDismiss?.(item.id);
      return;
    }
    try {
      await pending.answer(planAnswer(question, label));
      setSent(true);
      onDismiss?.(item.id);
    } catch {
      setBusy(false);
      setError(t("card.question.error"));
    }
  }
  const footer = [];
  if (review.decline !== void 0) {
    footer.push((0, import_react8.createElement)(CardButton, {
      key: "decline",
      variant: "outline",
      disabled: busy || sent,
      onClick: () => answer(review.decline.label)
    }, t("card.plan.decline")));
  }
  footer.push((0, import_react8.createElement)(CardButton, {
    key: "open",
    variant: "ghost",
    onClick: () => onOpenSession?.(item.sessionId)
  }, t("card.plan.open")));
  footer.push((0, import_react8.createElement)(CardButton, {
    key: "approve",
    variant: "primary",
    disabled: busy || sent,
    onClick: () => answer(review.approve.label)
  }, t("card.plan.approve")));
  return (0, import_react8.createElement)(
    CardShell,
    {
      tone: "info",
      icon: (0, import_react8.createElement)(PlanIcon, { size: 18 }),
      title: t("card.plan.title"),
      subtitle: question.question,
      sessionTitle: item.sessionTitle,
      sessionId: item.sessionId,
      t,
      onOpenSession,
      onDismiss: () => onDismiss?.(item.id),
      dismissible: demo,
      demo,
      badge: (0, import_react8.createElement)("span", { className: "dni-badge dni-badge-info" }, t("card.plan.preview")),
      footer: (0, import_react8.createElement)("div", { className: "dni-card-actions-row dni-card-actions-wrap" }, footer)
    },
    (0, import_react8.createElement)("pre", { className: "dni-plan", tabIndex: 0, "aria-label": t("card.plan.preview") }, planText),
    sent ? (0, import_react8.createElement)("div", { className: "dni-success" }, t("card.answered")) : null,
    error !== null ? (0, import_react8.createElement)("div", { className: "dni-error", role: "alert" }, error) : null
  );
}

// src/ui/cards/CompletionCard.jsx
var import_react9 = require("react");
function CompletionCard({ item, t, onOpenSession, onDismiss, settings }) {
  const [paused, setPaused] = (0, import_react9.useState)(false);
  const autoDismissMs = settings?.behavior?.completionAutoDismissMs ?? 8e3;
  const effectiveAutoDismissMs = item.demo === true ? 0 : autoDismissMs;
  (0, import_react9.useEffect)(() => {
    if (paused || !(effectiveAutoDismissMs > 0)) return void 0;
    const timer = setTimeout(() => onDismiss?.(item.id), effectiveAutoDismissMs);
    return () => clearTimeout(timer);
  }, [effectiveAutoDismissMs, item.id, onDismiss, paused]);
  return (0, import_react9.createElement)(CardShell, {
    tone: "success",
    icon: (0, import_react9.createElement)(CheckIcon, { size: 18 }),
    title: t("card.completion.title"),
    subtitle: t("card.completion.body"),
    sessionTitle: item.sessionTitle,
    sessionId: item.sessionId,
    t,
    onOpenSession,
    onDismiss: () => onDismiss?.(item.id),
    dismissible: true,
    demo: item.demo === true,
    footer: (0, import_react9.createElement)(
      "div",
      {
        className: "dni-card-actions-row",
        onMouseEnter: () => setPaused(true),
        onMouseLeave: () => setPaused(false)
      },
      (0, import_react9.createElement)(CardButton, {
        variant: "primary",
        onClick: () => {
          onOpenSession?.(item.sessionId);
          onDismiss?.(item.id);
        }
      }, t("card.completion.open")),
      (0, import_react9.createElement)(CardButton, {
        variant: "ghost",
        onClick: () => onDismiss?.(item.id)
      }, t("card.completion.dismiss"))
    )
  });
}

// src/ui/cards/index.jsx
function CardList({ items, t, settings, resolveText, onOpenSession, onDismiss }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (0, import_react10.createElement)(
    "div",
    { className: "dni-card-list" },
    items.map((item) => {
      if (item.kind === "approval") {
        return (0, import_react10.createElement)(ApprovalCard, {
          key: item.id,
          item,
          t,
          resolveText,
          onOpenSession,
          onDismiss
        });
      }
      if (item.kind === "question") {
        return (0, import_react10.createElement)(QuestionCard, {
          key: item.id,
          item,
          t,
          onOpenSession,
          onDismiss
        });
      }
      if (item.kind === "plan-review") {
        return (0, import_react10.createElement)(PlanReviewCard, {
          key: item.id,
          item,
          t,
          onOpenSession,
          onDismiss
        });
      }
      if (item.kind === "completion") {
        return (0, import_react10.createElement)(CompletionCard, {
          key: item.id,
          item,
          t,
          settings,
          onOpenSession,
          onDismiss
        });
      }
      return null;
    })
  );
}
var demoSequence = 0;
function createDemoItems({ t, sessionId, sessionTitle }) {
  demoSequence += 1;
  const suffix = `${Date.now()}:${demoSequence}`;
  const targetSession = sessionId ?? "demo-session";
  const targetTitle = sessionTitle ?? t("card.demo");
  return {
    approval: {
      id: `demo:approval:${suffix}`,
      kind: "approval",
      scenario: "approval",
      sessionId: targetSession,
      sessionTitle: targetTitle,
      demo: true,
      sticky: false,
      interaction: {
        kind: "approval",
        key: `demo-approval-${suffix}`,
        toolName: "Bash",
        reason: t("demo.approvalBody"),
        answerable: true
      }
    },
    question: {
      id: `demo:question:${suffix}`,
      kind: "question",
      scenario: "question",
      sessionId: targetSession,
      sessionTitle: targetTitle,
      demo: true,
      sticky: false,
      interaction: {
        kind: "question",
        key: `demo-question-${suffix}`,
        questions: [{
          id: "demo-q",
          header: t("card.demo"),
          question: t("demo.question"),
          options: [
            { label: t("demo.questionOptionA") },
            { label: t("demo.questionOptionB") },
            { label: t("demo.questionOptionC") }
          ]
        }]
      }
    },
    completion: {
      id: `demo:completion:${suffix}`,
      kind: "completion",
      scenario: "completion",
      sessionId: targetSession,
      sessionTitle: targetTitle,
      demo: true,
      sticky: false,
      completedAt: Date.now()
    }
  };
}

// src/ui/PopupApp.jsx
var BACKEND_LABEL = {
  pip: "popup.backendPip",
  window: "popup.backendWindow",
  inpage: "popup.backendInpage"
};
function PopupApp() {
  const notifications = useStore(runtime.notificationStore);
  const settings = useStore(runtime.settingsStore);
  const popup = useStore(runtime.popupController);
  const { t } = useLocale(runtime.ctx);
  (0, import_react11.useEffect)(() => {
    runtime.setSurface?.("popup");
    return () => runtime.setSurface?.("inpage");
  }, []);
  const backendLabel = t(BACKEND_LABEL[popup?.backend] ?? "popup.backendInpage");
  return (0, import_react11.createElement)(
    "div",
    { className: "dni-popup" },
    (0, import_react11.createElement)(
      "header",
      { className: "dni-popup-head" },
      (0, import_react11.createElement)("div", { className: "dni-popup-icon", "aria-hidden": true }, (0, import_react11.createElement)(PopupIcon, { size: 18 })),
      (0, import_react11.createElement)(
        "div",
        { className: "dni-popup-headtext" },
        (0, import_react11.createElement)("div", { className: "dni-popup-title" }, t("popup.title")),
        (0, import_react11.createElement)(
          "div",
          { className: "dni-popup-subtitle" },
          (0, import_react11.createElement)("span", { className: "dni-popup-backend" }, backendLabel),
          (0, import_react11.createElement)("span", { className: "dni-dot", "aria-hidden": true }, "\xB7"),
          t("popup.subtitle")
        )
      ),
      (0, import_react11.createElement)(IconButton, {
        label: t("popup.close"),
        onClick: () => runtime.closePopup()
      }, (0, import_react11.createElement)(CloseIcon, { size: 16 }))
    ),
    (0, import_react11.createElement)(
      "main",
      { className: "dni-popup-list" },
      notifications.length === 0 ? (0, import_react11.createElement)(
        "div",
        { className: "dni-empty" },
        (0, import_react11.createElement)("div", { className: "dni-empty-title" }, t("popup.empty")),
        (0, import_react11.createElement)("div", { className: "dni-empty-hint" }, t("popup.emptyHint"))
      ) : (0, import_react11.createElement)(CardList, {
        items: notifications,
        t,
        settings,
        resolveText: runtime.resolveText,
        onOpenSession: runtime.openSession,
        onDismiss: runtime.dismiss
      })
    ),
    (0, import_react11.createElement)("footer", { className: "dni-popup-foot" }, t("popup.settingsHint"))
  );
}

// src/ui/theme.js
var KNOWN_TOKENS = [
  "--dsw-alias-bg-base",
  "--dsw-alias-bg-layer-1",
  "--dsw-alias-bg-layer-2",
  "--dsw-alias-bg-layer-3",
  "--dsw-alias-bg-layer-4",
  "--dsw-alias-bg-overlay",
  "--dsw-alias-bg-mask-1",
  "--dsw-alias-border-l1",
  "--dsw-alias-border-l2",
  "--dsw-alias-border-l3",
  "--dsw-alias-border-l4",
  "--dsw-alias-brand-primary",
  "--dsw-alias-label-primary",
  "--dsw-alias-label-secondary",
  "--dsw-alias-label-tertiary",
  "--dsw-alias-label-caption",
  "--dsw-alias-label-dimmed",
  "--dsw-alias-label-primary-foreground",
  "--dsw-alias-state-error-primary",
  "--dsw-alias-state-idle-primary",
  "--dsw-alias-state-success-primary",
  "--dsw-alias-state-success-tertiary",
  "--dsw-alias-state-warn-primary",
  "--dsw-alias-state-warn-secondary",
  "--dsw-alias-state-warn-tertiary",
  "--dsw-alias-interactive-bg-hover",
  "--dsw-alias-interactive-bg-hover-danger",
  "--dsw-alias-interactive-bg-active",
  "--dsw-alias-button-primary-fill",
  "--dsw-alias-button-primary-hover",
  "--dsw-alias-toast-bg",
  "--dsw-alias-toast-label",
  "--dsw-alias-scrollbar-bg-l2",
  "--dsw-alias-scrollbar-hover-l2",
  "--dsw-specific-sidebar-fill",
  "--dsh-chat-content-width",
  "--dsh-composer-side-clearance",
  "--ds-font-family",
  "--ds-font-family-code"
];
var CUSTOM_PREFIXES = ["--dsw-", "--dsh-", "--ds-"];
function collectFromStyleSheets(sourceDocument) {
  const names = /* @__PURE__ */ new Set();
  for (const sheet of Array.from(sourceDocument.styleSheets)) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    if (rules === void 0 || rules === null) continue;
    for (const rule of Array.from(rules)) {
      const style = rule.style;
      if (style === void 0 || style === null) continue;
      for (let index = 0; index < style.length; index += 1) {
        const name = style[index];
        if (CUSTOM_PREFIXES.some((prefix) => name.startsWith(prefix))) names.add(name);
      }
      if (rule.cssRules !== void 0 && rule.cssRules !== null) {
        for (const nested of Array.from(rule.cssRules)) {
          const nestedStyle = nested.style;
          if (nestedStyle === void 0 || nestedStyle === null) continue;
          for (let index = 0; index < nestedStyle.length; index += 1) {
            const name = nestedStyle[index];
            if (CUSTOM_PREFIXES.some((prefix) => name.startsWith(prefix))) names.add(name);
          }
        }
      }
    }
  }
  return names;
}
function copyThemeAttributes(sourceDocument, targetDocument) {
  const sourceRoot = sourceDocument.documentElement;
  const targetRoot = targetDocument.documentElement;
  for (const name of ["theme", "colorScheme", "color-scheme", "platform", "fontSize"]) {
    const value = sourceRoot.dataset?.[name];
    if (value !== void 0) targetRoot.dataset[name] = value;
  }
  const body = sourceDocument.body;
  const view = sourceDocument.defaultView;
  if (body !== null && view !== null) {
    const bodyStyle = view.getComputedStyle(body);
    targetDocument.body.style.fontFamily = bodyStyle.fontFamily;
    targetDocument.body.style.fontSize = bodyStyle.fontSize;
    targetDocument.body.style.color = "var(--dsw-alias-label-primary)";
    targetDocument.body.style.background = "var(--dsw-alias-bg-base)";
  }
}
function applyTheme(sourceDocument, targetDocument) {
  if (sourceDocument === void 0 || sourceDocument === null) return;
  if (targetDocument === void 0 || targetDocument === null) return;
  const sourceRoot = sourceDocument.documentElement;
  const targetRoot = targetDocument.documentElement;
  if (sourceRoot === void 0 || sourceRoot === null) return;
  if (targetRoot === void 0 || targetRoot === null) return;
  const view = sourceDocument.defaultView;
  if (view === null || view === void 0) return;
  const rootComputed = view.getComputedStyle(sourceRoot);
  const bodyComputed = sourceDocument.body === null ? rootComputed : view.getComputedStyle(sourceDocument.body);
  const names = /* @__PURE__ */ new Set([...KNOWN_TOKENS, ...collectFromStyleSheets(sourceDocument)]);
  for (const name of names) {
    const value = rootComputed.getPropertyValue(name) || bodyComputed.getPropertyValue(name);
    if (value !== void 0 && value !== null && value !== "") {
      targetRoot.style.setProperty(name, value.trim());
    }
  }
  const colorScheme = rootComputed.colorScheme || bodyComputed.colorScheme;
  if (colorScheme !== void 0 && colorScheme !== null && colorScheme !== "") {
    targetRoot.style.colorScheme = colorScheme;
  }
  copyThemeAttributes(sourceDocument, targetDocument);
}

// src/ui/styles.js
var POPUP_CSS = String.raw`
.dni-overlay {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 2147483000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: min(380px, calc(100vw - 40px));
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  pointer-events: none;
  font-family: var(--ds-font-family, inherit);
  color: var(--dsw-alias-label-primary);
  scrollbar-width: thin;
}
.dni-overlay > * { pointer-events: auto; }
.dni-card-list { display: flex; flex-direction: column; gap: 10px; }
.dni-card {
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 14px;
  background: var(--dsw-alias-bg-overlay, var(--dsw-alias-bg-layer-1));
  box-shadow: var(--dsw-shadow-lv2, 0 12px 40px rgba(0, 0, 0, 0.24));
  color: var(--dsw-alias-label-primary);
}
.dni-card-warn { border-color: var(--dsw-alias-state-warn-secondary, var(--dsw-alias-state-warn-primary)); }
.dni-card-success { border-color: var(--dsw-alias-state-success-primary); }
.dni-card-info { border-color: var(--dsw-alias-border-l1); }
.dni-card-head { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px 10px; }
.dni-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent);
  color: var(--dsw-alias-brand-primary);
}
.dni-card-warn .dni-card-icon {
  background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 16%, transparent);
  color: var(--dsw-alias-state-warn-primary);
}
.dni-card-success .dni-card-icon {
  background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 16%, transparent);
  color: var(--dsw-alias-state-success-primary);
}
.dni-card-headtext { flex: 1; min-width: 0; }
.dni-card-titleline { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.dni-card-title { font-size: 14px; font-weight: 600; line-height: 20px; }
.dni-card-subtitle {
  margin-top: 2px;
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-secondary);
  overflow-wrap: anywhere;
}
.dni-card-session {
  margin-top: 2px;
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));
}
.dni-session-link {
  display: inline-block;
  margin-top: 3px;
  padding: 0;
  border: none;
  background: none;
  color: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));
  font: inherit;
  font-size: 11px;
  line-height: 16px;
  text-align: left;
  cursor: pointer;
  overflow-wrap: anywhere;
}
.dni-session-link:hover { color: var(--dsw-alias-brand-primary); text-decoration: underline; }
.dni-card-body { padding: 0 14px 4px; }
.dni-card-actions { display: flex; gap: 8px; justify-content: flex-end; padding: 10px 14px 14px; }
.dni-card-actions-row { display: flex; gap: 8px; align-items: center; justify-content: flex-end; flex: 1; }
.dni-card-actions-wrap { flex-wrap: wrap; }
.dni-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-sizing: border-box;
  border: 1px solid transparent;
  border-radius: 9px;
  padding: 8px 12px;
  font: inherit;
  font-size: 13px;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
}
.dni-btn:disabled { opacity: 0.5; cursor: default; }
.dni-btn-sm { padding: 6px 10px; font-size: 12px; border-radius: 8px; }
.dni-btn-md { padding: 8px 12px; font-size: 13px; }
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
.dni-btn-ghost:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-2));
  color: var(--dsw-alias-label-primary);
}
.dni-btn-danger {
  background: transparent;
  border-color: var(--dsw-alias-state-error-primary);
  color: var(--dsw-alias-state-error-primary);
}
.dni-btn-danger:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover-danger, transparent);
}
.dni-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
}
.dni-icon-button:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
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
.dni-badge-neutral { }
.dni-badge-warn {
  border-color: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 35%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 12%, transparent);
  color: var(--dsw-alias-state-warn-primary);
}
.dni-badge-info {
  border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 35%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent);
  color: var(--dsw-alias-brand-primary);
}
.dni-badge-success {
  border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 35%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 12%, transparent);
  color: var(--dsw-alias-state-success-primary);
}
.dni-badge-danger {
  border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 35%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 12%, transparent);
  color: var(--dsw-alias-state-error-primary);
}
.dni-more {
  align-self: flex-end;
  padding: 4px 9px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 999px;
  background: var(--dsw-alias-bg-overlay, var(--dsw-alias-bg-layer-1));
  color: var(--dsw-alias-label-secondary);
  font-size: 11px;
  line-height: 16px;
}
.dni-overlay-foot { display: flex; justify-content: flex-end; pointer-events: auto; }
.dni-question-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 44vh;
  overflow-y: auto;
  padding: 0;
}
.dni-question { display: flex; flex-direction: column; gap: 6px; }
.dni-question-header {
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));
}
.dni-question-text { font-size: 13px; font-weight: 500; line-height: 20px; overflow-wrap: anywhere; }
.dni-question-detail {
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-secondary);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.dni-question-hint { font-size: 11px; color: var(--dsw-alias-label-secondary); }
.dni-options { display: flex; flex-direction: column; gap: 6px; }
.dni-option {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 9px;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease;
}
.dni-option:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); }
.dni-option.is-selected {
  border-color: var(--dsw-alias-brand-primary);
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent);
}
.dni-option-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 14px;
  height: 14px;
  margin-top: 2px;
  border: 1px solid var(--dsw-alias-border-l2, var(--dsw-alias-border-l1));
  border-radius: 4px;
  font-size: 10px;
  line-height: 1;
}
.dni-option.is-selected .dni-option-mark {
  border-color: transparent;
  background: var(--dsw-alias-brand-primary);
  color: var(--dsw-alias-label-primary-foreground, var(--dsw-alias-bg-base));
}
.dni-option-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.dni-option-label { font-size: 13px; line-height: 18px; overflow-wrap: anywhere; }
.dni-option-description {
  font-size: 12px;
  line-height: 16px;
  color: var(--dsw-alias-label-secondary);
  overflow-wrap: anywhere;
}
.dni-custom-row { display: flex; flex-direction: column; gap: 4px; }
.dni-custom-label { font-size: 11px; color: var(--dsw-alias-label-secondary); }
.dni-custom-row.is-active .dni-custom-label { color: var(--dsw-alias-brand-primary); }
.dni-input {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border: 1px solid var(--dsw-alias-border-l2, var(--dsw-alias-border-l1));
  border-radius: 9px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
}
.dni-input:focus {
  outline: 2px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 50%, transparent);
  outline-offset: 1px;
  border-color: var(--dsw-alias-brand-primary);
}
.dni-question-footer { display: flex; align-items: center; justify-content: flex-end; gap: 10px; }
.dni-question-skipped { font-size: 11px; color: var(--dsw-alias-label-secondary); }
.dni-link-button {
  padding: 0;
  border: none;
  background: none;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.dni-link-button:hover:not(:disabled) { color: var(--dsw-alias-brand-primary); text-decoration: underline; }
.dni-link-button:disabled { opacity: 0.55; cursor: default; }
.dni-countdown { font-size: 11px; color: var(--dsw-alias-label-secondary); margin-right: auto; }
.dni-plan {
  margin: 0;
  padding: 10px 12px;
  max-height: 36vh;
  overflow: auto;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 9px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-secondary);
  font-family: var(--ds-font-family-code, ui-monospace, monospace);
  font-size: 12px;
  line-height: 18px;
  white-space: pre-wrap;
  word-break: break-word;
}
.dni-error {
  margin: 8px 0 0;
  padding: 8px 10px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 12%, transparent);
  color: var(--dsw-alias-state-error-primary);
  font-size: 12px;
  line-height: 18px;
}
.dni-success {
  margin: 8px 0 0;
  padding: 8px 10px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 12%, transparent);
  color: var(--dsw-alias-state-success-primary);
  font-size: 12px;
  line-height: 18px;
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
.dni-hint { font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
.dni-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 760px;
  padding: 4px 0 40px;
  color: var(--dsw-alias-label-primary);
}
.dni-settings-head { display: flex; align-items: flex-start; gap: 12px; }
.dni-settings-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent);
  color: var(--dsw-alias-brand-primary);
}
.dni-settings-headtext { min-width: 0; }
.dni-settings-title { margin: 0; font-size: 20px; font-weight: 600; line-height: 28px; }
.dni-settings-description {
  margin: 4px 0 0;
  max-width: 620px;
  color: var(--dsw-alias-label-secondary);
  font-size: 13px;
  line-height: 20px;
}
.dni-statusbar { display: flex; flex-wrap: wrap; gap: 8px; }
.dni-section {
  overflow: hidden;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 14px;
  background: var(--dsw-alias-bg-layer-1);
}
.dni-section-title {
  margin: 0;
  padding: 12px 16px 0;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
}
.dni-section-body { display: flex; flex-direction: column; }
.dni-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  border-top: 1px solid var(--dsw-alias-border-l1);
}
.dni-section-title + .dni-section-body .dni-field:first-child { border-top: none; }
.dni-field-text { min-width: 0; }
.dni-field-label { font-size: 13px; font-weight: 500; line-height: 20px; }
.dni-field-hint {
  margin-top: 2px;
  color: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));
  font-size: 12px;
  line-height: 18px;
}
.dni-field-control { display: flex; align-items: center; gap: 8px; flex: none; }
.dni-inline { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dni-value { min-width: 30px; color: var(--dsw-alias-label-secondary); font-size: 12px; text-align: right; }
.dni-switch {
  position: relative;
  width: 40px;
  height: 22px;
  padding: 0;
  border: 1px solid var(--dsw-alias-border-l2, var(--dsw-alias-border-l1));
  border-radius: 999px;
  background: var(--dsw-alias-bg-layer-2);
  cursor: pointer;
  transition: background-color 140ms ease, border-color 140ms ease;
  flex: none;
}
.dni-switch.is-on { border-color: transparent; background: var(--dsw-alias-brand-primary); }
.dni-switch-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--dsw-alias-label-secondary);
  transition: transform 140ms ease, background-color 140ms ease;
}
.dni-switch.is-on .dni-switch-knob {
  transform: translateX(18px);
  background: var(--dsw-alias-label-primary-foreground, var(--dsw-alias-bg-base));
}
.dni-select {
  padding: 6px 8px;
  border: 1px solid var(--dsw-alias-border-l2, var(--dsw-alias-border-l1));
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 12px;
}
.dni-slider { width: 140px; accent-color: var(--dsw-alias-brand-primary); }
.dni-test-grid { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px 16px 0; }
.dni-section-body > .dni-hint { padding: 8px 16px 12px; }
.dni-settings .dni-section-body > .dni-inline { padding: 12px 16px; }
.dni-settings .dni-section-body > .dni-inline + .dni-hint { padding-top: 0; }
.dni-divider { height: 1px; background: var(--dsw-alias-border-l1); }
.dni-popup-body {
  margin: 0;
  height: 100%;
  overflow: hidden;
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font-family: var(--ds-font-family, inherit);
  font-size: 13px;
}
.dni-popup-root { height: 100%; }
.dni-popup { display: flex; flex-direction: column; height: 100%; box-sizing: border-box; }
.dni-popup-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
}
.dni-popup-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent);
  color: var(--dsw-alias-brand-primary);
}
.dni-popup-headtext { flex: 1; min-width: 0; }
.dni-popup-title { font-size: 14px; font-weight: 600; line-height: 20px; }
.dni-popup-subtitle {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 2px;
  color: var(--dsw-alias-label-secondary);
  font-size: 11px;
  line-height: 16px;
}
.dni-popup-backend { color: var(--dsw-alias-brand-primary); }
.dni-popup-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  padding: 14px;
  scrollbar-width: thin;
}
.dni-popup-list .dni-card { box-shadow: none; }
.dni-popup-foot {
  padding: 10px 14px;
  border-top: 1px solid var(--dsw-alias-border-l1);
  color: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));
  font-size: 11px;
  line-height: 16px;
}
.dni-empty { margin: auto; padding: 24px 12px; text-align: center; }
.dni-empty-title { font-size: 14px; font-weight: 500; }
.dni-empty-hint {
  margin-top: 6px;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 18px;
}
.dni-btn:focus-visible,
.dni-switch:focus-visible,
.dni-option:focus-visible,
.dni-input:focus-visible,
.dni-link-button:focus-visible,
.dni-icon-button:focus-visible,
.dni-select:focus-visible,
.dni-slider:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 2px;
}
@media (max-width: 640px) {
  .dni-overlay { right: 10px; left: 10px; bottom: 10px; width: auto; }
  .dni-field { flex-direction: column; align-items: flex-start; }
  .dni-field-control { width: 100%; justify-content: flex-start; }
  .dni-slider { width: 100%; }
  .dni-question-body { max-height: 40vh; }
}
@media (prefers-reduced-motion: reduce) {
  .dni-btn, .dni-option, .dni-switch, .dni-switch-knob { transition: none; }
}
`;

// src/state/popup.js
var WINDOW_NAME = "dsh-notify-interactive";
function windowFeatures() {
  const screen = globalThis.screen;
  const width = 420;
  const height = 640;
  const left = typeof screen?.availWidth === "number" ? Math.max(0, screen.availWidth - width - 24) : 120;
  const top = typeof screen?.availHeight === "number" ? Math.max(0, Math.min(120, screen.availHeight - height - 80)) : 120;
  return `popup=yes,resizable=yes,width=${width},height=${height},left=${left},top=${top}`;
}
function createPopupController(options = {}) {
  const sourceDocument = options.document ?? globalThis.document;
  const css = options.css ?? POPUP_CSS;
  const translate2 = options.translate ?? ((key) => key);
  const onOpen = options.onOpen;
  const onClose = options.onClose;
  const listeners = /* @__PURE__ */ new Set();
  let win = null;
  let root = null;
  let backend = "inpage";
  let error = null;
  let watchdog = null;
  let opening = false;
  let snapshot = { open: false, backend, error };
  function isOpen() {
    return win !== null && win.closed !== true;
  }
  function publish() {
    const next = { open: isOpen(), backend, error };
    if (next.open !== snapshot.open || next.backend !== snapshot.backend || next.error !== snapshot.error) {
      snapshot = next;
      for (const listener of listeners) {
        try {
          listener();
        } catch {
        }
      }
    }
  }
  function stopWatch() {
    if (watchdog !== null) {
      clearInterval(watchdog);
      watchdog = null;
    }
  }
  function startWatch() {
    stopWatch();
    watchdog = setInterval(() => {
      if (win !== null && win.closed === true) handleClosed(win);
    }, 1e3);
  }
  function prepare(targetWindow) {
    const doc = targetWindow.document;
    if (doc === void 0 || doc === null) throw new Error("popup document is unavailable");
    const rootElement = doc.documentElement;
    if (rootElement === null || rootElement === void 0) throw new Error("popup documentElement is unavailable");
    let head = doc.head;
    if (head === null || head === void 0) {
      head = doc.createElement("head");
      rootElement.append(head);
    }
    let body = doc.body;
    if (body === null || body === void 0) {
      body = doc.createElement("body");
      rootElement.append(body);
    }
    doc.title = translate2("popup.title");
    head.replaceChildren();
    const meta = doc.createElement("meta");
    meta.setAttribute("charset", "utf-8");
    head.append(meta);
    const viewport = doc.createElement("meta");
    viewport.setAttribute("name", "viewport");
    viewport.setAttribute("content", "width=device-width, initial-scale=1");
    head.append(viewport);
    const style = doc.createElement("style");
    style.setAttribute("data-plugin", "dsh-notify-interactive");
    style.textContent = css;
    head.append(style);
    body.replaceChildren();
    body.className = "dni-popup-body";
    body.style.margin = "0";
    body.style.height = "100%";
    body.style.overflow = "hidden";
    rootElement.style.height = "100%";
    const container = doc.createElement("div");
    container.className = "dni-popup-root";
    body.append(container);
    try {
      applyTheme(sourceDocument, doc);
    } catch {
    }
    root = (0, import_client.createRoot)(container);
    root.render((0, import_react12.createElement)(PopupApp));
    targetWindow.addEventListener("pagehide", () => handleClosed(targetWindow));
    targetWindow.addEventListener("beforeunload", () => handleClosed(targetWindow));
    try {
      targetWindow.focus();
    } catch {
    }
  }
  function handleClosed(targetWindow) {
    if (win !== targetWindow) return;
    const currentRoot = root;
    win = null;
    root = null;
    backend = "inpage";
    stopWatch();
    try {
      currentRoot?.unmount?.();
    } catch {
    }
    publish();
    onClose?.();
  }
  async function open() {
    if (isOpen()) {
      try {
        win.focus();
      } catch {
      }
      return snapshot;
    }
    if (opening) return snapshot;
    opening = true;
    try {
      error = null;
      let candidate = null;
      let nextBackend = "inpage";
      const pictureInPicture = globalThis.documentPictureInPicture;
      if (pictureInPicture !== void 0 && typeof pictureInPicture.requestWindow === "function") {
        try {
          candidate = await pictureInPicture.requestWindow({ width: 420, height: 640 });
          nextBackend = "pip";
        } catch {
          candidate = null;
        }
      }
      if (candidate === null) {
        try {
          candidate = globalThis.open("", WINDOW_NAME, windowFeatures());
        } catch {
          candidate = null;
        }
        nextBackend = candidate === null ? "inpage" : "window";
      }
      if (candidate === null) {
        error = "blocked";
        backend = "inpage";
        publish();
        onClose?.();
        return snapshot;
      }
      win = candidate;
      backend = nextBackend;
      try {
        prepare(candidate);
      } catch {
        error = "blocked";
        try {
          candidate.close?.();
        } catch {
        }
        win = null;
        root = null;
        backend = "inpage";
        publish();
        onClose?.();
        return snapshot;
      }
      startWatch();
      onOpen?.();
      publish();
      return snapshot;
    } finally {
      opening = false;
    }
  }
  function close() {
    const currentWindow = win;
    const currentRoot = root;
    win = null;
    root = null;
    backend = "inpage";
    stopWatch();
    try {
      currentRoot?.unmount?.();
    } catch {
    }
    try {
      currentWindow?.close?.();
    } catch {
    }
    publish();
    onClose?.();
  }
  function focus() {
    if (!isOpen()) return;
    try {
      win.focus();
    } catch {
    }
  }
  function syncTheme() {
    if (!isOpen()) return;
    try {
      applyTheme(sourceDocument, win.document);
    } catch {
    }
  }
  function syncTitle() {
    if (!isOpen()) return;
    try {
      win.document.title = translate2("popup.title");
    } catch {
    }
  }
  function dispose() {
    close();
    listeners.clear();
  }
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    open,
    close,
    focus,
    syncTheme,
    syncTitle,
    isOpen,
    dispose
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
function renderPresetToDataUrl(preset) {
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
  const normalize = peak > 0 ? 0.92 / peak : 0;
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

// src/system/notify.js
var BODY_LIMIT = 200;
function truncate(value, limit = BODY_LIMIT) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, Math.max(0, limit - 1))}\u2026`;
}
function createSystemNotifier() {
  const active = /* @__PURE__ */ new Map();
  const supported = typeof globalThis.Notification === "function";
  function permission() {
    if (!supported) return "unsupported";
    return globalThis.Notification.permission;
  }
  async function requestPermission() {
    if (!supported) return "unsupported";
    try {
      return await globalThis.Notification.requestPermission();
    } catch {
      return "default";
    }
  }
  function show({ title, body, tag, kind, onClick }) {
    if (!supported || globalThis.Notification.permission !== "granted") return null;
    const key = tag === void 0 || tag === null ? `${Date.now()}:${Math.random()}` : String(tag);
    try {
      const notification = new globalThis.Notification(String(title), {
        body: truncate(body),
        tag: key,
        // Keep completion toasts in the notification center as well, so an
        // away user who returns later can still see what happened. Browsers
        // and the OS treat this as a hint, not a guarantee.
        requireInteraction: true,
        silent: true
      });
      notification.onclick = () => {
        try {
          globalThis.focus?.();
        } catch {
        }
        try {
          onClick?.();
        } catch {
        }
        try {
          notification.close?.();
        } catch {
        }
      };
      notification.onclose = () => {
        active.delete(key);
      };
      active.set(key, notification);
      return notification;
    } catch {
      return null;
    }
  }
  function closeAll() {
    for (const notification of active.values()) {
      try {
        notification.close?.();
      } catch {
      }
    }
    active.clear();
  }
  return { supported, permission, requestPermission, show, closeAll };
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
function scenarioForInteraction(interaction) {
  if (interaction?.kind === "approval") return "approval";
  if (interaction?.kind === "plan-review") return "planReview";
  return "question";
}
function isAttended({
  visibility,
  focused,
  mainSessionId,
  sessionId,
  suppressWhenFocused
}) {
  return Boolean(
    suppressWhenFocused && focused && visibility === "visible" && mainSessionId !== void 0 && String(mainSessionId) === String(sessionId)
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
  const scenario = settings?.scenarios?.[scenarioKey] ?? { sound: true, popup: true, system: true };
  const attended = isAttended({
    visibility,
    focused,
    mainSessionId,
    sessionId,
    suppressWhenFocused: settings?.behavior?.suppressWhenFocused !== false
  });
  const enabled = settings?.enabled !== false && !attended;
  const pageActive = Boolean(focused && visibility === "visible");
  return {
    attended,
    pageActive,
    sound: enabled && settings?.sound?.enabled !== false && scenario.sound !== false,
    popup: enabled && settings?.popup?.enabled !== false && scenario.popup !== false,
    // A Windows toast while the user is looking at DSH duplicates the in-page
    // card; the popup-open check is applied by the engine as well.
    system: enabled && !pageActive && settings?.system?.enabled !== false && scenario.system !== false
  };
}

// src/engine/engine.js
var COMPLETION_COOLDOWN_MS = 2e3;
var BODY_LIMIT2 = 200;
function truncate2(value, limit = BODY_LIMIT2) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, Math.max(0, limit - 1))}\u2026`;
}
function createEngine(options) {
  const {
    settingsStore,
    notificationStore,
    soundPlayer,
    systemNotifier,
    translate: translate2,
    resolveText,
    getVisibility,
    getFocused,
    isPopupOpen = () => false,
    onActivate,
    now = () => Date.now()
  } = options;
  let previous = /* @__PURE__ */ new Map();
  let lastStatus = null;
  let lastSessions = null;
  const completionSequence = /* @__PURE__ */ new Map();
  const completionCooldown = /* @__PURE__ */ new Map();
  const t = (key, vars) => translate2(key, vars);
  const visibility = () => typeof getVisibility === "function" ? getVisibility() : "visible";
  const focused = () => typeof getFocused === "function" ? Boolean(getFocused()) : false;
  function systemTitle(kind) {
    if (kind === "approval") return t("notify.approval.title");
    if (kind === "plan-review") return t("notify.plan.title");
    if (kind === "completion") return t("notify.completion.title");
    return t("notify.question.title");
  }
  function interactionBody(interaction, sessionTitle) {
    if (interaction?.kind === "approval") {
      const reason = interaction.displayReason !== void 0 && typeof resolveText === "function" ? resolveText(interaction.displayReason) : interaction.reason;
      return truncate2([sessionTitle, interaction.toolName, reason].filter(Boolean).join(" \xB7 "));
    }
    const question = interaction?.questions?.[0]?.question;
    return truncate2([sessionTitle, question].filter(Boolean).join(" \xB7 "));
  }
  function scenarioOf2(kind) {
    if (kind === "approval") return "approval";
    if (kind === "plan-review") return "planReview";
    if (kind === "completion") return "completion";
    return "question";
  }
  function notifySystem(kind, title, body, sessionId) {
    if (systemNotifier === void 0 || systemNotifier === null) return;
    systemNotifier.show({
      title,
      body,
      tag: `${sessionId}:${kind}`,
      kind,
      onClick: () => {
        try {
          onActivate?.(sessionId, kind);
        } catch {
        }
      }
    });
  }
  function handleInteraction(event, settings, sessionList, mainSessionId) {
    const interaction = event.interaction;
    const kind = interaction?.kind === "approval" ? "approval" : interaction?.kind === "plan-review" ? "plan-review" : "question";
    const scenarioKey = scenarioForInteraction(interaction);
    const sessionId = String(event.sessionId);
    const sessionTitle = sessionTitleOf(sessionList, sessionId);
    if (!settings.behavior.includeSubagents && isSubagentSession(sessionList, sessionId)) return;
    const gate = gateChannels({
      settings,
      scenarioKey,
      sessionId,
      mainSessionId,
      visibility: visibility(),
      focused: focused()
    });
    if (!gate.sound && !gate.popup && !gate.system) return;
    const id = interactionNotificationId(sessionId, interaction.key);
    if (gate.popup) {
      notificationStore.upsert({
        id,
        kind,
        scenario: scenarioKey,
        sessionId,
        sessionTitle,
        interaction,
        sticky: true,
        demo: false
      });
    }
    if (gate.sound && settings.sound.preset !== "none") {
      soundPlayer?.play?.(settings.sound.preset, settings.sound.volume);
    }
    if (gate.system && !isPopupOpen()) {
      notifySystem(kind, systemTitle(kind), interactionBody(interaction, sessionTitle), sessionId);
    }
  }
  function handleCompletion(event, settings, sessionList, mainSessionId) {
    const sessionId = String(event.sessionId);
    const timestamp = now();
    const last = completionCooldown.get(sessionId);
    if (last !== void 0 && timestamp - last < COMPLETION_COOLDOWN_MS) return;
    if (!settings.behavior.includeSubagents && isSubagentSession(sessionList, sessionId)) return;
    const gate = gateChannels({
      settings,
      scenarioKey: "completion",
      sessionId,
      mainSessionId,
      visibility: visibility(),
      focused: focused()
    });
    if (!gate.sound && !gate.popup && !gate.system) return;
    completionCooldown.set(sessionId, timestamp);
    const sequence = (completionSequence.get(sessionId) ?? 0) + 1;
    completionSequence.set(sessionId, sequence);
    const sessionTitle = sessionTitleOf(sessionList, sessionId);
    const id = completionNotificationId(sessionId, sequence);
    if (gate.popup) {
      notificationStore.removeWhere(
        (item) => item.sessionId === sessionId && item.kind === "completion"
      );
      notificationStore.upsert({
        id,
        kind: "completion",
        scenario: "completion",
        sessionId,
        sessionTitle,
        sticky: false,
        completedAt: timestamp,
        demo: false
      });
    }
    if (gate.sound && settings.sound.preset !== "none") {
      soundPlayer?.play?.(settings.sound.preset, settings.sound.volume);
    }
    if (gate.system && !isPopupOpen()) {
      notifySystem(
        "completion",
        systemTitle("completion"),
        truncate2([sessionTitle, t("notify.completion.body")].filter(Boolean).join(" \xB7 ")),
        sessionId
      );
    }
  }
  function clearInteractionCard(sessionId, interactionKey) {
    notificationStore.remove(interactionNotificationId(sessionId, interactionKey));
  }
  function reconcileInteractions(statusMap) {
    const snapshot = notificationStore.getSnapshot();
    for (const item of snapshot) {
      if (item.demo === true) continue;
      if (item.kind !== "approval" && item.kind !== "question" && item.kind !== "plan-review") continue;
      const status = statusMap.get(item.sessionId);
      if (status === void 0) continue;
      const pending = status.pendingInteraction;
      const currentKey = pending?.key ?? null;
      const cardKey = item.interaction?.key ?? null;
      if (pending === void 0 || pending === null || currentKey !== cardKey) {
        notificationStore.remove(item.id);
        continue;
      }
      if (pending !== item.interaction) {
        notificationStore.update(item.id, { interaction: pending });
      }
    }
  }
  function ingest(status, sessionList) {
    if (status === lastStatus && sessionList === lastSessions) return;
    lastStatus = status;
    lastSessions = sessionList;
    const settings = settingsStore.getSnapshot();
    if (!settings.enabled) {
      previous = /* @__PURE__ */ new Map();
      notificationStore.clear();
      return;
    }
    const statusMap = status instanceof Map ? status : /* @__PURE__ */ new Map();
    const mainSessionId = findMainSessionId(sessionList);
    const { next, events } = diffSessionStatus(previous, statusMap);
    previous = next;
    reconcileInteractions(statusMap);
    for (const event of events) {
      if (event.type === "interaction") {
        handleInteraction(event, settings, sessionList, mainSessionId);
      } else if (event.type === "completion") {
        handleCompletion(event, settings, sessionList, mainSessionId);
      } else if (event.type === "interaction-cleared") {
        clearInteractionCard(event.sessionId, event.interactionKey);
      } else if (event.type === "session-removed") {
        notificationStore.removeSession(event.sessionId);
        completionCooldown.delete(event.sessionId);
        completionSequence.delete(event.sessionId);
      }
    }
  }
  function reset() {
    previous = /* @__PURE__ */ new Map();
    lastStatus = null;
    lastSessions = null;
  }
  function dispose() {
    previous = /* @__PURE__ */ new Map();
    lastStatus = null;
    lastSessions = null;
    completionCooldown.clear();
    completionSequence.clear();
  }
  return { ingest, reset, dispose };
}

// src/ui/Overlay.jsx
var import_react13 = require("react");
function Overlay() {
  const settings = useStore(runtime.settingsStore);
  const notifications = useStore(runtime.notificationStore);
  const popup = useStore(runtime.popupController);
  const surface = useStore(runtime.surfaceStore);
  const { t } = useLocale(runtime.ctx);
  if (!settings?.enabled) return null;
  if (!settings.popup.enabled) return null;
  if (popup?.open === true || surface === "popup") return null;
  const maxVisible = Math.max(1, settings.behavior.maxVisibleCards);
  const visible = notifications.slice(-maxVisible);
  const hidden = notifications.length - visible.length;
  return (0, import_react13.createElement)(
    "div",
    { className: "dni-overlay", "aria-live": "polite" },
    notifications.length > 0 ? [
      hidden > 0 ? (0, import_react13.createElement)("div", { key: "more", className: "dni-more" }, t("popup.more", { count: hidden })) : null,
      (0, import_react13.createElement)(CardList, {
        key: "cards",
        items: visible,
        t,
        settings,
        resolveText: runtime.resolveText,
        onOpenSession: runtime.openSession,
        onDismiss: runtime.dismiss
      }),
      settings.popup.enabled ? (0, import_react13.createElement)(
        "div",
        { key: "open", className: "dni-overlay-foot" },
        (0, import_react13.createElement)(Button, {
          variant: "ghost",
          size: "sm",
          onClick: () => {
            Promise.resolve(runtime.openPopup()).catch(() => {
            });
          }
        }, (0, import_react13.createElement)(BellIcon, { size: 14 }), t("settings.popupOpen"))
      ) : null
    ] : null
  );
}

// src/ui/Settings.jsx
var import_react14 = require("react");
var PERMISSION_TONE = {
  granted: "success",
  denied: "danger",
  default: "warn",
  unsupported: "neutral"
};
function Settings() {
  const settings = useStore(runtime.settingsStore);
  const notifications = useStore(runtime.notificationStore);
  const popup = useStore(runtime.popupController);
  const { t } = useLocale(runtime.ctx);
  const storeStatus = runtime.settingsStore.getStatus();
  const [permission, setPermission] = (0, import_react14.useState)(() => runtime.systemNotifier?.permission?.() ?? "unsupported");
  const [audioReady, setAudioReady] = (0, import_react14.useState)(() => runtime.soundPlayer?.isReady?.() ?? false);
  const [previewStatus, setPreviewStatus] = (0, import_react14.useState)(null);
  const [resetDone, setResetDone] = (0, import_react14.useState)(false);
  (0, import_react14.useEffect)(() => {
    setPreviewStatus(null);
    setAudioReady(runtime.soundPlayer?.isReady?.() ?? false);
  }, [settings.sound.enabled, settings.sound.preset]);
  const main = runtime.getMainSession?.() ?? { id: void 0, title: void 0 };
  const mainSessionId = main.id;
  const mainTitle = main.title;
  const update = (patch) => runtime.settingsStore.update(patch);
  const soundOptions = SOUND_PRESET_IDS.map((id) => ({ value: id, label: t(`sound.${id}`) }));
  const permissionLabel = t(`settings.permission${permission === "granted" ? "Granted" : permission === "denied" ? "Denied" : permission === "unsupported" ? "Unsupported" : "Default"}`);
  const backendLabel = t(`popup.backend${popup.backend === "pip" ? "Pip" : popup.backend === "window" ? "Window" : "Inpage"}`);
  async function previewSound() {
    try {
      const result = await runtime.previewSound(settings.sound.preset, settings.sound.volume);
      setPreviewStatus(result);
      setAudioReady(
        result === "played" || result === "fallback" || (runtime.soundPlayer?.isReady?.() ?? false)
      );
    } catch {
      setPreviewStatus("blocked");
    }
  }
  async function authorize() {
    const result = await runtime.requestNotificationPermission();
    setPermission(result);
    if (result === "granted") runtime.testSystemNotification();
  }
  async function testNotification() {
    if (permission !== "granted") {
      const result = await runtime.requestNotificationPermission();
      setPermission(result);
      if (result !== "granted") return;
    }
    runtime.testSystemNotification();
  }
  async function openPopup() {
    try {
      await runtime.openPopup();
    } catch {
    }
  }
  function addDemo(kind) {
    runtime.addDemo(kind, { sessionId: mainSessionId, sessionTitle: mainTitle });
    openPopup();
  }
  function reset() {
    runtime.resetSettings();
    setResetDone(true);
  }
  const warnings = [];
  if (storeStatus.storageError === "read") warnings.push(t("settings.storageReadError"));
  if (storeStatus.storageError === "write") warnings.push(t("settings.storageWriteError"));
  if (storeStatus.storageAvailable === false) warnings.push(t("settings.storageUnavailable"));
  if (popup.error === "blocked") warnings.push(t("settings.popupBlocked"));
  return (0, import_react14.createElement)(
    "div",
    { className: "dni-settings" },
    (0, import_react14.createElement)(
      "header",
      { className: "dni-settings-head" },
      (0, import_react14.createElement)("div", { className: "dni-settings-mark", "aria-hidden": true }, (0, import_react14.createElement)(BellIcon, { size: 22 })),
      (0, import_react14.createElement)(
        "div",
        { className: "dni-settings-headtext" },
        (0, import_react14.createElement)("h2", { className: "dni-settings-title" }, t("settings.title")),
        (0, import_react14.createElement)("p", { className: "dni-settings-description" }, t("settings.description"))
      )
    ),
    warnings.map((warning, index) => (0, import_react14.createElement)("div", { key: `warning-${index}`, className: "dni-warning" }, warning)),
    (0, import_react14.createElement)(
      "div",
      { className: "dni-statusbar" },
      (0, import_react14.createElement)(Badge, { tone: "neutral" }, `${t("settings.active")}: ${notifications.length}`),
      (0, import_react14.createElement)(Badge, { tone: "neutral" }, `${t("settings.backend")}: ${backendLabel}`),
      (0, import_react14.createElement)(Badge, { tone: PERMISSION_TONE[permission] ?? "neutral" }, `${t("settings.permission")}: ${permissionLabel}`),
      (0, import_react14.createElement)(Badge, { tone: audioReady ? "success" : "warn" }, `${t("settings.audio")}: ${audioReady ? t("settings.audioReady") : t("settings.audioBlocked")}`)
    ),
    (0, import_react14.createElement)(
      Section,
      { title: t("settings.master") },
      (0, import_react14.createElement)(
        Field,
        { label: t("settings.master"), hint: t("settings.masterHint") },
        (0, import_react14.createElement)(Switch, {
          checked: settings.enabled,
          label: t("settings.master"),
          onChange: (value) => update({ enabled: value })
        })
      )
    ),
    (0, import_react14.createElement)(
      Section,
      { title: t("settings.sound") },
      (0, import_react14.createElement)(
        Field,
        { label: t("settings.soundEnabled"), hint: t("settings.soundHint") },
        (0, import_react14.createElement)(Switch, {
          checked: settings.sound.enabled,
          label: t("settings.soundEnabled"),
          onChange: (value) => update({ sound: { enabled: value } })
        })
      ),
      (0, import_react14.createElement)(
        Field,
        { label: t("settings.preset") },
        (0, import_react14.createElement)(Select, {
          value: settings.sound.preset,
          label: t("settings.preset"),
          options: soundOptions,
          onChange: (value) => update({ sound: { preset: value } })
        })
      ),
      (0, import_react14.createElement)(
        Field,
        { label: t("settings.volume") },
        (0, import_react14.createElement)(
          "div",
          { className: "dni-inline" },
          (0, import_react14.createElement)(Slider, {
            value: settings.sound.volume,
            min: 0,
            max: 1,
            step: 0.05,
            label: t("settings.volume"),
            onChange: (value) => update({ sound: { volume: value } })
          }),
          (0, import_react14.createElement)(Button, { variant: "outline", size: "sm", onClick: previewSound }, t("settings.preview")),
          previewStatus === null ? null : (0, import_react14.createElement)(Badge, {
            tone: previewStatus === "played" || previewStatus === "fallback" ? "success" : previewStatus === "silent" ? "neutral" : "danger"
          }, t(`settings.preview${previewStatus === "played" ? "Played" : previewStatus === "fallback" ? "Fallback" : previewStatus === "silent" ? "Silent" : previewStatus === "unsupported" ? "Unsupported" : "Blocked"}`))
        )
      )
    ),
    (0, import_react14.createElement)(
      Section,
      { title: t("settings.popup") },
      (0, import_react14.createElement)(
        Field,
        { label: t("settings.popupEnabled"), hint: t("settings.popupHint") },
        (0, import_react14.createElement)(Switch, {
          checked: settings.popup.enabled,
          label: t("settings.popupEnabled"),
          onChange: (value) => update({ popup: { enabled: value } })
        })
      ),
      (0, import_react14.createElement)(
        Field,
        { label: t("settings.popupBackend") },
        (0, import_react14.createElement)(
          "div",
          { className: "dni-inline" },
          (0, import_react14.createElement)(Badge, { tone: popup.backend === "pip" ? "success" : "neutral" }, backendLabel),
          (0, import_react14.createElement)(Button, {
            variant: "outline",
            size: "sm",
            onClick: popup.open ? () => runtime.closePopup() : openPopup
          }, popup.open ? t("settings.popupClose") : t("settings.popupOpen")),
          (0, import_react14.createElement)(Button, {
            variant: "ghost",
            size: "sm",
            onClick: () => addDemo("approval")
          }, t("settings.popupTest"))
        )
      ),
      typeof globalThis.documentPictureInPicture?.requestWindow !== "function" ? (0, import_react14.createElement)("div", { className: "dni-hint" }, t("settings.popupUnsupported")) : null
    ),
    (0, import_react14.createElement)(
      Section,
      { title: t("settings.system") },
      (0, import_react14.createElement)(
        Field,
        { label: t("settings.systemEnabled"), hint: t("settings.systemHint") },
        (0, import_react14.createElement)(Switch, {
          checked: settings.system.enabled,
          label: t("settings.systemEnabled"),
          onChange: (value) => update({ system: { enabled: value } })
        })
      ),
      (0, import_react14.createElement)(
        Field,
        { label: t("settings.permission") },
        (0, import_react14.createElement)(
          "div",
          { className: "dni-inline" },
          (0, import_react14.createElement)(Badge, { tone: PERMISSION_TONE[permission] ?? "neutral" }, permissionLabel),
          (0, import_react14.createElement)(Button, {
            variant: "outline",
            size: "sm",
            onClick: authorize,
            disabled: permission === "unsupported" || permission === "granted"
          }, t("settings.authorize")),
          (0, import_react14.createElement)(Button, {
            variant: "ghost",
            size: "sm",
            onClick: testNotification,
            disabled: permission === "unsupported"
          }, t("settings.testNotification"))
        )
      )
    ),
    (0, import_react14.createElement)(
      Section,
      { title: t("settings.behavior") },
      (0, import_react14.createElement)(
        Field,
        {
          label: t("settings.suppressWhenFocused"),
          hint: t("settings.suppressWhenFocusedHint")
        },
        (0, import_react14.createElement)(Switch, {
          checked: settings.behavior.suppressWhenFocused,
          label: t("settings.suppressWhenFocused"),
          onChange: (value) => update({ behavior: { suppressWhenFocused: value } })
        })
      ),
      (0, import_react14.createElement)(
        Field,
        {
          label: t("settings.includeSubagents"),
          hint: t("settings.includeSubagentsHint")
        },
        (0, import_react14.createElement)(Switch, {
          checked: settings.behavior.includeSubagents,
          label: t("settings.includeSubagents"),
          onChange: (value) => update({ behavior: { includeSubagents: value } })
        })
      ),
      (0, import_react14.createElement)(
        Field,
        {
          label: t("settings.autoDismiss"),
          hint: t("settings.autoDismissHint")
        },
        (0, import_react14.createElement)(
          "div",
          { className: "dni-inline" },
          (0, import_react14.createElement)(Slider, {
            value: settings.behavior.completionAutoDismissMs / 1e3,
            min: 0,
            max: 30,
            step: 1,
            label: t("settings.autoDismiss"),
            onChange: (value) => update({ behavior: { completionAutoDismissMs: Math.round(value * 1e3) } })
          }),
          (0, import_react14.createElement)("span", { className: "dni-value" }, `${Math.round(settings.behavior.completionAutoDismissMs / 1e3)}${t("settings.seconds")}`)
        )
      ),
      (0, import_react14.createElement)(
        Field,
        {
          label: t("settings.maxCards"),
          hint: t("settings.maxCardsHint")
        },
        (0, import_react14.createElement)(
          "div",
          { className: "dni-inline" },
          (0, import_react14.createElement)(Slider, {
            value: settings.behavior.maxVisibleCards,
            min: 1,
            max: 5,
            step: 1,
            label: t("settings.maxCards"),
            onChange: (value) => update({ behavior: { maxVisibleCards: Math.round(value) } })
          }),
          (0, import_react14.createElement)("span", { className: "dni-value" }, String(settings.behavior.maxVisibleCards))
        )
      )
    ),
    (0, import_react14.createElement)(
      Section,
      { title: t("settings.tests") },
      (0, import_react14.createElement)(
        "div",
        { className: "dni-test-grid" },
        (0, import_react14.createElement)(
          Button,
          { variant: "outline", size: "sm", onClick: () => addDemo("approval") },
          (0, import_react14.createElement)(AlertIcon, { size: 14 }),
          t("settings.testApproval")
        ),
        (0, import_react14.createElement)(
          Button,
          { variant: "outline", size: "sm", onClick: () => addDemo("question") },
          (0, import_react14.createElement)(QuestionIcon, { size: 14 }),
          t("settings.testQuestion")
        ),
        (0, import_react14.createElement)(
          Button,
          { variant: "outline", size: "sm", onClick: () => addDemo("completion") },
          (0, import_react14.createElement)(CheckIcon, { size: 14 }),
          t("settings.testCompletion")
        )
      ),
      (0, import_react14.createElement)("div", { className: "dni-hint" }, t("settings.testsHint")),
      mainSessionId !== void 0 ? (0, import_react14.createElement)("div", { className: "dni-hint" }, `${t("card.openSession")}: ${mainTitle}`) : null
    ),
    (0, import_react14.createElement)(
      Section,
      { title: t("settings.reset") },
      (0, import_react14.createElement)(
        "div",
        { className: "dni-inline" },
        (0, import_react14.createElement)(Button, { variant: "danger", size: "sm", onClick: reset }, t("settings.reset")),
        resetDone ? (0, import_react14.createElement)(Badge, { tone: "success" }, t("settings.resetDone")) : null
      ),
      (0, import_react14.createElement)("div", { className: "dni-hint" }, t("settings.resetHint"))
    )
  );
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
  const notificationStore = createNotificationStore();
  const soundPlayer = createSoundPlayer();
  const systemNotifier = createSystemNotifier();
  const popupController = createPopupController({
    document: globalThis.document,
    css: POPUP_CSS,
    translate: translate2,
    onOpen: () => runtime.setSurface("popup"),
    onClose: () => runtime.setSurface("inpage")
  });
  function openSession(sessionId) {
    try {
      globalThis.focus?.();
    } catch {
    }
    try {
      const workspace = ctx.get("uiWorkspace");
      if (workspace !== void 0 && typeof workspace.openSession === "function") {
        workspace.openSession(sessionId);
      }
    } catch {
    }
  }
  const engine = createEngine({
    settingsStore,
    notificationStore,
    soundPlayer,
    systemNotifier,
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
    isPopupOpen: () => runtime.surfaceStore.isPopup(),
    onActivate: (sessionId) => {
      openSession(sessionId);
      if (settingsStore.getSnapshot().popup.enabled && !popupController.isOpen()) {
        popupController.open().catch(() => {
        });
      }
    }
  });
  runtime.settingsStore = settingsStore;
  runtime.notificationStore = notificationStore;
  runtime.soundPlayer = soundPlayer;
  runtime.systemNotifier = systemNotifier;
  runtime.popupController = popupController;
  runtime.engine = engine;
  runtime.translate = translate2;
  runtime.resolveText = resolveText;
  runtime.openSession = openSession;
  runtime.openPopup = () => popupController.open();
  runtime.closePopup = () => popupController.close();
  runtime.resetSettings = () => settingsStore.reset();
  runtime.previewSound = (preset, volume) => soundPlayer.preview(preset, volume);
  runtime.requestNotificationPermission = () => systemNotifier.requestPermission();
  runtime.testSystemNotification = () => {
    systemNotifier.show({
      title: translate2("settings.title"),
      body: translate2("settings.testNotification"),
      tag: "dsh-notify-interactive-test",
      kind: "completion"
    });
  };
  runtime.getMainSession = () => {
    try {
      const list = ctx.get("sessions")?.list?.getSnapshot?.();
      const id = findMainSessionId(list);
      return { id, title: id === void 0 ? void 0 : sessionTitleOf(list, id) };
    } catch {
      return { id: void 0, title: void 0 };
    }
  };
  runtime.dismiss = (id) => notificationStore.remove(id);
  runtime.addDemo = (kind, info = {}) => {
    const item = createDemoItems({
      t: translate2,
      sessionId: info.sessionId,
      sessionTitle: info.sessionTitle
    })[kind];
    if (item !== void 0) notificationStore.upsert(item);
  };
  runtime.ready = true;
  runtime.version = "0.1.4";
  try {
    globalThis.__dshNotifyInteractive = runtime;
  } catch {
  }
  ctx.effect(() => {
    const style = globalThis.document.createElement("style");
    style.setAttribute("data-plugin", "dsh-notify-interactive");
    style.textContent = POPUP_CSS;
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
    engine.dispose();
    popupController.dispose();
    systemNotifier.closeAll();
    runtime.ready = false;
  }, "dsh-notify-interactive: runtime cleanup");
  const uiSession = ctx.get("uiSession");
  const sessionsService = ctx.get("sessions");
  const ingest = () => {
    try {
      const status = uiSession?.sessionStatus?.getSnapshot?.();
      if (status === void 0) return;
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
  ctx.effect(() => settingsStore.subscribe(() => {
    const next = settingsStore.getSnapshot();
    if (!next.enabled || !next.popup.enabled) {
      notificationStore.clear();
      engine.reset();
      if (!next.popup.enabled) popupController.close();
    }
  }), "dsh-notify-interactive: settings bridge");
  ctx.on("connection/reset", () => engine.reset());
  ctx.on("theme/change", () => popupController.syncTheme());
  ctx.on("locale/change", () => popupController.syncTitle());
  ctx.slots.inject("shell.overlay", () => ctx.slots.register({
    name: "shell.overlay",
    id: "notify-interactive.overlay",
    order: 100,
    label: () => translate2("popup.title")
  }, (props) => (0, import_react15.createElement)(Overlay, props)));
  ctx.slots.inject("settings.section", () => ctx.slots.register({
    name: "settings.section",
    id: "notify-interactive",
    order: 16,
    label: () => translate2("settings.nav")
  }, (props) => (0, import_react15.createElement)(Settings, props)));
}

    })(module, module.exports, require);
    return module.exports;
  },
});
