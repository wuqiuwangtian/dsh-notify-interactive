# 同类项目调研与 API 结论

调研日期：2026-11-07 / 2026-11-08。数据来自 GitHub 搜索、仓库 README 与 DSH 安装包内公开类型/实现。

## 1. 结论

**没有找到完全满足全部硬性要求的活跃项目。** 硬性要求是：

1. 覆盖权限审批、提问、任务完成；
2. 音效 / Windows 弹窗可选，且可同时开启；
3. 弹窗内可选择、可自定义回答（与 web 操作一致）；
4. 任务完成可点击回到对话；
5. 音效与弹窗分别开关；
6. UI 与 DSH 风格一致；
7. MIT、活跃维护。

最接近的项目分别在“弹窗可交互”“提问自定义回答”“DSH 风格”“web 插件形态”上缺一项或多项，因此继续开发。

## 2. 候选对比

| 项目 | 许可证 / 活跃度 | 已满足 | 关键缺口 |
|---|---|---|---|
| [yiumanlenong/dsh-popup-notify](https://github.com/yiumanlenong/dsh-popup-notify) | MIT；0 star；最后推送 2026-10-21 | Windows 置顶模态弹窗；审批/提问/计划/完成；音效开关；无依赖 | 弹窗**不可交互**，README 明确“回答仍在 DSH 窗口”；完成无回会话；仅 Windows |
| [qingfengyu153781-star/dsh-approval-popup](https://github.com/qingfengyu153781-star/dsh-approval-popup) | MIT；1 star；最后推送 2026-08-15 | 原生 Yes/No 审批弹窗；完成提醒；超时策略 | 只支持审批；无提问/自定义回答；无回会话；样式非 DSH；默认超时自动批准（风险） |
| [Aisland-SJL/dsh-reminder](https://github.com/Aisland-SJL/dsh-reminder) | MIT；19 star；最后推送 2026-08-16 | 跨窗口提醒；完成/审批；点击回会话；音效 | 弹窗内不能作答；Chrome 页面通知不支持 actions；无提问自定义 |
| [THEWOLFWALKER/dsh-notifier](https://github.com/THEWOLFWALKER/dsh-notifier) | MIT；活跃；2011 tests | 手机/多通道；可审批/回答 `ask_user`；会话控制 | 不是 DSH 风格 Windows 弹窗；体系重；与“弹窗内作答”不同 |
| [dsh-tauri/deepseek-harness-desktop](https://github.com/dsh-tauri/deepseek-harness-desktop) 内置 `dsh-tauri-notification` | MIT；活跃 | 桌面壳原生通知；带“批准”动作；点击聚焦会话 | 是整个桌面 App，不是 dsh-web 插件；不支持提问自定义回答 |
| [Phant0Meow/dsh-meow-smooth](https://github.com/Phant0Meow/dsh-meow-smooth) | 活跃 | 页内提醒卡片 + 系统通知 + 点击跳转 | 不是可作答的 Windows 弹窗 |
| [610la/dsh-notification-center](https://github.com/610la/dsh-notification-center) | MIT；活跃 | 浏览器通知 + 21 音效；按事件配置 | 弹窗不可作答；偏通知中心 |
| [AlonDan/dsh-notifications](https://github.com/AlonDan/dsh-notifications) | MIT；0.0.5 | 6 事件音效；WebAudio 合成；设置卡 | 只有音效，无弹窗/作答 |
| [GeekRicardo/dsh-notification](https://github.com/GeekRicardo/dsh-notification) | MIT；活跃 | 浏览器系统通知；点击聚焦并切会话；侧栏同源判定 | 系统通知不可作答；无 Windows 交互弹窗 |
| [nanami-0713/dsh-notifier](https://github.com/nanami-0713/dsh-notifier) | MIT；v0.5 | 跨窗口悬浮面板；web toast；音效；设置页 | 悬浮面板只提供“去处理/查看会话”，不能直接作答 |
| [drydeuterium/dsh-notification](https://github.com/drydeuterium/dsh-notification) | MIT；活跃 | Windows toast；按事件开关；宿主侧 | 纯通知，无交互动画；无提问回答 |

## 3. 可复用的结论

被借鉴、但不直接依赖的思路：

- **只观察、不抢答**：`dsh-popup-notify`、`dsh-notification`、`dsh-reminder` 都强调不改变审批链。本插件同样不注册 waterfall 监听。
- **前台/当前会话抑制**：`GeekRicardo/dsh-notification` 用侧栏同源状态判定；本插件用 `sessionStatus` + `retainedBy.mainView`。
- **基线播种**：刷新/重连不重放旧提醒；本插件按 session 首次出现播种。
- **完成卡片去重**：`dsh-reminder`、`dsh-popup-notify` 都有冷却/去重；本插件用 2 秒冷却 + 每会话序号。
- **WebAudio 合成音效**：`AlonDan/dsh-notifications` 证明无需音频文件；本插件实现 6 个预设。
- **不采用**：原生 WinForms 弹窗（`dsh-popup-notify` / `dsh-approval-popup`）无法满足 DSH 风格与自定义表单；手机通道（`dsh-notifier`）偏离桌面弹窗目标；Tauri 桌面 App 不是 web 插件。

## 4. DSH API 结论（0.2.2-rc.1）

### 4.1 状态源

- `ctx.uiSession.sessionStatus`：`{ getSnapshot(), subscribe(listener) }`，快照为 `Map<SessionId, SessionStatus>`。
- `SessionStatus`：`{ running: boolean | undefined, pendingInteraction: PendingApproval | PendingQuestion | undefined, completionUnread: boolean }`。
- `ctx.sessions.list`：`{ getSnapshot(), subscribe(listener) }`，快照 `{ ids, byId, phase, projectionsBySession }`。
- `byId[id]`：`displayTitle`、`origin`（`'subagent'`）、`retainedBy.mainView`（主视图计数）。
- 参考实现：`dsh-client-ui-session/lib/client.js` 的 `sessionStatus` 与 `publishStatus`。

### 4.2 待处理交互

- `PendingApproval`：
  - 字段：`sessionId`、`kind: 'approval'`、`key`、`toolName`、`callId`、`reason`、`displayReason`、`answerable`、`result`。
  - 方法：`answer('allowed-once' | 'rejected')`、`delegate()`、`abort()`。
  - 只支持允许一次/拒绝，没有“始终允许”。
- `PendingQuestion`：
  - 字段：`kind: 'question' | 'plan-review'`、`key`、`sessionId`、`questions`、`callId`、`review`、`dismissal`。
  - 方法：`answer({ answers: [...] })`、`dismiss()`、`takeTime()`、`holdFocus()`、`releaseFocus()`、`engage()`、`subscribe()`、`getSnapshot()`。
  - 快照：`state`、`waitState`、`countdown`、`channel`、`closed`。
  - 答案结构：`{ answers: [{ id, selected: string[], custom?: string }] }`。
- 计划审核：`questions[0].intent.kind === 'plan-review'`，`intent.approve` 指定批准选项，计划正文在 `question.detail`，最多一个替代选项。

### 4.3 打开会话

- `ctx.uiWorkspace.openSession(target: SessionId | SubagentAddress)`。
- 回退：仅 `window.focus()`。

### 4.4 浏览器能力

- `react`、`react/jsx-runtime`、`react-dom`、`react-dom/client` 在 `dsh-web-frontend` 的 `staticModules` 中提供。
- Document PiP：`window.documentPictureInPicture.requestWindow({ width, height })`；Chromium 116+；需要用户手势；窗口始终置顶。
- `window.open` 回退：可能被弹窗拦截。
- 浏览器 Notification：需要站点权限；`requireInteraction` 仅对页面通知尽力而为；不支持 actions（页面通知）。
- Web Audio：首次用户手势后可播放；否则被自动播放策略阻止。

### 4.5 主题

- 主页面提供 `--dsw-*` / `--dsh-*` / `--ds-*` CSS 变量。
- 弹窗是独立文档，不继承变量；`src/ui/theme.js` 从主文档枚举同源样式表，读取解析值并复制到弹窗根节点。
- `theme/change` 与 `locale/change` 事件用于重新同步。

## 5. 开发前检查点

若未来出现一个同时满足第 1 节全部硬性要求、且活跃维护的 MIT 项目，应优先评估“安装而非重写”。当前没有；本仓库保留此检查点。
