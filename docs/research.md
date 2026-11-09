# 现状审阅与能力调查

更新：2026-11-09。用途：记录方案依据；有效需求及阶段状态统一见 [requirements.md](requirements.md)。

## 1. 本轮证据范围

- 静态审阅 `src/client/`、`src/host/`、`src/engine/`、设置、音效、弹窗和交互卡片。
- 本地 DSH 安装包版本确认为 `0.2.2-rc.1`；复核其审批和提问 Pending 类型，确有 answer 方法。
- 本轮运行 46 项单元测试、渲染冒烟、产物语法检查，均通过。没有启动真实弹窗、安装插件、操作用户会话或验证 Linux 桌面。
- 用户报告“原先需预开窗口，后续弹不出、Windows 效果不好”。以下解释代码路径与风险，不能替代对用户现场故障的复现。

## 2. 为什么现有方向达不到目标

| 发现 | 代码依据 | 影响与结论 |
|---|---|---|
| 事件不会自动打开 Web 弹窗 | `src/engine/engine.js` 只在 isPopupOpen 为假时调用 Windows 兜底；`src/client/index.jsx` 的 openPopup 由 UI 调用 | 收到事件不会出现 DSH 自绘窗，是现有设计行为，不只是窗口样式 bug |
| 不能靠一直保留窗口修复 | `src/ui/Settings.jsx` 无卡片时禁用打开；`src/ui/PopupApp.jsx` 队列空即关闭；完成卡 8 秒移除 | 后续事件仍需再次手动打开；与早期 requirements/verification 的“空窗常驻”描述矛盾 |
| 在线不代表成功投递 | `src/host/logic.js` shouldAutoNotify 仅看 active/15 秒 TTL；host 忽略上报的焦点与会话信息 | Web 在线但故障时宿主放弃投递；后台冻结也是风险，具体现场需复现 |
| 缺少端到端结果 | `src/client/index.jsx` fetch 不检查 HTTP/body；`src/host/index.js` detached spawn 使用 stdio ignore、空 error handler | `{ shown: true }` 仅表示尝试启动成功，不能证明桌面已显示；真实进程错误难以诊断 |
| 总开关和音效仅属于 Web | `src/state/settings.js` localStorage；host 不读取其配置 | 页面关闭/CLI 下宿主仍可通知；音效关掉但 Web 未播放时，silent=false 仍可能触发 Windows 系统音 |
| 只有 Windows 桌面路径 | host 检测 powershell.exe 或 WSL 固定路径 | Linux 原生桌面没有投递适配；WSL 不等于 Linux 桌面兼容 |
| 返回没有准确定位 | client 仅向 Windows 路由传 location.origin；host payload 无 sessionId | Windows“打开 DSH”无法保证跳回事件所属会话；Web openSession 另有现成入口但跨窗口聚焦 best effort |
| 事件去重过粗 | host 以 sessionId:kind 两秒冷却；presence 只有一个 lastPresence | 不同真实请求可能误合并，多标签互相覆盖；缺事件级身份与投递协调 |
| Web 初次快照不发事件 | `src/engine/diff.js` 为新出现会话建立基线 | 防重放有价值，但恢复时已有待办不会主动提醒，需区分恢复待办与重复通知 |
| 独立样式不一致 | `src/ui/theme.js` 复制 DSH token；PowerShell 脚本硬编码颜色和字体 | Web 主题可复用；WinForms 不跟随 DSH 主题，且逐事件启动进程并主动 Activate |

上述任一风险都不能直接认定为用户“后来都弹不出”的唯一根因。P0 应按事件生成 → 策略抑制 → 投递请求 → HTTP 响应 → 进程退出/窗口显示逐段定位；临时诊断不得写 session log 或收集回答内容。

## 3. 网页与桌面能力边界

### 3.1 已查证的外部资料

