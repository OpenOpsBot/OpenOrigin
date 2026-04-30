# SYSTEM-REFERENCE

## 今日变更
- 今日（2026-04-30）`openorigin` 仓库可确认的产品侧提交只有 1 个：`f19ccce chore(audit): nightly self optimize 文档不一致`。这次提交没有改前端结构，主要是夜间审计顺手修系统文档与自动化脚本的一致性。
- 本次提交落了 3 处实际变化：新增 `memory/2026-04-30.md` 夜间审计记录；将 `automation/scripts/backup-private-repo.sh` 里 2 处锁文件写入从 `print` 改成 `printf '%s\\n'`；同步刷新上一版 `docs/SYSTEM-REFERENCE.md` 对该问题的表述。
- `backup-private-repo` 今天继续稳定运行。`backup-private-repo.log` 显示 00:03、02:09、04:04、08:16、10:00、12:16、14:14、16:06、18:02、20:08、22:06 多轮都正常返回 `no changes, nothing to back up`，02:27 还跑过一次 `BACKUP_TEST_MODE=1` 的锁验证。
- 历史日志里仍保留 2026-04-29 10:03 的一次 `print: command not found` 旧报错，但今天代码层已经完成修补；接下来只需要继续观察后续真实 cron 运行，确认该报错不再复现。
- 定时任务运行状态今天并不完全平稳：`nightly-self-optimize` 当前已恢复为 `lastStatus: ok`，但 `daily-briefing` 今早最近一次运行重新 timeout，`lastStatus: error`、`consecutiveErrors: 1`，说明自动化链路仍有单点不稳定性。

## 当前架构概览
- `index.html`：单页应用入口，维持“顶部页签 + 中央主视图 + 底部 Dock”三段式布局；依赖 Lucide 图标 CDN，并按模块拆分加载 `ops / brain / laboratory` 的 CSS 与 JS。
- `js/app.js`：前端总控。负责模块切换、模块内页面切换，以及 `openorigin:nav-state` 本地持久化。当前页面集合为：
  - Ops：`org-chart / dashboard / tasks`
  - Brain：`dashboard / daily-briefing / automations / os-documentation / agents / schedules`
  - Laboratory：`dashboard / ideas`
- `js/tabs.js` + `js/dock.js`：轻导航层；前者管理顶部页签，后者管理底部模块切换。
- `server.js`：本地 `http://localhost:8000` 的静态服务与数据聚合层。当前核心职责包括：
  - 提供静态资源服务
  - 读取 `data/client-ops-sample.json` 暴露 `/api/client-ops`
  - 读取 `~/.openclaw/agents/main/sessions/sessions.json` 暴露 `/api/sessions`
  - 调 `openclaw health --json` 暴露 `/api/health`
  - 调 `openclaw cron list --json` 并做 60s cache，暴露 `/api/cron`
  - 读取 `~/.openclaw/openclaw.json` 解析模型与 agent，暴露 `/api/models`、`/api/agents`
  - 读取 `memory/*.md`，解析成 `/api/memory-briefings`
  - 聚合自动化定义、脚本预览、日志预览与 cron 状态，暴露 `/api/automations`
  - 读取 `docs/SYSTEM-REFERENCE.md` 并解析章节树，暴露 `/api/system-reference`
  - 读取单会话 JSONL 历史，暴露 `/api/session-history?key=...`
- `modules/ops`：运营工作台。包含组织架构图原型、运营面板和指挥台三页；页面会周期性拉取 agents、sessions、health、models、cron，并支持会话详情弹层与 Session History 查看。
- `modules/brain`：知识与自动化工作台。已接通真实数据的页面包括：
  - `daily-briefing`：从 `memory/` 读取历史简报并按“今日优先级 / 夜间活动 / 待处理事项 / 需要老板关注”四栏展示
  - `automations`：展示 4 个核心自动化任务的定义、cron 状态、脚本预览、日志预览和运行摘要
  - `os-documentation`：直接读取并结构化展示 `docs/SYSTEM-REFERENCE.md`
  其余 `agents`、`schedules` 页面仍是占位内容。
