// Centralised API client – all fetches go through here
const BASE = '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  return res.json()
}

// ─── Brain ──────────────────────────────────────────────────────
export const api = {
  // Brain
  getBriefings: () => request<{ entries: import('@/types').BriefingEntry[] }>('/memory-briefings'),
  getAutomations: () => request<{ items: import('@/types').AutomationItem[]; cronError: string }>('/automations'),
  getSkills: () => request<{ entries: import('@/types').Skill[] }>('/skills'),
  getSystemReference: () => request('/system-reference'),

  // Lab
  getPrototypes: () =>
    request<{ entries: import('@/types').Prototype[]; running: number; stopped: number; total: number }>('/prototypes'),
  getIdeas: () => request<{ entries: import('@/types').Idea[] }>('/ideas'),
  getResearch: () => request<{ entries: import('@/types').ResearchEntry[] }>('/research'),

  // Ops
  getAgents: () => request<import('@/types').AgentInfo[]>('/agents'),
  getSessions: () => request<import('@/types').SessionInfo[]>('/sessions'),
  getCron: () => request('/cron'),
  getHealth: () => request('/health'),
  getBrainOverview: () => request('/brain-overview'),
  getOpsNightOverview: () => request('/ops-night-overview'),
  getModels: () => request('/models'),
}