1. [Chrome：Document Picture-in-Picture](https://developer.chrome.com/docs/web-platform/document-picture-in-picture)：requestWindow 缺少用户手势会拒绝；窗口不能比来源页面存活更久，位置也不能由网页任意指定。它适合用户主动打开的辅助窗口，无法作为通用后台消息自动开窗的可靠基础。普通 window.open 也需单独验证拦截行为，不作为绕过限制的保证。
2. [freedesktop Desktop Notifications Specification](https://specifications.freedesktop.org/notification/latest-single/)：Linux 桌面通知通过会话 D-Bus 服务；需能力探测，不可假设服务存在。动作与声音提示由通知服务器实现，不保证统一布局或任意输入 UI。因此可用于系统兜底，不替代 DSH 风格交互窗。
3. [Microsoft：App notification features](https://learn.microsoft.com/en-us/windows/apps/develop/notifications/app-notifications/app-notifications-additional-features)：Windows 通知有独立的生命周期、声音等能力；应作为原生通知适配调查入口，尚未选定具体集成库，也未完成真实测试。

工程判断：桌面进程通常可管理自己的窗口，避免网页的开窗手势限制；但 DSH 事件/作答桥接、配置、焦点和平台适配仍需开发。浏览器音频的 WAV 回退也不代表可绕过播放权限；桌面发声路径需独立验收。

### 3.2 还没有证实的能力

- DSH 桌面客户端是否提供可由本插件复用的窗口、通知、前台会话和主题接口。
- 桌面组件是否能经官方支持接口在无 Web 页面时完成批准/提问回答；当前插件只持有 Web Pending 对象。不能把对象的 answer 方法直接序列化后跨进程调用。
- `session/event` 的 tool/call 只能作为候选信号，不能证明每次工具调用都实际等待人工回答；新事件模型需对照真实生命周期验证，防止自动结束/计时提问误提醒。
- CLI 前台会话识别、精准回终端、Linux Wayland 激活、游戏/全屏状态检测；需按目标环境实测。

优先调查已有桌面能力，再决定是否新增辅助程序。桌面组件若启动自绘 WebView，也必须通过明确的原生桥接管理窗口与应答，而不是仅把网页装进壳。

## 4. 复用与重做建议

保留候选：`src/audio/`、`src/engine/question-answer.js`、`src/ui/cards/`、i18n、主题 token 与纯函数测试。卡片目前直接依赖 runtime 和 Pending 对象，复用到独立窗口前需划分展示数据与命令接口。

重做候选：宿主统一配置、事件身份、投递与确认、presence 聚合、平台窗口适配、回会话协议。先证实事件到真实桌面的最小闭环，避免再花时间打磨一个无法自动出现的 UI。

## 5. 历史调研的有效性

旧文档于 2026-11-07/08 列出 dsh-popup-notify、dsh-approval-popup、dsh-reminder、dsh-notifier、deepseek-harness-desktop 等候选，并给出“没有完全符合的活跃项目”的结论。本轮没有重新核实这些仓库的内容、许可证或活跃度；旧结论不能作为当前选型证据，详细旧表可从 Git 历史查阅。

P0 调查已有桌面客户端或依赖时，应重新核实官方接口、维护状态、许可、安装体积与集成成本；只复用真正减少维护成本的能力，不因旧表或项目名称直接选型。

## 6. P0 实查结果与路线确认

用户已选择继续用浏览器、接受配套桌面辅助程序。以下桌面项目供参考，不要求用户换客户端。

### 桌面通知能力

核查上游提交 `09f9343b98c522df8a5788284169810a24042948`（2026-11-09 读取），[项目元数据](https://github.com/dsh-tauri/deepseek-harness-desktop)为 MIT、非归档。检查的是源码，不是运行验证：

- [native.ts](https://github.com/dsh-tauri/deepseek-harness-desktop/blob/09f9343b98c522df8a5788284169810a24042948/packages/builtin-plugin-notification/src/client/service/native.ts)：通过 `dsh-tauri/client` invoke 调用通知权限、动作注册和 notify；回调校验 origin、deliveryKey、sessionId。可参考事件身份设计。
- [notify.ts](https://github.com/dsh-tauri/deepseek-harness-desktop/blob/09f9343b98c522df8a5788284169810a24042948/packages/builtin-plugin-notification/src/client/register/notify.ts)：观察客户端状态，动作再调用当前 Pending；通过 adapter.openSession 定位会话。提问通知以自由文本回复，多题攒齐再提交；不是完整选项弹窗。
- [tauri.ts](https://github.com/dsh-tauri/deepseek-harness-desktop/blob/09f9343b98c522df8a5788284169810a24042948/packages/builtin-plugin-tauri/src/client/service/tauri.ts)：原生能力有专用可用性标志，事件按窗口限定；浏览器下 listen 退为 noop。因此不能直接把这个插件装进普通浏览器就获得桌面能力。

未确认上游提供可供普通浏览器远程调用的任意交互窗口 API；不能把 Tauri SDK 的存在当作该能力已开放。

### 应答边界

本地 `@deepseek-ai/dsh-user-questions/lib/types/index.d.ts` 与 `lib/typert.remote-client.d.ts` 有 `userQuestions/answer`，但契约明确只回答 continued 问题，接受后以有来源的用户消息进入原生流程。不适用于统一回答所有等待中的审批和提问，也不能为规避“不写 session log”自行伪造该消息。辅助程序首个交互原型仍应桥接活跃 Web 的 Pending 对象，不监听新的 waterfall。

### 已复现缺陷与修复

隔离调用真实 createEngine，Web 隐藏、审批到达、sound.enabled=false 时，修复前收到一个 Windows fallback，silent=false；同类问题覆盖完成提醒。引擎原来仅根据“Web 是否播成功”决定系统静音，混淆了“禁止声音”和“播放失败”。现已让全局/场景静音、none、零音量都请求 silent=true，Web 已播成功也不重复响；仅允许声音而 Web 播放失败时保留系统声音。12 项回归覆盖审批与完成的六种组合。

边界：未改 Windows 手动测试按钮的演示行为；无 Web 时宿主仍未共享配置，仍是 P2 缺口。

### 环境可观测性

当前 WSL 可执行 Windows PowerShell，版本 `5.1.26100.9711`，退出码 0；未显示真实窗口。检查本机 Linux 进程/监听端口未发现 DSH launcher，已识别的 Node 监听者为 VS Code。无法从这些事实推出 Windows 侧没有 DSH，也不能据此检查用户故障页面。当前运行位置、访问地址和 Linux 桌面目标已询问，尚待补充。

## 7. Arch WSL → Windows 完成提醒原型

用户说明日常 Web/TUI 在 Arch WSL，Windows 使用 DSH Desktop；本轮聚焦 Web，后两者不扩展。本机 `/etc/os-release` 亦为 Arch Linux。

选型：可替换 Electron 45.2.3 适配器，MIT；沿用 JavaScript/HTML/CSS 和本地 WAV 生成。Windows 解压运行时实测约 357 MiB，体积明显大于依赖系统 WebView 的方案，但可先避免 Rust/Windows WebView 构建链，直接验证窗口与数据协议。正式打包和体积优化尚未完成。

官方依据：[BrowserWindow](https://www.electronjs.org/docs/latest/api/browser-window/)、[Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation)、[Sandbox](https://www.electronjs.org/docs/latest/tutorial/sandbox)。实现关闭 renderer Node 集成，开启上下文隔离与沙箱；只加载本地 HTML，拒绝新窗/导航/权限请求；内容以 textContent 写入，不执行 DSH 传来的 HTML/JS。打开会话只允许 HTTP(S)，不接受 file/javascript URL。

### 两个实测失败及调整

1. 直接从 WSL UNC 路径启动 Windows Electron：GPU/渲染子进程启动失败。改为 installer 将运行时与窗口文件复制到 Windows LocalAppData 后可就绪；未关闭沙箱绕过。
2. WSL spawn Windows GUI 程序：标准输入立即结束，无法可靠持续双向通信。改用 Windows 用户目录下每连接随机文件邮箱，命令/事件先写 tmp 再 rename，心跳 3 秒、15 秒过期退出。该目录继承 Windows 用户目录权限；同一用户的其他进程不在隔离威胁模型内。

原型不启监听端口。主进程验证输入协议、URL、音频、theme token 名称和值长度；renderer 只暴露有限 contextBridge 方法，不暴露 ipcRenderer。原始内容与回答不写诊断日志；当前只支持完成提醒，没有应答接口。

GitHub 运行时下载首次返回 504；改用 `ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/` 下载成功，安装器保留固定版本包内校验和检查。镜像不是硬编码默认源，用户可自行选择；二进制不提交 Git。

### 实测证据与未完成项

`pnpm companion:smoke`：Windows 真实进程依次确认 visible=true/focused=false、visible=false 且 audio played=true、再次 visible=true；杀掉启动进程后下一条消息重新启动并 rendered。真实构建后 Host 路由（mock DSH webServer）返回 200 / shown=true / delivery=rendered。它验证桌面与宿主代码路径，不是实际 DSH 会话端到端。

播放器开始播放不等于听感验收；窗口 visible 不等于用户在全屏/锁屏下必然看到。主题视觉、真实完成事件、回对应会话仍待用户运行中的 Web 验收。多事件 UI 队列、多标签去重、统一设置与所有场景交互按 P2/P3 实施。

## 8. 普通重启未启用的原因与修复

实查重启后的 3080 Web 进程环境没有 DSH_NOTIFY_COMPANION=1；此前的原型明确依赖该变量，设置页没有可辨认状态。已改为安装自动检测，显式 0 回退；新增只读状态路由与独立桌面测试按钮，报告已渲染/不确定/旧路径/失败。没有通过热修改进程环境或终止用户服务绕过正常加载。
