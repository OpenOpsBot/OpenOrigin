class OpsModule {
  constructor() {
    this.view = null;
    this.refreshInterval = null;
    this.sessionsCache = [];
    this.healthData = null;
    this.cronData = null;
    this.modelsData = null;
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
    this.setText('#summarySessionsMeta', sessions[0] ? `${sessions[0].origin?.label || sessions[0].sessionId || '未命名会话'} · ${this.formatAge(sessions[0].ageMs)}` : '暂无活跃会话');
    this.setText('#sessionsPanelCount', active.length);
    this.setText('#summarySessionsCount', active.length);
    this.updateAlertSummary();
    nodes.forEach(el => {
      if (!active.length) {
        el.innerHTML = '<div class="mc-empty">暂无活跃会话</div>';
        return;
      }
      el.innerHTML = active.slice(0, 8).map(session => `
        <div class="mission-tile mission-item-clickable ${session.abortedLastRun ? 'tile-danger' : 'tile-ok'}" data-session-key="${this.esc(session.key || '')}">
          <div class="mission-item-top">
            <div class="mission-item-title-wrap">
              <div class="mission-item-icon"><i data-lucide="scan-search"></i></div>
              <span class="mission-item-title">${this.esc(session.origin?.label || session.sessionId || '未命名会话')}</span>
            </div>
            <span class="mission-item-badge">${this.esc(session.kind || 'unknown')}</span>
          </div>
          <div class="mission-item-meta">${this.esc(session.model || '--')}</div>
          <div class="mission-item-submeta">最近活跃 ${this.esc(this.formatAge(session.ageMs))}</div>
        </div>
      `).join('');
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

  buildSessionModal(session) {
    let modal = document.getElementById('sessionModal');
    if (!modal) {
      document.body.insertAdjacentHTML('beforeend', this.renderSessionModal());
      modal = document.getElementById('sessionModal');
      document.getElementById('sessionModalClose').addEventListener('click', () => this.closeSessionModal());
      modal.addEventListener('click', e => { if (e.target === modal) this.closeSessionModal(); });
    }
    const isActive = session.ageMs < 5 * 60 * 1000;
    const tokenPct = session.contextTokens ? Math.round((session.totalTokens || 0) / session.contextTokens * 100) : null;
    const sessionTitle = session.origin?.label || session.sessionId || '会话详情';
    const stateText = session.abortedLastRun ? '失败' : isActive ? '活跃' : '已完成';
    document.getElementById('sessionModalTitle').textContent = sessionTitle;
    document.getElementById('sessionHeroTitle').textContent = sessionTitle;
    document.getElementById('sessionHeroEyebrow').textContent = `${this.esc(session.origin?.provider || 'unknown')} · ${this.esc(session.origin?.chatType || session.kind || '--')}`;
    document.getElementById('sessionHeroState').textContent = stateText;
    document.getElementById('sessionHeroState').className = `session-state-badge state-${session.abortedLastRun ? 'danger' : isActive ? 'ok' : 'dim'}`;
    document.getElementById('sessionHeroIcon').className = `session-hero-icon ${session.abortedLastRun ? 'danger' : isActive ? 'ok' : 'dim'}`;
    const metaHtml = `
      <div class="session-detail-meta-chip emphasis"><span>Token 使用</span><strong>${tokenPct !== null ? `${this.formatTokens(session.totalTokens || 0)} / ${this.formatTokens(session.contextTokens)} (${tokenPct}%)` : '--'}</strong></div>
      <div class="session-detail-meta-chip"><span>最后活跃</span><strong>${this.esc(this.formatAge(session.ageMs))}</strong></div>
      <div class="session-detail-meta-chip"><span>最后更新</span><strong>${session.updatedAt ? new Date(session.updatedAt).toLocaleString('zh-CN') : '--'}</strong></div>
      <div class="session-detail-meta-chip"><span>运行状态</span><strong>${stateText}</strong></div>
    `;
    document.getElementById('sessionHeroMeta').innerHTML = metaHtml;
    const overviewHtml = `
      <div class="detail-card">
        <div class="detail-label">会话 ID</div>
        <div class="detail-value mono">${this.esc(session.sessionId || '--')}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Session Key</div>
        <div class="detail-value mono">${this.esc(session.key || '--')}</div>
      </div>
      <div class="detail-card compact">
        <div class="detail-label">渠道</div>
        <div class="detail-value">${this.esc(session.origin?.provider || '--')}</div>
      </div>
      <div class="detail-card compact">
        <div class="detail-label">Surface</div>
        <div class="detail-value">${this.esc(session.origin?.surface || '--')}</div>
      </div>
      <div class="detail-card compact">
        <div class="detail-label">类型</div>
        <div class="detail-value">${this.esc(session.origin?.chatType || session.kind || '--')}</div>
      </div>
      <div class="detail-card compact">
        <div class="detail-label">模型</div>
        <div class="detail-value">${this.esc(session.model || '--')}</div>
        <div class="detail-subvalue">${this.esc(session.modelProvider || '--')}</div>
      </div>
    `;
    const statusHtml = `
      <div class="detail-card compact ${session.abortedLastRun ? 'danger' : isActive ? 'ok' : ''}">
        <div class="detail-label">执行状态</div>
        <div class="detail-value">${stateText}</div>
        <div class="detail-subvalue">最后活跃 ${this.formatAge(session.ageMs)}</div>
      </div>
      <div class="detail-card compact ${tokenPct !== null && tokenPct >= 80 ? 'danger' : tokenPct !== null && tokenPct >= 50 ? 'warning' : 'ok'}">
        <div class="detail-label">Token 占用</div>
        <div class="detail-value">${tokenPct !== null ? `${tokenPct}%` : '--'}</div>
        <div class="detail-subvalue">${tokenPct !== null ? `${this.formatTokens(session.totalTokens || 0)} / ${this.formatTokens(session.contextTokens)}` : '暂无数据'}</div>
      </div>
    `;
    document.getElementById('sessionOverviewGrid').innerHTML = overviewHtml;
    document.getElementById('sessionStatusGrid').innerHTML = statusHtml;
    this.loadSessionHistory(session.key, session.sessionFile);
    if (window.lucide) window.lucide.createIcons();
    modal.classList.add('active');
  }

  async loadSessionHistory(key, sessionFile) {
    const container = document.getElementById('sessionHistoryList');
    if (!container) return;
    container.innerHTML = '<div class="mc-loading">加载中...</div>';
    try {
      const resp = await fetch(`/api/session-history?key=${encodeURIComponent(key)}`);
      const data = await resp.json();
      if (data.error || !data.history) {
        container.innerHTML = '<div class="mc-empty">暂无历史记录</div>';
        return;
      }
      if (!data.history.length) {
        container.innerHTML = '<div class="mc-empty">暂无历史记录</div>';
        return;
      }
      const reverse = [...data.history].reverse().slice(0, 30);
      container.innerHTML = reverse.map(msg => {
        const ts = msg.timestamp ? new Date(msg.timestamp).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '--';
        const roleLabel = { user: '用户', assistant: '小猿', system: '系统', unknown: '未知' }[msg.role] || msg.role;
        const roleClass = { user: 'role-user', assistant: 'role-assistant', system: 'role-system', unknown: 'role-unknown' }[msg.role] || 'role-unknown';
        const content = this.esc((msg.content || '').slice(0, 200));
        const truncated = content.length >= 200 ? content + '…' : content;
        return `<div class="history-item ${roleClass}"><div class="history-item-header"><span class="history-role">${roleLabel}</span><span class="history-time">${ts}</span></div><div class="history-content">${truncated}</div></div>`;
      }).join('');
    } catch (e) {
      container.innerHTML = '<div class="mc-empty">加载失败</div>';
    }
  }

  closeSessionModal() {
    document.getElementById('sessionModal')?.classList.remove('active');
  }

  renderSessionModal() {
    return `
      <div class="overlay-backdrop active" id="sessionModal">
        <div class="session-modal session-modal-refined">
          <div class="modal-header refined">
            <div class="modal-title"><i data-lucide="messages-square"></i><span id="sessionModalTitle">会话详情</span></div>
            <button class="btn btn-secondary" id="sessionModalClose">关闭</button>
          </div>
          <div class="session-detail-shell">
            <div class="session-detail-hero refined">
              <div class="session-hero-top refined">
                <div class="session-hero-title-wrap">
                  <div class="session-hero-icon" id="sessionHeroIcon"><i data-lucide="messages-square"></i></div>
                  <div>
                    <div class="session-hero-eyebrow" id="sessionHeroEyebrow">--</div>
                    <div class="session-hero-title" id="sessionHeroTitle">--</div>
                  </div>
                </div>
                <span class="session-state-badge" id="sessionHeroState">--</span>
              </div>
              <div class="session-hero-meta" id="sessionHeroMeta"></div>
            </div>
            <div class="session-detail-section">
              <div class="detail-section-title">会话概览</div>
              <div class="session-detail-grid session-overview-grid" id="sessionOverviewGrid"></div>
            </div>
            <div class="session-detail-section">
              <div class="detail-section-title">状态与负载</div>
              <div class="session-detail-grid session-status-grid" id="sessionStatusGrid"></div>
            </div>
            <div class="session-detail-section">
              <div class="detail-section-title">最近消息</div>
              <div class="session-history-list" id="sessionHistoryList">
                <div class="mc-loading">加载中...</div>
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
