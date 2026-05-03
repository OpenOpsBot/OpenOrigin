import { cn } from '@/lib/utils'

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'ops' | 'brain' | 'lab'
}

export function Panel({ className, variant = 'default', ...props }: PanelProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-panel bg-gradient-to-b from-[rgba(18,22,32,0.94)] to-[rgba(10,12,20,0.97)]',
        'border border-border backdrop-blur-md shadow-panel-soft',
        'before:absolute before:inset-0 before:rounded-panel before:p-px',
        'before:bg-gradient-to-br before:from-purple-500/50 before:via-pink-500/15 before:to-white/5',
        'before:[-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)]',
        'before:[-webkit-mask-composite:xor] before:[mask-composite:exclude]',
        variant === 'ops' && 'module-ops',
        variant === 'brain' && 'module-brain',
        variant === 'lab' && 'module-laboratory',
        className,
      )}
      {...props}
    />
  )
}

export function PanelHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center px-4 py-3 border-b border-white/5 bg-white/[0.025] text-sm font-bold',
        'tracking-wide',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function PanelBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4', className)} {...props} />
}