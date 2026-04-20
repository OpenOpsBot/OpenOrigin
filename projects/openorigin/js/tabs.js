// Tab Management - Fixed tabs, drag-to-reorder, no close button
class TabManager {
  constructor() {
    this.container = document.getElementById('tabsContainer');
    this.tabs = Array.from(this.container.querySelectorAll('.tab'));
    this.activeTab = null;
    this.isDragging = false;
    this.draggedTab = null;
    this.dragOverTab = null;

    this.init();
  }

  init() {
    this.tabs.forEach(tab => {
      // No close button - tabs are fixed
      tab.addEventListener('click', (e) => this.activateTab(tab));
      tab.addEventListener('mousedown', (e) => this.startDrag(e, tab));
    });

    document.addEventListener('mousemove', (e) => this.onDrag(e));
    document.addEventListener('mouseup', () => this.endDrag());

    // Set initial active tab
    const initialActive = this.container.querySelector('.tab.active') || this.tabs[0];
    if (initialActive) this.activateTab(initialActive);
  }

  activateTab(tab) {
    if (!tab) return;

    this.tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    this.activeTab = tab;

    const moduleName = tab.dataset.module;
    if (moduleName && window.App) {
      window.App.switchModule(moduleName);
    }

    // Sync dock
    if (window.DockManager) {
      DockManager.setActive(moduleName);
    }
  }

  startDrag(e, tab) {
    if (e.button !== 0) return; // Left click only
    this.isDragging = true;
    this.draggedTab = tab;
    tab.classList.add('dragging');
  }

  onDrag(e) {
    if (!this.isDragging || !this.draggedTab) return;

    const tabs = this.tabs.filter(t => t !== this.draggedTab);
    this.dragOverTab = null;

    for (const tab of tabs) {
      const rect = tab.getBoundingClientRect();
      if (e.clientX >= rect.left && e.clientX <= rect.right &&
          e.clientY >= rect.top && e.clientY <= rect.bottom) {
        this.dragOverTab = tab;
        tab.classList.add('drag-over');
        break;
      } else {
        tab.classList.remove('drag-over');
      }
    }
  }

  endDrag() {
    if (!this.isDragging) return;

    if (this.draggedTab && this.dragOverTab && this.draggedTab !== this.dragOverTab) {
      const draggedRect = this.draggedTab.getBoundingClientRect();
      const overRect = this.dragOverTab.getBoundingClientRect();

      const insertBefore = e.clientX < (overRect.left + overRect.width / 2);

      if (insertBefore) {
        this.dragOverTab.parentNode.insertBefore(this.draggedTab, this.dragOverTab);
      } else {
        this.dragOverTab.parentNode.insertBefore(this.draggedTab, this.dragOverTab.nextSibling);
      }

      // Reorder tabs array
      this.tabs = Array.from(this.container.querySelectorAll('.tab'));
    }

    this.tabs.forEach(t => {
      t.classList.remove('dragging');
      t.classList.remove('drag-over');
    });

    this.isDragging = false;
    this.draggedTab = null;
    this.dragOverTab = null;
  }

  // Get current tab order
  getTabOrder() {
    return this.tabs.map(t => t.dataset.module);
  }
}

// Global instance
window.TabManager = TabManager;
