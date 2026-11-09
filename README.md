# dsh-notify-interactive

DSH Web 会话提醒插件。未关注事件所属会话时提醒；正在看该会话时静默。当前重点：Arch WSL 运行 DSH Web，Windows 侧显示极简桌面窗口。

[English](README.en.md) · [需求与阶段计划](docs/requirements.md) · [接口调查](docs/research.md) · [验收与证据](docs/verification.md)

## 当前开发状态

P2 开发代码，目标 DSH 0.2.2-rc.1；package 版本仍为 0.2.1，新增能力尚未发布。

- 审批、提问、计划审核、结束统一投递至桌面只读提醒：会话标题、消息、关闭、打开会话；支持排队及请求失效撤回。
- 总开关、弹窗与声音独立开关；四种事件分别开关及选择音效，支持默认音效、音量、试听。
- 设置保存至当前 DSH profile；首次迁移 localStorage，跨标签按 revision 同步，断线编辑保留待同步。
- Host 按请求/turn ID 统一认领，聚合每个 Web 标签的焦点；在线但没有投递的 Web 不会永久阻止宿主接管。
- 自有路由复用 DSH 的认证、Host/Origin 与 owner 校验。只观察 session/event，不写 session log、不注入 prompt、不注册模型工具、不自动作答。

**尚未实现新桌面窗口内作答。** 审批、提问、计划仍需回 DSH；手动浏览器作答窗口保留现有 Pending.answer 代码。TUI 已有提醒、DSH Desktop 非本轮重点；Linux 原生桌面尚未验收。

## 本地使用

当前机器 web profile 已链接本仓库。新安装在 DSH 中优先使用 plugin_manager install_bundle，target 为仓库绝对路径。

在仓库中运行（安装器需要 Node.js >=22.12，插件自身仍支持 Node.js 20）：

```sh
pnpm install
pnpm companion:install
pnpm verify
```

Windows Electron 运行时约 357 MiB，WSL 下载副本另占相近空间；位于 Windows LocalAppData，不注册开机自启。窗口与 Host 使用连接独立文件邮箱，不监听额外网络端口。辅助程序安装后自动启用；DSH_NOTIFY_COMPANION=0 可强制回退旧原生路径。

当前任务结束后重启宿主，刷新所有已登录 Web 标签：

```sh
dsh --profile web --no-open
```

设置 → 互动提醒 → 弹窗与触发场景：配置四类事件；确认“设置已保存到 DSH profile”。桌面提醒区提供完成演示；真实行为按[第 11 节验收](docs/verification.md#11-p2-统一投递与-profile-设置)。首次读取时由首个成功迁移的浏览器提供旧设置，其他页面随后采用 profile 配置。

## 配置与边界

- 权威文件：当前 profile 的 notify-interactive.settings.json（schema v3 + revision）；localStorage 键 dsh.notify-interactive.settings.v2 仅作缓存和迁移源。
- 断线编辑需等待同步；配置损坏不会静默覆盖，应先备份再检查。
- Windows 辅助程序缺失时退回现有 PowerShell 提醒/系统音，原生进程启动不等同窗口已显示，也不承诺匹配所选合成音效。
- 真实用户会话、多标签、重启后配置和精准回会话仍待手工验收；自动测试和合成事件通过不等于真实环境全部通过。

## 开发与验证

```sh
pnpm verify
pnpm companion:smoke
pnpm coordination:smoke
```

后两者会显示真实演示窗口并播放音效，结束清理测试进程。当前 87 项自动测试及 Windows 协调冒烟通过，覆盖通道组合、去重、排队、宿主接管等；详细证据见验证文档。

src/client 为状态/presence 与设置同步；src/host 为协调/持久化/认证和投递；companion 为窗口/队列；src/ui 为设置与旧 Web 卡片；src/audio 为合成声音。lib 由构建同步，不能手改。窗口文件变更后可运行 node scripts/stage-companion.mjs，同步内容变化会重新加载通知辅助程序。

[MIT](LICENSE) © 2026 wuqiuwangtian
