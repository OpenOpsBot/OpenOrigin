# SYSTEM-REFERENCE

## 今日变更
- 今日（2026-04-28）共有 5 个 git 提交，核心是把 OpenOrigin 从“简报查看器”继续推到“系统操作台 + 系统知识库”：`3142ba7`、`5d62d7f`、`a7f77f6`、`09a44a6`、`2b40bfb`。
- 最大的一次落地是 `3142ba7`：前端导航扩成 `ops / brain / laboratory` 三模块多页面结构；Brain 新增 `daily-briefing / automations / os-documentation` 真实数据页；`server.js` 补上 memory、自动化、系统文档三类聚合接口；仓库开始引入 `playwright` 依赖与本地巡检脚本雏形。
- `2b40bfb` 继续补强 Ops：`modules/ops/ops.js` 与 `modules/ops/ops.css` 今天又做了一轮大更新，说明“指挥台”仍在快速迭代，重点放在布局、可视密度和任务面板体验上。
- `5d62d7f` 与 `a7f77f6` 把自动化文档链路往稳定方向推了一步：修正文档路径引用，同时重写 `automation/scripts/backup-private-repo.sh` 的锁处理逻辑，加入 `pid + started_at + TTL` 的陈旧锁清理机制。
- 运行状态也因此出现实质变化：`backup-private-repo` 今天 14:08 与 22:00 已成功提交并 push，旧的“长期 lock exists, skipping”阻塞不再是当前主问题；新的主问题转为多个 cron 任务持续超时。

## 当前架构概览
- `index.html`：单页应用入口，延续“顶部页签 + 中央模块视图 + 底部 Dock”结构。
- `js/app.js`：前端总控，管理 `ops / brain / laboratory` 三模块，以及模块级页面切换与导航状态持久化。当前页面集合为：
  - Ops：`org-chart / dashboard / tasks`
  - Brain：`dashboard / daily-briefing / automations / os-documentation / agents / schedules`
  - Laboratory：`dashboard / ideas`
- `js/tabs.js` + `js/dock.js`：轻导航层；前者渲染当前模块页签，后者负责模块切换。
- `server.js`：本地 8000 端口静态服务 + 数据聚合层。除常规状态接口外，当前还负责：
  - 读取 `memory/*.md` 并整理为 `/api/memory-briefings`
  - 读取自动化脚本 / 日志 / `openclaw cron list --json` 并整理为 `/api/automations`
  - 读取 `docs/SYSTEM-REFERENCE.md` 并整理为 `/api/system-reference`
- `modules/ops`：运营工作台。已覆盖团队页、运营面板、指挥台三块；指挥台持续承接模型、会话、定时任务和异常摘要。
- `modules/brain`：知识与自动化工作台。当前最成熟的是真实数据页：
  - `daily-briefing`：读取 `memory/` 历史简报
  - `automations`：读取自动化定义、cron 状态、脚本预览、日志摘要
  - `os-documentation`：直接把 `docs/SYSTEM-REFERENCE.md` 渲染为知识库式阅读页
- `modules/laboratory`：仍以静态内容为主，用于承接实验性想法与规划页面。
- `automation/`：自动化脚本与日志目录。当前核心脚本为 `automation/scripts/backup-private-repo.sh`、`automation/scripts/daily-briefing.md`、`automation/scripts/nightly-self-optimize.md`、`automation/scripts/system-reference-rollup.md`。
- `package.json` + `package-lock.json` + `tmp-openorigin-check.js`：本地验证层雏形。目前只有 `start` / 空壳 `test` script，Playwright 已安装但还没被正式串进稳定校验流程。

## 模块清单
- Ops / 团队
  - 组织结构页（`org-chart`）
- Ops / 运营面板
  - 代理概览
  - 任务流程
  - 交付追踪
  - 运营仪表盘
  - 渠道状态
- Ops / 指挥台
  - 模型摘要卡
  - 活跃会话摘要卡
  - 定时任务摘要卡
  - 异常提醒摘要卡
  - 模型面板
  - 活跃会话面板
  - 定时任务面板
  - 会话详情弹层 / Session History
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
- Brain / 系统文档
  - `SYSTEM-REFERENCE` 章节目录
  - 自动化摘要侧栏
  - 风险提示卡
  - 原始 Markdown 预览
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
  - `/api/system-reference`

## 活跃定时任务
- 当前共有 4 个核心 cron 任务，且 `openclaw cron list --json` 显示它们都处于 enabled 状态：
  - `backup-private-repo`：`0 */2 * * *`（Asia/Shanghai，带 `staggerMs: 300000`）
  - `nightly-self-optimize`：`15 2 * * *`
  - `daily-briefing`：`30 8 * * *`
  - `system-reference-rollup`：`20 23 * * *`
- `backup-private-repo`：当前是 4 个任务里最健康的一个。cron 状态显示最近一次运行成功；日志尾部也显示 2026-04-28 14:08 与 22:00 均已成功提交并 push，其余触发在无改动时会正常输出 `no changes, nothing to back up`。
- `nightly-self-optimize`：已启用，但最近状态仍为 error；cron 记录显示已连续 9 次因 `timeout` 失败。
- `daily-briefing`：已启用，但最近状态同样为 error；cron 记录显示已连续 9 次因 `timeout` 失败。
- `system-reference-rollup`：已启用；本次文档更新执行时该任务正在运行，但在此之前 cron 记录里已连续 8 次 timeout，说明夜间文档收口链路仍不稳定。

## 已知问题
- 当前自动化主故障已从“备份锁死”切换为“多个隔离 agent cron 持续超时”：`nightly-self-optimize`、`daily-briefing`、`system-reference-rollup` 的最近状态都在报 `timeout`，这是现在最值得优先排查的系统级问题。
- `backup-private-repo` 的锁机制今天已改成带 TTL 的目录锁，现有日志看起来恢复正常；但旧问题刚被修复不久，还需要继续观察未来几轮执行，确认不会再次卡死。
- Brain 的三个真实数据页已经成型，但 `agents`、`schedules` 仍是占位页，Brain 模块还没完全闭环。
- Ops 指挥台在快速迭代，但当前仍偏“观察台”：缺少更细的运行事件流、任务处置动作和真正的写操作闭环。
- Playwright 依赖已经进仓，但 `package.json` 仍只有空壳 `test`，验证能力还没被产品化；前端改动暂时仍主要依赖人工查看与临时脚本。
- 自动备份提交日志里仍出现 Git committer identity 的默认提示，虽然不阻塞 push，但说明这台机器的 git 用户信息还没整理干净。