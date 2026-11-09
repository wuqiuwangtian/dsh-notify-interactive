# dsh-notify-interactive

DSH Web reminders: stay silent while attending the relevant conversation, otherwise notify through a small desktop window. Current focus: DSH Web in Arch WSL, with a Windows companion.

[中文](README.md) · [Requirements](docs/requirements.md) · [Research](docs/research.md) · [Verification](docs/verification.md)

## Development status

P3 answer-bridge development code targeting DSH 0.2.2-rc.1. Package version remains 0.2.1; these changes are unreleased.

Approvals, questions, plan reviews and completion share host delivery claims. Linked requests support Allow once/Reject, full question batches, single/multiple choices, custom text and explicit skipping. Plan reviews retain the original options and full plan. Popups and sound have independent global/per-event controls and presets. Preferences migrate to the current profile with revision-based merging; offline edits remain queued.

**Desktop answering requires an authenticated, connected Web page owning the live Pending object.** Missing call IDs, repeated approvals on the same call ID or mismatched metadata remain reminder-only. Lost acknowledgements never replay answers; uncertain results require checking DSH. Drafts survive a temporary Web disconnect, but not a companion restart. TUI, DSH Desktop and native Linux acceptance are outside this iteration.

The host only observes committed session/event messages. No automatic answers, session-log writes, prompt injection, model-tool registration or approval-waterfall interception. Plugin routes use DSH authentication, authority checks and owner admission.

## Local setup

The current Web profile is linked to this repository. Within DSH, prefer plugin_manager install_bundle with the absolute repository path.

```sh
pnpm install
pnpm companion:install
pnpm verify
```

The companion installer needs Node.js >=22.12; the plugin still supports Node.js 20. The Windows Electron runtime is about 357 MiB, plus the WSL download copy. It lives in LocalAppData, without autostart registration or an extra network listener. Installed companions are detected automatically; DSH_NOTIFY_COMPANION=0 forces the previous native path.

After active work finishes, restart DSH and refresh all authenticated Web tabs:

```sh
dsh --profile web --no-open
```

Configure event channels in Interactive notifications. Confirm that profile preferences are saved. The authoritative file is notify-interactive.settings.json in the current profile (schema v3 with revision); dsh.notify-interactive.settings.v2 localStorage remains a cache/migration source. The first successful migration wins; later pages adopt the profile state. Corrupt files are not silently overwritten.

## Verification and limitations

```sh
pnpm verify
pnpm companion:smoke
pnpm coordination:smoke
pnpm interaction:smoke
```

Desktop smoke commands show real synthetic windows and may play audio. Interaction smoke clicks the actual Windows renderer using a temporary loopback DevTools endpoint belonging only to its test process, with mock DSH context/auth and Pending objects; production does not open this endpoint. Actual user sessions and precise return navigation still require acceptance testing. See verification sections 11–12.

Without the companion, the Windows fallback uses the existing PowerShell dialog/system sound; process startup does not prove visibility or matching synthesized sound presets. Native Linux remains unverified.

Build and commit lib with source changes. Window updates can be staged with node scripts/stage-companion.mjs; content revisions reload the notification companion.

[MIT](LICENSE) © 2026 wuqiuwangtian
