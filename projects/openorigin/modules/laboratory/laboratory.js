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
      <div class="dashboard laboratory-dashboard">
        <div class="panel lab-panel-large">
          <div class="panel-header">
            <i data-lucide="sitemap"></i>
            AI 代理机构组织架构占位图
          </div>
          <div class="panel-body">
            <div class="org-intro-copy">第一阶段先做极简底层组织骨架，用于预览、讨论和后续扩容。</div>
            <div class="org-tree-preview mono">
              <div class="org-root-node">
                <div class="org-node-card org-node-root">
                  <div class="org-node-name">Chief Orchestrator</div>
                  <div class="org-node-role">总调度主控智能体</div>
                  <div class="org-node-duty">统一协调全局任务分发、优先级排序、跨部门协同与异常升级。</div>
                </div>
              </div>

              <div class="org-dept-grid">
                <div class="org-dept-column">
                  <div class="org-node-card">
                    <div class="org-node-name">Operations Lead</div>
                    <div class="org-node-role">运营部负责人智能体</div>
                    <div class="org-node-duty">负责店铺日常运营、任务推进、履约监控与经营节奏维护。</div>
                  </div>
                  <div class="org-slot-grid">
                    <div class="org-slot-card">
                      <div class="org-slot-name">Ops Agent Slot A</div>
                      <div class="org-slot-role">运营专员智能体（预留）</div>
                      <div class="org-slot-duty">每日巡检、订单异常、库存与物流跟进。</div>
                    </div>
                    <div class="org-slot-card">
                      <div class="org-slot-name">Ops Agent Slot B</div>
                      <div class="org-slot-role">数据监控智能体（预留）</div>
                      <div class="org-slot-duty">指标跟踪、异常提醒、日报素材整理。</div>
                    </div>
                  </div>
                </div>

                <div class="org-dept-column">
                  <div class="org-node-card">
                    <div class="org-node-name">Content & Marketing Lead</div>
                    <div class="org-node-role">内容 / 营销负责人智能体</div>
                    <div class="org-node-duty">负责内容产出、广告素材、活动节奏与品牌表达统一。</div>
                  </div>
                  <div class="org-slot-grid">
                    <div class="org-slot-card">
                      <div class="org-slot-name">Content Agent Slot A</div>
                      <div class="org-slot-role">商品内容智能体（预留）</div>
                      <div class="org-slot-duty">Listing 文案、卖点整理、素材脚本与多语适配。</div>
                    </div>
                    <div class="org-slot-card">
                      <div class="org-slot-name">Marketing Agent Slot B</div>
                      <div class="org-slot-role">营销执行智能体（预留）</div>
                      <div class="org-slot-duty">活动拆解、推广排期、广告协作建议。</div>
                    </div>
                  </div>
                </div>

                <div class="org-dept-column">
                  <div class="org-node-card">
                    <div class="org-node-name">Revenue & Sales Lead</div>
                    <div class="org-node-role">营收 / 销售负责人智能体</div>
                    <div class="org-node-duty">负责营收目标拆解、价格策略、促销规划与转化增长。</div>
                  </div>
                  <div class="org-slot-grid">
                    <div class="org-slot-card">
                      <div class="org-slot-name">Revenue Agent Slot A</div>
                      <div class="org-slot-role">定价策略智能体（预留）</div>
                      <div class="org-slot-duty">价格测试、毛利测算、促销节奏与利润平衡建议。</div>
                    </div>
                    <div class="org-slot-card">
                      <div class="org-slot-name">Sales Agent Slot B</div>
                      <div class="org-slot-role">转化增长智能体（预留）</div>
                      <div class="org-slot-duty">漏斗分析、成交障碍识别与销售动作建议。</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <i data-lucide="clipboard-list"></i>
            组织规划调研表
          </div>
          <div class="panel-body">
            <div class="worksheet-section">
              <div class="worksheet-title">每日运维必跟进</div>
              <ul class="worksheet-list">
                <li>订单 / 发货 / 履约异常</li>
                <li>库存 / 断货 / 补货提醒</li>
                <li>广告投放状态</li>
                <li>Listing 内容更新</li>
                <li>价格 / 促销变动</li>
                <li>经营数据日报</li>
              </ul>
            </div>
            <div class="worksheet-section">
              <div class="worksheet-title">最小基础团队</div>
              <ul class="worksheet-list">
                <li>总调度主控智能体</li>
                <li>运营负责人</li>
                <li>内容 / 营销负责人</li>
                <li>营收 / 销售负责人</li>
              </ul>
            </div>
            <div class="worksheet-section">
              <div class="worksheet-title">扩容优先级记录</div>
              <div class="note-stack">
                <div class="note-line">1. </div>
                <div class="note-line">2. </div>
                <div class="note-line">3. </div>
                <div class="note-line">4. </div>
              </div>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <i data-lucide="box"></i>
            第二阶段与第三阶段备注
          </div>
          <div class="panel-body">
            <div class="module-empty-copy">第二阶段优先补高频重复任务智能体，第三阶段再做终版组织系统、协作规则、KPI 和治理边界。</div>
          </div>
        </div>
      </div>
    `;
    document.getElementById('mainContent').appendChild(this.view);
    if (window.lucide) window.lucide.createIcons();
  }
}

window.LaboratoryModule = LaboratoryModule;
