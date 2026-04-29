# SYSTEM-REFERENCE

## 今日变更
- 今日（2026-04-29）仓库内没有新的 OpenOrigin 产品代码提交；唯一可确认的 git 提交是 `e06ae77`，由自动备份任务在 10:01 生成，内容是新增 `memory/2026-04-29.md`，说明今天系统侧主要是“运行观察日”，不是“功能落地日”。
- 昨夜完成的 `docs(system): refresh daily system reference` 仍是最近一次系统文档收口提交；今天这次更新主要是在没有新前端结构变更的前提下，刷新运行状态、cron 健康度与已知风险。
- 运行层面出现了一个重要变化：`daily-briefing` 与 `system-reference-rollup` 当前都已恢复到 `lastStatus: ok`，昨天文档里提到的“3 个 cron 持续 timeout”已缩窄为 `nightly-self-optimize` 单点故障。
- `backup-private-repo` 今天继续稳定运行，多轮触发都正常输出 `no changes, nothing to back up`；22:00 轮次同样成功结束，说明 TTL 锁修复后的主流程暂时稳定。
- 备份脚本日志里今天 10:03 曾出现过一次 `/Users/ze/.openclaw/workspace/projects/openorigin/automation/scripts/backup-private-repo.sh: line 30: print: command not found`；本轮夜间审计已将锁文件写入从 `print` 改为更稳的 `printf`，后续只需观察下一轮实际运行是否彻底清零此类日志。

## 当前架构概览
- `index.html`：单页应用入口，延续“顶部页签 + 中央模块视图 + 底部 Dock”布局。
- `js/app.js`：前端总控，负责 `ops / brain / laboratory` 三模块切换、模块内页面切换，以及 `openorigin:nav-state` 本地持久化。当前页面集合为：
  - Ops：`org-chart / dashboard / tasks`
  - Brain：`dashboard / daily-briefing / automations / os-documentation / agents / schedules`
  - Laboratory：`dashboard / ideas`
- `js/tabs.js` + `js/dock.js`：轻导航层；前者渲染当前模块页签，后者负责底部模块切换。
- `server.js`：本地 8000 端口静态服务 + 数据聚合层。除基础状态接口外，还负责：
  - 读取 `memory/*.md` 并整理为 `/api/memory-briefings`
  - 读取自动化脚本、日志与 `openclaw cron list --json` 并整理为 `/api/automations`
  - 读取 `docs/SYSTEM-REFERENCE.md` 并整理为 `/api/system-reference`
- `modules/ops`：运营工作台，包含组织结构页、运营面板、指挥台三类页面；指挥台每 30 秒自动刷新模型、会话、cron 与异常摘要。
- `modules/brain`：知识与自动化工作台。已接通的真实数据页包括：
  - `daily-briefing`：读取 `memory/` 历史简报并按结构化分栏展示
  - `automations`：读取自动化定义、调度状态、脚本预览、日志摘要
  - `os-documentation`：直接渲染 `docs/SYSTEM-REFERENCE.md`
- `modules/laboratory`：实验区，当前仍以静态内容为主，用于承接创意与规划页面。
- `automation/`：自动化脚本与日志目录。当前核心脚本为 `backup-private-repo.sh`、`daily-briefing.md`、`nightly-self-optimize.md`、`system-reference-rollup.md`，另有 `install-crons.sh` 和 `automation/docs/CRON-AUTOMATION.md`。
- `package.json` + `package-lock.json` + `tmp-openorigin-check.js`：本地验证层仍较薄；依赖里只有 `playwright`，但 `npm test` 仍是占位失败脚本，尚未形成正式测试入口。

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
- `backup-private-repo`：当前状态健康。最近一次运行成功，今天大部分触发都正常输出 `no changes, nothing to back up`；备份锁不再表现出长期卡死。本轮已顺手修掉锁文件写入使用 `print` 的兼容性毛刺，等待下一次定时运行验证。
- `nightly-self-optimize`：当前 4 个任务里唯一持续异常的任务。最近状态仍为 error，已连续 10 次因 `timeout` 失败，是现在最明确的自动化主故障。
- `daily-briefing`：已恢复正常。当前 `lastStatus: ok`、`consecutiveErrors: 0`，最近一次运行已成功投递，不再延续昨天的 timeout 连败状态。
- `system-reference-rollup`：已恢复正常。上一轮 `lastStatus: ok`、`lastDeliveryStatus: delivered`，且本次 23:20 任务正在运行中，说明这条文档收口链路至少已恢复到可持续执行状态。

## 已知问题
- `nightly-self-optimize` 仍连续 10 次 timeout；相比昨天，系统级问题已经收缩，但这个夜间审计链路仍是当前最优先的稳定性风险。
- `backup-private-repo.sh` 的 TTL 锁机制总体已恢复正常；历史日志里出现过一次 `print: command not found`，本轮已改为 `printf`。剩余工作不是继续改代码，而是确认下一次实际 cron 运行后该错误不再复现。
- Brain 模块的 `agents`、`schedules` 仍是占位页，知识 / 自动化工作台还没有完全闭环。
- Ops 指挥台已经能汇总模型、会话、cron 与异常摘要，但仍偏“观察台”；缺少更细粒度的运行事件流、处置动作和写操作闭环。
- `package.json` 里的 `test` 仍是占位失败命令，Playwright 虽然已安装，但前端验证能力还没有被产品化。
- 自动备份提交日志里仍会出现 Git committer identity 的默认提示，虽然不阻塞 push，但说明这台机器的 git 用户信息还没整理干净。
