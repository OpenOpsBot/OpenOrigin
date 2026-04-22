class BrainModule {
  constructor() {
    this.view = null;
    this.currentPage = 'dashboard';
  }

  show(pageKey = 'dashboard') {
    this.currentPage = pageKey;
    if (!this.view) this.render();
    this.view.classList.add('active');
    this.updatePageVisibility();
  }

  hide() {
    if (this.view) this.view.classList.remove('active');
  }

  render() {
    this.view = document.createElement('div');
    this.view.className = 'module-view module-brain';
    this.view.id = 'brainView';
    this.view.innerHTML = `
      <div class="section-title">大脑模块</div>

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
          <div class="panel">
            <div class="panel-header">
              <i data-lucide="newspaper"></i>
              每日简报
            </div>
            <div class="panel-body">
              <div class="page-placeholder-card">
                <div class="page-placeholder-title">每日简报页面</div>
                <div class="module-empty-copy">这里用于汇总当天重点事项、关键指标、异常提醒和建议动作。</div>
              </div>
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
  }

  updatePageVisibility() {
    if (!this.view) return;
    this.view.querySelectorAll('.module-page').forEach(page => {
      page.classList.toggle('active', page.dataset.page === this.currentPage);
    });
  }
}

window.BrainModule = BrainModule;
