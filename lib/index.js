// src/host/index.js
import { join as join2 } from "node:path";

// src/host/preferences.js
import { readFile, mkdir, writeFile, rename } from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";

// src/state/settings.js
var SOUND_PRESET_IDS = Object.freeze(["chime", "pulse", "complete", "soft", "alert", "none"]);
var SCENARIO_KEYS = Object.freeze(["approval", "question", "planReview", "completion"]);
var DEFAULT_PRESET = "chime";
function createDefaultSettings() {
  return {
    version: 3,
    enabled: true,
    popup: { enabled: true },
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
    popup: { enabled: bool(value.popup?.enabled, true) },
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
function popupPayload(title, body, silent = false, url = "", popup = true) {
  const json = JSON.stringify({
    title: truncate(title, 80),
    body: truncate(body, 500),
    silent: silent === true,
    popup: popup !== false,
    url: typeof url === "string" ? url : ""
  });
  return Buffer.from(json, "utf8").toString("base64");
}
function popupScript(payload) {
  return `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()
$json = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${payload}'))
$data = $json | ConvertFrom-Json
if (-not $data.silent) { [System.Media.SystemSounds]::Asterisk.Play() }
if ($data.popup -eq $false) { Start-Sleep -Milliseconds 800; return }
$form = New-Object System.Windows.Forms.Form
$form.Text = [string]$data.title
$form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::FixedDialog
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.ShowInTaskbar = $true
$form.TopMost = $true
$form.StartPosition = [System.Windows.Forms.FormStartPosition]::Manual
$form.AutoSize = $true
$form.AutoSizeMode = [System.Windows.Forms.AutoSizeMode]::GrowAndShrink
$form.MinimumSize = New-Object System.Drawing.Size(360, 0)
$form.BackColor = [System.Drawing.Color]::FromArgb(30, 31, 34)
$form.ForeColor = [System.Drawing.Color]::FromArgb(230, 230, 230)
$form.Padding = New-Object System.Windows.Forms.Padding(16)
$body = New-Object System.Windows.Forms.Label
$body.Text = [string]$data.body
$body.AutoSize = $true
$body.MaximumSize = New-Object System.Drawing.Size(420, 0)
$body.ForeColor = [System.Drawing.Color]::FromArgb(230, 230, 230)
$body.Font = New-Object System.Drawing.Font('Segoe UI', 10)
$buttons = New-Object System.Windows.Forms.FlowLayoutPanel
$buttons.FlowDirection = [System.Windows.Forms.FlowDirection]::RightToLeft
$buttons.AutoSize = $true
$buttons.Dock = [System.Windows.Forms.DockStyle]::Fill
if ($data.url -ne '') {
  $open = New-Object System.Windows.Forms.Button
  $open.Text = '\u6253\u5F00 DSH'
  $open.AutoSize = $true
  $open.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
  $open.BackColor = [System.Drawing.Color]::FromArgb(77, 107, 254)
  $open.ForeColor = [System.Drawing.Color]::White
  $open.Add_Click({ Start-Process ([string]$data.url); $form.Close() })
  $buttons.Controls.Add($open)
}
$close = New-Object System.Windows.Forms.Button
$close.Text = '\u5173\u95ED'
$close.AutoSize = $true
$close.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$close.BackColor = [System.Drawing.Color]::FromArgb(45, 46, 50)
$close.ForeColor = [System.Drawing.Color]::FromArgb(230, 230, 230)
$close.Add_Click({ $form.Close() })
$buttons.Controls.Add($close)
$layout = New-Object System.Windows.Forms.TableLayoutPanel
$layout.ColumnCount = 1
$layout.RowCount = 2
$layout.AutoSize = $true
$layout.AutoSizeMode = [System.Windows.Forms.AutoSizeMode]::GrowAndShrink
$layout.Dock = [System.Windows.Forms.DockStyle]::Fill
$layout.Controls.Add($body, 0, 0)
$layout.Controls.Add($buttons, 0, 1)
$form.Controls.Add($layout)
$form.Add_Shown({
  $wa = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
  $form.Location = New-Object System.Drawing.Point(($wa.Right - $form.Width - 24), ($wa.Bottom - $form.Height - 24))
  $form.Activate()
})
$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 300000
$timer.Add_Tick({ $form.Close() })
$timer.Start()
$form.ShowDialog() | Out-Null
$timer.Stop()
$form.Dispose()
`;
}

// src/host/coordinator.js
function createCoordinator({ now = Date.now, ttl = PRESENCE_TTL_MS } = {}) {
  const peers = /* @__PURE__ */ new Map();
  const facts = /* @__PURE__ */ new Map();
  const events = /* @__PURE__ */ new Map();
  const keyOf = (sessionId, kind) => JSON.stringify([String(sessionId), kind]);
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
    return [...peers.values()].some((peer) => peer.at >= since && now() - peer.at <= ttl && peer.focused && peer.visible && String(peer.sessionId) === String(sessionId));
  }
  function observe(session, event, message) {
    const sessionId = String(session.id);
    if (event.type === "user/message" && event.data?.source?.kind === "user-question-reply") {
      for (const kind of ["question", "plan-review"]) {
        const fact2 = facts.get(keyOf(sessionId, kind));
        if (fact2?.callId === event.data.source.callId) facts.delete(keyOf(sessionId, kind));
      }
      return;
    }
    if (event.type === "tool/result") {
      let continued = false;
      try {
        continued = JSON.parse(event.data?.message?.content).pending === true;
      } catch {
      }
      if (!continued) for (const kind of ["approval", "question", "plan-review"]) {
        const fact2 = facts.get(keyOf(sessionId, kind));
        if (fact2?.callId && String(fact2.callId) === String(event.data?.callId)) facts.delete(keyOf(sessionId, kind));
      }
      return;
    }
    if (event.type === "approval/decided") {
      const fact2 = facts.get(keyOf(sessionId, "approval"));
      if (fact2 && fact2.id === JSON.stringify([sessionId, "approval", event.data?.id])) facts.delete(keyOf(sessionId, "approval"));
      return;
    }
    if (event.type === "turn/end" && event.data?.reason?.kind === "aborted") {
      facts.delete(keyOf(sessionId, "completion"));
      return;
    }
    if (event.type === "turn/start") {
      facts.delete(keyOf(sessionId, "completion"));
      return;
    }
    if (!message) return;
    const data = event.data ?? {};
    const identity = message.kind === "completion" ? data.turn : message.kind === "approval" ? data.id : data.callId;
    if (identity === void 0) return;
    const id = JSON.stringify([sessionId, message.kind, identity]);
    if (events.has(id)) return events.get(id).fact;
    const fact = { id, sessionId, kind: message.kind, callId: data.callId, at: now(), message };
    facts.set(keyOf(sessionId, message.kind), fact);
    events.set(id, { fact, status: "waiting" });
    while (events.size > 512) {
      const old = events.keys().next().value;
      const item = events.get(old);
      if (facts.get(keyOf(item.fact.sessionId, item.fact.kind))?.id === old) facts.delete(keyOf(item.fact.sessionId, item.fact.kind));
      events.delete(old);
    }
    return fact;
  }
  function resolve2(sessionId, kind, callId) {
    const fact = facts.get(keyOf(sessionId, kind));
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
    resolve: resolve2,
    claim,
    deliveredFor: (sessionId) => [...events.values()].filter((item) => (sessionId === void 0 || item.fact.sessionId === String(sessionId)) && ["claimed", "rendered", "queued", "uncertain"].includes(item.status)).map((item) => item.fact),
    pending: (fact) => events.get(fact.id)?.status === "waiting" && facts.get(keyOf(fact.sessionId, fact.kind))?.id === fact.id,
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

// src/host/delivery.js
function channelPolicy(settings, kind, attended = false) {
  const scenario = settings.scenarios[kind === "plan-review" ? "planReview" : kind] ?? { sound: true, notify: true, preset: "inherit" };
  const enabled = settings.enabled && !attended;
  const preset = scenario.preset === "inherit" || !scenario.preset ? settings.sound.preset : scenario.preset;
  return {
    popup: enabled && settings.popup.enabled && scenario.notify,
    sound: enabled && settings.sound.enabled && scenario.sound && preset !== "none" && settings.sound.volume > 0,
    preset,
    volume: settings.sound.volume
  };
}
async function deliverNotification({ companion, available, legacy, payload, policy, getPolicy, isCurrent = () => true }) {
  const currentPolicy = () => getPolicy?.() ?? policy;
  function prepare() {
    const fresh2 = currentPolicy();
    if (!isCurrent() || !fresh2.popup && !fresh2.sound) return null;
    const preset = SOUND_PRESETS.find((item) => item.id === fresh2.preset);
    return {
      ...payload,
      popup: fresh2.popup && !payload.webPopup,
      audio: fresh2.sound && preset ? renderPresetToDataUrl(preset) : "",
      volume: fresh2.volume
    };
  }
  if (!prepare()) return { shown: false, delivery: "suppressed" };
  if (available) {
    const result = await companion.deliver(prepare(), prepare);
    if (result.reason === "stale-event" || result.status === "suppressed") return { shown: false, delivery: "suppressed" };
    if (["rendered", "uncertain", "queued"].includes(result.status)) return { shown: result.status === "rendered", delivery: result.status };
  }
  const fresh = currentPolicy();
  if (!isCurrent() || !fresh.popup && !fresh.sound) return { shown: false, delivery: "suppressed" };
  const accepted = legacy(payload.title, payload.body, !fresh.sound, payload.url, fresh.popup && !payload.webPopup);
  return { shown: accepted, delivery: accepted ? "process-started" : "unavailable" };
}

// src/host/companion.js
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdir as mkdir2, writeFile as writeFile2, rename as rename2, readdir, readFile as readFile2, rm } from "node:fs/promises";
import { dirname as dirname2, resolve, join, win32 } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { randomUUID as randomUUID2 } from "node:crypto";
function resolveCompanionLaunch() {
  const base = dirname2(fileURLToPath(import.meta.url));
  const directory = [resolve(base, "../companion"), resolve(base, "../../companion")].find((path) => existsSync(resolve(path, "main.cjs")));
  if (!directory) throw new Error("companion-files-missing");
  const wsl = process.platform !== "win32" && existsSync("/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe");
  const stagedPath = resolve(directory, ".runtime.json");
  if (wsl && existsSync(stagedPath) && !process.env.DSH_NOTIFY_ELECTRON) {
    const staged = JSON.parse(readFileSync(stagedPath, "utf8"));
    if (!existsSync(staged.executable)) throw new Error("companion-not-installed");
    return { executable: staged.executable, args: [staged.application], mailboxRoot: resolve(dirname2(staged.executable), "../bridge"), windowsMailboxRoot: win32.join(staged.application, "bridge") };
  }
  const executable = process.env.DSH_NOTIFY_ELECTRON ?? resolve(directory, "node_modules/electron/dist", process.platform === "win32" || wsl ? "electron.exe" : "electron");
  if (!existsSync(executable)) throw new Error("companion-not-installed");
  if (wsl) throw new Error("run-companion-installer-to-stage-windows-files");
  return { executable, args: [directory], mailboxRoot: join(tmpdir(), "dsh-notify-bridge") };
}
function createCompanion(options = {}) {
  const launch = options.launch ?? resolveCompanionLaunch;
  const spawnProcess = options.spawn ?? spawn;
  const pending = /* @__PURE__ */ new Map();
  let starting;
  let active;
  let disposed = false;
  function settle(id, result) {
    const item = pending.get(id);
    if (!item) return;
    clearTimeout(item.timer);
    pending.delete(id);
    item.resolve(result);
  }
  async function command(connection, value) {
    const name = `command-${randomUUID2()}`;
    const temporary = join(connection.directory, `${name}.tmp`);
    await writeFile2(temporary, JSON.stringify(value), { mode: 384 });
    await rename2(temporary, join(connection.directory, `${name}.json`));
  }
  function start() {
    if (disposed) return Promise.reject(new Error("companion-disposed"));
    if (starting) return starting;
    starting = (async () => {
      const config = launch();
      const name = randomUUID2();
      const directory = join(config.mailboxRoot, name);
      await mkdir2(directory, { recursive: true, mode: 448 });
      await writeFile2(join(directory, "lease"), String(Date.now()));
      const applicationDirectory = config.windowsMailboxRoot ? win32.join(config.windowsMailboxRoot, name) : directory;
      const connection = { directory, poll: null, heartbeat: null, child: null, reading: false, stopped: false };
      active = connection;
      return new Promise((ready, reject) => {
        const startupTimer = setTimeout(() => {
          reject(new Error("companion-startup-timeout"));
          stop();
        }, options.startupMs ?? 15e3);
        function stop() {
          if (connection.stopped) return;
          connection.stopped = true;
          clearTimeout(startupTimer);
          clearInterval(connection.poll);
          clearInterval(connection.heartbeat);
          reject(new Error("companion-exited"));
          for (const [id, item] of pending) if (item.connection === connection) settle(id, { status: "uncertain", reason: "companion-exited" });
          connection.child?.kill();
          if (active === connection) {
            active = void 0;
            starting = void 0;
          }
          rm(directory, { recursive: true, force: true }).catch(() => {
          });
        }
        connection.stop = stop;
        connection.poll = setInterval(async () => {
          if (connection.reading || connection.stopped) return;
          connection.reading = true;
          try {
            for (const name2 of await readdir(directory)) {
              if (!/^event-[a-f0-9-]+\.json$/.test(name2)) continue;
              const path = join(directory, name2);
              const contents = await readFile2(path, "utf8");
              await rm(path);
              if (contents.length > 16e3) continue;
              const event = JSON.parse(contents);
              if (event.type === "ready" && event.protocol === 1) {
                clearTimeout(startupTimer);
                ready(connection);
              }
              if (event.type === "queued") settle(event.id, { status: "queued" });
              if (event.type === "rendered") settle(event.id, { status: "rendered", visible: event.visible, focused: event.focused });
              if (event.type === "failed") settle(event.id, { status: "failed", reason: event.reason });
              options.onEvent?.(event);
            }
          } catch {
          } finally {
            connection.reading = false;
          }
        }, options.pollMs ?? 100);
        connection.heartbeat = setInterval(() => writeFile2(join(directory, "lease"), String(Date.now())).catch(stop), 3e3);
        try {
          const env = { ...process.env };
          delete env.ELECTRON_RUN_AS_NODE;
          connection.child = spawnProcess(config.executable, [...config.args, `--dsh-notify-mailbox=${applicationDirectory}`], { stdio: "ignore", windowsHide: true, env });
          connection.child.once("error", stop);
          connection.child.once("exit", stop);
          if (disposed) stop();
        } catch {
          stop();
        }
      });
    })();
    const attempt = starting;
    attempt.catch(() => {
      if (starting === attempt) starting = void 0;
    });
    return attempt;
  }
  return {
    async deliver(payload, prepare) {
      let connection;
      try {
        connection = await start();
      } catch (error) {
        return { status: "unavailable", reason: error.message };
      }
      if (disposed || active !== connection) return { status: "unavailable", reason: "companion-disconnected" };
      if (prepare) {
        payload = prepare();
        if (!payload) return { status: "suppressed" };
      }
      const id = randomUUID2();
      return new Promise((resolveResult) => {
        const timer = setTimeout(() => settle(id, { status: "uncertain", reason: "delivery-timeout" }), options.deliveryMs ?? 5e3);
        pending.set(id, { resolve: resolveResult, timer, connection });
        command(connection, { ...payload, id, type: "deliver" }).catch(() => settle(id, { status: "uncertain", reason: "mailbox-write-failed" }));
      });
    },
    silence(eventId) {
      if (active && !active.stopped) return command(active, { type: "silence", eventId }).catch(() => {
      });
    },
    withdraw(eventId) {
      if (active && !active.stopped) return command(active, { type: "withdraw", eventId }).catch(() => {
      });
    },
    dispose() {
      disposed = true;
      for (const [id] of pending) settle(id, { status: "unavailable", reason: "companion-disposed" });
      if (active) {
        const connection = active;
        command(connection, { type: "shutdown" }).catch(() => {
        });
        const timer = setTimeout(() => connection.stop(), 1500);
        timer.unref?.();
      }
    }
  };
}
function getCompanionStatus(env = process.env, resolveLaunch = resolveCompanionLaunch) {
  let available = false;
  try {
    resolveLaunch();
    available = true;
  } catch {
  }
  const mode = env.DSH_NOTIFY_COMPANION === "0" ? "disabled" : env.DSH_NOTIFY_COMPANION === "1" ? "enabled" : "automatic";
  return { mode, available, enabled: mode !== "disabled" && (mode === "enabled" || available), scope: "reminders" };
}

// src/host/index.js
import { spawn as spawn2 } from "node:child_process";
import { existsSync as existsSync2 } from "node:fs";
var PRESENCE_PATH = "/dsh-notify-interactive/presence";
var WINDOWS_PATH = "/dsh-notify-interactive/windows-notify";
var WSL_POWERSHELL = "/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe";
var NOTIFY_COOLDOWN_MS = 2e3;
var warnedMissingPowerShell = false;
function resolvePowerShell() {
  if (process.platform === "win32") return "powershell.exe";
  if (existsSync2(WSL_POWERSHELL)) return WSL_POWERSHELL;
  return void 0;
}
function showWindowsPopup(title, body, silent = false, url = "", popup = true) {
  const executable = resolvePowerShell();
  if (executable === void 0) {
    if (!warnedMissingPowerShell) {
      warnedMissingPowerShell = true;
      console.warn("[dsh-notify-interactive] Windows popup fallback unavailable: PowerShell was not found.");
    }
    return false;
  }
  try {
    const script = popupScript(popupPayload(
      title,
      body,
      silent,
      typeof url === "string" && url !== "" ? url : process.env.DSH_WEB_URL ?? "",
      popup
    ));
    const encoded = Buffer.from(script, "utf16le").toString("base64");
    const child = spawn2(executable, [
      "-NoProfile",
      "-WindowStyle",
      "Hidden",
      "-EncodedCommand",
      encoded
    ], {
      detached: true,
      stdio: "ignore"
    });
    child.on("error", () => {
    });
    child.unref();
    return true;
  } catch {
    return false;
  }
}
function readJson(req, limit = 16384) {
  return new Promise((resolve2, reject) => {
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
        resolve2({});
        return;
      }
      try {
        resolve2(JSON.parse(Buffer.concat(chunks).toString("utf8")));
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
  const preferences = createPreferences(profile?.dir ? join2(profile.dir, "notify-interactive.settings.json") : void 0);
  let presentation = null;
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
  const lastNotify = /* @__PURE__ */ new Map();
  const companion = services.companion ?? createCompanion();
  const legacy = services.legacy ?? showWindowsPopup;
  let companionWarning = "";
  function notifyOnce(sessionId, kind, title, body, silent = false, url = "") {
    const now = Date.now();
    const key = `${sessionId}:${kind}`;
    const last = lastNotify.get(key);
    if (last !== void 0 && now - last < NOTIFY_COOLDOWN_MS) return false;
    lastNotify.set(key, now);
    if (lastNotify.size > 200) {
      for (const [entryKey, at] of lastNotify) {
        if (now - at > 10 * 60 * 1e3) lastNotify.delete(entryKey);
      }
    }
    return legacy(title, body, silent, url);
  }
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
      const view = body.presentation;
      if (view && typeof view.url === "string" && /^https?:\/\//.test(view.url)) {
        const url = new URL(view.url);
        if (!url.username && !url.password) presentation = { url: url.origin, theme: view.theme ?? {}, openLabel: truncate(view.openLabel ?? "DSH", 80), closeLabel: truncate(view.closeLabel ?? "Close", 80) };
      }
      if (body.focused && body.visible) for (const fact of coordinator.deliveredFor(body.sessionId)) {
        void companion.withdraw?.(fact.id);
        void companion.silence?.(fact.id);
      }
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
      const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "web";
      const kind = typeof body?.kind === "string" ? body.kind : "notice";
      const title = truncate(body?.title ?? "DSH", 80);
      const text = truncate(body?.body ?? "", 500);
      const requestedUrl = typeof body?.url === "string" && /^https?:\/\//.test(body.url) ? body.url : process.env.DSH_WEB_URL ?? "";
      if (coordinator.resolve(sessionId, kind, body.callId) && requestedUrl) {
        const { status, ...result } = await dispatch({ ...body, sessionId, kind, url: requestedUrl }, true);
        writeJson(res, status, result);
        return;
      }
      if (getCompanionStatus().enabled && ["completion", "demo-completion", "demo-approval", "demo-question", "demo-plan-review"].includes(kind) && requestedUrl) {
        const url = new URL(requestedUrl);
        url.searchParams.set("dsh-notify-session", sessionId);
        const sound = body?.sound ?? {};
        const preset = SOUND_PRESETS.find((item) => item.id === sound.preset);
        const audio = body?.silent === true || sound.enabled === false || !preset ? "" : renderPresetToDataUrl(preset);
        const sessionTitle = truncate(body?.sessionTitle ?? "", 200);
        const prefix = `${sessionTitle} \xB7 `;
        const desktopBody = sessionTitle && text.startsWith(prefix) ? text.slice(prefix.length) : text;
        const result = await companion.deliver({
          title,
          sessionTitle,
          body: desktopBody,
          url: url.href,
          popup: true,
          openLabel: truncate(body?.openLabel ?? "DSH", 80),
          closeLabel: truncate(body?.closeLabel ?? "Close", 80),
          theme: body?.theme ?? {},
          audio,
          volume: Number.isFinite(sound.volume) ? Math.max(0, Math.min(1, sound.volume)) : 0.7
        });
        if (result.status === "rendered") companionWarning = "";
        if (["rendered", "uncertain", "queued"].includes(result.status)) {
          writeJson(res, 200, { shown: result.status === "rendered", delivery: result.status });
          return;
        }
        if (companionWarning !== result.reason) {
          companionWarning = result.reason;
          console.warn("[dsh-notify-interactive] companion fallback:", result.reason);
        }
      }
      const shown = notifyOnce(sessionId, kind, title, text, body?.silent === true, requestedUrl);
      writeJson(res, 200, { shown, delivery: shown ? "process-started" : "unavailable" });
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
        if (!policy.popup) void companion.withdraw?.(fact.id);
        if (!policy.sound) void companion.silence?.(fact.id);
      }
      writeJson(res, next.conflict ? 409 : 200, next);
    } catch {
      writeJson(res, 503, { error: "preferences-unavailable" });
    }
  }
  async function dispatch(body, legacyClient = false) {
    if (typeof body.sessionId !== "string" || !["approval", "question", "plan-review", "completion"].includes(body.kind)) return { status: 400, shown: false, delivery: "invalid-event" };
    const url = new URL(body.url);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return { status: 400, shown: false, delivery: "invalid-url" };
    const fact = coordinator.resolve(body.sessionId, body.kind, body.callId);
    if (!fact) return { status: 409, shown: false, delivery: "event-not-current" };
    presentation = { theme: body.theme ?? {}, url: body.url, openLabel: body.openLabel, closeLabel: body.closeLabel };
    if (coordinator.attended(body.sessionId) && !coordinator.attended(body.sessionId, fact.at)) await new Promise((resolve2) => setTimeout(resolve2, 1100));
    const { settings } = await preferences.snapshot();
    if (!coordinator.claim(fact)) return { status: 200, shown: false, delivery: "duplicate" };
    const policy = channelPolicy(settings, body.kind, coordinator.attended(body.sessionId, fact.at));
    if (legacyClient && body.silent) policy.sound = false;
    url.searchParams.set("dsh-notify-session", body.sessionId);
    const sessionTitle = truncate(body.sessionTitle ?? "", 200);
    const text = truncate(body.body ?? "", 500);
    const prefix = `${sessionTitle} \xB7 `;
    const result = await deliverNotification({
      companion,
      available: services.available ?? getCompanionStatus().enabled,
      legacy,
      policy,
      getPolicy: () => {
        const value = channelPolicy(preferences.current(), body.kind, coordinator.attended(body.sessionId, fact.at));
        if (legacyClient && body.silent) value.sound = false;
        return value;
      },
      isCurrent: () => coordinator.resolve(body.sessionId, body.kind, body.callId)?.id === fact.id,
      payload: {
        eventId: fact.id,
        sticky: body.kind !== "completion",
        title: truncate(body.title ?? "DSH", 80),
        sessionTitle,
        body: sessionTitle && text.startsWith(prefix) ? text.slice(prefix.length) : text,
        url: url.href,
        theme: body.theme ?? {},
        openLabel: truncate(body.openLabel ?? "DSH", 80),
        closeLabel: truncate(body.closeLabel ?? "Close", 80),
        webPopup: body.webPopup === true
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
    for (const [path, handler] of [["settings", settingsRoute], ["deliver", coordinatedDelivery]]) {
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
        writeJson(res, 200, getCompanionStatus());
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
    for (const old of before) if (coordinator.resolve(session.id, old.kind)?.id !== old.id) {
      void companion.withdraw?.(old.id);
      void companion.silence?.(old.id);
    }
    if (!fact) return;
    const timer = setTimeout(async () => {
      timers.delete(timer);
      if (!coordinator.pending(fact)) return;
      try {
        const { settings } = await preferences.snapshot();
        const policy = channelPolicy(settings, message.kind, coordinator.attended(session.id, fact.at));
        if (!coordinator.claim(fact)) return;
        const base = presentation?.url || process.env.DSH_WEB_URL || "";
        const url = base ? new URL(base) : null;
        url?.searchParams.set("dsh-notify-session", String(session.id));
        const payload = {
          eventId: fact.id,
          sticky: message.kind !== "completion",
          title: message.title,
          sessionTitle: "",
          body: message.body,
          url: url?.href ?? "http://localhost/",
          theme: presentation?.theme ?? {},
          openLabel: presentation?.openLabel ?? "DSH",
          closeLabel: presentation?.closeLabel ?? "Close"
        };
        const result = await deliverNotification({
          companion,
          policy,
          available: Boolean(presentation) && (services.available ?? getCompanionStatus().enabled),
          legacy,
          payload,
          getPolicy: () => channelPolicy(preferences.current(), message.kind, coordinator.attended(session.id, fact.at)),
          isCurrent: () => coordinator.resolve(session.id, message.kind)?.id === fact.id
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
    coordinator.clear();
    companion.dispose();
    lastNotify.clear();
  }, "dsh-notify-interactive: host runtime");
}
function apply(ctx) {
  return applyHost(ctx);
}
export {
  apply,
  applyHost
};
