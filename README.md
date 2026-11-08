# dsh-notify-interactive

> DSH 的“任务中断”提醒插件。正在看当前会话时不打扰；否则直接拉起一个带具体内容的 Windows 小窗；需要窗口内作答时，再按需打开 DSH 风格交互弹窗。CLI/TUI 同样走 Windows 小窗。

[English](README.en.md) · [需求文档](docs/requirements.md) · [同类项目调研](docs/research.md) · [验证记录](docs/verification.md)

## 它解决什么

只有需要人继续操作时才会提醒：

- 权限审批（提权、写入、命令执行等）；
- 智能体提问 / 计划审核；
- 一轮任务结束。

规则只有一条：**如果你正聚焦于当前会话，就什么都不发生。**否则：

1. 默认直接拉起带具体内容的 **Windows 小窗**（只提醒，不能作答）；
2. 需要窗口内作答时，按需打开 DSH 风格交互弹窗；它只在有提醒时打开，处理完自动关闭；
3. 没有 Web UI（CLI/TUI）→ 宿主直接走 Windows 小窗。

## 功能

| 能力 | 说明 |
|---|---|
| 事件 | 权限审批、提问、计划审核、任务完成 |
| 静默规则 | 聚焦当前会话 → 不提醒 |
| Web 交互弹窗 | 可选、按需打开（仅有提醒时）；Document Picture-in-Picture 始终置顶，处理完自动关闭 |
| 弹窗内操作 | 审批允许/拒绝；提问单选/多选/自定义/跳过；计划批准/拒绝；完成回到对话 |
| CLI/TUI 兜底 | 宿主观察 session 事件，通过 PowerShell 弹 Windows 提醒 |
| Web 关页兜底 | Web 客户端上报 presence；页面关闭后宿主自动接管 Windows 提醒 |
| 音效 | 可选，Web Audio 本地合成；Windows 兜底自带系统提示音 |
| 极简 UI | 只保留最内侧卡片：标题、必要上下文、会话入口和操作；没有外层标题栏/额外关闭按钮 |
| 隐私 | 不写 session log、不注册模型工具、不自动作答、不上传数据 |

## 状态

- 版本 `0.2.1`（第一阶段重构）
- 目标 DSH：`0.2.2-rc.1` 线，Web / CLI / TUI profile
- 已移除：页内通知卡片、浏览器 Notification 通道、系统通知权限、弹窗开关等冗余配置

## 安装

```sh
dsh plugin --profile web add https://github.com/wuqiuwangtian/dsh-notify-interactive
```

或下载 Release 的 `dsh-notify-interactive-0.2.1.tgz`：

```sh
dsh plugin --profile web add ./dsh-notify-interactive-0.2.1.tgz
```

CLI/TUI profile 同样安装这个包；宿主半区会在没有 Web UI 时接管 Windows 提醒。

安装后刷新 DSH 页面。交互弹窗不需要常驻；CLI/TUI 不需要打开任何窗口。

> 从 0.1.x 升级到 0.2.x 时，宿主半区新增了 Windows 兜底与 presence 路由，需要重启一次 DSH 进程；之后日常只需刷新页面。

## 首次使用

1. 刷新 DSH 页面。
2. 默认什么都不用打开：每条消息都会拉起一个带具体内容的 Windows 小窗（只提醒，不能作答）；点 **测试 Windows 提醒** 可验证。
3. 想窗口内作答时，才点 **打开弹窗**。它只在有提醒时可用，处理完自动关闭；没有提醒时不会出现空黑框。
4. 点 **测试审批卡 / 测试提问卡 / 测试完成卡**：弹窗打开时显示交互卡片；弹窗关闭时拉起 Windows 演示小窗。

## 规则

| 场景 | 行为 |
|---|---|
| 正在看当前会话 | 不提醒 |
| Web 页面在前台，但事件属于其他会话 | Windows 小窗（直接带内容）；如已按需打开交互弹窗，则在弹窗内显示卡片 |
| Web 页面失焦/隐藏 | Windows 小窗（直接带内容）；如已按需打开交互弹窗，则在弹窗内显示卡片 |
| Web 页面关闭 / CLI / TUI | 宿主 Windows 小窗 |

- Web 交互弹窗**不能由后台事件自动打开**（浏览器限制）；需要时手动打开，且只在有提醒时可用。
- 交互弹窗没有空状态：没有卡片时会自动关闭，不会出现“暂无提醒”的黑框。
- Windows 兜底是**只读提醒**：它不会批准、拒绝或回答问题；你需要回到 DSH/终端处理。
- 音效是可选项；Windows 兜底会播放系统提示音。
- 当前会话的审批/提问/完成由 DSH 自己的界面处理，插件不重复提醒。

## 设置

| 设置 | 默认 | 说明 |
|---|---|---|
| 启用提醒 | 开 | 总开关 |
| 播放提示音 | 开 | Web 音效 |
| 音效 | 清脆铃音 | 6 个本地合成预设，含静音 |
| 音量 | 70% | 0–100% |
| 打开/关闭弹窗 | — | 仅有提醒时可打开；处理完自动关闭 |
| 测试弹窗 | — | 添加演示卡片并打开弹窗 |
| 测试 Windows 提醒 | — | 直接调用宿主 Windows 兜底 |
| 测试审批/提问/完成卡 | — | 本地演示，不会回答真实请求 |
| 恢复默认 | — | 重置设置，不卸载插件 |

