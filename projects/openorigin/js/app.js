class App {
  constructor() {
    this.currentModule = null;
    this.modules = {};
    this.mainContent = document.getElementById('mainContent');
  }

  async init() {
    if (window.OpsModule) this.modules.ops = new OpsModule();
    if (window.BrainModule) this.modules.brain = new BrainModule();
    if (window.LaboratoryModule) this.modules.laboratory = new LaboratoryModule();

    if (window.TabManager) new TabManager();
    if (window.DockManager) new DockManager();

    this.switchModule('ops');
  }

  switchModule(moduleName) {
    if (this.currentModule === moduleName) return;

    Object.values(this.modules).forEach(m => {
      if (m && m.hide) m.hide();
    });

    if (this.modules[moduleName]) {
      this.modules[moduleName].show();
      this.currentModule = moduleName;
      document.body.setAttribute('data-active-module', moduleName);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.App = new App();
  window.App.init();
});
