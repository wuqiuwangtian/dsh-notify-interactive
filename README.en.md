# dsh-notify-interactive

DSH Web reminders: stay silent while attending the relevant conversation, otherwise notify through a small desktop window. Current focus: DSH Web in Arch WSL, with a Windows companion.

[中文](README.md) · [Requirements](docs/requirements.md) · [Research](docs/research.md) · [Verification](docs/verification.md)

## Development status

The November 21 plan moves Windows delivery to native app notifications with Notification Center history. The implementation described below predates this migration. The opt-in native preview handles approvals, questions, plans and turn completions, with four completion timing options and independent audio. Click a notification to open the original Web session. Run `pnpm native:acceptance --windows-toast --host <WSL-IPv4> --port <free-port>` to try an isolated profile. See the [current roadmap](docs/requirements.md).

P3 answer-bridge development code targeting DSH 0.2.2-rc.1. Package version remains 0.2.1; these changes are unreleased.

Approvals, questions, plan reviews and completion share host delivery claims. Linked requests support Allow once/Reject, full question batches, single/multiple choices, custom text and explicit skipping. Plan reviews retain the original options and full plan. Popups and sound have independent global/per-event controls and presets. Preferences migrate to the current profile with revision-based merging; offline edits remain queued.

**Desktop answering requires an authenticated, connected Web page owning the live Pending object.** Approvals with missing IDs, repeated call IDs or mismatched metadata remain reminder-only. Unnamed blocking questions require a unique match of the complete host question batch; plan reviews use intent.callId. Lost acknowledgements never replay answers. Drafts survive a temporary Web disconnect, but not a companion restart. TUI, DSH Desktop and native Linux acceptance are outside this iteration.

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

`pnpm native:acceptance` starts an isolated temporary DSH profile with a deterministic local adapter, real native approvals and built-in question/plan tools. It does not read existing credentials or make external model requests. Add `--timed` for continued/rpc questions; Ctrl+C cleans up. Requires installed DSH 0.2.2-rc.1. See verification section 13 for evidence and remaining manual checks.

If Windows cannot reach WSL localhost while WSL itself responds, check localhost forwarding. When idle, an alternative is `dsh web --host <WSL-IPv4> --port 3080 --no-open`, using its newly printed complete authentication URL. Find the address with `ip -4 -o addr show dev eth0`; it may change after a WSL restart. This binds the WSL interface and is intended for a trusted local network.

[MIT](LICENSE) © 2026 wuqiuwangtian
