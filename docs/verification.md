# 验证记录

更新日期：2026-11-08。环境：DSH `0.2.2-rc.1`，`web` profile，WSL2，Windows 侧 Edge。

## 1. 自动化验证

| 检查 | 命令 | 结果 |
|---|---|---|
| 构建 | `pnpm build` | 通过；`lib/client.js` 约 112 KB，`lib/index.js` 为宿主半区 |
| 语法 | `pnpm check` | 通过 |
| 单元测试 | `pnpm test` | **45 passed / 0 failed** |
| 渲染冒烟 | `pnpm render-smoke` | 通过；Settings 4815B、PopupApp 5352B |
| 宿主 apply 冒烟 | 临时 Node mock `ctx.inject` / `webServer` / `session/event` | 通过；presence 与 windows-notify 路由注册；presence active 时 turn/end 不触发 Windows |
| 静态禁入包 | `grep dsh-client-ui-primitives lib/client.js` | 无匹配 |
| 产物同步 | `pnpm build && git diff --exit-code`（CI） | 待首次提交后验证 |

测试覆盖：

- `tests/settings.test.mjs`：v2 默认值、非法值修复、部分合并、localStorage、损坏 JSON、写入失败。
- `tests/engine.test.mjs`：diff 基线/交互/完成/移除；聚焦当前会话静默；其他会话通知；弹窗打开入队；弹窗关闭走 Windows 兜底；子会话跳过；禁用清空；reset。
- `tests/questions.test.mjs`：单选/多选/自定义/跳过答案构造；校验；计划审核解析。
- `tests/sounds.test.mjs`：预设、音量、Web Audio、WAV 兜底、试听路径。
- `tests/host-logic.test.mjs`：presence 策略、session label、approval/question/plan/completion 文案、subagent/aborted 跳过。
- `tests/host-apply.test.mjs`：宿主路由注册（presence / windows-notify）与 presence 204。
- `tests/surface.test.mjs`：popup/no-popup 标志。
- `tests/i18n.test.mjs`：中英文映射与占位符。
- `tests/render-entry.jsx`：Settings / PopupApp + 审批/提问/完成/计划演示卡的服务端渲染。

## 2. 安装验证

- `plugin_manager install_bundle` target `/home/wqwt/code/dsh-notify-interactive`：
  - `application: applied`；`warnings: []`
  - profile 依赖 `dsh-notify-interactive: link:/home/wqwt/code/dsh-notify-interactive`
- Client 只注册 `settings.section`（id `notify-interactive`）；**不再注册 `shell.overlay`**。刷新页面后旧 overlay 项应消失。
- 页面需要刷新以加载新的 client bundle；宿主半区（Windows 兜底/presence 路由）是新增的，升级到 0.2.0 需要重启一次 DSH 进程。
- GitHub：<https://github.com/wuqiuwangtian/dsh-notify-interactive>
- Release：<https://github.com/wuqiuwangtian/dsh-notify-interactive/releases/tag/v0.2.0>

## 3. 用户手工验收清单

> 本环境没有浏览器/桌面控制接口；视觉、真实审批/提问、PowerShell 弹窗、CLI/TUI 端到端由用户执行。

### 3.1 设置与弹窗

1. 硬刷新 DSH 页面。
2. 设置 → 互动提醒：确认总开关、音效、弹窗打开/测试、Windows 提醒测试、三类测试卡、恢复默认。
3. 点“打开弹窗”，确认外部小窗显示“提醒”标题和空状态。
4. 点测试审批/提问/完成卡：卡片应只出现在外部弹窗；页内不应出现任何通知卡片。
5. 点“测试 Windows 提醒”：Windows/WSL 应弹出 PowerShell 对话框（5 分钟自动关闭）。

### 3.2 聚焦当前会话

1. 聚焦 DSH 当前会话。
2. 触发审批或提问（或等待完成）。
3. 预期：插件不播放音效、不弹外部卡片、不弹 Windows；由 DSH 自带 UI 处理。

### 3.3 其他会话 / 页面失焦，弹窗已打开

1. 保持交互弹窗打开。
2. 切到其他会话或切到别的窗口。
3. 触发审批/提问/完成。
4. 预期：只有交互弹窗出现卡片；不弹 Windows。

### 3.4 弹窗关闭

1. 关闭交互弹窗。
2. 切到别的窗口/会话，触发审批/提问/完成。
3. 预期：宿主弹 Windows 提醒（只读）；回到 DSH 后在自带 UI 处理。

### 3.5 CLI/TUI

1. 在 CLI/TUI profile 安装同一包。
2. 触发审批/提问/完成。
3. 预期：宿主直接弹 Windows 提醒；无 Web 交互弹窗。

### 3.6 语言

切换 DSH 语言到中文/英文，设置页与弹窗文案跟随；`zh` / `zh-CN` / `zh-TW` → 中文，其他 → 英文。

## 4. 未验证 / 限制

| 项 | 原因 | 影响 |
|---|---|---|
| 交互弹窗视觉 | 无浏览器自动化 | 由用户确认 |
| Document PiP 实际置顶 | 依赖 Edge/Chrome 与用户点击 | 由用户确认 |
| PowerShell Windows 弹窗 | 需桌面环境；会弹真实对话框 | 由用户确认 |
| CLI/TUI 端到端 | 需要另一个 profile/终端 | 由用户确认 |
| presence 路由实际注册 | 需刷新后的 Web 页面 | 安装后检查 |
| 多标签页去重 | 第一阶段未实现 | 文档说明 |
| 完成原因 Web 细分 | 第一阶段未实现 | Web 卡统一“本轮已结束” |

## 5. 复现命令

```sh
cd /home/wqwt/code/dsh-notify-interactive
pnpm install
pnpm verify
```

安装：

```text
plugin_manager action=install_bundle target=/home/wqwt/code/dsh-notify-interactive
```

检查 slot：

```text
cordis_inspect_query platform=client provider=Slots method=listSubTree input={"root":"settings.section"}
cordis_inspect_query platform=client provider=Slots method=listSubTree input={"root":"shell.overlay"}
```
