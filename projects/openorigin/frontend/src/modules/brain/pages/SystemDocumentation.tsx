import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { cn } from '@/lib/utils'
import { FileText, ChevronDown, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'

interface Section {
  heading: string
  level: number
  lines: string[]
}

function parseMarkdownSections(content: string): Section[] {
  const lines = content.split('\n')
  const sections: Section[] = []
  let current: Section | null = null

  for (const raw of lines) {
    const h2 = raw.match(/^## (.+)$/)
    const h3 = raw.match(/^### (.+)$/)
    if (h2) {
      if (current) sections.push(current)
      current = { heading: h2[1], level: 2, lines: [] }
    } else if (h3) {
      if (current) sections.push(current)
      current = { heading: h3[1], level: 3, lines: [] }
    } else if (current) {
      current.lines.push(raw)
    }
  }
  if (current) sections.push(current)
  return sections
}

function stripLine(line: string) {
  return line
    .replace(/^[-*]\s+/, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .trim()
}

const SECTION_ORDER = ['今日变更', '当前架构概览', '模块清单', '活跃定时任务', '已知问题']

const SECTION_COLORS: Record<string, string> = {
  '今日变更': 'text-amber-400',
  '当前架构概览': 'text-cyan-400',
  '模块清单': 'text-green-400',
  '活跃定时任务': 'text-purple-400',
  '已知问题': 'text-red-400',
}

export function SystemDocumentation() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['system-reference'],
    queryFn: api.getSystemReference,
    refetchInterval: false,
  })

  const [rawOpen, setRawOpen] = useState(false)

  const content = (data as any)?.content ?? ''
  const sections = parseMarkdownSections(content)

  // Group by heading
  const sectionMap: Record<string, Section> = {}
  for (const s of sections) {
    sectionMap[s.heading] = s
  }

  if (isLoading) return <LoadingState />
  if (!content) return <EmptyState message="暂无系统文档" />

  return (
    <div className="space-y-5">
      <SectionTitle>系统文档</SectionTitle>

      {/* Header bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="text-xs text-text-dim">
          projects/openorigin/docs/SYSTEM-REFERENCE.md
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 text-xs text-text-dim hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('w-3 h-3', isFetching && 'animate-spin')} />
            刷新
          </button>
          <button
            onClick={() => setRawOpen(o => !o)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/[0.05] transition-colors text-text-dim hover:text-white"
          >
            <FileText className="w-3 h-3" />
            {rawOpen ? '收起原文' : '展开原文'}
            <ChevronDown className={cn('w-3 h-3 transition-transform', rawOpen && 'rotate-180')} />
          </button>
        </div>
      </div>

      {/* Structured sections */}
      <div className="space-y-3">
        {SECTION_ORDER.map(heading => {
          const section = sectionMap[heading]
          if (!section) return null
          return (
            <DocSection
              key={heading}
              heading={heading}
              lines={section.lines}
              colorClass={SECTION_COLORS[heading] ?? 'text-white'}
            />
          )
        })}
      </div>

      {/* Raw markdown */}
      {rawOpen && (
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="px-4 py-3 bg-white/[0.02] border-b border-white/5">
            <span className="text-xs text-text-dim">原始 Markdown</span>
          </div>
          <pre className="p-4 text-xs text-text-secondary overflow-x-auto max-h-96 whitespace-pre-wrap">
            <code>{content}</code>
          </pre>
        </div>
      )}
    </div>
  )
}

function DocSection({ heading, lines, colorClass }: {
  heading: string; lines: string[]; colorClass: string
}) {
  const [open, setOpen] = useState(true)

  // Parse list items and text content
  const listItems: string[] = []
  const textLines: string[] = []

  for (const line of lines) {
    const stripped = stripLine(line)
    if (!stripped) continue
    if (/^[-*]/.test(line) || /^\d+\./.test(line)) {
      listItems.push(stripped)
    } else {
      textLines.push(stripped)
    }
  }

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors"
      >
        <span className={cn('text-xs font-bold uppercase tracking-wide', colorClass)}>{heading}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-text-dim transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          {textLines.map((line, i) => (
            <p key={i} className="text-xs text-text-secondary leading-relaxed">{line}</p>
          ))}
          {listItems.length > 0 && (
            <ul className="space-y-1.5">
              {listItems.map((item, i) => {
                // Check if it's a code/file reference
                const codeMatch = item.match(/^`([^`]+)`[:\s]*(.*)$/)
                if (codeMatch) {
                  return (
                    <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-current flex-shrink-0" style={{ color: 'var(--text-dim)' }} />
                      <span>
                        <code className="text-cyan-400/80 bg-white/[0.05] px-1 py-0.5 rounded text-[10px]">{codeMatch[1]}</code>
                        {codeMatch[2] && <span className="ml-1.5">{codeMatch[2]}</span>}
                      </span>
                    </li>
                  )
                }
                return (
                  <li key={i} className="flex items-start gap-2 text-xs text-text-secondary leading-relaxed">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-current flex-shrink-0" style={{ color: 'var(--text-dim)' }} />
                    <span>{item}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
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
