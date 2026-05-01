class LaboratoryModule {
  constructor() {
    this.view = null;
    this.currentPage = 'dashboard';
  }

  show(pageKey = 'dashboard') {
    this.currentPage = pageKey;
    if (!this.view) this.render();
    this.view.classList.add('active');
    this.updatePageVisibility();
    if (pageKey === 'dashboard') this.refreshDashboard();
    if (pageKey === 'prototypes') this.refreshPrototypes();
    if (pageKey === 'ideas') this.refreshIdeas();
    if (pageKey === 'research') this.refreshResearch();
  }

  hide() {
    if (this.view) this.view.classList.remove('active');
  }

  render() {
    this.view = document.createElement('div');
    this.view.className = 'module-view module-laboratory';
    this.view.id = 'laboratoryView';
    this.view.innerHTML = `
      <div class="section-title">实验室</div>

      <!-- Command Center -->
      <div class="module-page ${this.currentPage === 'dashboard' ? 'active' : ''}" data-page="dashboard">
        <div class="dashboard lab-command-grid" id="labCommandGrid">
          <div class="lab-command-loading">加载中...</div>
        </div>
      </div>

      <!-- Prototypes -->
      <div class="module-page ${this.currentPage === 'prototypes' ? 'active' : ''}" data-page="prototypes">
        <div class="dashboard single-page-dashboard">
          <div class="lab-section-header">
            <div class="lab-section-header-left">
              <div class="lab-section-title">
                <i data-lucide="layers"></i>
                <span>原型作品集</span>
              </div>
              <div class="lab-section-count" id="labProtoCount"></div>
            </div>
            <div class="lab-stats-row" id="labProtoStats"></div>
          </div>
          <div class="lab-sort-tabs" id="labProtoSort">
            <button class="lab-sort-tab active" data-sort="newest">最新优先</button>
            <button class="lab-sort-tab" data-sort="rating">评分优先</button>
          </div>
          <div class="lab-prototypes-grid lab-vertical-list" id="labPrototypesGrid">
            <div class="lab-loading">加载中...</div>
          </div>
        </div>
      </div>

      <!-- Ideas -->
      <div class="module-page ${this.currentPage === 'ideas' ? 'active' : ''}" data-page="ideas">
        <div class="dashboard single-page-dashboard">
          <div class="lab-section-header">
            <div class="lab-section-header-left">
              <div class="lab-section-title">
                <i data-lucide="lightbulb"></i>
                <span>创意图库</span>
              </div>
              <div class="lab-section-count" id="labIdeasCount"></div>
            </div>
            <div class="lab-filter-tabs" id="labIdeasFilter">
              <button class="lab-sort-tab active" data-filter="all">全部</button>
              <button class="lab-sort-tab" data-filter="A">A 赛道</button>
              <button class="lab-sort-tab" data-filter="B">B 赛道</button>
            </div>
          </div>
          <div class="lab-sort-row">
            <div class="lab-sort-tabs" id="labIdeasSort">
              <button class="lab-sort-tab active" data-sort="date">最新优先</button>
              <button class="lab-sort-tab" data-sort="score">评分优先</button>
            </div>
          </div>
          <div class="lab-ideas-grid lab-vertical-list" id="labIdeasGrid">
            <div class="lab-loading">加载中...</div>
          </div>
        </div>
      </div>

      <!-- Research -->
      <div class="module-page ${this.currentPage === 'research' ? 'active' : ''}" data-page="research">
        <div class="dashboard single-page-dashboard">
          <div class="lab-section-header">
            <div class="lab-section-header-left">
              <div class="lab-section-title">
                <i data-lucide="book-open"></i>
                <span>研究</span>
              </div>
              <div class="lab-section-count" id="labResearchCount"></div>
            </div>
          </div>
          <div class="lab-research-timeline" id="labResearchTimeline">
            <div class="lab-loading">加载中...</div>
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

  // ─── Command Center ────────────────────────────────────────────
  async refreshDashboard() {
    const grid = this.view?.querySelector('#labCommandGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="lab-command-loading">加载中...</div>';
    try {
      const [protoRes, ideasRes, researchRes] = await Promise.all([
        fetch('/api/prototypes'),
        fetch('/api/ideas'),
        fetch('/api/research')
      ]);
      const protoData = protoRes.ok ? (await protoRes.json()) : { entries: [], running: 0, total: 0 };
      const ideasData = ideasRes.ok ? (await ideasRes.json()) : { entries: [] };
      const researchData = researchRes.ok ? (await researchRes.json()) : { entries: [] };

      const running = protoData.running || 0;
      const totalProto = protoData.total || 0;
      const ideas = ideasData.entries || [];
      const research = researchData.entries || [];

      const latestIdea = ideas[0] || null;
      const latestProto = protoData.entries.find(p => p.status === 'running') || protoData.entries[0] || null;
      const latestResearch = research[0] || null;
      const thisWeekIdeas = ideas.filter(i => {
        if (!i.date) return false;
        const diff = Date.now() - new Date(i.date).getTime();
        return diff < 7 * 24 * 60 * 60 * 1000;
      }).length;

      grid.innerHTML = `
        <div class="lab-cmd-card lab-cmd-ideas" data-page="ideas">
          <div class="lab-cmd-card-icon"><i data-lucide="lightbulb"></i></div>
          <div class="lab-cmd-card-body">
            <div class="lab-cmd-card-label">创意板块</div>
            <div class="lab-cmd-card-big">${ideas.length}</div>
            <div class="lab-cmd-card-sub">本周 +${thisWeekIdeas}</div>
            ${latestIdea ? `<div class="lab-cmd-card-meta">${this.esc(latestIdea.title)}</div>` : ''}
          </div>
        </div>

        <div class="lab-cmd-card lab-cmd-protos" data-page="prototypes">
          <div class="lab-cmd-card-icon"><i data-lucide="layers"></i></div>
          <div class="lab-cmd-card-body">
            <div class="lab-cmd-card-label">原型板块</div>
            <div class="lab-cmd-card-big">${running}<span class="lab-cmd-card-unit">/${totalProto}</span></div>
            <div class="lab-cmd-card-sub">运行中 / 总计</div>
            ${latestProto ? `<div class="lab-cmd-card-meta">${this.esc(latestProto.name)}</div>` : ''}
          </div>
        </div>

        <div class="lab-cmd-card lab-cmd-build" data-page="prototypes">
          <div class="lab-cmd-card-icon"><i data-lucide="rocket"></i></div>
          <div class="lab-cmd-card-body">
            <div class="lab-cmd-card-label">夜间构建</div>
            <div class="lab-cmd-card-big lab-cmd-status-ok">✓</div>
            <div class="lab-cmd-card-sub">构建成功</div>
            <div class="lab-cmd-card-meta">意图路由原型 v0.9</div>
          </div>
        </div>

        <div class="lab-cmd-card lab-cmd-research" data-page="research">
          <div class="lab-cmd-card-icon"><i data-lucide="book-open"></i></div>
          <div class="lab-cmd-card-body">
            <div class="lab-cmd-card-label">研究板块</div>
            <div class="lab-cmd-card-big">${research.length}</div>
            <div class="lab-cmd-card-sub">研究文档</div>
            ${latestResearch ? `<div class="lab-cmd-card-meta">${this.esc(latestResearch.date)} · ${this.esc(latestResearch.title || latestResearch.name)}</div>` : ''}
          </div>
        </div>
      `;

      // Clickable cards
      grid.querySelectorAll('.lab-cmd-card').forEach(card => {
        card.addEventListener('click', () => {
          const page = card.dataset.page;
          if (page && window.App) window.App.switchPage(page);
        });
      });

      if (window.lucide) window.lucide.createIcons();
    } catch (error) {
      grid.innerHTML = `<div class="lab-command-loading">加载失败：${this.esc(error.message)}</div>`;
      if (window.lucide) window.lucide.createIcons();
    }
  }

  // ─── Prototypes ───────────────────────────────────────────────
  async refreshPrototypes() {
    const grid = this.view?.querySelector('#labPrototypesGrid');
    const countEl = this.view?.querySelector('#labProtoCount');
    const statsEl = this.view?.querySelector('#labProtoStats');
    const sortTabs = this.view?.querySelector('#labProtoSort');
    if (!grid) return;
    grid.innerHTML = '<div class="lab-loading">加载中...</div>';
    try {
      const res = await fetch('/api/prototypes');
      if (!res.ok) throw new Error('加载失败');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const all = data.entries || [];
      const running = data.running || 0;
      const stopped = data.stopped || 0;

      if (countEl) countEl.textContent = `${data.total || 0} 个原型`;
      if (statsEl) statsEl.innerHTML = `
        <span class="lab-stat-pill is-ok">${running} 运行中</span>
        <span class="lab-stat-pill is-danger">${stopped} 已停止</span>
      `;

      const ONE_DAY = 24 * 60 * 60 * 1000;
      const render = (sortKey) => {
        const sorted = [...all].sort((a, b) => {
          if (sortKey === 'rating') return (b.rating || 0) - (a.rating || 0);
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        grid.innerHTML = sorted.map(p => {
          const isNew = new Date(p.createdAt).getTime() > Date.now() - ONE_DAY;
          const statusClass = p.status === 'running' ? 'is-ok' : p.status === 'stopped' ? 'is-danger' : 'is-dim';
          const statusLabel = p.status === 'running' ? '运行中' : p.status === 'stopped' ? '已停止' : '归档';
          return `
            <div class="lab-proto-card">
              <div class="lab-proto-card-top">
                <div class="lab-proto-status-dot ${statusClass}"></div>
                <div class="lab-proto-rating">
                  <i data-lucide="star"></i> ${p.rating ? p.rating.toFixed(1) : '--'}
                </div>
              </div>
              <div class="lab-proto-name">${this.esc(p.name)}</div>
              <div class="lab-proto-tagline">${this.esc(p.tagline)}</div>
              <div class="lab-proto-port">端口 ${p.port || '--'}</div>
              <div class="lab-proto-footer">
                <span class="lab-proto-status-badge ${statusClass}">${statusLabel}</span>
                ${isNew ? '<span class="lab-proto-new">新增</span>' : ''}
                ${p.status === 'running' && p.url ? `<a class="lab-proto-open" href="${this.esc(p.url)}" target="_blank"><i data-lucide="external-link"></i>打开</a>` : ''}
              </div>
            </div>
          `;
        }).join('');
        if (window.lucide) window.lucide.createIcons();
      };

      render('newest');
      if (sortTabs) {
        sortTabs.querySelectorAll('.lab-sort-tab').forEach(tab => {
          tab.addEventListener('click', () => {
            sortTabs.querySelectorAll('.lab-sort-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            render(tab.dataset.sort);
          });
        });
      }
    } catch (error) {
      grid.innerHTML = `<div class="lab-loading">加载失败：${this.esc(error.message)}</div>`;
      if (window.lucide) window.lucide.createIcons();
    }
  }

  // ─── Ideas ─────────────────────────────────────────────────────
  async refreshIdeas() {
    const grid = this.view?.querySelector('#labIdeasGrid');
    const countEl = this.view?.querySelector('#labIdeasCount');
    const filterTabs = this.view?.querySelector('#labIdeasFilter');
    const sortTabs = this.view?.querySelector('#labIdeasSort');
    if (!grid) return;
    grid.innerHTML = '<div class="lab-loading">加载中...</div>';
    try {
      const res = await fetch('/api/ideas');
      if (!res.ok) throw new Error('加载失败');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const all = data.entries || [];

      if (countEl) countEl.textContent = `${all.length} 个创意`;

      const categories = [...new Set(all.map(i => i.category).filter(Boolean))];

      const render = (filterKey, sortKey) => {
        let filtered = filterKey === 'all' ? all : all.filter(i => i.track === filterKey);
        const sorted = [...filtered].sort((a, b) => {
          if (sortKey === 'score') return (b.overallScore || 0) - (a.overallScore || 0);
          return new Date(b.date) - new Date(a.date);
        });

        if (!sorted.length) {
          grid.innerHTML = '<div class="lab-loading">暂无创意</div>';
          return;
        }

        grid.innerHTML = sorted.map(i => {
          const r = i.ratings || {};
          const trackLabel = i.track === 'A' ? 'A 赛道' : i.track === 'B' ? 'B 赛道' : i.track || '';
          const trackClass = i.track === 'A' ? 'is-track-a' : i.track === 'B' ? 'is-track-b' : '';
          return `
            <div class="lab-idea-card">
              <div class="lab-idea-card-top">
                <span class="lab-idea-track ${trackClass}">${trackLabel}</span>
                <span class="lab-idea-cat">${this.esc(i.category || '')}</span>
              </div>
              <div class="lab-idea-title">${this.esc(i.title)}</div>
              <div class="lab-idea-summary">${this.esc(i.summary)}</div>
              <div class="lab-idea-date">${this.esc(i.date || '')}</div>
              <div class="lab-idea-ratings">
                <div class="lab-idea-rating-item">
                  <span class="lab-idea-rating-label">痛点</span>
                  <span class="lab-idea-rating-val">${this.formatScore(r.painPoint)}</span>
                </div>
                <div class="lab-idea-rating-item">
                  <span class="lab-idea-rating-label">速度</span>
                  <span class="lab-idea-rating-val">${this.formatScore(r.devSpeed)}</span>
                </div>
                <div class="lab-idea-rating-item">
                  <span class="lab-idea-rating-label">商业化</span>
                  <span class="lab-idea-rating-val">${this.formatScore(r.commercial)}</span>
                </div>
                ${r.aiAdvantage ? `
                <div class="lab-idea-rating-item">
                  <span class="lab-idea-rating-label">AI优势</span>
                  <span class="lab-idea-rating-val">${this.formatScore(r.aiAdvantage)}</span>
                </div>` : ''}
              </div>
              <div class="lab-idea-overall">
                <i data-lucide="star"></i>
                综合 ${i.overallScore ? i.overallScore.toFixed(1) : '--'}
              </div>
            </div>
          `;
        }).join('');
        if (window.lucide) window.lucide.createIcons();
      };

      render('all', 'date');
      if (filterTabs) {
        filterTabs.querySelectorAll('.lab-sort-tab').forEach(tab => {
          tab.addEventListener('click', () => {
            filterTabs.querySelectorAll('.lab-sort-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const sortTab = sortTabs?.querySelector('.lab-sort-tab.active');
            render(tab.dataset.filter, sortTab?.dataset.sort || 'date');
          });
        });
      }
      if (sortTabs) {
        sortTabs.querySelectorAll('.lab-sort-tab').forEach(tab => {
          tab.addEventListener('click', () => {
            sortTabs.querySelectorAll('.lab-sort-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const filterTab = filterTabs?.querySelector('.lab-sort-tab.active');
            render(filterTab?.dataset.filter || 'all', tab.dataset.sort);
          });
        });
      }
    } catch (error) {
      grid.innerHTML = `<div class="lab-loading">加载失败：${this.esc(error.message)}</div>`;
      if (window.lucide) window.lucide.createIcons();
    }
  }

  // ─── Research ─────────────────────────────────────────────────
  async refreshResearch() {
    const timeline = this.view?.querySelector('#labResearchTimeline');
    const countEl = this.view?.querySelector('#labResearchCount');
    if (!timeline) return;
    timeline.innerHTML = '<div class="lab-loading">加载中...</div>';
    try {
      const res = await fetch('/api/research');
      if (!res.ok) throw new Error('加载失败');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const entries = data.entries || [];

      if (countEl) countEl.textContent = `${entries.length} 份研究`;
      if (!entries.length) {
        timeline.innerHTML = '<div class="lab-loading">暂无研究文档</div>';
        return;
      }

      timeline.innerHTML = entries.map(entry => `
        <div class="lab-research-item">
          <div class="lab-research-date-col">
            <div class="lab-research-date">${this.esc(entry.date)}</div>
          </div>
          <div class="lab-research-icon-col">
            <div class="lab-research-icon"><i data-lucide="file-text"></i></div>
            <div class="lab-research-line"></div>
          </div>
          <div class="lab-research-body">
            <div class="lab-research-title">${this.esc(entry.title || entry.name)}</div>
            <div class="lab-research-meta">
              <span>${entry.findings} 个发现</span>
              <span class="lab-research-path">${this.esc(entry.name)}</span>
            </div>
          </div>
        </div>
      `).join('');

      if (window.lucide) window.lucide.createIcons();
    } catch (error) {
      timeline.innerHTML = `<div class="lab-loading">加载失败：${this.esc(error.message)}</div>`;
      if (window.lucide) window.lucide.createIcons();
    }
  }

  formatScore(val) {
    if (val == null) return '--';
    return val.toFixed(1);
  }

  esc(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

window.LaboratoryModule = LaboratoryModule;
