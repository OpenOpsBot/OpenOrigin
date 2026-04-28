class OpsModule {
  constructor() {
    this.view = null;
    this.refreshInterval = null;
    this.sessionsCache = [];
    this.healthData = null;
    this.cronData = null;
    this.modelsData = null;
    this.currentPage = 'org-chart';
    this.sessionHistoryExpanded = false;
    this.sessionHistoryItems = [];
    this.currentSessionModalKey = null;
  }

  show(pageKey = 'org-chart') {
    this.currentPage = pageKey;
    if (!this.view) this.render();
    this.view.classList.add('active');
    this.updatePageVisibility();
    this.startAutoRefresh();
  }

  hide() {
    if (this.view) this.view.classList.remove('active');
    this.stopAutoRefresh();
  }

  startAutoRefresh() {
    this.stopAutoRefresh();
    this.refreshAll();
    this.refreshInterval = setInterval(() => this.refreshAll(), 30000);
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  refreshAll() {
    Promise.all([
      this.loadAgents(),
      this.loadSessions(),
      this.loadHealth(),
      this.loadModels(),
      this.loadCron()
    ]).then(() => {
      if (window.lucide) window.lucide.createIcons();
    }).catch(() => {});
  }

  render() {
    this.view = document.createElement('div');
    this.view.className = 'module-view module-ops active';
    this.view.id = 'opsView';
    this.view.innerHTML = `
      <div class="module-page ${this.currentPage === 'dashboard' ? 'active' : ''}" data-page="dashboard">
        <div class="dashboard ops-dashboard">
          ${this.renderAgentsPanel()}
          ${this.renderStageLanes()}
          ${this.renderSessionsPanel()}
          ${this.renderOpsStats()}
          ${this.renderChannelsPanel()}
        </div>
      </div>

      <div class="module-page ${this.currentPage === 'tasks' ? 'active' : ''}" data-page="tasks">
        <div class="dashboard single-page-dashboard ops-tasks-dashboard mission-control-dashboard">
          <div class="panel mission-hero-panel">
            <div class="panel-header">
              <i data-lucide="radar"></i>
              指挥台
            </div>
            <div class="panel-body">
              <div class="mission-summary-grid" id="missionSummaryGrid">
                <div class="mission-summary-card summary-models" id="summaryModels">
                  <div class="summary-icon"><i data-lucide="cpu"></i></div>
                  <div class="summary-value" id="summaryModelsCount">--</div>
                  <div class="summary-label">模型</div>
                  <div class="summary-meta" id="summaryModelsMeta">加载中...</div>
                </div>
                <div class="mission-summary-card summary-sessions" id="summarySessions">
                  <div class="summary-icon"><i data-lucide="scan-search"></i></div>
                  <div class="summary-value" id="summarySessionsCount">--</div>
                  <div class="summary-label">活跃会话</div>
                  <div class="summary-meta" id="summarySessionsMeta">加载中...</div>
                </div>
                <div class="mission-summary-card summary-cron" id="summaryCron">
                  <div class="summary-icon"><i data-lucide="clock"></i></div>
                  <div class="summary-value" id="summaryCronCount">--</div>
                  <div class="summary-label">定时任务</div>
                  <div class="summary-meta" id="summaryCronMeta">加载中...</div>
                </div>
                <div class="mission-summary-card summary-alerts" id="summaryAlerts">
                  <div class="summary-icon"><i data-lucide="alert-triangle"></i></div>
                  <div class="summary-value" id="summaryAlertsCount">--</div>
                  <div class="summary-label">异常提醒</div>
                  <div class="summary-meta" id="summaryAlertsMeta">--</div>
                </div>
              </div>

              <div class="mission-panels">
                <div class="panel mission-panel" data-panel="models">
                  <div class="panel-header">
                    <i data-lucide="cpu"></i>
                    模型
                    <span class="panel-count" id="modelsPanelCount">--</span>
                  </div>
                  <div class="panel-body">
                    <div class="mission-grid" id="modelsList"></div>
                  </div>
                </div>
                <div class="panel mission-panel" data-panel="sessions">
                  <div class="panel-header">
                    <i data-lucide="scan-search"></i>
                    活跃会话
                    <span class="panel-count" id="sessionsPanelCount">--</span>
                  </div>
                  <div class="panel-body">
                    <div class="mission-grid" id="activeSessionsList"></div>
                  </div>
                </div>
                <div class="panel mission-panel" data-panel="cron">
                  <div class="panel-header">
                    <i data-lucide="clock"></i>
                    定时任务
                    <span class="panel-count" id="cronPanelCount">--</span>
                  </div>
                  <div class="panel-body">
                    <div class="mission-grid" id="cronList"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="module-page ${this.currentPage === 'org-chart' ? 'active' : ''}" data-page="org-chart">
        <div class="dashboard single-page-dashboard ops-org-dashboard">
          ${this.renderOrgChartPage()}
        </div>
      </div>
    `;

    this.view.querySelectorAll('.mission-item-clickable').forEach(el => {
      el.addEventListener('click', () => {
        const key = el.dataset.sessionKey;
        if (key) this.openSessionModal(key);
      });
    });

    document.getElementById('mainContent').appendChild(this.view);
    this.refreshAll();
    if (window.lucide) window.lucide.createIcons();
  }

  // ---- Dashboard panels ----

  renderAgentsPanel() {
    return `
      <div class="panel agents-panel">
        <div class="panel-header">
          <i data-lucide="bot"></i>
          代理概览
        </div>
        <div class="panel-body">
          <div class="agents-grid" id="agentsGrid">
            <div class="mc-loading">加载中...</div>
          </div>
        </div>
      </div>
    `;
  }

  renderStageLanes() {
    return `
      <div class="panel stage-lanes-panel">
        <div class="panel-header">
          <i data-lucide="git-branch"></i>
          任务流程
        </div>
        <div class="panel-body">
          <div class="stage-lanes" id="stageLanes">
            ${['pending','running','completed','failed'].map(s => `
              <div class="stage-lane" data-stage="${s}">
                <div class="stage-lane-label stage-${s}">${this.stageLabel(s)}</div>
                <div class="stage-lane-tasks" id="lane_${s}">
                  <div class="lane-empty">--</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  stageLabel(key) {
    return { pending: '待执行', running: '执行中', completed: '已完成', failed: '失败' }[key] || key;
  }

  renderSessionsPanel() {
    return `
      <div class="panel deliverables-panel">
        <div class="panel-header">
          <i data-lucide="file-check"></i>
          交付追踪
        </div>
        <div class="panel-body">
          <div class="deliverables-table-wrap">
            <table class="deliverables-table" id="sessionsTable">
              <thead>
                <tr>
                  <th>会话</th>
                  <th>渠道</th>
                  <th>类型</th>
                  <th>模型</th>
                  <th>Token</th>
                  <th>最后活跃</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody id="sessionsBody">
                <tr><td colspan="7" class="mc-loading">加载中...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  renderOpsStats() {
    return `
      <div class="panel ops-stats-panel">
        <div class="panel-header">
          <i data-lucide="layout-dashboard"></i>
          运营仪表盘
        </div>
        <div class="panel-body">
          <div class="ops-stats-grid" id="opsStatsGrid">
            <div class="ops-stat-card">
              <div class="ops-stat-value" id="statActiveSessions">--</div>
              <div class="ops-stat-label">活跃会话</div>
            </div>
            <div class="ops-stat-card">
              <div class="ops-stat-value" id="statCronTotal">--</div>
              <div class="ops-stat-label">定时任务</div>
            </div>
            <div class="ops-stat-card warning">
              <div class="ops-stat-value" id="statCronEnabled">--</div>
              <div class="ops-stat-label">已启用</div>
            </div>
            <div class="ops-stat-card danger">
              <div class="ops-stat-value" id="statCronFailed">--</div>
              <div class="ops-stat-label">执行失败</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderChannelsPanel() {
    return `
      <div class="panel seat-overview-panel">
        <div class="panel-header">
          <i data-lucide="radio"></i>
          渠道状态
        </div>
        <div class="panel-body">
          <div class="seat-grid" id="channelsGrid">
            <div class="mc-loading">加载中...</div>
          </div>
        </div>
      </div>
    `;
  }

  renderOrgChartPage() {
    const chart = this.getOrgChartPrototype();
    return `
      <div class="panel org-chart-panel">
        <div class="panel-header org-chart-panel-header">
          <div class="org-chart-panel-title">
            <i data-lucide="network"></i>
            组织架构图
          </div>
          <div class="org-chart-header-stats">
            <div class="org-chart-stat compact">
              <strong>${chart.leads.length}</strong>
              <span>主智能体列</span>
            </div>
            <div class="org-chart-stat compact">
              <strong>${chart.leads.reduce((sum, lead) => sum + lead.children.length, 0)}</strong>
              <span>子智能体占位</span>
            </div>
            <div class="org-chart-stat compact phase">
              <strong>Phase 01</strong>
              <span>纯视觉占位</span>
            </div>
          </div>
        </div>
        <div class="panel-body">
          <div class="org-chart-hero">
            <div class="org-chart-hero-main">
              <div class="org-chart-eyebrow">运营模块 · 团队原型</div>
              <h2 class="org-chart-title">先把未来的 AI 团队摆上台面</h2>
              <p class="org-chart-copy">先把层级、委派关系和未来要拆出去的工作位画清楚。现在只做视觉骨架，不接真实逻辑，方便接下来几周继续讨论该创建哪些主智能体、哪些子智能体，以及哪些任务适合独立 OpenClaw 工作区。</p>
            </div>
          </div>

          <div class="org-chart-canvas">
          <div class="org-chart-stage">
            <div class="org-chart-root human">
              <div class="org-node node-human node-xl">
                <div class="org-node-kicker">顶层决策者</div>
                <div class="org-node-title">老板 · 人类用户</div>
                <div class="org-node-meta">目标设定 / 关键判断 / 最终拍板</div>
              </div>
            </div>

            <div class="org-connector vertical"></div>

            <div class="org-chart-root chief">
              <div class="org-node node-chief node-lg">
                <div class="org-node-kicker">中枢协调</div>
                <div class="org-node-title">最强智能体 · 小猿</div>
                <div class="org-node-meta">统一理解上下文，分派任务，回收结果，替老板兜底</div>
              </div>
            </div>

            <div class="org-connector trunk"></div>

            <div class="org-chart-leads">
              ${chart.leads.map((lead, index) => `
                <section class="org-column tone-${lead.tone}">
                  <div class="org-column-connector"></div>
                  <div class="org-node node-lead">
                    <div class="org-node-top">
                      <span class="org-node-icon">${lead.icon}</span>
                      <span class="org-node-badge">主智能体 ${index + 1}</span>
                    </div>
                    <div class="org-node-title">${this.esc(lead.title)}</div>
                    <div class="org-node-meta">${this.esc(lead.meta)}</div>
                    <div class="org-node-note">${this.esc(lead.note)}</div>
                  </div>

                  <div class="org-subtree">
                    <div class="org-subtree-label">下属智能体</div>
                    ${lead.children.map((child, childIndex) => `
                      <div class="org-child-item">
                        <span class="org-child-order">${String(childIndex + 1).padStart(2, '0')}</span>
                        <span class="org-child-icon">${child.icon}</span>
                        <span class="org-child-name">${this.esc(child.title)}</span>
                        <span class="org-child-tag">${this.esc(child.tag)}</span>
                        <span class="org-child-meta">${this.esc(child.meta)}</span>
                      </div>
                    `).join('')}
                  </div>
                </section>
              `).join('')}
            </div>
          </div>
          </div>

          <div class="org-chart-notes">
            <div class="org-note-card">
              <div class="org-note-title">这版先解决什么</div>
              <ul>
                <li>把未来几周可能落地的智能体分层展示出来</li>
                <li>先看清哪些工作适合主智能体，哪些适合下沉给子智能体</li>
                <li>为第三期的独立工作区规划提前留骨架</li>
              </ul>
            </div>
            <div class="org-note-card">
              <div class="org-note-title">当前刻意不做</div>
              <ul>
                <li>不接真实数据</li>
                <li>不做拖拽、编辑、权限、状态联动</li>
                <li>不锁死智能体数量，后面可增减列数</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getOrgChartPrototype() {
    return {
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
            { title: '风险哨兵', icon: '🚨', tag: '监控位', meta: '盯超时、失败、阻塞和异常提醒。' }
          ]
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
            { title: '测试陪练', icon: '🧪', tag: '验证位', meta: '提前设计验收点，帮你收回归风险。' }
          ]
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
            { title: '流程编排', icon: '🔗', tag: '工作流', meta: '把多步骤任务拆成可复用自动化模板。' }
          ]
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
            { title: '情报检索', icon: '🔎', tag: '支持位', meta: '为其他智能体提供背景、资料和定位线索。' }
          ]
        }
      ]
    };
  }

  // ---- Data loaders ----

  async loadAgents() {
    try {
      const resp = await fetch('/api/agents');
      const data = await resp.json();
      this.renderAgents(data.agents || []);
    } catch (e) {
      this.renderAgents([]);
    }
  }

  async loadSessions() {
    try {
      const resp = await fetch('/api/sessions');
      const data = await resp.json();
      this.sessionsCache = data.sessions || [];
      this.renderSessionsTable(this.sessionsCache);
      this.renderActiveSessions(this.sessionsCache);
      this.renderOpsStatsData();
    } catch (e) {
      this.sessionsCache = [];
      this.renderSessionsTable([]);
    }
  }

  async loadHealth() {
    try {
      const resp = await fetch('/api/health');
      const data = await resp.json();
      this.healthData = data;
      this.renderChannels(data.channels || {}, data.channelOrder || []);
      this.updateAlertSummary();
    } catch (e) {
      this.healthData = { error: 'load_error' };
      this.updateAlertSummary();
    }
  }

  async loadCron() {
    try {
      const resp = await fetch('/api/cron');
      const data = await resp.json();
      this.cronData = data;
      this.renderCronJobs(data.jobs || []);
      this.setText('#summaryCronCount', Array.isArray(data.jobs) ? data.jobs.length : '--');
    } catch (e) {
      this.cronData = { error: 'load_error' };
      this.renderCronJobs([]);
    }
  }

  async loadModels() {
    try {
      const resp = await fetch('/api/models');
      const data = await resp.json();
      this.modelsData = data;
      this.renderModels(data);
    } catch (e) {
      this.modelsData = { error: 'load_error' };
      this.renderModels(this.modelsData);
    }
  }

  // ---- Renderers ----

  renderAgents(agents) {
    const nodes = this.view?.querySelectorAll('#agentsGrid') || [];
    nodes.forEach(el => {
      if (!agents.length) {
        el.innerHTML = '<div class="mc-empty">暂无代理信息</div>';
        return;
      }
      el.innerHTML = agents.map(a => `
        <div class="agent-card">
          <div class="agent-card-top">
            <span class="agent-emoji">${a.emoji}</span>
            <span class="agent-name">${this.esc(a.name)}</span>
            ${a.isDefault ? '<span class="agent-default-badge">默认</span>' : ''}
          </div>
          <div class="agent-card-body">
            <div class="agent-model">${this.esc(a.model || '未配置')}</div>
            <div class="agent-workspace">${this.esc(a.workspace || '--')}</div>
          </div>
          <div class="agent-providers">
            ${(a.providers || []).map(p => `<span class="provider-chip">${this.esc(p)}</span>`).join('')}
          </div>
        </div>
      `).join('');
    });
  }

  renderStageLanesData(sessions) {
    const laneNodes = this.view?.querySelectorAll('[id^="lane_"]') || [];
    const buckets = { pending: [], running: [], completed: [], failed: [] };

    sessions.forEach(s => {
      if (s.abortedLastRun) buckets.failed.push(s);
      else if (s.ageMs < 5 * 60 * 1000) buckets.running.push(s);
      else buckets.completed.push(s);
    });

    laneNodes.forEach(lane => {
      const stage = lane.id.replace('lane_', '');
      const items = buckets[stage] || [];
      if (!items.length) {
        lane.innerHTML = '<div class="lane-empty">无</div>';
        return;
      }
      lane.innerHTML = items.slice(0, 5).map(s => `
        <div class="task-card ${s.abortedLastRun ? 'task-card-blocked' : ''}">
          <div class="task-card-client">${this.esc(s.origin?.label || s.sessionId || '未命名')}</div>
          <div class="task-card-title">${this.esc(s.model || '--')}</div>
          <div class="task-card-meta">
            <span class="task-due-date ${s.abortedLastRun ? 'due-soon' : ''}">${this.formatAge(s.ageMs)}</span>
          </div>
        </div>
      `).join('');
    });
  }

  renderSessionsTable(sessions) {
    const bodyNodes = this.view?.querySelectorAll('#sessionsBody') || [];
    bodyNodes.forEach(tbody => {
      if (!sessions.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="mc-empty">暂无会话数据</td></tr>';
        return;
      }
      tbody.innerHTML = sessions.slice(0, 20).map(s => {
        const isActive = s.ageMs < 5 * 60 * 1000;
        const tokenPct = s.contextTokens ? Math.round((s.totalTokens || 0) / s.contextTokens * 100) : null;
        return `
          <tr class="${s.abortedLastRun ? 'row-danger' : isActive ? 'row-active' : ''}">
            <td><span class="deliv-client">${this.esc(s.origin?.label || s.sessionId || '--')}</span></td>
            <td><span class="deliv-name">${this.esc(s.origin?.provider || '--')}</span></td>
            <td><span class="deliv-owner">${this.esc(s.kind || s.origin?.chatType || '--')}</span></td>
            <td><span class="deliv-name">${this.esc(s.model || '--')}</span></td>
            <td><span class="deliv-sla">${tokenPct !== null ? `${this.formatTokens(s.totalTokens || 0)}/${this.formatTokens(s.contextTokens)} (${tokenPct}%)` : '--'}</span></td>
            <td><span class="deliv-sla ${isActive ? 'sla-ok' : ''}">${this.formatAge(s.ageMs)}</span></td>
            <td><span class="deliv-status status-${s.abortedLastRun ? 'blocked' : isActive ? 'approved' : 'drafting'}">${s.abortedLastRun ? '失败' : isActive ? '活跃' : '已完成'}</span></td>
          </tr>
        `;
      }).join('');
    });
  }

  renderOpsStatsData() {
    const sessions = this.sessionsCache;
    const jobs = this.cronData?.jobs || [];
    const activeSessions = sessions.filter(s => s.ageMs < 5 * 60 * 1000).length;
    const cronFailed = jobs.filter(j => ['failed', 'error'].includes(j.lastRun?.status)).length;
    const cronEnabled = jobs.filter(j => j.enabled).length;

    const setText = (selector, val) => {
      this.view?.querySelectorAll(selector).forEach(el => { el.textContent = val; });
    };
    setText('#statActiveSessions', activeSessions);
    setText('#statCronTotal', jobs.length);
    setText('#statCronEnabled', cronEnabled);
    setText('#statCronFailed', cronFailed);
  }

  renderChannels(channels, order) {
    const nodes = this.view?.querySelectorAll('#channelsGrid') || [];
    const list = order.map(k => [k, channels[k]]).filter(([, v]) => v);
    nodes.forEach(el => {
      if (!list.length) {
        el.innerHTML = '<div class="mc-empty">暂无渠道配置</div>';
        return;
      }
      el.innerHTML = list.map(([name, info]) => {
        const status = info.running ? 'online' : (info.configured ? 'configured' : 'offline');
        const statusText = info.running ? '运行中' : info.configured ? '已配置' : '未配置';
        return `
          <div class="seat-card">
            <div class="seat-card-top">
              <span class="seat-name">${this.esc(name)}</span>
              <span class="status-dot ${status}"></span>
            </div>
            <div class="seat-stats">
              <span>${statusText}</span>
              ${info.lastError ? `<span class="seat-error">错误: ${this.esc(info.lastError)}</span>` : ''}
            </div>
          </div>
        `;
      }).join('');
    });
  }

  // ---- Mission Control renderers ----

  renderModelsPanel() {
    return `
      <div class="panel mission-panel" data-panel="models">
        <div class="panel-header">
          <i data-lucide="cpu"></i>
          模型
          <span class="panel-count" id="modelsPanelCount">--</span>
        </div>
        <div class="panel-body">
          <div class="mission-grid" id="modelsList"></div>
        </div>
      </div>
    `;
  }

  renderModels(data = {}) {
    const nodes = this.view?.querySelectorAll('#modelsList') || [];
    const models = this.extractModels(data);
    this.setText('#summaryModelsCount', models.length);
    this.setText('#summaryModelsMeta', models[0] ? `${models[0].name} · ${models[0].statusText}` : (data.error ? '暂不可用' : '暂无模型信息'));
    this.updateAlertSummary();
    nodes.forEach(el => {
      if (!models.length) {
        el.innerHTML = `<div class="mc-empty">${data.error ? '模型数据暂不可用' : '暂无模型信息'}</div>`;
        return;
      }
      el.innerHTML = models.map(model => {
        const roleBadge = model.role === 'primary' ? '<span class="mission-item-badge badge-primary">主模型</span>' : (model.role === 'fallback' ? '<span class="mission-item-badge badge-warning">备选</span>' : '');
        const chips = [
          model.reasoning ? '<span class="mc-chip chip-blue">思维</span>' : '',
          model.multimodal ? '<span class="mc-chip chip-purple">多模态</span>' : '',
          model.contextWindow ? `<span class="mc-chip chip-dim">${this.formatTokens(model.contextWindow)}</span>` : ''
        ].filter(Boolean);
        return `
        <div class="mission-tile ${model.statusClass === 'offline' ? 'tile-warning' : 'tile-ok'}">
          <div class="mission-item-top">
            <div class="mission-item-title-wrap">
              <div class="mission-item-icon"><i data-lucide="cpu"></i></div>
              <span class="mission-item-title">${this.esc(model.displayName)}</span>
            </div>
            ${roleBadge}
          </div>
          <div class="mission-item-meta">${this.esc(model.provider)}</div>
          <div class="mission-item-submeta">${this.esc(model.statusText)}</div>
          ${chips.length ? `<div class="mission-item-chips">${chips.join('')}</div>` : ''}
        </div>`;
      }).join('');
    });
  }

  extractModels(data = {}) {
    if (!Array.isArray(data.models)) return [];
    const activeRefs = new Set((this.sessionsCache || []).map(session => `${session.modelProvider || '?'} / ${session.model || '?'}`));
    return data.models.map(item => {
      const name = `${item.provider || '?'} / ${item.model || '?'}`;
      const isActive = activeRefs.has(name);
      return {
        name,
        displayName: item.name || item.model || name,
        provider: item.provider || '?',
        statusText: isActive ? '活跃' : '已配置',
        statusClass: isActive ? 'coming-soon' : 'offline',
        role: item.role || null,
        reasoning: item.reasoning || false,
        multimodal: item.multimodal || false,
        contextWindow: item.contextWindow || null,
        maxTokens: item.maxTokens || null
      };
    });
  }

  renderActiveSessions(sessions = []) {
    const nodes = this.view?.querySelectorAll('#activeSessionsList') || [];
    const active = sessions.filter(s => s.ageMs < 30 * 60 * 1000);
    this.setText('#summarySessionsCount', active.length);
    const firstContext = sessions[0] ? this.getSessionContext(sessions[0]) : null;
    this.setText('#summarySessionsMeta', sessions[0] ? `${firstContext?.label || sessions[0].sessionId || '未命名会话'} · ${this.formatAge(sessions[0].ageMs)}` : '暂无活跃会话');
    this.setText('#sessionsPanelCount', active.length);
    this.setText('#summarySessionsCount', active.length);
    this.updateAlertSummary();
    nodes.forEach(el => {
      if (!active.length) {
        el.innerHTML = '<div class="mc-empty">暂无活跃会话</div>';
        return;
      }
      el.innerHTML = active.slice(0, 8).map(session => {
        const context = this.getSessionContext(session);
        const state = this.formatSessionState(session);
        const tileTone = state.tone === 'danger' ? 'tile-danger' : state.tone === 'warn' ? 'tile-warning' : 'tile-ok';
        return `
        <div class="mission-tile mission-item-clickable ${tileTone}" data-session-key="${this.esc(session.key || '')}">
          <div class="mission-item-top">
            <div class="mission-item-title-wrap">
              <div class="mission-item-icon"><i data-lucide="scan-search"></i></div>
              <span class="mission-item-title">${this.esc(context.label || session.sessionId || '未命名会话')}</span>
            </div>
            <span class="mission-item-badge">${this.esc(context.chatType || session.kind || 'unknown')}</span>
          </div>
          <div class="mission-item-meta">${this.esc(session.model || '--')}</div>
          <div class="mission-item-submeta">${this.esc(context.provider || '--')} · 最近活跃 ${this.esc(this.formatAge(session.ageMs))}</div>
        </div>
      `}).join('');
      el.querySelectorAll('.mission-item-clickable').forEach(tile => {
        tile.addEventListener('click', () => this.openSessionModal(tile.dataset.sessionKey));
      });
    });
  }

  renderCronJobs(jobs = []) {
    const nodes = this.view?.querySelectorAll('#cronList') || [];
    this.setText('#summaryCronMeta', `${jobs.filter(j => j.enabled).length} 已启用`);
    this.setText('#cronPanelCount', jobs.length);
    this.updateAlertSummary();
    nodes.forEach(el => {
      if (!jobs.length) {
        el.innerHTML = '<div class="mc-empty">暂无定时任务</div>';
        return;
      }
      el.innerHTML = jobs.slice(0, 8).map(job => {
        const sched = job.schedule || {};
        let schedText = '未知';
        if (sched.kind === 'every') schedText = `每 ${Math.round(sched.everyMs / 60000)}m`;
        else if (sched.kind === 'cron') schedText = sched.expr || 'cron';
        else if (sched.kind === 'at') schedText = sched.at ? new Date(sched.at).toLocaleString('zh-CN') : '定时';
        const lastStatus = job.lastRun?.status || '--';
        return `
        <div class="mission-tile ${job.enabled ? (['failed', 'error'].includes(lastStatus) ? 'tile-danger' : 'tile-ok') : 'tile-warning'}">
          <div class="mission-item-top">
            <div class="mission-item-title-wrap">
              <div class="mission-item-icon"><i data-lucide="clock"></i></div>
              <span class="mission-item-title">${this.esc(job.name || job.id || '--')}</span>
            </div>
            <span class="mission-item-badge">${job.enabled ? '已启用' : '已停用'}</span>
          </div>
          <div class="mission-item-meta">${schedText}</div>
          <div class="mission-item-submeta">上次: ${['ok','success'].includes(lastStatus) ? '成功' : ['failed','error'].includes(lastStatus) ? '失败' : lastStatus}</div>
        </div>`;
      }).join('');
    });
  }

  updateAlertSummary() {
    const alerts = [];
    const sessions = this.sessionsCache || [];
    const cronJobs = this.cronData?.jobs || [];
    const models = this.extractModels(this.modelsData || {});
    if (this.healthData && this.healthData.error) alerts.push('系统');
    if ((this.modelsData && this.modelsData.error) || !models.length) alerts.push('模型');
    if (sessions.filter(s => s.abortedLastRun).length) alerts.push('会话');
    if (cronJobs.filter(j => ['failed', 'error'].includes(j.lastRun?.status)).length) alerts.push('定时');
    const count = alerts.length;
    this.setText('#summaryAlertsCount', count || '0');
    this.setText('#summaryAlertsMeta', count ? `问题: ${alerts.join(', ')}` : '无异常');
  }

  // ---- Session modal ----

  openSessionModal(key) {
    const session = this.sessionsCache.find(s => s.key === key);
    if (!session) return;
    this.buildSessionModal(session);
  }

  async loadSessionHistory(session) {
    const target = document.getElementById('sessionHistoryList');
    if (!target || !session?.key) return;

    const requestKey = session.key;
    this.currentSessionModalKey = requestKey;
    this.sessionHistoryExpanded = false;
    this.sessionHistoryItems = [];
    target.dataset.sessionKey = requestKey;
    target.innerHTML = '<div class="mc-loading">加载 Session History...</div>';
    this.updateSessionHistoryToggle();

    try {
      const res = await fetch(`/api/session-history?key=${encodeURIComponent(requestKey)}`);
      const data = await res.json();
      if (target.dataset.sessionKey !== requestKey) return;
      if (!res.ok || data.error) throw new Error(data.detail || data.error || '加载失败');

      this.sessionHistoryItems = Array.isArray(data.history) ? data.history : [];
      this.renderSessionHistory();
    } catch (error) {
      if (target.dataset.sessionKey !== requestKey) return;
      this.sessionHistoryItems = [];
      this.updateSessionHistoryToggle(error.message);
      target.innerHTML = `<div class="mc-empty">Session History 加载失败：${this.esc(error.message)}</div>`;
    }
  }

  renderSessionHistory() {
    const target = document.getElementById('sessionHistoryList');
    if (!target) return;

    const history = Array.isArray(this.sessionHistoryItems) ? this.sessionHistoryItems : [];
    if (!history.length) {
      this.updateSessionHistoryToggle();
      target.innerHTML = '<div class="mc-empty">暂无 Session History</div>';
      return;
    }

    const visible = this.sessionHistoryExpanded ? history : history.slice(-20);
    this.updateSessionHistoryToggle();
    target.innerHTML = visible.slice().reverse().map(item => {
      const role = item.role || 'unknown';
      const text = String(item.content || '').trim() || '[空消息]';
      return `
        <div class="session-history-item role-${this.esc(role)}">
          <div class="session-history-top">
            <span class="session-history-role">${this.esc(role)}</span>
            <span class="session-history-time">${this.formatDateTime(item.timestamp)}</span>
          </div>
          <div class="session-history-content">${this.esc(text)}</div>
        </div>
      `;
    }).join('');
  }

  updateSessionHistoryToggle(errorText = '') {
    const btn = document.getElementById('sessionHistoryToggle');
    const meta = document.getElementById('sessionHistoryMeta');
    if (!btn || !meta) return;

    const total = Array.isArray(this.sessionHistoryItems) ? this.sessionHistoryItems.length : 0;
    meta.textContent = errorText ? `加载失败` : total ? `共 ${total} 条` : '暂无数据';

    if (total <= 20) {
      btn.hidden = true;
      btn.textContent = '展开全部历史';
      return;
    }

    btn.hidden = false;
    btn.textContent = this.sessionHistoryExpanded ? '收起' : '展开全部历史';
  }

  toggleSessionHistoryExpanded() {
    this.sessionHistoryExpanded = !this.sessionHistoryExpanded;
    this.renderSessionHistory();
  }

  getSessionContext(session = {}) {
    const parts = String(session.key || '').split(':');
    const inferred = {
      provider: session.origin?.provider || null,
      surface: session.origin?.surface || null,
      chatType: session.origin?.chatType || session.kind || null,
      label: session.origin?.label || null,
      scopeId: null
    };

    if (parts[0] === 'agent' && parts.length >= 4) {
      const transport = parts[2];
      if (!inferred.provider) inferred.provider = transport;
      if (!inferred.surface) inferred.surface = transport;
      if (!inferred.chatType) inferred.chatType = parts[3] || null;
      inferred.scopeId = parts.slice(4).join(':') || null;

      if (!inferred.label) {
        if (transport === 'cron') {
          inferred.label = `Cron 任务 · ${inferred.scopeId || '未命名'}`;
          inferred.chatType = inferred.chatType || 'task';
        } else if (transport) {
          const transportName = transport.charAt(0).toUpperCase() + transport.slice(1);
          inferred.label = inferred.scopeId ? `${transportName} · ${inferred.scopeId}` : transportName;
        }
      }
    }

    return inferred;
  }

  formatSessionState(session = {}) {
    if (session.abortedLastRun) return { text: '异常', tone: 'danger' };
    if ((session.ageMs || 0) < 5 * 60 * 1000) return { text: '活跃', tone: 'ok' };
    if ((session.ageMs || 0) < 30 * 60 * 1000) return { text: '近期活跃', tone: 'warn' };
    return { text: '已静默', tone: 'dim' };
  }

  formatDateTime(ts) {
    if (!ts) return '--';
    const date = new Date(ts);
    if (Number.isNaN(date.getTime())) return '--';
    return date.toLocaleString('zh-CN', { hour12: false });
  }

  shortId(value, max = 12) {
    if (!value) return '--';
    const str = String(value);
    return str.length > max ? `${str.slice(0, max)}…` : str;
  }

  buildSessionModal(session) {
    let modal = document.getElementById('sessionModal');
    if (!modal) {
      document.body.insertAdjacentHTML('beforeend', this.renderSessionModal());
      modal = document.getElementById('sessionModal');
      document.getElementById('sessionModalClose').addEventListener('click', () => this.closeSessionModal());
      document.getElementById('sessionHistoryToggle').addEventListener('click', () => this.toggleSessionHistoryExpanded());
      modal.addEventListener('click', e => { if (e.target === modal) this.closeSessionModal(); });
    }
    const context = this.getSessionContext(session);
    const state = this.formatSessionState(session);
    const isActive = state.tone === 'ok';
    const tokenPct = session.contextTokens ? Math.round((session.totalTokens || 0) / session.contextTokens * 100) : null;
    const sessionTitle = context.label || session.sessionId || '会话详情';
    document.getElementById('sessionModalTitle').textContent = sessionTitle;
    document.getElementById('sessionHeroTitle').textContent = sessionTitle;
    document.getElementById('sessionHeroEyebrow').textContent = `${context.provider || 'unknown'} · ${context.chatType || 'unknown'}`;
    document.getElementById('sessionHeroSubtitle').textContent = `会话 ${this.shortId(session.sessionId, 18)} · 最近活跃 ${this.formatAge(session.ageMs)}`;
    document.getElementById('sessionHeroState').textContent = state.text;
    document.getElementById('sessionHeroState').className = `session-detail-state is-${state.tone}`;
    document.getElementById('sessionDetailHero').className = `session-detail-hero is-${state.tone}`;
    const metaHtml = `
      <div class="session-detail-meta-chip"><span>会话 ID</span><strong title="${this.esc(session.sessionId || '--')}">${this.esc(this.shortId(session.sessionId, 22))}</strong></div>
      <div class="session-detail-meta-chip"><span>渠道</span><strong>${this.esc(context.provider || '--')}</strong></div>
      <div class="session-detail-meta-chip"><span>类型</span><strong>${this.esc(context.chatType || '--')}</strong></div>
      <div class="session-detail-meta-chip"><span>模型</span><strong>${this.esc(session.model || '--')}</strong></div>
      ${tokenPct !== null ? `<div class="session-detail-meta-chip"><span>Token</span><strong>${this.formatTokens(session.totalTokens || 0)} / ${this.formatTokens(session.contextTokens)} (${tokenPct}%)</strong></div>` : ''}
      <div class="session-detail-meta-chip"><span>最后活跃</span><strong>${this.esc(this.formatAge(session.ageMs))}</strong></div>
    `;
    document.getElementById('sessionHeroMeta').innerHTML = metaHtml;
    const infoHtml = `
      <div class="detail-card">
        <div class="detail-label">入口位置</div>
        <div class="detail-value">${this.esc(context.surface || '--')}</div>
        <div class="detail-subvalue">这次会话是从哪个界面或渠道进来的。</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">模型来源</div>
        <div class="detail-value">${this.esc(session.modelProvider || '--')}</div>
        <div class="detail-subvalue">当前这次对话背后用的是哪家模型服务。</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">最近更新时间</div>
        <div class="detail-value">${this.formatDateTime(session.updatedAt)}</div>
        <div class="detail-subvalue">系统最近一次记录这条会话状态的时间。</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">运行状态</div>
        <div class="detail-value">${state.text}</div>
        <div class="detail-subvalue">${session.abortedLastRun ? '最近一次运行存在异常或中断。' : isActive ? '会话近 5 分钟内仍在活动。' : '当前没有检测到持续活跃。'}</div>
      </div>
      <div class="detail-card wide">
        <div class="detail-label">会话唯一标识</div>
        <div class="detail-value">${this.esc(session.key || '--')}</div>
        <div class="detail-subvalue">系统内部用来定位这条会话的 key。</div>
      </div>
      <div class="detail-card wide">
        <div class="detail-label">会话文件路径</div>
        <div class="detail-value">${this.esc(session.sessionFile || '--')}</div>
        <div class="detail-subvalue">本地保存这条会话记录的文件位置。</div>
      </div>
    `;
    document.getElementById('sessionDetailInfo').innerHTML = infoHtml;
    modal.classList.add('active');
    this.loadSessionHistory(session);
    if (window.lucide) window.lucide.createIcons();
  }

  closeSessionModal() {
    this.currentSessionModalKey = null;
    document.getElementById('sessionModal')?.classList.remove('active');
  }

  renderSessionModal() {
    return `
      <div class="overlay-backdrop active" id="sessionModal">
        <div class="session-modal">
          <div class="modal-header">
            <div class="modal-title"><i data-lucide="messages-square"></i><span id="sessionModalTitle">会话详情</span></div>
            <button class="btn btn-secondary" id="sessionModalClose">关闭</button>
          </div>
          <div class="modal-body">
            <div class="session-detail-shell">
              <div class="session-detail-hero" id="sessionDetailHero">
                <div class="session-detail-hero-top">
                  <div class="session-detail-hero-title-wrap">
                    <div class="session-detail-icon"><i data-lucide="messages-square"></i></div>
                    <div>
                      <div class="session-detail-eyebrow" id="sessionHeroEyebrow">--</div>
                      <div class="session-detail-title" id="sessionHeroTitle">--</div>
                      <div class="session-detail-subtitle" id="sessionHeroSubtitle">--</div>
                    </div>
                  </div>
                  <span class="session-detail-state" id="sessionHeroState">--</span>
                </div>
                <div class="session-hero-meta" id="sessionHeroMeta"></div>
              </div>
              <div class="detail-card-group">
                <div class="detail-section-title">会话信息</div>
                <div class="session-detail-grid" id="sessionDetailInfo"></div>
              </div>
              <div class="detail-card-group">
                <div class="detail-section-head">
                  <div class="detail-section-title session-history-title-row">Session History <span class="detail-section-meta" id="sessionHistoryMeta">暂无数据</span></div>
                  <button class="btn btn-secondary session-history-toggle" id="sessionHistoryToggle" hidden>展开全部历史</button>
                </div>
                <div class="session-history-list" id="sessionHistoryList">
                  <div class="mc-loading">加载中...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ---- Utilities ----

  setText(selector, val) {
    this.view?.querySelectorAll(selector).forEach(el => { el.textContent = val; });
  }

  esc(str) {
    if (str == null) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  formatTokens(n) {
    if (!n) return null;
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return String(n);
  }

  formatAge(ms) {
    if (!ms) return 'unknown';
    const sec = Math.floor(ms / 1000);
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m`;
    return `${Math.floor(min / 60)}h`;
  }

  updatePageVisibility() {
    this.view?.querySelectorAll('.module-page').forEach(p => {
      p.classList.toggle('active', p.dataset.page === this.currentPage);
    });
  }
}

window.OpsModule = OpsModule;
