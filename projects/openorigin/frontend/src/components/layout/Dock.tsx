import { useAppStore } from '@/stores/appStore'
import { cn } from '@/lib/utils'
import type { ModuleType } from '@/types'
import {
  Settings,
  Brain,
  FlaskConical,
} from 'lucide-react'

interface DockItemDef {
  id: ModuleType
  label: string
  Icon: React.FC<{ className?: string }>
  colorClass: string
  activeGlow: string
  activeBorder: string
}

const DOCK_ITEMS: DockItemDef[] = [
  {
    id: 'ops',
    label: '运营',
    Icon: Settings,
    colorClass: 'text-amber-300',
    activeGlow: 'shadow-[inset_0_0_0_1px_rgba(245,158,11,0.8),inset_0_0_18px_rgba(245,158,11,0.18)]',
    activeBorder: 'border-amber-500/60',
  },
  {
    id: 'brain',
    label: '大脑',
    Icon: Brain,
    colorClass: 'text-cyan-300',
    activeGlow: 'shadow-[inset_0_0_0_1px_rgba(6,182,212,0.85),inset_0_0_18px_rgba(6,182,212,0.18)]',
    activeBorder: 'border-cyan-500/60',
  },
  {
    id: 'laboratory',
    label: '实验室',
    Icon: FlaskConical,
    colorClass: 'text-green-300',
    activeGlow: 'shadow-[inset_0_0_0_1px_rgba(34,197,94,0.85),inset_0_0_18px_rgba(34,197,94,0.18)]',
    activeBorder: 'border-green-500/60',
  },
]

interface DockProps {
  className?: string
}

export function Dock({ className }: DockProps) {
  const { activeModule, setModule } = useAppStore()

  return (
    <div
      className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-50',
        'flex items-end gap-2 px-3 py-2',
        'bg-black/60 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_18px_40px_rgba(0,0,0,0.35)]',
        className,
      )}
    >
      {DOCK_ITEMS.map(({ id, label, Icon, colorClass, activeGlow, activeBorder }) => {
        const isActive = activeModule === id
        return (
          <button
            key={id}
            onClick={() => setModule(id)}
            className={cn(
              'flex flex-col items-center gap-1.5 px-3 py-2 min-w-[72px] rounded-2xl cursor-pointer',
              'transition-all duration-150',
              'hover:bg-white/5',
              isActive && [
                'bg-white/5',
                activeGlow,
                'border border-white/10',
              ],
            )}
          >
            <div
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                'bg-gradient-to-b from-white/10 to-white/5 border border-white/10',
                isActive ? activeBorder : 'border-white/10',
                !isActive && 'group-hover:border-white/15',
              )}
              style={{
                boxShadow: isActive
                  ? `inset 0 0 0 1px ${id === 'ops' ? 'rgba(245,158,11,0.28)' : id === 'brain' ? 'rgba(6,182,212,0.28)' : 'rgba(34,197,94,0.28)'}, 0 0 20px ${id === 'ops' ? 'rgba(245,158,11,0.18)' : id === 'brain' ? 'rgba(6,182,212,0.18)' : 'rgba(34,197,94,0.18)'}`
                  : undefined,
              }}
            >
              <Icon className={cn('w-5 h-5', colorClass)} />
            </div>
            <span className={cn('text-xs text-white/80', isActive && 'font-medium')}>
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}