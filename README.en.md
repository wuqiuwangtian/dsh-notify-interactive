# dsh-notify-interactive

DSH reminders for approvals, questions, plan reviews, and turn completion. The target experience is automatic DSH-styled interactive popups, independent sound and popup controls, silence while attending the relevant conversation, and Windows/Linux support.

[中文](README.md) · [Requirements and plan](docs/requirements.md) · [Investigation](docs/research.md) · [Verification](docs/verification.md)

## Current status

Code version: `0.2.1`; target DSH: `0.2.2-rc.1`. As of 2026-11-09, the project is being replanned. P0 investigation has begun, with a fix for Web fallback sound leakage. The target behavior is not fully implemented or accepted.

The existing Web UI includes approval/question/plan/completion cards, answer construction, five audible sound presets plus silence, volume, and preview. Interactive windows require a manual opening, close when empty, and do not automatically reopen for subsequent events.

When no interactive window is open, the Web client requests a PowerShell WinForms reminder from the host. Without active Web presence the host attempts it directly. This supports Windows/WSL paths only; there is no native Linux desktop fallback. Real desktop delivery and answer flows remain unverified, and the user has reported popup failures.

Settings currently live in browser localStorage (`dsh.notify-interactive.settings.v2`). There is no popup master switch, per-event settings UI, or per-event sound selection. The host does not share browser settings when the Web client is absent. The Windows open action currently opens a site URL, without guaranteed session selection.

## Direction

First diagnose delivery failures and investigate reusable DSH desktop capabilities. Then compare a plugin with system notifications against a plugin with a desktop companion. A companion can manage windows outside browser popup restrictions, but adds installation, communication, packaging, and upgrade work. The user chose browser DSH with a desktop companion; an optional Electron completion-only prototype now exists; full integration is pending.

The authoritative plan and acceptance criteria are in the linked Chinese documents. No automatic answers, session-log writes, model-tool registration, prompt injection, or approval-waterfall interception. System fallback remains reminder-only; answers require explicit human action.

## Optional completion prototype (Arch WSL to Windows)

The current focus is Web UI. TUI and DSH Desktop are outside this iteration. The installer needs Node.js >=22.12; the Windows Electron runtime is about 357 MiB, plus the WSL download copy.

```sh
pnpm companion:install
pnpm companion:smoke
# Stop the previous DSH host after its active work finishes, then start:
DSH_NOTIFY_COMPANION=1 dsh --profile web --no-open
```

Refresh the authenticated browser page, keep the old interactive popup closed, and try the completion demo. The companion uses a connection-scoped file mailbox in Windows LocalAppData, with no extra listening port or autostart registration. Remove the environment flag and restart to revert. Approvals/questions still use the previous path. See verification section 7 for limitations and acceptance steps.

## Install the current implementation

These commands install the existing limited implementation, not the planned redesign:

```sh
dsh plugin --profile web add https://github.com/wuqiuwangtian/dsh-notify-interactive
```

Or use the existing package:

```sh
dsh plugin --profile web add ./dsh-notify-interactive-0.2.1.tgz
```

Install into the corresponding CLI/TUI profile if needed; current fallback only attempts Windows reminders. Refresh the Web page after installation; host changes require a DSH restart. Within DSH, prefer `plugin_manager install_bundle` with the absolute repository path.

## Development and verification

```sh
pnpm install
pnpm verify
```

`src/client/` owns Web state/presence, `src/host/` observes host events and attempts Windows delivery, `src/ui/` contains cards/settings, and `src/audio/` contains sound generation. Build and commit `lib/client.js` with source changes.

The latest pnpm verify passed build, syntax checks, 64 tests, and render smoke. Windows desktop visibility, audio start, restart recovery, and the built host route have passed smoke validation. Real DSH session delivery and return navigation remain unverified; no release was published. Passing mocks/rendering does not establish reliable desktop delivery. See the verification document for diagnostic steps and the new acceptance matrix.

## License

[MIT](LICENSE) © 2026 wuqiuwangtian
