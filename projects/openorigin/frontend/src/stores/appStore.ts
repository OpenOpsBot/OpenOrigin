import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ModuleType } from '@/types'

interface AppState {
  activeModule: ModuleType
  activeTab: string
  setModule: (m: ModuleType) => void
  setTab: (t: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeModule: 'ops',
      activeTab: 'dashboard',
      setModule: (m) => set({ activeModule: m }),
      setTab: (t) => set({ activeTab: t }),
    }),
    {
      name: 'openorigin:nav-state',
      storage: createJSONStorage(() => localStorage),
    }
  )
)