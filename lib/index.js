// src/host/index.js
import { randomUUID as randomUUID4 } from "node:crypto";
import { join as join3 } from "node:path";

// src/host/preferences.js
import { readFile, mkdir, writeFile, rename } from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";

// src/state/settings.js
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

// src/host/preferences.js
function createPreferences(file) {
  let state = { revision: 0, initialized: false, settings: createDefaultSettings() };
  let serial = Promise.resolve();
  const ready = (async () => {
    if (!file) return;
    try {
      const saved = JSON.parse(await readFile(file, "utf8"));
      if (!Number.isSafeInteger(saved.revision) || saved.revision < 1) throw Error("invalid-preferences");
      state = { revision: saved.revision, initialized: true, settings: normalizeSettings(saved.settings) };
    } catch (error) {
      if (error.code !== "ENOENT") throw new Error("preferences-unreadable");
    }
  })();
  ready.catch(() => {
  });
  return {
    current: () => structuredClone(state.settings),
    async snapshot() {
      await ready;
      return structuredClone(state);
    },
    update(revision, patch, initial) {
      const task = serial.then(async () => {
        await ready;
        if (revision !== state.revision) return { conflict: true, ...structuredClone(state) };
        const next = { revision: state.revision + 1, initialized: true, settings: !state.initialized && initial ? normalizeSettings(initial) : mergeSettings(state.settings, patch) };
        if (file) {
          await mkdir(dirname(file), { recursive: true, mode: 448 });
          const temporary = `${file}.${randomUUID()}.tmp`;
          await writeFile(temporary, JSON.stringify(next), { mode: 384 });
          await rename(temporary, file);
        }
        state = next;
        return structuredClone(state);
      });
      serial = task.catch(() => {
      });
      return task;
    }
  };
}

