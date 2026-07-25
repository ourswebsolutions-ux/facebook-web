import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '../../../store'
import api from '../../../utils/api'
import {
  PageShell, SectionCard, ConfigPanel, Field, TaskProgressView,
} from '../shared/FeatureHelpers'

// ── Inline multi-account selector with search + scroll ────────────────────────
function AccountSelector() {
  const [accounts, setAccounts]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const selectedAccountIds              = useAppStore((s) => s.selectedAccountIds)
  const setSelectedAccountIds           = useAppStore((s) => s.setSelectedAccountIds)
  const setTab                          = useAppStore((s) => s.setActiveTab)

  useEffect(() => {
    api.getAccounts().then((data) => {
      setAccounts(data)
      if (!selectedAccountIds.length && data.length) {
        const verified = data.find((a) => a.cookies)
        setSelectedAccountIds(verified ? [verified.id] : [data[0].id])
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, []) // eslint-disable-line

  const filtered     = search ? accounts.filter((a) => (a.email || a.phone || '').toLowerCase().includes(search.toLowerCase())) : accounts
  const allSelected  = filtered.length > 0 && filtered.every((a) => selectedAccountIds.includes(a.id))
  const someSelected = filtered.some((a) => selectedAccountIds.includes(a.id)) && !allSelected

  const toggleAll = () => {
    if (allSelected) setSelectedAccountIds(selectedAccountIds.filter((id) => !filtered.find((a) => a.id === id)))
    else setSelectedAccountIds([...new Set([...selectedAccountIds, ...filtered.map((a) => a.id)])])
  }

  const toggle = (id) => selectedAccountIds.includes(id)
    ? setSelectedAccountIds(selectedAccountIds.filter((x) => x !== id))
    : setSelectedAccountIds([...selectedAccountIds, id])

  return (
    <SectionCard title="Select Accounts" icon="👥">
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : accounts.length === 0 ? (
        <div className="text-sm text-slate-400">
          No accounts. <button type="button" onClick={() => setTab('accounts')} className="text-accent-red underline">Add one.</button>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input className="input pl-8 py-1.5 text-sm" placeholder="Search accounts…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {/* Select All */}
          <label onClick={toggleAll} className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer border transition-all ${
            allSelected ? 'bg-accent-red/10 border-accent-red/30' : 'bg-white/3 border-white/8 hover:bg-white/6'
          }`}>
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
              allSelected ? 'bg-accent-red border-accent-red' : someSelected ? 'border-accent-red bg-accent-red/30' : 'border-white/30'
            }`}>
              {allSelected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5"/></svg>}
              {!allSelected && someSelected && <div className="w-2 h-0.5 bg-white rounded" />}
            </div>
            <span className="text-sm font-semibold text-white">
              {allSelected ? 'Deselect All' : 'Select All'}
              {search ? ` (${filtered.length} filtered)` : ` (${accounts.length})`}
            </span>
            <span className="ml-auto text-xs text-slate-500">{selectedAccountIds.length} selected</span>
          </label>

          {/* List — scrollable */}
          <div className="space-y-1 max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-slate-500 px-2 py-3">No accounts match "{search}"</p>
            ) : filtered.map((acc) => {
              const isSelected = selectedAccountIds.includes(acc.id)
              return (
                <label key={acc.id} onClick={() => toggle(acc.id)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer border transition-all ${
                    isSelected ? 'bg-accent-red/10 border-accent-red/25' : 'border-transparent hover:bg-white/4'
                  }`}>
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-accent-red border-accent-red' : 'border-white/30'
                  }`}>
                    {isSelected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5"/></svg>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{acc.email || acc.phone}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        acc.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-blue-500/15 text-blue-400'
                      }`}>{acc.status || 'idle'}</span>
                      {acc.cookies
                        ? <span className="text-[10px] text-emerald-400">✓ verified</span>
                        : <span className="text-[10px] text-amber-400">⚠ unverified</span>
                      }
                    </div>
                  </div>
                </label>
              )
            })}
          </div>

          <button type="button" onClick={() => setTab('accounts')}
            className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors text-left pt-1">
            + Manage accounts
          </button>
        </div>
      )}
    </SectionCard>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function OpenAccounts({ feature }) {
  const selectedAccountIds = useAppStore((s) => s.selectedAccountIds)
  const runningTasks       = useAppStore((s) => s.runningTasks)
  const setRunningTask     = useAppStore((s) => s.setRunningTask)
  const pageSessions       = useAppStore((s) => s.pageSessions)
  const setPageSession     = useAppStore((s) => s.setPageSession)

  const PAGE_KEY = 'open-accounts'
  const taskId   = pageSessions[PAGE_KEY]?.taskId || null
  const task     = taskId ? (runningTasks[taskId] || null) : null
  const setTaskId = (id) => setPageSession(PAGE_KEY, { taskId: id })

  const [action, setAction]           = useState('verify')
  const [busy, setBusy]               = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  // Resume polling if task is still running when page is re-opened
  useEffect(() => {
    if (!taskId || ['completed','failed','cancelled'].includes(task?.status)) return
    let cancelled = false
    const poll = async () => {
      try {
        const data = await api.getTask(taskId)
        if (cancelled) return
        setRunningTask(taskId, data)
        if (['running','pending','queued'].includes(data.status)) setTimeout(poll, 2500)
        else setStatusMessage(data.status === 'completed' ? '✅ Done.' : `Status: ${data.status}`)
      } catch { /* ignore */ }
    }
    poll()
    return () => { cancelled = true }
  }, [taskId]) // eslint-disable-line

  const handleRun = async () => {
    if (!selectedAccountIds.length || busy) return
    setBusy(true); setStatusMessage('')
    try {
      const data = await api.startAutomation('open-accounts', {
        account_ids: selectedAccountIds,
        action,
      })
      if (data?.task_id) {
        setTaskId(data.task_id)
        setRunningTask(data.task_id, { status: 'running', progress: 0, completed_steps: 0, total_steps: selectedAccountIds.length })
        setStatusMessage('Task started — running in background.')
      }
    } catch (err) {
      setStatusMessage(err?.response?.data?.detail || 'Failed to start.')
    } finally {
      setBusy(false)
    }
  }

  const ACTIONS = [
    { value: 'verify',  label: 'Verify',         desc: 'Open browser & complete login/2FA',    icon: '🔐' },
    { value: 'open',    label: 'Open',            desc: 'Open account session in browser',       icon: '🌐' },
    { value: 'refresh', label: 'Refresh Status',  desc: 'Check & update account statuses',       icon: '🔄' },
  ]

  return (
    <PageShell
      title={feature.title}
      description={feature.description}
      actions={
        <button type="button" disabled={busy || !selectedAccountIds.length} onClick={handleRun}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-red text-white font-bold text-sm
                     hover:bg-red-500 transition-all shadow shadow-red-900/40 disabled:opacity-40">
          {busy
            ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Working…</>
            : `Open Selected (${selectedAccountIds.length})`
          }
        </button>
      }
    >
      <div className="grid lg:grid-cols-[300px_1fr] gap-5">

        {/* Left — account selector */}
        <div className="space-y-4">
          <AccountSelector />

          {/* Status */}
          <SectionCard title="Status" icon="📊">
            {statusMessage
              ? <p className="text-sm text-slate-300 leading-relaxed">{statusMessage}</p>
              : <p className="text-xs text-slate-600">No active task.</p>
            }
            {task && <TaskProgressView task={task} busy={false} onCancel={null} />}
            {task && ['running','pending','queued'].includes(task.status) && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-3 py-2 text-[11px] text-emerald-300 mt-2">
                ✅ Task continues even if you switch tabs.
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right — action config */}
        <div className="space-y-4">
          <SectionCard title="Select Action" icon="⚙️">
            <div className="space-y-2">
              {ACTIONS.map((a) => (
                <button key={a.value} type="button" onClick={() => setAction(a.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                    action === a.value
                      ? 'bg-accent-red/10 border-accent-red/30 text-white'
                      : 'bg-white/3 border-white/8 text-slate-400 hover:bg-white/6 hover:text-white'
                  }`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    action === a.value ? 'border-accent-red bg-accent-red' : 'border-white/30'
                  }`}>
                    {action === a.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-lg shrink-0">{a.icon}</span>
                  <div>
                    <div className="text-sm font-semibold">{a.label}</div>
                    <div className="text-[11px] text-slate-500">{a.desc}</div>
                  </div>
                  {action === a.value && (
                    <span className="ml-auto text-[10px] font-bold text-accent-red bg-accent-red/15 px-2 py-0.5 rounded-full">ACTIVE</span>
                  )}
                </button>
              ))}
            </div>
          </SectionCard>

          {/* Summary */}
          {selectedAccountIds.length > 0 && (
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/8 px-4 py-3 text-xs text-blue-300">
              ℹ️ <strong className="text-blue-200">{selectedAccountIds.length} account{selectedAccountIds.length > 1 ? 's' : ''}</strong> will be processed using <strong className="text-blue-200">{ACTIONS.find((a) => a.value === action)?.label}</strong> action.
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
