# 客户运营模块开发完善方案

> 目标：将 Ops 模块升级为客户工作日常指挥中心，适用于多客户账户、多任务并行、严格执行可视化的服务型工作流。

## 一、精准实施方案

### Phase 1：结构升级
在现有 Ops 模块中新增 4 个主区域：
1. 客户任务流程面板
2. 可交付成果追踪面板
3. 运营仪表盘占位面板
4. 会话监控 / 坐席概览占位面板

### Phase 2：任务流与可交付成果联动
- 任务与可交付成果建立关联 ID
- 从单纯任务列表升级为“客户 -> 项目 -> 任务 / 可交付成果”视图
- 支持阻碍项、负责人、优先级、截止日期统一筛选

### Phase 3：运营可视化强化
- SLA 临近预警
- 卡片级状态历史
- 会话监控与坐席概览联动显示
- 风险客户 / 延误客户聚合提醒

## 二、任务与可交付成果数据模型 / 结构

### 1. Client
```json
{
  "id": "client_acme_global",
  "name": "ACME Global",
  "serviceType": "跨境电商代运营",
  "ownerId": "agent_ops_lead",
  "accountCount": 3,
  "status": "active"
}
```

### 2. Task
```json
{
  "id": "task_2026_001",
  "clientId": "client_acme_global",
  "title": "完成 Q2 店铺运营方案",
  "stage": "execution",
  "ownerId": "agent_ops_a",
  "priority": "high",
  "dueDate": "2026-04-25",
  "blockers": [
    {
      "type": "client_pending",
      "summary": "客户未确认预算范围"
    }
  ],
  "deliverableIds": ["deliverable_001"],
  "createdAt": "2026-04-21T09:00:00+08:00",
  "updatedAt": "2026-04-21T16:00:00+08:00"
}
```

### 3. Deliverable
```json
{
  "id": "deliverable_001",
  "clientId": "client_acme_global",
  "taskId": "task_2026_001",
  "name": "Q2 店铺运营方案文档",
  "ownerId": "agent_content_a",
  "slaDate": "2026-04-24",
  "status": "in_review",
  "statusHistory": [
    {"status": "drafting", "at": "2026-04-20T12:00:00+08:00"},
    {"status": "in_review", "at": "2026-04-21T15:30:00+08:00"}
  ]
}
```

### 4. Seat / Operator Overview
```json
{
  "id": "seat_ops_01",
  "name": "运营坐席 A",
  "ownerId": "agent_ops_a",
  "activeTasks": 5,
  "blockedTasks": 1,
  "overdueDeliverables": 0,
  "sessionState": "online"
}
```

### 枚举建议

#### 任务阶段 stage
- `intake` 需求接收
- `scoping` 范围界定
- `execution` 执行中
- `review` 审核
- `delivered` 已交付
- `renewal` 续约

#### 优先级 priority
- `low`
- `medium`
- `high`
- `critical`

#### 可交付成果状态 status
- `not_started`
- `drafting`
- `in_review`
- `approved`
- `delivered`
- `blocked`

## 三、UI 状态与交互细节

### 1. 客户任务流程面板
表现方式：
- 顶部为阶段横向泳道
- 每个泳道显示任务卡片数量
- 支持按客户、负责人、优先级筛选

任务卡片必须展示：
- 客户名称
- 任务标题
- 当前阶段
- 负责人
- 优先级
- 截止日期
- 阻碍项标记

交互：
- 点击卡片打开右侧详情抽屉或居中弹层
- 支持阶段切换
- 支持快速修改负责人 / 优先级 / 截止日期

### 2. 可交付成果追踪面板
表现方式：
- 表格 + 状态时间线摘要
- 支持按 SLA 临近、客户、状态过滤

每行显示：
- 客户名称
- 可交付成果名称
- 负责人
- SLA 日期
- 当前状态
- 最近一次状态更新时间

交互：
- 点击查看完整状态历史
- 逾期或临期时高亮显示

### 3. 运营仪表盘占位面板
先做占位卡片，后续扩展真实聚合指标：
- 活跃客户数
- 本周到期任务数
- 高优先级任务数
- 被阻塞任务数
- 本周已交付数量

### 4. 会话监控面板
先与现有 session 真实数据对接，后续扩展客户维度：
- 活跃会话数
- 当前模型
- 最近会话预览
- 风险会话标记

### 5. 坐席概览面板
先做结构占位：
- 坐席名称
- 在线状态
- 当前任务数
- 阻塞数
- SLA 风险数

## 四、最简 API / 本地持久化方案

### 推荐第一版：本地 JSON 文件
原因：
- 简单
- 可快速接入现有本地 Node server
- 便于手工检查与 git 追踪

建议文件：
- `projects/openorigin/data/clients.json`
- `projects/openorigin/data/tasks.json`
- `projects/openorigin/data/deliverables.json`
- `projects/openorigin/data/seats.json`

### 最简本地 API

#### GET
- `GET /api/clients`
- `GET /api/tasks`
- `GET /api/deliverables`
- `GET /api/seats`

#### POST / PATCH
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `POST /api/deliverables`
- `PATCH /api/deliverables/:id`

### 服务端处理建议
- 先采用文件读写
- 写入前做简单 schema 校验
- 所有改动记录 `updatedAt`
- 对状态历史追加而非覆盖

## 五、两个真实客户场景测试清单

### 场景 A：跨境店铺月度运营客户
客户：ACME Global
服务：店铺代运营 + 营销协同

测试点：
- [ ] 能创建客户与多个任务
- [ ] 任务可在 6 个阶段间流转
- [ ] 能设置负责人、优先级、截止日期
- [ ] 阻碍项显示为“客户待确认预算”
- [ ] 可交付成果可记录 SLA 日期
- [ ] 状态历史可显示从 drafting -> in_review -> delivered
- [ ] 会话监控可看到与该客户相关的处理会话占位

### 场景 B：高频内容更新客户
客户：North Harbor Brands
服务：Listing 优化 + 活动内容运营

测试点：
- [ ] 同一客户下可并行多个 deliverables
- [ ] 可按负责人筛出内容类任务
- [ ] 逾期 SLA 的 deliverable 高亮
- [ ] 坐席概览能显示某负责人任务过载
- [ ] 阻塞任务能聚合为风险提醒
- [ ] 续约阶段任务可单独归档查看

## 六、第一版落地建议

建议先做：
1. 本地 JSON 数据源
2. 任务流程泳道
3. 可交付成果表格
4. 运营仪表盘占位卡
5. 会话监控复用现有真实 sessions 数据
6. 坐席概览先用本地静态数据

这样可以在不引入复杂后端的前提下，尽快把客户运营模块变成真正可演示、可继续扩展的指挥中心。
