# SYSTEM-REFERENCE

## 今日变更
- 导航层完成页签化改造，`index.html` 新增顶部 Tab Bar，`js/app.js` 与 `js/tabs.js` 现在按模块维护页面列表，并把模块 / 页面状态持久化到 `localStorage(openorigin:nav-state)`。
- Ops 模块继续向监控式指挥台演进，当前已拆成 `仪表盘`、`指挥台`、`交付追踪` 3 个页面，并补上 Mission Summary、模型状态卡、活跃会话卡、定时任务卡和会话详情弹层。
- `modules/brain/brain.js` 扩展为多页面骨架，新增 `每日简报`、`智能体`、`定时任务` 占位页面，供后续接入自动化与多智能体管理。
- `server.js` 保持本地 8000 端口静态服务 + API 聚合架构，继续提供 `/api/health`、`/api/sessions`、`/api/cron`、`/api/client-ops`，并修复了静态资源在带 query string 请求下的解析。
- `automation/logs/backup-private-repo.log` 显示 2026-04-22 全天每 2 小时均触发一次备份尝试，但都因 lock 已存在而跳过，说明“计划已触发 / 结果未完成”这一故障在持续。
- 文档侧继续补强运营与组织规划说明，`docs/CLIENT-OPS-CENTER-PLAN.md`、`docs/ORG-PLANNING-WORKSHEET.md` 今日有更新；仓库里还出现了临时校验脚本 `tmp-openorigin-check.js`，用于 Playwright 页面检查。

## 当前架构概览
- `index.html`: OpenOrigin 单页入口，挂载顶部页签栏、主体内容区与底部 Dock，并按模块加载 `ops / brain / laboratory` 前端脚本。
- `js/app.js`: 应用总控，负责模块注册、页面路由、默认落点、模块切换，以及本地导航状态持久化。
- `js/tabs.js` + `js/dock.js`: 页签管理与底部模块切换层，前者按当前模块动态渲染子页面 Tab，后者负责模块级导航。
- `server.js`: 本地 8000 端口静态服务与轻量 API 聚合层，读取 OpenClaw sessions 文件、调用 `openclaw health --json` 与 `openclaw cron list --json`，并暴露客户运营本地 JSON 数据。
- `modules/ops`: 当前最活跃模块，包含客户工作台、任务流程泳道、交付追踪表、运营统计、坐席概览、Mission Control、会话详情弹层与 30 秒自动刷新逻辑。
- `modules/brain`: 大脑模块骨架，现有能力概览、多模型演示卡、每日简报页、智能体页、定时任务页，仍以占位和布局验证为主。
- `modules/laboratory`: AI 组织实验室，保留组织架构预览与组织规划内容，用于承接组织设计探索。
- `data/`: 本地样例数据目录，当前以 `client-ops-sample.json` 支撑 Ops 模块演示。
- `docs/`: 产品方案、组织规划、cron 自动化说明和系统参考文档。
- `automation/`: cron 设计文档、提示脚本、备份脚本、安装提示脚本与运行日志。

## 模块清单
- Ops / 客户运营指挥中心
- Ops / Mission Control（指挥台）
- Ops / Deliverables Tracker（交付追踪）
- Session Modal Viewer（会话详情弹层）
- Brain / Dashboard（大脑能力概览）
- Brain / Daily Briefing（占位页）
- Brain / Agents（占位页）
- Brain / Schedules（占位页）
- Laboratory / AI 组织实验室
- Local API Layer (`/api/health`, `/api/sessions`, `/api/cron`, `/api/client-ops`)

## 活跃定时任务
- 从 OpenClaw CLI 可观测面看，当前仍无法确认任何已激活 cron job，因为 `openclaw cron list --json` 依旧受 pairing 限制。
- 设计上已准备 4 个计划任务：`backup-private-repo`、`nightly-self-optimize`、`daily-briefing`、`system-reference-rollup`。
- 其中 `backup-private-repo` 的日志显示应按“两小时一次”节奏触发，但持续因 lock 存在而跳过，说明计划链路可能存在外部触发或残留锁文件问题，尚未闭环。
- `automation/scripts/install-crons.sh` 当前只提示先完成 `openclaw dashboard` pairing，再手动执行 `automation/docs/CRON-AUTOMATION.md` 中的安装命令。

## 已知问题
- `openclaw cron add/list/run/status` 当前在本机 CLI 下仍受 gateway pairing 限制，导致自动化方案无法完成正式激活与核验。
- `/api/cron` 依赖 `openclaw cron list --json`，在未配对状态下只能返回受限状态，Mission Control 中的定时任务卡片因此无法展示真实任务列表。
- `backup-private-repo` 日志连续多次出现 `lock exists, skipping`，说明备份机制存在残留锁或上次执行未正确释放的问题。
- Ops 模块当前仍依赖本地 JSON 样例数据，尚未实现任务 / 交付物写回、筛选器、负责人编辑以及客户级会话联动。
- 会话详情弹层当前展示真实元数据摘要，但尚未接入完整上下文时间线、消息预览或运行轨迹。
- Brain 模块仍以演示页和占位页为主，真实模型状态、每日简报数据源、智能体目录与定时任务管理都还没接上后端。
- 仓库内存在临时校验脚本 `tmp-openorigin-check.js`，若长期保留会增加根目录噪音，后续应决定纳入正式测试流程还是清理掉。
