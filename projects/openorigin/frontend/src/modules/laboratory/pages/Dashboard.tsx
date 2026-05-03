import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { Panel, PanelHeader, PanelBody } from '@/components/ui/Panel'
import { Badge } from '@/components/ui/Badge'
import { ExternalLink, Lightbulb, FlaskConical, BookOpen } from 'lucide-react'
import type { ReactNode } from 'react'

export function LabDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['lab-overview'],
    queryFn: async () => {
      const [protos, ideas, research] = await Promise.all([
        api.getPrototypes(),
        api.getIdeas(),
        api.getResearch(),
      ])
      return { protos, ideas, research }
    },
  })

  if (isLoading) return <LoadingState />

  const protos = data?.protos as any
  const ideas = data?.ideas as any
  const research = data?.research as any

  const thisWeekIdeas = (ideas?.entries ?? []).filter((e: any) => {
    if (!e.date) return false
    return Date.now() - new Date(e.date).getTime() < 7 * 24 * 60 * 60 * 1000
  }).length

  const topProto = (protos?.entries ?? []).find((p: any) => p.status === 'running') ??
    (protos?.entries ?? [])[0]

  return (
    <div className="space-y-5">
      <SectionTitle>实验室 · 指挥中心</SectionTitle>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <CommandCard icon={Lightbulb} label="创意板块" big={ideas?.entries?.length ?? 0}
          sub={`本周 +${thisWeekIdeas} 个`} detail={ideas?.entries?.[0]?.title}
          colorClass="text-amber-400" hoverBorder="hover:border-amber-500/40" />
        <CommandCard icon={FlaskConical} label="原型板块" big={`${protos?.running ?? 0}`}
          sub={`/ ${protos?.total ?? 0} 运行中`} detail={topProto?.name}
          colorClass="text-green-400" hoverBorder="hover:border-green-500/40" />
        <CommandCard icon={BookOpen} label="研究板块" big={research?.entries?.length ?? 0}
          sub="研究文档" detail={research?.entries?.[0]?.title}
          colorClass="text-cyan-400" hoverBorder="hover:border-cyan-500/40" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {ideas?.entries?.[0] && (
          <Panel variant="lab">
            <PanelHeader className="text-amber-300">
              <Lightbulb className="w-3.5 h-3.5 mr-1.5" />
              最新创意
            </PanelHeader>
            <PanelBody>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium mb-1">{ideas.entries[0].title}</div>
                  <div className="text-xs text-text-secondary">{ideas.entries[0].summary}</div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="success">赛道{ideas.entries[0].track}</Badge>
                    <span className="text-xs text-amber-400">★ {ideas.entries[0].overallScore?.toFixed(1)}</span>
                    <span className="text-xs text-text-dim">{ideas.entries[0].date}</span>
                  </div>
                </div>
              </div>
            </PanelBody>
          </Panel>
        )}
        {topProto && (
          <Panel variant="lab">
            <PanelHeader className="text-green-300">
              <FlaskConical className="w-3.5 h-3.5 mr-1.5" />
              重点原型
            </PanelHeader>
            <PanelBody>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={topProto.status === 'running' ? 'success' : 'danger'}>
                      {topProto.status === 'running' ? '运行中' : '已停止'}
                    </Badge>
                    <span className="text-xs text-amber-400">★ {topProto.rating?.toFixed(1)}</span>
                  </div>
                  <div className="font-medium mb-1">{topProto.name}</div>
                  <div className="text-xs text-text-secondary">{topProto.tagline}</div>
                </div>
                {topProto.status === 'running' && topProto.url && (
                  <a href={topProto.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-green-400 hover:underline flex items-center gap-1 flex-shrink-0">
                    打开 <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </PanelBody>
          </Panel>
        )}
      </div>
    </div>
  )
}

function CommandCard({ icon: Icon, label, big, sub, detail, colorClass, hoverBorder }: {
  icon: React.FC<{ className?: string }>; label: string; big: string | number
  sub: string; detail?: string; colorClass: string; hoverBorder: string
}) {
  return (
    <Panel className={`cursor-pointer transition-colors border-transparent ${hoverBorder}`}>
      <PanelBody className="py-5 space-y-1">
        <div className={`flex items-center gap-1.5 text-xs uppercase tracking-widest mb-3 ${colorClass}`}>
          <Icon className="w-3.5 h-3.5" />
          {label}
        </div>
        <div className="text-4xl font-bold">{big}</div>
        <div className="text-xs text-text-dim">{sub}</div>
        {detail && <div className="text-xs text-text-dim mt-2 truncate">{detail}</div>}
      </PanelBody>
    </Panel>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <div className="text-xs uppercase tracking-widest text-text-secondary">{children}</div>
}

function LoadingState() {
  return <div className="flex items-center justify-center py-24 text-text-dim text-sm">加载中...</div>
}
