// Dock Management - Mac OS X style floating dock
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
        this.activateModule(moduleName);
      });
    });
  }

  activateModule(moduleName) {
    // Update dock active state
    this.items.forEach(item => {
      item.classList.toggle('active', item.dataset.module === moduleName);
    });

    // Sync tabs
    if (window.TabManager) {
      const tab = document.querySelector(`.tab[data-module="${moduleName}"]`);
      if (tab) TabManager.activateTab(tab);
    }

    // Switch module view
    if (window.App) {
      window.App.switchModule(moduleName);
    }
  }

  setActive(moduleName) {
    this.items.forEach(item => {
      item.classList.toggle('active', item.dataset.module === moduleName);
    });
  }
}

// Global instance
window.DockManager = DockManager;
