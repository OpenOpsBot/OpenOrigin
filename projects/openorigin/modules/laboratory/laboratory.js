class LaboratoryModule {
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
    this.view.className = 'module-view module-laboratory';
    this.view.id = 'laboratoryView';
    this.view.innerHTML = `
      <div class="section-title">实验室模块</div>
      <div class="dashboard">
        <div class="panel">
          <div class="panel-header">
            <i data-lucide="flask-conical"></i>
            实验功能
          </div>
          <div class="panel-body">
            <div class="feature-list">
              <div class="feature-item">
                <span class="feature-name">图片生成</span>
                <span class="feature-status coming-soon">规划中</span>
              </div>
              <div class="feature-item">
                <span class="feature-name">音乐生成</span>
                <span class="feature-status coming-soon">规划中</span>
              </div>
              <div class="feature-item">
                <span class="feature-name">视频生成</span>
                <span class="feature-status coming-soon">规划中</span>
              </div>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <i data-lucide="box"></i>
            工具箱
          </div>
          <div class="panel-body">
            <div class="module-empty-copy">这里保留给实验性能力、原型工作流和未来快速验证工具。</div>
          </div>
        </div>
      </div>
    `;
    document.getElementById('mainContent').appendChild(this.view);
    if (window.lucide) window.lucide.createIcons();
  }
}

window.LaboratoryModule = LaboratoryModule;
