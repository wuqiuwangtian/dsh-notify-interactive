# AGENTS.md

面向接手本仓库的 agent / 开发者。先读本文件，再读 `docs/requirements.md` 与 `docs/verification.md`。

## 项目定位

`dsh-notify-interactive` 是 DSH Web 的互动提醒插件。它观察 `uiSession.sessionStatus` 与 `sessions.list`，在审批、提问/计划审核、任务完成时通过音效、置顶弹窗、Windows 系统通知提醒用户，并允许用户在弹窗内直接作答。

## 关键约束

- **不自动批准/拒绝**：所有 `PendingApproval.answer` / `PendingQuestion.answer` 只能来自用户点击。
- **不写 profile 配置**：设置存浏览器 localStorage；不要读/改 profile 的 `cordis.patch.yml`。
- **不写 session log**：不注册 session 投影、不 append 事件、不注册模型工具、不注入 prompt。
- **不依赖宿主内部 Client 包**：不要 `require('@deepseek-ai/dsh-client-ui-primitives')` 等；只 `require('react')`、`react/jsx-runtime`、`react-dom`、`react-dom/client`。
- **样式只用主题 token**：`--dsw-*` / `--dsh-*` / `--ds-*`；不要在 CSS 里写死品牌色。弹窗通过 `src/ui/theme.js` 复制主文档的解析值。
- **Host 半边保持空**：`src/host/index.js` 只导出 `apply()`；所有逻辑在 Client。
- **产物提交**：`lib/client.js` 是构建产物，必须与 `src/` 同步提交；CI 会 `git diff --exit-code`。

## 构建与验证

```sh
pnpm install
pnpm verify      # node scripts/build.mjs && node --check lib/*.js && node --test tests/*.test.mjs
```

- Node >= 20；开发依赖只有 `esbuild`。
- `pnpm-workspace.yaml` 的 `allowBuilds.esbuild: true` 是 pnpm 12 运行 esbuild 安装脚本所必需。
- 测试覆盖：设置 normalize/持久化、状态 diff、引擎门控/去重、提问答案构造、音效预设。
- 视觉/真实触发无法自动验证：本仓库不启动独立浏览器；按 `docs/verification.md` 的用户清单验收。

## 安装

在 DSH 会话中优先用 `plugin_manager` 的 `install_bundle`，target 为仓库绝对路径。不要手工改 profile 的 `package.json` / `cordis.patch.yml`。安装后刷新页面；若返回 `restart-required`，说明需要重启 DSH。

## 发布

1. 更新 `CHANGELOG.md` 与 `package.json` 版本。
2. `pnpm verify`。
3. `git add -A && git commit`。
4. `pnpm pack`，把 tgz 附加到 GitHub Release。
5. `gh repo edit --add-topic dsh --add-topic dsh-plugin --add-topic deepseek-harness --add-topic notifications`。

## 关键 API 事实（DSH 0.2.2-rc.1）

- `ctx.uiSession.sessionStatus`：`{ getSnapshot, subscribe }`，快照是 `Map<SessionId, { running, pendingInteraction, completionUnread }>`。
- `ctx.sessions.list`：`{ getSnapshot, subscribe }`，快照含 `ids`、`byId[id].displayTitle/origin/retainedBy`。
- `pendingInteraction.kind`：`'approval'`（`PendingApproval`）或 `'question' | 'plan-review'`（`PendingQuestion`）。
- `PendingApproval.answer('allowed-once' | 'rejected')`。
- `PendingQuestion.answer({ answers: [{ id, selected, custom? }] })`；`channel` 为 `waterfall` / `rpc` / `none`；`snapshot().countdown`；`holdFocus`/`releaseFocus`/`engage`/`takeTime`。
- `ctx.uiWorkspace.openSession(sessionId)`。
- `react-dom/client` 在 `dsh-web-frontend` 的 static modules 中可用。
- Document PiP：`window.documentPictureInPicture.requestWindow({ width, height })`，需要用户手势；不支持时 `window.open`。

## 诊断

- 页面加载后 `globalThis.__dshNotifyInteractive` 暴露 runtime：`addDemo(kind)`、`openPopup()`、`closePopup()`、`getMainSession()`、`settingsStore`、`notificationStore`、`popupController`。
- 设置页的测试按钮添加本地演示卡片，不会回答真实请求。
