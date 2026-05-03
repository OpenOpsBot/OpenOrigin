import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { Panel, PanelBody } from '@/components/ui/Panel'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { ExternalLink, Star } from 'lucide-react'
import type { ReactNode } from 'react'

const ONE_DAY = 86_400_000

export function Prototypes() {
  const { data, isLoading } = useQuery({ queryKey: ['prototypes'], queryFn: api.getPrototypes })
  const [sort, setSort] = useState<'newest' | 'rating'>('newest')

  if (isLoading) return <LoadingState />
  const protos = (data as any)?.entries ?? []

  const sorted = [...protos].sort((a, b) =>
    sort === 'rating'
      ? (b.rating ?? 0) - (a.rating ?? 0)
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <SectionTitle>原型作品集</SectionTitle>
        <div className="flex gap-2 ml-auto">
          <Badge variant="success">{data?.running ?? 0} 运行中</Badge>
          <Badge variant="danger">{data?.stopped ?? 0} 已停止</Badge>
          <div className="flex border border-white/10 rounded-lg overflow-hidden ml-2">
            {([['newest', '最新'], ['rating', '评分']] as const).map(([s, label]) => (
              <button key={s} onClick={() => setSort(s)}
                className={cn('px-3 py-1 text-xs transition-colors',
                  sort === s ? 'bg-white/10 text-white' : 'text-text-dim hover:text-white')}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {sorted.map((p: any) => {
          const isNew = Date.now() - new Date(p.createdAt).getTime() < ONE_DAY
          return (
            <Panel key={p.id} variant="lab">
              <PanelBody>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <Badge variant={p.status === 'running' ? 'success' : 'danger'}>
                        {p.status === 'running' ? '运行中' : '已停止'}
                      </Badge>
                      {isNew && <Badge variant="warning">新增</Badge>}
                      <span className="text-xs text-text-dim">端口 {p.port}</span>
                      <span className="flex items-center gap-0.5 text-xs text-amber-400">
                        <Star className="w-3 h-3" /> {p.rating?.toFixed(1) ?? '--'}
                      </span>
                    </div>
                    <div className="font-medium mb-0.5">{p.name}</div>
                    <div className="text-sm text-text-secondary mb-1">{p.tagline}</div>
                    <div className="text-xs text-text-dim">{p.description}</div>
                  </div>
                  <div className="flex-shrink-0">
                    {p.status === 'running' && p.url ? (
                      <a href={p.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 border border-green-500/30 hover:border-green-400/50 rounded-lg px-3 py-1.5 transition-colors">
                        打开 <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-text-dim">离线</span>
                    )}
                  </div>
                </div>
              </PanelBody>
            </Panel>
          )
        })}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <div className="text-xs uppercase tracking-widest text-text-secondary">{children}</div>
}

function LoadingState() {
  return <div className="flex items-center justify-center py-24 text-text-dim text-sm">加载中...</div>
}
