# SYSTEM-REFERENCE

## 今日变更
- `openorigin` 今日共 5 次 workspace snapshot 提交 + 1 次专项审计提交，涵盖 memory 文件归档、`OrgChart.tsx` 字体一致性修复及 ops.py 过期注释清理。
- **字体一致性修复（f8f5056）**：`OrgChart.tsx:84` Phase 01 标签 `fontSize: 11` → `fontSize: 12`，与同组件内其他 stat 标签及全局 `.secondary-text` 样式（12px）保持一致。
- **ops.py 过期注释清理（4dd649c）**：`backend/app/routers/ops.py` 删除占位注释 `# Placeholder – read from openclaw status`，端点逻辑已完整。
- **Cron 任务状态分化**：`system-reference-rollup`（本次）仍处于 running 超时状态；`backup-private-repo`（1h ago）、`nightly-self-optimize`（21h ago）、`daily-briefing`（15h ago）三者状态均已恢复 ok。

## 当前架构概览
- `frontend/`：Vite + React 18 + TypeScript 前端，路由/状态/Zustand + TanStack Query，Tailwind CSS + Lucide 图标。构建命令 `npm run build`。
- `frontend/dist/`：Vite 构建产物（`assets/` JS/CSS + `index.html`）。
- `frontend/index.html`：Vite dev server 入口（`http://localhost:5173`）。
- `backend/`：Python FastAPI 后端，路由模块 `brain / ops / lab`，依赖 `requirements.txt`。
- `server.js`（旧版静态服务）：仍保留于项目根目录，原提供 `/api/*` 聚合层。新 API 层由 `backend/app/main.py` 替代中。
- `automation/`：Cron 脚本目录，包含 `backup-private-repo.sh`、`daily-briefing.md`、`nightly-self-optimize.md`、`system-reference-rollup.md`、`install-crons.sh`、`docs/CRON-AUTOMATION.md`、`logs/`。
- `package.json`：根目录的旧版入口，`npm start` 指向 `server.js`；新版前端入口在 `frontend/package.json`。

## 模块清单
- Ops / 组织架构（`OrgChart.tsx`）
- Ops / 运营面板（`Dashboard.tsx`）
- Ops / 指挥台（`Tasks.tsx`）
- Brain / 仪表盘（`Dashboard.tsx`）
- Brain / 每日简报（`DailyBriefing.tsx`）
- Brain / 自动化（`Automations.tsx`）
- Brain / 系统文档（`SystemDocumentation.tsx`）
- Brain / 数据分析（`DataAnalysis.tsx`）
- Brain / 记忆查看器（`MemoryViewer.tsx`）
- Brain / 技能目录（`SkillsCatalog.tsx`）
- Laboratory / 仪表盘（`Dashboard.tsx`）
- Laboratory / 创意库（`Ideas.tsx`）
- Laboratory / 原型（`Prototypes.tsx`）
- Laboratory / 研究（`Research.tsx`）
- `brain/ops.py`（FastAPI 路由）：`/sessions`（读 openclaw sessions.json）、`/agents`、`/cron`（读 crontab）、`/health`、`/models`、`/ops-night-overview`。`brain/lab.py` 和 `brain/brain.py` 待确认实现状态。
- Legacy static server（`server.js`，待替换）

## 活跃定时任务
- `system-reference-rollup`：`20 23 * * *`（Asia/Shanghai），timeout 2400s，enabled。当前处于 running（超时中），`consecutiveErrors: 3`。
- `backup-private-repo`：`0 */2 * * *`（Asia/Shanghai，staggerMs: 300000），timeout 180s，enabled。状态 ok（1h ago），`consecutiveErrors: 0`。
- `nightly-self-optimize`：`15 2 * * *`（Asia/Shanghai），timeout 2400s，enabled。状态 ok（21h ago），`consecutiveErrors: 0`。
- `daily-briefing`：`30 8 * * *`（Asia/Shanghai），timeout 2400s，enabled。状态 ok（15h ago），`consecutiveErrors: 0`。
- 所有任务 `delivery` 均为 announce -> telegram:6810379425。

## 已知问题
- **`system-reference-rollup` 本次仍 running 超时**：当前处于 running 状态未完成，2400s timeout 仍不富余，任务粒度或执行效率需优化。
- **`backup-private-repo` / `nightly-self-optimize` / `daily-briefing` 已恢复**：三者状态当前均为 ok，错误计数已清零，自动化体系部分修复。
- 前端从 legacy plain JS 到 React 的迁移刚完成，`server.js` 与新 FastAPI backend 并存，过渡期间 API 层职责待明确。
- Brain 的 `agents`、`schedules` 页面仍为占位页，未接真实后端。
- Laboratory 模块刚引入 `Research` 和 `Prototypes` 页面，内容待填充。
- 自动备份的 git committer identity 仍未配置，提交显示默认值 MacMini。