import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { Flag, MoonStar, ListTodo, TriangleAlert, FileText, ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

const SECTION_META = [
  { key: 'priorities' as const, label: '今日优先级', icon: Flag,        color: 'text-amber-400',  dotColor: 'bg-amber-400'  },
  { key: 'nightly'    as const, label: '夜间活动',    icon: MoonStar,    color: 'text-purple-400', dotColor: 'bg-purple-400' },
  { key: 'todos'      as const, label: '待处理事项',   icon: ListTodo,    color: 'text-blue-400',   dotColor: 'bg-blue-400'   },
  { key: 'attention'  as const, label: '需要关注',    icon: TriangleAlert, color: 'text-red-400',   dotColor: 'bg-red-400'   },
]

// ─── Main ──────────────────────────────────────────────────────
export function DailyBriefing() {
  const { data, isLoading } = useQuery({ queryKey: ['briefings'], queryFn: api.getBriefings })
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  const entries: any[] = data?.entries ?? []
  const selected = selectedFile
    ? entries.find(e => e.fileName === selectedFile)
    : entries.find(e => e.hasDailyBriefing) ?? entries[0] ?? null

  if (isLoading) return <LoadingState />
  if (!entries.length) return <EmptyState message="暂无每日简报" />

  return (
    <div className="space-y-5">
      <SectionTitle>每日简报</SectionTitle>

      {/* Left: date list | Right: detail */}
      <div className="flex gap-5">
        {/* Left sidebar — file list */}
        <div className="w-52 flex-shrink-0 flex flex-col">
          <div className="text-[10px] uppercase tracking-widest text-text-dim px-2 pb-2">文件列表</div>
          <div className="flex-1 overflow-y-auto space-y-1">
            {entries.map(e => {
              const active = selected?.fileName === e.fileName
              const fileLabel = e.fileName.replace(/\.md$/, '')
              return (
                <button
                  key={e.fileName}
                  onClick={() => setSelectedFile(e.fileName)}
                  className={cn(
                    'w-full text-left rounded-xl px-3 py-2.5 transition-all',
                    active
                      ? 'bg-white/[0.07] border border-white/15'
                      : 'border border-transparent hover:bg-white/[0.04]',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <FileText className={cn('w-3 h-3 flex-shrink-0', e.hasDailyBriefing ? 'text-cyan-400' : 'text-text-dim/40')} />
                    <span className={cn('text-xs', active ? 'text-white' : 'text-text-dim', e.hasDailyBriefing && 'font-medium')}>{fileLabel}</span>
                    {e.hasDailyBriefing && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />}
                  </div>
                  {active && e.summary && (
                    <div className="mt-1.5 text-[10px] text-text-dim leading-relaxed line-clamp-2 pl-5">
                      {e.summary}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 min-w-0">
          {selected
            ? <BriefingDetail entry={selected} />
            : <div className="text-center py-16 text-text-dim text-sm border border-dashed border-white/10 rounded-2xl">选择左侧文件</div>
          }
        </div>
      </div>
    </div>
  )
}

// ─── Detail (right panel) ───────────────────────────────────────
function BriefingDetail({ entry }: { entry: any }) {
  const { sections, date, fileName, summary, hasDailyBriefing, rawContent } = entry
  const [markdownOpen, setMarkdownOpen] = useState(false)

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="rounded-2xl bg-gradient-to-br from-[rgba(6,182,212,0.06)] to-transparent border border-cyan-500/20 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] uppercase tracking-widest text-cyan-400/70">Daily Brief</span>
            </div>
            <h2 className="text-lg font-bold">{date}</h2>
            <p className="text-xs text-text-dim mt-0.5 font-mono">{fileName}</p>
          </div>
          <Badge variant={hasDailyBriefing ? 'success' : 'warning'}>
            {hasDailyBriefing ? '已解析' : '未解析'}
          </Badge>
        </div>
        {summary && (
          <p className="mt-3 text-sm text-text-secondary leading-relaxed border-t border-white/5 pt-3">
            {summary}
          </p>
        )}
      </div>

      {/* Four section rows — each full width, stacked */}
      <div className="space-y-2">
        {SECTION_META.map(({ key, label, icon: Icon, color, dotColor }) => {
          const items = sections[key] ?? []
          if (!items.length) return null
          return (
            <SectionCard
              key={key}
              label={label}
              icon={Icon}
              color={color}
              dotColor={dotColor}
              items={items}
            />
          )
        })}
      </div>

      {/* Raw markdown toggle */}
      <div className="rounded-xl border border-white/5 overflow-hidden">
        <button
          onClick={() => setMarkdownOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-xs text-text-dim hover:text-white hover:bg-white/[0.03] transition-colors"
        >
          <span className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" />
            原始 Markdown
          </span>
          <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', markdownOpen && 'rotate-180')} />
        </button>
        {markdownOpen && (
          <pre className="px-4 pb-4 pt-2 text-xs text-text-secondary overflow-x-auto max-h-72 whitespace-pre-wrap">
            <code>{rawContent}</code>
          </pre>
        )}
      </div>
    </div>
  )
}

// ─── Section row (full width) ──────────────────────────────────
function SectionCard({
  label, icon: Icon, color, dotColor, items,
}: {
  label: string
  icon: React.FC<{ className?: string }>
  color: string
  dotColor: string
  items: string[]
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Icon className={cn('w-3.5 h-3.5', color)} />
        <span className={cn('text-xs font-bold uppercase tracking-wide', color)}>{label}</span>
        <span className="ml-1 text-[10px] text-text-dim">· {items.length} 项</span>
      </div>
      {/* Items */}
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-xs text-text-secondary leading-relaxed">
            <span className={cn('mt-1.5 w-1 h-1 rounded-full flex-shrink-0', dotColor)} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <div className="text-xs uppercase tracking-widest text-text-secondary">{children}</div>
}

function LoadingState() {
  return <div className="flex items-center justify-center py-24 text-text-dim text-sm">加载中...</div>
}

function EmptyState({ message }: { message: string }) {
  return <div className="flex items-center justify-center py-24 text-text-dim text-sm">{message}</div>
}
