# MEMORY.md

## 项目规范

### 实验室模块布局偏好
原型作品集、创意库、研究三个页面默认使用 `lab-vertical-list` 强制单列垂直布局，不使用多列卡片网格。CSS 类：`lab-vertical-list`（定义于 `laboratory.css`）。

### OpenOrigin 项目路径
- 项目根目录：`/Users/ze/.openclaw/workspace/projects/openorigin/`
- 数据文件：`data/prototypes.json`、`data/ideas.json`
- 研究目录：`/Users/ze/research/`
- 技能目录：`/Users/ze/.openclaw/skills/`
- 服务器端口：8000

### 服务器管理
- 重启命令：`kill $(lsof -ti :8000) && cd projects/openorigin && nohup node server.js > /tmp/openorigin-new.log 2>&1 &`
- 语法检查：`node -c modules/xxx/xxx.js && node -c server.js`

## 已完成的功能模块

### 大脑模块页面
- 仪表盘（Models + 动态会话 + 定时任务）
- 每日简报
- 自动化
- 系统文档
- 数据分析
- 内存查看（分割面板 + Markdown 渲染）
- 技能目录（表格，来源筛选）

### 实验室模块页面
- 指挥中心（2×2 网格概览）
- 原型作品集（lab-vertical-list 垂直布局）
- 创意图库（lab-vertical-list 垂直布局 + 评分/赛道）
- 研究（时间线视图）
