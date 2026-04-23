# SYSTEM-REFERENCE

## 今日变更
- Ops 模块今天继续围绕真实 OpenClaw 运行态做增强，`server.js` 已稳定提供 `/api/agents`、`/api/models`、`/api/session-history`，并让 `代理概览`、`模型`、`活跃会话`、`定时任务`、`会话详情弹层` 读取本机真实数据而不是纯演示卡片。
- `modules/ops/ops.js` 近期连续迭代，当前把原先偏 Mission Control 的布局收敛成两页结构：`运营面板` + `指挥台`。其中指挥台已改成左侧导航、右侧详情的“每日简报”式界面，支持模型、活跃会话、定时任务、异常提醒四个分栏。
- `modules/ops/ops.css` 今天仍在演进，新增了 Daily Briefing 壳层、简报卡片、异常态、会话详情弹层强化样式，说明 Ops 现在是项目最活跃的前端模块。
- 顶部导航今天继续收口，`index.html`、`js/tabs.js`、`css/tabs.css` 已把旧的“模块 Tab + 页面 Tab”双层结构简化为只渲染当前模块页面页签；底部 Dock 继续承担模块切换。
- `modules/brain/brain.js` 做了轻量清理，去掉冗余标题，保留 `仪表盘 / 每日简报 / 智能体 / 定时任务` 四页占位结构，方便后续接真实后端。
- `automation/logs/backup-private-repo.log` 继续显示 4 月 23 日整天每两小时都有备份触发，但全部因为 `lock exists, skipping` 被跳过，备份链路故障仍未解除。

## 当前架构概览
- `index.html`: 单页入口。顶部为当前模块页面页签栏，底部为模块 Dock，中间挂载各模块视图。
- `js/app.js`: 前端总控。负责模块注册、页面定义、默认落点、模块切换、页面切换，以及 `localStorage(openorigin:nav-state)` 导航状态持久化。
- `js/tabs.js` + `js/dock.js`: 轻导航层。顶部 Tabs 只展示当前模块页面，底部 Dock 负责 `ops / brain / laboratory` 三大模块切换。
- `server.js`: 本地 8000 端口静态服务 + 轻量 API 聚合层。直接读取 `sessions.json`、`openclaw.json`、`IDENTITY.md`，并通过 CLI 聚合 `openclaw health --json` 与 `openclaw cron list --json`。
- `modules/ops`: 当前主工作台。包含代理概览、任务流程、交付追踪、运营统计、渠道状态、每日简报式指挥台、会话详情弹层、30 秒自动刷新。
- `modules/brain`: 大脑模块骨架。现阶段以能力概览和占位页为主，还没接入真实摘要、任务管理或多智能体编排数据。
- `modules/laboratory`: 组织实验室。保留 AI 代理组织结构、组织规划调研表和创意库页面，用于承接组织设计与实验想法。
- `data/`: 本地样例数据目录，目前仍主要由 `client-ops-sample.json` 支撑一部分演示内容。
- `docs/`: 产品方案、API 规范、cron 自动化设计、系统参考等文档。
- `automation/`: cron 提示文件、安装脚本、备份脚本与运行日志。

## 模块清单
- Ops / 运营面板
- Ops / 指挥台（每日简报式控制台）
- Ops / 会话详情弹层
- Brain / 仪表盘
- Brain / 每日简报（占位）
- Brain / 智能体（占位）
- Brain / 定时任务（占位）
- Laboratory / 仪表盘（组织架构与规划）
- Laboratory / 创意库
- Local API Layer
  - `/api/health`
  - `/api/sessions`
  - `/api/cron`
  - `/api/agents`
  - `/api/models`
  - `/api/session-history`
  - `/api/client-ops`

## 活跃定时任务
- 设计上仍维护 4 个目标 cron 任务：`backup-private-repo`、`nightly-self-optimize`、`daily-briefing`、`system-reference-rollup`。
- `system-reference-rollup` 现已按提示执行文档滚动更新，职责是刷新本文件并把摘要写入当日 memory。
- `backup-private-repo` 从日志看仍按两小时节奏被调起，4 月 23 日 `00:01` 到 `22:01` 均有触发记录，但全部被现存 lock 拦截。
- `nightly-self-optimize` 与 `daily-briefing` 相关产出今天已体现在 `memory/2026-04-23.md`，说明隔离会话型文档任务在运行层面可工作。
- 真实 cron 列表仍无法通过 `openclaw cron list --json` 稳定核验，因为本机 CLI 依旧受 gateway pairing 限制；OpenOrigin 前端里的定时任务卡片因此可能只能显示空态或受限结果。

## 已知问题
- `openclaw cron add/list/run/status` 仍受 gateway pairing 限制，导致 cron 无法完成正式安装后的可视化核验。
- `/api/cron` 强依赖 `openclaw cron list --json`，未配对时只能返回错误或空结果，前端无法拿到真实任务列表。
- `backup-private-repo` 长时间卡在 `lock exists, skipping`，是当前最明确、持续时间最长的自动化故障。
- Ops 模块虽然已经接入真实 agents / sessions / models / health 数据，但部分视图仍是只读监控台，没有写回能力，也没有筛选、编辑、批量操作等运营动作。
- 会话详情弹层已能读取最近消息，但仍只是轻量摘要，缺少完整时间线、工具调用轨迹、运行事件和更深入的诊断信息。
- Brain 模块仍基本停留在占位阶段，真实的每日简报、智能体目录、任务调度管理尚未接后端。
- 顶部 Tabs 今天仍在未提交整理中，`index.html`、`js/tabs.js`、`css/tabs.css`、`modules/brain/brain.js`、`modules/ops/ops.js`、`modules/ops/ops.css` 处于工作树修改状态，说明导航与 Ops 指挥台 UI 还在收口中。
