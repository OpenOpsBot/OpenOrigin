import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { cn } from '@/lib/utils'
import { Activity, MessageSquare, Clock, Zap, Cpu, Flame, LayoutList, GitBranch, CheckCircle, XCircle, Timer } from 'lucide-react'
import type { DataAnalysis } from '@/types'

const STAT_CARDS = [
  { key: 'totalSessions', label: '总会话数', icon: MessageSquare, color: 'text-cyan-400' },
  { key: 'totalEvents', label: '总事件数', icon: Activity, color: 'text-green-400' },
  { key: 'uptimeDays', label: '运行时长（天）', icon: Clock, color: 'text-amber-400', suffix: '天' },
  { key: 'activeNow', label: '当前活跃', icon: Zap, color: 'text-purple-400' },
]

const KIND_COLORS: Record<string, string> = {
  telegram: 'text-blue-400 bg-blue-400/10',
  cron: 'text-amber-400 bg-amber-400/10',
  subagent: 'text-green-400 bg-green-400/10',
}

const KIND_LABELS: Record<string, string> = {
  telegram: 'Telegram',
  cron: 'Cron',
  subagent: 'Subagent',
}

export function DataAnalysis() {
  const { data, isLoading } = useQuery<DataAnalysis>({
    queryKey: ['data-analysis'],
    queryFn: api.getDataAnalysis,
    refetchInterval: 30000,
  })

  if (isLoading) return <LoadingState />
  if (!data) return <EmptyState message="加载失败" />

  const { stats, modelDistribution, hotSessions, sessionTypes, timeline, cronJobs } = data

  return (
    <div className="space-y-5">
      <SectionTitle>数据分析</SectionTitle>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, color, suffix }) => (
          <div key={key} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={cn('w-3.5 h-3.5', color)} />
              <span className="text-xs text-text-secondary">{label}</span>
            </div>
            <div className={cn('text-2xl font-bold', color)}>
              {(stats as any)[key]}
              {suffix && <span className="text-sm text-text-dim ml-0.5">{suffix}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Two column: model distribution + hot sessions */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Model distribution */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wide text-white">模型分布</span>
          </div>
          <div className="p-4 space-y-3">
            {modelDistribution.map(({ model, count }) => {
              const pct = Math.round((count / stats.totalSessions) * 100)
              return (
                <div key={model}>
                  <div className="flex items-center justify-between mb-1">
                    <code className="text-xs text-cyan-400/80">{model}</code>
                    <span className="text-xs text-text-secondary">{count} 会话</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-cyan-400/60"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Hot sessions */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs font-bold uppercase tracking-wide text-white">热门会话</span>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {hotSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-bold uppercase', KIND_COLORS[s.kind] ?? 'text-white/50 bg-white/5')}>
                    {KIND_LABELS[s.kind] ?? s.kind}
                  </span>
                  <span className="text-xs text-text-secondary truncate">{s.label}</span>
                </div>
                <span className="text-[10px] text-text-dim whitespace-nowrap ml-2">{s.updatedAt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Session types */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
          <LayoutList className="w-3.5 h-3.5 text-green-400" />
          <span className="text-xs font-bold uppercase tracking-wide text-white">会话类型</span>
        </div>
        <div className="p-4 flex gap-6">
          {sessionTypes.map(({ type, count }) => {
            const colors = type === 'Telegram' ? 'text-blue-400 bg-blue-400/10' :
                           type === 'Cron' ? 'text-amber-400 bg-amber-400/10' :
                           'text-green-400 bg-green-400/10'
            return (
              <div key={type} className="flex items-center gap-2">
                <span className={cn('text-xs px-2 py-1 rounded font-bold uppercase', colors)}>{type}</span>
                <span className="text-sm font-bold text-white">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
          <GitBranch className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs font-bold uppercase tracking-wide text-white">统一时间线</span>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {timeline.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-bold uppercase whitespace-nowrap', KIND_COLORS[item.kind] ?? 'text-white/50 bg-white/5')}>
                  {KIND_LABELS[item.kind] ?? item.kind}
                </span>
                <code className="text-[10px] text-text-dim truncate">{item.sessionFile.split('/').pop()?.replace('.jsonl', '')}</code>
              </div>
              <span className="text-[10px] text-text-dim whitespace-nowrap ml-2">{item.updatedAt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cron jobs */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
          <Timer className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wide text-white">定时任务</span>
          <span className="text-[10px] text-text-dim ml-auto">{cronJobs.filter(j => j.enabled).length} / {cronJobs.length} 启用</span>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {cronJobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2 min-w-0">
                {job.enabled
                  ? <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                  : <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                }
                <div className="min-w-0">
                  <div className="text-xs font-medium text-white truncate">{job.name}</div>
                  <div className="text-[10px] text-text-dim truncate">{job.description}</div>
                </div>
              </div>
              <div className="text-right ml-3 flex-shrink-0">
                <code className="text-[10px] text-amber-400/70">{job.schedule}</code>
                <div className="text-[10px] text-text-dim">{job.tz}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-xs uppercase tracking-widest text-text-secondary">{children}</div>
}

function LoadingState() {
  return <div className="flex items-center justify-center py-24 text-text-dim text-sm">加载中...</div>
}

function EmptyState({ message }: { message: string }) {
  return <div className="flex items-center justify-center py-24 text-text-dim text-sm">{message}</div>
}
