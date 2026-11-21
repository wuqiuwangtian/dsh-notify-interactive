# dsh-notify-interactive

DSH Web 会话提醒插件。未关注事件所属会话时提醒；正在看该会话时静默。当前重点：Arch WSL 运行 DSH Web，Windows 侧显示极简桌面窗口。

[English](README.en.md) · [需求与阶段计划](docs/requirements.md) · [接口调查](docs/research.md) · [验收与证据](docs/verification.md)

## 当前开发状态

2026-11-21 已确定迁移为 Windows 原生通知，支持从通知中心找回提醒。Windows 原生预览已支持四类提醒、完成时机四档、独立音效和通知中心回会话。用 `pnpm native:acceptance --windows-toast --host <WSL-IPv4> --port <空闲端口>` 在隔离实例体验。开发版宿主可通过 `DSH_NOTIFY_WINDOWS_ORIGIN` 指定 Windows 可达的 Web origin 启用此通道，例如 `http://<WSL-IPv4>:3080`（仅协议、主机、端口）。预览通知点击后进入 Web，原生作答按钮属于下一阶段。下文描述默认运行的旧实现。[阶段 2 验收与限制](docs/verification.md#15-四类原生通知与历史管理)

P3 应答桥接开发代码，目标 DSH 0.2.2-rc.1；package 版本仍为 0.2.1，新增能力尚未发布。

- 审批、提问、计划审核、结束统一投递至桌面；支持排队及请求失效撤回。已关联的审批可允许一次/拒绝，提问支持完整批次、单选/多选、自定义及明确跳过，计划审核保留原始选项与计划正文。
- 总开关、弹窗与声音独立开关；四种事件分别开关及选择音效，支持默认音效、音量、试听。
- 设置保存至当前 DSH profile；首次迁移 localStorage，跨标签按 revision 同步，断线编辑保留待同步。
- Host 按请求/turn ID 统一认领，聚合每个 Web 标签的焦点；在线但没有投递的 Web 不会永久阻止宿主接管。
- 自有路由复用 DSH 的认证、Host/Origin 与 owner 校验。只观察 session/event，不写 session log、不注入 prompt、不注册模型工具、不自动作答。

**桌面作答依赖一个已登录且在线的 Web 页面持有当前 Pending 对象。** 无法可靠关联时仅提醒/回会话；提交超时不自动重发，结果不确定时回 DSH 核对。手动浏览器作答窗口保留；TUI、DSH Desktop 非本轮重点，Linux 原生桌面尚未验收。

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

设置 → 互动提醒 → 弹窗与触发场景：配置四类事件；确认“设置已保存到 DSH profile”。桌面提醒区提供完成演示；通道行为按第 11 节、[交互按第 12 节验收](docs/verification.md#12-p3-桌面人工应答桥接)。首次读取时由首个成功迁移的浏览器提供旧设置，其他页面随后采用 profile 配置。

## 配置与边界

- 权威文件：当前 profile 的 notify-interactive.settings.json（schema v3 + revision）；localStorage 键 dsh.notify-interactive.settings.v2 仅作缓存和迁移源。
- 断线编辑需等待同步；配置损坏不会静默覆盖，应先备份再检查。
- Windows 辅助程序缺失时退回现有 PowerShell 提醒/系统音，原生进程启动不等同窗口已显示，也不承诺匹配所选合成音效。
- 审批缺 callId、同 callId 重复审批或元数据不匹配时仅提醒。阻塞式提问没有 Pending.callId 时，需完整批次唯一匹配宿主工具事件；计划审核从 intent.callId 关联。歧义请求回 DSH。Web 断线保留桌面草稿，辅助程序重启不恢复草稿。
- 真实用户会话、多标签、重启后配置和精准回会话仍待手工验收；自动测试和合成事件通过不等于真实环境全部通过。

## 开发与验证

```sh
pnpm verify
pnpm companion:smoke
pnpm coordination:smoke
pnpm interaction:smoke
```

桌面冒烟会显示真实模拟窗口，前两项桌面测试可能播放音效，结束清理测试进程。交互冒烟仅操作独立测试进程及模拟 Pending，临时为该进程开启 loopback DevTools 以验证真实 renderer 按钮；正式路径无此端口。真实用户会话仍需手工验收，详细证据见验证文档。

src/client 为状态/presence 与设置同步；src/host 为协调/持久化/认证和投递；companion 为窗口/队列；src/ui 为设置与旧 Web 卡片；src/audio 为合成声音。lib 由构建同步，不能手改。窗口文件变更后可运行 node scripts/stage-companion.mjs，同步内容变化会重新加载通知辅助程序。

独立原生验收（需本机已安装 DSH 0.2.2-rc.1）：`pnpm native:acceptance`。脚本创建临时 profile/登录凭据和本地确定性适配器，走真实 DSH 审批、内置提问/计划工具与 Pending；不读取现有模型凭据，不发外部模型请求。可加 `--timed` 验证一秒后 continued/rpc，Ctrl+C 清理；操作步骤及已取得证据见[验收第 13 节](docs/verification.md#13-p3-原生-dsh-独立实例验收与接口修复)。

## Windows 无法连接 WSL Web

若 WSL 内有 HTTP 响应，而 Windows 访问 localhost 拒绝连接，先排查 WSL localhost 转发；终端无报错不能证明 Windows 已能访问。可在 Web 空闲时改用 `dsh web --host <WSL-IPv4> --port 3080 --no-open`，打开新打印的完整认证链接。用 `ip -4 -o addr show dev eth0` 查看当前地址；地址可能随 WSL 重启变化。不要只改旧认证链接的主机名，也不必为此关闭整个 WSL。此方式监听 WSL 网卡，适用于可信的本地网络。

[MIT](LICENSE) © 2026 wuqiuwangtian
