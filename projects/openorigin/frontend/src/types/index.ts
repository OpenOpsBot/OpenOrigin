// Shared types across the app

export type ModuleType = 'ops' | 'brain' | 'laboratory'

export interface NavItem {
  id: string
  label: string
  icon: string
  module: ModuleType
}

// ─── Brain Module ───────────────────────────────────────────────
export interface BriefingEntry {
  fileName: string
  date: string
  title: string
  hasDailyBriefing: boolean
  summary: string
  sections: BriefingSections
  rawBriefing: string
  rawContent: string
}

export interface BriefingSections {
  priorities: string[]
  nightly: string[]
  todos: string[]
  attention: string[]
}

export interface AutomationItem {
  name: string
  title: string
  kind: string
  status: string
  statusText: string
  purpose: string
  scheduleText: string
  cron: { scheduleText: string; nextRun: string; lastRun: { at: string } | null }
  output: string
  runtimeSummary: string
  blocker: string
  scriptPath: string
  logPath: string
  scriptPreview: string[]
  logPreview: string[]
}

export interface Skill {
  name: string
  description: string
  source: 'builtin' | 'custom'
  category: string
}

// ─── Lab Module ─────────────────────────────────────────────────
export interface Prototype {
  id: string
  name: string
  tagline: string
  port: number
  status: 'running' | 'stopped'
  rating: number
  createdAt: string
  updatedAt: string
  description: string
  url: string
}

export interface Idea {
  id: string
  title: string
  summary: string
  date: string
  track: 'A' | 'B'
  category: string
  ratings: { painPoint: number; devSpeed: number; commercial: number; aiAdvantage: number }
  overallScore: number
  description: string
}

export interface ResearchEntry {
  name: string
  title: string
  date: string
  findings: number
  path: string
  mtime: string
}

// ─── Ops Module ─────────────────────────────────────────────────
export interface AgentInfo {
  id: string
  name: string
  model: string
  status: 'online' | 'offline' | 'warning'
  sessionCount: number
  uptime: string
}

export interface SessionInfo {
  key: string
  sessionId: string
  channel: string
  sessionType: string
  model: string
  tokenIn: number
  tokenOut: number
  lastActive: string
  status: 'active' | 'idle'
}