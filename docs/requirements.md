# 需求文档（唯一权威）

> 项目：`dsh-notify-interactive`
> 阶段：第一阶段已实现（0.1.1）；第二阶段待排期
> 目标宿主：DSH Web `0.2.2-rc.1` 线，`web` profile

## 1. 原始要求

来自用户：

1. 在本目录新建项目仓库，制作一个 dsh-web 的提醒功能插件，类似 Codex Desktop。
2. UI 与 DSH 风格保持一致。
3. 在会话申请权限、提问或任务完成时提醒用户。
4. 可以选择音效、Windows 弹窗，或两者都有。
5. 如果弹窗，弹窗中要能进行选择和自定义回答（和在 web 中操作一样）。
6. 任务完成要能点击回到对话。
7. 音效和弹窗要能分别关闭/开启。
8. 第一阶段以上要求；后续最好能分辨不同场景，分别选择不同场景下的开启/关闭。
9. MIT 协议，自建 GitHub 仓库发布，做好 Git 版本控制。
10. 若已有完全符合要求的活跃项目，则不开发，直接安装。

## 2. 调研结论

没有找到完全符合的活跃项目。详见 [research.md](research.md)。最接近的 `dsh-popup-notify` 的弹窗不可交互；`dsh-approval-popup` 只支持审批；`dsh-reminder` 弹窗不能作答；`dsh-notifier` 是手机端通道；`deepseek-harness-desktop` 是桌面 App。因此继续开发。

## 3. 第一阶段范围

### 3.1 事件

| 事件 | 判定源 | 说明 |
|---|---|---|
| 权限审批 | `uiSession.sessionStatus` 中 `pendingInteraction.kind === 'approval'` | 工具/沙箱审批 |
| 提问 | `pendingInteraction.kind === 'question'` | `ask_user_question` |
| 计划审核 | `pendingInteraction.kind === 'plan-review'` | `exit_plan_mode` 等 |
| 任务完成 | `running: true → false`；非当前会话的 `completionUnread` 兜底 | 第一阶段统一文案 |

### 3.2 通道

| 通道 | 实现 | 独立开关 |
|---|---|---|
| 音效 | Web Audio 合成 6 个预设 | 是 |
| 交互弹窗 | Document PiP → `window.open` → 页内浮层 | 是 |
| Windows 系统通知 | 浏览器 Notification API | 是 |

### 3.3 弹窗内操作

- 审批：允许一次 / 拒绝；不提供“始终允许”；不自动超时选择。
- 提问：单选、多选、自定义文本、跳过；提交结构化 `{ answers: [...] }`。
- 计划审核：纯文本预览、批准、拒绝、“在 DSH 中查看完整计划”。
- 完成：显示会话标题、回到对话、关闭；可自动关闭。
- 同一会话只显示最高优先级 pending interaction（与 DSH 一致）。

### 3.4 不打扰

- 页面聚焦、可见，且正在看该会话 → 跳过该会话的提醒（可关）。
- 子智能体会话默认跳过（可开）。
- 刷新/重连只建立基线，不重放已有请求。
- 同一触发 2 秒内去重。

### 3.5 设置

见 README 设置表。设置存 localStorage；不写 profile。

### 3.6 交付

- MIT LICENSE。
- GitHub 仓库 `wuqiuwangtian/dsh-notify-interactive`。
- `v0.1.1` Release + tgz。
- 安装到当前 `web` profile。
- 单元测试、CI、README/AGENTS/需求/调研/验证文档。

## 4. 非目标（第一阶段）

- 按场景分别开关/选音效（第二阶段；数据模型已预留）。
- 完成原因细分（completed/error/aborted）。
- 原生 WinRT toast 独立于浏览器。
- 在弹窗内编辑计划、渲染完整 Markdown。
- 多标签页领导选举。
- 从 profile 配置同步设置。
- 自动批准/自动拒绝。

## 5. 验收标准

1. 安装并刷新后，设置出现“互动提醒”页，包含三通道开关、音效选择/音量/试听、弹窗打开/测试、通知授权/测试、行为选项、测试卡片。
2. 真实审批且页面不在前台：按开关触发音效、系统通知、置顶弹窗；弹窗内允许/拒绝后审批被解决。
3. 真实提问：弹窗内单选/多选/自定义/跳过均可提交，Agent 收到结构化答案；计划审核可批准/拒绝。
4. 完成：弹窗显示完成卡；点“回到对话”打开对应会话。
5. 三通道独立开关。
6. 弹窗关闭后页内浮层接管；重开不重复。
7. 刷新/重连不重放旧提醒。
8. 明暗主题、中英文跟随；无 slot crash；不 import 宿主内部 Client 包。
9. `pnpm verify` 通过；CI 通过。
10. GitHub 仓库公开、MIT、Release 齐全；插件已装入 web profile。

## 6. 第二阶段建议

1. 设置页开放 `scenarios`：审批 / 提问 / 计划审核 / 完成 / 错误，各自音效、弹窗、系统通知开关与音效预设。
2. Host session projection 提供 `turn/end.reason` 与回复预览；完成卡区分正常/出错/中断/超长。
3. 按会话静音、主线/支线优先级、重复提醒间隔。
4. 自定义音频文件/URL。
5. 多标签页 BroadcastChannel 领导选举。
6. 可选 Host 原生 toast（WSL → Windows PowerShell/WinRT），浏览器关闭时也能提醒。
7. 设置迁移到 profile 配置，跨浏览器同步。

## 7. 关键决策与理由

| 决策 | 理由 |
|---|---|
| Client-only，Host 空 | pending interaction 对象在浏览器；同 JS 运行时才能直接作答；避免抢 waterfall |
| 观察 `sessionStatus` 而非 `approval/request` | 不改变审批链；与侧栏状态同源；可覆盖提问 |
| Document PiP 优先 | 唯一能同时做到“始终置顶 + DSH 风格 + 可交互”的浏览器能力 |
| 浏览器 Notification 作系统通知 | 无需 Host 原生依赖；Windows 上进入通知中心；点击可回会话 |
| localStorage 设置 | 第一阶段无 Host RPC；按浏览器保存合理 |
| 页面内浮层兜底 | 弹窗被拦截/关闭时不丢失作答入口 |
| 本地合成音效 | 无版权/素材问题；离线可用 |

## 8. 风险

- Document PiP 在非 Chromium 不可用；回退普通弹窗/页内。
- 浏览器通知权限被拒绝；系统通道不可用，其余通道正常。
- 弹窗被浏览器拦截；需要用户点击一次；页内兜底。
- 多标签页重复提醒；第二阶段解决。
- 完成原因第一阶段不区分；第二阶段用 Host projection。
