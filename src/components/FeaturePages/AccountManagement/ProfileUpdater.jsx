import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../../../store'
import api from '../../../utils/api'
import {
  PageShell, SectionCard, ConfigPanel, Field, TaskProgressView,
} from '../shared/FeatureHelpers'

// ── Multi-account selector with search + scroll ───────────────────────────────
function AccountSelector() {
  const [accounts, setAccounts]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const selectedAccountIds            = useAppStore((s) => s.selectedAccountIds)
  const setSelectedAccountIds         = useAppStore((s) => s.setSelectedAccountIds)
  const setTab                        = useAppStore((s) => s.setActiveTab)

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
      {loading ? <p className="text-sm text-slate-500">Loading…</p>
      : accounts.length === 0 ? (
        <div className="text-sm text-slate-400">No accounts. <button type="button" onClick={() => setTab('accounts')} className="text-accent-red underline">Add one.</button></div>
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
              {allSelected ? 'Deselect All' : 'Select All'}{search ? ` (${filtered.length} filtered)` : ` (${accounts.length})`}
            </span>
            <span className="ml-auto text-xs text-slate-500">{selectedAccountIds.length} selected</span>
          </label>
          {/* List */}
          <div className="space-y-1 max-h-56 overflow-y-auto">
            {filtered.length === 0
              ? <p className="text-xs text-slate-500 px-2 py-3">No accounts match "{search}"</p>
              : filtered.map((acc) => {
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
                        {acc.cookies ? <span className="text-[10px] text-emerald-400">✓ verified</span> : <span className="text-[10px] text-amber-400">⚠ unverified</span>}
                      </div>
                    </div>
                  </label>
                )
              })
            }
          </div>
          <button type="button" onClick={() => setTab('accounts')} className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors text-left pt-1">
            + Manage accounts
          </button>
        </div>
      )}
    </SectionCard>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ProfileUpdater({ feature }) {
  const selectedAccountIds = useAppStore((s) => s.selectedAccountIds)
  const runningTasks       = useAppStore((s) => s.runningTasks)
  const setRunningTask     = useAppStore((s) => s.setRunningTask)
  const pageSessions       = useAppStore((s) => s.pageSessions)
  const setPageSession     = useAppStore((s) => s.setPageSession)

  const PAGE_KEY   = 'profile-updater'
  const session    = pageSessions[PAGE_KEY] || {}
  const taskId     = session.taskId || null
  const task       = taskId ? (runningTasks[taskId] || null) : null
  const setTaskId  = (id) => setPageSession(PAGE_KEY, { ...session, taskId: id })

  const [name, setName]           = useState('')
  const [bio, setBio]             = useState('')
  const [location, setLocation]   = useState('')
  const [hometown, setHometown]   = useState('')
  const [workplace, setWorkplace] = useState('')
  const [jobTitle, setJobTitle]   = useState('')
  const [school, setSchool]       = useState('')
  const [busy, setBusy]         = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [tasks, setTasks]       = useState([]) // per-account task list

  // Resume polling on tab return
  useEffect(() => {
    if (!taskId || ['completed','failed','cancelled'].includes(task?.status)) return
    let cancelled = false
    const poll = async () => {
      try {
        const data = await api.getTask(taskId)
        if (cancelled) return
        setRunningTask(taskId, data)
        if (['running','pending','queued'].includes(data.status)) setTimeout(poll, 2500)
        else {
          if (data.status === 'completed') setStatusMessage('✅ Profile updated successfully.')
          else if (data.status === 'failed') setStatusMessage(`❌ Failed: ${data.error || 'Unknown error'}`)
        }
      } catch { /* ignore */ }
    }
    poll()
    return () => { cancelled = true }
  }, [taskId]) // eslint-disable-line

  const handleRun = async () => {
    if (!selectedAccountIds.length || busy) return
    if (!name && !bio && !location && !hometown && !workplace && !jobTitle && !school) {
      setStatusMessage('⚠️ Fill at least one field (Bio or Location) before updating.')
      return
    }
    setBusy(true); setStatusMessage(''); setTasks([])

    // Sequential — one account at a time
    const results = []
    for (let i = 0; i < selectedAccountIds.length; i++) {
      const accountId = selectedAccountIds[i]
      setStatusMessage(`Updating account ${i + 1}/${selectedAccountIds.length}…`)
      try {
        const data = await api.startAutomation('profile-updater', {
          account_id:      accountId,
          name:            name      || null,
          bio:             bio       || null,
          location:        location  || null,
          hometown:        hometown  || null,
          workplace:       workplace || null,
          job_title:       jobTitle  || null,
          school:          school    || null,
          profile_pic_url: null,
          cover_pic_url:   null,
        })
        const id = data?.task_id
        if (id) {
          setTaskId(id)
          setRunningTask(id, { status: 'running', progress: 0, completed_steps: 0, total_steps: 3 })
        }
        results.push({ accountId, success: true, taskId: id })
        setTasks([...results])

        // Wait for completion before next account
        if (id) {
          await new Promise((resolve) => {
            const poll = async () => {
              try {
                const d = await api.getTask(id)
                setRunningTask(id, d)
                if (['completed','failed','cancelled'].includes(d.status)) resolve()
                else setTimeout(poll, 2500)
              } catch { resolve() }
            }
            poll()
          })
        }
      } catch (err) {
        results.push({ accountId, success: false, error: err?.response?.data?.detail || err?.message })
        setTasks([...results])
      }
    }

    const ok = results.filter((r) => r.success).length
    setStatusMessage(`Done — ${ok}/${selectedAccountIds.length} accounts processed.`)
    setBusy(false)
  }

  const canRun = selectedAccountIds.length > 0 && (!!name || !!bio || !!location || !!hometown || !!workplace || !!jobTitle || !!school)

  return (
    <PageShell
      title={feature.title}
      description={feature.description}
      actions={
        <button type="button" disabled={busy || !canRun} onClick={handleRun}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-red text-white font-bold text-sm
                     hover:bg-red-500 transition-all shadow shadow-red-900/40 disabled:opacity-40">
          {busy
            ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Updating…</>
            : '✏️ Update Profiles'
          }
        </button>
      }
    >
      <div className="grid lg:grid-cols-[300px_1fr] gap-5">

        {/* Left — account selector + status */}
        <div className="space-y-4">
          <AccountSelector />

          <SectionCard title="Status" icon="📊">
            {statusMessage
              ? <p className="text-sm text-slate-300 leading-relaxed">{statusMessage}</p>
              : <p className="text-xs text-slate-600">No active task.</p>
            }
            {/* Per-account progress */}
            {tasks.length > 0 && (
              <div className="space-y-3 mt-2">
                {tasks.map((t, i) => {
                  const taskData = t.taskId ? (runningTasks[t.taskId] || null) : null
                  return (
                    <div key={i} className="space-y-1.5">
                      <p className="text-[11px] text-slate-500 font-mono">Account: {t.accountId.slice(0, 8)}…</p>
                      {taskData
                        ? <TaskProgressView task={taskData} busy={false} onCancel={null} />
                        : t.success
                          ? <div className="text-xs text-blue-300 bg-blue-500/8 border border-blue-500/20 rounded-xl px-3 py-2">⏳ Starting…</div>
                          : <div className="text-xs text-red-300 bg-red-500/8 border border-red-500/20 rounded-xl px-3 py-2">✗ {t.error}</div>
                      }
                    </div>
                  )
                })}
              </div>
            )}
            {tasks.some((t) => t.taskId && ['running','pending','queued'].includes(runningTasks[t.taskId]?.status)) && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-3 py-2 text-[11px] text-emerald-300 mt-2">
                ✅ Task continues even if you switch tabs.
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right — profile fields */}
        <div className="space-y-4">

          <ConfigPanel title="Profile Information" icon="✏️">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Bio / About" hint="Intro section on profile">
                  <textarea className="input min-h-[80px] resize-none" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="e.g. Selling quality items at fair prices." />
                </Field>
              </div>
              <Field label="Name / Nickname" hint="Name pronunciation or alternate name">
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ali" />
              </Field>
              <Field label="Current City" hint="Location displayed on profile">
                <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Lahore, Pakistan" />
              </Field>
              <Field label="Hometown" hint="Your hometown city">
                <input className="input" value={hometown} onChange={(e) => setHometown(e.target.value)} placeholder="e.g. Karachi, Pakistan" />
              </Field>
              <Field label="Workplace" hint="Company or employer name">
                <input className="input" value={workplace} onChange={(e) => setWorkplace(e.target.value)} placeholder="e.g. AxoraWeb Solutions" />
              </Field>
              <Field label="Job Title" hint="Your position or role">
                <input className="input" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Software Engineer" />
              </Field>
              <Field label="School / University" hint="Education institution">
                <input className="input" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="e.g. University of Punjab" />
              </Field>
            </div>
          </ConfigPanel>

          {/* Info cards */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/8 px-4 py-3 text-xs text-blue-300 space-y-1.5">
            <p className="font-semibold text-blue-200">ℹ️ How this works</p>
            <ul className="space-y-1 text-blue-300/80">
              <li>• Opens a headless browser for each selected account</li>
              <li>• <strong className="text-blue-200">Bio</strong> — Intro section</li>
              <li>• <strong className="text-blue-200">Name/Nickname</strong> — Names pronunciation</li>
              <li>• <strong className="text-blue-200">City &amp; Hometown</strong> — Personal details</li>
              <li>• <strong className="text-blue-200">Work &amp; Education</strong> — Work/Education sections</li>
              <li>• Only filled fields are updated — empty fields skipped</li>
            </ul>
          </div>
          {/* Warning if login might fail */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-xs text-amber-300">
            ⚠️ Make sure selected accounts are <strong className="text-amber-200">verified</strong> (have saved cookies) before updating. Unverified accounts will fail with "Login failed".
          </div>

          {!canRun && selectedAccountIds.length > 0 && (
            <div className="rounded-xl border border-slate-500/20 bg-white/3 px-4 py-3 text-xs text-slate-400">
              Fill at least one field (Name, Bio, Location, Hometown, Workplace, Job Title, or School) to enable the Update button.
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
