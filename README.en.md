# dsh-notify-interactive

> Reminders for DeepSeek Harness when a task needs you. Stay silent while you are focused on the current conversation; otherwise raise a small Windows popup with the actual content. Open the optional DSH-styled interactive popup only when you want to answer in the window. CLI/TUI uses the same Windows popup.

[中文](README.md) · [Requirements](docs/requirements.md) · [Research](docs/research.md) · [Verification](docs/verification.md)

## What it does

Only interrupts when a human is needed:

- tool approval (escalation, writes, commands);
- agent question / plan review;
- turn completion.

One rule: **while you are focused on the current conversation, nothing happens.** Otherwise:

1. by default the host raises a small Windows popup with the actual content (reminder-only);
2. open the DSH-styled interactive popup only when you want to answer; it opens on demand and closes after handling;
3. no Web UI (CLI/TUI) → the same Windows popup.

## Features

| Capability | Detail |
|---|---|
| Events | Approval, question, plan review, turn completion |
| Silence rule | Focused on the current conversation → no reminder |
| Web popup | Optional, on demand; Document Picture-in-Picture (always on top), auto-closes after handling |
| In-popup actions | Allow/reject; select/custom/skip questions; approve/decline plan; back to conversation |
| CLI/TUI fallback | Host observes session events and shows a PowerShell Windows popup |
| Closed-tab fallback | Web client reports presence; the host takes over after the page is gone |
| Sound | Optional Web Audio; the Windows fallback plays the system sound |
| Minimal UI | Title, necessary context, session entry, and actions only; no outer popup header or extra close buttons |
| Privacy | No session-log writes, no model tools, no auto-answer, no uploads |

## Status

- Version `0.2.1` (phase 1 redesign)
- DSH `0.2.2-rc.1` line, Web / CLI / TUI profiles
- Removed: in-page cards, browser Notification channel, notification permission, popup toggle, behavior clutter

## Install

```sh
dsh plugin --profile web add https://github.com/wuqiuwangtian/dsh-notify-interactive
```

or install the release tarball:

```sh
dsh plugin --profile web add ./dsh-notify-interactive-0.2.1.tgz
```

The same package works in CLI/TUI profiles; the host half takes over when no Web UI is present.

Refresh the DSH page after installing. The interactive popup is not required; CLI/TUI needs no window.

> Upgrading from 0.1.x to 0.2.x adds the host Windows fallback and presence routes, so restart the DSH process once; later updates only need a page refresh.

## First run

1. Refresh DSH.
2. Nothing needs to be open by default: every message raises a small Windows popup with the actual content (reminder-only). Use **Test Windows reminder** to verify.
3. Open the optional interactive popup only when you want to answer in the window; it is available only while a card exists and closes after handling.
4. The test approval/question/completion cards show interactive cards while the popup is open; with it closed they raise a Windows demo popup.

## Rules

| Situation | Behavior |
|---|---|
| Focused on the current conversation | No reminder |
| Web page in front, another conversation | Windows popup with content; if the optional popup is already open, the card appears there |
| Web page unfocused/hidden | Windows popup with content; if the optional popup is already open, the card appears there |
| Web page closed / CLI / TUI | Host Windows popup |

- The Web interactive popup **cannot be opened by a background event** (browser restriction); open it manually when a card exists.
- It has no empty state: it closes automatically when there is nothing to show.
- The Windows fallback is **reminder-only**; it cannot approve, reject, or answer.
- Sound is optional; the Windows fallback plays the system sound.
- The current conversation is handled by DSH's own UI; the plugin stays silent.

## Settings

| Setting | Default | Meaning |
|---|---|---|
| Enable notifications | on | Master switch |
| Play a sound | on | Web sound |
| Sound | chime | Six local presets, including silent |
| Volume | 70% | 0–100% |
| Open/close popup | — | Available only while a card exists; closes after handling |
| Test popup | — | Add a demo card and open the popup |
| Test Windows reminder | — | Call the host Windows fallback |
| Test cards | — | Local demos; never answer a real request |
| Reset preferences | — | Reset settings without removing the plugin |

Settings live in `localStorage` under `dsh.notify-interactive.settings.v2`.

## How it works

```text
Host (loaded in Web, CLI, and TUI)
  session/event:
    approval/asked · tool/call(ask_user_question|exit_plan_mode) · turn/end
        ├─ active web presence → do nothing (the web client owns delivery)
        └─ no web presence → PowerShell Windows popup (reminder only)

Web client
  presence every 5s + focus/visibility/session changes → POST /dsh-notify-interactive/presence
  uiSession.sessionStatus + sessions.list
        ├─ focused current conversation → silent
        └─ otherwise:
             the card is stored locally
             popup closed → POST /dsh-notify-interactive/windows-notify
             popup open → render the card; close when empty
```

- No `shell.overlay`; no in-page notifications.
- The host does not listen to the approval/question waterfall; it only observes committed session events.
- The Windows fallback is a native WinForms window: title/body arrive via base64 + UTF-16 command, it is topmost at the bottom-right, has **Open DSH / Close** buttons, auto-closes after 5 minutes, and does not block the host.

## Can a native Windows popup accept input/selection?

- The fallback is now a **native WinForms window** with title, body, **Open DSH** and **Close** buttons; clicks respond and it can open DSH.
- It is currently **reminder + open DSH** only; it has no radio/checkbox/text input yet. WinForms/WPF can do that: add controls and return the result. A native answerable popup can be a phase 2 feature. The tradeoff is a separate native UI that cannot match DSH exactly, and the host would need to own the answer chain.
- The old blank `WScript.Shell.Popup` window has been removed.
- The DSH-styled Web popup remains an optional answerable surface: open it on demand only while a card exists; it closes after handling.

## Limitations

| Limit | Detail |
|---|---|
| Interactive popup is optional | Open it once only when you want in-window answers; without it, every message uses the Windows popup |
| Windows fallback is read-only | Cannot approve/reject/answer; return to DSH or the terminal |
| Platform | Windows or WSL (PowerShell path detection); no Windows fallback elsewhere |
| No GUI | Without a desktop, Windows popups cannot display either |
| Multiple tabs | Each tab runs independently; phase 2 leader election |
| Presence delay | Up to 15s takeover after a crash without `pagehide` |
| Completion reason | Host Windows text distinguishes reasons; the Web card uses “turn finished” |
| Settings sync | Per-browser localStorage |

## Prior art

No active project matched the full requirement set. See [docs/research.md](docs/research.md):

- `dsh-popup-notify` — topmost but non-interactive;
- `dsh-approval-popup` — approval only;
- `dsh-reminder` — click-to-return, no in-popup answers;
- `dsh-notifier` — phone-side answers, not a DSH-styled desktop popup;
- `deepseek-harness-desktop` — a full desktop app, not a web plugin.

## Development

```sh
pnpm install
pnpm verify   # build + node --check + node --test + render smoke
```

`lib/client.js` is committed and generated from `src/`; do not edit it by hand. CI verifies the artifact is current.

## License

[MIT](LICENSE) © 2026 wuqiuwangtian
