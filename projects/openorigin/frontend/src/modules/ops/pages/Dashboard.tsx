import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { Panel, PanelHeader, PanelBody } from '@/components/ui/Panel'
import { StatusDot } from '@/components/ui/StatusDot'
import { cn } from '@/lib/utils'
import { Bot, ScanSearch, AlertTriangle, MoonStar, Radio } from 'lucide-react'
import type { ReactNode } from 'react'

export function OpsDashboard() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['ops-night-overview'],
    queryFn: api.getOpsNightOverview,
  })
  const { data: agentsData } = useQuery({ queryKey: ['agents'], queryFn: api.getAgents })

  const ov = overview as any

  if (isLoading) return <LoadingState />

  return (
    <div className="space-y-5">
      <SectionTitle>运营 · 仪表盘</SectionTitle>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniCard label="晚10点后任务"
          value={`${ov?.nightJobsCount ?? 0} 个`}
          sub={(ov?.nightJobs as any[])?.map((j: any) => j.name).join('、') || '无'}
          icon={MoonStar} colorClass="text-purple-400" />
        <MiniCard label="服务异常"
          value={`${ov?.errorCount ?? 0} 个`}
          sub={ov?.errorCount > 0 ? '需关注' : '全部正常'}
          icon={AlertTriangle}
          colorClass={ov?.errorCount > 0 ? 'text-red-400' : 'text-emerald-400'} />
        <MiniCard label="活跃会话"
          value={`${ov?.events?.activeNow ?? 0} 个`}
          sub={`运行时长 ${ov?.events?.uptimeDays ?? '--'} 天`}
          icon={ScanSearch} colorClass="text-cyan-400" />
        <MiniCard label="大脑模块"
          value={ov?.brain?.briefings ? `${ov.brain.briefings} 份简报` : '--'}
          sub={ov?.brain ? `${ov.brain.memoryFiles} 文件 · ${ov.brain.skillsTotal} 技能` : '--'}
          icon={BrainIcon} colorClass="text-pink-400" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Agents */}
        <Panel variant="ops">
          <PanelHeader className="text-amber-300">
            <Bot className="w-3.5 h-3.5 mr-1.5" />
            代理概览
            <span className="ml-auto text-text-dim font-normal text-xs">{(agentsData as any[])?.length ?? 0} 个</span>
          </PanelHeader>
          <PanelBody className="space-y-2">
            {(agentsData as any[])?.map((a: any) => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <StatusDot status={a.status} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{a.name}</div>
                  <div className="text-xs text-text-dim font-mono">{a.model}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-text-secondary">{a.sessionCount} 会话</div>
                  <div className="text-xs text-text-dim">运行时长 {a.uptime}</div>
                </div>
              </div>
            ))}
            {!(agentsData as any[])?.length && (
              <div className="text-xs text-text-dim py-4 text-center">暂无代理数据</div>
            )}
          </PanelBody>
        </Panel>

        {/* Channels */}
        <Panel variant="ops">
          <PanelHeader className="text-amber-300">
            <Radio className="w-3.5 h-3.5 mr-1.5" />
            渠道状态
          </PanelHeader>
          <PanelBody>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Telegram', status: 'online' as const },
                { label: 'Discord', status: 'offline' as const },
                { label: 'LINE', status: 'offline' as const },
                { label: 'Slack', status: 'offline' as const },
              ].map(ch => (
                <div key={ch.label} className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <StatusDot status={ch.status} />
                  <span className="text-xs">{ch.label}</span>
                </div>
              ))}
            </div>
          </PanelBody>
        </Panel>
      </div>
    </div>
  )
}

function BrainIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>
    </svg>
  )
}

function MiniCard({ label, value, sub, icon: Icon, colorClass }: {
  label: string; value: string; sub: string
  icon: React.FC<{ className?: string }>; colorClass: string
}) {
  return (
    <Panel variant="ops">
      <PanelBody className="py-4 space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-text-dim mb-2">
          <Icon className={cn('w-3.5 h-3.5', colorClass)} />
          {label}
        </div>
        <div className="text-xl font-bold">{value}</div>
        <div className="text-xs text-text-dim truncate">{sub}</div>
      </PanelBody>
    </Panel>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <div className="text-xs uppercase tracking-widest text-text-secondary">{children}</div>
}

function LoadingState() {
  return <div className="flex items-center justify-center py-24 text-text-dim text-sm">加载中...</div>
}
