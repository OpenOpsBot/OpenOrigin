class BrainModule {
  constructor() {
    this.view = null;
    this.currentPage = 'dashboard';
    this.briefingTab = 'overview';
  }

  show(pageKey = 'dashboard') {
    this.currentPage = pageKey;
    if (!this.view) this.render();
    this.view.classList.add('active');
    this.updatePageVisibility();
    if (pageKey === 'daily-briefing') this.refreshBriefing();
  }

  hide() {
    if (this.view) this.view.classList.remove('active');
  }

  async refreshBriefing() {
    this.showBriefingTab(this.briefingTab);
    if (window.lucide) window.lucide.createIcons();
  }

  showBriefingTab(tab) {
    this.briefingTab = tab;
    this.view?.querySelectorAll('.brain-briefing-nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    this.view?.querySelectorAll('.brain-briefing-detail').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === tab);
    });
    this.renderBriefingContent(tab);
  }

  getBriefingContent() {
    return {
      overview: {
        title: '任务概览',
        icon: 'layout-dashboard',
        lead: '每日简报页面展示的是自动化任务 daily-briefing 的内容约定：每天早晨生成一份对老板真正有用的总结，而不是堆状态面板。',
        bullets: [
          '优先读取当天 memory、最近项目变更、相关 docs 或任务文件。',
          '输出必须是结构清晰、易读的 Markdown。',
          '默认只写入本地每日文件，减少无意义打扰。'
        ]
      },
      markdown: {
        title: 'Markdown 输出格式',
        icon: 'file-text',
        lead: '简报固定围绕优先级、夜间活动、待处理事项和需要老板关注的内容，方便快速扫读。',
        markdown: `## 每日简报\n\n### 今日优先级\n- 列出今天最值得先做的事\n\n### 夜间活动\n- 总结自动化任务、项目改动、异常或完成项\n\n### 待处理事项\n- 列出还没收尾的工作\n\n### 需要老板关注\n- 只保留真的需要决策、确认或知晓的点\n\n> 如果信息不足，要明确写“暂无足够数据”，不能编造。`
      },
      storage: {
        title: '保存到每日文件',
        icon: 'save',
        lead: '生成后的简报会追加写入当天文件，形成每天可回看的记录。',
        bullets: [
          '目标路径：`/Users/ze/.openclaw/workspace/memory/YYYY-MM-DD.md`',
          '写入方式：追加到 `## 每日简报` 标题下方。',
          '要求真实可追溯；缺数据可以留白，但不能捏造。'
        ]
      },
      delivery: {
        title: '可选消息发送',
        icon: 'send',
        lead: '外发不是默认动作。只有任务明确要求，且环境允许时，才会额外通过消息工具发送摘要。',
        bullets: [
          '默认行为：只写文件，不主动打扰。',
          '需要发送时：发简短摘要，不整段复制全文。',
          '消息发送必须服从权限、场景和渠道约束。'
        ]
      }
    };
  }

  renderBriefingContent(tab) {
    const content = this.getBriefingContent()[tab];
    const id = `#brainBriefing${tab[0].toUpperCase()}${tab.slice(1)}Detail`;
    const el = this.view?.querySelector(id);
    if (!el || !content) return;

    const bulletsHtml = Array.isArray(content.bullets)
      ? `<ul class="brain-briefing-list">${content.bullets.map(item => `<li>${this.esc(item)}</li>`).join('')}</ul>`
      : '';

    const markdownHtml = content.markdown
      ? `<pre class="brain-briefing-markdown-preview"><code>${this.esc(content.markdown)}</code></pre>`
      : '';

    el.innerHTML = `
      <div class="brain-briefing-section-header">
        <div class="brain-briefing-section-title"><i data-lucide="${content.icon}"></i>${this.esc(content.title)}</div>
      </div>
      <div class="brain-briefing-prose">
        <p>${this.esc(content.lead)}</p>
        ${bulletsHtml}
        ${markdownHtml}
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
            <div class="brain-briefing-master">
              <div class="panel-header"><i data-lucide="layout-dashboard"></i>每日简报</div>
              <div class="brain-briefing-nav">
                <button class="brain-briefing-nav-item active" data-tab="overview">
                  <i data-lucide="layout-dashboard"></i>
                  <div class="brain-briefing-nav-body">
                    <div class="brain-briefing-nav-label">任务概览</div>
                    <div class="brain-briefing-nav-value">01</div>
                    <div class="brain-briefing-nav-sub">自动化任务说明</div>
                  </div>
                </button>
                <button class="brain-briefing-nav-item" data-tab="markdown">
                  <i data-lucide="file-text"></i>
                  <div class="brain-briefing-nav-body">
                    <div class="brain-briefing-nav-label">Markdown</div>
                    <div class="brain-briefing-nav-value">02</div>
                    <div class="brain-briefing-nav-sub">易读输出结构</div>
                  </div>
                </button>
                <button class="brain-briefing-nav-item" data-tab="storage">
                  <i data-lucide="save"></i>
                  <div class="brain-briefing-nav-body">
                    <div class="brain-briefing-nav-label">落盘</div>
                    <div class="brain-briefing-nav-value">03</div>
                    <div class="brain-briefing-nav-sub">保存到每日文件</div>
                  </div>
                </button>
                <button class="brain-briefing-nav-item" data-tab="delivery">
                  <i data-lucide="send"></i>
                  <div class="brain-briefing-nav-body">
                    <div class="brain-briefing-nav-label">发送</div>
                    <div class="brain-briefing-nav-value">04</div>
                    <div class="brain-briefing-nav-sub">消息工具可选发送</div>
                  </div>
                </button>
              </div>
            </div>

            <div class="brain-briefing-detail active" data-tab="overview" id="brainBriefingOverviewDetail">
              <div class="brain-briefing-empty">加载中...</div>
            </div>
            <div class="brain-briefing-detail" data-tab="markdown" id="brainBriefingMarkdownDetail">
              <div class="brain-briefing-empty">加载中...</div>
            </div>
            <div class="brain-briefing-detail" data-tab="storage" id="brainBriefingStorageDetail">
              <div class="brain-briefing-empty">加载中...</div>
            </div>
            <div class="brain-briefing-detail" data-tab="delivery" id="brainBriefingDeliveryDetail">
              <div class="brain-briefing-empty">加载中...</div>
            </div>
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

    this.view.querySelectorAll('.brain-briefing-nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        this.showBriefingTab(btn.dataset.tab);
        if (window.lucide) window.lucide.createIcons();
      });
    });
  }

  updatePageVisibility() {
    if (!this.view) return;
    this.view.querySelectorAll('.module-page').forEach(page => {
      page.classList.toggle('active', page.dataset.page === this.currentPage);
    });
  }
}

window.BrainModule = BrainModule;
