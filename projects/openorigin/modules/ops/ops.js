class OpsModule {
  constructor() {
    this.view = null;
    this.refreshInterval = null;
    this.sessionsCache = [];
    this.clientOpsData = null;
    this.healthData = null;
    this.cronData = null;
    this.currentPage = 'dashboard';
  }

  show(pageKey = 'dashboard') {
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

  render() {
    this.view = document.createElement('div');
    this.view.className = 'module-view module-ops active';
    this.view.id = 'opsView';
    this.view.innerHTML = `
      <div class="module-page ${this.currentPage === 'dashboard' ? 'active' : ''}" data-page="dashboard">
        <div class="dashboard ops-dashboard">
          ${this.renderClientOpsHeader()}
          ${this.renderStageLanes()}
          ${this.renderDeliverablesTable()}
          ${this.renderOpsStats(this.clientOpsData || {})}
          ${this.renderSeatOverview()}
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
              <div class="mission-hero-copy">统一查看模型、活跃会话与定时任务状态。</div>
              ${this.renderMissionSummary()}
            </div>
          </div>
          ${this.renderActiveSessionsPanel()}
          ${this.renderModelsPanel()}
          ${this.renderCronPanel()}
        </div>
      </div>

      <div class="module-page ${this.currentPage === 'deliverables' ? 'active' : ''}" data-page="deliverables">
        <div class="dashboard single-page-dashboard ops-deliverables-dashboard">
          <div class="panel">
            <div class="panel-header">
              <i data-lucide="file-check"></i>
              交付追踪
            </div>
            <div class="panel-body">
              <div class="module-empty-copy">这里集中查看可交付成果、SLA 状态和负责人。</div>
            </div>
          </div>
          ${this.renderDeliverablesTable()}
        </div>
      </div>

      ${this.renderSessionModal()}
    `;
    document.getElementById('mainContent').appendChild(this.view);
    this.bindEvents();
    if (window.lucide) window.lucide.createIcons();
  }

  updatePageVisibility() {
    if (!this.view) return;
    this.view.querySelectorAll('.module-page').forEach(page => {
      page.classList.toggle('active', page.dataset.page === this.currentPage);
    });
  }

  renderClientOpsHeader() {
    return `
      <div class="panel ops-clients-header">
        <div class="panel-header">
          <i data-lucide="users"></i>
          客户工作台
        </div>
        <div class="panel-body">
          <div class="clients-row" id="clientsRow">
            <div class="mc-loading">加载中...</div>
          </div>
        </div>
      </div>
    `;
  }

  renderStageLanes() {
    const stages = [
      { key: 'intake', label: '需求接收', color: '#a78bfa' },
      { key: 'scoping', label: '范围界定', color: '#818cf8' },
      { key: 'execution', label: '执行中', color: '#ffd89a' },
      { key: 'review', label: '审核', color: '#a3e635' },
      { key: 'delivered', label: '已交付', color: '#06b6d4' },
      { key: 'renewal', label: '续约', color: '#22c55e' }
    ];
    return `
      <div class="panel stage-lanes-panel">
        <div class="panel-header">
          <i data-lucide="git-branch"></i>
          任务流程
        </div>
        <div class="panel-body">
          <div class="stage-lanes" id="stageLanes">
            ${stages.map(s => `
              <div class="stage-lane" data-stage="${s.key}">
                <div class="stage-lane-label" style="color:${s.color}">${s.label}</div>
                <div class="stage-lane-tasks" id="lane_${s.key}">
                  <div class="lane-empty">--</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  renderDeliverablesTable() {
    return `
      <div class="panel deliverables-panel">
        <div class="panel-header">
          <i data-lucide="file-check"></i>
          可交付成果追踪
        </div>
        <div class="panel-body">
          <div class="deliverables-table-wrap">
            <table class="deliverables-table" id="deliverablesTable">
              <thead>
                <tr>
                  <th>客户</th>
                  <th>可交付成果</th>
                  <th>负责人</th>
                  <th>SLA</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody id="deliverablesBody">
                <tr><td colspan="5" class="mc-loading">加载中...</td></tr>
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
              <div class="ops-stat-value" id="statActiveClients">--</div>
              <div class="ops-stat-label">活跃客户</div>
            </div>
            <div class="ops-stat-card">
              <div class="ops-stat-value" id="statTasksDueSoon">--</div>
              <div class="ops-stat-label">本周到期</div>
            </div>
            <div class="ops-stat-card warning">
              <div class="ops-stat-value" id="statHighPriority">--</div>
              <div class="ops-stat-label">高优先级</div>
            </div>
            <div class="ops-stat-card danger">
              <div class="ops-stat-value" id="statBlocked">--</div>
              <div class="ops-stat-label">被阻塞</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderSeatOverview() {
    return `
      <div class="panel seat-overview-panel">
        <div class="panel-header">
          <i data-lucide="contact"></i>
          坐席概览
        </div>
        <div class="panel-body">
          <div class="seat-grid" id="seatGrid">
            <div class="mc-loading">加载中...</div>
          </div>
        </div>
      </div>
    `;
  }

  renderSessionModal() {
    return `
      <div class="overlay-backdrop" id="sessionModalBackdrop">
        <div class="session-modal">
          <div class="modal-header">
            <div class="modal-title"><i data-lucide="messages-square"></i><span id="sessionModalTitle">会话详情</span></div>
            <button class="btn btn-secondary" id="sessionModalClose">关闭</button>
          </div>
          <div class="modal-body">
            <div id="sessionModalContent" class="session-modal-content"></div>
          </div>
        </div>
      </div>
    `;
  }

  async refreshAll() {
    await Promise.all([
      this.loadClientOps(),
      this.loadSessions(),
      this.loadHealth(),
      this.loadModels(),
      this.loadCron()
    ]);
  }

  async loadClientOps() {
    try {
      const resp = await fetch('/api/client-ops');
      const data = await resp.json();
      if (data.error) return;
      this.clientOpsData = data;
      this.renderClients(data.clients || []);
      this.renderStageLanesData(data.tasks || []);
      this.renderDeliverables(data.deliverables || []);
      this.renderOpsStats(data);
      this.renderSeats(data.seats || []);
    } catch (e) {}
  }

  renderClients(clients) {
    const nodes = this.view?.querySelectorAll('#clientsRow') || [];
    nodes.forEach(el => {
      if (clients.length === 0) {
        el.innerHTML = '<div class="mc-empty">暂无客户</div>';
        return;
      }
      el.innerHTML = clients.map(c => `
        <div class="client-chip">
          <span class="client-chip-name">${this.esc(c.name)}</span>
          <span class="client-chip-type">${this.esc(c.serviceType)}</span>
        </div>
      `).join('');
    });
  }

  renderStageLanesData(tasks) {
    const laneNodes = this.view?.querySelectorAll('[id^="lane_"]') || [];
    laneNodes.forEach(lane => {
      const stage = lane.id.replace('lane_', '');
      const filtered = tasks.filter(t => t.stage === stage);
      if (filtered.length === 0) {
        lane.innerHTML = '<div class="lane-empty">无任务</div>';
        return;
      }
      lane.innerHTML = filtered.map(t => {
        const client = this.clientOpsData?.clients?.find(c => c.id === t.clientId);
        const prio = t.priority || 'medium';
        const hasBlocker = t.blockers && t.blockers.length > 0;
        return `
          <div class="task-card ${hasBlocker ? 'task-card-blocked' : ''}">
            <div class="task-card-client">${this.esc(client?.name || t.clientId)}</div>
            <div class="task-card-title">${this.esc(t.title)}</div>
            <div class="task-card-meta">
              <span class="task-priority-badge prio-${prio}">${prio}</span>
              <span class="task-due-date ${this.isDueSoon(t.dueDate) ? 'due-soon' : ''}">${this.esc(t.dueDate || '--')}</span>
            </div>
            ${hasBlocker ? '<div class="task-blocker-tag">阻塞</div>' : ''}
          </div>
        `;
      }).join('');
    });
  }

  renderDeliverables(deliverables) {
    const bodyNodes = this.view?.querySelectorAll('#deliverablesBody') || [];
    bodyNodes.forEach(tbody => {
      if (deliverables.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="mc-empty">无可交付成果</td></tr>';
        return;
      }
      const SL = {
        not_started: '未开始', drafting: '起草中',
        in_review: '审核中', approved: '已批准',
        delivered: '已交付', blocked: '被阻塞'
      };
      tbody.innerHTML = deliverables.map(d => {
        const client = this.clientOpsData?.clients?.find(c => c.id === d.clientId);
        const isOverdue = d.slaDate && new Date(d.slaDate) < new Date();
        const isNear = this.isDueSoon(d.slaDate);
        return `
          <tr>
            <td><span class="deliv-client">${this.esc(client?.name || d.clientId)}</span></td>
            <td><span class="deliv-name">${this.esc(d.name)}</span></td>
            <td><span class="deliv-owner">${this.esc(d.ownerId)}</span></td>
            <td><span class="deliv-sla ${isOverdue ? 'sla-overdue' : isNear ? 'sla-near' : ''}">${this.esc(d.slaDate || '--')}</span></td>
            <td><span class="deliv-status status-${d.status}">${SL[d.status] || d.status}</span></td>
          </tr>
        `;
      }).join('');
    });
  }

  renderOpsStats(data = {}) {
    const tasks = data.tasks || [];
    const clients = data.clients || [];
    const now = new Date();
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const ac = clients.filter(c => c.status === 'active').length;
    const ds = tasks.filter(t => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d >= now && d <= weekEnd;
    }).length;
    const hp = tasks.filter(t => t.priority === 'high' || t.priority === 'critical').length;
    const bl = tasks.filter(t => t.blockers && t.blockers.length > 0).length;

    const setText = (selector, val) => {
      this.view?.querySelectorAll(selector).forEach(el => {
        el.textContent = val;
      });
    };

    setText('#statActiveClients', ac);
    setText('#statTasksDueSoon', ds);
    setText('#statHighPriority', hp);
    setText('#statBlocked', bl);
  }

  renderSeats(seats) {
    const nodes = this.view?.querySelectorAll('#seatGrid') || [];
    nodes.forEach(el => {
      if (!seats || seats.length === 0) {
        el.innerHTML = '<div class="mc-empty">暂无坐席数据</div>';
        return;
      }
      el.innerHTML = seats.map(s => `
        <div class="seat-card">
          <div class="seat-card-top">
            <span class="seat-name">${this.esc(s.name)}</span>
            <span class="status-dot ${s.sessionState === 'online' ? 'online' : 'offline'}"></span>
          </div>
          <div class="seat-metrics">
            <div class="seat-metric">
              <span class="seat-metric-val">${s.activeTasks}</span>
              <span class="seat-metric-key">活跃任务</span>
            </div>
            <div class="seat-metric ${s.blockedTasks > 0 ? 'warn' : ''}">
              <span class="seat-metric-val">${s.blockedTasks}</span>
              <span class="seat-metric-key">被阻塞</span>
            </div>
            <div class="seat-metric ${s.overdueDeliverables > 0 ? 'warn' : ''}">
              <span class="seat-metric-val">${s.overdueDeliverables}</span>
              <span class="seat-metric-key">SLA逾期</span>
            </div>
          </div>
        </div>
      `).join('');
    });
  }

  async loadSessions() {
    try {
      const resp = await fetch('/api/sessions');
      const data = await resp.json();
      if (data.error) {
        this.sessionsCache = [];
        this.renderActiveSessions([]);
        return;
      }
      this.sessionsCache = data.sessions || [];
      this.renderActiveSessions(this.sessionsCache);
    } catch (e) {
      this.sessionsCache = [];
      this.renderActiveSessions([]);
    }
  }

  async loadHealth() {
    try {
      const resp = await fetch('/api/health');
      const data = await resp.json();
      this.healthData = data;
      this.updateAlertSummary();
    } catch (e) {
      this.healthData = { error: 'load_error' };
      this.updateAlertSummary();
    }
  }

  async loadModels() {
    try {
      const resp = await fetch('/api/models');
      const data = await resp.json();
      this.renderModels(data);
    } catch (e) {
      this.renderModels({ error: 'load_error' });
    }
  }

  async loadCron() {
    try {
      const resp = await fetch('/api/cron');
      const data = await resp.json();
      this.cronData = data;
      this.renderCronJobs(data);
    } catch (e) {
      this.cronData = { error: 'load_error' };
      this.renderCronJobs(this.cronData);
    }
  }

  renderMissionSummary() {
    return `
      <div class="mission-summary-grid">
        <div class="mission-summary-card summary-models">
          <div class="mission-summary-top">
            <div class="mission-summary-icon"><i data-lucide="cpu"></i></div>
            <div class="mission-summary-label">模型</div>
          </div>
          <div class="mission-summary-value" id="summaryModelsCount">--</div>
          <div class="mission-summary-meta" id="summaryModelsMeta">加载中...</div>
        </div>
        <div class="mission-summary-card summary-sessions">
          <div class="mission-summary-top">
            <div class="mission-summary-icon"><i data-lucide="activity"></i></div>
            <div class="mission-summary-label">活跃会话</div>
          </div>
          <div class="mission-summary-value" id="summarySessionsCount">--</div>
          <div class="mission-summary-meta" id="summarySessionsMeta">加载中...</div>
        </div>
        <div class="mission-summary-card summary-cron">
          <div class="mission-summary-top">
            <div class="mission-summary-icon"><i data-lucide="calendar-clock"></i></div>
            <div class="mission-summary-label">定时任务</div>
          </div>
          <div class="mission-summary-value" id="summaryCronCount">--</div>
          <div class="mission-summary-meta" id="summaryCronMeta">加载中...</div>
        </div>
        <div class="mission-summary-card summary-alerts" id="summaryAlertsCard">
          <div class="mission-summary-top">
            <div class="mission-summary-icon"><i data-lucide="triangle-alert"></i></div>
            <div class="mission-summary-label">异常提醒</div>
          </div>
          <div class="mission-summary-value" id="summaryAlertsCount">--</div>
          <div class="mission-summary-meta" id="summaryAlertsMeta">加载中...</div>
        </div>
      </div>
    `;
  }

  renderModelsPanel() {
    return `
      <div class="panel mission-panel">
        <div class="panel-header">
          <i data-lucide="cpu"></i>
          模型
        </div>
        <div class="panel-body">
          <div class="mission-grid" id="modelsList">
            <div class="mc-loading">加载中...</div>
          </div>
        </div>
      </div>
    `;
  }

  renderActiveSessionsPanel() {
    return `
      <div class="panel mission-panel mission-sessions-panel">
        <div class="panel-header">
          <i data-lucide="activity"></i>
          活跃会话
        </div>
        <div class="panel-body">
          <div class="mission-grid" id="activeSessionsList">
            <div class="mc-loading">加载中...</div>
          </div>
        </div>
      </div>
    `;
  }

  renderCronPanel() {
    return `
      <div class="panel mission-panel">
        <div class="panel-header">
          <i data-lucide="calendar-clock"></i>
          定时任务
        </div>
        <div class="panel-body">
          <div class="mission-grid" id="cronJobsList">
            <div class="mc-loading">加载中...</div>
          </div>
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
      el.innerHTML = models.map(model => `
        <div class="mission-tile ${model.statusClass === 'offline' ? 'tile-danger' : 'tile-ok'}">
          <div class="mission-item-top">
            <div class="mission-item-title-wrap">
              <div class="mission-item-icon"><i data-lucide="cpu"></i></div>
              <span class="mission-item-title">${this.esc(model.name)}</span>
            </div>
            <span class="feature-status ${model.statusClass}">${this.esc(model.statusText)}</span>
          </div>
          <div class="mission-item-meta">${this.esc(model.meta)}</div>
          <div class="mission-item-submeta">状态通道 · ${this.esc(model.statusText)}</div>
        </div>
      `).join('');
    });
  }

  extractModels(data = {}) {
    if (!Array.isArray(data.models)) return [];
    return data.models.map(item => ({
      name: `${item.provider || '?'} / ${item.model || '?'}`,
      statusText: item.sessionCount > 0 ? '活跃' : '空闲',
      statusClass: item.sessionCount > 0 ? 'coming-soon' : 'offline',
      meta: `${item.sessionCount || 0} 个会话 · 上下文 ${item.contextTokens?.join(', ') || '未知'} · 数据源 sessions.json`
    }));
  }

  renderActiveSessions(sessions = []) {
    const nodes = this.view?.querySelectorAll('#activeSessionsList') || [];
    this.setText('#summarySessionsCount', sessions.length);
    this.setText('#summarySessionsMeta', sessions[0] ? `${sessions[0].origin?.label || sessions[0].sessionId || '未命名会话'} · ${this.formatAge(sessions[0].ageMs)}` : '暂无活跃会话');
    this.updateAlertSummary();
    nodes.forEach(el => {
      if (!sessions.length) {
        el.innerHTML = '<div class="mc-empty">暂无活跃会话</div>';
        return;
      }
      el.innerHTML = sessions.slice(0, 8).map(session => `
        <div class="mission-tile mission-item-clickable ${session.abortedLastRun ? 'tile-danger' : 'tile-ok'}" data-session-key="${this.esc(session.key || '')}">
          <div class="mission-item-top">
            <div class="mission-item-title-wrap">
              <div class="mission-item-icon"><i data-lucide="scan-search"></i></div>
              <span class="mission-item-title">${this.esc(session.origin?.label || session.sessionId || '未命名会话')}</span>
            </div>
            <span class="mission-item-badge">${this.esc(session.kind || 'unknown')}</span>
          </div>
          <div class="mission-item-meta">${this.esc(`${session.modelProvider || '?'} / ${session.model || '?'}`)}</div>
          <div class="mission-item-submeta-row">
            <span class="mission-item-submeta">最近活跃 ${this.esc(this.formatAge(session.ageMs))}</span>
            <span class="mission-item-submeta">${this.esc(session.abortedLastRun ? '异常中断' : '运行正常')}</span>
          </div>
        </div>
      `).join('');
    });
  }

  renderCronJobs(data = {}) {
    const nodes = this.view?.querySelectorAll('#cronJobsList') || [];
    const jobs = Array.isArray(data.jobs) ? data.jobs : Array.isArray(data) ? data : [];
    this.setText('#summaryCronCount', jobs.length);
    this.setText('#summaryCronMeta', data.error === 'pairing_required'
      ? '等待配对'
      : jobs[0]
        ? `${jobs[0].name || jobs[0].id || '未命名任务'} · ${jobs[0].enabled === false ? '停用' : '启用'}`
        : (data.error ? '暂不可用' : '暂无定时任务'));
    this.updateAlertSummary();
    nodes.forEach(el => {
      if (data.error === 'pairing_required') {
        el.innerHTML = '<div class="mc-empty">当前未完成配对，暂时无法读取定时任务。</div>';
        return;
      }
      if (!jobs.length) {
        el.innerHTML = `<div class="mc-empty">${data.error ? '定时任务数据暂不可用' : '暂无定时任务'}</div>`;
        return;
      }
      el.innerHTML = jobs.slice(0, 8).map(job => `
        <div class="mission-tile ${job.enabled === false ? 'tile-warning' : 'tile-ok'}">
          <div class="mission-item-top">
            <div class="mission-item-title-wrap">
              <div class="mission-item-icon"><i data-lucide="clock-3"></i></div>
              <span class="mission-item-title">${this.esc(job.name || job.id || '未命名任务')}</span>
            </div>
            <span class="mission-item-badge">${this.esc(job.enabled === false ? '停用' : '启用')}</span>
          </div>
          <div class="mission-item-meta">${this.esc(job.schedule?.kind || job.scheduleKind || '未知计划')}</div>
          <div class="mission-item-submeta">投递目标 · ${this.esc(job.sessionTarget || '未标注')}</div>
        </div>
      `).join('');
    });
  }

  updateAlertSummary() {
    const alerts = [];
    const models = this.extractModels(this.healthData || {});
    if ((this.healthData && this.healthData.error) || !models.length) alerts.push('模型');
    if (!this.sessionsCache.length) alerts.push('会话');
    if (this.cronData?.error === 'pairing_required') alerts.push('定时任务配对');
    else if (this.cronData?.error) alerts.push('定时任务');
    this.setText('#summaryAlertsCount', alerts.length);
    this.setText('#summaryAlertsMeta', alerts.length ? `关注 ${alerts.join('、')}` : '当前一切正常');
    this.view?.querySelectorAll('#summaryAlertsCard').forEach(el => {
      el.classList.toggle('has-alert', alerts.length > 0);
      el.classList.toggle('is-clear', alerts.length === 0);
    });
  }

  setText(selector, value) {
    this.view?.querySelectorAll(selector).forEach(el => {
      el.textContent = value;
    });
  }

  bindEvents() {
    const closeBtn = this.view.querySelector('#sessionModalClose');
    const backdrop = this.view.querySelector('#sessionModalBackdrop');
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeSessionModal());
    if (backdrop) backdrop.addEventListener('click', e => {
      if (e.target === backdrop) this.closeSessionModal();
    });
    this.view.addEventListener('click', e => {
      const card = e.target.closest('[data-session-key]');
      if (!card) return;
      const sessionKey = card.dataset.sessionKey;
      const session = this.sessionsCache.find(item => item.key === sessionKey);
      if (session) this.openSessionModal(session);
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.closeSessionModal();
    });
  }

  openSessionModal(session) {
    const backdrop = this.view.querySelector('#sessionModalBackdrop');
    const title = this.view.querySelector('#sessionModalTitle');
    const content = this.view.querySelector('#sessionModalContent');
    const sourceLabel = session.origin?.label || session.key || '未知来源';
    const modelLabel = `${session.modelProvider || '?'}/${session.model || '?'}`;
    const sessionState = session.abortedLastRun ? '异常中断' : '运行正常';
    title.textContent = '会话详情';
    content.innerHTML = `
      <div class="session-detail-shell">
        <div class="session-detail-hero ${session.abortedLastRun ? 'is-danger' : 'is-ok'}">
          <div class="session-detail-hero-top">
            <div class="session-detail-hero-title-wrap">
              <div class="session-detail-icon"><i data-lucide="messages-square"></i></div>
              <div>
                <div class="session-detail-eyebrow">SESSION OVERVIEW</div>
                <div class="session-detail-title mono">${this.esc(session.sessionId || 'N/A')}</div>
              </div>
            </div>
            <div class="session-detail-state ${session.abortedLastRun ? 'is-danger' : 'is-ok'}">${this.esc(sessionState)}</div>
          </div>
          <div class="session-detail-hero-meta">
            <div class="session-detail-meta-chip"><span>模型</span><strong>${this.esc(modelLabel)}</strong></div>
            <div class="session-detail-meta-chip"><span>类型</span><strong>${this.esc(session.kind || 'unknown')}</strong></div>
            <div class="session-detail-meta-chip"><span>最后活跃</span><strong>${this.esc(this.formatAge(session.ageMs))}</strong></div>
          </div>
        </div>

        <div class="session-detail-grid">
          <div class="detail-card">
            <div class="detail-label">Session ID</div>
            <div class="detail-value mono">${this.esc(session.sessionId || 'N/A')}</div>
            <div class="detail-subvalue">内部唯一标识</div>
          </div>
          <div class="detail-card">
            <div class="detail-label">模型通道</div>
            <div class="detail-value">${this.esc(modelLabel)}</div>
            <div class="detail-subvalue">当前执行模型</div>
          </div>
          <div class="detail-card">
            <div class="detail-label">活跃类型</div>
            <div class="detail-value">${this.esc(session.kind || 'unknown')}</div>
            <div class="detail-subvalue">会话表面类型</div>
          </div>
          <div class="detail-card">
            <div class="detail-label">最近活跃</div>
            <div class="detail-value">${this.esc(this.formatAge(session.ageMs))}</div>
            <div class="detail-subvalue">最近一次更新</div>
          </div>
          <div class="detail-card wide">
            <div class="detail-label">来源</div>
            <div class="detail-value">${this.esc(sourceLabel)}</div>
            <div class="detail-subvalue">来源通道 / 路由键</div>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeSessionModal() {
    if (!this.view) return;
    const b = this.view.querySelector('#sessionModalBackdrop');
    if (b) b.classList.remove('active');
    document.body.style.overflow = '';
  }

  formatAge(ms) {
    if (!ms) return 'unknown';
    const sec = Math.floor(ms / 1000);
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m`;
    return `${Math.floor(min / 60)}h`;
  }

  isDueSoon(dateStr) {
    if (!dateStr) return false;
    const diff = new Date(dateStr) - new Date();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
  }

  esc(v) {
    return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

window.OpsModule = OpsModule;
