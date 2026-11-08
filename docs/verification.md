# 验证记录

更新日期：2026-11-08。环境：DSH `0.2.2-rc.1`，`web` profile，WSL2，Windows 侧 Edge 156。

## 1. 自动化验证

| 检查 | 命令 | 结果 |
|---|---|---|
| 构建 | `pnpm build` | 通过；`lib/client.js` ≈ 123 KB，`lib/index.js` 为 Host 空 `apply()` |
| 语法 | `pnpm check`（`node --check lib/index.js lib/client.js`） | 通过 |
| 单元测试 | `pnpm test` | **36 passed / 0 failed** |
| 服务端渲染冒烟 | `pnpm render-smoke` | 通过；Settings 7629B、Overlay 7241B、PopupApp 7814B |
| 客户端加载冒烟 | 临时 Node VM mock `window.__ModuleLoader__` + `react`/`react-dom` | 通过；`inject = slots,locale,sessions,uiSession`；注册 `shell.overlay/notify-interactive.overlay` 与 `settings.section/notify-interactive` |
| 静态禁入包 | `grep dsh-client-ui-primitives lib/client.js` | 无匹配 |
| 组件级渲染 | `tests/render-entry.jsx` 渲染 Settings / Overlay / PopupApp + 审批/提问/完成/计划演示卡 | 通过；能捕获 JSX/hook/undefined 组件错误 |
| 产物同步 | `pnpm build && git diff --exit-code`（CI） | 待首次提交后验证 |

测试覆盖：

- `tests/settings.test.mjs`：默认值、非法值修复、部分合并、localStorage 持久化、损坏 JSON、写入失败。
- `tests/engine.test.mjs`：diff 基线/新交互/清除/完成边/未读兜底/会话移除；引擎播种、审批卡、前台抑制、子会话、完成去重、禁用清空、reset 重播种、通道 gate、工具函数。
- `tests/questions.test.mjs`：单选/多选/自定义/跳过答案构造；校验；计划审核解析。
- `tests/sounds.test.mjs`：预设唯一性、静音、音量 clamp、合成/节流/无 AudioContext 降级。

## 2. 安装验证

- `plugin_manager install_bundle` target `/home/wqwt/code/dsh-notify-interactive`：
  - `application: applied`
  - `warnings: []`
  - profile 依赖新增 `dsh-notify-interactive: link:/home/wqwt/code/dsh-notify-interactive`
  - profile `node_modules/dsh-notify-interactive` 指向 `/home/wqwt/code/dsh-notify-interactive`
- `cordis_inspect_query` `Slots.listSubTree`：
  - `settings.section` occupants 出现 `notify-interactive`（order 16，active true）。
  - `shell.overlay` occupants 出现 `notify-interactive.overlay`（order 100）。**刷新后复查 active true**，说明 Client 模块已加载且 Overlay 正常挂载。
- 页面需要刷新以加载新的 client bundle（当前会话没有 `pnpm run dev:web` watcher）。
- GitHub：<https://github.com/wuqiuwangtian/dsh-notify-interactive>
- Release：<https://github.com/wuqiuwangtian/dsh-notify-interactive/releases/tag/v0.1.2>（附 `dsh-notify-interactive-0.1.2.tgz`）

## 3. 用户手工验收清单

> 本环境没有浏览器控制接口；按 `cordis-plugin-development` 的验证规则，不启动独立浏览器。以下步骤需要用户在实际 DSH 页面执行。

### 3.1 设置页

1. 刷新 DSH 页面。
2. 打开 **设置 → 互动提醒**。
3. 确认出现：总开关、音效（开关/预设/音量/试听）、交互弹窗（开关/打开/测试/后端）、Windows 系统通知（开关/权限/授权/测试）、行为、测试、恢复默认。
4. 确认状态条显示当前卡片数、弹窗后端、通知权限、音频状态。

### 3.2 测试卡片

1. 点 **测试审批卡**：页内/弹窗出现审批卡；点“允许一次”或“拒绝”后卡片消失（演示，不触碰真实请求）。
2. 点 **测试提问卡**：选择单选/多选、输入自定义、点“跳过”或“提交回答”；确认交互正常。
3. 点 **测试完成卡**：出现完成卡；点“回到对话”或“关闭”。

### 3.3 真实审批

1. 让页面失焦（切到其他窗口）。
2. 在某个会话触发需要审批的工具调用。
3. 确认：音效、Windows 通知、置顶弹窗按开关出现。
4. 在弹窗点“允许一次”或“拒绝”；确认 DSH 会话继续/拒绝，卡片消失。
5. 若弹窗被拦截，确认页内浮层出现并可作答。

### 3.4 真实提问 / 计划审核

1. 让 Agent 使用 `ask_user_question`（或触发计划审核），页面失焦。
2. 在弹窗中选择选项、输入自定义回答、提交；确认 Agent 收到答案并继续。
3. 计划审核：确认计划文本可见，批准/拒绝可用；“在 DSH 中查看完整计划”跳转正确。

### 3.5 完成与回会话

1. 让一轮对话完成，页面失焦。
2. 确认完成卡片；点“回到对话”打开对应会话。
3. 等待自动关闭时间（默认 8 秒）确认卡片自动消失。

### 3.6 独立开关与回退

1. 关闭音效，保留弹窗：确认有弹窗无声音。
2. 关闭弹窗，保留音效：确认有声音无弹窗。
3. 关闭系统通知：确认无 Windows 通知。
4. 关闭弹窗后，确认页内浮层接管；重开弹窗后不重复显示同一卡片。
5. 刷新页面：确认不会对已存在的待处理请求重复轰炸。

### 3.7 主题 / 语言 / 可访问性

1. 切换明暗主题：确认弹窗与卡片颜色跟随。
2. 切换中英文：确认设置页、弹窗、卡片文案跟随。
3. 键盘：Tab 顺序、开关 Space/Enter、Escape 关闭完成卡、输入框 Enter 提交提问。

## 4. 未验证 / 限制

| 项 | 原因 | 影响 |
|---|---|---|
| 视觉像素级效果 | 无浏览器自动化；由用户验收 | 需用户确认 |
| 真实审批/提问触发 | 需用户在新会话触发 | 需用户确认端到端 |
| Document PiP 实际置顶 | 依赖 Edge/Chrome 与用户点击 | 需用户确认 |
| Windows 通知中心显示 | 依赖站点权限与系统设置 | 需用户确认 |
| 多标签页去重 | 第一阶段未实现 | 文档说明 |
| 完成原因细分 | 第一阶段未实现 | 统一“本轮已结束” |
| 非 Chromium 回退 | 未在 Firefox/Safari 实测 | 代码有回退路径 |

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
