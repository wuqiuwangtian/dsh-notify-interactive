# dsh-notify-interactive

DSH Web 的审批、提问、计划审核和一轮结束可以进入 Windows 通知中心。默认在离开事件所属会话时提醒。横幅消失后按 Win+N，点击正文回到该会话。

[English](README.en.md) · [需求与路线](docs/requirements.md) · [实机验收](docs/verification.md#17-正式通道安装升级与卸载)

## 安装与升级

下载并解压 [dsh-notify-interactive-0.3.0.tgz](https://github.com/wuqiuwangtian/dsh-notify-interactive/releases/download/v0.3.0/dsh-notify-interactive-0.3.0.tgz)。此版本已在 Arch WSL、Windows 11 与 DSH 0.2.2-rc.5 上验收。使用 DSH 的 `plugin_manager` 执行 `install_bundle`，target 指向解包目录或已构建的仓库绝对路径。已有本地链接的 profile 直接使用新版构建产物。升级后重启 DSH Web，刷新已打开的 DSH 标签。Windows 当前用户的无窗口激活程序在启动时自动注册。

升级时用原来的浏览器和 Web 地址打开页面。已有 profile 配置优先；只有浏览器里有旧配置或用户主动修改设置时，才首次写入 profile。存储文件为当前 profile 的 `notify-interactive.settings.json`。完成通知时机缺省为「离开当前会话时」。

## 设置和使用

- 在「设置 → 互动提醒」分别配置四类事件的通知、声音和音效，选择默认音效和音量。完成通知另有始终、离开当前会话、离开整个 DSH 窗口、从不四档。
- 打开一个会话，在设置页点「测试桌面提醒」，再到 Win+N 的「DSH Web」下找到它。Windows 的应用开关、横幅开关和勿扰设置继续生效。升级沿用预览版的 Windows 通知身份。
- 有在线且已认证的页面持有当前请求时，短审批可在系统通知里允许一次或拒绝；简单题支持短单选、输入或显式跳过。复杂提问和计划进入原 Web 界面处理。清除通知不会替你回答。结果不确定时，打开会话核对。
- 默认使用 DSH 实际监听的 Web 地址。若通过反向代理或不同主机名登录，把 `DSH_NOTIFY_WINDOWS_ORIGIN` 设为 Windows 可达且已登录的 Web origin，例如 `https://dsh.example.org`，再重启。地址、端口和 profile 一致，才可在重启后用旧通知定位会话。需要登录时，在同一浏览器完成登录，再刷新目标页面。
- 可从设置关闭提醒。要在宿主启动时禁用整个 Windows 通道，设置 `DSH_NOTIFY_WINDOWS=0`。兼容旧的 `DSH_NOTIFY_COMPANION=0`；显式设置新变量优先。缺少 Windows 互操作或动作辅助程序时，设置页提供状态。Linux 原生桌面未验收。

## 卸载

仅移除旧版安装器下载的 Windows Electron 运行时，可在关闭旧版宿主后运行 `node scripts/uninstall-windows.mjs --legacy-only`。正常升级不会调用旧窗口，也不会自动删除磁盘上的旧运行时。

完整卸载时，先停用本插件并关闭使用它的 DSH Web 实例。在包目录运行以下命令，再通过 DSH 插件管理移除 bundle。完整清理影响当前 Windows 用户的全部 DSH Web profile，包括本插件在通知中心的历史、应用通知偏好、注册项和辅助程序。各 DSH profile 的插件配置文件保留。

```sh
node scripts/uninstall-windows.mjs --dry-run
node scripts/uninstall-windows.mjs
```

## 开发与复现

```sh
pnpm install --frozen-lockfile
pnpm verify
pnpm pack
pnpm native:acceptance --host 127.0.0.1 --port 39714
```

验收入口创建临时 profile 和本地确定性模型；Ctrl+C 清理。可用 `--bundle <已安装的包目录>` 验收实际包，或 `--timed` 验证 continued 提问。若 Windows 无法访问 WSL 的回环转发，在可信网络上可用 WSL 的具体 IPv4 地址启动并使用 DSH 打印的登录链接。

[MIT](LICENSE)
