# dsh-notify-interactive

Windows Notification Center reminders for DSH Web approvals, questions, plan reviews and completed turns. By default, events in the conversation you are viewing stay quiet. Press Win+N and click a notification to return to its session.

[中文](README.md) · [Requirements](docs/requirements.md) · [Acceptance results](docs/verification.md#17-正式通道安装升级与卸载)

## Install or upgrade

The local release candidate is **0.3.0**, tested with Arch WSL, Windows 11 and DSH 0.2.2-rc.5. Use DSH’s `plugin_manager` operation `install_bundle` with the absolute path of the extracted package or built checkout. Restart DSH Web and reload its open pages. The host registers a windowless Windows activator for the current user.

Open the original browser and Web origin after upgrading. Existing profile settings take precedence. A browser with saved settings can migrate them into `notify-interactive.settings.json` in the current profile. A fresh browser leaves migration available until an explicit settings edit.

## Use

Open **Settings → Interactive notifications** to configure notifications, audio and sound presets independently for each event. Completion notification timing has four levels. With a conversation open, use **Test desktop completion reminder**, open Win+N and click the entry under **DSH Web**. Windows controls banners, Do Not Disturb and notification history.

A connected, authenticated page owning the live request enables one-time approval, rejection and short single-choice or text answers. Open the original session for a batch, a multi-select question or a plan. Clearing a notification leaves its request pending. Verify uncertain submissions in DSH.

The host uses the bound DSH listener origin. If Windows reaches your instance through a proxy or another name, set `DSH_NOTIFY_WINDOWS_ORIGIN` to that trusted origin and restart. Reuse the same address, port and profile for historical links. If login is required, authenticate in the same browser and refresh the target page.

The settings master switch controls reminders. `DSH_NOTIFY_WINDOWS=0` disables the Windows transport at host startup. The previous `DSH_NOTIFY_COMPANION=0` is honored when the new variable is absent. Native Linux desktop delivery has not been validated.

## Uninstall

To reclaim the previous Windows Electron runtime only, stop the old host and run `node scripts/uninstall-windows.mjs --legacy-only`. For full removal, disable the plugin and stop all DSH instances using it. From the extracted package or repository run the following, then remove the bundle using DSH. Full cleanup removes this Windows user’s DSH notification history, OS notification preferences, registrations and helper files across profiles. DSH profile preferences are retained.

```sh
node scripts/uninstall-windows.mjs --dry-run
node scripts/uninstall-windows.mjs
```

## Development

```sh
pnpm install --frozen-lockfile
pnpm verify
pnpm pack
pnpm native:acceptance --host 127.0.0.1 --port 39714
```

The acceptance harness uses a temporary home and a deterministic local adapter. Ctrl+C cleans up. Pass `--bundle <installed package directory>` to test an actual package. Use a Windows-reachable WSL IPv4 on a trusted network if loopback forwarding is unavailable.

[MIT](LICENSE)
