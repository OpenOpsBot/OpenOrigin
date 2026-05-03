import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { Panel, PanelHeader, PanelBody } from '@/components/ui/Panel'
import { Badge } from '@/components/ui/Badge'
import { StatusDot } from '@/components/ui/StatusDot'
import { cn } from '@/lib/utils'
import { ScanSearch, Clock, Cpu } from 'lucide-react'
import type { ReactNode } from 'react'

export function OpsTasks() {
  const { data: sessionsDataRaw } = useQuery({ queryKey: ['sessions'], queryFn: api.getSessions })
  const { data: cronData } = useQuery({ queryKey: ['cron'], queryFn: api.getCron })
  const { data: modelsData } = useQuery({ queryKey: ['models'], queryFn: api.getModels })

  const cron = cronData as any
  const sessionsData = (sessionsDataRaw as any[]) ?? []
  const models = (modelsData as any[]) ?? []
  const allTokens = sessionsData.reduce((sum: number, s: any) => sum + (s.tokenIn ?? 0) + (s.tokenOut ?? 0), 0)

  return (
    <div className="space-y-5">
      <SectionTitle>指挥台</SectionTitle>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="模型" value={models.length} colorClass="text-cyan-400" />
        <StatCard label="活跃会话" value={sessionsData.length} colorClass="text-cyan-400" />
        <StatCard label="定时任务" value={cron?.total ?? 0} colorClass="text-amber-400" />
        <StatCard label="Token 消耗" value={formatToken(allTokens)} colorClass="text-purple-400" />
      </div>

      {/* Mission panels */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Models */}
        <Panel variant="ops">
          <PanelHeader className="text-amber-300">
            <Cpu className="w-3.5 h-3.5 mr-1.5" />
            模型
            <span className="ml-auto text-text-dim font-normal text-xs">{models.length}</span>
          </PanelHeader>
          <PanelBody className="space-y-2">
            {models.map((m: any) => (
              <div key={m.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium">{m.name}</div>
                  <div className="text-xs text-text-dim font-mono truncate">{m.id}</div>
                </div>
                <Badge variant="brain">{m.provider}</Badge>
              </div>
            ))}
          </PanelBody>
        </Panel>

        {/* Active Sessions */}
        <Panel variant="ops">
          <PanelHeader className="text-amber-300">
            <ScanSearch className="w-3.5 h-3.5 mr-1.5" />
            活跃会话
            <span className="ml-auto text-text-dim font-normal text-xs">{sessionsData.length}</span>
          </PanelHeader>
          <PanelBody className="space-y-2">
            {sessionsData.slice(0, 8).map((s: any) => (
              <div key={s.key} className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                <StatusDot status={s.status === 'active' ? 'online' : 'offline'} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono truncate">{s.key?.slice(0, 16)}…</div>
                  <div className="text-xs text-text-dim">{s.model}</div>
                </div>
                <Badge variant={s.status === 'active' ? 'success' : 'warning'}>{s.channel}</Badge>
              </div>
            ))}
            {!sessionsData.length && (
              <div className="text-xs text-text-dim py-4 text-center">暂无活跃会话</div>
            )}
          </PanelBody>
        </Panel>

        {/* Cron jobs */}
        <Panel variant="ops">
          <PanelHeader className="text-amber-300">
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            定时任务
            <span className="ml-auto text-text-dim font-normal text-xs">{cron?.total ?? 0}</span>
          </PanelHeader>
          <PanelBody className="space-y-2">
            {cron?.cronError && (
              <div className="text-xs text-amber-400 bg-amber-500/10 rounded-lg p-2 mb-2">
                ⚠ {cron.cronError}
              </div>
            )}
            {(cron?.items ?? []).map((job: any, i: number) => (
              <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono truncate">{job.schedule}</div>
                  <div className="text-xs text-text-dim truncate">{job.command}</div>
                </div>
              </div>
            ))}
            {!cron?.items?.length && (
              <div className="text-xs text-text-dim py-4 text-center">暂无定时任务</div>
            )}
          </PanelBody>
        </Panel>
      </div>

      {/* Sessions table */}
      {sessionsData.length > 0 && (
        <Panel variant="ops">
          <PanelHeader className="text-amber-300">
            <ScanSearch className="w-3.5 h-3.5 mr-1.5" />
            全部会话
          </PanelHeader>
          <PanelBody className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-left text-text-dim uppercase tracking-widest">
                    {['会话', '渠道', '类型', '模型', 'Token In', 'Token Out', '状态'].map(h => (
                      <th key={h} className="px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessionsData.map((s: any) => (
                    <tr key={s.key} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-mono text-cyan-400">{s.key?.slice(0, 20)}…</td>
                      <td className="px-4 py-3 text-text-secondary">{s.channel}</td>
                      <td className="px-4 py-3 text-text-secondary">{s.sessionType}</td>
                      <td className="px-4 py-3 text-text-secondary font-mono">{s.model}</td>
                      <td className="px-4 py-3 text-text-secondary">{s.tokenIn?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-text-secondary">{s.tokenOut?.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <Badge variant={s.status === 'active' ? 'success' : 'warning'}>{s.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PanelBody>
        </Panel>
      )}
    </div>
  )
}

function StatCard({ label, value, colorClass }: { label: string; value: string | number; colorClass: string }) {
  return (
    <Panel variant="ops">
      <PanelBody className="text-center py-4">
        <div className={cn('text-3xl font-bold', colorClass)}>{value}</div>
        <div className="text-xs text-text-dim mt-1">{label}</div>
      </PanelBody>
    </Panel>
  )
}

function formatToken(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <div className="text-xs uppercase tracking-widest text-text-secondary">{children}</div>
}
