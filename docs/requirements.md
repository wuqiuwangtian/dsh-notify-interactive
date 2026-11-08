# 需求文档（唯一权威）

> 项目：`dsh-notify-interactive`
> 阶段：第一阶段重构完成（0.2.0）；第二阶段待排期
> 目标宿主：DSH `0.2.2-rc.1` 线；Web / CLI / TUI profile

## 1. 原始要求与重构决定

最初的用户要求：

1. dsh-web 提醒插件，类似 Codex Desktop；
2. 覆盖权限审批、提问、任务完成；
3. 音效 / Windows 弹窗可选；
4. 弹窗内可选择、可自定义回答；
5. 完成提醒可点击回到对话；
6. 音效和弹窗分别开关；
7. 后续按场景分别开关；
8. MIT、自建 GitHub 仓库、Git 版本控制；
9. 若已有完全符合的活跃项目则直接安装。

2026-11-08 用户明确重构：

- **删除页内通知卡片**；
- 只区分“是否聚焦当前会话”：聚焦 → 什么都不做；
- 不聚焦 → 优先自绘交互弹窗；
- 弹窗条件不允许（如无 GUI 的终端环境）→ Windows 弹窗提醒；
- Windows 兜底只能提醒，不能选择/填写回答；
- 该逻辑要兼容 Web UI、CLI、TUI；
- 自绘弹窗 UI 与 DSH 一致且极简：删掉不影响操作的内容。

重构后的第一阶段边界以本文档为准，早期“页内卡片 / 浏览器 Notification / 弹窗开关”等要求已废弃。

## 2. 第一阶段范围

### 2.1 事件

| 事件 | 判定 | 说明 |
|---|---|---|
| 权限审批 | `pendingInteraction.kind === 'approval'`（Web）；宿主 `approval/asked` | 工具/沙箱审批 |
| 提问 | `pendingInteraction.kind === 'question'`（Web）；宿主 `tool/call(ask_user_question)` | 需要结构化回答 |
| 计划审核 | `pendingInteraction.kind === 'plan-review'`（Web）；宿主 `tool/call(exit_plan_mode)` | 计划批准/拒绝 |
| 任务完成 | `running: true → false`（Web）；宿主 `turn/end` | 完成/出错/超长/阻塞；用户主动中断跳过 |

### 2.2 静默规则

唯一静默条件：**页面聚焦、可见，且事件属于当前主视图会话**。

- 满足 → 不播放音效、不显示弹窗、不发 Windows 提醒；
- 当前会话由 DSH 自带的审批/提问/turn-tail 处理，插件不重复。

### 2.3 投递优先级

| 场景 | 行为 |
|---|---|
| 聚焦当前会话 | 静默 |
| Web，其他会话 / 页面失焦 | 交互弹窗已打开 → 弹窗卡片；未打开 → 宿主 Windows 弹窗 |
| Web 页面关闭 | Web presence 过期 → 宿主 Windows 弹窗 |
| CLI/TUI | 无 Web presence → 宿主 Windows 弹窗 |

- Web 交互弹窗必须由用户点击打开一次并保持；浏览器不允许后台事件自动开新窗口。
- 宿主 Windows 弹窗是**只读提醒**，不能作答；用户回到 DSH/终端处理。
- 音效是独立可选项；Windows 兜底自带系统提示音。
- 宿主只观察 `session/event`，不监听 approval/question waterfall，不改变审批链。

### 2.4 弹窗 UI

目标：DSH 风格、极简、只保留操作必需内容。

- 卡片：标题、必要上下文（工具/问题/计划）、会话入口、操作按钮/输入；
- 弹窗没有外层标题栏/关闭按钮；关闭使用系统窗口；
- 不显示：图标、装饰性副标题、后端徽标、页脚说明、权限状态、卡片右上角关闭等非操作内容；
- 完成卡：标题 + 会话入口 + “回到对话”；自动关闭 8 秒（演示卡常驻，靠回到对话或系统窗口关闭）；
- 提问卡：选项、自定义输入、跳过、提交；计时题显示倒计时与“慢慢回答”；
- 计划卡：纯文本预览、批准/拒绝、在 DSH 查看；
- 空状态：“暂无提醒”。

