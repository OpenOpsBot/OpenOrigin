import { TabBar } from './TabBar'
import { Dock } from './Dock'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TabBar />
      <main className="flex-1 mt-[52px] mb-[90px] overflow-auto p-6">
        {children}
      </main>
      <Dock />
    </div>
  )
}