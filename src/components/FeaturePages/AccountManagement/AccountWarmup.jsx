import { useState } from 'react'
import { useAppStore } from '../../../store'
import { useGlobalTask } from '../../../hooks/useGlobalTask'
import {
  PageShell, MultiAccountSelector, SectionCard,
  ConfigPanel, Field, TaskProgressView,
} from '../shared/FeatureHelpers'
import api from '../../../utils/api'

const WARMUP_TIPS = [
  { icon: '🗺️', text: 'Navigates Marketplace categories naturally' },
  { icon: '📜', text: 'Scrolls and hovers over listings' },
  { icon: '🛡️', text: 'Builds trust signals before posting' },
  { icon: '✅', text: 'Reduces ban risk on new accounts' },
]

const PRESETS = [
  { label: 'Quick',    icon: '⚡', duration: 5,  actions: 2, desc: '5 min light warmup' },
  { label: 'Standard', icon: '🔥', duration: 15, actions: 3, desc: '15 min balanced' },
  { label: 'Deep',     icon: '🚀', duration: 30, actions: 4, desc: '30 min thorough' },
]

export default function AccountWarmup({ feature }) {
  const selectedAccountIds = useAppStore((s) => s.selectedAccountIds)
  const runningTasks       = useAppStore((s) => s.runningTasks)
  const setRunningTask     = useAppStore((s) => s.setRunningTask)
  const pageSessions       = useAppStore((s) => s.pageSessions)
  const setPageSession     = useAppStore((s) => s.setPageSession)

  const PAGE_ID = 'account-warmup'
  // accountTasks lives in store — survives tab switches
  const accountTasks    = pageSessions[PAGE_ID] || []
  const setAccountTasks = (tasks) => setPageSession(PAGE_ID, tasks)

  const [durationMinutes, setDurationMinutes]   = useState(10)
  const [actionsPerMinute, setActionsPerMinute] = useState(3)
  const [running, setRunning]           = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  const canStart = selectedAccountIds.length > 0

  const handleStart = async () => {
    if (!canStart || running) return
    setRunning(true)
    setStatusMessage('')
    setAccountTasks([])

    // Sequential — start warmup for each selected account one by one
    const results = []
    for (let i = 0; i < selectedAccountIds.length; i++) {
      const accountId = selectedAccountIds[i]
      setStatusMessage(`Starting warmup ${i + 1}/${selectedAccountIds.length} — account ${accountId.slice(0, 8)}…`)
      try {
        const data = await api.startAutomation('warmup', {
          account_id: accountId,
          duration_minutes: durationMinutes,
          actions_per_minute: actionsPerMinute,
        })
        const taskId = data?.task_id
        if (taskId) {
          // Register in global store so it survives tab switches
          setRunningTask(taskId, {
            taskId, status: 'running', progress: 0,
            total_steps: durationMinutes, completed_steps: 0,
            error: null, result: null,
          })
        }
        results.push({ accountId, taskId, success: true })
        setAccountTasks([...results])
      } catch (err) {
        results.push({ accountId, taskId: null, success: false, error: err?.response?.data?.detail || err?.message })
        setAccountTasks([...results])
      }
    }
    const ok = results.filter((r) => r.success).length
    setStatusMessage(`${ok}/${selectedAccountIds.length} warmups started — running in background.`)
    setRunning(false)
  }

  // Safety level
  const safetyLevel = actionsPerMinute <= 2
    ? { label: 'Very Safe', color: 'text-emerald-400', bar: 'bg-emerald-400', w: '25%' }
    : actionsPerMinute <= 4
    ? { label: 'Safe', color: 'text-blue-400', bar: 'bg-blue-400', w: '55%' }
    : actionsPerMinute <= 7
    ? { label: 'Moderate', color: 'text-amber-400', bar: 'bg-amber-400', w: '80%' }
    : { label: 'Risky', color: 'text-red-400', bar: 'bg-red-400', w: '100%' }

  return (
    <PageShell
      title={feature.title}
      description={feature.description}
      actions={
        <button type="button" disabled={running || !canStart} onClick={handleStart}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-red text-white font-bold text-sm
                     hover:bg-red-500 transition-all shadow shadow-red-900/40 disabled:opacity-40">
          {running
            ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Starting…</>
            : '🔥 Start Warm Up'
          }
        </button>
      }
    >
      <div className="grid lg:grid-cols-[300px_1fr] gap-5">

        {/* Left column */}
        <div className="space-y-4">
          <MultiAccountSelector title="Select Accounts" />

          {/* Status */}
          <SectionCard title="Status" icon="📊">
            {statusMessage
              ? <p className="text-sm text-slate-300 leading-relaxed">{statusMessage}</p>
              : <p className="text-xs text-slate-600">No active warmup.</p>
            }

            {/* Per-account task progress */}
            {accountTasks.length > 0 && (
              <div className="space-y-3 mt-2">
                {accountTasks.map((t) => {
                  const taskData = t.taskId ? runningTasks[t.taskId] : null
                  return (
                    <div key={t.accountId} className="space-y-1.5">
                      <p className="text-[11px] text-slate-500 font-mono">
                        Account: {t.accountId.slice(0, 8)}…
                      </p>
                      {!t.success ? (
                        <div className="text-xs text-red-300 bg-red-500/8 border border-red-500/20 rounded-xl px-3 py-2">
                          ✗ {t.error}
                        </div>
                      ) : taskData ? (
                        <TaskProgressView task={taskData} busy={false} onCancel={null} />
                      ) : (
                        <div className="text-xs text-blue-300 bg-blue-500/8 border border-blue-500/20 rounded-xl px-3 py-2">
                          ⏳ Warming up…
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Tab switch note */}
            {accountTasks.some((t) => t.taskId && !['completed','failed'].includes(runningTasks[t.taskId]?.status)) && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-3 py-2 text-[11px] text-emerald-300 mt-2">
                ✅ Tasks continue running even if you switch tabs.
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Quick Presets */}
          <SectionCard title="Quick Presets" icon="⚡">
            <div className="grid grid-cols-3 gap-3">
              {PRESETS.map((p) => (
                <button key={p.label} type="button"
                  onClick={() => { setDurationMinutes(p.duration); setActionsPerMinute(p.actions) }}
                  className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-center transition-all ${
                    durationMinutes === p.duration && actionsPerMinute === p.actions
                      ? 'bg-accent-red/10 border-accent-red/30 text-white'
                      : 'bg-white/3 border-white/8 text-slate-400 hover:bg-white/6 hover:text-white'
                  }`}>
                  <span className="text-lg">{p.icon}</span>
                  <span className="text-sm font-semibold">{p.label}</span>
                  <span className="text-[10px] text-slate-500">{p.desc}</span>
                </button>
              ))}
            </div>
          </SectionCard>

          {/* Settings */}
          <ConfigPanel title="Warmup Settings" icon="🔥">
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Duration (minutes)" hint="How long to warm up">
                <input className="input" type="number" min={1} max={60}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))} />
              </Field>
              <Field label="Actions per minute" hint="Browse, scroll, hover — 3 is safe">
                <input className="input" type="number" min={1} max={10}
                  value={actionsPerMinute}
                  onChange={(e) => setActionsPerMinute(Number(e.target.value))} />
              </Field>
            </div>

            {/* Safety indicator */}
            <div className="rounded-xl bg-white/3 border border-white/8 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Detection Risk</span>
                <span className={`font-bold ${safetyLevel.color}`}>{safetyLevel.label}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${safetyLevel.bar}`}
                  style={{ width: safetyLevel.w }} />
              </div>
              <p className="text-[11px] text-slate-600">
                {actionsPerMinute} action{actionsPerMinute > 1 ? 's' : ''}/min × {durationMinutes} min
                = ~{durationMinutes * actionsPerMinute} total actions
              </p>
            </div>
          </ConfigPanel>

          {/* What warmup does */}
          <SectionCard title="What warmup does" icon="ℹ️">
            <div className="grid sm:grid-cols-2 gap-3">
              {WARMUP_TIPS.map((tip) => (
                <div key={tip.text}
                  className="flex items-start gap-3 rounded-xl bg-white/3 border border-white/5 px-3 py-2.5">
                  <span className="text-base shrink-0 mt-0.5">{tip.icon}</span>
                  <span className="text-sm text-slate-300">{tip.text}</span>
                </div>
              ))}
            </div>
          </SectionCard>

        </div>
      </div>
    </PageShell>
  )
}
