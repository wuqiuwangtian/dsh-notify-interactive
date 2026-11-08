# dsh-notify-interactive

> DSH Web 的互动提醒插件：权限审批、提问、计划审核、任务完成时，用**音效**、**始终置顶的 DSH 风格弹窗**和 **Windows 系统通知**提醒你；弹窗内可以直接批准、拒绝、选择选项、输入自定义回答，完成提醒可一键回到对话。

[English](README.en.md) · [需求文档](docs/requirements.md) · [同类项目调研](docs/research.md) · [验证记录](docs/verification.md)

## 为什么是“互动”提醒

大多数 DSH 通知插件只能告诉你“有事发生了”，然后你仍要切回 DSH 去找那张审批卡或问题卡。本插件把 **同一份待处理请求**渲染到置顶弹窗里：

- 审批：直接点“允许一次 / 拒绝”；
- 提问：单选、多选、自定义回答、跳过，和 DSH 网页里的操作一致；
- 计划审核：查看计划文本，批准或拒绝；
- 任务完成：点“回到对话”直接打开对应会话。

它不抢答、不自动批准：所有决定都必须由你显式点击。

## 功能

| 能力 | 说明 |
|---|---|
| 三类提醒 | 权限审批、提问 / 计划审核、任务完成 |
| 三个独立通道 | 音效、交互弹窗、Windows 系统通知，分别开关 |
| 交互弹窗 | 优先 Document Picture-in-Picture（始终置顶）；不支持时回退普通弹出窗口；再回退页内浮层 |
| 弹窗内作答 | 审批允许/拒绝；提问单选/多选/自定义/跳过；计划批准/拒绝 |
| 完成回会话 | 完成卡片点“回到对话”打开对应会话 |
| 音效可选 | 6 个本地合成预设（含静音），音量可调，可试听 |
| 多会话 | 每个会话独立卡片，显示会话标题；子会话默认静音 |
| 不打扰 | 页面聚焦且正在看当前会话时跳过；刷新/重连不会重放旧提醒 |
| DSH 风格 | 只使用 DSH 主题 token；明暗主题、中英文跟随 |
| 隐私 | 纯浏览器端；不写 session log、不注册模型工具、不向外部发送数据 |

## 状态

- 版本：`0.1.1`（第一阶段）
- 目标 DSH：`0.2.2-rc.1` 线（Web profile）
- 已实现：音效 / 弹窗 / 系统通知三通道、审批/提问/计划审核/完成卡片、设置页、测试卡片
- 第二阶段：按场景分别开关/选音效、完成原因细分、按会话静音、多标签页去重、可选原生 toast

## 安装

### 从 GitHub 安装

```sh
dsh plugin --profile web add https://github.com/wuqiuwangtian/dsh-notify-interactive
```

### 从 Release 安装

下载 `dsh-notify-interactive-0.1.1.tgz` 后：

```sh
dsh plugin --profile web add ./dsh-notify-interactive-0.1.1.tgz
```

### 本地开发安装

```sh
dsh plugin --profile web add /absolute/path/to/dsh-notify-interactive
```

安装后刷新 DSH 页面。Host 半边是空 `apply()`，Client 半边由页面加载；通常不需要重启整个 DSH 进程。

## 首次使用

1. 刷新 DSH 页面。
2. 打开 **设置 → 互动提醒**。
3. 点 **授权通知**，允许浏览器通知（Windows 通知中心横幅）。
4. 点 **打开弹窗**。浏览器安全策略要求一次用户点击才能打开始终置顶窗口；打开后它会一直保留，直到你关闭。
5. 用 **测试审批卡 / 测试提问卡 / 测试完成卡** 验证交互；这些是本地演示，不会真正回答任何请求。
6. 关闭弹窗也没关系：下一次提醒会显示在页面右下角的浮层里，并可重新打开弹窗。

> 音效第一次可能被浏览器自动播放策略静音；在页面上点任意位置后即可解锁。

## 设置

| 设置 | 默认 | 说明 |
|---|---|---|
| 启用提醒 | 开 | 所有通道的总开关 |
| 播放提示音 | 开 | 音效通道 |
| 音效 | 清脆铃音 | 清脆铃音 / 短促脉冲 / 完成上行音 / 轻柔提示 / 警示音 / 静音 |
| 音量 | 70% | 0–100% |
| 显示交互弹窗 | 开 | 交互弹窗通道；无弹窗时页内浮层兜底 |
| 打开/关闭弹窗 | — | 手动控制常驻窗口 |
| 显示 Windows 系统通知 | 开 | 浏览器 Notification → Windows 通知中心 |
| 通知权限 | 未授权 | 授权 / 测试 |
| 当前会话不打扰 | 开 | 页面聚焦且正在看该会话时跳过 |
| 包含子智能体会话 | 关 | 子会话默认安静 |
| 完成卡片自动关闭 | 8 秒 | 0 = 一直保留到手动关闭 |
| 页内最多显示卡片 | 3 | 超出部分在弹窗内滚动查看 |

