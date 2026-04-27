# SYSTEM-REFERENCE

## 今日变更
- 今日（2026-04-27）已有 3 个 git 提交，全部围绕 Brain 的“每日简报”页面布局收尾：`3751bd7`、`cd6cd66`、`1be600a`，重点是重做简报页结构并修正移动端与全宽布局。
- 工作树里还有一批当日未提交改动，已从“只展示简报”继续推进到“系统信息可视化”：`js/app.js` 为 Brain 新增了 `automations` 页面页签；`modules/brain/brain.js` 新增自动化任务视图；`server.js` 新增 `/api/memory-briefings` 与 `/api/automations` 两个聚合接口。
- Ops 指挥台也在当天继续增强：`modules/ops/ops.js` 已补上会话详情弹层、Session History 拉取与更细的会话上下文推断，说明页面已经从摘要监控向可钻取排障发展。
- `package.json`、`package-lock.json`、`node_modules/` 与 `tmp-openorigin-check.js` 已出现在仓库目录，表明项目开始引入 Playwright 做本地页面巡检，但这部分目前仍是未跟踪状态。
- `automation/logs/backup-private-repo.log` 今日仍持续报 `lock exists, skipping`；最新可见记录到 2026-04-27 22:04，备份任务卡锁的问题还没解除。

## 当前架构概览
- `index.html`：单页应用入口。页面结构仍是“顶部页签 + 中央模块视图 + 底部 Dock”的三层导航。
- `js/app.js`：前端总控，管理 `ops / brain / laboratory` 三个模块，以及模块内页面切换与导航状态持久化。当前 Brain 已有 `dashboard / daily-briefing / automations / agents / schedules` 五个页面。
- `js/tabs.js` + `js/dock.js`：轻导航层。`tabs.js` 负责当前模块的页面页签渲染，`dock.js` 负责跨模块切换。
- `server.js`：本地 8000 端口静态服务 + 数据聚合层。除既有 `/api/health`、`/api/sessions`、`/api/cron`、`/api/agents`、`/api/models`、`/api/session-history`、`/api/client-ops` 外，现在还提供 `/api/memory-briefings` 与 `/api/automations`，把 memory 文件和 automation 脚本/日志整理成前端可消费的数据。
- `modules/ops`：运营工作台。`dashboard` 页负责代理概览、流程、交付追踪、运营统计和渠道状态；`tasks` 页是模型 / 会话 / 定时任务指挥台，并支持会话详情弹层与 Session History 查看。
- `modules/brain`：大脑工作台。`daily-briefing` 已从静态说明页升级为读取 `memory/*.md` 的历史简报浏览器；`automations` 新增自动化任务总览，可展示任务计划、脚本预览、日志预览和阻塞状态；`agents / schedules` 仍是占位页。
- `modules/laboratory`：实验室模块，仍以静态内容为主，用于承接创意与规划类页面。
- `automation/`：脚本、安装器和日志目录。当前可见的核心脚本包括 `backup-private-repo.sh`、`daily-briefing.md`、`nightly-self-optimize.md`、`system-reference-rollup.md` 与 `install-crons.sh`。
- `package.json` + `tmp-openorigin-check.js`：本地验证层雏形，依赖 Playwright，意图是对页面打开、页签切换等关键路径做最小自动化巡检。

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
  - 会话详情弹层
  - Session History 查看
- Brain / 仪表盘
- Brain / 每日简报
  - 历史简报列表
  - 结构化分栏（今日优先级 / 夜间活动 / 待处理事项 / 需要老板关注）
  - 原始 Markdown 预览
- Brain / 自动化
  - 自动化任务列表
  - 任务状态统计
  - 计划 / 最近执行 / 下次执行元数据
  - 脚本预览
  - 日志预览
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
  - `/api/memory-briefings`
  - `/api/automations`

## 活跃定时任务
- 当前系统仍围绕 4 个核心 cron 设计：`backup-private-repo`、`nightly-self-optimize`、`daily-briefing`、`system-reference-rollup`。
- 从 `server.js` 内置的自动化定义看，计划时间分别是：
  - `backup-private-repo`：每 2 小时
  - `nightly-self-optimize`：每天 02:15
  - `daily-briefing`：每天 08:30
  - `system-reference-rollup`：每天 23:20
- Brain 新增的“自动化”页面会优先展示上述 4 个核心任务，并尝试结合脚本文件、日志文件和 `openclaw cron list --json` 返回值做状态汇总。
- `backup-private-repo` 依然是当前最明显的异常任务：4 月 27 日多次触发仍然全部因 `lock exists, skipping` 被跳过。
- `system-reference-rollup` 的职责保持不变：每日收口系统文档，并把摘要写入 `memory/YYYY-MM-DD.md`。

## 已知问题
- `openclaw cron list --json` 仍可能受 gateway pairing 限制影响；一旦取不到数据，`/api/cron` 和 `/api/automations` 只能回退到“脚本存在 + 日志摘要”的弱感知模式。
- `backup-private-repo` 长时间被锁文件阻塞，今天仍未恢复，是当前自动化链路里最持续的故障。
- Brain 的 `automations` 与 `daily-briefing` 页面已经可以展示较多真实数据，但 `agents`、`schedules` 仍是占位页，Brain 模块整体还没闭环。
- Ops 的会话详情页已经能看 Session History，但目前仍偏只读：没有消息时间线筛选、工具调用轨迹、运行事件流或处置动作。
- Playwright 校验脚本和依赖已经进入仓库目录，但还未纳入稳定的 npm script / CI 流程，而且目前是未跟踪文件，验证链路尚未正式落地。
- 工作树仍有较多未提交改动（`index.html`、`tabs.css`、`tabs.js`、`modules/brain/*`、`modules/ops/*`、`server.js` 等），系统参考文档反映的是“当前工作树状态”，不等同于一个已整理完成的发布版本。
