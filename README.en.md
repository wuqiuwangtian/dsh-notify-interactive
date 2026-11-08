# dsh-notify-interactive

> Reminders for DeepSeek Harness when a task needs you. Stay silent while you are focused on the current conversation; otherwise show the DSH-styled interactive popup, or a Windows popup fallback when the popup is unavailable (or there is no Web UI, such as CLI/TUI). The Windows fallback is reminder-only.

[中文](README.md) · [Requirements](docs/requirements.md) · [Research](docs/research.md) · [Verification](docs/verification.md)

## What it does

Only interrupts when a human is needed:

- tool approval (escalation, writes, commands);
- agent question / plan review;
- turn completion.

One rule: **while you are focused on the current conversation, nothing happens.** Otherwise:

1. the interactive popup is open → show the card there and answer directly;
2. the popup is closed or unavailable → the host shows a Windows popup reminder (no answering);
3. no Web UI (CLI/TUI) → the host uses the Windows popup reminder directly.

## Features

| Capability | Detail |
|---|---|
| Events | Approval, question, plan review, turn completion |
| Silence rule | Focused on the current conversation → no reminder |
| Web popup | Document Picture-in-Picture (always on top), normal popup fallback |
| In-popup actions | Allow/reject; select/custom/skip questions; approve/decline plan; back to conversation |
| CLI/TUI fallback | Host observes session events and shows a PowerShell Windows popup |
| Closed-tab fallback | Web client reports presence; the host takes over after the page is gone |
| Sound | Optional Web Audio; the Windows fallback plays the system sound |
| Minimal UI | Title, necessary context, session entry, and actions only; no outer popup header or extra close buttons |
| Privacy | No session-log writes, no model tools, no auto-answer, no uploads |

## Status

- Version `0.2.0` (phase 1 redesign)
- DSH `0.2.2-rc.1` line, Web / CLI / TUI profiles
- Removed: in-page cards, browser Notification channel, notification permission, popup toggle, behavior clutter

## Install

```sh
dsh plugin --profile web add https://github.com/wuqiuwangtian/dsh-notify-interactive
```

or install the release tarball:

```sh
dsh plugin --profile web add ./dsh-notify-interactive-0.2.0.tgz
```

The same package works in CLI/TUI profiles; the host half takes over when no Web UI is present.

Refresh the DSH page after installing. The Web popup must be opened once; CLI/TUI needs no window.

> Upgrading from 0.1.x to 0.2.0 adds the host Windows fallback and presence routes, so restart the DSH process once; later updates only need a page refresh.

## First run

1. Refresh DSH.
2. Settings → Interactive notifications → **Open popup**. Browser security requires one user click; keep it open.
3. Use the test approval/question/completion cards.
4. Use **Test Windows reminder** to verify the host fallback (Windows/WSL).
5. After closing the popup, reminders use the Windows popup; reopen the popup to restore interaction.

## Rules

| Situation | Behavior |
|---|---|
| Focused on the current conversation | No reminder |
| Web page in front, another conversation | Popup open → popup card; closed → Windows popup |
| Web page unfocused/hidden | Popup open → popup card; closed → Windows popup |
| Web page closed / CLI / TUI | Host Windows popup |

- The Web interactive popup **cannot be opened by a background event** (browser restriction); open it once and keep it.
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
| Open/close popup | — | Manual popup control |
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
             popup open → add a card to the popup queue
             popup closed → POST /dsh-notify-interactive/windows-notify
```

- No `shell.overlay`; no in-page notifications.
- The host does not listen to the approval/question waterfall; it only observes committed session events.
- The Windows fallback uses `WScript.Shell.Popup`, auto-closes after 5 minutes, and does not block the host.

## Limitations

| Limit | Detail |
|---|---|
| Popup must be opened once | Browser security; after closing, Windows fallback takes over |
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