设置保存在浏览器 `localStorage`（键 `dsh.notify-interactive.settings.v1`），按浏览器/设备独立，不写 profile 配置。

## 工作方式

```text
DSH Web Client
  uiSession.sessionStatus (running / pendingInteraction / completionUnread)
  sessions.list (会话标题 / 主视图 / 子会话)
        │
        ▼
  Notification Engine（基线、去重、场景门控、前台抑制）
        ├──▶ Web Audio 音效
        ├──▶ 浏览器 Notification → Windows 通知中心
        └──▶ 通知队列
                ├──▶ shell.overlay 页内浮层
                └──▶ Document PiP / window.open 弹窗
                        ├── PendingApproval.answer('allowed-once' | 'rejected')
                        ├── PendingQuestion.answer({ answers: [...] })
                        └── ctx.uiWorkspace.openSession(sessionId)
```

- 不监听 `approval/request` / `user-questions/request` waterfall，不改变 DSH 原有审批链。
- 弹窗与主页面共享同一 JS 运行时，所以能直接调用 DSH 已经创建的 `PendingApproval` / `PendingQuestion` 对象；这就是“在弹窗里操作和网页一样”的原因。
- Host 半边不注册服务、不写配置、不碰 session log。

## 已知边界

| 边界 | 说明 |
|---|---|
| 浏览器必须打开 | 系统通知和弹窗都依赖 DSH 页面；页面关闭后不会再提醒 |
| Document PiP | Edge/Chrome 等 Chromium 支持；Firefox/Safari 回退普通弹窗或页内浮层 |
| 系统通知权限 | 用户必须允许站点通知；拒绝后不会重复骚扰 |
| 始终置顶 | 只有 Document PiP 后端保证置顶；普通弹窗/页内浮层不保证 |
| 第一阶段完成文案 | 统一显示“本轮已结束”，不区分 completed/error/aborted；第二阶段用 Host projection 细分 |
| 审批“始终允许” | 不提供；DSH 的 `PendingApproval` 只支持允许一次/拒绝 |
| 计划正文 | 纯文本预览 + “在 DSH 中查看完整计划”；不在弹窗内编辑计划 |
| 同会话多请求 | 只展示 `pendingInteraction` 最高优先级的一张，与 DSH 内置 UI 一致 |
| 多标签页 | 每个标签页各自运行；第二阶段做去重 |
| 设置同步 | localStorage 按浏览器保存，不跨设备同步 |

## 同类项目调研

开发前检索了 GitHub/npm 上的 DSH 通知项目。**没有找到完全满足“弹窗内可作答 + 音效/弹窗独立开关 + 完成回会话 + DSH 风格”的活跃项目**：

- [yiumanlenong/dsh-popup-notify](https://github.com/yiumanlenong/dsh-popup-notify)：Windows 置顶弹窗，但弹窗不可交互，明确“回答仍在 DSH 窗口”。
- [qingfengyu153781-star/dsh-approval-popup](https://github.com/qingfengyu153781-star/dsh-approval-popup)：原生审批 Yes/No，但不支持提问/自定义回答，完成提醒无回会话。
- [Aisland-SJL/dsh-reminder](https://github.com/Aisland-SJL/dsh-reminder)：跨窗口提醒 + 点击回会话，但弹窗内不能作答。
- [THEWOLFWALKER/dsh-notifier](https://github.com/THEWOLFWALKER/dsh-notifier)：手机端可审批/回答，但不是 DSH 风格 Windows 弹窗，体系重。
- [dsh-tauri/deepseek-harness-desktop](https://github.com/dsh-tauri/deepseek-harness-desktop)：桌面壳原生通知可批准，但是整个桌面 App，不是 dsh-web 插件，且不支持提问自定义回答。

详细对比与 API 结论见 [docs/research.md](docs/research.md)。

## 开发

```sh
pnpm install
pnpm verify        # build + node --check + node --test
```

- `src/`：源码；`lib/client.js` 是构建产物，**已提交**，便于 GitHub 直接安装。
- 不要手改 `lib/client.js`；改 `src/` 后运行 `pnpm build`。
- `lib/index.js` 由 `src/host/index.js` 复制。
- CI 会运行 `pnpm verify` 和 `git diff --exit-code`，确保产物与源码一致。

## 隐私与安全

- 不自动批准/拒绝；没有超时自动选择。
- 不上传任何数据；提示音是本地 Web Audio 合成。
- 弹窗内文本按纯文本渲染，计划正文不注入 HTML。
- 唯一写操作是用户点击后调用 DSH 的 `PendingApproval.answer` / `PendingQuestion.answer`。
- 不新增模型可见工具、不注入 prompt、不写 session log。

## 许可证

[MIT](LICENSE) © 2026 wuqiuwangtian
