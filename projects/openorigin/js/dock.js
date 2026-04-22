class DockManager {
  constructor() {
    this.dock = document.getElementById('mainDock');
    this.items = Array.from(this.dock.querySelectorAll('.dock-item'));
    this.init();
  }

  init() {
    this.items.forEach(item => {
      item.addEventListener('click', () => {
        const moduleName = item.dataset.module;
        if (moduleName && window.App) window.App.switchModule(moduleName);
      });
    });
  }

  setActive(moduleName) {
    this.items.forEach(item => {
      item.classList.toggle('active', item.dataset.module === moduleName);
    });
  }
}

window.DockManager = DockManager;
