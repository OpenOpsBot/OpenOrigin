# SYSTEM-REFERENCE

## 今日变更
- 顶部导航今天完成收口，`index.html`、`js/tabs.js`、`css/tabs.css` 已删除旧的模块级 Tab 容器，顶部现在只渲染当前模块的页面页签，模块切换完全交给底部 Dock。
- `modules/ops/ops.js` 今天把原先偏 Mission Control 的 `指挥台` 改造成左侧导航、右侧详情的“每日简报”工作台，新增 `models / sessions / cron / alerts` 四个分栏，并通过 `briefingTab`、`initBriefingNav()`、`afterRefresh()` 在自动刷新后重建详情视图。
- `modules/ops/ops.css` 同步新增 Daily Briefing 的整套样式，包括侧边导航、详情卡片、异常空态、移动端折叠布局，说明 Ops 仍是当前最活跃的前端模块。
- `modules/brain/brain.js` 去掉了冗余的“大脑模块”标题，只保留 `仪表盘 / 每日简报 / 智能体 / 定时任务` 四页骨架，占位结构更贴近统一导航模型。
- 自动化提示文件今天有一次夜间优化提交，`automation/scripts/system-reference-rollup.md` 与 `automation/scripts/daily-briefing.md` 被收紧为“只扫描相关变更、输出一句结果”的文档型任务。
- `automation/logs/backup-private-repo.log` 继续追加到 4 月 24 日 22:01 的触发记录，但每次都因 `lock exists, skipping` 被跳过，备份链路故障已连续多日未恢复。

## 当前架构概览
- `index.html`: 单页入口。顶部是当前模块的页面页签栏，中间是模块视图容器，底部 Dock 负责模块切换。
- `js/app.js`: 前端总控。负责注册 `ops / brain / laboratory` 三个模块，声明各模块页面，处理模块与页面切换，并把导航状态持久化到 `localStorage(openorigin:nav-state)`。
- `js/tabs.js` + `js/dock.js`: 轻导航层。`tabs.js` 现在只根据当前模块动态渲染页面页签，`dock.js` 承担跨模块导航。
- `server.js`: 本地 8000 端口静态服务 + 轻量 API 聚合层。静态托管前端文件，并暴露 `/api/health`、`/api/sessions`、`/api/cron`、`/api/agents`、`/api/models`、`/api/session-history`、`/api/client-ops` 等接口；数据来源包括 `sessions.json`、`openclaw.json`、`IDENTITY.md` 以及 OpenClaw CLI。
- `modules/ops`: 当前主工作台。首页展示代理概览、任务流程、交付追踪、运营统计、渠道状态；`指挥台` 页面则是每日简报式控制台，带会话详情弹层与 30 秒自动刷新。
- `modules/brain`: 大脑模块骨架。保留能力概览与四个页面占位，还未接入真实摘要、智能体目录或调度后端。
- `modules/laboratory`: 实验室模块。承接组织架构、规划调研与创意库等实验性内容。
- `automation/`: cron 提示文件、安装脚本、备份脚本与运行日志；当前已能驱动日报和系统文档滚动维护。
- `docs/`: 产品方案与系统文档目录，其中 `SYSTEM-REFERENCE.md` 作为每日滚动更新的系统参考页。

## 模块清单
- Ops / 运营面板
- Ops / 指挥台（每日简报式控制台）
  - 模型分栏
  - 活跃会话分栏
  - 定时任务分栏
  - 异常提醒分栏
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
- 设计目标仍是 4 个文档/运维型 cron：`backup-private-repo`、`nightly-self-optimize`、`daily-briefing`、`system-reference-rollup`。
- `daily-briefing` 与 `system-reference-rollup` 的提示文件今天已被收紧，当前偏向“有限扫描 + 写文档 + 一句结果”的隔离会话任务。
- `system-reference-rollup` 的职责是刷新本文件，并把更新摘要写入当日 `memory/YYYY-MM-DD.md`。
- `backup-private-repo` 仍按约两小时一次的节奏被触发，最新日志已到 4 月 24 日 22:01，但全部因现存 lock 被跳过。
- `nightly-self-optimize` 今天已有实际产出，并形成提交 `4060682 chore(audit): nightly self optimize low-efficiency-prompts`。
- 真实 cron 列表依然无法通过 `openclaw cron list --json` 稳定核验，因为本机 CLI 仍受 gateway pairing 限制；前端里的定时任务视图因此可能显示空态或错误态。

## 已知问题
- `openclaw cron add/list/run/status` 仍受 gateway pairing 限制，导致 cron 无法完成正式安装后的可视化核验。
- `/api/cron` 强依赖 `openclaw cron list --json`，未配对时只能返回错误或空结果，Ops 指挥台里的定时任务分栏会失真。
- `backup-private-repo` 长时间卡在 `lock exists, skipping`，目前是最持续、最明确的自动化故障。
- Ops 的每日简报工作台虽然更适合查看模型、会话、定时任务和异常，但仍是只读监控界面，没有写回、筛选或批量操作能力。
- 会话详情弹层已经能看最近消息，但仍缺完整时间线、工具调用轨迹、运行事件和更深层诊断。
- Brain 模块仍基本停留在占位阶段，真实的每日简报、智能体目录和调度管理尚未接入后端。
- 工作树里 `index.html`、`js/tabs.js`、`css/tabs.css`、`modules/brain/brain.js`、`modules/ops/ops.js`、`modules/ops/ops.css` 仍处于未提交状态，说明导航收口与 Ops 新工作台还没有完成一次正式落盘。