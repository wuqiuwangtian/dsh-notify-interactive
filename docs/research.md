# 同类项目调研与设计结论

调研日期：2026-11-07 / 2026-11-08。数据来自 GitHub 搜索、仓库 README 与 DSH 安装包内公开类型/实现。

## 1. 结论

**没有找到完全满足当前要求的活跃项目。** 当前要求是：

1. 权限审批、提问/计划审核、任务完成时提醒；
2. 正在看当前会话时完全静默；
3. 否则优先显示可交互的 DSH 风格弹窗；
4. 弹窗不可用（或 CLI/TUI）时显示 Windows 提醒，且 Windows 只能提醒；
5. DSH 风格、极简 UI；
6. MIT、活跃维护。

最接近的项目分别在“弹窗可交互”“CLI/TUI 兜底”“DSH 风格”“Web 插件形态”上缺一项或多项，因此继续开发。

## 2. 候选对比

| 项目 | 许可证 / 活跃度 | 已满足 | 关键缺口 |
|---|---|---|---|
| [yiumanlenong/dsh-popup-notify](https://github.com/yiumanlenong/dsh-popup-notify) | MIT；0 star；最后推送 2026-10-21 | Windows 置顶模态弹窗；审批/提问/计划/完成；音效开关 | 弹窗**不可交互**；无 CLI/TUI 兜底 |
| [qingfengyu153781-star/dsh-approval-popup](https://github.com/qingfengyu153781-star/dsh-approval-popup) | MIT；1 star；最后推送 2026-08-15 | 原生 Yes/No 审批弹窗；完成提醒 | 只支持审批；无提问/自定义回答；无 CLI/TUI 兜底 |
| [Aisland-SJL/dsh-reminder](https://github.com/Aisland-SJL/dsh-reminder) | MIT；19 star；最后推送 2026-08-16 | 跨窗口提醒；完成/审批；点击回会话；音效 | 弹窗内不能作答；Chrome 通知不支持 actions |
| [THEWOLFWALKER/dsh-notifier](https://github.com/THEWOLFWALKER/dsh-notifier) | MIT；活跃 | 手机/多通道；可审批/回答 `ask_user` | 不是 DSH 风格桌面弹窗；体系重 |
| [dsh-tauri/deepseek-harness-desktop](https://github.com/dsh-tauri/deepseek-harness-desktop) 内置通知 | MIT；活跃 | 桌面壳原生通知；带“批准”动作 | 整个桌面 App，不是 dsh-web 插件；不支持提问自定义回答 |
| [Phant0Meow/dsh-meow-smooth](https://github.com/Phant0Meow/dsh-meow-smooth) | 活跃 | 页内卡片 + 系统通知 + 点击跳转 | 页内通知；不是可作答的 Windows 弹窗 |
| [610la/dsh-notification-center](https://github.com/610la/dsh-notification-center) | MIT；活跃 | 浏览器通知 + 21 音效；按事件配置 | 弹窗不可作答 |
| [GeekRicardo/dsh-notification](https://github.com/GeekRicardo/dsh-notification) | MIT；活跃 | 浏览器系统通知；点击聚焦并切会话 | 系统通知不可作答 |

## 3. 设计结论（0.2.0）

用户要求的逻辑接近 Codex Desktop：

- **只看是否聚焦当前会话**；
- 聚焦 → 静默；
- 不聚焦 → 优先交互弹窗；
- 弹窗不可用 → Windows 提醒（只读）；
- CLI/TUI 也能收到 Windows 提醒。

实现拆分：

| 半区 | 职责 |
|---|---|
| Host | 观察 `session/event`（`approval/asked`、`tool/call(ask_user_question|exit_plan_mode)`、`turn/end`）；无活跃 Web presence 时用 PowerShell `WScript.Shell.Popup` 提醒；提供 presence / windows-notify 路由 |
| Client | 观察 `uiSession.sessionStatus` + `sessions.list`；上报 presence；聚焦当前会话时静默；弹窗打开时入队；弹窗关闭时调用宿主 Windows 兜底 |
| Popup | Document PiP / 普通弹窗；极简卡片；审批/提问/计划/完成交互 |

明确不做：

- 页内通知卡片（用户要求删除）；
- 浏览器 Notification 通道/权限（宿主 PowerShell 取代）；
- 自动打开外部弹窗（浏览器限制）；
- 自动批准/拒绝/回答（安全）；
- Windows 兜底内作答（用户接受只读）。

## 4. DSH API 结论（0.2.2-rc.1）

### 4.1 Web 状态源

- `ctx.uiSession.sessionStatus`：`{ getSnapshot(), subscribe(listener) }`，快照 `Map<SessionId, SessionStatus>`。
- `SessionStatus`：`{ running, pendingInteraction, completionUnread }`。
- `ctx.sessions.list`：`{ getSnapshot(), subscribe(listener) }`；`byId[id]` 提供 `displayTitle`、`origin`、`retainedBy.mainView`。
- `PendingApproval.answer('allowed-once' | 'rejected')`。
- `PendingQuestion.answer({ answers: [{ id, selected, custom? }] })`；`channel`、`countdown`、`holdFocus`/`releaseFocus`/`engage`/`takeTime`。
- 计划审核：`questions[0].intent.kind === 'plan-review'`，`intent.approve` 指定批准选项，正文在 `question.detail`。
- `ctx.uiWorkspace.openSession(sessionId)`。

### 4.2 宿主事件

- `session/event` 是 post-commit 事件；seed/replay 不发布，避免恢复时轰炸。
- `approval/asked`：`{ id, toolName, callId?, reason? }`。
- `tool/call`：`{ callId, name, arguments }`；`ask_user_question` 的 `arguments` 含 `questions`；`exit_plan_mode` 表示计划审核。
- `turn/end`：`{ turn, reason }`；`reason.kind` 可为 `completed` / `error` / `max-tokens` / `blocked` / `aborted`。
- `session.header`：`id`、`cwd`、`origin`（`subagent`）；无 title，用 cwd basename/session id 标识。

### 4.3 宿主路由

- `ctx.webServer.register({ kind: 'exact', path, handler })`；handler 拥有 `IncomingMessage/ServerResponse`。
- `ctx.inject(['webServer'], (scope) => ...)` 让 Web 路由可选；CLI/TUI 无 webServer 时宿主仍可观察事件。

### 4.4 浏览器能力

- `react`、`react/jsx-runtime`、`react-dom`、`react-dom/client` 在 `dsh-web-frontend` 的 static modules 中。
- Document PiP：`window.documentPictureInPicture.requestWindow({ width, height })`；需要用户手势；Chromium。
- `window.open` 回退可能被拦截。
- 浏览器 Notification 已不使用；Windows 兜底由宿主 PowerShell 负责。

### 4.5 Windows 兜底

- WSL：`/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe`。
- Windows：`powershell.exe`。
- `WScript.Shell.Popup(text, 20, title, 64)`：非阻塞（独立进程）、5 分钟自动关闭；不能作答。
- `[System.Media.SystemSounds]::Asterisk.Play()` 提供系统提示音。

## 5. 开发前检查点

若未来出现一个同时满足第 1 节全部要求、且活跃维护的 MIT 项目，应优先评估“安装而非重写”。当前没有。
