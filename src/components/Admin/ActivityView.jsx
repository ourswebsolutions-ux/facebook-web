import React, { useEffect, useState, useCallback } from 'react'
import api from '../../utils/api'
import Pagination from '../shared/Pagination'

const PAGE_SIZE = 10

export default function ActivityView() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCleanupModal, setShowCleanupModal] = useState(false)
  const [cleanupResult, setCleanupResult] = useState('')
  const [cleanupBusy, setCleanupBusy] = useState(false)
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { limit: 500 }
      if (statusFilter) params.status = statusFilter
      const logs = await api.getAllLogs(params)
      setEvents(logs)
      setPage(1)
    } catch (err) {
      setError('Unable to load activity logs. Make sure the backend is running and you are logged in.')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const handleCleanup = async () => {
    setCleanupBusy(true)
    setCleanupResult('')
    try {
      const r = await api.cleanupStuckTasks()
      setCleanupResult(r.message || 'Done')
      load()
    } catch {
      setCleanupResult('Cleanup failed — check backend.')
    } finally {
      setCleanupBusy(false)
    }
  }

  const successCount = events.filter((e) => e.status === 'success' || e.status === 'ok').length
  const failedCount = events.filter((e) => e.status === 'failed' || e.status === 'error').length
  const runningCount = events.filter((e) => e.status === 'running').length

  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Activity Monitoring</h1>
            <p className="text-sm text-slate-400 mt-1">
              Track automation jobs, account actions, and system events in real time.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              className="input py-1.5 text-sm w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="running">Running</option>
              <option value="pending">Pending</option>
            </select>
            <button type="button" className="btn-primary" onClick={load} disabled={loading}>
              {loading ? 'Loading…' : 'Refresh'}
            </button>
            <button
              type="button"
              className="btn-danger text-xs"
              onClick={() => { setCleanupResult(''); setShowCleanupModal(true) }}
            >
              Cleanup Stuck Tasks
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">{error}</div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="stat-card">
            <span className="stat-label">Total Events</span>
            <span className="stat-value">{loading ? '…' : events.length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Successful</span>
            <span className="stat-value text-accent-green">{loading ? '…' : successCount}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Failed / Running</span>
            <span className="stat-value text-accent-amber">{loading ? '…' : failedCount + runningCount}</span>
          </div>
        </div>

        <div className="card overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300">Recent Activity</h3>
            <span className="text-xs text-slate-500">{loading ? '' : `${events.length} log entries`}</span>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="px-4 py-3 text-sm text-slate-400">Loading activity…</div>
            ) : events.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-400">
                No activity logs found. Run an automation task to see logs here.
              </div>
            ) : (
              <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-white/5">
                    <th className="px-4 py-3 font-medium">Time</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">Account</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {events.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE).map((e) => (
                    <tr key={e.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {e.created_at ? new Date(e.created_at).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-white">{e.action || e.type || 'Unknown'}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {e.account_id ? e.account_id.slice(0, 8) + '…' : 'System'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={
                          e.status === 'success' || e.status === 'ok' ? 'badge-green' :
                          e.status === 'running' ? 'badge-blue' :
                          e.status === 'failed' || e.status === 'error' ? 'badge-red' : 'badge-amber'
                        }>
                          {e.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px] truncate">
                        {typeof e.details === 'object' ? JSON.stringify(e.details) : e.details || e.message || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination page={page} total={events.length} pageSize={PAGE_SIZE} onChange={setPage} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cleanup Confirmation Modal */}
      {showCleanupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="card max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Cleanup Stuck Tasks?</h3>
            <p className="text-sm text-slate-400">
              This will mark all <span className="text-amber-300">running</span> and{' '}
              <span className="text-amber-300">pending</span> tasks as <span className="text-red-300">failed</span>.
              Use this after a backend restart to clear orphaned tasks.
            </p>
            {cleanupResult && (
              <div className={`rounded-lg border p-2 text-sm ${
                cleanupResult.includes('failed') ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-accent-green/30 bg-accent-green/10 text-green-200'
              }`}>
                {cleanupResult}
              </div>
            )}
            <div className="flex gap-2">
              {!cleanupResult && (
                <button
                  type="button"
                  className="btn-danger"
                  onClick={handleCleanup}
                  disabled={cleanupBusy}
                >
                  {cleanupBusy ? 'Cleaning…' : 'Yes, Cleanup'}
                </button>
              )}
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowCleanupModal(false)}
              >
                {cleanupResult ? 'Close' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