- `modules/laboratory`：实验区，当前仍以静态组织原型、规划调研表和创意库占位页为主，没有接真实后端数据。
- `automation/`：自动化资产目录。包含 4 个核心任务提示/脚本（`backup-private-repo.sh`、`daily-briefing.md`、`nightly-self-optimize.md`、`system-reference-rollup.md`）、安装脚本 `install-crons.sh`、运行说明 `automation/docs/CRON-AUTOMATION.md`，以及日志目录 `automation/logs/`。
- `package.json` + `package-lock.json`：运行入口仍然很薄，目前只有 `npm start` 启本地 Node 服务；测试脚本依旧是占位失败命令。

## 模块清单
- Ops / 团队
  - 组织架构图原型（`org-chart`）
  - 主智能体列与下属智能体占位
  - 组织规划说明卡
- Ops / 运营面板
  - 代理概览
  - 任务流程泳道
  - 交付追踪表
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
  - 大脑能力概览占位
  - 多模型视角占位
- Brain / 每日简报
  - 历史简报列表
  - 结构化四栏展示
  - 原始 Markdown 预览
- Brain / 自动化
  - 自动化任务列表
  - 核心任务统计卡
  - 计划 / 最近执行 / 下次执行元数据
  - 脚本预览
  - 日志预览
- Brain / 系统文档
  - `SYSTEM-REFERENCE` 目录侧栏
  - 自动化摘要卡
  - 风险提示卡
  - 原始 Markdown 预览
- Brain / 智能体（占位）
- Brain / 定时任务（占位）
- Laboratory / 仪表盘
  - AI 代理机构组织架构占位图
  - 组织规划调研表
  - 第二阶段 / 第三阶段备注
- Laboratory / 创意库
  - 创意收集占位
  - 实验跟踪占位
- Local API Layer
  - `/api/health`
  - `/api/sessions`
  - `/api/cron`
  - `/api/agents`
  - `/api/models`
  - `/api/client-ops`
  - `/api/memory-briefings`
  - `/api/automations`
  - `/api/system-reference`
  - `/api/session-history?key=...`

## 活跃定时任务
- 当前共有 4 个核心 cron 任务，`openclaw cron list --json` 显示它们都处于 enabled 状态：
  - `backup-private-repo`：`0 */2 * * *`（Asia/Shanghai，带 `staggerMs: 300000`）
  - `nightly-self-optimize`：`15 2 * * *`
  - `daily-briefing`：`30 8 * * *`
  - `system-reference-rollup`：`20 23 * * *`
- `backup-private-repo`：当前状态健康。最近一次运行成功，今天连续多轮都正常输出 `no changes, nothing to back up`；锁目录长期卡死的问题已不再复现，兼容性补丁也已落地。
- `nightly-self-optimize`：当前已恢复正常。最近一次运行 `lastStatus: ok`、`consecutiveErrors: 0`，今天 02:27 对备份脚本与系统文档做了低风险修补。
- `daily-briefing`：当前是 4 个任务里最明确的异常点。最近一次运行 `lastStatus: error`、`lastErrorReason: timeout`、`consecutiveErrors: 1`，说明“每日简报”链路并没有持续稳定。
- `system-reference-rollup`：上一轮 `lastStatus: ok`、`lastDeliveryStatus: delivered`；本轮 23:20 任务正在运行中，说明文档收口链路至少仍在持续触发。

## 已知问题
- `daily-briefing` 今早最近一次执行重新 timeout，当前 `consecutiveErrors: 1`；这是现在最直接的自动化稳定性风险。
- `backup-private-repo.sh` 的 `print` 兼容性问题代码上已经修掉，但日志里还保留旧错误；需要继续观察下一批真实 cron 运行，确认问题只存在于历史记录里。
- Brain 模块里的 `agents`、`schedules` 仍是占位页，知识 / 自动化工作台还没有完全闭环。
- Brain 仪表盘本身仍以静态演示卡片为主，多模型视角还没有接真实运行数据。
- Laboratory 模块仍是静态规划区，没有接后端数据，也没有形成真实实验流转能力。
- `package.json` 里的 `test` 仍是占位失败命令；虽然已经安装 `playwright`，但项目还没有正式测试入口。
- 自动备份提交日志里仍会出现 Git committer identity 的默认提示，虽然不阻塞提交和 push，但说明这台机器的 git 用户配置仍未整理干净。
