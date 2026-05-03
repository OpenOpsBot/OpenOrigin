import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'ops' | 'brain' | 'lab'
}

const variants = {
  default: 'bg-white/5 border-white/10 text-white/80',
  success: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
  warning: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
  danger: 'bg-red-500/15 border-red-500/30 text-red-300',
  ops: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
  brain: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
  lab: 'bg-green-500/15 border-green-500/30 text-green-300',
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-medium',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}