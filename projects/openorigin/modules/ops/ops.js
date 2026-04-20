class OpsModule {
  constructor() {
    this.view = null;
    this.refreshInterval = null;
    this.sessionsCache = [];
  }

  show() {
    if (!this.view) {
      this.render();
    }
    this.view.classList.add('active');
    this.startAutoRefresh();
  }

  hide() {
    if (this.view) this.view.classList.remove('active');
    this.stopAutoRefresh();
  }

  startAutoRefresh() {
    this.stopAutoRefresh();
    this.refreshMissionControl();
    this.refreshInterval = setInterval(() => this.refreshMissionControl(), 30000);
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
      <div class="dashboard ops-dashboard">
        ${this.renderMissionControl()}
      </div>
      ${this.renderSessionModal()}
    `;
    document.getElementById('mainContent').appendChild(this.view);
    this.bindEvents();
    if (window.lucide) window.lucide.createIcons();
  }

  bindEvents() {
    const previews = this.view.querySelector('#mcSessionPreviews');
    const closeBtn = this.view.querySelector('#sessionModalClose');
    const backdrop = this.view.querySelector('#sessionModalBackdrop');

    previews.addEventListener('click', (e) => {
      const card = e.target.closest('.session-preview-card');
      if (!card) return;
      const key = card.dataset.sessionKey;
      const session = this.sessionsCache.find(s => s.key === key);
      if (session) this.openSessionModal(session);
    });

    closeBtn.addEventListener('click', () => this.closeSessionModal());
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) this.closeSessionModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeSessionModal();
    });
  }

  renderMissionControl() {
    return `
      <div class="panel mission-control mission-control-main">
        <div class="panel-header">
          <i data-lucide="activity"></i>
          任务控制中心
        </div>
        <div class="panel-body">
          <div class="mc-top-grid">
            <div class="mc-section model-focus-card">
              <div class="mc-section-title">当前模型</div>
              <div class="mc-model-info" id="mcModelInfo">
                <span class="status-dot online"></span>
                <span id="currentModel">--</span>
              </div>
            </div>
            <div class="mc-section model-focus-card">
              <div class="mc-section-title">多模型预览</div>
              <div class="model-preview-grid">
                <div class="inline-model-card live">
                  <div class="inline-model-name">MiniMax M2.7</div>
                  <div class="inline-model-state online">在线</div>
                </div>
                <div class="inline-model-card offline-demo">
                  <div class="inline-model-name">Codex 5.4</div>
                  <div class="inline-model-state offline">离线</div>
                </div>
              </div>
            </div>
          </div>

          <div class="mc-section">
            <div class="mc-section-title">活跃会话</div>
            <div class="mc-sessions" id="mcSessions">
              <div class="mc-loading">加载中...</div>
            </div>
          </div>

          <div class="mc-section">
            <div class="mc-section-title">会话预览（点击展开）</div>
            <div class="mc-session-previews" id="mcSessionPreviews">
              <div class="mc-empty">--</div>
            </div>
          </div>
        </div>
      </div>

      <div class="panel cron-health">
        <div class="panel-header">
          <i data-lucide="clock"></i>
          定时任务健康状态
        </div>
        <div class="panel-body">
          <div class="cron-list" id="cronList">
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

  async refreshMissionControl() {
    await Promise.all([this.loadSessionsWithModel(), this.loadCronHealth()]);
  }

  async loadSessionsWithModel() {
    const modelEl = document.getElementById('currentModel');
    const sessionsEl = document.getElementById('mcSessions');
    const previewsEl = document.getElementById('mcSessionPreviews');
    if (!sessionsEl || !previewsEl) return;

    try {
      const resp = await fetch('/api/sessions');
      const data = await resp.json();

      if (data.error) {
        if (modelEl) modelEl.textContent = '无法获取';
        sessionsEl.innerHTML = '<div class="mc-error">无法加载会话</div>';
        previewsEl.innerHTML = '<div class="mc-error">无法加载</div>';
        return;
      }

      const sessions = data.sessions || [];
      this.sessionsCache = sessions;
      const count = data.count || 0;

      if (modelEl) {
        if (sessions.length > 0) {
          const s = sessions[0];
          modelEl.textContent = `${s.modelProvider}/${s.model}`;
        } else {
          modelEl.textContent = '无活跃会话';
        }
      }

      if (count === 0) {
        sessionsEl.innerHTML = '<div class="mc-empty">无活跃会话</div>';
        previewsEl.innerHTML = '<div class="mc-empty">无活跃会话</div>';
        return;
      }

      sessionsEl.innerHTML = `
        <div class="mc-stat-row">
          <span class="mc-stat-label">活跃会话数</span>
          <span class="mc-stat-value">${count}</span>
        </div>
        <div class="mc-stat-row">
          <span class="mc-stat-label">会话存储</span>
          <span class="mc-stat-value mc-path">${data.path || 'unknown'}</span>
        </div>
      `;

      previewsEl.innerHTML = sessions.map(s => {
        const age = this.formatAge(s.ageMs);
        const tokens = s.totalTokens || 0;
        const ctxPct = s.contextTokens ? Math.round((tokens / s.contextTokens) * 100) : 0;
        const title = s.origin?.label || s.key;
        return `
          <button class="session-preview-card" data-session-key="${this.escapeAttr(s.key)}">
            <div class="session-preview-top">
              <span class="session-preview-kind">${s.kind || 'unknown'}</span>
              <span class="status-dot ${s.abortedLastRun ? 'warning' : 'online'}"></span>
            </div>
            <div class="session-preview-id">${s.sessionId ? s.sessionId.slice(0, 12) : 'no-id'}</div>
            <div class="session-preview-title">${this.escapeHtml(title)}</div>
            <div class="session-preview-meta">${s.model || 'unknown'}</div>
            <div class="session-preview-tokens">${tokens.toLocaleString()} tokens <span class="ctx-pct">(${ctxPct}%)</span></div>
            <div class="session-preview-age">${age}</div>
          </button>
        `;
      }).join('');
    } catch (e) {
      if (modelEl) modelEl.textContent = '连接失败';
      sessionsEl.innerHTML = '<div class="mc-error">连接失败</div>';
      previewsEl.innerHTML = '<div class="mc-error">连接失败</div>';
    }
  }

  async loadCronHealth() {
    const cronEl = document.getElementById('cronList');
    if (!cronEl) return;

    try {
      const resp = await fetch('/api/cron');
      const data = await resp.json();

      if (data.error) {
        if (data.error === 'pairing_required') {
          cronEl.innerHTML = `
            <div class="cron-auth-required">
              <div class="cron-auth-title">需要 Gateway 配对</div>
              <div class="cron-auth-desc">运行 <code>openclaw dashboard</code> 完成配对后即可使用 Cron 功能</div>
            </div>
          `;
        } else {
          cronEl.innerHTML = '<div class="mc-error">无法加载</div>';
        }
        return;
      }

      const jobs = data.jobs || [];
      if (jobs.length === 0) {
        cronEl.innerHTML = '<div class="mc-empty">无定时任务</div>';
        return;
      }

      cronEl.innerHTML = jobs.map(job => {
        const status = job.disabled ? 'offline' : job.lastError ? 'warning' : 'online';
        const lastRun = job.lastRunAt ? this.formatAge(Date.now() - new Date(job.lastRunAt).getTime()) : '从未运行';
        return `
          <div class="cron-job">
            <div class="cron-job-info">
              <span class="status-dot ${status}"></span>
              <span class="cron-job-name">${job.name || '未命名'}</span>
            </div>
            <div class="cron-job-meta">
              <span class="cron-job-schedule">${job.schedule || 'N/A'}</span>
              <span class="cron-job-lastrun">${lastRun}</span>
            </div>
          </div>
        `;
      }).join('');
    } catch (e) {
      cronEl.innerHTML = '<div class="mc-error">连接失败</div>';
    }
  }

  openSessionModal(session) {
    const backdrop = this.view.querySelector('#sessionModalBackdrop');
    const title = this.view.querySelector('#sessionModalTitle');
    const content = this.view.querySelector('#sessionModalContent');
    title.textContent = session.origin?.label || session.sessionId || '会话详情';
    content.innerHTML = `
      <div class="detail-grid">
        <div class="detail-card">
          <div class="detail-label">Session ID</div>
          <div class="detail-value mono">${this.escapeHtml(session.sessionId || 'N/A')}</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">模型</div>
          <div class="detail-value">${this.escapeHtml(`${session.modelProvider || 'unknown'}/${session.model || 'unknown'}`)}</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">活跃类型</div>
          <div class="detail-value">${this.escapeHtml(session.kind || 'unknown')}</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">最后活跃</div>
          <div class="detail-value">${this.escapeHtml(this.formatAge(session.ageMs))}</div>
        </div>
        <div class="detail-card wide">
          <div class="detail-label">来源</div>
          <div class="detail-value">${this.escapeHtml(session.origin?.label || session.key)}</div>
        </div>
        <div class="detail-card wide">
          <div class="detail-label">上下文查看</div>
          <div class="detail-value detail-paragraph">当前版本已打开 3/4 屏居中查看层。下一步会把完整消息上下文和滚动时间线接进来，现在先展示真实会话元数据与布局骨架。</div>
        </div>
      </div>
    `;
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeSessionModal() {
    if (!this.view) return;
    const backdrop = this.view.querySelector('#sessionModalBackdrop');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  formatAge(ms) {
    if (!ms) return 'unknown';
    const sec = Math.floor(ms / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    return `${hr}h ago`;
  }

  escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  escapeAttr(value) {
    return this.escapeHtml(value);
  }
}

window.OpsModule = OpsModule;
