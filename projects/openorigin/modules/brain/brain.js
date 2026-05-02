class BrainModule {
  constructor() {
    this.view = null;
    this.currentPage = 'mission-control';
    this.briefings = [];
    this.selectedBriefingDate = null;
    this.automations = [];
    this.selectedAutomationName = null;
    this.automationCronError = '';
    this.systemReference = null;
  }

  show(pageKey = 'mission-control') {
    this.currentPage = pageKey;
    if (!this.view) this.render();
    this.view.classList.add('active');
    this.updatePageVisibility();
    if (pageKey === 'daily-briefing') this.refreshBriefing();
    if (pageKey === 'automations') this.refreshAutomations();
    if (pageKey === 'os-documentation') this.refreshSystemReference();
    if (pageKey === 'data-analysis') this.refreshDataAnalysis();
    if (pageKey === 'memory-viewer') this.refreshMemoryViewer();
    if (pageKey === 'skills-catalog') this.refreshSkillsCatalog();
    if (pageKey === 'dashboard') this.refreshDashboard();
    if (pageKey === 'mission-control') this.refreshMissionControl();
  }

  hide() {
    if (this.view) this.view.classList.remove('active');
  }

  async refreshBriefing() {
    const historyEl = this.view?.querySelector('#brainBriefingHistory');
    const detailEl = this.view?.querySelector('#brainBriefingDetail');
    if (historyEl) historyEl.innerHTML = '<div class="brain-briefing-empty">加载 memory 中...</div>';
    if (detailEl) detailEl.innerHTML = '<div class="brain-briefing-empty">正在整理每日简报...</div>';

    try {
      const res = await fetch('/api/memory-briefings');
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.detail || data.error || '加载失败');

      this.briefings = Array.isArray(data.entries) ? data.entries : [];
      if (!this.briefings.length) {
        this.renderBriefingEmpty('还没有可展示的 memory 简报');
        return;
      }

      if (!this.selectedBriefingDate || !this.briefings.some(item => item.date === this.selectedBriefingDate)) {
        this.selectedBriefingDate = this.briefings[0].date;
      }

      this.renderBriefingHistory();
      this.renderSelectedBriefing();
      if (window.lucide) window.lucide.createIcons();
    } catch (error) {
      this.renderBriefingEmpty(`读取 memory 失败：${this.esc(error.message)}`);
    }
  }

  renderBriefingEmpty(message) {
    const historyEl = this.view?.querySelector('#brainBriefingHistory');
    const detailEl = this.view?.querySelector('#brainBriefingDetail');
    if (historyEl) historyEl.innerHTML = '<div class="brain-briefing-empty">暂无历史</div>';
    if (detailEl) {
      detailEl.innerHTML = `
        <div class="brain-briefing-empty">
          <i data-lucide="file-warning"></i>
          <div>${message}</div>
        </div>
      `;
    }
    if (window.lucide) window.lucide.createIcons();
  }

  renderBriefingHistory() {
    const historyEl = this.view?.querySelector('#brainBriefingHistory');
    if (!historyEl) return;

    historyEl.innerHTML = this.briefings.map(item => {
      const active = item.date === this.selectedBriefingDate;
      return `
        <button class="brain-briefing-history-item ${active ? 'active' : ''}" data-date="${this.esc(item.date)}">
          <div class="brain-briefing-history-date">${this.esc(item.date)}</div>
          <div class="brain-briefing-history-label">${this.esc(item.fileName)}</div>
          <div class="brain-briefing-history-summary">${this.esc(item.summary || '暂无足够数据')}</div>
        </button>
      `;
    }).join('');

    historyEl.querySelectorAll('.brain-briefing-history-item').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedBriefingDate = btn.dataset.date;
        this.renderBriefingHistory();
        this.renderSelectedBriefing();
        if (window.lucide) window.lucide.createIcons();
      });
    });
  }

  renderSelectedBriefing() {
    const detailEl = this.view?.querySelector('#brainBriefingDetail');
    if (!detailEl) return;

    const briefing = this.briefings.find(item => item.date === this.selectedBriefingDate) || this.briefings[0];
    if (!briefing) {
      detailEl.innerHTML = '<div class="brain-briefing-empty">没有找到对应简报</div>';
      return;
    }

    const sectionMeta = [
      { key: 'priorities', title: '今日优先级', icon: 'flag' },
      { key: 'nightly', title: '夜间活动', icon: 'moon-star' },
      { key: 'todos', title: '待处理事项', icon: 'list-todo' },
      { key: 'attention', title: '需要老板关注', icon: 'triangle-alert', danger: true }
    ];

    const sectionsHtml = sectionMeta.map(section => {
      const items = Array.isArray(briefing.sections?.[section.key]) ? briefing.sections[section.key] : [];
      const body = items.length
        ? `<ul class="brain-briefing-list">${items.map(item => `<li>${this.esc(item)}</li>`).join('')}</ul>`
        : '<div class="brain-briefing-muted">暂无足够数据</div>';

      return `
        <section class="brain-briefing-content-block ${section.danger ? 'is-danger' : ''}">
          <div class="brain-briefing-content-title">
            <i data-lucide="${section.icon}"></i>
            <span>${this.esc(section.title)}</span>
          </div>
          ${body}
        </section>
      `;
    }).join('');

    const rawMarkdown = briefing.rawBriefing || briefing.rawContent || '';

    detailEl.innerHTML = `
      <div class="brain-briefing-detail-header">
        <div>
          <div class="brain-briefing-detail-kicker">Daily Brief</div>
          <h2 class="brain-briefing-detail-title">${this.esc(briefing.title || briefing.date)}</h2>
          <p class="brain-briefing-detail-lead">内容直接来自 <code>memory/${this.esc(briefing.fileName)}</code>，已按中文结构整理展示。</p>
        </div>
      </div>
      <div class="brain-briefing-content-grid">
        ${sectionsHtml}
      </div>
      <details class="brain-briefing-content-block brain-briefing-raw-block">
        <summary class="brain-briefing-raw-summary">
          <span class="brain-briefing-content-title brain-briefing-raw-title">
            <i data-lucide="scroll-text"></i>
            <span>原始 Markdown</span>
          </span>
          <span class="brain-briefing-raw-hint">点开查看</span>
        </summary>
        <pre class="brain-briefing-markdown-preview"><code>${this.esc(rawMarkdown || '暂无足够数据')}</code></pre>
      </details>
    `;
  }

  async refreshAutomations() {
    const historyEl = this.view?.querySelector('#brainAutomationHistory');
    const detailEl = this.view?.querySelector('#brainAutomationDetail');
    if (historyEl) historyEl.innerHTML = '<div class="brain-briefing-empty">加载自动化任务中...</div>';
    if (detailEl) detailEl.innerHTML = '<div class="brain-briefing-empty">整理自动化信息中...</div>';

    try {
      const res = await fetch('/api/automations');
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.detail || data.error || '加载失败');
      this.automations = Array.isArray(data.items) ? data.items : [];
      this.automationCronError = data.cronError || '';
      if (!this.selectedAutomationName || !this.automations.some(item => item.name === this.selectedAutomationName)) {
        this.selectedAutomationName = this.automations[0]?.name || null;
      }
      this.renderAutomationHistory();
      this.renderSelectedAutomation();
      if (window.lucide) window.lucide.createIcons();
    } catch (error) {
      if (historyEl) historyEl.innerHTML = '<div class="brain-briefing-empty">暂无自动化列表</div>';
      if (detailEl) {
        detailEl.innerHTML = `
          <div class="brain-briefing-empty">
            <i data-lucide="bot-off"></i>
            <div>自动化页面加载失败：${this.esc(error.message)}</div>
          </div>
        `;
      }
      if (window.lucide) window.lucide.createIcons();
    }
  }

  renderAutomationHistory() {
    const el = this.view?.querySelector('#brainAutomationHistory');
    if (!el) return;

    const items = this.automations || [];
    if (!items.length) {
      el.innerHTML = '<div class="brain-briefing-empty">暂无自动化任务</div>';
      return;
    }

    el.innerHTML = items.map(item => {
      const tone = item.status === 'blocked' || item.status === 'error'
        ? 'is-danger'
        : item.status === 'ready'
          ? 'is-ok'
          : 'is-warn';
      const active = item.name === this.selectedAutomationName;
      return `
        <button class="brain-automation-history-item ${active ? 'active' : ''} ${tone}" data-name="${this.esc(item.name)}">
          <div class="brain-automation-history-top">
            <div>
              <div class="brain-automation-history-kicker">${this.esc(item.name)}</div>
              <div class="brain-automation-history-title">${this.esc(item.title)}</div>
            </div>
            <span class="brain-automation-badge ${tone}">${this.esc(item.statusText)}</span>
          </div>
          <div class="brain-automation-history-meta">${this.esc(item.scheduleText || '未配置')} · ${this.esc(item.kind)}</div>
          <div class="brain-automation-history-summary">${this.esc(item.runtimeSummary || item.purpose || '暂无说明')}</div>
        </button>
      `;
    }).join('');

    el.querySelectorAll('.brain-automation-history-item').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedAutomationName = btn.dataset.name;
        this.renderAutomationHistory();
        this.renderSelectedAutomation();
        if (window.lucide) window.lucide.createIcons();
      });
    });
  }

  renderSelectedAutomation() {
    const el = this.view?.querySelector('#brainAutomationDetail');
    if (!el) return;

    const items = this.automations || [];
    const item = items.find(entry => entry.name === this.selectedAutomationName) || items[0];
    if (!item) {
      el.innerHTML = '<div class="brain-briefing-empty">没有找到自动化任务</div>';
      return;
    }

    const blocked = items.filter(entry => ['blocked', 'error'].includes(entry.status)).length;
    const ready = items.filter(entry => entry.status === 'ready').length;
    const pending = items.length - ready - blocked;
    const scheduleText = item.cron?.scheduleText || item.scheduleText || '未配置';
    const nextRun = item.cron?.nextRun ? new Date(item.cron.nextRun).toLocaleString('zh-CN', { hour12: false }) : '待确认';
    const lastRun = item.cron?.lastRun?.at ? new Date(item.cron.lastRun.at).toLocaleString('zh-CN', { hour12: false }) : '暂无';
    const tone = item.status === 'blocked' || item.status === 'error'
      ? 'is-danger'
      : item.status === 'ready'
        ? 'is-ok'
        : 'is-warn';
    const statCards = `
      <div class="brain-automation-stats">
        <div class="brain-automation-stat-card">
          <div class="brain-automation-stat-value">${items.length}</div>
          <div class="brain-automation-stat-label">核心任务</div>
        </div>
        <div class="brain-automation-stat-card is-ok">
          <div class="brain-automation-stat-value">${ready}</div>
          <div class="brain-automation-stat-label">已配置</div>
        </div>
        <div class="brain-automation-stat-card is-warn">
          <div class="brain-automation-stat-value">${pending}</div>
          <div class="brain-automation-stat-label">待激活</div>
        </div>
        <div class="brain-automation-stat-card is-danger">
          <div class="brain-automation-stat-value">${blocked}</div>
          <div class="brain-automation-stat-label">异常 / 阻塞</div>
        </div>
      </div>
    `;

    const notice = this.automationCronError
      ? `<div class="brain-automation-banner">cron 状态暂时拿不到：${this.esc(this.automationCronError)}</div>`
      : '';
    const scriptPreview = Array.isArray(item.scriptPreview) && item.scriptPreview.length
      ? item.scriptPreview.join('\n')
      : '暂无脚本内容';
    const logPreview = Array.isArray(item.logPreview) && item.logPreview.length
      ? item.logPreview.join('\n')
      : '暂无日志';
    const scriptPath = item.scriptPath ? item.scriptPath.replace('/Users/ze/.openclaw/workspace/', 'workspace/') : '--';
    const logPath = item.logPath ? item.logPath.replace('/Users/ze/.openclaw/workspace/', 'workspace/') : '--';

    el.innerHTML = `
      <div class="brain-automation-shell">
        <div class="brain-briefing-detail-header brain-automation-header">
          <div>
            <div class="brain-briefing-detail-kicker">Automations</div>
            <h2 class="brain-briefing-detail-title">${this.esc(item.title)}</h2>
            <p class="brain-briefing-detail-lead">${this.esc(item.purpose)} 当前页面集中展示这个任务的节奏、状态、脚本和日志。</p>
          </div>
          <span class="brain-automation-badge ${tone} automation-detail-badge">${this.esc(item.statusText)}</span>
        </div>
        ${statCards}
        ${notice}
        <div class="brain-automation-meta-grid automation-detail-grid">
          <div class="brain-automation-meta-item"><span>任务 ID</span><strong>${this.esc(item.name)}</strong></div>
          <div class="brain-automation-meta-item"><span>类型</span><strong>${this.esc(item.kind)}</strong></div>
          <div class="brain-automation-meta-item"><span>计划</span><strong>${this.esc(scheduleText)}</strong></div>
          <div class="brain-automation-meta-item"><span>输出</span><strong>${this.esc(item.output)}</strong></div>
          <div class="brain-automation-meta-item"><span>下次执行</span><strong>${this.esc(nextRun)}</strong></div>
          <div class="brain-automation-meta-item"><span>最近执行</span><strong>${this.esc(lastRun)}</strong></div>
          <div class="brain-automation-meta-item automation-meta-wide"><span>脚本路径</span><strong>${this.esc(scriptPath)}</strong></div>
          <div class="brain-automation-meta-item automation-meta-wide"><span>日志路径</span><strong>${this.esc(logPath)}</strong></div>
        </div>
        <section class="brain-automation-content-block">
          <div class="brain-automation-content-title"><i data-lucide="activity"></i><span>运行摘要</span></div>
          <div class="brain-automation-runtime">${this.esc(item.runtimeSummary || '暂无运行摘要')}</div>
          ${item.blocker ? `<div class="brain-automation-note">阻塞：${this.esc(item.blocker)}</div>` : ''}
        </section>
        <details class="brain-automation-content-block">
          <summary class="brain-briefing-raw-summary">
            <span class="brain-automation-content-title brain-briefing-raw-title"><i data-lucide="file-code-2"></i><span>查看脚本</span></span>
            <span class="brain-briefing-raw-hint">点开查看</span>
          </summary>
          <pre class="brain-automation-log"><code>${this.esc(scriptPreview)}</code></pre>
        </details>
        <details class="brain-automation-content-block">
          <summary class="brain-briefing-raw-summary">
            <span class="brain-automation-content-title brain-briefing-raw-title"><i data-lucide="scroll-text"></i><span>查看日志</span></span>
            <span class="brain-briefing-raw-hint">点开查看</span>
          </summary>
          <pre class="brain-automation-log"><code>${this.esc(logPreview)}</code></pre>
        </details>
      </div>
    `;
  }

  async refreshSystemReference() {
    const detailEl = this.view?.querySelector('#brainSystemReferenceDetail');
    if (detailEl) detailEl.innerHTML = '<div class="brain-briefing-empty">加载系统文档中...</div>';

    try {
      const [docRes, automationRes] = await Promise.all([
        fetch('/api/system-reference'),
        fetch('/api/automations')
      ]);
      const [docData, automationData] = await Promise.all([
        docRes.json(),
        automationRes.json()
      ]);
      if (!docRes.ok || docData.error) throw new Error(docData.detail || docData.error || '系统文档加载失败');
      if (!automationRes.ok || automationData.error) throw new Error(automationData.detail || automationData.error || '自动化状态加载失败');
      this.systemReference = {
        ...docData,
        automations: automationData.items || [],
        automationCronError: automationData.cronError || ''
      };
      this.renderSystemReference();
      if (window.lucide) window.lucide.createIcons();
    } catch (error) {
      if (detailEl) {
        detailEl.innerHTML = `
          <div class="brain-briefing-empty">
            <i data-lucide="file-warning"></i>
            <div>系统文档加载失败：${this.esc(error.message)}</div>
          </div>
        `;
      }
      if (window.lucide) window.lucide.createIcons();
    }
  }

  renderSystemReference() {
    const el = this.view?.querySelector('#brainSystemReferenceDetail');
    if (!el) return;

    const doc = this.systemReference;
    if (!doc?.sections?.length) {
      el.innerHTML = '<div class="brain-briefing-empty">系统文档还没有内容</div>';
      return;
    }

    const updatedAt = doc.updatedAt ? new Date(doc.updatedAt).toLocaleString('zh-CN', { hour12: false }) : '未知';
    const automations = Array.isArray(doc.automations) ? doc.automations : [];
    const blockedCount = automations.filter(item => ['blocked', 'error'].includes(item.status)).length;
    const readyCount = automations.filter(item => item.status === 'ready').length;
    const pendingCount = automations.length - blockedCount - readyCount;
    const issueSection = doc.sections.find(section => /已知问题/.test(section.heading));
    const docPath = (doc.path || '--').replace('/Users/ze/.openclaw/workspace/', 'workspace/');

    const renderTree = (nodes = []) => {
      if (!nodes.length) return '';
      return `<ul class="brain-doc-tree">${nodes.map(node => `
        <li>
          <span>${this.esc(node.text)}</span>
          ${renderTree(node.children || [])}
        </li>
      `).join('')}</ul>`;
    };

    const tocHtml = doc.sections.map((section, index) => `
      <a class="brain-doc-toc-item" href="#brain-doc-section-${index}">
        <span class="brain-doc-toc-index">${String(index + 1).padStart(2, '0')}</span>
        <span>${this.esc(section.heading)}</span>
      </a>
    `).join('');

    const sectionsHtml = doc.sections.map((section, index) => {
      const body = section.tree?.length
        ? renderTree(section.tree)
        : `<ul class="brain-briefing-list">${(section.items || []).map(item => `<li>${this.esc(item)}</li>`).join('')}</ul>`;
      return `
        <section class="brain-doc-section" id="brain-doc-section-${index}">
          <div class="brain-doc-section-head">
            <div class="brain-doc-section-kicker">Section ${String(index + 1).padStart(2, '0')}</div>
            <h3 class="brain-doc-section-title">${this.esc(section.heading)}</h3>
          </div>
          <div class="brain-doc-section-body">
            ${body || '<div class="brain-briefing-muted">暂无内容</div>'}
          </div>
        </section>
      `;
    }).join('');

    const riskHtml = blockedCount || (issueSection?.items?.length)
      ? `
        <div class="brain-doc-note danger">异常 / 风险：${this.esc(String(blockedCount || issueSection.items.length || 0))}</div>
        ${(automations.filter(item => ['blocked', 'error'].includes(item.status)).slice(0, 3).map(item => `
          <div class="brain-doc-mini-card is-danger">
            <div class="brain-doc-mini-title">${this.esc(item.title)}</div>
            <div class="brain-doc-mini-copy">${this.esc(item.runtimeSummary || item.statusText)}</div>
          </div>
        `).join(''))}
      `
      : '<div class="brain-doc-note ok">当前没有明显异常</div>';

    const automationSummary = automations.length ? automations.map(item => {
      const tone = item.status === 'blocked' || item.status === 'error'
        ? 'is-danger'
        : item.status === 'ready'
          ? 'is-ok'
          : 'is-warn';
      return `
        <div class="brain-doc-mini-card ${tone}">
          <div class="brain-doc-mini-title">${this.esc(item.title)}</div>
          <div class="brain-doc-mini-copy">${this.esc(item.statusText)} · ${this.esc(item.scheduleText || item.cron?.scheduleText || '待确认')}</div>
        </div>
      `;
    }).join('') : '<div class="brain-briefing-muted">暂无自动化摘要</div>';

    el.innerHTML = `
      <div class="brain-doc-layout">
        <aside class="brain-doc-sidebar">
          <div class="brain-doc-sidebar-sticky">
            <div class="brain-doc-hero">
              <div class="brain-briefing-detail-kicker">系统文档</div>
              <h2 class="brain-doc-title">系统文档</h2>
              <p class="brain-doc-lead">偏阅读、偏知识库的页面。左侧导航与摘要，右侧专注正文。</p>
            </div>

            <div class="brain-doc-meta">
              <div class="brain-doc-meta-item"><span>文档路径</span><strong>${this.esc(docPath)}</strong></div>
              <div class="brain-doc-meta-item"><span>最后更新</span><strong>${this.esc(updatedAt)}</strong></div>
              <div class="brain-doc-meta-item"><span>章节数</span><strong>${this.esc(String(doc.sections.length))}</strong></div>
            </div>

            <div class="brain-doc-note-grid">
              <div class="brain-doc-note">正常：${this.esc(String(readyCount))}</div>
              <div class="brain-doc-note warn">待确认：${this.esc(String(pendingCount))}</div>
            </div>

            ${riskHtml}

            ${doc.automationCronError ? `<div class="brain-automation-banner">cron 状态暂时拿不到：${this.esc(doc.automationCronError)}</div>` : ''}

            <div class="brain-doc-sidebar-block">
              <div class="brain-doc-sidebar-title">目录</div>
              <nav class="brain-doc-toc">${tocHtml}</nav>
            </div>

            <div class="brain-doc-sidebar-block">
              <div class="brain-doc-sidebar-title">自动化摘要</div>
              <div class="brain-doc-mini-list">${automationSummary}</div>
            </div>
          </div>
        </aside>

        <section class="brain-doc-content">
          <div class="brain-doc-content-head">
            <h2 class="brain-briefing-detail-title">SYSTEM-REFERENCE</h2>
            <p class="brain-briefing-detail-lead">直接读取 <code>docs/SYSTEM-REFERENCE.md</code>，按章节展开，保留知识库式阅读体验。</p>
          </div>

          <div class="brain-doc-sections">${sectionsHtml}</div>

          <details class="brain-automation-content-block brain-doc-raw-block">
            <summary class="brain-briefing-raw-summary">
              <span class="brain-automation-content-title brain-briefing-raw-title"><i data-lucide="scroll-text"></i><span>查看原始 Markdown</span></span>
              <span class="brain-briefing-raw-hint">点开查看</span>
            </summary>
            <pre class="brain-automation-log"><code>${this.esc(doc.raw || '暂无内容')}</code></pre>
          </details>
        </section>
      </div>
    `;
  }

  async refreshDataAnalysis() {
    const statsEl = this.view?.querySelector('#brainDataStats');
    const modelListEl = this.view?.querySelector('#brainDataModelList');
    const hotListEl = this.view?.querySelector('#brainDataHotList');
    const sessionTypesEl = this.view?.querySelector('#brainDataSessionTypes');
    const timelineEl = this.view?.querySelector('#brainDataTimeline');

    const empty = '<div class="brain-briefing-empty">暂无数据</div>';
    if (modelListEl) modelListEl.innerHTML = '<div class="brain-briefing-empty">加载中...</div>';
    if (hotListEl) hotListEl.innerHTML = '<div class="brain-briefing-empty">加载中...</div>';
    if (sessionTypesEl) sessionTypesEl.innerHTML = '<div class="brain-briefing-empty">加载中...</div>';
    if (timelineEl) timelineEl.innerHTML = '<div class="brain-briefing-empty">加载中...</div>';

    try {
      const [eventsRes, sessionsRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/sessions')
      ]);

      const eventsData = eventsRes.ok ? (await eventsRes.json()) : { entries: [] };
      const sessionsData = sessionsRes.ok ? (await sessionsRes.json()) : { entries: [] };

      const events = Array.isArray(eventsData.entries) ? eventsData.entries : [];
      const sessions = Array.isArray(sessionsData.entries) ? sessionsData.entries : [];

      // Stats
      const totalEvents = events.length;
      const totalSessions = sessions.length;
      const uptimeDays = sessionsData.uptimeDays || eventsData.uptimeDays || 0;
      const activeNow = sessionsData.activeNow || eventsData.activeNow || 0;

      if (statsEl) {
        statsEl.querySelector('#brainDataTotalEvents').textContent = totalEvents;
        statsEl.querySelector('#brainDataTotalSessions').textContent = totalSessions;
        statsEl.querySelector('#brainDataUptime').textContent = uptimeDays ? `${uptimeDays}d` : '--';
        statsEl.querySelector('#brainDataActiveNow').textContent = activeNow || '--';
      }

      // Model distribution
      if (modelListEl) {
        const modelMap = {};
        sessions.forEach(s => {
          const model = s.model || 'unknown';
          modelMap[model] = (modelMap[model] || 0) + 1;
        });
        const sorted = Object.entries(modelMap).sort((a, b) => b[1] - a[1]);
        if (!sorted.length) {
          modelListEl.innerHTML = empty;
        } else {
          const total = sorted.reduce((sum, [, v]) => sum + v, 0);
          modelListEl.innerHTML = sorted.map(([model, count]) => {
            const pct = total > 0 ? Math.round(count / total * 100) : 0;
            return `
              <div class="brain-data-model-item">
                <div class="brain-data-model-top">
                  <span class="brain-data-model-name">${this.esc(model)}</span>
                  <span class="brain-data-model-count">${count} <span>(${pct}%)</span></span>
                </div>
                <div class="brain-data-model-bar">
                  <div class="brain-data-model-fill" style="width:${pct}%"></div>
                </div>
              </div>
            `;
          }).join('');
        }
      }

      // Hot sessions
      if (hotListEl) {
        const hot = sessions
          .sort((a, b) => (b.messageCount || 0) - (a.messageCount || 0))
          .slice(0, 8);
        if (!hot.length) {
          hotListEl.innerHTML = empty;
        } else {
          hotListEl.innerHTML = hot.map(s => {
            const lastActive = s.updatedAt ? new Date(s.updatedAt).toLocaleString('zh-CN', { hour12: false }) : '未知';
            return `
              <div class="brain-data-hot-item">
                <div class="brain-data-hot-title">${this.esc(s.title || s.key || '未知会话')}</div>
                <div class="brain-data-hot-meta">
                  <span>${s.messageCount || 0} 条消息</span>
                  <span>${lastActive}</span>
                </div>
              </div>
            `;
          }).join('');
        }
      }

      // Session types
      if (sessionTypesEl) {
        const typeMap = {};
        sessions.forEach(s => {
          const type = s.type || s.sessionType || 'unknown';
          typeMap[type] = (typeMap[type] || 0) + 1;
        });
        const sorted = Object.entries(typeMap).sort((a, b) => b[1] - a[1]);
        if (!sorted.length) {
          sessionTypesEl.innerHTML = empty;
        } else {
          sessionTypesEl.innerHTML = `
            <div class="brain-data-session-grid">
              ${sorted.map(([type, count]) => `
                <div class="brain-data-session-card">
                  <div class="brain-data-session-type">${this.esc(type)}</div>
                  <div class="brain-data-session-count">${count}</div>
                </div>
              `).join('')}
            </div>
          `;
        }
      }

      // Unified timeline
      if (timelineEl) {
        const merged = [
          ...events.map(e => ({ ...e, _sort: new Date(e.timestamp || 0).getTime(), _kind: 'event' })),
          ...sessions.map(s => ({ ...s, _sort: new Date(s.updatedAt || 0).getTime(), _kind: 'session' }))
        ].sort((a, b) => b._sort - a._sort).slice(0, 30);

        if (!merged.length) {
          timelineEl.innerHTML = empty;
        } else {
          timelineEl.innerHTML = merged.map(item => {
            const isEvent = item._kind === 'event';
            const icon = isEvent ? 'activity' : 'message-square';
            const label = isEvent ? (item.eventType || '事件') : (item.title || item.key || '会话');
            const time = item.timestamp || (item.updatedAt ? new Date(item.updatedAt).toLocaleString('zh-CN', { hour12: false }) : '未知时间');
            const meta = isEvent ? (item.description || '') : (`${item.messageCount || 0} 条消息`);
            return `
              <div class="brain-data-tl-item ${isEvent ? 'is-event' : 'is-session'}">
                <div class="brain-data-tl-icon"><i data-lucide="${icon}"></i></div>
                <div class="brain-data-tl-body">
                  <div class="brain-data-tl-label">${this.esc(label)}</div>
                  <div class="brain-data-tl-meta">${this.esc(meta)}</div>
                </div>
                <div class="brain-data-tl-time">${this.esc(String(time))}</div>
              </div>
            `;
          }).join('');
        }
      }

      if (window.lucide) window.lucide.createIcons();
    } catch (error) {
      if (modelListEl) modelListEl.innerHTML = `<div class="brain-briefing-empty">加载失败：${this.esc(error.message)}</div>`;
      if (hotListEl) hotListEl.innerHTML = empty;
      if (sessionTypesEl) sessionTypesEl.innerHTML = empty;
      if (timelineEl) timelineEl.innerHTML = empty;
      if (window.lucide) window.lucide.createIcons();
    }
  }

  async refreshMissionControl() {
    const modelsEl = this.view?.querySelector('#brainDashModels');
    const sessionsEl = this.view?.querySelector('#brainDashSessions');

    if (modelsEl) modelsEl.innerHTML = '<div class="brain-dash-loading">加载中...</div>';
    if (sessionsEl) sessionsEl.innerHTML = '<div class="brain-dash-loading">加载中...</div>';

    // Overview cards
    try {
      const overviewRes = await fetch('/api/brain-overview');
      if (overviewRes.ok) {
        const ov = await overviewRes.json();

        // 每日简报
        const b = ov.briefing;
        const bEl = document.getElementById('brainOverview_briefing');
        const bSub = document.getElementById('brainOverview_briefingSub');
        if (bEl && b) {
          bEl.textContent = b.latest ? `${b.latest.date}` : '无';
          bSub.textContent = b.latest?.summary ? b.latest.summary.slice(0, 30) + (b.latest.summary.length > 30 ? '…' : '') : (b.total ? `共 ${b.total} 份` : '无数据');
        }

        // 内存统计
        const m = ov.memory;
        const mEl = document.getElementById('brainOverview_memory');
        const mSub = document.getElementById('brainOverview_memorySub');
        if (mEl && m) {
          mEl.textContent = `${m.count} 个文件`;
          mSub.textContent = m.totalSize > 0 ? `总计 ${this.formatFileSize(m.totalSize)}${m.lastUpdate ? ` · 最后更新 ${new Date(m.lastUpdate).toLocaleDateString('zh-CN')}` : ''}` : '无数据';
        }

        // 自动化任务
        const c = ov.cron;
        const cEl = document.getElementById('brainOverview_cron');
        const cSub = document.getElementById('brainOverview_cronSub');
        if (cEl && c) {
          cEl.textContent = `${c.ok} 正常 / ${c.error} 异常`;
          cSub.textContent = `共 ${c.total} 个任务`;
        }

        // 技能数量
        const s = ov.skills;
        const sEl = document.getElementById('brainOverview_skills');
        const sSub = document.getElementById('brainOverview_skillsSub');
        if (sEl && s) {
          sEl.textContent = `${s.total} 个`;
          sSub.textContent = `内置 ${s.builtin} · 自定义 ${s.custom}`;
        }
      }
    } catch (_) {}

    // Card click navigation
    this.view?.querySelectorAll('.brain-overview-card[data-link]').forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        const link = card.dataset.link;
        if (window.app && window.app.navigate) window.app.navigate('brain', link);
      });
    });

    if (window.lucide) window.lucide.createIcons();

    try {
      const [modelsRes, sessionsRes, cronRes] = await Promise.all([
        fetch('/api/models'),
        fetch('/api/sessions'),
        fetch('/api/cron')
      ]);
      const modelsData = modelsRes.ok ? (await modelsRes.json()) : { models: [] };
      const sessionsData = sessionsRes.ok ? (await sessionsRes.json()) : { entries: [] };
      const cronData = cronRes.ok ? (await cronRes.json()) : { jobs: [] };

      const models = Array.isArray(modelsData.models) ? modelsData.models : [];
      const sessions = Array.isArray(sessionsData.entries) ? sessionsData.entries : [];

      // Models
      if (modelsEl) {
        if (!models.length) {
          modelsEl.innerHTML = '<div class="brain-dash-empty">暂无模型数据</div>';
        } else {
          modelsEl.innerHTML = models.map(m => `
            <div class="brain-dash-card brain-dash-model-card">
              <div class="brain-dash-card-top">
                <div class="brain-dash-card-icon is-model"><i data-lucide="cpu"></i></div>
                <span class="brain-dash-badge is-ok">在线</span>
              </div>
              <div class="brain-dash-card-name">${this.esc(m.name || m.model || m.ref)}</div>
              <div class="brain-dash-card-meta">
                <span>${this.esc(m.provider || 'unknown')}</span>
                <span>ctx ${this.esc(String(m.contextWindow || '--'))}</span>
              </div>
              <div class="brain-dash-card-tags">
                ${m.reasoning ? '<span class="brain-dash-tag">推理</span>' : ''}
                ${m.multimodal ? '<span class="brain-dash-tag">多模态</span>' : ''}
                ${m.role ? `<span class="brain-dash-tag is-primary">${this.esc(m.role)}</span>` : ''}
              </div>
            </div>
          `).join('');
        }
      }

      // Sessions
      if (sessionsEl) {
        if (!sessions.length) {
          sessionsEl.innerHTML = '<div class="brain-dash-empty">暂无会话数据</div>';
        } else {
          const sorted = [...sessions].sort((a, b) => (b.messageCount || 0) - (a.messageCount || 0));
          sorted.forEach(s => {
            const updatedAt = s.updatedAt ? new Date(s.updatedAt) : null;
            const timeStr = updatedAt ? updatedAt.toLocaleString('zh-CN', { hour12: false }) : '未知';
            const ageStr = updatedAt ? this.formatAge(Date.now() - s.updatedAt) : '--';
            const provider = s.origin?.provider || s.modelProvider || 'unknown';
            const isActive = updatedAt && (Date.now() - s.updatedAt < 5 * 60 * 1000);
            const sessionTitle = s.title || s.key || '未知会话';
            const truncatedTitle = sessionTitle.length > 28 ? sessionTitle.slice(0, 28) + '…' : sessionTitle;

            const el = document.createElement('div');
            el.className = `brain-dash-card brain-dash-session-card${isActive ? ' is-active' : ''}`;
            el.innerHTML = `
              <div class="brain-dash-card-top">
                <div class="brain-dash-card-icon is-session"><i data-lucide="message-square"></i></div>
                <span class="brain-dash-badge ${isActive ? 'is-ok' : 'is-dim'}">${isActive ? '活跃' : ageStr}</span>
              </div>
              <div class="brain-dash-card-name" title="${this.esc(sessionTitle)}">${this.esc(truncatedTitle)}</div>
              <div class="brain-dash-card-meta">
                <span>${this.esc(provider)}</span>
                <span>${s.messageCount || 0} 条</span>
              </div>
              <div class="brain-dash-card-tags">
                <span class="brain-dash-tag">${this.esc(s.model || 'unknown')}</span>
                <span class="brain-dash-tag">${this.esc(s.kind || 'unknown')}</span>
              </div>
            `;
            sessionsEl.appendChild(el);
          });
        }
      }

      // Cron jobs
      const cronEl = this.view?.querySelector('#brainDashCron');
      if (cronEl) {
        const jobs = Array.isArray(cronData.jobs) ? cronData.jobs : [];
        if (!jobs.length) {
          cronEl.innerHTML = '<div class="brain-dash-empty">暂无定时任务</div>';
        } else {
          cronEl.innerHTML = jobs.map(job => {
            const status = job.state?.lastRunStatus || job.state?.lastStatus || 'unknown';
            const statusClass = status === 'ok' ? 'is-ok' : status === 'error' ? 'is-danger' : 'is-warn';
            const statusLabel = status === 'ok' ? '正常' : status === 'error' ? '异常' : '等待';
            const lastRun = job.lastRun?.at
              ? new Date(job.lastRun.at).toLocaleString('zh-CN', { hour12: false })
              : '从未';
            const lastDur = job.lastRun?.durationMs
              ? `${(job.lastRun.durationMs / 1000).toFixed(1)}s`
              : '--';
            const nextRun = job.nextRun
              ? new Date(job.nextRun).toLocaleString('zh-CN', { hour12: false })
              : '未配置';
            const scheduleStr = job.schedule?.expr || '--';
            return `
              <div class="brain-dash-cron-row">
                <div class="brain-dash-cron-name">${this.esc(job.name)}</div>
                <div class="brain-dash-cron-schedule">${this.esc(scheduleStr)}</div>
                <div class="brain-dash-cron-last">
                  <span>${lastRun}</span>
                  <span class="brain-dash-cron-dur">${lastDur}</span>
                </div>
                <div class="brain-dash-cron-next">${this.esc(nextRun)}</div>
                <div class="brain-dash-cron-status">
                  <span class="brain-dash-cron-badge ${statusClass}">${statusLabel}</span>
                </div>
              </div>
            `;
          }).join('');
        }
      }

      if (window.lucide) window.lucide.createIcons();
    } catch (error) {
      if (modelsEl) modelsEl.innerHTML = `<div class="brain-dash-empty">加载失败：${this.esc(error.message)}</div>`;
      if (sessionsEl) sessionsEl.innerHTML = '<div class="brain-dash-empty">加载失败</div>';
      const cronEl = this.view?.querySelector('#brainDashCron');
      if (cronEl) cronEl.innerHTML = '<div class="brain-dash-empty">加载失败</div>';
      if (window.lucide) window.lucide.createIcons();
    }
  }

  async refreshDashboard() {
    const modelsEl = this.view?.querySelector('#brainDashModels');
    const sessionsEl = this.view?.querySelector('#brainDashSessions');

    // Overview cards
    try {
      const overviewRes = await fetch('/api/brain-overview');
      if (overviewRes.ok) {
        const ov = await overviewRes.json();

        const b = ov.briefing;
        const bEl = document.getElementById('brainDashOverview_briefing');
        const bSub = document.getElementById('brainDashOverview_briefingSub');
        if (bEl && b) {
          bEl.textContent = b.latest ? b.latest.date : '无';
          bSub.textContent = b.latest?.summary ? b.latest.summary.slice(0, 30) + (b.latest.summary.length > 30 ? '…' : '') : (b.total ? `共 ${b.total} 份` : '无数据');
        }

        const m = ov.memory;
        const mEl = document.getElementById('brainDashOverview_memory');
        const mSub = document.getElementById('brainDashOverview_memorySub');
        if (mEl && m) {
          mEl.textContent = `${m.count} 个文件`;
          mSub.textContent = m.totalSize > 0 ? `总计 ${this.formatFileSize(m.totalSize)}${m.lastUpdate ? ` · 最后更新 ${new Date(m.lastUpdate).toLocaleDateString('zh-CN')}` : ''}` : '无数据';
        }

        const c = ov.cron;
        const cEl = document.getElementById('brainDashOverview_cron');
        const cSub = document.getElementById('brainDashOverview_cronSub');
        if (cEl && c) {
          cEl.textContent = `${c.ok} 正常 / ${c.error} 异常`;
          cSub.textContent = `共 ${c.total} 个任务`;
        }

        const s = ov.skills;
        const sEl = document.getElementById('brainDashOverview_skills');
        const sSub = document.getElementById('brainDashOverview_skillsSub');
        if (sEl && s) {
          sEl.textContent = `${s.total} 个`;
          sSub.textContent = `内置 ${s.builtin} · 自定义 ${s.custom}`;
        }
      }
    } catch (_) {}

    // Card click navigation
    this.view?.querySelectorAll('.brain-overview-card[data-link]').forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        const link = card.dataset.link;
        if (window.app && window.app.navigate) window.app.navigate('brain', link);
      });
    });

    if (window.lucide) window.lucide.createIcons();

    // Models / Sessions / Cron
    if (modelsEl) modelsEl.innerHTML = '<div class="brain-dash-loading">加载中...</div>';
    if (sessionsEl) sessionsEl.innerHTML = '<div class="brain-dash-loading">加载中...</div>';

    try {
      const [modelsRes, sessionsRes, cronRes] = await Promise.all([
        fetch('/api/models'),
        fetch('/api/sessions'),
        fetch('/api/cron')
      ]);
      const modelsData = modelsRes.ok ? (await modelsRes.json()) : { models: [] };
      const sessionsData = sessionsRes.ok ? (await sessionsRes.json()) : { entries: [] };
      const cronData = cronRes.ok ? (await cronRes.json()) : { jobs: [] };

      const models = Array.isArray(modelsData.models) ? modelsData.models : [];
      const sessions = Array.isArray(sessionsData.entries) ? sessionsData.entries : [];

      if (modelsEl) {
        if (!models.length) {
          modelsEl.innerHTML = '<div class="brain-dash-empty">暂无模型数据</div>';
        } else {
          modelsEl.innerHTML = models.map(m => `
            <div class="brain-dash-card brain-dash-model-card">
              <div class="brain-dash-card-top">
                <div class="brain-dash-card-icon is-model"><i data-lucide="cpu"></i></div>
                <span class="brain-dash-badge is-ok">在线</span>
              </div>
              <div class="brain-dash-card-name">${this.esc(m.name || m.model || m.ref)}</div>
              <div class="brain-dash-card-meta">
                <span>${this.esc(m.provider || 'unknown')}</span>
                <span>ctx ${this.esc(String(m.contextWindow || '--'))}</span>
              </div>
              <div class="brain-dash-card-tags">
                ${m.reasoning ? '<span class="brain-dash-tag">推理</span>' : ''}
                ${m.multimodal ? '<span class="brain-dash-tag">多模态</span>' : ''}
                ${m.role ? `<span class="brain-dash-tag is-primary">${this.esc(m.role)}</span>` : ''}
              </div>
            </div>
          `).join('');
        }
      }

      if (sessionsEl) {
        if (!sessions.length) {
          sessionsEl.innerHTML = '<div class="brain-dash-empty">暂无会话数据</div>';
        } else {
          const sorted = [...sessions].sort((a, b) => (b.messageCount || 0) - (a.messageCount || 0));
          sorted.forEach(s => {
            const updatedAt = s.updatedAt ? new Date(s.updatedAt) : null;
            const timeStr = updatedAt ? updatedAt.toLocaleString('zh-CN', { hour12: false }) : '未知';
            const ageStr = updatedAt ? this.formatAge(Date.now() - s.updatedAt) : '--';
            const provider = s.origin?.provider || s.modelProvider || 'unknown';
            const isActive = updatedAt && (Date.now() - s.updatedAt < 5 * 60 * 1000);
            const sessionTitle = s.title || s.key || '未知会话';
            const truncatedTitle = sessionTitle.length > 28 ? sessionTitle.slice(0, 28) + '…' : sessionTitle;

            const el = document.createElement('div');
            el.className = `brain-dash-card brain-dash-session-card${isActive ? ' is-active' : ''}`;
            el.innerHTML = `
              <div class="brain-dash-card-top">
                <div class="brain-dash-card-icon is-session"><i data-lucide="message-square"></i></div>
                <span class="brain-dash-badge ${isActive ? 'is-ok' : 'is-dim'}">${isActive ? '活跃' : ageStr}</span>
              </div>
              <div class="brain-dash-card-name" title="${this.esc(sessionTitle)}">${this.esc(truncatedTitle)}</div>
              <div class="brain-dash-card-meta">
                <span>${this.esc(provider)}</span>
                <span>${s.messageCount || 0} 条</span>
              </div>
              <div class="brain-dash-card-tags">
                <span class="brain-dash-tag">${this.esc(s.model || 'unknown')}</span>
                <span class="brain-dash-tag">${this.esc(s.kind || 'unknown')}</span>
              </div>
            `;
            sessionsEl.appendChild(el);
          });
        }
      }

      const cronEl = this.view?.querySelector('#brainDashCron');
      if (cronEl) {
        const jobs = Array.isArray(cronData.jobs) ? cronData.jobs : [];
        if (!jobs.length) {
          cronEl.innerHTML = '<div class="brain-dash-empty">暂无定时任务</div>';
        } else {
          cronEl.innerHTML = jobs.map(job => {
            const status = job.state?.lastRunStatus || job.state?.lastStatus || 'unknown';
            const statusClass = status === 'ok' ? 'is-ok' : status === 'error' ? 'is-danger' : 'is-warn';
            const statusLabel = status === 'ok' ? '正常' : status === 'error' ? '异常' : '等待';
            const lastRun = job.lastRun?.at
              ? new Date(job.lastRun.at).toLocaleString('zh-CN', { hour12: false })
              : '从未';
            const lastDur = job.lastRun?.durationMs
              ? `${(job.lastRun.durationMs / 1000).toFixed(1)}s`
              : '--';
            const nextRun = job.nextRun
              ? new Date(job.nextRun).toLocaleString('zh-CN', { hour12: false })
              : '未配置';
            const scheduleStr = job.schedule?.expr || '--';
            return `
              <div class="brain-dash-cron-row">
                <div class="brain-dash-cron-name">${this.esc(job.name)}</div>
                <div class="brain-dash-cron-schedule">${this.esc(scheduleStr)}</div>
                <div class="brain-dash-cron-last">
                  <span>${lastRun}</span>
                  <span class="brain-dash-cron-dur">${lastDur}</span>
                </div>
                <div class="brain-dash-cron-next">${this.esc(nextRun)}</div>
                <div class="brain-dash-cron-status">
                  <span class="brain-dash-cron-badge ${statusClass}">${statusLabel}</span>
                </div>
              </div>
            `;
          }).join('');
        }
      }

      if (window.lucide) window.lucide.createIcons();
    } catch (error) {
      if (modelsEl) modelsEl.innerHTML = `<div class="brain-dash-empty">加载失败：${this.esc(error.message)}</div>`;
      if (sessionsEl) sessionsEl.innerHTML = '<div class="brain-dash-empty">加载失败</div>';
      const cronEl = this.view?.querySelector('#brainDashCron');
      if (cronEl) cronEl.innerHTML = '<div class="brain-dash-empty">加载失败</div>';
      if (window.lucide) window.lucide.createIcons();
    }
  }

  formatAge(ms) {
    if (ms < 60000) return '刚刚';
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m`;
    if (ms < 86400000) return `${Math.floor(ms / 3600000)}h`;
    return `${Math.floor(ms / 86400000)}d`;
  }

  async refreshMemoryViewer() {
    const listEl = this.view?.querySelector('#brainMemoryFileList');
    const rootListEl = this.view?.querySelector('#brainMemoryRootList');
    const previewContent = this.view?.querySelector('#brainMemoryPreviewContent');
    const previewTitle = this.view?.querySelector('#brainMemoryPreviewTitle');
    const previewEmpty = this.view?.querySelector('.brain-memory-empty-state');

    if (!listEl) return;

    // Load long-term memory (MEMORY.md)
    this.refreshMemoryRoot(rootListEl, previewContent, previewTitle, previewEmpty);
    // Load daily memory files
    listEl.innerHTML = '<div class="brain-memory-loading">加载中...</div>';

    try {
      const res = await fetch('/api/memory-files');
      if (!res.ok) throw new Error('加载失败');
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const entries = data.entries || [];
      const pinned = data.pinned || [];

      if (!entries.length) {
        listEl.innerHTML = '<div class="brain-memory-loading">memory 目录为空</div>';
        return;
      }

      // Build file list HTML
      let html = '';
      entries.forEach((file, idx) => {
        const isPinned = pinned.includes(file.name);
        const isFirst = idx === 0;
        const pinnedLabel = isPinned ? ' <span class="brain-memory-pin">固定</span>' : '';
        const sizeLabel = this.formatFileSize(file.size);
        const dateStr = new Date(file.mtime).toLocaleDateString('zh-CN', { hour12: false });
        html += `
          <button class="brain-memory-file-item${isFirst ? ' active' : ''}" data-name="${this.esc(file.name)}" data-path="${this.esc(file.path)}">
            <div class="brain-memory-file-icon"><i data-lucide="file-text"></i></div>
            <div class="brain-memory-file-body">
              <div class="brain-memory-file-name">${this.esc(file.name)}${pinnedLabel}</div>
              <div class="brain-memory-file-meta">
                <span>${dateStr}</span>
                <span>${sizeLabel}</span>
              </div>
            </div>
          </button>
        `;
      });
      listEl.innerHTML = html;

      // Click handlers
      listEl.querySelectorAll('.brain-memory-file-item').forEach(btn => {
        btn.addEventListener('click', async () => {
          listEl.querySelectorAll('.brain-memory-file-item').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          const name = btn.dataset.name;
          const fileRes = await fetch(`/api/memory-file?file=${encodeURIComponent(name)}`);
          const fileData = await fileRes.json();

          if (previewTitle) previewTitle.textContent = name;
          if (previewEmpty) previewEmpty.style.display = 'none';
          if (previewContent) {
            if (fileData.error || !fileData.content) {
              previewContent.innerHTML = `<div class="brain-memory-loading">读取失败：${this.esc(fileData.error || '未知错误')}</div>`;
            } else {
              previewContent.innerHTML = this.renderMarkdown(fileData.content);
            }
            previewContent.style.display = 'block';
          }
          if (window.lucide) window.lucide.createIcons();
        });
      });

      // Auto-select first file
      const firstBtn = listEl.querySelector('.brain-memory-file-item');
      if (firstBtn) firstBtn.click();

      if (window.lucide) window.lucide.createIcons();
    } catch (error) {
      listEl.innerHTML = `<div class="brain-memory-loading">加载失败：${this.esc(error.message)}</div>`;
      if (window.lucide) window.lucide.createIcons();
    }
  }

  async refreshMemoryRoot(rootListEl, previewContent, previewTitle, previewEmpty) {
    if (!rootListEl) return;
    rootListEl.innerHTML = '<div class="brain-memory-loading">加载中...</div>';

    try {
      const res = await fetch('/api/memory-root');
      if (!res.ok) throw new Error('加载失败');
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const entries = data.entries || [];
      if (!entries.length) {
        rootListEl.innerHTML = '<div class="brain-memory-loading">无长期数据</div>';
        return;
      }

      let html = '';
      entries.forEach((file, idx) => {
        const isFirst = idx === 0;
        const sizeLabel = this.formatFileSize(file.size);
        const dateStr = new Date(file.mtime).toLocaleDateString('zh-CN', { hour12: false });
        html += `
          <button class="brain-memory-file-item${isFirst ? ' active' : ''}" data-name="${this.esc(file.name)}" data-path="${this.esc(file.path)}">
            <div class="brain-memory-file-icon"><i data-lucide="database"></i></div>
            <div class="brain-memory-file-body">
              <div class="brain-memory-file-name">${this.esc(file.name)}</div>
              <div class="brain-memory-file-meta">
                <span>${dateStr}</span>
                <span>${sizeLabel}</span>
              </div>
            </div>
          </button>
        `;
      });
      rootListEl.innerHTML = html;

      rootListEl.querySelectorAll('.brain-memory-file-item').forEach(btn => {
        btn.addEventListener('click', async () => {
          rootListEl.querySelectorAll('.brain-memory-file-item').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          const name = btn.dataset.name;
          const fileRes = await fetch(`/api/memory-root-file?file=${encodeURIComponent(name)}`);
          const fileData = await fileRes.json();

          if (previewTitle) previewTitle.textContent = name;
          if (previewEmpty) previewEmpty.style.display = 'none';
          if (previewContent) {
            if (fileData.error || !fileData.content) {
              previewContent.innerHTML = `<div class="brain-memory-loading">读取失败：${this.esc(fileData.error || '未知错误')}</div>`;
            } else {
              previewContent.innerHTML = this.renderMarkdown(fileData.content);
            }
            previewContent.style.display = 'block';
          }
          if (window.lucide) window.lucide.createIcons();
        });
      });

      const firstBtn = rootListEl.querySelector('.brain-memory-file-item');
      if (firstBtn) firstBtn.click();

      if (window.lucide) window.lucide.createIcons();
    } catch (error) {
      rootListEl.innerHTML = `<div class="brain-memory-loading">加载失败：${this.esc(error.message)}</div>`;
      if (window.lucide) window.lucide.createIcons();
    }
  }

  renderMarkdown(content) {
    // Basic markdown to HTML renderer
    let html = content
      // Escape HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Code blocks
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="md-code-block"><code>$2</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="md-code">$1</code>')
      // Headers
      .replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Blockquote
      .replace(/^> (.+)$/gm, '<blockquote class="md-blockquote">$1</blockquote>')
      // Unordered list
      .replace(/^[\-\*] (.+)$/gm, '<li class="md-li">$1</li>')
      // Ordered list
      .replace(/^\d+\. (.+)$/gm, '<li class="md-li">$1</li>')
      // Horizontal rule
      .replace(/^---$/gm, '<hr class="md-hr">')
      // Paragraphs (lines that aren't special)
      .split('\n\n')
      .map(block => {
        block = block.trim();
        if (!block) return '';
        if (block.startsWith('<')) return block;
        // Wrap non-list lines as paragraphs
        if (!block.match(/^<li/)) block = `<p class="md-p">${block.replace(/\n/g, '<br>')}</p>`;
        else block = `<ul class="md-ul">${block}</ul>`;
        return block;
      })
      .join('\n');

    return `<div class="md-body">${html}</div>`;
  }

  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + 'B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
    return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
  }

  async refreshSkillsCatalog() {
    const tableEl = this.view?.querySelector('#brainSkillsTable');
    const countEl = this.view?.querySelector('#brainSkillsCount');
    const tabsEl = this.view?.querySelector('#brainSkillsTabs');
    if (!tableEl) return;

    tableEl.innerHTML = '<div class="brain-skills-loading">加载中...</div>';

    try {
      const res = await fetch('/api/skills');
      if (!res.ok) throw new Error('加载失败');
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const allSkills = data.entries || [];

      const renderTable = (skills) => {
        if (!skills.length) {
          tableEl.innerHTML = '<div class="brain-skills-loading">暂无技能</div>';
          return;
        }
        tableEl.innerHTML = `
          <table class="brain-skills-tbl">
            <thead>
              <tr>
                <th>技能名称</th>
                <th>描述</th>
                <th>来源</th>
                <th>部门</th>
                <th>引用智能体</th>
              </tr>
            </thead>
            <tbody>
              ${skills.map(s => {
                const sourceLabel = s.source === 'builtin' ? '内置' : '自定义';
                const sourceClass = s.source === 'builtin' ? 'is-builtin' : 'is-custom';
                return `
                  <tr class="brain-skill-row">
                    <td class="brain-skill-td-name">${this.esc(s.name)}</td>
                    <td class="brain-skill-td-desc">${this.esc(s.description)}</td>
                    <td><span class="brain-skill-source ${sourceClass}">${sourceLabel}</span></td>
                    <td><span class="brain-skill-cat">${this.esc(s.category)}</span></td>
                    <td>
                      <span class="brain-skill-agent">
                        <i data-lucide="bot"></i>
                        <span>main</span>
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        `;
      };

      // Initial render
      renderTable(allSkills);
      if (countEl) countEl.textContent = `共 ${allSkills.length} 个技能`;

      // Tab filtering
      if (tabsEl) {
        tabsEl.querySelectorAll('.brain-skills-tab').forEach(tab => {
          tab.addEventListener('click', () => {
            tabsEl.querySelectorAll('.brain-skills-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const filter = tab.dataset.filter;
            const filtered = filter === 'all' ? allSkills : allSkills.filter(s => s.source === filter);
            renderTable(filtered);
          });
        });
      }

      if (window.lucide) window.lucide.createIcons();
    } catch (error) {
      tableEl.innerHTML = `<div class="brain-skills-loading">加载失败：${this.esc(error.message)}</div>`;
      if (window.lucide) window.lucide.createIcons();
    }
  }

  esc(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  render() {
    this.view = document.createElement('div');
    this.view.className = 'module-view module-brain';
    this.view.id = 'brainView';
    this.view.innerHTML = `
      <div class="module-page ${this.currentPage === 'dashboard' ? 'active' : ''}" data-page="dashboard">
        <div class="dashboard brain-dashboard-root">
          <div class="brain-overview-cards" id="brainDashOverviewCards">
            <div class="panel brain-overview-card" data-link="daily-briefing">
              <div class="brain-overview-card-body">
                <div class="brain-overview-card-icon"><i data-lucide="file-text"></i></div>
                <div class="brain-overview-card-info">
                  <div class="brain-overview-card-label">每日简报</div>
                  <div class="brain-overview-card-value" id="brainDashOverview_briefing">--</div>
                  <div class="brain-overview-card-sub" id="brainDashOverview_briefingSub">--</div>
                </div>
                <div class="brain-overview-card-link"><i data-lucide="chevron-right"></i></div>
              </div>
            </div>
            <div class="panel brain-overview-card" data-link="memory-viewer">
              <div class="brain-overview-card-body">
                <div class="brain-overview-card-icon"><i data-lucide="database"></i></div>
                <div class="brain-overview-card-info">
                  <div class="brain-overview-card-label">内存统计</div>
                  <div class="brain-overview-card-value" id="brainDashOverview_memory">--</div>
                  <div class="brain-overview-card-sub" id="brainDashOverview_memorySub">--</div>
                </div>
                <div class="brain-overview-card-link"><i data-lucide="chevron-right"></i></div>
              </div>
            </div>
            <div class="panel brain-overview-card" data-link="schedules">
              <div class="brain-overview-card-body">
                <div class="brain-overview-card-icon"><i data-lucide="activity"></i></div>
                <div class="brain-overview-card-info">
                  <div class="brain-overview-card-label">自动化任务</div>
                  <div class="brain-overview-card-value" id="brainDashOverview_cron">--</div>
                  <div class="brain-overview-card-sub" id="brainDashOverview_cronSub">--</div>
                </div>
                <div class="brain-overview-card-link"><i data-lucide="chevron-right"></i></div>
              </div>
            </div>
            <div class="panel brain-overview-card" data-link="skills-catalog">
              <div class="brain-overview-card-body">
                <div class="brain-overview-card-icon"><i data-lucide="grid-3x3"></i></div>
                <div class="brain-overview-card-info">
                  <div class="brain-overview-card-label">技能数量</div>
                  <div class="brain-overview-card-value" id="brainDashOverview_skills">--</div>
                  <div class="brain-overview-card-sub" id="brainDashOverview_skillsSub">--</div>
                </div>
                <div class="brain-overview-card-link"><i data-lucide="chevron-right"></i></div>
              </div>
            </div>
          </div>

          <div class="brain-dash-section">
            <div class="brain-dash-section-header">
              <i data-lucide="cpu"></i>
              <span>Models</span>
            </div>
            <div class="brain-dash-models-grid" id="brainDashModels">
              <div class="brain-dash-loading">加载中...</div>
            </div>
          </div>

          <div class="brain-dash-section">
            <div class="brain-dash-section-header">
              <i data-lucide="message-square"></i>
              <span>动态会话</span>
            </div>
            <div class="brain-dash-sessions-grid" id="brainDashSessions">
              <div class="brain-dash-loading">加载中...</div>
            </div>
          </div>

          <div class="brain-dash-section">
            <div class="brain-dash-section-header">
              <i data-lucide="clock"></i>
              <span>定时任务</span>
            </div>
            <div class="brain-dash-cron-list" id="brainDashCron">
              <div class="brain-dash-loading">加载中...</div>
            </div>
          </div>
        </div>
      </div>

      <div class="module-page ${this.currentPage === 'mission-control' ? 'active' : ''}" data-page="mission-control">
        <div class="dashboard brain-dashboard-root">
          <div class="brain-overview-cards">
            <div class="panel brain-overview-card" data-link="daily-briefing">
              <div class="brain-overview-card-body">
                <div class="brain-overview-card-icon"><i data-lucide="file-text"></i></div>
                <div class="brain-overview-card-info">
                  <div class="brain-overview-card-label">每日简报</div>
                  <div class="brain-overview-card-value" id="brainOverview_briefing">--</div>
                  <div class="brain-overview-card-sub" id="brainOverview_briefingSub">--</div>
                </div>
                <div class="brain-overview-card-link"><i data-lucide="chevron-right"></i></div>
              </div>
            </div>

            <div class="panel brain-overview-card" data-link="memory-viewer">
              <div class="brain-overview-card-body">
                <div class="brain-overview-card-icon"><i data-lucide="database"></i></div>
                <div class="brain-overview-card-info">
                  <div class="brain-overview-card-label">内存统计</div>
                  <div class="brain-overview-card-value" id="brainOverview_memory">--</div>
                  <div class="brain-overview-card-sub" id="brainOverview_memorySub">--</div>
                </div>
                <div class="brain-overview-card-link"><i data-lucide="chevron-right"></i></div>
              </div>
            </div>

            <div class="panel brain-overview-card" data-link="schedules">
              <div class="brain-overview-card-body">
                <div class="brain-overview-card-icon"><i data-lucide="activity"></i></div>
                <div class="brain-overview-card-info">
                  <div class="brain-overview-card-label">自动化任务</div>
                  <div class="brain-overview-card-value" id="brainOverview_cron">--</div>
                  <div class="brain-overview-card-sub" id="brainOverview_cronSub">--</div>
                </div>
                <div class="brain-overview-card-link"><i data-lucide="chevron-right"></i></div>
              </div>
            </div>

            <div class="panel brain-overview-card" data-link="skills-catalog">
              <div class="brain-overview-card-body">
                <div class="brain-overview-card-icon"><i data-lucide="grid-3x3"></i></div>
                <div class="brain-overview-card-info">
                  <div class="brain-overview-card-label">技能数量</div>
                  <div class="brain-overview-card-value" id="brainOverview_skills">--</div>
                  <div class="brain-overview-card-sub" id="brainOverview_skillsSub">--</div>
                </div>
                <div class="brain-overview-card-link"><i data-lucide="chevron-right"></i></div>
              </div>
            </div>
          </div>

          <div class="brain-dash-section">
            <div class="brain-dash-section-header">
              <i data-lucide="cpu"></i>
              <span>Models</span>
            </div>
            <div class="brain-dash-models-grid" id="brainDashModels">
              <div class="brain-dash-loading">加载中...</div>
            </div>
          </div>

          <div class="brain-dash-section">
            <div class="brain-dash-section-header">
              <i data-lucide="message-square"></i>
              <span>动态会话</span>
            </div>
            <div class="brain-dash-sessions-grid" id="brainDashSessions">
              <div class="brain-dash-loading">加载中...</div>
            </div>
          </div>

          <div class="brain-dash-section">
            <div class="brain-dash-section-header">
              <i data-lucide="clock"></i>
              <span>定时任务</span>
            </div>
            <div class="brain-dash-cron-list" id="brainDashCron">
              <div class="brain-dash-loading">加载中...</div>
            </div>
          </div>
        </div>
      </div>

      <div class="module-page ${this.currentPage === 'daily-briefing' ? 'active' : ''}" data-page="daily-briefing">
        <div class="dashboard single-page-dashboard">
          <div class="brain-briefing-shell">
            <aside class="brain-briefing-master">
              <div class="panel-header"><i data-lucide="history"></i>历史简报</div>
              <div class="brain-briefing-history" id="brainBriefingHistory"></div>
            </aside>
            <section class="brain-briefing-detail active" id="brainBriefingDetail">
              <div class="brain-briefing-empty">加载中...</div>
            </section>
          </div>
        </div>
      </div>

      <div class="module-page ${this.currentPage === 'automations' ? 'active' : ''}" data-page="automations">
        <div class="dashboard single-page-dashboard">
          <div class="brain-briefing-shell">
            <aside class="brain-briefing-master">
              <div class="panel-header"><i data-lucide="bot"></i>自动化任务</div>
              <div class="brain-briefing-history" id="brainAutomationHistory"></div>
            </aside>
            <section class="brain-briefing-detail active" id="brainAutomationDetail">
              <div class="brain-briefing-empty">加载中...</div>
            </section>
          </div>
        </div>
      </div>

      <div class="module-page ${this.currentPage === 'os-documentation' ? 'active' : ''}" data-page="os-documentation">
        <div class="dashboard single-page-dashboard">
          <section class="brain-briefing-detail brain-doc-detail active" id="brainSystemReferenceDetail">
            <div class="brain-briefing-empty">加载中...</div>
          </section>
        </div>
      </div>

      <div class="module-page ${this.currentPage === 'data-analysis' ? 'active' : ''}" data-page="data-analysis">
        <div class="dashboard single-page-dashboard">
          <div class="brain-data-shell">
            <div class="brain-data-header">
              <div class="brain-data-header-text">
                <div class="brain-briefing-detail-kicker">Data Analysis</div>
                <h2 class="brain-data-title">系统事件统一时间线</h2>
                <p class="brain-briefing-detail-lead">整合大脑模块的所有系统事件，按时间轴展示关联统计。</p>
              </div>
            </div>

            <div class="brain-data-stats" id="brainDataStats">
              <div class="brain-data-stat-card">
                <div class="brain-data-stat-icon"><i data-lucide="activity"></i></div>
                <div class="brain-data-stat-body">
                  <div class="brain-data-stat-value" id="brainDataTotalEvents">--</div>
                  <div class="brain-data-stat-label">总事件数</div>
                </div>
              </div>
              <div class="brain-data-stat-card">
                <div class="brain-data-stat-icon"><i data-lucide="message-square"></i></div>
                <div class="brain-data-stat-body">
                  <div class="brain-data-stat-value" id="brainDataTotalSessions">--</div>
                  <div class="brain-data-stat-label">总会话数</div>
                </div>
              </div>
              <div class="brain-data-stat-card">
                <div class="brain-data-stat-icon"><i data-lucide="clock"></i></div>
                <div class="brain-data-stat-body">
                  <div class="brain-data-stat-value" id="brainDataUptime">--</div>
                  <div class="brain-data-stat-label">运行时长</div>
                </div>
              </div>
              <div class="brain-data-stat-card">
                <div class="brain-data-stat-icon"><i data-lucide="zap"></i></div>
                <div class="brain-data-stat-body">
                  <div class="brain-data-stat-value" id="brainDataActiveNow">--</div>
                  <div class="brain-data-stat-label">当前活跃</div>
                </div>
              </div>
            </div>

            <div class="brain-data-two-col">
              <div class="brain-data-col">
                <div class="panel">
                  <div class="panel-header"><i data-lucide="cpu"></i>模型分布</div>
                  <div class="panel-body">
                    <div class="brain-data-model-list" id="brainDataModelList">
                      <div class="brain-briefing-empty">加载中...</div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="brain-data-col">
                <div class="panel">
                  <div class="panel-header"><i data-lucide="flame"></i>热门会话</div>
                  <div class="panel-body">
                    <div class="brain-data-hot-list" id="brainDataHotList">
                      <div class="brain-briefing-empty">加载中...</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="panel">
              <div class="panel-header"><i data-lucide="layout-list"></i>会话类型</div>
              <div class="panel-body">
                <div class="brain-data-session-types" id="brainDataSessionTypes">
                  <div class="brain-briefing-empty">加载中...</div>
                </div>
              </div>
            </div>

            <div class="panel">
              <div class="panel-header"><i data-lucide="git-branch"></i>统一时间线</div>
              <div class="panel-body">
                <div class="brain-data-timeline" id="brainDataTimeline">
                  <div class="brain-briefing-empty">加载中...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="module-page ${this.currentPage === 'memory-viewer' ? 'active' : ''}" data-page="memory-viewer">
        <div class="brain-memory-shell">
          <aside class="brain-memory-sidebar">
            <div class="panel-header"><i data-lucide="database"></i>长期数据</div>
            <div class="brain-memory-file-list" id="brainMemoryRootList">
              <div class="brain-memory-loading">加载中...</div>
            </div>
            <div class="panel-header" style="margin-top:12px"><i data-lucide="folder"></i>每日记录</div>
            <div class="brain-memory-file-list" id="brainMemoryFileList">
              <div class="brain-memory-loading">加载中...</div>
            </div>
          </aside>
          <section class="brain-memory-preview">
            <div class="panel-header"><i data-lucide="file-text"></i><span id="brainMemoryPreviewTitle">预览</span></div>
            <div class="panel-body brain-memory-markdown-body">
              <div class="brain-memory-empty-state">
                <i data-lucide="mouse-pointer-click"></i>
                <span>点击左侧文件查看内容</span>
              </div>
              <div id="brainMemoryPreviewContent" style="display:none"></div>
            </div>
          </section>
        </div>
      </div>

      <div class="module-page ${this.currentPage === 'skills-catalog' ? 'active' : ''}" data-page="skills-catalog">
        <div class="dashboard single-page-dashboard">
          <div class="brain-skills-header">
            <div class="brain-skills-header-left">
              <div class="brain-skills-title">
                <i data-lucide="grid-3x3"></i>
                <span>技能目录</span>
              </div>
              <div class="brain-skills-count" id="brainSkillsCount"></div>
            </div>
            <div class="brain-skills-tabs" id="brainSkillsTabs">
              <button class="brain-skills-tab active" data-filter="all">全部</button>
              <button class="brain-skills-tab" data-filter="builtin">内置</button>
              <button class="brain-skills-tab" data-filter="custom">自定义</button>
            </div>
          </div>
          <div class="brain-skills-table-wrap" id="brainSkillsTable">
            <div class="brain-skills-loading">加载中...</div>
          </div>
        </div>
      </div>

      <div class="module-page ${this.currentPage === 'agents' ? 'active' : ''}" data-page="agents">
        <div class="dashboard single-page-dashboard">
          <div class="panel">
            <div class="panel-header">
              <i data-lucide="bot"></i>
              智能体
            </div>
            <div class="panel-body">
              <div class="page-placeholder-grid">
                <div class="page-placeholder-card">
                  <div class="page-placeholder-title">智能体目录</div>
                  <div class="module-empty-copy">后续在这里管理不同角色智能体、状态、能力与分工。</div>
                </div>
                <div class="page-placeholder-card">
                  <div class="page-placeholder-title">协作状态</div>
                  <div class="module-empty-copy">预留接入运行状态、负载、最近任务与异常告警。</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="module-page ${this.currentPage === 'schedules' ? 'active' : ''}" data-page="schedules">
        <div class="dashboard single-page-dashboard">
          <div class="panel">
            <div class="panel-header">
              <i data-lucide="calendar-clock"></i>
              定时任务
            </div>
            <div class="panel-body">
              <div class="page-placeholder-card">
                <div class="page-placeholder-title">定时任务页面</div>
                <div class="module-empty-copy">后续在这里管理自动化任务、执行计划、运行日志和失败重试策略。</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.getElementById('mainContent').appendChild(this.view);
    if (window.lucide) window.lucide.createIcons();
  }

  updatePageVisibility() {
    if (!this.view) return;
    this.view.querySelectorAll('.module-page').forEach(page => {
      page.classList.toggle('active', page.dataset.page === this.currentPage);
    });
  }
}

window.BrainModule = BrainModule;
