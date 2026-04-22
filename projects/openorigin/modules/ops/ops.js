class OpsModule {
  constructor() {
    this.view = null;
    this.refreshInterval = null;
    this.sessionsCache = [];
    this.clientOpsData = null;
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
      <div class="section-title">运营模块</div>

      <div class="module-page ${this.currentPage === 'dashboard' ? 'active' : ''}" data-page="dashboard">
        <div class="dashboard ops-dashboard">
          ${this.renderClientOpsHeader()}
          ${this.renderStageLanes()}
          ${this.renderDeliverablesTable()}
          ${this.renderOpsStats()}
          ${this.renderSeatOverview()}
        </div>
      </div>

      <div class="module-page ${this.currentPage === 'tasks' ? 'active' : ''}" data-page="tasks">
        <div class="dashboard ops-dashboard ops-tasks-dashboard">
          <div class="panel stage-lanes-panel ops-page-full">
            <div class="panel-header">
              <i data-lucide="clipboard-check"></i>
              任务管理
            </div>
            <div class="panel-body">
              <div class="module-empty-copy">这里集中展示运营任务流转、优先级和阻塞项。当前已接入下方任务流程看板与交付追踪。</div>
              <div class="tasks-page-stack">
                ${this.renderStageLanes()}
                ${this.renderDeliverablesTable()}
              </div>
            </div>
          </div>
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
    await Promise.all([this.loadClientOps(), this.loadSessions()]);
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
    const el = document.getElementById('clientsRow');
    if (!el) return;
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

  renderOpsStats(data) {
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
    const el = document.getElementById('seatGrid');
    if (!el) return;
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
  }

  async loadSessions() {
    try {
      const resp = await fetch('/api/sessions');
      const data = await resp.json();
      if (data.error) return;
      this.sessionsCache = data.sessions || [];
    } catch (e) {}
  }

  bindEvents() {
    const closeBtn = this.view.querySelector('#sessionModalClose');
    const backdrop = this.view.querySelector('#sessionModalBackdrop');
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeSessionModal());
    if (backdrop) backdrop.addEventListener('click', e => {
      if (e.target === backdrop) this.closeSessionModal();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.closeSessionModal();
    });
  }

  openSessionModal(session) {
    const backdrop = this.view.querySelector('#sessionModalBackdrop');
    const title = this.view.querySelector('#sessionModalTitle');
    const content = this.view.querySelector('#sessionModalContent');
    title.textContent = session.origin?.label || session.sessionId || '会话详情';
    content.innerHTML = `
      <div class="detail-grid">
        <div class="detail-card"><div class="detail-label">Session ID</div><div class="detail-value mono">${this.esc(session.sessionId || 'N/A')}</div></div>
        <div class="detail-card"><div class="detail-label">模型</div><div class="detail-value">${this.esc(`${session.modelProvider || '?'}/${session.model || '?'}`)}</div></div>
        <div class="detail-card"><div class="detail-label">活跃类型</div><div class="detail-value">${this.esc(session.kind || 'unknown')}</div></div>
        <div class="detail-card"><div class="detail-label">最后活跃</div><div class="detail-value">${this.esc(this.formatAge(session.ageMs))}</div></div>
        <div class="detail-card wide"><div class="detail-label">来源</div><div class="detail-value">${this.esc(session.origin?.label || session.key)}</div></div>
      </div>
    `;
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
