import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { Panel, PanelHeader, PanelBody } from '@/components/ui/Panel'
import { Badge } from '@/components/ui/Badge'
import type { ReactNode } from 'react'

export function Automations() {
  const { data, isLoading } = useQuery({ queryKey: ['automations'], queryFn: api.getAutomations })
  const items = (data as any)?.items ?? []

  if (isLoading) return <LoadingState />

  return (
    <div className="space-y-5">
      <SectionTitle>自动化</SectionTitle>

      <div className="flex items-center gap-3 text-xs">
        <Badge variant="success">{items.filter((i: any) => i.status === 'ready').length} 已配置</Badge>
        <Badge variant="warning">{items.filter((i: any) => i.status !== 'ready' && i.status !== 'blocked').length} 待激活</Badge>
        <Badge variant="danger">{items.filter((i: any) => ['blocked', 'error'].includes(i.status)).length} 异常</Badge>
        {data?.cronError && (
          <span className="text-amber-400 ml-auto">⚠ {data.cronError}</span>
        )}
      </div>

      <div className="space-y-3">
        {items.map((item: any) => (
          <Panel key={item.name}>
            <PanelHeader>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="font-mono text-xs text-cyan-400 truncate">{item.name}</span>
                <Badge
                  variant={
                    item.status === 'ready' ? 'success' :
                    ['blocked', 'error'].includes(item.status) ? 'danger' : 'warning'
                  }
                >
                  {item.statusText}
                </Badge>
              </div>
            </PanelHeader>
            <PanelBody className="space-y-3">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <MetaItem label="类型" value={item.kind} />
                <MetaItem label="计划" value={item.scheduleText} />
                <MetaItem label="输出" value={item.output} />
                <MetaItem label="最近执行" value={item.cron?.lastRun?.at
                  ? new Date(item.cron.lastRun.at).toLocaleString('zh-CN', { hour12: false })
                  : '暂无'} />
              </div>
              <p className="text-xs text-text-secondary">{item.purpose}</p>
              {item.blocker && (
                <div className="text-xs text-red-400 bg-red-500/10 rounded-lg p-2 border border-red-500/20">
                  阻塞：{item.blocker}
                </div>
              )}
              {item.runtimeSummary && (
                <div className="text-xs text-text-dim">运行摘要：{item.runtimeSummary}</div>
              )}
            </PanelBody>
          </Panel>
        ))}
      </div>
    </div>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-text-dim text-xs mb-0.5">{label}</div>
      <div className="text-xs text-white font-medium truncate">{value || '--'}</div>
    </div>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <div className="text-xs uppercase tracking-widest text-text-secondary">{children}</div>
}

function LoadingState() {
  return <div className="flex items-center justify-center py-24 text-text-dim text-sm">加载中...</div>
}
