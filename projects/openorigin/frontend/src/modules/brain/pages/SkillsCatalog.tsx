import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { Panel, PanelBody } from '@/components/ui/Panel'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

const CATEGORY_COLORS: Record<string, string> = {
  'Apple生态': 'text-purple-400',
  '开发工具': 'text-blue-400',
  '任务流': 'text-cyan-400',
  '系统维护': 'text-amber-400',
  '网络': 'text-green-400',
  '消息': 'text-pink-400',
  '开发': 'text-blue-400',
  '数据': 'text-emerald-400',
  '多媒体': 'text-violet-400',
  '设备控制': 'text-orange-400',
  '资讯': 'text-teal-400',
  '效率': 'text-cyan-400',
  '其他': 'text-text-dim',
}

export function SkillsCatalog() {
  const { data, isLoading } = useQuery({ queryKey: ['skills'], queryFn: api.getSkills })
  const entries = (data as any)?.entries ?? []
  const [filter, setFilter] = useState<string>('全部')
  const categories = ['全部', ...Object.keys(CATEGORY_COLORS)]
  const filtered = filter === '全部' ? entries : entries.filter((s: any) => s.category === filter)

  if (isLoading) return <LoadingState />

  return (
    <div className="space-y-5">
      <SectionTitle>技能目录</SectionTitle>

      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              'px-3 py-1 rounded-lg text-xs transition-colors border',
              filter === cat
                ? 'bg-white/10 border-white/20 text-white'
                : 'border-transparent text-text-dim hover:text-white',
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <Panel>
        <PanelBody className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-text-dim text-xs uppercase tracking-widest">
                <th className="px-4 py-3">名称</th>
                <th className="px-4 py-3">描述</th>
                <th className="px-4 py-3">分类</th>
                <th className="px-4 py-3">来源</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s: any) => (
                <tr key={s.name} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <code className={cn('text-xs', CATEGORY_COLORS[s.category] ?? 'text-cyan-400')}>{s.name}</code>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">{s.description}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs', CATEGORY_COLORS[s.category] ?? '')}>{s.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={s.source === 'builtin' ? 'brain' : 'lab'}>{s.source}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 text-xs text-text-dim border-t border-white/5">
            共 {filtered.length} 项
          </div>
        </PanelBody>
      </Panel>
    </div>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <div className="text-xs uppercase tracking-widest text-text-secondary">{children}</div>
}

function LoadingState() {
  return <div className="flex items-center justify-center py-24 text-text-dim text-sm">加载中...</div>
}
