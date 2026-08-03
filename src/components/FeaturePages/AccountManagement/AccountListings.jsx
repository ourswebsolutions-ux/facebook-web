import { useState } from 'react'
import { useAppStore } from '../../../store'
import api from '../../../utils/api'
import {
  PageShell, ActionButtons, SectionCard,
  ConfigPanel, Field, DropdownSelect, ImageUploader, TaskProgressView,
} from '../shared/FeatureHelpers'
import { FB_CATEGORIES } from '../shared/constants'

const LISTING_MODES = [
  {
    id: 'old-account',
    label: 'Old Account Listings',
    desc: 'Post on warmed / older Facebook accounts',
    route: 'new-account-slow',
    isV2: false,
  },
  {
    id: 'new-account-slow',
    label: 'New Account Slow',
    desc: 'Safe slow listing flow for new accounts',
    route: 'new-account-slow',
    isV2: false,
  },
  {
    id: 'new-account-slow-v2',
    label: 'New Account Slow V2',
    desc: 'Improved pacing with warmup support',
    route: 'new-account-slow-v2',
    isV2: true,
  },
]

// ── Inline MultiAccountSelector ───────────────────────────────────────────────
function MultiAccountSelector() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const selectedAccountIds = useAppStore((s) => s.selectedAccountIds)
  const setSelectedAccountIds = useAppStore((s) => s.setSelectedAccountIds)
  const setTab = useAppStore((s) => s.setActiveTab)

  useState(() => {
    api.getAccounts().then((data) => {
      setAccounts(data)
      if (!selectedAccountIds.length && data.length) {
        const verified = data.find((a) => a.cookies)
        setSelectedAccountIds(verified ? [verified.id] : [data[0].id])
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = search
    ? accounts.filter((a) =>
        (a.email || a.phone || '').toLowerCase().includes(search.toLowerCase())
      )
    : accounts

  const allSelected = filtered.length > 0 && filtered.every((a) => selectedAccountIds.includes(a.id))
  const someSelected = filtered.some((a) => selectedAccountIds.includes(a.id)) && !allSelected

  const toggleAll = () => {
    if (allSelected) {
      // deselect only filtered accounts
      setSelectedAccountIds(selectedAccountIds.filter((id) => !filtered.find((a) => a.id === id)))
    } else {
      // select all filtered accounts (keep existing selections too)
      const newIds = [...new Set([...selectedAccountIds, ...filtered.map((a) => a.id)])]
      setSelectedAccountIds(newIds)
    }
  }

  const toggle = (id) => {
    if (selectedAccountIds.includes(id))
      setSelectedAccountIds(selectedAccountIds.filter((x) => x !== id))
    else
      setSelectedAccountIds([...selectedAccountIds, id])
  }

  return (
    <SectionCard title="Select Accounts" icon="👥">
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : accounts.length === 0 ? (
        <div className="text-sm text-slate-400">
          No accounts.{' '}
          <button type="button" onClick={() => setTab('accounts')} className="text-accent-red underline">Add one.</button>
        </div>
      ) : (
        <div className="space-y-2">

          {/* Search bar */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="input pl-8 py-1.5 text-sm"
              placeholder="Search accounts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Select All */}
          <label onClick={toggleAll}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer border transition-all ${
              allSelected ? 'bg-accent-red/10 border-accent-red/30' : 'bg-white/3 border-white/8 hover:bg-white/6'
            }`}>
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
              allSelected ? 'bg-accent-red border-accent-red' : someSelected ? 'border-accent-red bg-accent-red/30' : 'border-white/30'
            }`}>
              {allSelected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5"/></svg>}
              {someSelected && <div className="w-2 h-0.5 bg-white rounded" />}
            </div>
            <span className="text-sm font-semibold text-white">
              {allSelected ? 'Deselect All' : 'Select All'}
              {search ? ` (${filtered.length} filtered)` : ` (${accounts.length})`}
            </span>
            <span className="ml-auto text-xs text-slate-500">{selectedAccountIds.length} selected</span>
          </label>

          {/* Account list — fixed height, scrollable */}
          <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
            {filtered.length === 0 ? (
              <p className="text-xs text-slate-500 px-2 py-3">No accounts match "{search}"</p>
            ) : (
              filtered.map((acc) => {
                const isSelected = selectedAccountIds.includes(acc.id)
                return (
                  <label key={acc.id} onClick={() => toggle(acc.id)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer border transition-all ${
                      isSelected ? 'bg-accent-red/10 border-accent-red/25' : 'bg-transparent border-transparent hover:bg-white/4'
                    }`}>
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
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
              })
            )}
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
export default function AccountListings({ feature }) {
  const selectedAccountIds = useAppStore((s) => s.selectedAccountIds)
  const runningTasks   = useAppStore((s) => s.runningTasks)
  const setRunningTask = useAppStore((s) => s.setRunningTask)
  const pageSessions   = useAppStore((s) => s.pageSessions)
  const setPageSession = useAppStore((s) => s.setPageSession)

  const PAGE_ID       = 'account-listings'
  // tasks + statusMessage in store — survive tab switches
  const session       = pageSessions[PAGE_ID] || {}
  const tasks         = session.tasks || []
  const statusMessage = session.statusMessage || ''
  const setTasks      = (t) => setPageSession(PAGE_ID, { ...session, tasks: typeof t === 'function' ? t(session.tasks || []) : t })
  const setStatusMessage = (msg) => setPageSession(PAGE_ID, { ...(pageSessions[PAGE_ID] || {}), statusMessage: msg })

  const [mode, setMode]             = useState('old-account')
  const activeMode                  = LISTING_MODES.find((m) => m.id === mode)

  // Shared fields
  const [productName, setProductName]   = useState('')
  const [description, setDescription]   = useState('')
  const [category, setCategory]         = useState('Electronics')
  const [condition, setCondition]       = useState('used_good')
  const [price, setPrice]               = useState(499)
  const [delaySeconds, setDelaySeconds] = useState(30)
  const [imagePaths, setImagePaths]     = useState([])

  // V2-only fields
  const [useAi, setUseAi]               = useState(true)
  const [warmupBefore, setWarmupBefore] = useState(true)
  const [warmupSteps, setWarmupSteps]   = useState(3)

  // Task tracking — busy is local (UI only), rest in store
  const [busy, setBusy] = useState(false)

  // AI Generate
  const [aiPrompt, setAiPrompt]   = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError]     = useState('')

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return
    setAiLoading(true)
    setAiError('')
    try {
      const res = await api.generateProduct(aiPrompt.trim())
      if (res.title) setProductName(res.title)
      if (res.description) setDescription(res.description)
    } catch (err) {
      setAiError(err?.response?.data?.detail || 'AI generation failed. Try again.')
    } finally {
      setAiLoading(false)
    }
  }

  const canStart = selectedAccountIds.length > 0 && imagePaths.length > 0

  const handleAction = async () => {
    if (!canStart || busy) return
    setBusy(true); setStatusMessage(''); setTasks([])

    const basePayload = {
      // listing_count = number of images → each image becomes a separate listing
      listing_count: imagePaths.length,
      delay_seconds: delaySeconds,
      use_ai: activeMode.isV2 ? useAi : true,
      product_name: productName || 'Sample product',
      description: description || '',
      category, condition,
      price: price * 100,
      images: imagePaths,   // backend picks images[i] for listing i
      ...(activeMode.isV2 ? {
        warmup_before: warmupBefore,
        warmup_steps: Math.min(10, Math.max(1, warmupSteps)),
      } : {}),
    }

    // Sequential — ek ke baad ek
    const results = []
    for (let i = 0; i < selectedAccountIds.length; i++) {
      const accountId = selectedAccountIds[i]
      setStatusMessage(`Posting on account ${i + 1}/${selectedAccountIds.length}…`)
      try {
        const data = await api.startAutomation(activeMode.route, {
          ...basePayload, account_id: accountId,
        })
        const taskId = data?.task_id
        if (taskId) {
          // Register in global store — GlobalTaskPoller will keep it updated
          setRunningTask(taskId, { status: 'running', progress: 0, completed_steps: 0, total_steps: 1, error: null, result: null })
        }
        const entry = { accountId, success: true, taskId }
        results.push(entry)
        setTasks([...results])

        // Wait for task completion before next account
        if (taskId) {
          await new Promise((resolve) => {
            const poll = async () => {
              try {
                const taskData = await api.getTask(taskId)
                setRunningTask(taskId, taskData)
                if (['completed','failed','cancelled'].includes(taskData.status)) resolve()
                else setTimeout(poll, 2500)
              } catch { resolve() }
            }
            poll()
          })
        }
      } catch (err) {
        results.push({ accountId, success: false, taskId: null, error: err?.response?.data?.detail || err?.message })
        setTasks([...results])
      }
    }

    const ok = results.filter((r) => r.success).length
    setStatusMessage(`Done — ${ok}/${selectedAccountIds.length} accounts posted.`)
    setBusy(false)
  }

  return (
    <PageShell
      title={activeMode?.label || 'FB Account Listings'}
      description={activeMode?.desc || ''}
      actions={
        <ActionButtons
          actions={['Start Listing']}
          onAction={handleAction}
          disabled={!canStart || busy}
          busy={busy}
        />
      }
    >
      <div className="grid lg:grid-cols-[300px_1fr] gap-5 items-start">

        {/* Left column — sticky, no scroll */}
        <div className="space-y-4 lg:sticky lg:top-0 lg:self-start">

          {/* 1. Listing Mode dropdown — TOP */}
          <SectionCard title="Listing Mode" icon="🔧">
            <select className="input" value={mode} onChange={(e) => setMode(e.target.value)}>
              {LISTING_MODES.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
            {activeMode && <p className="text-xs text-slate-500 mt-1">{activeMode.desc}</p>}
          </SectionCard>

          {/* 2. Select Accounts */}
          <MultiAccountSelector />

          {/* 3. Status */}
          <SectionCard title="Status" icon="📊">
            {statusMessage
              ? <p className="text-sm text-slate-300 leading-relaxed">{statusMessage}</p>
              : <p className="text-xs text-slate-600">No active task.</p>
            }
            {tasks.length > 0 && (
              <div className="space-y-4 mt-2">
                {tasks.map((t, i) => {
                  const taskData = t.taskId ? (runningTasks[t.taskId] || t.taskData) : null
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
                )})}
              </div>
            )}
            {tasks.some((t) => t.taskId && ['running','pending','queued'].includes(runningTasks[t.taskId]?.status)) && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-3 py-2 text-[11px] text-emerald-300 mt-2">
                ✅ Tasks continue running even if you switch tabs.
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right column — scrollable independently via parent PageShell */}
        <div className="space-y-4">

          <SectionCard title="Product Images" icon="🖼️">
            <ImageUploader imagePaths={imagePaths} onChange={setImagePaths} required />
          </SectionCard>

          {/* AI Generate */}
          <SectionCard title="AI Generate" icon="✨">
            <div className="flex gap-2">
              <input
                className="input flex-1 text-sm"
                placeholder="e.g. used iPhone 14 Pro Max 256GB space black"
                value={aiPrompt}
                onChange={(e) => { setAiPrompt(e.target.value); setAiError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
              />
              <button
                type="button"
                onClick={handleAiGenerate}
                disabled={aiLoading || !aiPrompt.trim()}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors flex items-center gap-2 shrink-0"
              >
                {aiLoading
                  ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>Generating...</>
                  : '⚡ Generate'}
              </button>
            </div>
            {aiError && <p className="text-xs text-red-400 mt-1">{aiError}</p>}
            <p className="text-xs text-slate-500 mt-1">Title and description will be auto-filled below.</p>
          </SectionCard>

          <ConfigPanel title="Listing Details" icon="📝">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Product Name">
                <input className="input" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. iPhone 14 Pro Max" />
              </Field>
              <Field label="Category">
                <DropdownSelect options={FB_CATEGORIES} value={category} onChange={setCategory} />
              </Field>
              <Field label="Condition">
                <select className="input" value={condition} onChange={(e) => setCondition(e.target.value)}>
                  <option value="new">New</option>
                  <option value="used_like_new">Used — Like new</option>
                  <option value="used_good">Used — Good</option>
                  <option value="used_fair">Used — Fair</option>
                </select>
              </Field>
              <Field label="Price (USD $)">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none">$</span>
                  <input className="input pl-7" type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
                </div>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Description" hint="Optional — AI generates if blank">
                  <textarea className="input min-h-[80px] resize-none" value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Excellent condition, original packaging included…" />
                </Field>
              </div>
            </div>
          </ConfigPanel>

          {/* Settings — V2 gets extra warmup fields */}
          {activeMode?.isV2 ? (
            <ConfigPanel title="Warmup & Automation" icon="🔥">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Warm up before listing">
                  <select className="input" value={warmupBefore ? 'yes' : 'no'} onChange={(e) => setWarmupBefore(e.target.value === 'yes')}>
                    <option value="yes">Yes — warm up first</option>
                    <option value="no">No — skip warmup</option>
                  </select>
                </Field>
                <Field label="Warm-up steps (1–10)">
                  <input className="input" type="number" min={1} max={10} value={warmupSteps} disabled={!warmupBefore}
                    onChange={(e) => setWarmupSteps(Number(e.target.value))} />
                </Field>
                <Field label="Delay (sec)" hint="Min 5s">
                  <input className="input" type="number" min={5} max={300} value={delaySeconds} onChange={(e) => setDelaySeconds(Number(e.target.value))} />
                </Field>
                <Field label="Use AI for content">
                  <select className="input" value={useAi ? 'yes' : 'no'} onChange={(e) => setUseAi(e.target.value === 'yes')}>
                    <option value="yes">Yes — AI generated</option>
                    <option value="no">No — use product name</option>
                  </select>
                </Field>
              </div>
            </ConfigPanel>
          ) : (
            <ConfigPanel title="Automation Settings" icon="⚡">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Delay between posts (sec)" hint="Min 10s recommended">
                  <input className="input" type="number" min={10} max={300} value={delaySeconds} onChange={(e) => setDelaySeconds(Number(e.target.value))} />
                </Field>
              </div>
            </ConfigPanel>
          )}

          {selectedAccountIds.length > 0 && imagePaths.length > 0 && (
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/8 px-4 py-3 text-xs text-blue-300">
              ℹ️ <strong className="text-blue-200">{imagePaths.length} listing{imagePaths.length > 1 ? 's' : ''}</strong> will be posted per account
              {selectedAccountIds.length > 1 && <> on <strong className="text-blue-200">{selectedAccountIds.length} accounts</strong> = <strong className="text-blue-200">{imagePaths.length * selectedAccountIds.length}</strong> total posts</>}
              {' '}— each with a <strong className="text-blue-200">different image</strong>, same title/price.
            </div>
          )}

          {!imagePaths.length && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex items-start gap-2.5 text-sm text-amber-300">
              <span className="shrink-0">⚠️</span>
              <span>Upload at least one product image to enable the Start button.</span>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
