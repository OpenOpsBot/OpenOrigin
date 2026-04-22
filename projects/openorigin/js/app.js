class App {
  constructor() {
    this.currentModule = null;
    this.currentPage = null;
    this.modules = {};
    this.mainContent = document.getElementById('mainContent');
    this.modulePages = {
      ops: [
        { key: 'dashboard', label: '仪表盘' },
        { key: 'tasks', label: '任务管理' },
        { key: 'deliverables', label: '交付追踪' }
      ],
      brain: [
        { key: 'dashboard', label: '仪表盘' },
        { key: 'daily-briefing', label: '每日简报' },
        { key: 'agents', label: '智能体' },
        { key: 'schedules', label: '定时任务' }
      ],
      laboratory: [
        { key: 'dashboard', label: '仪表盘' },
        { key: 'ideas', label: '创意库' }
      ]
    };
  }

  async init() {
    if (window.OpsModule) this.modules.ops = new OpsModule();
    if (window.BrainModule) this.modules.brain = new BrainModule();
    if (window.LaboratoryModule) this.modules.laboratory = new LaboratoryModule();

    if (window.TabManager) this.tabManager = new TabManager();
    if (window.DockManager) this.dockManager = new DockManager();

    this.switchModule('ops');
  }

  getPages(moduleName) {
    return this.modulePages[moduleName] || [];
  }

  getDefaultPage(moduleName) {
    return this.getPages(moduleName)[0]?.key || null;
  }

  switchModule(moduleName, pageKey = null) {
    if (!this.modules[moduleName]) return;

    Object.values(this.modules).forEach(m => {
      if (m && m.hide) m.hide();
    });

    const pages = this.getPages(moduleName);
    const preferredPage = pageKey || (this.currentModule === moduleName ? this.currentPage : this.getDefaultPage(moduleName));
    const targetPage = pages.some(page => page.key === preferredPage)
      ? preferredPage
      : this.getDefaultPage(moduleName);

    this.modules[moduleName].show(targetPage);
    this.currentModule = moduleName;
    this.currentPage = targetPage;
    document.body.setAttribute('data-active-module', moduleName);

    if (this.tabManager) {
      this.tabManager.setModule(moduleName, targetPage);
    }

    if (this.dockManager) {
      this.dockManager.setActive(moduleName);
    }
  }

  switchPage(pageKey) {
    if (!this.currentModule || !this.modules[this.currentModule]) return;
    const pages = this.getPages(this.currentModule);
    const targetPage = pages.some(page => page.key === pageKey)
      ? pageKey
      : this.getDefaultPage(this.currentModule);

    this.currentPage = targetPage;
    this.modules[this.currentModule].show(targetPage);

    if (this.tabManager) {
      this.tabManager.setPageActive(targetPage);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.App = new App();
  window.App.init();
});
