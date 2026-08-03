import { create } from 'zustand'

export const useAppStore = create((set) => ({
  // Navigation
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // API-backed data
  stats: {
    accounts: 0,
    activeListings: 0,
    drafts: 0,
    totalTasks: 0,
    jobsRunning: 0,
    completedTasks: 0,
  },
  setStats: (stats) => set({ stats }),

  // Auth state
  // user: { email: string, userId: string } | null
  auth: {
    user: null,
    loading: false,
    error: null,
  },
  setAuth: (auth) => set({ auth }),

  selectedAccountIds: [],
  setSelectedAccountIds: (ids) => set({ selectedAccountIds: ids }),

  // Global running tasks — survive tab switches
  // { taskId: { taskId, route, status, progress, error, result } }
  runningTasks: {},
  setRunningTask: (taskId, data) => set((state) => ({
    runningTasks: { ...state.runningTasks, [taskId]: data },
  })),
  removeRunningTask: (taskId) => set((state) => {
    const next = { ...state.runningTasks }
    delete next[taskId]
    return { runningTasks: next }
  }),

  // Per-page task sessions — survive tab switches
  // key = page id (e.g. 'account-warmup'), value = [{accountId, taskId, success, error}]
  pageSessions: {},
  setPageSession: (pageId, tasks) => set((state) => ({
    pageSessions: { ...state.pageSessions, [pageId]: tasks },
  })),
  clearPageSession: (pageId) => set((state) => {
    const next = { ...state.pageSessions }
    delete next[pageId]
    return { pageSessions: next }
  }),

  settings: {
    defaultDelayMin: 30,
    defaultDelayMax: 90,
    maxListingsPerRun: 100,
    autoRetry: true,
    safeMode: true,
    backendUrl: 'http://localhost:8000',
  },
  setSettings: (settings) => set({ settings }),
}))

// ── Convenience selector hooks ────────────────────────────────────────────────
// Usage: const { email, userId } = useCurrentUser() ?? {}
export function useCurrentUser() {
  return useAppStore((s) => s.auth.user)
}

// Usage: const userId = useUserId()
export function useUserId() {
  return useAppStore((s) => s.auth.user?.userId ?? null)
}
