class BrainModule {
  constructor() {
    this.view = null;
    this.currentPage = 'dashboard';
    this.briefings = [];
    this.selectedBriefingDate = null;
    this.automations = [];
    this.selectedAutomationName = null;
    this.automationCronError = '';
    this.systemReference = null;
  }

  show(pageKey = 'dashboard') {
    this.currentPage = pageKey;
    if (!this.view) this.render();
    this.view.classList.add('active');
    this.updatePageVisibility();
    if (pageKey === 'daily-briefing') this.refreshBriefing();
    if (pageKey === 'automations') this.refreshAutomations();
    if (pageKey === 'os-documentation') this.refreshSystemReference();
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
        <div class="dashboard">
          <div class="panel">
            <div class="panel-header">
              <i data-lucide="brain"></i>
              大脑能力概览
            </div>
            <div class="panel-body">
              <div class="feature-list">
                <div class="feature-item">
                  <span class="feature-name">记忆管理</span>
                  <span class="feature-status coming-soon">规划中</span>
                </div>
                <div class="feature-item">
                  <span class="feature-name">意图识别</span>
                  <span class="feature-status coming-soon">规划中</span>
                </div>
                <div class="feature-item">
                  <span class="feature-name">任务规划</span>
                  <span class="feature-status coming-soon">规划中</span>
                </div>
              </div>
            </div>
          </div>

          <div class="panel">
            <div class="panel-header">
              <i data-lucide="cpu"></i>
              多模型视角
            </div>
            <div class="panel-body">
              <div class="model-grid">
                <div class="model-card demo-offline">
                  <div class="model-card-top">
                    <span class="model-card-name">MiniMax M2.7</span>
                    <span class="feature-status offline">离线</span>
                  </div>
                  <div class="model-card-meta">演示卡片，占位用于后续多模型视图接入。</div>
                </div>
                <div class="model-card demo-offline">
                  <div class="model-card-top">
                    <span class="model-card-name">Codex 5.4</span>
                    <span class="feature-status offline">离线</span>
                  </div>
                  <div class="model-card-meta">预留训练营后续接入，当前使用演示数据展示布局。</div>
                </div>
              </div>
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
