# dsh-notify-interactive

DSH 会话提醒插件：权限审批、提问/计划审核、一轮任务结束时提醒；正在看事件所属会话时静默。目标是无需预开通知窗口、弹窗与音效独立配置、DSH 风格可交互窗口，以及 Windows / Linux 支持。

[English](README.en.md) · [需求、现状与实施计划](docs/requirements.md) · [调查与方案依据](docs/research.md) · [验证证据与验收](docs/verification.md)

## 当前状态

代码版本 `0.2.1`，目标 DSH `0.2.2-rc.1`。2026-11-09 正在重新规划：**当前实现尚未满足上述完整目标**；已开始 P0 调查，并修复 Web 兜底漏音；已新增安装后自动启用的完成提醒辅助程序原型，尚未接入完整审批/提问交互。

现有 Web 卡片具备审批、提问选项/自定义输入、计划审核和回会话代码；已有 5 种有声音效及静音、音量和试听。交互窗由用户手动打开，队列为空会关闭，后续事件不会自动重新打开。

无已打开交互窗时，Web 请求宿主启动 PowerShell WinForms 只读提醒；无 Web presence 时宿主直接尝试该路径。目前只有 Windows / WSL 路径，**没有 Linux 原生桌面通知**。真实桌面和交互端到端尚未完整验收，用户已反馈弹窗失效。

设置保存在浏览器 `localStorage`（`dsh.notify-interactive.settings.v2`）。目前没有弹窗独立总开关、分事件设置 UI 或分事件音效；宿主无 Web 时不会读取这些设置。不要把当前版本当成已经支持共享开关的完整提醒方案。

## 规划方向

先定位漏投原因、调查 DSH 已有桌面窗口/通知接口；再比较纯插件系统通知与配套桌面辅助程序。用户已确认选择浏览器 + 桌面辅助程序；增加安装、通信与升级成本，当前用可替换的 Electron 适配器验证能力。不会擅自要求用户换 DSH 客户端。阶段计划与待定选择只在 [需求文档第 5、6 节](docs/requirements.md#5-分阶段计划与进入条件)维护。

保留不自动作答、不写 session log、不注册模型工具、不注入 prompt、不抢审批链的约束；系统兜底仅提醒。窗口作答必须来自用户显式操作。

## 试用完成提醒原型（Arch WSL → Windows）

本轮重点为 Web；TUI 已有提醒，DSH Desktop 不扩展。原型仅接管完成提醒，其余事件仍用旧路径。安装器要求 Node.js >=22.12；Electron Windows 运行时约 357 MiB，另有 WSL 下载副本。

```sh
pnpm companion:install
pnpm companion:smoke
# 当前 DSH 任务结束并停止旧服务后启动；不要同时占用同一端口
dsh --profile web --no-open
```

在已认证的浏览器刷新，保持旧交互弹窗关闭，点设置中的“测试桌面完成提醒”；应自动显示新窗口。完整步骤、镜像下载、真实事件验收与回退见 [验证文档第 7 节](docs/verification.md#7-p1arch-wsl--windows-原型)。辅助程序安装于 Windows LocalAppData，通过随机连接目录文件邮箱通信，不监听额外网络端口；没有设置开机自启。设置 DSH_NOTIFY_COMPANION=0 并重启即可回退。审批/提问、共享设置、通道开关及 Linux 原生桌面仍待实现。

## 安装现有版本

以下安装的是当前受限实现，不会获得规划中的新能力：

```sh
dsh plugin --profile web add https://github.com/wuqiuwangtian/dsh-notify-interactive
```

也可使用既有 `dsh-notify-interactive-0.2.1.tgz`：

```sh
dsh plugin --profile web add ./dsh-notify-interactive-0.2.1.tgz
```

CLI/TUI 需装到对应 profile；当前仅能尝试 Windows 只读兜底，不能视为完整兼容。安装后刷新 Web；宿主代码变更需要重启 DSH。在 DSH 会话里优先使用 `plugin_manager install_bundle`，target 为仓库绝对路径。

## 查看和验证

设置 → 互动提醒：可以试听音效、测试 Windows 提醒、测试交互弹窗及演示卡。演示不等于真实投递成功；诊断步骤与目标验收见 [verification.md](docs/verification.md)。当前 Windows“打开 DSH”仅传站点地址，不保证定位事件所属会话。

```sh
pnpm install
pnpm verify
```

`src/client/` 为 Web 状态和 presence；`src/host/` 为宿主事件与 Windows 兜底；`src/ui/` 为设置和卡片；`src/audio/` 为音效。`lib/client.js` 从源码构建，代码提交需同步，不能手改。

本轮 `pnpm verify` 通过，包含构建、66 项测试、渲染冒烟和语法检查；Windows 原型的显示、音频启动、恢复和宿主路由冒烟通过，真实 DSH 会话及回会话尚未验收，未发布。自动测试通过不等于真实提醒可用。

## 许可证

[MIT](LICENSE) © 2026 wuqiuwangtian