// src/host/logic.js
import { basename } from "node:path";
var PRESENCE_TTL_MS = 15e3;
var BODY_LIMIT = 500;
function truncate(value, limit = BODY_LIMIT) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, Math.max(0, limit - 1))}\u2026`;
}
function sessionLabel(session) {
  const cwd = session?.header?.cwd;
  if (typeof cwd === "string" && cwd !== "") {
    const name = basename(cwd);
    if (name !== "") return name;
  }
  const id = String(session?.id ?? "");
  return id === "" ? "DSH" : id.slice(0, 8);
}
function questionOf(argumentsText) {
  if (typeof argumentsText !== "string" || argumentsText === "") return void 0;
  try {
    const parsed = JSON.parse(argumentsText);
    const question = parsed?.questions?.[0]?.question;
    return typeof question === "string" && question !== "" ? question : void 0;
  } catch {
    return void 0;
  }
}
function reasonLabel(kind) {
  switch (kind) {
    case "completed":
      return "\u5B8C\u6210";
    case "error":
      return "\u51FA\u9519";
    case "max-tokens":
      return "\u8D85\u51FA\u957F\u5EA6";
    case "blocked":
      return "\u88AB\u963B\u585E";
    case "aborted":
      return "\u5DF2\u4E2D\u65AD";
    default:
      return kind === void 0 ? "\u7ED3\u675F" : String(kind);
  }
}
function messageForEvent(session, event) {
  if (session?.header?.origin === "subagent") return null;
  const label = sessionLabel(session);
  const type = event?.type;
  const data = event?.data ?? {};
  if (type === "approval/asked") {
    const tool = typeof data.toolName === "string" && data.toolName !== "" ? data.toolName : "\u5DE5\u5177";
    const reason = typeof data.reason === "string" && data.reason !== "" ? `\uFF1A${data.reason}` : "";
    return {
      kind: "approval",
      title: "DSH \u9700\u8981\u4F60",
      body: truncate(`\u4F1A\u8BDD ${label}\uFF1A${tool} \u8BF7\u6C42\u6279\u51C6${reason}`)
    };
  }
  if (type === "tool/call") {
    if (data.name === "ask_user_question") {
      const question = questionOf(data.arguments);
      return {
        kind: "question",
        title: "DSH \u9700\u8981\u4F60",
        body: truncate(`\u4F1A\u8BDD ${label}\uFF1A${question ?? "\u667A\u80FD\u4F53\u6B63\u5728\u7B49\u5F85\u4F60\u7684\u56DE\u7B54"}`)
      };
    }
    if (data.name === "exit_plan_mode") {
      return {
        kind: "plan-review",
        title: "DSH \u9700\u8981\u4F60",
        body: truncate(`\u4F1A\u8BDD ${label}\uFF1A\u8BA1\u5212\u7B49\u5F85\u4F60\u5BA1\u6838`)
      };
    }
    return null;
  }
  if (type === "turn/end") {
    const reason = data.reason?.kind;
    if (reason === "aborted") return null;
    return {
      kind: "completion",
      title: "DSH \u4EFB\u52A1\u7ED3\u675F",
      body: truncate(`\u4F1A\u8BDD ${label}\uFF1A\u672C\u8F6E\u5DF2\u7ED3\u675F\uFF08${reasonLabel(reason)}\uFF09`)
    };
  }
  return null;
}

// src/interaction/schema.js
function validPresentation(value) {
  const text = (s, n) => typeof s === "string" && s.length <= n;
  if (!value || !text(value.callId, 200) || JSON.stringify(value).length > 48e3) return false;
  if (value.kind === "approval") return Boolean(value.callId) && text(value.toolName, 200) && text(value.reason, 4e3) && text(value.description, 4e3);
  if (!["question", "plan-review"].includes(value.kind) || !["waterfall", "rpc"].includes(value.channel)) return false;
  const qs = value.questions;
  return Array.isArray(qs) && qs.length > 0 && qs.length <= 32 && new Set(qs.map((q) => q.id)).size === qs.length && qs.every((q) => text(q.id, 200) && text(q.question, 8e3) && (q.header === void 0 || text(q.header, 200)) && (q.detail === void 0 || text(q.detail, 24e3)) && typeof q.multiSelect === "boolean" && Array.isArray(q.options) && q.options.length <= 64 && new Set(q.options.map((o) => o.label)).size === q.options.length && q.options.every((o) => text(o.label, 1e3) && (o.description === void 0 || text(o.description, 4e3))));
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
function questionsKey(questions) {
  if (!Array.isArray(questions) || !questions.length) return "";
  return JSON.stringify(questions.map((q) => ({
    id: q.id,
    question: q.question,
    header: q.header ?? "",
    detail: q.detail ?? "",
    multiSelect: (q.multiSelect ?? q.multi_select) === true,
    options: (q.options ?? []).map((o) => ({ label: o.label, description: o.description ?? "" }))
  })));
}

// src/host/coordinator.js
function createCoordinator({ now = Date.now, ttl = PRESENCE_TTL_MS } = {}) {
  const peers = /* @__PURE__ */ new Map();
  const facts = /* @__PURE__ */ new Map();
  const events = /* @__PURE__ */ new Map();
  const keyOf2 = (sessionId, kind) => JSON.stringify([String(sessionId), kind]);
  function present(value) {
    const id = typeof value.clientId === "string" ? value.clientId : "legacy";
    if (value.active === false) {
      peers.delete(id);
      return;
    }
    peers.set(id, { ...value, at: now() });
    for (const [key, peer] of peers) if (now() - peer.at > ttl) peers.delete(key);
    while (peers.size > 64) peers.delete(peers.keys().next().value);
  }
  function attended(sessionId, since = 0) {
    return [...peers.values()].some((peer) => peer.at >= since && now() - peer.at <= ttl && peer.focused && peer.visible && (sessionId === void 0 || String(peer.sessionId) === String(sessionId)));
  }
  function observe(session, event, message) {
    const sessionId = String(session.id);
    if (event.type === "user/message" && event.data?.source?.kind === "user-question-reply") {
      for (const kind of ["question", "plan-review"]) {
        const fact2 = facts.get(keyOf2(sessionId, kind));
        if (fact2?.callId === event.data.source.callId) facts.delete(keyOf2(sessionId, kind));
      }
      return;
    }
    if (event.type === "tool/result") {
      const result = event.data?.message;
      const callId = result?.toolCallId ?? result?.source?.callId ?? event.data?.callId;
      const content = typeof result?.content === "string" ? result.content : Array.isArray(result?.content) ? result.content.filter((block) => block.type === "text").map((block) => block.text).join("") : "";
      let continued = false;
      try {
        continued = JSON.parse(content).pending === true;
      } catch {
      }
      if (!continued) for (const kind of ["approval", "question", "plan-review"]) {
        const fact2 = facts.get(keyOf2(sessionId, kind));
        if (fact2?.callId && String(fact2.callId) === String(callId)) facts.delete(keyOf2(sessionId, kind));
      }
      return;
    }
    if (event.type === "approval/decided") {
      const fact2 = facts.get(keyOf2(sessionId, "approval"));
      if (fact2 && fact2.id === JSON.stringify([sessionId, "approval", event.data?.id])) facts.delete(keyOf2(sessionId, "approval"));
      return;
    }
    if (event.type === "turn/end" && event.data?.reason?.kind === "aborted") {
      facts.delete(keyOf2(sessionId, "completion"));
      return;
    }
    if (event.type === "turn/start") {
      facts.delete(keyOf2(sessionId, "completion"));
      return;
    }
    if (!message) return;
    const data = event.data ?? {};
    const identity = message.kind === "completion" ? data.turn : message.kind === "approval" ? data.id : data.callId;
    if (identity === void 0) return;
    const id = JSON.stringify([sessionId, message.kind, identity]);
    if (events.has(id)) return events.get(id).fact;
    let questionKey = "";
    if (message.kind === "question") {
      try {
        questionKey = questionsKey(JSON.parse(data.arguments).questions);
      } catch {
      }
    }
    const fact = {
      id,
      sessionId,
      kind: message.kind,
      callId: data.callId,
      at: now(),
      message,
      questionKey,
      ...message.kind === "completion" ? { completionReason: data.reason?.kind } : {},
      ...message.kind === "approval" ? { approval: { toolName: data.toolName, reason: data.reason ?? "" } } : {}
    };
    facts.set(keyOf2(sessionId, message.kind), fact);
    events.set(id, { fact, status: "waiting" });
    while (events.size > 512) {
      const old = events.keys().next().value;
      const item = events.get(old);
      if (facts.get(keyOf2(item.fact.sessionId, item.fact.kind))?.id === old) facts.delete(keyOf2(item.fact.sessionId, item.fact.kind));
      events.delete(old);
    }
    return fact;
  }
  function resolve(sessionId, kind, callId) {
    const fact = facts.get(keyOf2(sessionId, kind));
    if (!fact) return void 0;
    if (callId && fact.callId && String(callId) !== String(fact.callId)) return void 0;
    return fact;
  }
  function claim(fact) {
    const item = events.get(fact?.id);
    if (!item || item.status !== "waiting") return false;
    item.status = "claimed";
    return true;
  }
  return {
    present,
    attended,
    observe,
    resolve,
    claim,
    deliveredFor: (sessionId) => [...events.values()].filter((item) => (sessionId === void 0 || item.fact.sessionId === String(sessionId)) && ["claimed", "rendered", "queued", "uncertain", "accepted"].includes(item.status)).map((item) => item.fact),
    waiting: (fact) => events.get(fact.id)?.status === "waiting",
    pending: (fact) => events.get(fact.id)?.status === "waiting" && facts.get(keyOf2(fact.sessionId, fact.kind))?.id === fact.id,
    finish(fact, status) {
      const item = events.get(fact?.id);
      if (item) item.status = status;
    },
    active: () => [...peers.values()].some((peer) => now() - peer.at <= ttl),
    clear() {
      peers.clear();
      facts.clear();
      events.clear();
    }
  };
}

// src/host/windows-toast.js
import { createHash } from "node:crypto";
import { join as join2 } from "node:path";
import { execFile as execFile2 } from "node:child_process";
import { readFile as readFile3 } from "node:fs/promises";

// src/host/toast-actions.js
import { randomUUID as randomUUID2 } from "node:crypto";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { mkdir as mkdir2, readFile as readFile2, readdir, rm, stat, unlink } from "node:fs/promises";
import { dirname as dirname2, join } from "node:path";
var run = promisify(execFile);
var nonce = () => randomUUID2().replaceAll("-", "");
var keyOf = (view) => view && !view.blocked && JSON.stringify([view.instanceId, view.eventId, view.token, presentationKey(view)]);
function quickActions(view) {
  if (!view || view.blocked) return null;
  if (view.kind === "approval") {
    const prompt = [view.toolName, view.description || view.reason].filter(Boolean).join(" \xB7 ");
    if (!view.toolName || prompt.length > 180 || /[\r\n]/.test(prompt)) return null;
    return { prompt, buttons: [
      { label: "\u5141\u8BB8\u4E00\u6B21", answer: "allowed-once" },
      { label: "\u62D2\u7EDD", answer: "rejected" }
    ] };
  }
  if (view.kind !== "question" || view.questions.length !== 1) return null;
  const [q] = view.questions;
  const reserved = ["\u53D1\u9001\u56DE\u7B54", "\u8DF3\u8FC7\u6B64\u9898"];
  if (!q.question.trim() || q.question.length > 100 || q.detail || q.intent || q.multiSelect || q.options.length > 3 || q.options.some((o) => o.description || !o.label.trim() || o.label.length > 18 || reserved.includes(o.label))) return null;
  const answer = (selected) => ({ answers: [{ id: q.id, selected }] });
  return { prompt: q.question, input: true, buttons: [
    ...q.options.map((o) => ({ label: o.label, answer: answer([o.label]) })),
    { label: reserved[0], questionId: q.id },
    { label: reserved[1], answer: answer([]) }
  ] };
}
async function startToastActivator(shell, instance) {
  const [source, script2] = await Promise.all(["ToastActivator.cs", "register-toast.ps1"].map((name) => readFile2(new URL(name, import.meta.url), "utf8")));
  const compiled = await new Promise((resolve, reject) => {
    const child = execFile(
      shell,
      ["-NoProfile", "-NonInteractive", "-EncodedCommand", Buffer.from(script2, "utf16le").toString("base64")],
      { windowsHide: true, timeout: 2e4 },
      (err, stdout) => err ? reject(Error("toast-activator-registration-failed")) : resolve(Buffer.from(stdout.trim(), "base64").toString("utf8"))
    );
    child.stdin.on("error", reject);
    child.stdin.end(Buffer.from(source).toString("base64"));
  });
  const executable = process.platform === "win32" ? compiled : (await run("wslpath", ["-u", compiled])).stdout.trim();
  const helper = spawn(executable, ["--host", instance], { stdio: ["pipe", "pipe", "ignore"], windowsHide: true });
  helper.stdin.on("error", () => {
  });
  const closed = new Promise((resolve) => helper.once("close", resolve));
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error("toast-activator-timeout")), 8e3);
      let output = "";
      helper.once("error", reject);
      helper.stdout.on("data", (chunk) => {
        output += chunk;
        if (output.trim() === "ready") {
          clearTimeout(timer);
          resolve();
        }
      });
      closed.then(() => {
        clearTimeout(timer);
        reject(Error("toast-activator-exited"));
      });
    });
  } catch (error) {
    helper.kill();
    throw error;
  }
  return { base: dirname2(executable), stop: () => helper.stdin.end(), closed };
}
function createToastActions({ register, submit, withdraw = () => {
}, pollMs = 300 }) {
  const instance = nonce(), events = /* @__PURE__ */ new Map(), buttons = /* @__PURE__ */ new Map(), processing = /* @__PURE__ */ new Set();
  let folder, startup, helper, timer, reading = false, disposed = false;
  function revoke(id) {
    const event = events.get(id);
    if (!event) return;
    for (const token of event.tokens) buttons.delete(token);
    events.delete(id);
  }
  async function consume(name) {
    const file = join(folder, name);
    const token = name.slice(0, -6), button = buttons.get(token);
    if (!button) {
      await unlink(file);
      return;
    }
    const { event } = button;
    for (const sibling of event.tokens) buttons.delete(sibling);
    try {
      await deliverAnswer(file, event, button);
    } finally {
      if (events.get(event.id) === event) revoke(event.id);
    }
  }
  async function deliverAnswer(file, event, button) {
    const info = await stat(file);
    let reply;
    try {
      if (info.size <= 32e3 && Date.now() - info.mtimeMs < 8e3) reply = await readFile2(file, "utf8");
    } finally {
      await unlink(file);
    }
    const view = event.getView();
    if (disposed || events.get(event.id) !== event || reply === void 0 || !event.live() || keyOf(view) !== event.key) return;
    let answer = button.answer;
    if (button.questionId !== void 0) {
      reply = reply.trim();
      if (!reply || reply.length > 8e3) {
        await event.onFailure();
        return;
      }
      answer = { answers: [{ id: button.questionId, selected: [], custom: reply }] };
    }
    const { status } = await submit({ instanceId: view.instanceId, eventId: event.id, token: view.token, action: "answer", answer });
    if (status !== "success" && !disposed && event.live()) await event.onFailure();
  }
  async function poll() {
    if (reading || disposed) return;
    reading = true;
    try {
      for (const name of await readdir(folder)) if (/^[a-f0-9]{32}\.reply$/.test(name) && !processing.has(name)) {
        processing.add(name);
        void consume(name).catch(() => {
        }).finally(() => processing.delete(name));
      }
    } finally {
      reading = false;
    }
  }
  async function prepare() {
    if (disposed) return;
    startup ??= (async () => {
      helper = await register(instance);
      const path = join(helper.base, instance);
      await mkdir2(path, { recursive: true });
      if (disposed) {
        helper.stop();
        await rm(path, { recursive: true, force: true });
        return;
      }
      folder = path;
      helper.closed.then(() => {
        clearInterval(timer);
        if (!disposed) for (const id of events.keys()) withdraw(id);
        events.clear();
        buttons.clear();
        folder = void 0;
        startup = void 0;
      });
      timer = setInterval(() => void poll().catch(() => {
      }), pollMs);
      timer.unref?.();
    })().catch((error) => {
      helper?.stop();
      startup = void 0;
      throw error;
    });
    return startup;
  }
  return {
    prepare,
    revoke,
    bind(id, getView, live, onFailure) {
      revoke(id);
      const view = getView(), form = quickActions(view);
      if (!folder || disposed || !form || events.size >= 512 || !live() || view.eventId !== id) return null;
      const event = { id, key: keyOf(view), getView, live, onFailure, tokens: [] };
      events.set(id, event);
      return { prompt: form.prompt, input: form.input, buttons: form.buttons.map((button) => {
        const token = nonce();
        buttons.set(token, { ...button, event });
        event.tokens.push(token);
        return { label: button.label, argument: instance + "/" + token };
      }) };
    },
    current(id, view) {
      return events.has(id) && events.get(id).key === keyOf(view);
    },
    changed(id, view) {
      if (!events.has(id) || events.get(id).key === keyOf(view)) return false;
      revoke(id);
      return true;
    },
    dispose() {
      disposed = true;
      helper?.stop();
      clearInterval(timer);
      events.clear();
      buttons.clear();
      if (folder) return rm(folder, { recursive: true, force: true }).catch(() => {
      });
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

// src/host/windows-toast.js
var windowsShell = process.platform === "win32" ? join2(process.env.SystemRoot || "C:\\Windows", "System32/WindowsPowerShell/v1.0/powershell.exe") : "/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe";
var digest = (value) => createHash("sha256").update(value).digest("hex").slice(0, 16);
var historyGroup = (profile, pending) => digest(JSON.stringify([process.env.WSL_DISTRO_NAME, profile, pending]));
var notificationProfileId = (profile) => historyGroup(profile, false);
var script = new URL("./notification.ps1", import.meta.url);
async function callWindows(packet) {
  const source = await readFile3(script, "utf8");
  const command = Buffer.from(source, "utf16le").toString("base64");
  const input = Buffer.from(JSON.stringify(packet)).toString("base64");
  return new Promise((resolve, reject) => {
    const child = execFile2(
      windowsShell,
      ["-NoProfile", "-NonInteractive", "-EncodedCommand", command],
      { windowsHide: true, timeout: 15e3 },
      (error, stdout) => {
        if (error) reject(new Error(`windows-notification-call-failed (${error.code ?? error.signal})`));
        else resolve(stdout.trim());
      }
    );
    child.stdin.on("error", reject);
    child.stdin.end(input);
  });
}
function nativeToast(fact, origin, profile, payload) {
  const url = new URL(origin);
  if (!["http:", "https:"].includes(url.protocol) || url.origin !== origin || !fact.sessionId) throw Error("invalid-notification-target");
  url.searchParams.set("dsh-notify-session", fact.sessionId);
  url.searchParams.set("dsh-notify-profile", historyGroup(profile, false));
  return {
    url: url.href,
    title: payload.sessionTitle || payload.title,
    body: payload.body,
    group: historyGroup(profile, fact.kind !== "completion"),
    tag: digest(fact.id)
  };
}
function createToastTransport(origin, profile, send = callWindows, submit) {
  const pending = /* @__PURE__ */ new Set();
  const group = historyGroup(profile, true);
  const remove = (id) => send({ group, removeTag: digest(id) });
  const withdraw = (id) => {
    if (pending.delete(id)) return remove(id).catch(() => console.warn("[dsh-notify-interactive] Windows history removal failed"));
  };
  const actions = submit && createToastActions({ register: (instance) => startToastActivator(windowsShell, instance), submit, withdraw });
  let disposed = false;
  let actionError = false, deliveryError = false;
  const prepare = () => actions?.prepare().then(() => {
    actionError = false;
  }, () => {
    actionError = true;
  });
  void prepare();
  let ready;
  function initialize() {
    ready ??= send({ removeGroup: group }).catch((error) => {
      ready = void 0;
      deliveryError = true;
      throw error;
    });
    return ready;
  }
  initialize().catch(() => {
  });
  return {
    reason: () => deliveryError ? "delivery-failed" : actionError ? "actions-unavailable" : void 0,
    profileId: notificationProfileId(profile),
    async deliver({ fact, payload, getPolicy, isCurrent, getInteraction }) {
      await initialize();
      const interactive = actions && getInteraction && ["approval", "question"].includes(fact.kind);
      if (interactive && getPolicy().popup) await prepare();
      const policy = getPolicy();
      if (disposed || !isCurrent() || !policy.popup && !policy.sound) return { shown: false, delivery: "suppressed" };
      const preset = policy.sound && SOUND_PRESETS.find((item) => item.id === policy.preset);
      const wav = preset ? renderPresetToDataUrl(preset, policy.volume).split(",")[1] : "";
      const toast = nativeToast(fact, origin, profile, payload);
      const live = () => !disposed && isCurrent() && getPolicy().popup;
      const failure = async () => {
        if (!live()) return;
        await send({ ...toast, body: "\u8BF7\u6253\u5F00\u4F1A\u8BDD\u6838\u5BF9\u8BF7\u6C42\u72B6\u6001\u3002", popup: true });
        if (!live()) await remove(fact.id);
      };
      const form = interactive && policy.popup ? actions.bind(fact.id, getInteraction, live, failure) : null;
      if (form) toast.body = form.prompt;
      let status;
      try {
        status = await send({ ...toast, form, popup: policy.popup, wav });
        deliveryError = false;
      } catch (error) {
        deliveryError = true;
        throw error;
      } finally {
        if (status !== "accepted") actions?.revoke(fact.id);
      }
      if (policy.popup && status === "accepted" && fact.kind !== "completion") {
        if (live() && (!form || actions.current(fact.id, getInteraction()))) pending.add(fact.id);
        else {
          actions?.revoke(fact.id);
          await remove(fact.id);
        }
      }
      return { shown: false, delivery: status };
    },
    update(id, view) {
      if (pending.has(id) && actions?.changed(id, view)) void withdraw(id);
    },
    dispose() {
      disposed = true;
      void actions?.dispose();
    },
    retire(fact) {
      actions?.revoke(fact.id);
      return withdraw(fact.id);
    }
  };
}

// src/host/delivery.js
function channelPolicy(settings, kind, attended = false, windowFocused = attended) {
  const scenario = settings.scenarios[kind === "plan-review" ? "planReview" : kind] ?? { sound: true, notify: true, preset: "inherit" };
  const enabled = settings.enabled && !attended;
  const preset = scenario.preset === "inherit" || !scenario.preset ? settings.sound.preset : scenario.preset;
  return {
    popup: settings.enabled && visualAllowed(kind, settings.popup.completionMode, attended, windowFocused) && settings.popup.enabled && scenario.notify,
    sound: enabled && settings.sound.enabled && scenario.sound && preset !== "none" && settings.sound.volume > 0,
    preset,
    volume: settings.sound.volume
  };
}

// src/host/interactions.js
import { randomUUID as randomUUID3 } from "node:crypto";
function createInteractionBroker({ coordinator, now = Date.now, ttl = 8e3, commandMs = 1e4, onUpdate = () => {
} }) {
  const instanceId = randomUUID3();
  const owners = /* @__PURE__ */ new Map(), commands = /* @__PURE__ */ new Map(), locked = /* @__PURE__ */ new Map();
  const approvalCalls = /* @__PURE__ */ new Map();
  const unnamedQuestions = /* @__PURE__ */ new Map();
  let approvalOverflow = false;
  let questionOverflow = false;
  const focusSequences = /* @__PURE__ */ new Map();
  function observe(fact) {
    if (fact?.kind === "question" && fact.questionKey) {
      const key2 = JSON.stringify([fact.sessionId, fact.questionKey]);
      if (!unnamedQuestions.has(key2) && unnamedQuestions.size >= 1024) questionOverflow = true;
      else {
        const ids2 = unnamedQuestions.get(key2) ?? /* @__PURE__ */ new Set();
        if (ids2.size < 2) ids2.add(fact.id);
        unnamedQuestions.set(key2, ids2);
      }
    }
    if (fact?.kind !== "approval" || !fact.callId) return;
    const key = JSON.stringify([fact.sessionId, fact.callId]);
    if (!approvalCalls.has(key) && approvalCalls.size >= 1024) {
      approvalOverflow = true;
      return;
    }
    const ids = approvalCalls.get(key) ?? /* @__PURE__ */ new Set();
    if (ids.size < 2) ids.add(fact.id);
    approvalCalls.set(key, ids);
  }
  function resolveView(sessionId, view) {
    const fact = coordinator.resolve(sessionId, view.kind, view.callId);
    if (!fact) return void 0;
    if (view.callId) return String(fact.callId) === view.callId ? fact : void 0;
    const key = questionsKey(view.questions);
    if (view.kind !== "question" || questionOverflow || !fact.questionKey || fact.questionKey !== key || unnamedQuestions.get(JSON.stringify([fact.sessionId, key]))?.size !== 1) return void 0;
    return fact;
  }
  function current(owner) {
    const fact = resolveView(owner.sessionId, owner.view);
    if (!fact || fact.id !== owner.eventId || now() - owner.at > ttl) return false;
    if (owner.view.kind === "approval" && (approvalOverflow || approvalCalls.get(JSON.stringify([fact.sessionId, fact.callId]))?.size !== 1)) return false;
    if (owner.view.kind === "approval" && (owner.view.toolName !== fact.approval?.toolName || owner.view.reason !== fact.approval?.reason)) return false;
    return true;
  }
  function selected(eventId) {
    return [...owners.values()].find((owner) => owner.eventId === eventId && current(owner));
  }
  function presentation(eventId) {
    const owner = selected(eventId);
    return owner ? { ...owner.view, instanceId, eventId, token: owner.token, blocked: locked.has(eventId) } : null;
  }
  function complete(command, status) {
    clearTimeout(command.timer);
    command.status = status;
    if (!["uncertain", "success"].includes(status) && locked.get(command.eventId)?.id === command.id) locked.delete(command.eventId);
    command.answer = void 0;
    command.resolve?.({ status });
    command.resolve = void 0;
    onUpdate(command.eventId, presentation(command.eventId));
  }
  function sync(clientId, registrations) {
    if (typeof clientId !== "string" || clientId.length > 160 || !Array.isArray(registrations) || registrations.length > 128) throw new Error("invalid-registration");
    const retained = /* @__PURE__ */ new Set(), bindings = [];
    for (const item of registrations) {
      if (typeof item.token !== "string" || item.token.length > 160 || typeof item.sessionId !== "string" || !validPresentation(item.view)) continue;
      const fact = resolveView(item.sessionId, item.view);
      if (!fact) continue;
      const key = JSON.stringify([clientId, item.token]);
      const old = owners.get(key);
      if (!old && owners.size >= 512) continue;
      if (old && old.eventId !== fact.id) continue;
      const owner = { clientId, token: item.token, sessionId: item.sessionId, eventId: fact.id, view: item.view, at: now() };
      if (!current(owner)) continue;
      owners.set(key, owner);
      retained.add(key);
      bindings.push({ token: item.token, eventId: fact.id });
      onUpdate(fact.id, presentation(fact.id));
    }
    for (const [key, owner] of owners) if (owner.clientId === clientId && !retained.has(key) || !current(owner)) {
      owners.delete(key);
      onUpdate(owner.eventId, presentation(owner.eventId));
    }
    const offered = [];
    for (const command of commands.values()) if (command.clientId === clientId && command.status === "waiting") {
      const owner = owners.get(JSON.stringify([clientId, command.token]));
      if (!owner || !current(owner) || presentationKey(owner.view) !== command.viewKey) {
        complete(command, "unavailable");
        continue;
      }
      command.status = "offered";
      offered.push({ id: command.id, instanceId, eventId: command.eventId, token: command.token, sessionId: owner.sessionId, action: command.action, answer: command.answer, viewKey: command.viewKey, sequence: command.sequence });
    }
    return { instanceId, bindings, commands: offered };
  }
  function execute(clientId, id, token, eventId) {
    const command = commands.get(id), owner = owners.get(JSON.stringify([clientId, token]));
    if (!command || command.clientId !== clientId || command.token !== token || command.eventId !== eventId || command.status !== "offered" || !owner || !current(owner) || presentationKey(owner.view) !== command.viewKey) return false;
    if (command.sequence !== void 0 && command.sequence !== focusSequences.get(eventId)) return false;
    command.status = "executing";
    return true;
  }
  function result(clientId, id, status) {
    const command = commands.get(id);
    if (!command || command.clientId !== clientId || !["offered", "executing"].includes(command.status)) return false;
    complete(command, command.status === "executing" ? status === "success" ? "success" : "uncertain" : "unavailable");
    return true;
  }
  async function submit(packet) {
    if (packet.instanceId !== instanceId || typeof packet.eventId !== "string" || !["answer", "focus", "blur", "engage", "take-time"].includes(packet.action)) return { status: "unavailable" };
    const owner = selected(packet.eventId);
    if (!owner || packet.token !== owner.token || packet.action === "answer" && locked.has(packet.eventId)) return { status: "unavailable" };
    if (["focus", "blur"].includes(packet.action)) {
      if (!Number.isSafeInteger(packet.sequence) || packet.sequence <= (focusSequences.get(packet.eventId) ?? -1)) return { status: "unavailable" };
      focusSequences.set(packet.eventId, packet.sequence);
      if (focusSequences.size > 512) focusSequences.delete(focusSequences.keys().next().value);
    }
    if (packet.action === "answer" && !validAnswer(owner.view, packet.answer)) return { status: "invalid" };
    if (commands.size >= 256) {
      for (const [id2, command] of commands) if (!command.resolve) commands.delete(id2);
      if (commands.size >= 256) return { status: "unavailable" };
    }
    const id = randomUUID3();
    if (packet.action === "answer") {
      if (locked.size >= 512) return { status: "unavailable" };
      locked.set(packet.eventId, { id, sessionId: owner.sessionId, kind: owner.view.kind });
    }
    return new Promise((resolve) => {
      const command = {
        id,
        eventId: packet.eventId,
        clientId: owner.clientId,
        token: owner.token,
        action: packet.action,
        answer: packet.answer,
        viewKey: presentationKey(owner.view),
        sequence: packet.sequence,
        status: "waiting",
        resolve
      };
      command.timer = setTimeout(() => complete(command, command.status === "executing" ? "uncertain" : "unavailable"), commandMs);
      command.timer.unref?.();
      commands.set(id, command);
    });
  }
  return {
    instanceId,
    observe,
    sync,
    execute,
    result,
    submit,
    presentation,
    sweep() {
      for (const [key, owner] of owners) if (!current(owner)) {
        owners.delete(key);
        onUpdate(owner.eventId, presentation(owner.eventId));
      }
      for (const [eventId, lock] of locked) if (coordinator.resolve(lock.sessionId, lock.kind)?.id !== eventId) locked.delete(eventId);
    },
    dispose() {
      for (const c of commands.values()) if (c.resolve) complete(c, c.status === "executing" ? "uncertain" : "unavailable");
      owners.clear();
      commands.clear();
      locked.clear();
      approvalCalls.clear();
      unnamedQuestions.clear();
    }
  };
}

// src/host/index.js
import { existsSync } from "node:fs";
var PRESENCE_PATH = "/dsh-notify-interactive/presence";
var WINDOWS_PATH = "/dsh-notify-interactive/windows-notify";
function readJson(req, limit = 16384) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}
function writeJson(res, status, value) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(value));
}
function applyHost(ctx, services = {}) {
  const coordinator = createCoordinator();
  const timers = /* @__PURE__ */ new Set();
  let profile;
  try {
    profile = ctx.get?.("profileContext") ?? ctx.profileContext;
  } catch {
  }
  const preferences = createPreferences(profile?.dir ? join3(profile.dir, "notify-interactive.settings.json") : void 0);
  let native = services.transport;
  let reason = "missing-origin";
  function desktopStatus() {
    return {
      scope: "reminders",
      native: true,
      enabled: reason !== "disabled",
      available: Boolean(native),
      reason: native ? native.reason?.() : reason,
      profileId: profile?.dir ? notificationProfileId(profile.dir) : native?.profileId
    };
  }
  function authorize(req, res) {
    try {
      const connection = ctx.get?.("connection") ?? ctx.connection;
      const rejection = connection?.requestRejection(req) ?? (connection ? void 0 : 503);
      if (rejection === void 0 && connection.admit(req)?.peer?.principal?.kind === "owner") return true;
      if (rejection === void 0) {
        writeJson(res, 403, { error: "owner-required" });
        return false;
      }
      writeJson(res, rejection, { error: "not-authorized" });
    } catch {
      writeJson(res, 503, { error: "connection-unavailable" });
    }
    return false;
  }
  const interactions = createInteractionBroker({ coordinator, onUpdate: (id, view) => native?.update?.(id, view) });
  const interactionSweep = setInterval(() => interactions.sweep(), 1e3);
  interactionSweep.unref?.();
  async function presenceRoute(req, res) {
    if (!authorize(req, res)) return;
    if (req.method !== "POST") {
      res.writeHead(405);
      res.end();
      return;
    }
    try {
      const body = await readJson(req);
      coordinator.present(body);
      res.writeHead(204);
      res.end();
    } catch {
      res.writeHead(400);
      res.end();
    }
  }
  async function windowsRoute(req, res) {
    if (!authorize(req, res)) return;
    if (req.method !== "POST") {
      res.writeHead(405);
      res.end();
      return;
    }
    try {
      const body = await readJson(req);
      const sessionId = body?.sessionId;
      if (typeof sessionId !== "string" || !sessionId) {
        writeJson(res, 400, { delivery: "missing-session" });
        return;
      }
      const kind = typeof body?.kind === "string" ? body.kind : "notice";
      const title = truncate(body?.title ?? "DSH", 80);
      const text = truncate(body?.body ?? "", 500);
      if (coordinator.resolve(sessionId, kind, body.callId)) {
        const { status, ...result } = await dispatch(body, true);
        writeJson(res, status, result);
        return;
      }
      if (kind !== "demo-completion") {
        writeJson(res, 409, { delivery: "event-not-current" });
        return;
      }
      if (!native) {
        writeJson(res, 503, { delivery: reason });
        return;
      }
      await preferences.snapshot();
      try {
        const result = await native.deliver({
          fact: { kind: "completion", id: `demo-${randomUUID4()}`, sessionId },
          payload: { sessionTitle: truncate(body.sessionTitle ?? "", 200), title, body: text },
          getPolicy: () => channelPolicy(preferences.current(), "completion"),
          isCurrent: () => true
        });
        writeJson(res, 200, result);
      } catch {
        writeJson(res, 503, { delivery: "failed" });
      }
    } catch {
      res.writeHead(400);
      res.end();
    }
  }
  async function settingsRoute(req, res) {
    if (!authorize(req, res)) return;
    try {
      if (req.method === "GET") {
        res.setHeader?.("cache-control", "no-store");
        writeJson(res, 200, await preferences.snapshot());
        return;
      }
      if (req.method !== "POST") {
        writeJson(res, 405, { error: "method" });
        return;
      }
      const body = await readJson(req, 64e3);
      const next = await preferences.update(body.revision, body.patch, body.initial);
      if (!next.conflict) for (const fact of coordinator.deliveredFor()) {
        const policy = channelPolicy(next.settings, fact.kind);
        if (!policy.popup) native?.retire(fact);
      }
      writeJson(res, next.conflict ? 409 : 200, next);
    } catch {
      writeJson(res, 503, { error: "preferences-unavailable" });
    }
  }
  function interactionRoute(operation) {
    return async (req, res) => {
      if (!authorize(req, res)) return;
      if (req.method !== "POST") {
        writeJson(res, 405, { error: "method" });
        return;
      }
      try {
        const body = await readJson(req, 192e3);
        res.setHeader?.("cache-control", "no-store");
        if (operation === "sync") {
          writeJson(res, 200, interactions.sync(body.clientId, body.registrations));
          return;
        }
        if (body.instanceId !== interactions.instanceId) {
          writeJson(res, 409, { error: "instance-changed" });
          return;
        }
        if (operation === "execute") writeJson(res, 200, { allowed: interactions.execute(body.clientId, body.id, body.token, body.eventId) });
        else writeJson(res, 200, { accepted: interactions.result(body.clientId, body.id, body.status) });
      } catch {
        writeJson(res, 400, { error: "invalid-interaction" });
      }
    };
  }
  function eventPolicy(settings, fact) {
    return channelPolicy(settings, fact.kind, coordinator.attended(fact.sessionId, fact.at), coordinator.attended(void 0, fact.at));
  }
  async function dispatch(body, legacyClient = false) {
    if (typeof body.sessionId !== "string" || !["approval", "question", "plan-review", "completion"].includes(body.kind)) return { status: 400, shown: false, delivery: "invalid-event" };
    if (!native) return { status: 503, shown: false, delivery: reason };
    const fact = coordinator.resolve(body.sessionId, body.kind, body.callId);
    if (!fact) return { status: 409, shown: false, delivery: "event-not-current" };
    const focusTarget = fact.kind === "completion" && preferences.current().popup.completionMode === "window-away" ? void 0 : body.sessionId;
    const grace = fact.at + 1250 - Date.now();
    if (grace > 0 && !coordinator.attended(focusTarget, fact.at)) {
      await new Promise((resolve) => setTimeout(resolve, grace));
    }
    await preferences.snapshot();
    if (!coordinator.claim(fact)) return { status: 200, shown: false, delivery: "duplicate" };
    const sessionTitle = truncate(body.sessionTitle ?? "", 200);
    const text = truncate(body.body ?? "", 500);
    const prefix = `${sessionTitle} \xB7 `;
    const result = await native.deliver({
      fact,
      getInteraction: () => interactions.presentation(fact.id),
      getPolicy: () => {
        const value = eventPolicy(preferences.current(), fact);
        if (legacyClient && body.silent) value.sound = false;
        return value;
      },
      isCurrent: () => fact.kind === "completion" || coordinator.resolve(body.sessionId, body.kind, body.callId)?.id === fact.id,
      payload: {
        title: truncate(body.title ?? "DSH", 80),
        sessionTitle,
        body: fact.completionReason && fact.completionReason !== "completed" ? fact.message.body : sessionTitle && text.startsWith(prefix) ? text.slice(prefix.length) : text
      }
    });
    coordinator.finish(fact, result.delivery);
    return { status: 200, ...result };
  }
  async function coordinatedDelivery(req, res) {
    if (!authorize(req, res)) return;
    if (req.method !== "POST") {
      writeJson(res, 405, { error: "method" });
      return;
    }
    try {
      const { status, ...result } = await dispatch(await readJson(req, 64e3));
      writeJson(res, status, result);
    } catch {
      writeJson(res, 503, { shown: false, delivery: "failed" });
    }
  }
  ctx.inject(["webServer"], (scope) => {
    if (!services.transport) {
      const disabled = (process.env.DSH_NOTIFY_WINDOWS ?? process.env.DSH_NOTIFY_COMPANION) === "0";
      if (disabled) reason = "disabled";
      else if (!existsSync(windowsShell)) reason = "missing-windows";
      else if (profile?.dir) {
        try {
          const origin = process.env.DSH_NOTIFY_WINDOWS_ORIGIN ?? scope.webServer.getOrigin();
          const target = new URL(origin);
          if (!["http:", "https:"].includes(target.protocol) || target.href !== target.origin + "/") throw Error("invalid-origin");
          native = createToastTransport(target.origin, profile.dir, void 0, (packet) => interactions.submit(packet));
        } catch {
          reason = "missing-origin";
        }
      }
      scope.effect(() => () => {
        native?.dispose();
        native = void 0;
      }, "dsh-notify-interactive: Windows transport");
    }
    for (const [path, handler] of [["settings", settingsRoute], ["deliver", coordinatedDelivery], ["interactions", interactionRoute("sync")], ["interaction-execute", interactionRoute("execute")], ["interaction-result", interactionRoute("result")]]) {
      scope.effect(() => scope.webServer.register({ kind: "exact", path: `/dsh-notify-interactive/${path}`, handler }), `dsh-notify-interactive: ${path}`);
    }
    scope.effect(() => scope.webServer.register({
      kind: "exact",
      path: "/dsh-notify-interactive/desktop-status",
      handler(req, res) {
        if (!authorize(req, res)) return;
        if (req.method !== "GET") {
          res.writeHead(405);
          res.end();
          return;
        }
        res.setHeader?.("cache-control", "no-store");
        writeJson(res, 200, desktopStatus());
      }
    }), "dsh-notify-interactive: desktop status");
    scope.effect(() => scope.webServer.register({
      kind: "exact",
      path: PRESENCE_PATH,
      handler: presenceRoute
    }), "dsh-notify-interactive: presence route");
    scope.effect(() => scope.webServer.register({
      kind: "exact",
      path: WINDOWS_PATH,
      handler: windowsRoute
    }), "dsh-notify-interactive: windows fallback route");
  });
  ctx.on("session/event", (session, event) => {
    const before = ["approval", "question", "plan-review", "completion"].map((kind) => coordinator.resolve(session.id, kind)).filter(Boolean);
    const message = messageForEvent(session, event);
    const fact = coordinator.observe(session, event, message);
    interactions.observe(fact);
    for (const old of before) {
      if (coordinator.resolve(session.id, old.kind)?.id === old.id) continue;
      native?.retire(old);
    }
    if (!fact || !native) return;
    const timer = setTimeout(async () => {
      timers.delete(timer);
      const keepCompletion = fact.kind === "completion";
      if (!(keepCompletion ? coordinator.waiting(fact) : coordinator.pending(fact))) return;
      try {
        await preferences.snapshot();
        if (!native || !coordinator.claim(fact)) return;
        const result = await native.deliver({
          fact,
          payload: { title: message.title, body: message.body },
          getInteraction: () => interactions.presentation(fact.id),
          getPolicy: () => eventPolicy(preferences.current(), fact),
          isCurrent: () => keepCompletion || coordinator.resolve(session.id, message.kind)?.id === fact.id
        });
        coordinator.finish(fact, result.delivery);
      } catch {
        console.warn("[dsh-notify-interactive] host delivery failed");
      }
    }, services.deliveryDelayMs ?? 1800);
    timers.add(timer);
    timer.unref?.();
  });
  ctx.effect(() => () => {
    for (const timer of timers) clearTimeout(timer);
    clearInterval(interactionSweep);
    interactions.dispose();
    coordinator.clear();
  }, "dsh-notify-interactive: host runtime");
}
function apply(ctx) {
  return applyHost(ctx);
}
export {
  apply,
  applyHost
};
