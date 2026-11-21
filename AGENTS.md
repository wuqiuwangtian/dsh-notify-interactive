# AGENTS.md

先读 `docs/requirements.md` 与 `docs/verification.md`。0.3.0 为本地候选版本，Windows 原生通知是正式投递通道。当前验收环境为 Arch WSL、Windows 11 和 DSH Web 0.2.2-rc.5。

## 实现约束

- 宿主只观察 `session/event`。保持 DSH 认证和 owner 检查，禁止写 session log、注册模型工具、注入 prompt 或监听审批／提问 waterfall。
- Windows 通知正文回会话。快捷按钮必须由用户显式触发，经宿主和在线页面复核实例、会话、事件、原 Pending 对象、内容和状态，只交付一次。超时和重连不重放。
- 保持每个事件独立的通知／声音开关和音效。默认焦点规则、完成时机、已完成轮次历史和待处理条目撤回见需求第 2 节。
- Windows 目标地址取 DSH 的 `webServer.getOrigin()` 或显式配置的可信 origin。禁止从请求正文或未经验证的请求头生成激活地址。
- 不添加页内卡片、浏览器通知窗、WinForms 或 Electron 回退。设置页使用 DSH 主题 token，界面修改后核对实际渲染；原生通知须区分 Windows 接受、历史出现和用户操作。

## 代码与验证

`src/client/` 提供 presence、设置同步及 Pending 所有者，`src/engine/` 观察 Web 快照变化，`src/host/` 处理事件认领、聚焦、profile 持久化和 Windows 投递。原生回调使用 `ToastActivator.cs` 与 `toast-actions.js`；清除或关闭通知不得生成回答。通知 group 按 profile 和 WSL 发行版隔离。保留历史 AUMID 和现有 localStorage 键以承接升级。

`pnpm verify` 包括构建、语法、单元测试和中英文设置页渲染。构建后同步提交 `lib/`。用 `pnpm native:acceptance` 创建隔离实例，可用 `--bundle` 指定实际包。实际安装、演示、禁用、旧版清理和完整卸载见 README。日常 profile 验收优先使用设置页测试，不向用户会话发测试 prompt。

发布前检查版本、CHANGELOG、`pnpm pack` 和包安装。远端推送和发布另按授权执行。