设置保存在浏览器 `localStorage`（键 `dsh.notify-interactive.settings.v2`），按浏览器独立。

## 工作方式

```text
Host（Web / CLI / TUI 都加载）
  session/event:
    approval/asked · tool/call(ask_user_question|exit_plan_mode) · turn/end
        │
        ├─ 有活跃 Web presence → 不动作（Web 客户端负责）
        └─ 无 Web presence → PowerShell Windows 弹窗（只提醒）

Web Client
  presence: 每 5 秒 + focus/visibility/session 变化 → POST /dsh-notify-interactive/presence
  uiSession.sessionStatus + sessions.list
        │
        ├─ 聚焦当前会话 → 静默
        └─ 否则：
             卡片始终加入本地队列
             交互弹窗未打开 → POST /dsh-notify-interactive/windows-notify（宿主小窗）
             交互弹窗打开 → 弹窗渲染卡片；处理完自动关闭
```

- Web 客户端不会注册 `shell.overlay`，也没有页内通知。
- Host 不监听 approval/question waterfall，不改变审批链；只读 session 事件。
- Windows 兜底是一个原生 WinForms 小窗：标题/正文经 base64 + UTF-16 命令传入，右下角置顶显示，带“打开 DSH / 关闭”按钮，5 分钟自动关闭；不阻塞宿主进程。

## 原生 Windows 弹窗能输入/选择吗？

- 当前兜底已经是一个 **WinForms 原生小窗**：有标题、正文、“打开 DSH”和“关闭”按钮；点击有反应，可以打开 DSH 处理。
- 它**目前只做提醒 + 打开 DSH**，还没有单选/多选/文本框。WinForms/WPF 本身可以做到这些：放单选、多选、文本框并回传结果；如果确实需要“原生可作答小窗”，可以作为第二阶段实现。代价是 UI 无法与 DSH 完全一致，而且宿主需要接管审批/提问的应答链。
- 已经删除旧版 `WScript.Shell.Popup` 的空白框；现在不会再出现只有图标 + 确定的窗口。
- 现在可作答的 DSH 风格 Web 交互弹窗是可选增强：只在有提醒时按需打开，处理完自动关闭；不打开时用 Windows 原生小窗提醒。

## 已知边界

| 边界 | 说明 |
|---|---|
| 交互弹窗可选 | 需要窗口内作答时手动打开一次；不打开时每条消息自动走 Windows 小窗，不需要保持常驻窗口 |
| Windows 兜底只读 | 不能批准/拒绝/回答；需回到 DSH 或终端 |
| 平台 | Windows 或 WSL（检测 `powershell.exe` / `/mnt/c/.../powershell.exe`）；其他平台无 Windows 兜底 |
| 无 GUI | 终端没有桌面时 Windows 弹窗也无法显示，这是系统限制 |
| 多标签页 | 每个标签页独立；第二阶段做 leader 选举 |
| presence 延迟 | 页面崩溃未发 `pagehide` 时，宿主最多 15 秒后接管 |
| 完成原因 | 宿主 Windows 文案区分 completed/error/max-tokens/blocked；Web 完成卡统一“本轮已结束” |
| 设置同步 | 按浏览器 localStorage，不跨设备 |

## 同类项目调研

开发前检索了 GitHub/npm 上的 DSH 通知项目，**没有找到同时满足“聚焦当前会话静默 + 可交互 DSH 风格弹窗 + CLI/TUI Windows 兜底”的活跃项目**。最接近的：

- [yiumanlenong/dsh-popup-notify](https://github.com/yiumanlenong/dsh-popup-notify)：Windows 置顶弹窗，但不可交互；
- [qingfengyu153781-star/dsh-approval-popup](https://github.com/qingfengyu153781-star/dsh-approval-popup)：只支持审批 Yes/No；
- [Aisland-SJL/dsh-reminder](https://github.com/Aisland-SJL/dsh-reminder)：点击回会话，但弹窗内不能作答；
- [THEWOLFWALKER/dsh-notifier](https://github.com/THEWOLFWALKER/dsh-notifier)：手机端可回答，不是 DSH 风格桌面弹窗；
- [dsh-tauri/deepseek-harness-desktop](https://github.com/dsh-tauri/deepseek-harness-desktop)：整个桌面 App，不是 dsh-web 插件。

详见 [docs/research.md](docs/research.md)。

## 开发

```sh
pnpm install
pnpm verify        # build + node --check + node --test + 渲染冒烟
```

- `src/client/`：Web 半区；`src/host/`：宿主 Windows 兜底；`src/ui/`：极简弹窗与设置页。
- `lib/client.js` 是构建产物，已提交；不要手改。
- CI 会检查产物与源码一致。

## 许可证

[MIT](LICENSE) © 2026 wuqiuwangtian
