import { AppShell } from '@/components/layout/AppShell'
import { useAppStore } from '@/stores/appStore'
import { Dashboard as BrainDashboard, DailyBriefing, Automations, SystemDocumentation, DataAnalysis, MemoryViewer, SkillsCatalog } from '@/modules/brain'
import { Dashboard as OpsDashboard, Tasks as OpsTasks, OrgChart } from '@/modules/ops'
import { Dashboard as LabDashboard, Prototypes, Ideas, Research } from '@/modules/laboratory'

const MODULE_TAB_COMPONENTS: Record<string, Record<string, React.FC>> = {
  ops: {
    dashboard: OpsDashboard,
    tasks: OpsTasks,
    'org-chart': OrgChart,
  },
  brain: {
    dashboard: BrainDashboard,
    'daily-briefing': DailyBriefing,
    automations: Automations,
    'os-documentation': SystemDocumentation,
    'data-analysis': DataAnalysis,
    'memory-viewer': MemoryViewer,
    'skills-catalog': SkillsCatalog,
  },
  laboratory: {
    dashboard: LabDashboard,
    prototypes: Prototypes,
    ideas: Ideas,
    research: Research,
  },
}

export default function App() {
  const { activeModule, activeTab } = useAppStore()

  const componentMap = MODULE_TAB_COMPONENTS[activeModule] ?? {}
  const Component = componentMap[activeTab] ?? componentMap['dashboard'] ?? null

  return (
    <AppShell>
      {Component ? <Component /> : (
        <div className="flex items-center justify-center h-64 text-text-dim text-sm">
          页面「{activeTab}」还在路上…
        </div>
      )}
    </AppShell>
  )
}