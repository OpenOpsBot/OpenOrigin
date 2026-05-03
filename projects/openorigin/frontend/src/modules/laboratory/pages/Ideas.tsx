import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { Panel, PanelBody } from '@/components/ui/Panel'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { Star } from 'lucide-react'
import type { ReactNode } from 'react'

const TRACK_COLORS: Record<string, 'success' | 'warning'> = { A: 'success', B: 'warning' }
const RATING_LABELS: Record<string, string> = {
  painPoint: '痛点', devSpeed: '速度', commercial: '商业化', aiAdvantage: 'AI优势',
}

export function Ideas() {
  const { data, isLoading } = useQuery({ queryKey: ['ideas'], queryFn: api.getIdeas })
  const [track, setTrack] = useState<'all' | 'A' | 'B'>('all')
  const [sort, setSort] = useState<'date' | 'score'>('date')

  if (isLoading) return <LoadingState />
  let entries: any[] = (data as any)?.entries ?? []

  if (track !== 'all') entries = entries.filter(e => e.track === track)
  entries = [...entries].sort((a, b) =>
    sort === 'score'
      ? (b.overallScore ?? 0) - (a.overallScore ?? 0)
      : new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <SectionTitle>创意图库</SectionTitle>
        <div className="flex gap-1.5 ml-auto">
          {([['all', '全部'], ['A', '赛道A'], ['B', '赛道B']] as const).map(([t, label]) => (
            <button key={t} onClick={() => setTrack(t)}
              className={cn('px-3 py-1 rounded-lg text-xs transition-colors border',
                track === t ? 'bg-white/10 border-white/20 text-white' : 'border-transparent text-text-dim hover:text-white')}>
              {label}
            </button>
          ))}
          <div className="border-l border-white/10 mx-1" />
          {([['date', '最新'], ['score', '评分']] as const).map(([s, label]) => (
            <button key={s} onClick={() => setSort(s)}
              className={cn('px-3 py-1 rounded-lg text-xs transition-colors border',
                sort === s ? 'bg-white/10 border-white/20 text-white' : 'border-transparent text-text-dim hover:text-white')}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {entries.map((i: any) => (
          <Panel key={i.id} variant="lab">
            <PanelBody>
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <Badge variant={TRACK_COLORS[i.track] ?? 'default'}>赛道{i.track}</Badge>
                    <span className="text-xs text-text-dim">{i.category}</span>
                    <span className="flex items-center gap-0.5 text-xs text-amber-400">
                      <Star className="w-3 h-3" /> {i.overallScore?.toFixed(1) ?? '--'}
                    </span>
                    <span className="text-xs text-text-dim ml-auto">{i.date}</span>
                  </div>
                  <div className="font-medium mb-0.5">{i.title}</div>
                  <div className="text-sm text-text-secondary mb-3">{i.summary}</div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {Object.entries(i.ratings ?? {}).map(([key, val]) => (
                      <div key={key}
                        className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/5">
                        <span className="text-text-dim">{RATING_LABELS[key] ?? key}</span>
                        <span className={cn('font-medium',
                          (val as number) >= 4.5 ? 'text-emerald-400' :
                          (val as number) >= 3.5 ? 'text-white' : 'text-text-dim'
                        )}>{(val as number).toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
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

function LoadingState() {
  return <div className="flex items-center justify-center py-24 text-text-dim text-sm">加载中...</div>
}
