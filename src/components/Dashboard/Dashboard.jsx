import React, { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '../../store'
import api from '../../utils/api'
import { QUICK_LINKS } from '../../data/demoData'
import Pagination from '../shared/Pagination'

const TASK_PAGE_SIZE = 5

function StatCard({ label, value, accent }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${accent ? 'text-accent-green' : 'text-white'}`}>{value}</span>
    </div>
  )
}

function statusBadge(status) {
  const map = {
    completed: 'badge-green',
    running: 'badge-blue',
    queued: 'badge-amber',
    pending: 'badge-amber',
    failed: 'badge-red',
    cancelled: 'badge-amber',
  }
  return map[status] || 'badge-amber'
}

export default function Dashboard() {
  const stats = useAppStore((s) => s.stats)
  const setStats = useAppStore((s) => s.setStats)
  const setTab = useAppStore((s) => s.setActiveTab)
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState([])
  const [recentTasks, setRecentTasks] = useState([])
  const [taskPage, setTaskPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    setErrors([])

    const results = await Promise.allSettled([
      api.getAccounts(),
      api.getListings({ limit: 100 }),
      api.getTasks({ limit: 50 }),
    ])

    const [accountsRes, listingsRes, tasksRes] = results
    const partialErrors = []

    const accounts = accountsRes.status === 'fulfilled' ? accountsRes.value : []
    if (accountsRes.status === 'rejected') partialErrors.push('Accounts')

    const listings = listingsRes.status === 'fulfilled' ? listingsRes.value : []
    if (listingsRes.status === 'rejected') partialErrors.push('Listings')

    const tasks = tasksRes.status === 'fulfilled' ? tasksRes.value : []
    if (tasksRes.status === 'rejected') partialErrors.push('Tasks')

    const activeListings = listings.filter((item) => item.status === 'active' || item.status === 'draft').length
    const drafts = listings.filter((item) => item.status === 'draft').length
    const jobsRunning = tasks.filter((task) => task.status === 'running' || task.status === 'queued').length
    const completedTasks = tasks.filter((task) => task.status === 'completed').length

    setStats({
      accounts: accounts.length,
      activeListings,
      drafts,
      totalTasks: tasks.length,
      jobsRunning,
      completedTasks,
    })

    setRecentTasks(tasks.slice(0, 50))

    if (partialErrors.length === 3) {
      setErrors(['Backend not reachable. Make sure FastAPI is running and you are logged in.'])
    } else if (partialErrors.length > 0) {
      setErrors([`${partialErrors.join(', ')} API failed — showing partial data.`])
    }

    setLoading(false)
  }, [setStats])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              AI-powered Facebook Marketplace management — accounts, listings & automation
            </p>
          </div>
          <button type="button" className="btn-secondary" onClick={load} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {errors.length > 0 ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">{errors[0]}</div>
        ) : null}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <StatCard label="FB Accounts" value={loading ? '…' : stats.accounts || '0'} />
          <StatCard label="Active Listings" value={loading ? '…' : stats.activeListings || '0'} accent />
          <StatCard label="Drafts" value={loading ? '…' : stats.drafts || '0'} />
          <StatCard label="Total Tasks" value={loading ? '…' : stats.totalTasks || '0'} />
          <StatCard label="Jobs Running" value={loading ? '…' : stats.jobsRunning || '0'} />
          <StatCard label="Completed" value={loading ? '…' : stats.completedTasks || '0'} accent />
        </div>

        {/* Quick Actions */}
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            {QUICK_LINKS.map((link) => (
              <button
                key={link.id}
                type="button"
                className="btn-secondary"
                onClick={() => setTab(link.id)}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="card overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300">Recent Tasks</h3>
            <button
              type="button"
              className="btn-ghost text-xs py-1"
              onClick={() => setTab('activity')}
            >
              View All Logs →
            </button>
          </div>
          {loading ? (
            <div className="px-4 py-3 text-sm text-slate-400">Loading tasks…</div>
          ) : recentTasks.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-400">
              No tasks yet. Run an automation feature to see task history here.
            </div>
          ) : (
            <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-white/5">
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Progress</th>
                    <th className="px-4 py-3 font-medium">Started</th>
                    <th className="px-4 py-3 font-medium">Finished</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentTasks.slice((taskPage-1)*TASK_PAGE_SIZE, taskPage*TASK_PAGE_SIZE).map((task) => (
                    <tr key={task.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-white">{task.type || 'Unknown'}</td>
                      <td className="px-4 py-3">
                        <span className={statusBadge(task.status)}>{task.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-accent-red transition-all duration-300"
                              style={{ width: `${task.progress || 0}%` }} />
                          </div>
                          <span className="text-xs text-slate-500 tabular-nums">
                            {task.completed_steps || 0}/{task.total_steps || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {task.started_at ? new Date(task.started_at).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {task.finished_at ? new Date(task.finished_at).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={taskPage} total={recentTasks.length} pageSize={TASK_PAGE_SIZE} onChange={setTaskPage} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
