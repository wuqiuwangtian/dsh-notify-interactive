# AGENTS.md

面向接手本仓库的 agent / 开发者。先读 `docs/requirements.md` 与 `docs/verification.md`。

## 项目定位

`dsh-notify-interactive` 的目标是未聚焦事件所属会话时，自动提供 DSH 风格提醒；覆盖审批、提问/计划和一轮结束，弹窗/音效独立配置，基础兼容 Windows 与 Linux。

2026-11-09：已授权开始 P0 调查与开发。0.2.1 仍是受限实现，尚未完成基础体验；不要将旧“第一阶段完成”当成验收结论。有效目标、待定方案和 P0–P5 计划见 `docs/requirements.md`；现状证据见 `docs/research.md`。

当前代码仅支持手动打开 Web 交互窗与 Windows/WSL WinForms 兜底，无 Linux 桌面适配；用户已确认继续使用浏览器并接受桌面辅助程序；不要求换客户端。Linux 桌面目标与现场地址待补充，先验证关键能力再铺开实现。

## 关键约束

- **不自动作答**：只能通过用户在 DSH 或交互弹窗中的显式操作提交；系统兜底只提醒。独立桌面应答接口需先验证，不假定可用。
- **不写 session log**：不 append 事件、不注册模型工具、不注入 prompt。
- **不监听 approval/question waterfall**：宿主只观察 `session/event`，不改变审批链。
- **不要重新加回页内通知卡片**；如果产品要求变化，先读需求文档。
- **不要未经方案确认重新加浏览器 Notification 通道**；当前 Windows 兜底由宿主 PowerShell 负责，目标 Linux 系统通知需另做适配。
- **样式只用主题 token**：`--dsw-*` / `--dsh-*` / `--ds-*`；弹窗通过 `src/ui/theme.js` 复制主文档解析值。
- **极简 UI**：卡片只保留标题、必要上下文、会话入口和操作；不要加图标、副标题、后端徽标、页脚提示等非操作内容。
- **产物提交**：`lib/client.js` 由 `src/` 构建，必须同步提交；CI 会 `git diff --exit-code`。

## 当前实现架构（不代表目标方案）

- `src/client/`：Web 半区。观察 `uiSession.sessionStatus` + `sessions.list`；维护通知引擎；上报 presence；管理交互弹窗。
- `src/host/`：宿主半区。观察 `session/event`；在没有活跃 Web presence 时通过 PowerShell 弹 Windows 提醒；提供 presence / windows-notify 路由。
- `src/ui/`：设置页 + 极简弹窗卡片。
- `src/state/`：设置、通知队列、弹窗控制器、surface 标志。
- `src/audio/`：Web Audio 合成 + WAV 兜底。

## 构建与验证

```sh
pnpm install
pnpm verify      # build + node --check + node --test + render smoke
```

- 开发依赖只有 `esbuild` + React/ReactDOM（仅渲染冒烟用）。
- `pnpm-workspace.yaml` 的 `allowBuilds.esbuild: true` 是 pnpm 12 运行 esbuild 安装脚本所必需。
- 测试覆盖：设置、diff/引擎、提问答案、音效/WAV、host 文案与 presence 策略、surface 标志、i18n。
- `tests/render-entry.jsx` 用 `react-dom/server` 渲染设置页和弹窗卡片；用于捕获 JSX/hook/undefined 组件错误。
- 视觉、真实审批/提问、Windows PowerShell 弹窗、CLI/TUI 端到端无法自动验证；按 `docs/verification.md` 手工验收。

## 安装

在 DSH 会话中优先用 `plugin_manager` 的 `install_bundle`，target 为仓库绝对路径。安装后刷新页面；若返回 `restart-required`，需要重启 DSH。

## 发布

1. 更新 `CHANGELOG.md` 与 `package.json` 版本。
2. `pnpm verify`。
3. 提交；`pnpm pack`，把 tgz 附加到 GitHub Release；更新 `README` 的 tgz 名称。
4. `gh repo edit --add-topic dsh --add-topic dsh-plugin --add-topic deepseek-harness --add-topic notifications`。

## 关键 API 事实（DSH 0.2.2-rc.1）

- `ctx.uiSession.sessionStatus`：`{ getSnapshot, subscribe }`，快照 `Map<SessionId, { running, pendingInteraction, completionUnread }>`。
- `ctx.sessions.list`：`{ getSnapshot, subscribe }`，快照含 `ids`、`byId[id].displayTitle/origin/retainedBy`。
- `pendingInteraction.kind`：`'approval'`（`PendingApproval`）或 `'question' | 'plan-review'`（`PendingQuestion`）。
- `PendingApproval.answer('allowed-once' | 'rejected')`。
- `PendingQuestion.answer({ answers: [{ id, selected, custom? }] })`；`channel` 为 `waterfall` / `rpc` / `none`；`snapshot().countdown`；`holdFocus`/`releaseFocus`/`engage`/`takeTime`。
- `ctx.uiWorkspace.openSession(sessionId)`。
- 宿主 `session/event`：`approval/asked`、`tool/call`（`ask_user_question` / `exit_plan_mode`）、`turn/end`；`session.header.cwd/origin`。
- 宿主 `ctx.webServer.register({ kind: 'exact', path, handler })`。
- `react-dom/client` 在 `dsh-web-frontend` 的 static modules 中可用。
- Document PiP：`window.documentPictureInPicture.requestWindow({ width, height })`，需要用户手势；不支持时 `window.open`。

## 诊断

- 页面加载后 `globalThis.__dshNotifyInteractive` 暴露 runtime：`openPopup()`、`closePopup()`、`addDemo(kind)`、`windowsFallback(payload)`、`getMainSession()`、`settingsStore`、`notificationStore`、`popupController`。
- 设置页可测试三类交互卡片和 Windows 兜底。
- 宿主 Windows 弹窗使用 PowerShell WinForms（不是 `WScript.Shell.Popup`）；路径检测：Windows `powershell.exe`，WSL `/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe`。