### 2.5 设置

- 启用提醒；
- 音效开关、预设、音量、试听；
- 打开/关闭弹窗；测试弹窗；
- 测试 Windows 提醒；
- 测试审批/提问/完成卡；
- 恢复默认。

设置存浏览器 localStorage（`dsh.notify-interactive.settings.v2`）。宿主 Windows 兜底无需浏览器通知权限。

### 2.6 跨环境

- Web：Client 上报 presence；引擎决定静默/弹窗/宿主兜底。
- CLI/TUI：Host 无 Web presence，直接 Windows 兜底。
- Host 与 Client 在同一包；CLI/TUI 不加载 Client。
- Windows 兜底路径：Windows `powershell.exe`；WSL `/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe`。

## 3. 非目标（第一阶段）

- 页内通知卡片（已删除，不要恢复）。
- 浏览器 Notification 通道与通知权限 UI（已删除）。
- 自动打开外部弹窗。
- 自动批准/拒绝/回答。
- Windows 兜底内作答。
- 多标签页 leader 选举。
- 完成原因的 Web 端细分（宿主 Windows 文案已区分；Web 卡统一“本轮已结束”）。
- 跨浏览器/设备设置同步。

## 4. 验收标准

1. 设置页出现“互动提醒”，包含总开关、音效、弹窗打开/测试、Windows 提醒测试、三类测试卡、恢复默认。
2. Web 聚焦当前会话：审批/提问/完成均不产生插件音效、弹窗、Windows 提醒。
3. Web 聚焦其他会话或页面失焦，弹窗已打开：弹窗显示卡片，可在弹窗内作答；不弹 Windows。
4. 同上但弹窗关闭：宿主弹 Windows 提醒；点“测试 Windows 提醒”可验证。
5. 关闭 DSH 页面（或 CLI/TUI）：宿主观察事件并弹 Windows 提醒。
6. 完成卡“回到对话”打开对应会话。
7. 弹窗 UI 极简：无图标/副标题/后端徽标/页脚等非操作内容。
8. 语言跟随 DSH：`zh` / `zh-CN` / `zh-TW` → 中文，其他 → 英文。
9. `pnpm verify` 通过；构建产物与源码一致。
10. GitHub 公开、MIT、Release 齐全；插件已装入 web profile。

## 5. 第二阶段建议

1. 按场景分别开关/选音效（数据模型已预留 `scenarios`）。
2. 宿主 session projection 提供完成原因与回复预览；Web 完成卡区分。
3. 多标签页 BroadcastChannel leader 选举，避免多个 Web 面重复投递。
4. 按会话静音、主线/支线优先级、重复提醒间隔。
5. 可选原生 Windows toast（非模态、可点击），替代/补充 `WScript.Shell.Popup`。
6. 设置从 localStorage 迁移到 profile 配置，跨浏览器同步。

## 6. 关键决策

| 决策 | 理由 |
|---|---|
| 删除页内卡片 | 用户明确不需要；减少表面与重复 |
| 只按“聚焦当前会话”静默 | 规则简单、与用户预期一致 |
| Web 优先交互弹窗 | 可作答；DSH 风格；始终置顶 |
| 弹窗不可用 → 宿主 Windows | 浏览器不能后台开窗；CLI/TUI 无 Web |
| 宿主只读 session 事件 | 不抢 waterfall、不改变审批链；CLI/TUI 同样可观察 |
| presence 路由 | Host 判断是否有 Web 面；避免 Web 与宿主重复提醒 |
| Windows 兜底只读 | 用户接受；保持审批/回答必须由人显式操作 |
| 极简弹窗 | 用户要求；只保留操作必需内容 |

## 7. 风险

- 浏览器限制导致弹窗必须手动打开一次；关闭后只能 Windows 兜底。
- Windows 兜底依赖 PowerShell/桌面；无 GUI 或非 Windows 无兜底。
- presence 心跳/`pagehide` 失败时，宿主最多 15 秒后才接管。
- 多标签页可能重复投递；第二阶段解决。
- Windows `WScript.Shell.Popup` 是模态系统对话框，可能抢焦点；5 分钟自动关闭。
