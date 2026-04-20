class BrainModule {
  constructor() {
    this.view = null;
  }

  show() {
    if (!this.view) {
      this.render();
    }
    this.view.classList.add('active');
  }

  hide() {
    if (this.view) {
      this.view.classList.remove('active');
    }
  }

  render() {
    this.view = document.createElement('div');
    this.view.className = 'module-view module-brain';
    this.view.id = 'brainView';
    this.view.innerHTML = `
      <div class="section-title">大脑模块</div>
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

        <div class="panel">
          <div class="panel-header">
            <i data-lucide="sparkles"></i>
            集成说明
          </div>
          <div class="panel-body">
            <div class="module-empty-copy">任务控制中心后续会向大脑模块收拢，现在先在运营模块中保持主视图。</div>
          </div>
        </div>
      </div>
    `;
    document.getElementById('mainContent').appendChild(this.view);
    if (window.lucide) window.lucide.createIcons();
  }
}

window.BrainModule = BrainModule;
