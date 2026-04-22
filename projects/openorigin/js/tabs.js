class TabManager {
  constructor() {
    this.container = document.getElementById('tabsContainer');
    this.moduleTabs = Array.from(this.container.querySelectorAll('.tab'));
    this.pageTabsWrap = null;
    this.pageTabs = [];
    this.activeModuleTab = null;
    this.activePageTab = null;
    this.init();
  }

  init() {
    this.moduleTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const moduleName = tab.dataset.module;
        if (moduleName && window.App) window.App.switchModule(moduleName);
      });
    });

    this.pageTabsWrap = document.createElement('div');
    this.pageTabsWrap.className = 'page-tabs-container';
    this.container.parentNode.appendChild(this.pageTabsWrap);
  }

  setModule(moduleName, pageKey) {
    this.moduleTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.module === moduleName));
    this.activeModuleTab = this.moduleTabs.find(tab => tab.dataset.module === moduleName) || null;
    this.renderPageTabs(moduleName, pageKey);
  }

  renderPageTabs(moduleName, activePageKey) {
    const pages = window.App?.getPages(moduleName) || [];
    this.pageTabsWrap.innerHTML = pages.map(page => `
      <button class="page-tab ${page.key === activePageKey ? 'active' : ''}" data-page="${page.key}" type="button">
        ${page.label}
      </button>
    `).join('');

    this.pageTabs = Array.from(this.pageTabsWrap.querySelectorAll('.page-tab'));
    this.pageTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const pageKey = tab.dataset.page;
        if (pageKey && window.App) window.App.switchPage(pageKey);
      });
    });

    this.setPageActive(activePageKey);
  }

  setPageActive(pageKey) {
    this.pageTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.page === pageKey));
    this.activePageTab = this.pageTabs.find(tab => tab.dataset.page === pageKey) || null;
  }
}

window.TabManager = TabManager;
