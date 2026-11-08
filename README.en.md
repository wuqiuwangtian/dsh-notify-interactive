# dsh-notify-interactive

> Interactive reminders for the DeepSeek Harness Web UI: sound, an always-on-top DSH-styled popup, and Windows notifications for approvals, questions, plan reviews, and finished turns. Answer directly in the popup, and jump back to the conversation from a completion card.

[中文](README.md) · [Requirements](docs/requirements.md) · [Research](docs/research.md) · [Verification](docs/verification.md)

## Why “interactive”

Most DSH notification plugins only tell you that something happened; you still switch back to DSH to find the approval or question card. This plugin renders the **same pending request** in a detached window:

- Approval: allow once or reject right there.
- Question: single-select, multi-select, custom text, or skip, matching the DSH page flow.
- Plan review: read the plan, approve or decline.
- Completion: click **Back to conversation** to open the session.

It never answers for you: every decision requires an explicit click.

## Features

| Capability | Detail |
|---|---|
| Three events | Tool approval, question / plan review, turn completion |
| Three independent channels | Sound, interactive popup, Windows system notification |
| Popup | Document Picture-in-Picture (always on top) when available; normal popup or in-page fallback otherwise |
| In-popup answering | Approval allow/reject; question options + custom + skip; plan approve/decline |
| Completion return | Opens the exact session via `ctx.uiWorkspace.openSession` |
| Sound | Six locally synthesized Web Audio presets, volume, preview |
| Multi-session | One card per session with its title; subagents quiet by default |
| Do not disturb | Suppresses the currently focused session; no replay on reload/reconnect |
| DSH style | Only DSH theme tokens; light/dark and zh/en follow the host |
| Privacy | Browser-only; no session-log writes, no model tools, no external requests |

## Status

- Version `0.1.3` (phase 1), DSH `0.2.2-rc.1` line, Web profile.
- Phase 2: per-scenario toggles/sounds, turn-end reason, per-session mute, multi-tab leader election, optional native toast.

## Install

```sh
dsh plugin --profile web add https://github.com/wuqiuwangtian/dsh-notify-interactive
```

or install the release tarball:

```sh
dsh plugin --profile web add ./dsh-notify-interactive-0.1.3.tgz
```

Refresh the DSH page after installing. The Host half is an empty `apply()`; the browser half loads with the page.

## First run

1. Refresh DSH.
2. Open **Settings → Interactive notifications**.
3. Click **Allow notifications** for the Windows notification-center channel.
4. Click **Open popup**. Browser security requires one user click to open an always-on-top window; it stays open until you close it.
5. Use the test approval/question/completion cards to verify the UI. They are local demos and never answer a real request.

## Settings

| Setting | Default | Meaning |
|---|---|---|
| Enable notifications | on | Master switch |
| Play a sound | on | Sound channel |
| Sound | chime | chime / pulse / complete / soft / alert / silent |
| Volume | 70% | 0–100% |
| Show the interactive popup | on | Popup channel; in-page fallback when no popup |
| Open/close popup | — | Manual popup control |
| Show a Windows notification | on | Browser Notification → Windows notification center |
| Notification permission | not granted | Grant / test |
| Do not disturb the current session | on | Skip when the page is focused on that session |
| Include subagent sessions | off | Subagent sessions stay quiet |
| Completion card timeout | 8 s | 0 = keep until dismissed |
| Maximum visible cards | 3 | The popup scrolls the full queue |

Settings live in browser `localStorage` (`dsh.notify-interactive.settings.v1`), per browser. The plugin never edits the profile patch.

## How it works

```text
uiSession.sessionStatus + sessions.list
        ↓
Notification Engine (baseline, dedupe, gates, "do not disturb")
        ├── Web Audio sound
        ├── Notification API → Windows notification center
        └── NotificationStore
                ├── shell.overlay in-page cards
                └── Document PiP / window.open popup
                        ├── PendingApproval.answer(...)
                        ├── PendingQuestion.answer({ answers: [...] })
                        └── ctx.uiWorkspace.openSession(sessionId)
```

The popup shares the page's JS runtime, so it calls the same `PendingApproval` / `PendingQuestion` objects the DSH page already created. That is why answering in the popup behaves like answering in the page.

It does not register a waterfall listener, does not change the approval chain, and does not write the session log.

## Limitations

- The DSH page must stay open; notifications stop when the tab closes.
- Document PiP needs Chromium (Edge/Chrome); other browsers fall back to a normal popup or the in-page overlay.
- System notifications require site permission; denied permission is never re-prompted automatically.
- Phase 1 labels every completion as “turn finished”; it does not distinguish completed/error/aborted yet (phase 2).
- “Always allow” is not offered; `PendingApproval` exposes allow-once/reject only.
- Plan review shows a plain-text preview; edit complex plans in DSH.
- Only the highest-precedence pending interaction per session is surfaced, matching DSH.
- Settings are per browser, not synced.

## Prior art

No active project matched the full requirement set. See [docs/research.md](docs/research.md) for the comparison:

- `dsh-popup-notify` — topmost Windows dialogs, not interactive.
- `dsh-approval-popup` — native approve/reject only, no question answers.
- `dsh-reminder` — click-to-return popups, no in-popup answering.
- `dsh-notifier` — phone-side answers, not a DSH-styled Windows popup.
- `deepseek-harness-desktop` — a full desktop app with a native approve action, not a web plugin.

## Development

```sh
pnpm install
pnpm verify   # build + node --check + node --test
```

`lib/client.js` is committed and generated from `src/`; do not edit it by hand. CI verifies that the committed artifact matches the source.

## License

[MIT](LICENSE) © 2026 wuqiuwangtian
