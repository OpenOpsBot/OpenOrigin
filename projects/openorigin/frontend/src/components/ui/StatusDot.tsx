import { cn } from '@/lib/utils'

interface StatusDotProps {
  status: 'online' | 'offline' | 'warning'
  className?: string
}

const colors = {
  online: 'bg-success text-success shadow-[0_0_12px_var(--success)]',
  offline: 'bg-danger text-danger shadow-[0_0_12px_var(--danger)]',
  warning: 'bg-warning text-warning shadow-[0_0_12px_var(--warning)]',
}

export function StatusDot({ status, className }: StatusDotProps) {
  return (
    <span
      className={cn(
        'inline-block w-2 h-2 rounded-full bg-current',
        colors[status],
        className,
      )}
    />
  )
}