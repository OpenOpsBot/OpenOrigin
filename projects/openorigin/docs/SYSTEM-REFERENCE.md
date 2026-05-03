# SYSTEM-REFERENCE

## 今日变更
- `openorigin` 今日共 3 次 workspace snapshot 提交（b2810a9 / 3441f1d / e5169dd），涵盖前端重构、brain 模块扩展和 backend 搭建。
- **前端技术栈迁移**：从 legacy plain JS（`js/app.js`、`modules/brain/brain.js`）切换到 Vite + React + TypeScript。前端项目移至 `frontend/` 目录，结构：
  - `src/App.tsx`（主入口）、`src/main.tsx`（React 挂载）、`src/index.css`（全局样式）
  - `src/api/index.ts`（API 层）、`src/stores/appStore.ts`（Zustand 状态）、`src/types/index.ts`（类型定义）
  - `src/components/layout/`：AppShell、TabBar、Dock
  - `src/components/ui/`：Badge、Panel、StatusDot
  - `src/modules/ops`：OrgChart、Dashboard、Tasks
  - `src/modules/brain`：Dashboard、DailyBriefing、Automations、SystemDocumentation、DataAnalysis、MemoryViewer、SkillsCatalog
  - `src/modules/laboratory`：Dashboard、Ideas、Prototypes、Research
  - 构建产物输出至 `frontend/dist/`
- **后端 FastAPI 初建**：`backend/app/` 已包含 `main.py`（FastAPI 实例）、`routers/brain.py`、`routers/ops.py`、`routers/lab.py`、`models/`、`schemas/` 目录。依赖 `requirements.txt`。
- 新增页面：`MemoryViewer.tsx`（brain）、`SkillsCatalog.tsx`（brain）、`Research.tsx`（laboratory）、`Prototypes.tsx`（laboratory）。
- 当前 Cron 状态（均为 error/timeout）：
  - `system-reference-rollup`（本次）：`lastStatus: error`、`consecutiveErrors: 2`、`lastDurationMs: 2400071`
  - `backup-private-repo`：`lastStatus: error`、`consecutiveErrors: 1`、`lastDurationMs: 180045`
  - `nightly-self-optimize`：`lastStatus: error`、`consecutiveErrors: 3`、`lastDurationMs: 3084063`
  - `daily-briefing`：`lastStatus: error`、`consecutiveErrors: 4`、`lastDurationMs: 2400018`

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
- Brain / 记忆查看器（`MemoryViewer.tsx`，新增）
- Brain / 技能目录（`SkillsCatalog.tsx`，新增）
- Laboratory / 仪表盘（`Dashboard.tsx`）
- Laboratory / 创意库（`Ideas.tsx`）
- Laboratory / 原型（`Prototypes.tsx`，新增）
- Laboratory / 研究（`Research.tsx`，新增）
- Local API Layer（FastAPI backend）
- Legacy static server（`server.js`，待替换）

## 活跃定时任务
- `system-reference-rollup`：`20 23 * * *`（Asia/Shanghai），timeout 2400s，enabled。当前执行中，`consecutiveErrors: 2`。
- `backup-private-repo`：`0 */2 * * *`（Asia/Shanghai，staggerMs: 300000），timeout 180s，enabled。`consecutiveErrors: 1`。
- `nightly-self-optimize`：`15 2 * * *`（Asia/Shanghai），timeout 2400s，enabled。`consecutiveErrors: 3`。
- `daily-briefing`：`30 8 * * *`（Asia/Shanghai），timeout 2400s，enabled。`consecutiveErrors: 4`，是当前最不稳定的任务。
- 所有任务 `delivery` 均为 announce -> telegram:6810379425，状态全为 error/timeout。

## 已知问题
- **全部 4 个 cron 任务均处于 error 状态**，全部因 timeout 失败。最严重：`daily-briefing`（4 次）、`nightly-self-optimize`（3 次）。
- `system-reference-rollup` 本次执行亦 timeout（`lastDurationMs: 2400071`），说明即使是"文档更新"类任务也在 2400s 内无法完成，疑似存在结构性性能问题。
- 前端从 legacy plain JS 到 React 的迁移刚完成，`server.js` 与新 FastAPI backend 并存，过渡期间 API 层职责待明确。
- Brain 的 `agents`、`schedules` 页面仍为占位页，未接真实后端。
- Laboratory 模块刚引入 `Research` 和 `Prototypes` 页面，内容待填充。
- 自动备份的 git committer identity 仍未配置，提交显示默认值 MacMini。