import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import type { ReactNode } from 'react'

export function Research() {
  const { data, isLoading } = useQuery({ queryKey: ['research'], queryFn: api.getResearch })
  const entries = (data as any)?.entries ?? []

  if (isLoading) return <LoadingState />

  if (!entries.length) return (
    <div className="space-y-5">
      <SectionTitle>研究</SectionTitle>
      <div className="text-center py-24 text-text-dim text-sm">暂无研究文档</div>
    </div>
  )

  return (
    <div className="space-y-5">
      <SectionTitle>研究</SectionTitle>

      <div className="relative pl-6 border-l border-green-500/20 space-y-8">
        {entries.map((e: any) => (
          <div key={e.name} className="relative">
            <div className="absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full bg-green-500/60 border-2 border-bg-primary" />
            <div className="text-xs font-mono text-green-400 mb-1">{e.date}</div>
            <div className="font-medium mb-0.5">{e.title || e.name}</div>
            <div className="text-xs text-text-dim">
              {e.findings} 个发现 · <code className="text-white/40">{e.name}</code>
            </div>
          </div>
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
