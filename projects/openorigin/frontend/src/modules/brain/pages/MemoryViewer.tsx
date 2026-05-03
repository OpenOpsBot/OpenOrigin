import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { cn } from '@/lib/utils'
import { Database, FileText, ChevronRight, RefreshCw } from 'lucide-react'

interface FileEntry {
  name: string
  path: string
  size: number
  mtime: number
}

interface FileContent {
  name: string
  content: string
  path: string
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`
  return `${(bytes / 1024 / 1024).toFixed(1)}M`
}

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

// Simple Markdown → HTML (safe subset, no external deps)
function renderMarkdown(md: string): string {
  const lines = md.split('\n')
  const out: string[] = []
  let i = 0
  let inList = false

  const closeList = () => {
    if (inList) { out.push('</ul>'); inList = false }
  }

  const inline = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/`([^`]+)`/g, '<code class="mem-code">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')

  while (i < lines.length) {
    const line = lines[i]

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      closeList()
      out.push('<hr class="mem-hr">')
      i++; continue
    }

    // ATX heading
    const h = line.match(/^(#{1,3})\s+(.+)$/)
    if (h) {
      closeList()
      const lvl = h[1].length
      out.push(`<h${lvl} class="mem-h${lvl}">${inline(h[2])}</h${lvl}>`)
      i++; continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      closeList()
      out.push(`<blockquote class="mem-blockquote">${inline(line.slice(2))}</blockquote>`)
      i++; continue
    }

    // Unordered list item
    const li = line.match(/^[-*+]\s+(.+)$/)
    if (li) {
      if (!inList) { out.push('<ul class="mem-ul">'); inList = true }
      out.push(`<li class="mem-li">${inline(li[1])}</li>`)
      i++; continue
    }

    // Ordered list item
    const oli = line.match(/^\d+\.\s+(.+)$/)
    if (oli) {
      if (!inList) { out.push('<ul class="mem-ul">'); inList = true }
      out.push(`<li class="mem-li">${inline(oli[1])}</li>`)
      i++; continue
    }

    // Code fence
    if (line.startsWith('```')) {
      closeList()
      // Code fence
    if (line.startsWith('```')) {
      closeList()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      out.push(`<pre class="mem-pre"><code class="mem-code-block">${codeLines.join('\n').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`)
      i++ // skip closing ```
      continue
    }
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      out.push(`<pre class="mem-pre"><code class="mem-code-block">${codeLines.join('\n').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`)
      i++ // skip closing ```
      continue
    }

    // Empty line
    if (!line.trim()) {
      closeList()
      out.push('<div class="mem-p"></div>')
      i++; continue
    }

    // Paragraph
    closeList()
    out.push(`<p class="mem-p">${inline(line)}</p>`)
    i++
  }

  closeList()
  return out.join('\n')
}

export function MemoryViewer() {
  const [selectedRoot, setSelectedRoot] = useState<string | null>(null)
  const [selectedDaily, setSelectedDaily] = useState<string | null>(null)
  const [previewContent, setPreviewContent] = useState<string>('')
  const [previewName, setPreviewName] = useState<string>('')
  const [previewKind, setPreviewKind] = useState<'root' | 'daily'>('daily')

  // Fetch root files
  const { data: rootData, refetch: refetchRoot } = useQuery({
    queryKey: ['memory-root'],
    queryFn: () => api.getMemoryRoot() as Promise<{ entries: FileEntry[] }>,
  })

  // Fetch daily files
  const { data: dailyData, refetch: refetchDaily, isFetching: dailyFetching } = useQuery({
    queryKey: ['memory-files'],
    queryFn: () => api.getMemoryFiles() as Promise<{ entries: FileEntry[] }>,
  })

  const loadRootFile = useCallback(async (name: string) => {
    try {
      const d = await (api.getMemoryRootFile(name) as Promise<FileContent>)
      setPreviewContent(d.content || '')
      setPreviewName(d.name || name)
      setPreviewKind('root')
      setSelectedRoot(name)
      setSelectedDaily(null)
    } catch (e) {
      setPreviewContent('读取失败')
      setPreviewName(name)
    }
  }, [])

  const loadDailyFile = useCallback(async (name: string) => {
    try {
      const d = await (api.getMemoryFile(name) as Promise<FileContent>)
      setPreviewContent(d.content || '')
      setPreviewName(d.name || name)
      setPreviewKind('daily')
      setSelectedDaily(name)
      setSelectedRoot(null)
    } catch (e) {
      setPreviewContent('读取失败')
      setPreviewName(name)
    }
  }, [])

  // Auto-select most recent daily file on load
  useEffect(() => {
    if (dailyData?.entries?.length && !selectedDaily && !selectedRoot) {
      loadDailyFile(dailyData.entries[0].name)
    }
  }, [dailyData])

  const rootEntries = rootData?.entries ?? []
  const dailyEntries = dailyData?.entries ?? []

  return (
    <div className="space-y-3">
      <SectionTitle>内存查看</SectionTitle>

      <div className="flex items-center gap-2">
        <button
          onClick={() => { refetchRoot(); refetchDaily() }}
          className="flex items-center gap-1.5 text-xs text-text-dim hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('w-3 h-3', dailyFetching && 'animate-spin')} />
          刷新
        </button>
        <span className="text-[10px] text-text-dim">
          长期数据 {rootEntries.length} · 每日记录 {dailyEntries.length}
        </span>
      </div>

      {/* Shell: sidebar + preview */}
      <div className="rounded-xl border border-white/5 overflow-hidden bg-white/[0.02]">
        <div className="flex" style={{ height: 'calc(100vh - 220px)' }}>
          {/* Left sidebar */}
          <aside className="w-56 border-r border-white/5 flex flex-col overflow-hidden flex-shrink-0">
            {/* Long-term data */}
            <div className="px-3 py-2 border-b border-white/[0.03]">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-text-dim font-bold">
                <Database className="w-3 h-3" />
                长期数据
              </div>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {rootEntries.map(f => (
                <button
                  key={f.name}
                  onClick={() => loadRootFile(f.name)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors',
                    selectedRoot === f.name
                      ? 'bg-cyan-500/10 text-cyan-400'
                      : 'hover:bg-white/[0.03] text-text-secondary',
                  )}
                >
                  <FileText className="w-3 h-3 flex-shrink-0 opacity-60" />
                  <div className="min-w-0">
                    <div className="text-xs truncate">{f.name.replace('.md', '')}</div>
                    <div className="text-[10px] text-text-dim">{formatSize(f.size)}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Daily records */}
            <div className="px-3 py-2 border-t border-white/[0.03]">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-text-dim font-bold">
                <FileText className="w-3 h-3" />
                每日记录
              </div>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {dailyEntries.map(f => (
                <button
                  key={f.name}
                  onClick={() => loadDailyFile(f.name)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors',
                    selectedDaily === f.name
                      ? 'bg-cyan-500/10 text-cyan-400'
                      : 'hover:bg-white/[0.03] text-text-secondary',
                  )}
                >
                  <FileText className="w-3 h-3 flex-shrink-0 opacity-60" />
                  <div className="min-w-0">
                    <div className="text-xs truncate">{f.name.replace('.md', '')}</div>
                    <div className="text-[10px] text-text-dim">{formatDate(f.mtime)}</div>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          {/* Right preview */}
          <section className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.03] flex-shrink-0">
              <ChevronRight className="w-3 h-3 text-text-dim" />
              <span className="text-xs font-medium text-white">{previewName || '预览'}</span>
              {previewKind === 'root' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 uppercase tracking-wide">长期</span>
              )}
              {previewKind === 'daily' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 uppercase tracking-wide">每日</span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {previewContent ? (
                <div
                  className="mem-markdown"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(previewContent) }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-text-dim text-sm">
                  点击左侧文件查看内容
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <style>{`
        .mem-markdown { color: var(--text-secondary, #94a3b8); font-size: 13px; line-height: 1.7; }
        .mem-markdown .mem-h1 { font-size: 18px; font-weight: 700; color: #e2e8f0; margin: 16px 0 8px; }
        .mem-markdown .mem-h2 { font-size: 15px; font-weight: 600; color: #e2e8f0; margin: 14px 0 6px; }
        .mem-markdown .mem-h3 { font-size: 13px; font-weight: 600; color: #cbd5e1; margin: 12px 0 4px; }
        .mem-markdown .mem-p { margin: 6px 0; }
        .mem-markdown .mem-ul { list-style: none; padding: 0; margin: 6px 0; }
        .mem-markdown .mem-li { padding: 2px 0 2px 16px; position: relative; }
        .mem-markdown .mem-li::before { content: '•'; position: absolute; left: 4px; color: var(--text-dim, #64748b); }
        .mem-markdown .mem-code { background: rgba(6,182,212,0.08); color: #67e8f9; padding: 1px 5px; border-radius: 3px; font-size: 12px; }
        .mem-markdown .mem-code-block { display: block; background: rgba(0,0,0,0.3); color: #e2e8f0; padding: 12px; border-radius: 6px; overflow-x: auto; font-size: 12px; line-height: 1.5; }
        .mem-markdown .mem-blockquote { border-left: 3px solid rgba(6,182,212,0.4); padding-left: 12px; color: var(--text-dim, #64748b); margin: 8px 0; font-style: italic; }
        .mem-markdown .mem-hr { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 16px 0; }
      `}</style>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-xs uppercase tracking-widest text-text-secondary">{children}</div>
}
