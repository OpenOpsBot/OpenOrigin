import { create } from 'zustand'
import type { ModuleType } from '@/types'

interface AppState {
  activeModule: ModuleType
  activeTab: string
  setModule: (m: ModuleType) => void
  setTab: (t: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeModule: 'ops',
  activeTab: 'dashboard',
  setModule: (m) => set({ activeModule: m }),
  setTab: (t) => set({ activeTab: t }),
}))