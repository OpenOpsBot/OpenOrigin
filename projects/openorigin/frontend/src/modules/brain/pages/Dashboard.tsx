import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { Panel, PanelBody } from '@/components/ui/Panel'
import { cn } from '@/lib/utils'
import { Cpu, Bot, BookOpen, FolderOpen } from 'lucide-react'
import type { ReactNode } from 'react'

export function BrainDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['brain-overview'], queryFn: api.getBrainOverview })
  const { data: skillsData } = useQuery({ queryKey: ['skills'], queryFn: api.getSkills })
  const { data: automationsData } = useQuery({ queryKey: ['automations'], queryFn: api.getAutomations })

  const overview = data as any
  const skills = skillsData as any
  const automations = automationsData as any

  if (isLoading) return <LoadingState />

  return (
    <div className="space-y-5">
      <SectionTitle>大脑模块 · 仪表盘</SectionTitle>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="记忆文件" value={overview?.memoryFiles ?? 0} unit="文件" icon={FolderOpen} color="text-cyan-400" />
        <StatCard label="技能总数" value={skills?.total ?? 0} unit="个技能" icon={Cpu} color="text-purple-400" />
        <StatCard label="自动化" value={automations?.items?.length ?? 0} unit="个任务" icon={Bot} color="text-pink-400" />
        <StatCard label="简报" value={overview?.briefings ?? 0} unit="份" icon={BookOpen} color="text-amber-400" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: '每日简报', sub: '查看历史简报', icon: BookOpen, tab: 'daily-briefing', color: 'hover:border-cyan-500/40' },
          { label: '自动化', sub: '查看自动化任务', icon: Bot, tab: 'automations', color: 'hover:border-pink-500/40' },
          { label: '技能目录', sub: '全部技能列表', icon: Cpu, tab: 'skills-catalog', color: 'hover:border-purple-500/40' },
        ].map(({ label, sub, icon: Icon, tab, color }) => (
          <Panel key={tab} className={cn('cursor-pointer transition-colors border-transparent', color)}>
            <PanelBody className="flex items-center gap-3 py-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="font-medium text-sm">{label}</div>
                <div className="text-xs text-text-dim">{sub}</div>
              </div>
            </PanelBody>
          </Panel>
        ))}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <div className="text-xs uppercase tracking-widest text-text-secondary">{children}</div>
}

function StatCard({ label, value, unit, icon: Icon, color }: {
  label: string; value: number | string; unit: string
  icon: React.FC<{ className?: string }>; color: string
}) {
  return (
    <Panel>
      <PanelBody className="text-center py-5">
        <div className="flex justify-center mb-2">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
            <Icon className={cn('w-5 h-5', color)} />
          </div>
        </div>
        <div className="text-3xl font-bold">{value}<span className="text-sm text-text-dim font-normal ml-1">{unit}</span></div>
        <div className="text-xs text-text-dim mt-1">{label}</div>
      </PanelBody>
    </Panel>
  )
}

function LoadingState() {
  return <div className="flex items-center justify-center py-24 text-text-dim text-sm">加载中...</div>
}
