# SYSTEM-REFERENCE

## 今日变更
- 初始化 OpenOrigin 前端结构与主题系统
- 接入任务控制中心的真实 sessions / health 数据
- 预留 cron 状态入口，当前受 gateway pairing 限制

## 当前架构概览
- `index.html`: OpenOrigin 主入口
- `server.js`: 本地 8000 端口预览服务与 API 代理
- `css/`: 全局主题、Dock、Tab、Window 样式
- `modules/ops`: 运营模块与任务控制中心
- `modules/brain`: 大脑模块与多模型布局骨架
- `modules/laboratory`: 实验室模块骨架
- `automation/`: 自动化脚本、任务提示、运行日志

## 模块清单
- Ops Dashboard
- Brain Dashboard
- Laboratory Dashboard
- Mission Control
- Session Modal Viewer

## 活跃定时任务
- 尚未激活。待 gateway dashboard pairing 完成后创建。

## 已知问题
- `openclaw cron *` 当前在本机 CLI 下要求 gateway pairing
- 会话查看层当前展示真实元数据，完整上下文时间线尚未接入
- 多模型卡片中的 Codex 5.4 目前为演示离线卡片
