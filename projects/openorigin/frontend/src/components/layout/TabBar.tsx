import { useAppStore } from '@/stores/appStore'
import { cn } from '@/lib/utils'
import type { ModuleType } from '@/types'

interface TabDef {
  id: string
  label: string
  module: ModuleType
}

const TABS_BY_MODULE: Record<ModuleType, TabDef[]> = {
  ops: [
    { id: 'dashboard', label: '仪表盘', module: 'ops' },
    { id: 'tasks', label: '指挥台', module: 'ops' },
    { id: 'org-chart', label: '组织架构', module: 'ops' },
  ],
  brain: [
    { id: 'dashboard', label: '仪表盘', module: 'brain' },
    { id: 'daily-briefing', label: '每日简报', module: 'brain' },
    { id: 'automations', label: '自动化', module: 'brain' },
    { id: 'os-documentation', label: '系统文档', module: 'brain' },
    { id: 'data-analysis', label: '数据分析', module: 'brain' },
    { id: 'memory-viewer', label: '内存查看', module: 'brain' },
    { id: 'skills-catalog', label: '技能目录', module: 'brain' },
  ],
  laboratory: [
    { id: 'dashboard', label: '指挥中心', module: 'laboratory' },
    { id: 'prototypes', label: '原型作品集', module: 'laboratory' },
    { id: 'ideas', label: '创意图库', module: 'laboratory' },
    { id: 'research', label: '研究', module: 'laboratory' },
  ],
}

const MODULE_COLORS: Record<ModuleType, string> = {
  ops: 'box-shadow: inset 0 0 0 1px rgba(245,158,11,0.7), 0 0 14px rgba(245,158,11,0.16); color: #ffd89a;',
  brain: 'box-shadow: inset 0 0 0 1px rgba(6,182,212,0.7), 0 0 14px rgba(6,182,212,0.16); color: #9cecff;',
  laboratory: 'box-shadow: inset 0 0 0 1px rgba(34,197,94,0.7), 0 0 14px rgba(34,197,94,0.16); color: #9ef5bc;',
}

interface TabBarProps {
  className?: string
}

export function TabBar({ className }: TabBarProps) {
  const { activeModule, activeTab, setTab } = useAppStore()
  const tabs = TABS_BY_MODULE[activeModule]

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 h-[52px]',
        'bg-black/50 backdrop-blur-xl border-b border-white/10',
        'flex items-center px-4 z-40',
        className,
      )}
    >
      <div className="flex items-center gap-2 min-w-0 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={cn(
                'h-8 px-3 rounded-lg text-xs whitespace-nowrap cursor-pointer transition-all duration-150',
                'border border-transparent',
                !isActive && 'bg-white/[0.03] text-text-secondary hover:text-white hover:bg-white/[0.06]',
                isActive && 'bg-white/[0.08] border-white/10',
              )}
              style={isActive ? { boxShadow: MODULE_COLORS[activeModule].match(/box-shadow:[^;]+/)?.[0], color: MODULE_COLORS[activeModule].match(/color:[^;]+/)?.[0] } : undefined}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}