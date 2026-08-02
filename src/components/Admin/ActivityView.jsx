import React, { useEffect, useState, useCallback } from 'react'
import api from '../../utils/api'
import Pagination from '../shared/Pagination'

const PAGE_SIZE = 10

// ── Trash icon ────────────────────────────────────────────────────────────────
function TrashIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

export default function ActivityView() {
  const [events, setEvents]               = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState('')
  const [statusFilter, setStatusFilter]   = useState('')
  const [page, setPage]                   = useState(1)

  // Selection state
  const [selected, setSelected]           = useState(new Set())

  // Cleanup stuck tasks modal
  const [showCleanupModal, setShowCleanupModal]   = useState(false)
  const [cleanupResult, setCleanupResult]         = useState('')
  const [cleanupBusy, setCleanupBusy]             = useState(false)

  // Delete confirmation modal
  const [deleteModal, setDeleteModal]     = useState(null) // null | 'selected' | 'all' | {id}
  const [deleteBusy, setDeleteBusy]       = useState(false)
  const [deleteMsg, setDeleteMsg]         = useState('')

  // ── Load logs ───────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    setSelected(new Set())
    try {
      const params = { limit: 500 }
      if (statusFilter) params.status = statusFilter
      const logs = await api.getAllLogs(params)
      setEvents(logs)
      setPage(1)
    } catch {
      setError('Unable to load activity logs. Make sure the backend is running and you are logged in.')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  // ── Cleanup stuck tasks ─────────────────────────────────────────────────────
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

  // ── Selection helpers ───────────────────────────────────────────────────────
  const visibleIds = events.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((e) => e.id)
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id))

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelected((prev) => {
        const next = new Set(prev)
        visibleIds.forEach((id) => next.delete(id))
        return next
      })
    } else {
      setSelected((prev) => {
        const next = new Set(prev)
        visibleIds.forEach((id) => next.add(id))
        return next
      })
    }
  }

  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Delete handlers ─────────────────────────────────────────────────────────
  const confirmDelete = (mode) => {
    setDeleteMsg('')
    setDeleteModal(mode)
  }

  const executeDelete = async () => {
    setDeleteBusy(true)
    setDeleteMsg('')
    try {
      if (deleteModal === 'all') {
        await api.deleteAllLogs()
        setDeleteMsg('All logs deleted.')
      } else if (deleteModal === 'selected') {
        await api.deleteLogsBulk([...selected])
        setDeleteMsg(`${selected.size} log(s) deleted.`)
      } else if (typeof deleteModal === 'string' && deleteModal.length > 10) {
        // single log id
        await api.deleteLog(deleteModal)
        setDeleteMsg('Log deleted.')
      }
      await load()
      setTimeout(() => { setDeleteModal(null); setDeleteMsg('') }, 1200)
    } catch {
      setDeleteMsg('Delete failed — try again.')
    } finally {
      setDeleteBusy(false)
    }
  }

  // ── Stats ───────────────────────────────────────────────────────────────────
  const successCount = events.filter((e) => e.status === 'success' || e.status === 'ok').length
  const failedCount  = events.filter((e) => e.status === 'failed'  || e.status === 'error').length
  const runningCount = events.filter((e) => e.status === 'running').length

  const paginated = events.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Activity Monitoring</h1>
            <p className="text-sm text-slate-400 mt-1">
              Track automation jobs, account actions, and system events in real time.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
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

            {/* Delete selected */}
            {selected.size > 0 && (
              <button
                type="button"
                onClick={() => confirmDelete('selected')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30
                           text-red-400 text-sm font-semibold hover:bg-red-500/25 transition-colors"
              >
                <TrashIcon />
                Delete {selected.size} selected
              </button>
            )}

            {/* Delete all */}
            {events.length > 0 && (
              <button
                type="button"
                onClick={() => confirmDelete('all')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 border border-red-600/30
                           text-red-300 text-sm font-semibold hover:bg-red-600/30 transition-colors"
              >
                <TrashIcon />
                Delete All
              </button>
            )}

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

        {/* Stats */}
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

        {/* Table */}
        <div className="card overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300">Recent Activity</h3>
            <div className="flex items-center gap-3">
              {selected.size > 0 && (
                <span className="text-xs text-red-400 font-medium">{selected.size} selected</span>
              )}
              <span className="text-xs text-slate-500">{loading ? '' : `${events.length} log entries`}</span>
            </div>
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
                      {/* Select-all checkbox */}
                      <th className="pl-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleSelectAll}
                          className="rounded border-white/20 bg-white/10 text-accent-red cursor-pointer"
                        />
                      </th>
                      <th className="px-4 py-3 font-medium">Time</th>
                      <th className="px-4 py-3 font-medium">Action</th>
                      <th className="px-4 py-3 font-medium">Account</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Details</th>
                      <th className="px-4 py-3 font-medium w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginated.map((e) => (
                      <tr
                        key={e.id}
                        className={`hover:bg-white/5 transition-colors ${selected.has(e.id) ? 'bg-red-500/5' : ''}`}
                      >
                        {/* Row checkbox */}
                        <td className="pl-4 py-3 w-10">
                          <input
                            type="checkbox"
                            checked={selected.has(e.id)}
                            onChange={() => toggleOne(e.id)}
                            className="rounded border-white/20 bg-white/10 text-accent-red cursor-pointer"
                          />
                        </td>
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
                        <td className="px-4 py-3 text-xs max-w-[250px]">
                          {e.error
                            ? <span className="text-red-400 break-words">{e.error}</span>
                            : <span className="text-slate-500 truncate block">
                                {typeof e.details === 'object' ? JSON.stringify(e.details) : e.details || e.message || '—'}
                              </span>
                          }
                        </td>
                        {/* Single row delete */}
                        <td className="pr-4 py-3 w-10">
                          <button
                            type="button"
                            onClick={() => confirmDelete(e.id)}
                            className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete this log"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
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

      {/* ── Cleanup Stuck Tasks Modal ─────────────────────────────────────── */}
      {showCleanupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="card max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Cleanup Stuck Tasks?</h3>
            <p className="text-sm text-slate-400">
              This will mark all <span className="text-amber-300">running</span> and{' '}
              <span className="text-amber-300">pending</span> tasks as{' '}
              <span className="text-red-300">failed</span>. Use after a backend restart.
            </p>
            {cleanupResult && (
              <div className={`rounded-lg border p-2 text-sm ${
                cleanupResult.includes('failed')
                  ? 'border-red-500/30 bg-red-500/10 text-red-200'
                  : 'border-accent-green/30 bg-accent-green/10 text-green-200'
              }`}>
                {cleanupResult}
              </div>
            )}
            <div className="flex gap-2">
              {!cleanupResult && (
                <button type="button" className="btn-danger" onClick={handleCleanup} disabled={cleanupBusy}>
                  {cleanupBusy ? 'Cleaning…' : 'Yes, Cleanup'}
                </button>
              )}
              <button type="button" className="btn-secondary" onClick={() => setShowCleanupModal(false)}>
                {cleanupResult ? 'Close' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ─────────────────────────────────────── */}
      {deleteModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="card max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
                <TrashIcon className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {deleteModal === 'all'
                    ? 'Delete all logs?'
                    : deleteModal === 'selected'
                    ? `Delete ${selected.size} selected log(s)?`
                    : 'Delete this log?'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">This cannot be undone.</p>
              </div>
            </div>

            {deleteMsg && (
              <div className={`rounded-lg border p-2 text-sm ${
                deleteMsg.includes('failed')
                  ? 'border-red-500/30 bg-red-500/10 text-red-200'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              }`}>
                {deleteMsg}
              </div>
            )}

            {!deleteMsg && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={executeDelete}
                  disabled={deleteBusy}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm
                             font-semibold hover:bg-red-500 transition-colors disabled:opacity-50"
                >
                  {deleteBusy
                    ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Deleting…</>
                    : <><TrashIcon />Delete</>
                  }
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => { setDeleteModal(null); setDeleteMsg('') }}
                  disabled={deleteBusy}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
