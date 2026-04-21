# SYSTEM-REFERENCE

## 今日变更
- Ops 模块已升级为客户运营指挥中心，新增客户工作台、任务流程泳道、可交付成果追踪、运营统计和坐席概览 5 个区域，并接入本地 `data/client-ops-sample.json` 数据源。
- `server.js` 新增 `/api/client-ops`，同时继续提供 `/api/health`、`/api/sessions`、`/api/cron` 三类本地 API，其中 cron 查询仍会因 gateway pairing 缺失而返回受限状态。
- Laboratory 模块补上 AI 代理机构组织架构预览、组织规划调研表和阶段备注，配套新增 `ORG-PLACEHOLDER.md` 与 `ORG-PLANNING-WORKSHEET.md`。
- 自动化目录新增 `CRON-AUTOMATION.md`、4 个隔离会话提示文件和备份脚本，形成私有仓库备份、夜间自我优化、每日简报、系统文档滚动更新的完整方案。
- `automation/logs/backup-private-repo.log` 记录到一次 22:01 的备份尝试，但因 lock 已存在而跳过。

## 当前架构概览
- `index.html`: OpenOrigin 单页入口，负责挂载 Dock、Tab 与各业务模块视图。
- `server.js`: 本地 8000 端口静态服务与轻量 API 聚合层，读取 OpenClaw sessions 文件、调用 `openclaw health --json` 与 `openclaw cron list --json`，并暴露客户运营本地 JSON 数据。
- `css/`: 全局主题、窗口布局、Dock、Tab 和通用面板样式。
- `modules/ops`: 客户运营指挥中心，包含客户头部、任务泳道、可交付成果表、运营统计、坐席概览，以及会话详情弹层框架。
- `modules/brain`: 大脑模块与多模型展示骨架，当前仍以演示布局为主。
- `modules/laboratory`: AI 组织实验室，现阶段提供组织架构预览和规划占位内容。
- `data/`: 本地样例数据目录，当前以 `client-ops-sample.json` 支撑 Ops 模块演示。
- `docs/`: 产品方案、组织规划和系统参考文档。
- `automation/`: cron 设计文档、提示脚本、备份脚本与运行日志。

## 模块清单
- Ops Dashboard / 客户运营指挥中心
- Brain Dashboard / 多模型展示区
- Laboratory Dashboard / AI 组织实验室
- Mission Control
- Session Modal Viewer
- Local API Layer (`/api/health`, `/api/sessions`, `/api/cron`, `/api/client-ops`)

## 活跃定时任务
- 当前无已激活 cron 任务。
- 已准备的计划任务共有 4 个：`backup-private-repo`、`nightly-self-optimize`、`daily-briefing`、`system-reference-rollup`。
- 激活前置条件仍是完成 OpenClaw dashboard pairing；`automation/scripts/install-crons.sh` 当前只做提示，不执行安装。

## 已知问题
- `openclaw cron add/list/run/status` 当前在本机 CLI 下仍受 gateway pairing 限制，导致自动化方案只能停留在文档和脚本层。
- `/api/cron` 依赖 `openclaw cron list --json`，在未配对状态下无法返回真实任务列表。
- Ops 模块当前使用本地 JSON 样例数据，尚未实现任务/交付物写回、筛选器和客户级会话联动。
- 会话详情弹层当前展示真实元数据摘要，但完整上下文时间线尚未接入。
- Brain 模块中的 Codex 5.4 仍是演示离线卡片，未接入真实模型状态。