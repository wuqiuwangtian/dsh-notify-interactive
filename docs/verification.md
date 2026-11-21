# 验证证据与目标验收

2026-11-21 路线切换为 Windows 原生应用通知。下列章节保留旧实现的历史证据，其中的“下一步”均对应当时版本。新路线的实机验收与阶段状态见 [需求第 5 节](requirements.md#5-实施顺序与验收门槛)。目前仅在本机 Windows build 26300 读到通知模式 `Unrestricted`，尚未验收原生横幅、历史条目、勿扰切换或冷启动激活。

## 1. 上轮文档审阅验证（保留记录）

代码版本 `0.2.1`；本轮只改文档。工作区初始干净，审阅起点 `f321d92`。本地 DSH 安装包 `0.2.2-rc.1`。

| 命令/动作 | 本轮结果 | 能证明什么 |
|---|---|---|
| `pnpm test` | 46 passed / 0 failed | 当前纯逻辑及 mock 测试通过 |
| `pnpm render-smoke` | 通过；Settings 4860B、PopupApp 3556B | 服务端渲染无相关 JSX/组件错误；不是真实窗口验证 |
| `pnpm check` | 通过 | 当前 lib 语法有效；未重建，不能据此证明产物同步 |
| 静态链路与 DSH Pending 类型检查 | 完成 | 见 research；不是安装后真实交互证据 |

渲染冒烟出现 Node `ExperimentalWarning: localStorage is not available because --localstorage-file was not provided.`；命令仍成功，不能将测试环境存储替代浏览器验收。

本轮没有运行 build、没有修改 src/lib/package.json、没有安装/重启/发布，也没有运行真实桌面流程。文档检查使用 `git diff --check` 与本地 Markdown 链接检查。

## 2. 历史证据（不能当作本轮验收）

2026-11-08 旧记录报告：WSL2 + Windows Edge、DSH web profile；构建/语法/46 单测/渲染通过；插件 install_bundle applied；曾执行 PowerShell 负载解码及窗口构造冒烟。历史安装记录与远端 Release 信息本轮未重新核实。

当时视觉、Document PiP 真实行为、实际审批/提问、Windows 窗口显示和 CLI/TUI 端到端没有完整验收。用户本轮明确报告效果不满意且弹窗失效，因此旧“第一阶段重构完成”不代表基础目标完成。

旧手工步骤要求预开空窗口，但代码现在无卡片不能从设置打开、空队列自动关窗；这些步骤已失效。下文以目标行为重建验收，未实现项不得标通过。

## 3. P0：定位现有故障

前提：在用户实际失败的 DSH profile、浏览器、桌面环境复现；记录插件版本与宿主是否已重启，区分 Windows 原生、WSL→Windows、Linux 原生桌面。

1. 设置 → 互动提醒 → 测试 Windows 提醒：判断现有宿主路由及 PowerShell 路径是否可用。测试只证明演示链路，不能替代真实事件。
2. 测试弹窗：当前版本会添加演示审批卡并手动开窗；记录 backend/error。完成、关闭后确认下次真实事件不会主动开 Web 窗口这一现状。
3. 在另一个前台应用中触发真实审批、提问、完成，逐段记录：宿主是否收到事件、是否因 presence 被抑制、Web 是否识别事件、windows-notify HTTP 状态/body、PowerShell 子进程是否运行成功、真实窗口是否出现。
4. Web 诊断入口为 `globalThis.__dshNotifyInteractive`，可读 popupController / settingsStore / notificationStore 状态。不要调用真实 Pending.answer 做无人批准测试。
5. 关闭 Web 页面后重复触发，比较宿主接管与设置行为；Linux 无 PowerShell 时记录“不支持”，不能记成静默成功。

预期交付：明确事件在哪一段中断，区分确定原因与待验证假设。日志不写 session log，不保存答案或完整敏感命令。真实审批由用户显式处理。

## 4. 新路径的验收矩阵（全部待实施、待验证）

### 4.1 环境

| 环境 | 首轮覆盖 | 状态 |
|---|---|---|
| Windows 原生 DSH + Web | 自动弹窗、音效、焦点、交互、回会话 | 待验证 |
| WSL DSH → Windows 桌面 + Web | 同上，附加通信、地址映射和进程恢复 | 待验证 |
| Linux 原生桌面 + Web | 同上；先确认发行版/桌面及 X11/Wayland，记录实际覆盖 | 环境待定 |
| Windows / Linux 桌面 + CLI/TUI | 无 Web 时系统通知；声音独立；前台识别/激活明确能力边界 | 待验证 |
| Headless / SSH | 不承诺本机可见弹窗；报告缺桌面能力 | 不在首轮默认覆盖内 |

只通过 WSL 不等于通过 Linux 桌面；只通过一个 Wayland/X11 桌面不等于全部 Linux 桌面兼容。

### 4.2 基础行为

每个目标桌面、每类真实事件，依次执行：

1. 冷启动，不提前打开通知窗口；切至其他应用，触发事件。预期按配置自动提醒，出现时不抢键盘焦点，无空白常驻窗。
2. 聚焦事件所属会话，再触发。预期无插件弹窗、无插件声音、无系统兜底。
3. 聚焦另一个会话、隐藏页面、最小化页面、关闭页面分别触发。预期不因“Web 在线”误判为已关注；无 Web 时至少经配置允许的系统兜底提醒。
4. 依次验证弹窗/音效四组合：开/开、开/关、关/开、关/关。预期仅对应通道动作，音效关闭时无系统漏音；总开关关闭后全部静默。
5. 对审批/提问/计划/完成分别关闭通道、选择音效，重启及关掉 Web 后重复。预期配置持久且宿主一致。
6. 多标签、多窗口、两个 DSH 实例触发不同请求。预期同一事件不重复，不同请求不因冷却误吞，跨实例不串会话。
7. 关闭一轮提醒后触发下一轮。预期仍自动提醒，无需再次点“打开弹窗”。

### 4.3 交互与返回

- 审批：用户点击允许一次/拒绝后真实 DSH 恢复；关闭弹窗不等于提交。
- 提问：单选、多选、自定义、多题、按规则允许的跳过、中文输入法 Enter、计时题逐项验证；处理过程中不自动关闭或抢输入。
- 计划审核：正确展示、批准/拒绝；缺失批准选项不提交猜测答案。
- 在原会话先处理，再点击旧卡；或两界面同时作答。预期过期失效、避免重复提交；断线失败有提示，重连不自动提交。
- 点击回会话：分别验证页面已开/已关，准确定位对应实例与会话。只打开首页不通过。CLI 激活若不支持需如实标出。
- Web 断开后独立交互是单独能力；未打通正式应答接口前必须降级为提醒，不能展示无效的可提交按钮。

### 4.4 平台、故障与后续场景

- 浅/深主题、语言、缩放、多显示器；窗口不离屏，卡片符合 DSH token，必要信息无截断导致无法判断。
- 关闭/杀掉桌面组件、断开通信、HTTP 失败、浏览器冻结、系统通知服务缺失：有可理解的失败状态，按策略降级，不无限重试、不重复响铃。
- 系统禁止通知时，区分“API 已接受”和“实际可见”，不能承诺一定显示。
- P5 手动勿扰、游戏/全屏视频及恢复：自绘与系统兜底一致抑制；声音按独立规则；恢复后不轰炸过期通知。

## 5. 实现阶段自动检查

```sh
pnpm install
pnpm verify
```

构建会更新 `lib/client.js`，实现提交需同步产物。新增检查重点为事件级去重、共享设置、通道独立、投递失败恢复、失效请求与多客户端协调；桌面与真实应答仍需本节手工验收，不能只增加 mock 后宣称完成。

安装仍按项目 AGENTS.md 的 install_bundle 流程；执行安装/重启等动作应在后续实现与验证范围内，本轮未执行。

## 6. P0 本轮实现与验证

- 修复：Web 引擎投递 Windows 兜底时遵循静音设置，源码 `src/engine/engine.js` 与 `lib/client.js` 同步。无 Web 宿主设置共享尚未实现。
- 复现：真实引擎在 sound.enabled=false 时原先传 silent=false，修复后回归断言 silent=true；审批、完成各覆盖全局静音、事件静音、none、零音量、Web 成功/失败，共 12 项。
- `pnpm verify`：构建、语法、58 项测试、渲染冒烟通过；仍有原有 localStorage ExperimentalWarning。
- PowerShell 仅查询版本成功，未弹真实窗口；用户的故障页面和 Linux 桌面端到端未验证。
- 桌面上游固定提交源码核查完成，详见 research 第 6 节；不是兼容性验收。

用户验证此修复：加载新的 client bundle（安装包指向本仓库时刷新页面），关闭音效并保持通知窗口关闭；切到其他应用，触发真实审批或完成。预期现有 Windows 兜底仍可显示，但不请求系统提示音。前提是该机器原来的 Windows 兜底能正常投递；如果仍不显示，按第 3 节检查投递链路，不能认为静音补丁修好了弹窗。测试 Windows 按钮是演示路径，不能替代此验收。

## 7. P1：Arch WSL → Windows 原型

### 本轮实际证据

- Windows Electron 45.2.3 已下载、通过包内校验并复制到当前 Windows 用户 LocalAppData/DSHNotifyInteractive/companion；二进制与本机 `.runtime.json` 不入 Git。不涉及开机自启或系统级安装。
- `pnpm companion:smoke`：真实 Windows 进程验证显示/不抢焦点 → 隐藏且音频开始播放 → 再次显示；进程中断后重新启动成功。构建后的 Host 路由通过（mock webServer、真实桌面进程），返回 HTTP 200、shown=true、delivery=rendered。
- 新增 6 项测试覆盖确认、超时不确定性、进程复用/重启、旧进程迟到退出、停用、协议输入校验；`pnpm verify` 总计 64 项通过。
- `npm pack --dry-run --json` 确认包中没有 node_modules、electron.exe 或本机 `.runtime.json`；测试完成后 Windows 中匹配本项目路径的 Electron 进程数为 0。
- 本机 web profile 依赖实际为 `link:/home/wqwt/code/dsh-notify-interactive`。检查时 `127.0.0.1:3080` 已有 DSH Web，GET 插件投递路由返回 405（仅 POST）；现有进程未启用 DSH_NOTIFY_COMPANION。
- 曾尝试启动带开关实例，因 3080 占用而退出；没有停止或重启现有服务。独立 Playwright 页面访问站点返回 401，未获取登录凭据、未绕过认证。因此真实 DSH 页面/会话未完成自动验证。测试浏览器已关闭。

### 在当前仓库验收

安装器需要 Node.js >=22.12；DSH 插件本身仍支持 Node.js 20。Windows 运行时约 357 MiB，WSL 下载副本另占相近空间。若本机已完成安装，只修改窗口文件后运行 staging 即可。

```sh
pnpm companion:install
# 窗口文件变更后的同步（无需重装运行时依赖）
node scripts/stage-companion.mjs
# 会短暂显示演示窗口并播放一次音效；结束自动清理测试进程
pnpm companion:smoke
```

默认从 GitHub 下载；本轮 GitHub 返回 504，使用以下可选镜像成功，仍保留固定版本包内校验和检查：

```sh
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ pnpm companion:install
```

真实 Web 验收需要在当前任务安全结束后重启 DSH，以加载新的宿主代码（安装后自动启用，无需开关）。本轮没有代替用户中断运行中的服务。停止旧进程后，在 Arch WSL 启动：

```sh
dsh --profile web --no-open
```

1. 在自己已认证的 Windows 浏览器打开 DSH，刷新页面；保持旧 Web 交互弹窗关闭（否则引擎仍会投递给旧窗口）。
2. 设置 → 互动提醒 → 桌面完成提醒：先确认显示“已就绪”，再点“测试桌面完成提醒”：应自动出现 Windows 自绘完成窗，不需先点打开弹窗。此按钮是显式演示，不能证明真实事件静默规则。
3. 选择一个真实会话执行正常任务，切到别的应用等待该轮结束。预期自绘窗自动出现、不抢焦点；点击会话入口后页面通过插件查询参数选择同一会话。真实定位尚待此项确认。
4. 关闭窗口后再次触发完成，预期仍自动出现。关闭音效后重复，预期不请求播放声音；聚焦当前会话完成时完全静默。
5. 审批/提问目前继续使用旧路径；弹窗总开关/分事件设置、统一宿主配置、完整交互、多标签协调尚未实现，不作为此原型已通过项。

`delivery=rendered` 表示 renderer 已创建内容并由主进程请求显示，不证明锁屏/全屏环境下用户看到。超时返回 uncertain，不再盲目弹第二个旧窗。明确不可用/失败才回退旧 WinForms，宿主会打印不含会话正文的原因。

回退：设置 DSH_NOTIFY_COMPANION=0 并重启，恢复旧投递行为。没有添加开机自启；宿主退出会要求辅助程序退出，父进程失联后租约约 15 秒过期退出。Windows 缓存可能因文件锁暂留临时目录；原型尚无正式卸载器。

## 8. 重启未见变化的修复

用户反馈重启后没有变化。实查监听 3080 的新进程为 151883，其环境未带 DSH_NOTIFY_COMPANION=1；插件仍正确链接本仓库，Windows 运行时记录存在。旧代码需要显式开关、设置页又没有桌面状态，导致普通重启仍走旧路径且不可辨认。

修复后：检测到已安装运行时即默认启用完成提醒；0 保留明确回退，1 强制尝试。新增只读 desktop-status 路由，不返回本地路径；设置页显示安装/启用状态，并有独立“测试桌面完成提醒”按钮和等待、已渲染、不确定、旧路径回退、失败反馈，不依赖旧 Web 弹窗是否已打开。

`pnpm verify`：66 项测试、构建、语法、渲染冒烟通过（Settings 5105B）。桌面 smoke 改为删除环境变量，在自动模式验证真实 Windows 窗口和构建后宿主路由。当前运行中的 DSH 没有被强制重启；加载本次宿主修复仍需重启一次，然后刷新已登录页面。审批/提问和真实会话返回的未验收边界不变。

## 9. 极简完成窗口 UI

用户确认已收到新版提醒，并要求删除上部无用区域、区分操作按钮及增加悬停反馈。窗口现为无系统边框/菜单，去掉重复正文标题；只保留消息、“关闭”和“打开会话”。打开为主题主色实心，关闭为次按钮，两者均有 hover/active/focus-visible，Esc 可关闭；正文长时滚动，高度跟随内容。

实际复核：

- Windows 原生截图首次发现 127 DIP 窗口底部多余空白，移除 thickFrame 后同一示例为 360×102 DIP（此机器缩放 2，截图 720×204 像素），未抢焦点。已亲自查看截图并去除留白，不仅检查渲染成功状态。
- 临时截图 `/tmp/dsh-notify-ui-native-final.png`，主按钮悬停预览 `/tmp/dsh-notify-ui-hover.png`；截图使用演示主题 token，真实 DSH 主题仍由 Web 快照提供。
- Playwright 独立本地页面注入有限桥接替身：正文无 h1/h2，只有关闭/打开两个按钮；验证悬停颜色、操作绑定、Esc。它不代表真实会话打开已验收。
- `pnpm verify` 66 项通过；Windows 桌面冒烟再次通过（显示不抢焦点、独立音频、进程恢复、宿主投递确认），已同步 Windows 文件并向 1 个活跃通知连接发送关闭指令，使下一次投递加载新版窗口；未重启 DSH。
- staging 在辅助程序运行时遇到 DLL 锁；脚本改为复用相同版本文件，新版本使用独立目录，界面文件正常同步，不再覆盖已加载的同版运行时。

验收：刷新 DSH 页面，设置 → 桌面完成提醒 → 测试；应仅见正文及两按钮，无标题栏和菜单。悬停主/次按钮分别变色，关闭按钮关闭当前提醒，下次测试可再出现；点击打开回会话继续按第 7 节验收。窗口文件已同步到 Windows，通知辅助程序会单独重新加载，不中断 DSH 会话。

## 10. 会话标题与视觉细化

用户要求保留当前信息量、补充会话标题并适度美化。Web 将事件所属会话标题传给宿主，再传到辅助程序；不使用通用“DSH 提醒”作为会话标题。新窗口标题单独显示，正文删除引擎生成的同一标题前缀，避免重复；缺失标题时隐藏该行，长标题限制两行并提供原生 title 查看全文。

视觉仅改主题 token 的层次：轻微渐变、细边框、主次文字、按钮圆角与阴影/悬停；没有增加图标、徽标或说明区域。Windows 任务栏在截图时遮住底部操作，已加大底部安全间距。

实际检查：Windows 演示截图 `/tmp/dsh-notify-session-native-final.png`；Playwright 深/浅主题预览 `/tmp/dsh-notify-session-dark.png`、`/tmp/dsh-notify-session-light.png`、长标题 `/tmp/dsh-notify-session-long.png`。示例宽 360、高 137 DIP，主题切换和主按钮 hover 通过；长标题不撑破窗口。截图为本地合成演示数据，不代表真实会话标题已在运行中的旧宿主端到端验证。

本轮 `pnpm verify` 66 项及 Windows 桌面/宿主路由冒烟通过。

本轮新增标题字段经过宿主，加载完整更新需要重启 DSH Web 并刷新已认证页面。设置 → 桌面完成提醒 → 测试；当前选中真实会话时应看到它的标题。无选中会话不编造标题。真实完成事件后检查标题是否对应事件所属会话，正文不重复标题。

功能边界保持：新 Windows 窗口只接管完成提醒；审批、提问、计划审核仍用旧提醒路径，旧 Web 交互代码存在，新桌面应答尚未打通。下一步仍按 P1 验收、P2 投递/配置协调、P3 应答桥接推进。

## 11. P2 统一投递与 profile 设置

### 实际改动

新增 Host coordinator、profile preferences、delivery 策略与 Web preferences 同步模块；修改 Web 引擎以委派所有通道效果，新增四场景设置表格；同步构建产物。新只读提醒覆盖审批、提问/计划和完成，支持排队、撤回和音频单独播放。没有新增答案 API，不自动审批或作答。

宿主以 profileContext.dir/notify-interactive.settings.json 保存 schema v3 与 revision，首次从已认证 Web 的 localStorage v2 迁移；localStorage 原键保留作浏览器缓存。初次迁移以第一个成功保存的浏览器为准，其他页面读取 profile 权威配置；离线修改排队，界面显示未同步，不把未保存修改称为已保存。文件损坏不会以默认值覆盖；应先备份并人工检查该配置文件。

### 实际证据

- pnpm verify：87 项单测、构建、语法与 Settings/Popup 渲染通过。
- 新测试覆盖：跨标签事件认领、不合并相邻的不同 turn、独立 presence、过期焦点、审批决定、continued 提问、主动中止、两通道组合、启动中请求失效、旧路由去重、匿名/非 owner 拒绝、profile 重启持久化、并发 revision 冲突、断线恢复及 Web 委派不重复发声。
- pnpm coordination:smoke：真实 Windows Electron + 构建后的 Host（mock DSH 上下文/owner admission，临时内存配置）验证 sound-only、两者关闭、popup-only、duplicate、queue、host fallback 均通过；模拟审批/决定不调用任何真实 Pending.answer。
- 设置表格以合成配置渲染，在 760px 与 390px 宽度查看；4 个场景、9 个开关，无页面横向溢出。预览截图 /tmp/dsh-notify-p2-settings.png 与 /tmp/dsh-notify-p2-settings-mobile.png。非真实用户配置。
- 暂未在用户已认证的真实会话中验证新设置保存、跨标签配置同步、真实审批/提问生命周期和回到会话；没有为了测试中断当前 DSH 服务。Linux 原生桌面、TUI、DSH Desktop 仍非本轮验收范围。

### 加载与用户验收

1. 当前任务安全结束后，重启 DSH Web，刷新所有 Web 标签，保持手动“浏览器作答窗口”关闭。设置页应出现“弹窗与触发场景”，同步状态应变为“设置已保存到 DSH profile”。无需新增启动变量。以下去重证据针对新桌面路径，尚未证明旧作答窗与桌面表面并存时的完整仲裁。
2. 按审批、提问、计划审核、结束分别设置弹窗/声音；试听默认音效后为各事件选择不同预设。用真实事件验证四组合：开/开、开/关、关/开、关/关。关闭弹窗不应阻止声音；关闭声音不应出现系统漏音。
3. 两个标签观察同一会话，切到其他应用后触发一次事件，应只有一个主要弹窗和一遍声音；两个不同 turn 连续结束仍应分别认领。任何前台标签正查看事件所属会话时均应静默。
4. 关闭一个标签不能抹去另一个的焦点；保留 Web 在线但不处理消息时，Host 在约 1.8 秒后检查并接管未投递事件。
5. 审批/提问只读窗口保持至关闭或请求失效；在 DSH 处理对应请求后，旧窗口/队列项应撤回。完成提醒沿用自动关闭。此阶段没有窗口内允许/拒绝或选择/输入，需回 DSH 处理。
6. 在页面 A 改设置，页面 B 最迟约 5 秒同步；并发改不同字段不应相互覆盖。重启 DSH、关闭页面后触发任务事件，Host 仍遵循保存的设置。断线时修改需等待重连，状态未显示已保存前不保证服务端已接收。
7. “测试桌面完成提醒”及审批/提问演示为显式测试路径，不是场景静默规则验收；生产行为以真实事件为准。浏览器作答窗口是保留的手动旧入口，不控制桌面提醒启用。

下一步 P3：为当前有效 Pending 对象建立所有者注册，桌面人工操作回传前再次校验实例、会话、请求和 answerable/channel 状态；批准/拒绝、单选/多选/自定义、完整批次、超时与过期并发分别验收。绝不以自动重试代替用户再次提交。

## 12. P3 桌面人工应答桥接

### 实际改动与边界

- 新增 `src/interaction/schema.js`（展示/答案协议）、`src/host/interactions.js`（唯一所有者及一次性交付命令）、`src/client/interactions.js`（保留本页 Pending 引用并调用现有 answer）。新增 `tests/interactions.test.mjs` 和 `scripts/interaction-smoke.mjs`。
- 修改宿主/客户端接线、辅助程序 IPC/数据校验/表单、状态说明与构建产物；同步既有需求/调查/README/CHANGELOG/AGENTS。无文件删除、无用户功能移除。旧浏览器作答窗口仍保留，验收时关闭它。
- 审批只有“允许一次/拒绝”；没有持久授权。提问显示完整批次、单选/多选、自定义、明确跳过，统一提交；计划审核显示正文和原始选项。默认没有选中答案，输入法 Enter 不提交。
- 桌面只回传用户动作，Host 验证实例/当前事件并认领命令，Web 在执行许可返回后再次核对同一 Pending 对象/key、session、内容和 answerable/channel。动作只交付一次，断线不自动重放；已授权执行但结果未确认会锁定该事件，要求回 DSH 核对。成功仅表示原生 Pending.answer 返回，并非独立的宿主持久化证明。
- Web 所有者需已认证且在线；TTL 8 秒，命令最长等待 10 秒。无 callId、同 callId 重复审批、审批 toolName/reason 不匹配，或跟踪容量不足时均保持只读。辅助程序缺失的系统兜底仍只提醒。Web 临时不可用保留当前表单草稿并禁用提交；恢复或 waterfall→rpc 不清空输入，辅助程序退出后不恢复草稿。
- 焦点/编辑/慢慢回答使用现有 holdFocus/releaseFocus/engage/takeTime，不拦截 waterfall、不发用户消息；焦点序号防止旧 focus 覆盖新 blur，运行中的 Web 在桌面焦点心跳丢失后释放该桥接所持 focus。关闭窗口只关闭提醒。

### 已完成验证

- `pnpm verify`：99 项单测、构建、语法及渲染冒烟通过。新增覆盖唯一所有者、审批元数据、完整批次校验、对象在网络等待中替换、宿主事件失效、重复 callId、实例/租约、冻结页面、丢失执行确认、原生方法失败、continued/rpc、计划选项、焦点顺序和计时方法；匿名请求无法调用新增路由。
- `pnpm interaction:smoke`：真实 Windows Electron renderer + 构建后 Host + 模拟已认证 Web/Pending 对象，实际点击允许一次/拒绝、单选/多选/自定义/跳过与计划审核；完整答案只提交一次，编辑不隐式作答，断线与 rpc 切换保留草稿。仅该独立测试进程临时开放 loopback DevTools，测试结束退出；正式路径无调试端口，没有操作真实用户请求。
- 已查看 Windows renderer 截图：`/tmp/dsh-notify-p3-approval.png`、`/tmp/dsh-notify-p3-question.png`、`/tmp/dsh-notify-p3-plan.png`。沿用主题 token；必要操作外无新增图标/徽标/说明区。实测固定 Windows 窗口变小时需短暂解除尺寸锁再恢复，已避免不同卡片切换后残留空白，并把窗口高度贴合内容加入冒烟检查。
- 未验证：已认证的真实 DSH 会话内最终审批落地/问题接收与原界面同步、真实中文输入法、多屏/缩放及精准回会话；Linux 原生桌面、TUI、DSH Desktop 未扩大。本轮没有重启运行中的 DSH 服务，没有读取登录凭据或绕过认证。

### 加载与真实用户验收

1. 当前任务安全结束后重启 DSH Web，刷新所有已认证标签；保留至少一个 Web 标签在线，关闭旧手动浏览器作答窗口。辅助程序已同步，不需重复下载运行时。
2. 用一个可安全允许/拒绝的真实请求分别验证审批：切到其他应用等待弹窗，检查会话/工具/理由，再显式点击允许一次或拒绝；DSH 对应请求应同步结束。点击关闭不能拒绝请求。若只显示关闭/回会话，先核对 callId 关联及只读边界，不视为已经完成交互验收。
3. 触发包含多题、单选、多选、自定义输入的真实提问；每题填写或明确跳过，最后提交。确认 DSH 收到完整批次且只收到一次；中文输入法候选确认和 textarea Enter 仅编辑文本。计划审核核对全文及原始选项后提交，不能把“关闭”当成拒绝计划。
4. 正在填答时暂时断开 Web，等所有者过期后应禁用提交并保留文字；恢复同一请求后可以继续。若提交后结果未知，不再次自动提交，回 DSH 核对。另一标签提前处理请求后旧窗口应撤回，旧按钮不能再答新请求。
5. 在弹窗中聚焦、编辑和点击慢慢回答，核对 DSH 原生倒计时行为；失焦/关闭不能取消请求。在两个标签同时在线时仍只执行一个原生答案。最后验收“打开会话”准确返回所属会话；此项不能用只打开站点首页替代。
6. 设置页的审批/提问演示仍用于旧浏览器交互卡/桌面只读提醒，不证明上述真实请求链路；可复现独立链路使用 `pnpm interaction:smoke`。同时按第 11 节回归静默、独立通道和配置同步。

下一项仍是 requirements 第 5 节的 P3 真实端到端验收，满足审批/完整提问/计划、过期并发、输入法与精准回会话条件后，再进入 P4/P5；不把模拟 Pending 通过写成用户已验收。

## 13. P3 原生 DSH 独立实例验收与接口修复

### 本轮改动

新增 `scripts/native-acceptance.mjs` 和 `scripts/fixtures/native-adapter.mjs`，可复用本轮的隔离验收方式。修改 shared schema、host coordinator/broker、对应回归与构建产物；计划冒烟改用原生形状的 intent.callId。桌面交互更新增加版本及早到状态缓存，修复文件邮箱乱序导致断线后旧状态覆盖新状态的问题。同步现有文档；无文件删除、无用户功能移除。

修复三个原生契约差异：legacy 阻塞提问无 Pending.callId，改按完整题目批次唯一匹配；计划按唯一问题的 intent.callId；原生 tool/result 用 message.toolCallId 和文本块数组，避免 continued 问题过早失效及结束后不撤回。审批无 callId 仍只读，重复的完全相同未命名批次也只读，禁止凭猜测关联。

### 实际证据

- `pnpm verify`：104 项测试、构建、语法与渲染通过；新增无 ID 完整批次匹配/重复拒绝、第二题不匹配拒绝、原生计划 intent 关联、真实 tool/result 形状及交互状态乱序回归。
- 全新临时 DSH home/profile/登录凭据，真实安装包 0.2.2-rc.1、真实宿主路由、真实远端事件、真实 Web 前端及 Pending，真实 Windows renderer 按钮；仅外部 LLM 由本地确定性适配器替换。没有修改用户 profile、读取现有凭据、发外部模型请求、注册新模型工具、监听新的 waterfall 或直接 append session 事件。测试消息通过隔离会话的原生入口提交，日志由 DSH 原生流程产生。
- 审批：本地适配器在真实 open turn 中请求无命令副作用的原生审批；桌面点击允许一次，原生 approval/decided 记录 allowed-once，等待结束、任务完成。原 Web 拒绝路径也观察到 rejected。
- 阻塞式提问：真实 ask_user_question 产生三题、Pending.callId 缺失；桌面选择单选、多选、中文自定义和明确跳过，原生工具结果与完整预期批次完全一致，未截断题目。
- 计划：真实 `/plan on` + exit_plan_mode 生成原生 plan-review，Pending.callId 缺失、intent.callId 存在；桌面批准，工具结果报告 Plan approved，原生 plan/mode.active=false。
- continued：独立 profile 使用一秒 timed 模式，原生 snapshot 变为 state=continued/channel=rpc；桌面提交后原生日志仅有一条 user-question-reply，未重复作答。再次生成新请求，从原 Web Pending 显式回答，旧桌面问题撤回并显示排队的完成提醒。
- 返回：已认证的真实 Web 前端访问带目标参数的 URL，mainView 确认等于事件所属会话；参数清理后仍保持该会话。此项证明 URL 消费与会话定位，不等同 Windows 默认浏览器的认证交接已验收。
- 可复用脚本的 --timed 启动已验证，临时 profile 与本地适配器加载成功，Ctrl+C/终止后清理。自动按钮 actor 仅连接独立测试辅助程序的 loopback DevTools；生产辅助程序不增加调试端口。
- 末轮 `pnpm interaction:smoke` 曾在断线草稿检查失败，定位为无序 readdir 使旧 live 更新覆盖 null；增加 interactionRevision，并在主进程缓存早到状态、按版本应用到 deliver/当前/队列。修复后 Windows 交互冒烟全部通过，包含断线恢复及计划 intent 关联；等待条件改用实际 15 秒截止时间，避免高成本 CDP 轮询拉长到数分钟。

### 复现原生验收

```sh
pnpm native:acceptance --host <本机可达的地址>
# 另一轮测试 continued/rpc：
pnpm native:acceptance --host <本机可达的地址> --timed
```

1. 只打开脚本新打印的完整登录链接，添加它打印的临时 workspace。选择 Local notification acceptance (no network) 下的 approval/question/plan/completion 模型；这些是测试路由，不发外部请求，声音默认关闭。
2. approval 只请求 notification-test-only 批准，不执行命令或访问文件；question 调用原生内置工具。使用一个目标会话和另一个前台会话，核对目标的提醒及作答。可以通过目标会话的公开 SessionFace.prompt 发隔离测试消息；不能向日常会话投测试输入。
3. plan 路由在 `/plan on` 后调用原生 exit_plan_mode，检查计划正文、答案、模式退出。--timed 下等待一秒后再回答，确认走原生 continued/rpc。
4. 若需要自动检查独立 Windows renderer，可显式加 --desktop-debug-port <空闲端口>；该 loopback 调试口只属于这一测试组件。默认不开。Ctrl+C 仅结束测试实例并清理临时 home，勿把临时登录链接保存到项目。

### 用户 Web 拒绝连接的同期诊断

用户确认使用启动终端打印的带 :3080 完整链接。实查用户进程已监听 WSL 127.0.0.1:3080，WSL 匿名请求返回 401；Windows 对 127.0.0.1、localhost、::1 连接失败，直接 TCP 也超时。独立实例改监听当前 eth0 地址后，Windows 返回 401，证明直接 IP 可达（401 是没有登录 cookie，不是拒绝连接）。因此给出空闲时改用 `dsh web --host <WSL-IPv4> --port 3080 --no-open` 并打开新打印完整链接的替代方式。没有关闭 WSL、修改全局网络配置或中断用户新启动的 Web；用户日常实例恢复访问尚未收到确认。

### 剩余验收与接续

下一项按 requirements 第 5 节：日常实例中确认上述能力与 Windows 默认浏览器交接，实际中文输入法候选确认、桌面真实焦点/倒计时、多屏/缩放及旧浏览器作答窗并存策略仍未验收。自动合成 isComposing 事件不等于真实 IME。Linux 原生桌面、TUI、DSH Desktop 未扩大；暂不进入 P4/P5。
