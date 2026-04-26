# SYSTEM-REFERENCE

## 今日变更
- 今日（2026-04-26）git 提交 `70aa210`：`chore(audit): nightly self optimize documentation-inconsistencies`，仅对 `projects/openorigin/API.md` 做了一轮文档对齐，纠正 `/api/agents`、`/api/cron` 与 `server.js` 实现不一致的描述。
- 工作区仍有大量未提交改动：顶部导航收口的 `css/tabs.css`、`index.html`、`js/tabs.js` 变更仍待提交；Brain 的 `brain.css` 和 `brain.js` 也在未提交状态，说明这些改动在日常迭代中产生但尚未整理。
- `automation/logs/backup-private-repo.log` 今日 00:00–18:00 期间仍持续触发 9 次，全部因 `lock exists, skipping` 被跳过，备份链路故障从 4 月 21 日延续至今未恢复。
- 工作树出现大量未跟踪文件（包括 `AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、`TOOLS.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`memory/2026-04-*.md` 等），来自 workspace 根目录被扫描到 `projects/openorigin/` 目录内，以及 `node_modules/`、`package.json`、`package-lock.json` 等新增依赖文件，仓库整体仍处于一边开发一边整理的状态。

## 当前架构概览
- `index.html`：单页入口。顶部是当前模块的页面页签栏，中间是模块视图容器，底部 Dock 负责模块切换。
- `js/app.js`：前端总控。注册 `ops / brain / laboratory` 三个模块，声明模块级页面列表，负责模块/页面切换，并把导航状态持久化到 `localStorage(openorigin:nav-state)`。
- `js/tabs.js` + `js/dock.js`：轻导航层。`tabs.js` 只负责当前模块的页面页签渲染；`dock.js` 负责跨模块切换。
- `server.js`：本地 8000 端口静态服务 + 轻量 API 聚合层。当前提供 `/api/health`、`/api/sessions`、`/api/cron`、`/api/agents`、`/api/models`、`/api/session-history`、`/api/client-ops`，数据来源包括 `sessions.json`、`openclaw.json`、`IDENTITY.md` 和 OpenClaw CLI。
- `modules/ops`：当前最完整的运营工作台。`dashboard` 页展示代理概览、任务流程、交付追踪、运营统计、渠道状态；`tasks` 页是面向模型、会话、定时任务的监控指挥台，支持 30 秒自动刷新和会话详情弹层。
- `modules/brain`：半成型的大脑工作台。`dashboard` 仍是能力概览，`daily-briefing` 已能拉取模型、会话、定时任务和异常摘要，`agents / schedules` 仍是占位页。
- `modules/laboratory`：实验室模块，承接组织规划与创意类内容，仍以静态内容为主。
- `automation/`：cron 提示文件、安装脚本、备份脚本与日志目录；负责驱动 `daily-briefing`、`nightly-self-optimize`、`system-reference-rollup` 等自动化文档任务。
- `package.json` + `tmp-openorigin-check.js`：本地验证层，使用 Playwright 做最小页面打开与导航巡检。

## 模块清单
- Ops / 运营面板
  - 代理概览
  - 任务流程
  - 交付追踪
  - 运营仪表盘
  - 渠道状态
- Ops / 指挥台
  - 摘要卡（模型 / 活跃会话 / 定时任务 / 异常提醒）
  - 模型面板
  - 活跃会话面板
  - 定时任务面板
- Ops / 会话详情弹层
- Brain / 仪表盘
- Brain / 每日简报
  - 模型分栏
  - 活跃会话分栏
  - 定时任务分栏
  - 异常提醒分栏
- Brain / 智能体（占位）
- Brain / 定时任务（占位）
- Laboratory / 仪表盘
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
- 当前设计目标仍是 4 个核心 cron：`backup-private-repo`、`nightly-self-optimize`、`daily-briefing`、`system-reference-rollup`。
- `nightly-self-optimize` 今日已通过 `70aa210` 提交了 API 文档对齐，是今日唯一有实际产出的 cron 任务。
- `system-reference-rollup` 负责刷新本文件，并将摘要追加到当日 `memory/YYYY-MM-DD.md`。
- `daily-briefing` 负责生成日更简报；`backup-private-repo` 负责周期性备份工作区，但自 4 月 21 日起持续因锁文件阻塞而失败，今日（4 月 26 日 00:00–18:00）共触发 9 次全部跳过。
- 真实 cron 列表依然无法通过 `openclaw cron list --json` 做稳定核验，因为当前环境仍受 gateway pairing 限制，所以前端定时任务视图未必能反映真实运行状态。

## 已知问题
- `openclaw cron add/list/run/status` 仍受 gateway pairing 限制，导致 cron 无法完成正式安装后的可视化核验。
- `/api/cron` 强依赖 `openclaw cron list --json`，未配对时会返回 `exec_error` 或空结果，Ops/Brain 里的定时任务视图会失真。
- `backup-private-repo` 从 4 月 21 日起持续卡在 `lock exists, skipping`，到今日（4 月 26 日）仍未恢复，是当前最持续的自动化故障。
- Brain 的"每日简报"里会话数据走的是 `POST /rpc` 的 `sessions/list`，但 `server.js` 本身没有实现 `/rpc` 代理；如果运行环境没有额外网关转发，这个分栏会退化为空态。
- Ops 指挥台当前已是较完整的只读监控页，但还没有写回操作、筛选器、批量动作或异常处理闭环。
- 会话详情弹层目前只有基础信息，没有完整消息时间线、工具调用轨迹和运行事件。
- 工作树里仍有多处未提交改动（`css/tabs.css`、`index.html`、`js/tabs.js`、`modules/brain/brain.css`、`modules/brain/brain.js`），以及大量未跟踪文件（`node_modules/`、`package.json`、`package-lock.json`、workspace 根目录的 md 文件等），仓库整体还处于一边开发一边整理的状态。
