# Changelog

## 0.1.0 — 2026-11-08

第一阶段首发。

### Added

- 观察 `uiSession.sessionStatus` 与 `sessions.list`，在权限审批、提问/计划审核、任务完成时提醒。
- 三个独立通道：音效、DSH 风格交互弹窗、Windows 系统通知。
- Document Picture-in-Picture 始终置顶弹窗；普通 `window.open` 与页内浮层回退。
- 弹窗内审批允许/拒绝、提问单选/多选/自定义/跳过、计划审核批准/拒绝。
- 完成卡片“回到对话”打开对应会话。
- 设置页：总开关、音效/音量/试听、弹窗开关/打开/测试、系统通知授权/测试、行为选项、测试卡片。
- 本地合成 6 个音效预设（含静音）。
- 基线播种、去重、前台抑制、子会话过滤、重连重置。
- 31 个单元测试、构建产物提交、GitHub Actions CI。

### Known limits

- 浏览器页面必须打开。
- Document PiP 依赖 Chromium；其他浏览器回退。
- 第一阶段完成文案不区分结束原因。
- 审批不提供“始终允许”。
- 设置按浏览器 localStorage 保存。
