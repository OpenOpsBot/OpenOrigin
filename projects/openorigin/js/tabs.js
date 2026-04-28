class TabManager {
  constructor() {
    this.container = document.getElementById('tabsContainer');
    this.pageTabs = [];
    this.activePageTab = null;
  }

  setModule(moduleName, pageKey) {
    this.renderPageTabs(moduleName, pageKey);
  }

  renderPageTabs(moduleName, activePageKey) {
    const pages = window.App?.getPages(moduleName) || [];
    this.container.innerHTML = pages.map(page => `
      <button class="page-tab ${page.key === activePageKey ? 'active' : ''}" data-page="${page.key}" type="button">
        ${page.label}
      </button>
    `).join('');

    this.pageTabs = Array.from(this.container.querySelectorAll('.page-tab'));
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
