// ─── Data ─────────────────────────────────────────────────────

const CHART_DATA = {
  leads: [
    {
      title: '运营指挥官',
      icon: '🎯',
      tone: 'amber',
      meta: '盯目标、排优先级、推节奏，负责把杂乱事项收口成可执行任务。',
      note: '适合后续承接跨渠道运营、进度同步、异常升级。',
      children: [
        { title: '渠道运营', icon: '📣', tag: '执行位', meta: '负责渠道动作、发布节奏、反馈回收。' },
        { title: '任务分发', icon: '🧭', tag: '调度位', meta: '把需求切成工单，派发给对应智能体。' },
        { title: '风险哨兵', icon: '🚨', tag: '监控位', meta: '盯超时、失败、阻塞和异常提醒。' },
      ],
    },
    {
      title: '产品策划',
      icon: '🧩',
      tone: 'violet',
      meta: '负责需求拆解、原型草图、版本节奏和路线图沉淀。',
      note: '适合后续承接 PRD、信息架构、迭代规划。',
      children: [
        { title: '原型设计', icon: '🖼️', tag: '设计位', meta: '快速产出页面骨架、流程草图和交互方向。' },
        { title: '需求整理', icon: '📝', tag: '分析位', meta: '把对话里的想法收成明确需求条目。' },
        { title: '测试陪练', icon: '🧪', tag: '验证位', meta: '提前设计验收点，帮你收回归风险。' },
      ],
    },
    {
      title: '自动化管家',
      icon: '⚙️',
      tone: 'emerald',
      meta: '围绕 cron、备份、流程编排和任务可靠性做持续维护。',
      note: '适合后续承接 OpenClaw 定时任务、脚本守护、工作流自动化。',
      children: [
        { title: '定时任务维护', icon: '⏰', tag: '运维位', meta: '维护 daily / nightly / rollup / backup 链路。' },
        { title: '备份守护', icon: '🗂️', tag: '稳定性', meta: '盯住锁、提交、推送和仓库清洁度。' },
        { title: '流程编排', icon: '🔗', tag: '工作流', meta: '把多步骤任务拆成可复用自动化模板。' },
      ],
    },
    {
      title: '知识中枢',
      icon: '🧠',
      tone: 'cyan',
      meta: '管理文档、记忆、系统参考和长期上下文的一致性。',
      note: '适合后续承接知识库维护、系统文档刷新、记忆提炼。',
      children: [
        { title: '文档维护', icon: '📚', tag: '知识位', meta: '同步 API、系统文档、流程文档。' },
        { title: '记忆整理', icon: '🗃️', tag: '沉淀位', meta: '把日常记录提炼成长期可用记忆。' },
        { title: '情报检索', icon: '🔎', tag: '支持位', meta: '为其他智能体提供背景、资料和定位线索。' },
      ],
    },
  ],
}

// ─── Escape helper ─────────────────────────────────────────────

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ─── Main component ─────────────────────────────────────────────

export function OrgChart() {
  const chart = CHART_DATA
  const totalChildren = chart.leads.reduce((sum, l) => sum + l.children.length, 0)

  return (
    <div className="space-y-5">
      <div className="text-xs uppercase tracking-widest text-text-secondary">运营模块 · 组织架构</div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div className="org-chart-stat compact" style={{ padding: '10px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <strong style={{ display: 'block', fontSize: 24, lineHeight: 1, color: '#ffd89a', marginBottom: 4 }}>{chart.leads.length}</strong>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>主智能体列</span>
        </div>
        <div className="org-chart-stat compact" style={{ padding: '10px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <strong style={{ display: 'block', fontSize: 24, lineHeight: 1, color: '#ffd89a', marginBottom: 4 }}>{totalChildren}</strong>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>子智能体占位</span>
        </div>
        <div className="org-chart-stat compact phase" style={{ padding: '10px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <strong style={{ display: 'block', fontSize: 24, lineHeight: 1, color: '#a78bfa', marginBottom: 4 }}>Phase 01</strong>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>纯视觉占位</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="org-chart-canvas">
        {/* Hero */}
        <div className="org-chart-hero">
          <div className="org-chart-hero-main">
            <p className="org-chart-eyebrow">先把未来的 AI 团队摆上台面</p>
            <h2 className="org-chart-title">先把未来的 AI 团队摆上台面</h2>
            <p className="org-chart-copy">
              先把层级、委派关系和未来要拆出去的工作位画清楚。现在只做视觉骨架，不接真实逻辑，
              方便接下来几周继续讨论该创建哪些主智能体、哪些子智能体，以及哪些任务适合独立 OpenClaw 工作区。
            </p>
          </div>
        </div>

        {/* Stage: Human → Chief */}
        <div className="org-chart-stage">
          <div className="org-chart-root human">
            <div className="org-node node-human node-xl">
              <div className="org-node-kicker">顶层决策者</div>
              <div className="org-node-title">老板 · 人类用户</div>
              <div className="org-node-meta">目标设定 / 关键判断 / 最终拍板</div>
            </div>
          </div>

          <div className="org-connector vertical" />

          <div className="org-chart-root chief">
            <div className="org-node node-chief node-lg">
              <div className="org-node-kicker">中枢协调</div>
              <div className="org-node-title">最强智能体 · 小猿</div>
              <div className="org-node-meta">统一理解上下文，分派任务，回收结果，替老板兜底</div>
            </div>
          </div>

          <div className="org-connector trunk" />

          {/* Leads */}
          <div className="org-chart-leads">
            {chart.leads.map((lead, index) => (
              <section key={lead.title} className={`org-column tone-${lead.tone}`}>
                <div className="org-column-connector" />
                <div className="org-node node-lead">
                  <div className="org-node-top">
                    <span className="org-node-icon">{lead.icon}</span>
                    <span className="org-node-badge">主智能体 {index + 1}</span>
                  </div>
                  <div className="org-node-title">{esc(lead.title)}</div>
                  <div className="org-node-meta">{esc(lead.meta)}</div>
                  <div className="org-node-note">{esc(lead.note)}</div>
                </div>

                <div className="org-subtree">
                  <div className="org-subtree-label">下属智能体</div>
                  {lead.children.map((child, ci) => (
                    <div key={child.title} className="org-child-item">
                      <span className="org-child-order">{String(ci + 1).padStart(2, '0')}</span>
                      <span className="org-child-icon">{child.icon}</span>
                      <span className="org-child-name">{esc(child.title)}</span>
                      <span className="org-child-tag">{esc(child.tag)}</span>
                      <span className="org-child-meta">{esc(child.meta)}</span>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="org-chart-notes">
          <div className="org-note-card">
            <div className="org-note-title">这版先解决什么</div>
            <ul>
              <li>把未来几周可能落地的智能体分层展示出来</li>
              <li>先看清哪些工作适合主智能体，哪些适合下沉给子智能体</li>
              <li>为第三期的独立工作区规划提前留骨架</li>
            </ul>
          </div>
          <div className="org-note-card">
            <div className="org-note-title">当前刻意不做</div>
            <ul>
              <li>不接真实数据</li>
              <li>不做拖拽、编辑、权限、状态联动</li>
              <li>子智能体仅为概念占位，数量和分工待确认</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}