import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useAppStore } from '../../../store'
import api from '../../../utils/api'

// ─────────────────────────────────────────────────────────────────────────────
// PageShell — full-page wrapper with gradient header
// ─────────────────────────────────────────────────────────────────────────────
export function PageShell({ title, description, children, actions }) {
  return (
    <div className="h-full overflow-y-auto">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 px-8 py-5 bg-surface border-b border-white/5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
            {description && (
              <p className="text-sm text-slate-400 mt-0.5 leading-relaxed">{description}</p>
            )}
          </div>
          {actions && <div className="flex flex-wrap gap-2 pt-0.5">{actions}</div>}
        </div>
      </div>
      {/* Body — full width, same padding as Settings */}
      <div className="px-8 py-6 space-y-5">
        {children}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ActionButtons
// ─────────────────────────────────────────────────────────────────────────────
export function ActionButtons({ actions = [], danger = false, onAction, disabled, busy }) {
  const label = actions[0]
  if (!label) return null
  const isDanger = danger || label.toLowerCase().includes('delete')
  return (
    <button
      type="button"
      disabled={disabled || busy}
      className={`${isDanger ? 'btn-danger' : 'btn-primary'} gap-2 min-w-[120px] justify-center`}
      onClick={() => onAction?.(label)}
    >
      {busy ? (
        <>
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Working…
        </>
      ) : label}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SectionCard — a titled card block
// ─────────────────────────────────────────────────────────────────────────────
export function SectionCard({ title, icon, children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-white/8 bg-white/3 ${className}`}>
      {title && (
        <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5">
          {icon && <span className="text-base">{icon}</span>}
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{title}</span>
        </div>
      )}
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ConfigPanel — alias for SectionCard used in feature configs
// ─────────────────────────────────────────────────────────────────────────────
export function ConfigPanel({ children, title = 'Configuration', icon = '⚙️' }) {
  return <SectionCard title={title} icon={icon}>{children}</SectionCard>
}

// ─────────────────────────────────────────────────────────────────────────────
// Field — label + input wrapper
// ─────────────────────────────────────────────────────────────────────────────
export function Field({ label, children, hint }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-slate-600 block leading-relaxed">{hint}</span>}
    </label>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DropdownSelect — smart direction: opens down if space available, else up
// ─────────────────────────────────────────────────────────────────────────────
export function DropdownSelect({ options = [], value, onChange, placeholder = 'Select an option' }) {
  const [open, setOpen] = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const rootRef = useRef(null)

  const normalizedOptions = useMemo(
    () => options.map((option) => (
      typeof option === 'string'
        ? { value: option, label: option }
        : option
    )),
    [options]
  )

  const selected = normalizedOptions.find((option) => option.value === value)

  // Decide direction when opening
  const handleToggle = () => {
    if (!open && rootRef.current) {
      const rect = rootRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      // Open upward only if below space < 220px AND above space > below space
      setOpenUp(spaceBelow < 220 && spaceAbove > spaceBelow)
    }
    setOpen((prev) => !prev)
  }

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <div ref={rootRef} className="relative z-[200]">
      <button
        type="button"
        className="input flex items-center justify-between gap-3 text-left w-full"
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selected ? 'text-white' : 'text-slate-500'}>
          {selected?.label || placeholder}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
        >
          <path fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute left-0 right-0 z-[300] max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-[#16213e] p-1 shadow-2xl shadow-black/60
            ${openUp ? 'bottom-full mb-2' : 'top-full mt-2'}`}
          role="listbox"
        >
          {normalizedOptions.map((option) => {
            const isSelected = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-left transition-colors ${isSelected
                  ? 'bg-accent-red/15 text-red-400'
                  : 'text-slate-200 hover:bg-white/8'
                  }`}
                onClick={() => { onChange?.(option.value); setOpen(false) }}
                role="option"
                aria-selected={isSelected}
              >
                <span>{option.label}</span>
                {isSelected && <span className="text-xs opacity-70">✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    idle: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    warming: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    banned: 'bg-red-500/15 text-red-400 border-red-500/20',
  }
  const dot = {
    active: 'bg-emerald-400',
    idle: 'bg-blue-400',
    warming: 'bg-amber-400',
    banned: 'bg-red-400',
  }
  const cls = map[status] || 'bg-slate-500/15 text-slate-400 border-slate-500/20'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[status] || 'bg-slate-400'}`} />
      {status || 'unknown'}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AccountSelector — polished dropdown card
// ─────────────────────────────────────────────────────────────────────────────
export function AccountSelector({ title = 'Select Account' }) {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const selectedAccountIds = useAppStore((s) => s.selectedAccountIds)
  const setSelectedAccountIds = useAppStore((s) => s.setSelectedAccountIds)
  const setTab = useAppStore((s) => s.setActiveTab)

  const loadAccounts = useCallback(async () => {
    setError('')
    try {
      const data = await api.getAccounts()
      setAccounts(data)
      if (!selectedAccountIds.length && data.length) setSelectedAccountIds([data[0].id])
    } catch {
      setError('Unable to load accounts.')
    } finally {
      setLoading(false)
    }
  }, [selectedAccountIds.length, setSelectedAccountIds])

  useEffect(() => { loadAccounts() }, [loadAccounts])

  const selected = accounts.find((a) => a.id === selectedAccountIds[0])

  return (
    <SectionCard title={title} icon="👤">
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Loading accounts…
        </div>
      ) : error ? (
        <p className="text-sm text-amber-400">{error}</p>
      ) : accounts.length === 0 ? (
        <div className="text-sm text-slate-400">
          No accounts found.{' '}
          <button type="button" onClick={() => setTab('accounts')} className="text-accent-green underline">
            Add one here.
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <select
            className="input text-sm"
            value={selectedAccountIds[0] || ''}
            onChange={(e) => setSelectedAccountIds([e.target.value])}
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.email || acc.phone || acc.id.slice(0, 8)}
              </option>
            ))}
          </select>

          {selected && (
            <div className="rounded-xl border border-white/5 bg-white/3 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white truncate max-w-[180px]">
                  {selected.email || selected.phone}
                </span>
                <StatusBadge status={selected.status} />
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>Warmup <span className="text-slate-300 font-medium">{selected.warmup_level ?? 0}%</span></span>
                {selected.cookies
                  ? <span className="text-emerald-400 font-medium">✓ Verified</span>
                  : <span className="text-amber-400">⚠ Unverified</span>
                }
              </div>
              {/* Warmup bar */}
              <div className="h-1 rounded-full bg-white/8 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-600 to-accent-red transition-all"
                  style={{ width: `${selected.warmup_level ?? 0}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="button"
            className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors text-left"
            onClick={() => setTab('accounts')}
          >
            + Manage accounts
          </button>
        </div>
      )}
    </SectionCard>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MultiAccountSelector — checkboxes + Select All for listing pages
// ─────────────────────────────────────────────────────────────────────────────
export function MultiAccountSelector({ title = 'Select Accounts' }) {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const selectedAccountIds = useAppStore((s) => s.selectedAccountIds)
  const setSelectedAccountIds = useAppStore((s) => s.setSelectedAccountIds)
  const setTab = useAppStore((s) => s.setActiveTab)

  const loadAccounts = useCallback(async () => {
    setError('')
    try {
      const data = await api.getAccounts()
      setAccounts(data)
      if (!selectedAccountIds.length && data.length) {
        const verified = data.find((a) => a.cookies)
        setSelectedAccountIds(verified ? [verified.id] : [data[0].id])
      }
    } catch { setError('Unable to load accounts.') }
    finally { setLoading(false) }
  }, [selectedAccountIds.length, setSelectedAccountIds])

  useEffect(() => { loadAccounts() }, [loadAccounts])

  const filtered = search
    ? accounts.filter((a) => (a.email || a.phone || '').toLowerCase().includes(search.toLowerCase()))
    : accounts

  const allSelected = filtered.length > 0 && filtered.every((a) => selectedAccountIds.includes(a.id))
  const someSelected = filtered.some((a) => selectedAccountIds.includes(a.id)) && !allSelected

  const toggleAll = () => {
    if (allSelected) {
      setSelectedAccountIds(selectedAccountIds.filter((id) => !filtered.find((a) => a.id === id)))
    } else {
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
    <SectionCard title={title} icon="👥">
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Loading…
        </div>
      ) : error ? (
        <p className="text-sm text-amber-400">{error}</p>
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

          {/* Select All row */}
          <label onClick={toggleAll} className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer border transition-all
            ${allSelected ? 'bg-accent-red/10 border-accent-red/30' : 'bg-white/3 border-white/8 hover:bg-white/6'}`}>
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${allSelected ? 'bg-accent-red border-accent-red' : someSelected ? 'border-accent-red bg-accent-red/30' : 'border-white/30'
              }`}>
              {allSelected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" /></svg>}
              {!allSelected && someSelected && <div className="w-2 h-0.5 bg-white rounded" />}
            </div>
            <span className="text-sm font-semibold text-white">
              {allSelected ? 'Deselect All' : 'Select All'}
              {search ? ` (${filtered.length} filtered)` : ` (${accounts.length})`}
            </span>
            <span className="ml-auto text-xs text-slate-500">{selectedAccountIds.length} selected</span>
          </label>

          {/* Account list — fixed height with scroll */}
          <div className="space-y-1 max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-slate-500 px-2 py-3">No accounts match "{search}"</p>
            ) : (
              filtered.map((acc) => {
                const isSelected = selectedAccountIds.includes(acc.id)
                return (
                  <label key={acc.id} onClick={() => toggle(acc.id)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer border transition-all ${isSelected ? 'bg-accent-red/10 border-accent-red/25' : 'bg-transparent border-transparent hover:bg-white/4'
                      }`}>
                    {/* Checkbox */}
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-accent-red border-accent-red' : 'border-white/30'
                      }`}>
                      {isSelected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" /></svg>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{acc.email || acc.phone}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StatusBadge status={acc.status} />
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

// ─────────────────────────────────────────────────────────────────────────────
// ImageUploader — polished drag-zone upload component
// ─────────────────────────────────────────────────────────────────────────────
export function ImageUploader({ imagePaths = [], onChange, required = false, maxFiles = 10 }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const upload = async (files) => {
    if (!files.length) return
    if (imagePaths.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} images allowed.`)
      return
    }
    setError('')
    setUploading(true)
    try {
      const form = new FormData()
      files.forEach((f) => form.append('files', f))
      const res = await fetch(
        (localStorage.getItem('fb_base_url') || 'http://localhost:8000') + '/api/automation/upload-images',
        { method: 'POST', body: form }
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || `Upload failed (${res.status})`)
      }
      const { paths } = await res.json()
      onChange([...imagePaths, ...paths])
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleInput = async (e) => {
    const files = Array.from(e.target.files || [])
    await upload(files)
    e.target.value = ''
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
    await upload(files)
  }

  const remove = (idx) => onChange(imagePaths.filter((_, i) => i !== idx))
  const isEmpty = required && imagePaths.length === 0

  return (
    <div className="space-y-3">
      <label
        className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 cursor-pointer transition-all duration-200
          ${dragOver ? 'border-emerald-400/70 bg-emerald-500/8 scale-[1.01]' : isEmpty ? 'border-red-500/50 bg-red-500/4' : 'border-white/15 bg-white/3 hover:border-white/30 hover:bg-white/6'}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <svg className="animate-spin h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Uploading…
          </div>
        ) : (
          <>
            <div className="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center text-xl">🖼️</div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-300">
                {dragOver ? 'Drop images here' : 'Click or drag images here'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">JPG, PNG, WEBP — max 15 MB each · {imagePaths.length}/{maxFiles}</p>
            </div>
          </>
        )}
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden"
          disabled={uploading || imagePaths.length >= maxFiles} onChange={handleInput} />
      </label>

      {isEmpty && !uploading && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <span>⚠</span> At least one product image is required.
        </p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}

      {imagePaths.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {imagePaths.map((p, idx) => {
            const name = p.split(/[\\/]/).pop()
            return (
              <div key={idx}
                className="group flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 pl-2.5 pr-1.5 py-1 text-xs text-slate-300 hover:border-white/20 transition-colors">
                <span className="text-emerald-400">✓</span>
                <span className="max-w-[110px] truncate" title={p}>{name}</span>
                <button type="button" onClick={() => remove(idx)}
                  className="text-slate-600 hover:text-red-400 transition-colors ml-0.5 text-[10px]">✕</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// useAutomationTask hook — taskId persists in Zustand store, survives tab switches
// ─────────────────────────────────────────────────────────────────────────────
export function useAutomationTask(pageKey = '') {
  const setRunningTask    = useAppStore((s) => s.setRunningTask)
  const runningTasks      = useAppStore((s) => s.runningTasks)
  const pageSessions      = useAppStore((s) => s.pageSessions)
  const setPageSession    = useAppStore((s) => s.setPageSession)

  const [statusMessage, setStatusMessage] = useState('')
  const [busy, setBusy]   = useState(false)
  const [polling, setPolling] = useState(false)

  // taskId stored in pageSessions so it survives tab switches
  const sessionKey = `task_${pageKey || 'default'}`
  const taskId = pageSessions[sessionKey]?.taskId || null
  const task   = taskId ? (runningTasks[taskId] || null) : null

  const setTaskId = useCallback((id) => {
    if (id) setPageSession(sessionKey, { taskId: id })
    else setPageSession(sessionKey, { taskId: null })
  }, [sessionKey, setPageSession])

  // Polling — runs whenever taskId changes (also on tab return)
  useEffect(() => {
    if (!taskId) return
    if (['completed','failed','cancelled'].includes(runningTasks[taskId]?.status)) return
    let cancelled = false
    setPolling(true)
    const poll = async () => {
      try {
        const data = await api.getTask(taskId)
        if (cancelled) return
        setRunningTask(taskId, data)
        if (['running', 'pending', 'queued'].includes(data.status)) {
          setTimeout(poll, 2500)
        } else {
          setPolling(false)
          if (data.status === 'completed') {
            setStatusMessage(`Completed — ${data.completed_steps || 0}/${data.total_steps || 0} steps done.`)
          } else if (data.status === 'failed') {
            setStatusMessage(`Failed: ${data.error || 'Unknown error'}`)
          } else if (data.status === 'cancelled') {
            setStatusMessage('Task cancelled.')
          }
        }
      } catch {
        if (!cancelled) { setPolling(false); setStatusMessage('Unable to fetch task status.') }
      }
    }
    poll()
    return () => { cancelled = true }
  }, [taskId]) // eslint-disable-line react-hooks/exhaustive-deps

  const runTask = useCallback(async (route, payload = {}) => {
    setBusy(true); setStatusMessage(''); setTaskId(null)
    try {
      const data = await api.startAutomation(route, payload)
      if (data.task_id) {
        setTaskId(data.task_id)
        setRunningTask(data.task_id, { status: 'running', progress: 0, completed_steps: 0, total_steps: 0 })
        setStatusMessage(data.message || 'Task started')
      } else {
        setStatusMessage(data.message || JSON.stringify(data))
      }
      return data
    } catch (err) {
      const detail = err?.response?.data?.detail
      if (detail) console.error('[runTask] validation error:', detail)
      const msg = Array.isArray(detail)
        ? detail.map((e) => e.msg || JSON.stringify(e)).join('; ')
        : (typeof detail === 'string' ? detail : null) || err.message || 'Request failed'
      setStatusMessage(msg)
      throw err
    } finally { setBusy(false) }
  }, [setTaskId, setRunningTask])

  const cancelTask = useCallback(async () => {
    if (!taskId) return
    try { await api.cancelTask(taskId); setStatusMessage('Cancellation requested.') }
    catch { setStatusMessage('Failed to cancel.') }
  }, [taskId])

  const reset = useCallback(() => {
    setStatusMessage(''); setBusy(false); setTaskId(null); setPolling(false)
  }, [setTaskId])

  return { statusMessage, busy, task, taskId, polling, runTask, cancelTask, reset, setStatusMessage }
}

// ─────────────────────────────────────────────────────────────────────────────
// TaskProgressView — inline progress card with logs
// ─────────────────────────────────────────────────────────────────────────────
export function TaskProgressView({ task, busy, onCancel }) {
  const [logs, setLogs] = useState([])
  const [showLogs, setShowLogs] = useState(false)
  const [loadingLogs, setLoadingLogs] = useState(false)

  const fetchLogs = useCallback(async (taskId) => {
    setLoadingLogs(true)
    try {
      const data = await api.getTaskLogs(taskId, 50)
      setLogs(data)
    } catch {
      setLogs([])
    } finally {
      setLoadingLogs(false)
    }
  }, [])

  useEffect(() => {
    if (showLogs && task?.id) fetchLogs(task.id)
  }, [showLogs, task?.id, fetchLogs])

  // Auto-fetch logs when task fails
  useEffect(() => {
    if (task?.status === 'failed' && task?.id) fetchLogs(task.id)
  }, [task?.status, task?.id, fetchLogs])

  if (busy && !task) {
    return (
      <div className="rounded-xl border border-white/8 bg-white/3 p-4 flex items-center gap-3 text-sm text-slate-400">
        <svg className="animate-spin h-4 w-4 text-accent-red shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Starting task…
      </div>
    )
  }
  if (!task) return null

  const statusStyle = {
    completed: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    failed: 'text-red-400 bg-red-400/10 border-red-400/20',
    cancelled: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    running: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    pending: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
    queued: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
  }
  const barColor = task.status === 'completed' ? 'bg-emerald-400' : task.status === 'failed' ? 'bg-red-400' : 'bg-blue-400'
  const failedLogs = logs.filter(l => l.status === 'failed')

  return (
    <div className="rounded-xl border border-white/8 bg-white/3 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Task Progress</span>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusStyle[task.status] || statusStyle.pending}`}>
          {task.status}
        </span>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-500">
          <span>{task.completed_steps || 0} / {task.total_steps || 0} steps</span>
          <span>{task.progress || 0}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${task.progress || 0}%` }} />
        </div>
      </div>

      {task.error && (
        <div className="rounded-lg bg-red-500/8 border border-red-500/20 px-3 py-2 text-xs text-red-300 leading-relaxed">
          {task.error}
        </div>
      )}

      {task.result && (
        <div className="rounded-lg bg-white/4 border border-white/8 px-3 py-2 text-xs text-slate-400">
          {Object.entries(task.result).map(([k, v]) => (
            <span key={k} className="mr-3"><span className="text-slate-500">{k}:</span> <span className="text-slate-200 font-medium">{String(v)}</span></span>
          ))}
        </div>
      )}

      {/* Logs section — auto-shown on failure */}
      {(task.status === 'failed' || showLogs) && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
              Task Logs {logs.length > 0 && `(${logs.length})`}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => task?.id && fetchLogs(task.id)}
                className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
              >
                {loadingLogs ? '…' : '↺ Refresh'}
              </button>
              {task.status !== 'failed' && (
                <button
                  type="button"
                  onClick={() => setShowLogs(false)}
                  className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Hide
                </button>
              )}
            </div>
          </div>

          {loadingLogs && logs.length === 0 ? (
            <p className="text-[11px] text-slate-600">Loading logs…</p>
          ) : logs.length === 0 ? (
            <p className="text-[11px] text-slate-600">No logs yet.</p>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1 -mx-1 px-1">
              {/* Show failed logs first, then all */}
              {(failedLogs.length > 0 ? failedLogs : logs).map((log) => (
                <div
                  key={log.id}
                  className={`rounded-lg px-3 py-2 text-[11px] leading-relaxed border ${log.status === 'failed'
                    ? 'bg-red-500/8 border-red-500/20 text-red-300'
                    : 'bg-white/3 border-white/5 text-slate-400'
                    }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="font-semibold text-slate-300">{log.action}</span>
                    <span className={`text-[10px] ${log.status === 'failed' ? 'text-red-400' : 'text-emerald-400'}`}>
                      {log.status}
                    </span>
                  </div>
                  {log.error && (
                    <p className="text-red-300/80 break-words">{log.error}</p>
                  )}
                  {log.details && Object.keys(log.details).length > 0 && (
                    <p className="text-slate-500 mt-0.5">
                      {Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {task.status === 'completed' && !showLogs && (
        <button
          type="button"
          onClick={() => setShowLogs(true)}
          className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
        >
          View logs
        </button>
      )}

      {['running', 'pending', 'queued'].includes(task.status) && onCancel && (
        <button type="button" className="btn-danger text-xs py-1.5 w-full justify-center" onClick={onCancel}>
          Cancel Task
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AccountTable — single-select radio list (ek waqt mein sirf ek account)
// ─────────────────────────────────────────────────────────────────────────────
export function AccountTable({ selectable = true, title = 'Facebook Accounts', onManage }) {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const selectedAccountIds = useAppStore((s) => s.selectedAccountIds)
  const setSelectedAccountIds = useAppStore((s) => s.setSelectedAccountIds)
  const setTab = useAppStore((s) => s.setActiveTab)

  const loadAccounts = useCallback(async () => {
    setError('')
    try {
      const data = await api.getAccounts()
      setAccounts(data)
      if (!selectedAccountIds.length && data.length) setSelectedAccountIds([data[0].id])
    } catch { setError('Unable to load accounts from backend.') }
    finally { setLoading(false) }
  }, [selectedAccountIds.length, setSelectedAccountIds])

  useEffect(() => { loadAccounts() }, [loadAccounts])

  // Radio behavior — sirf ek select hoga
  const select = (id) => setSelectedAccountIds([id])

  return (
    <SectionCard title={title} icon="👥">
      <div className="flex items-center justify-between -mt-1 mb-1">
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent-red/15 text-red-400 border border-accent-red/20">
          {selectedAccountIds.length > 0 ? '1 selected' : 'none selected'}
        </span>
        <button type="button" className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          onClick={onManage || (() => setTab('accounts'))}>Manage</button>
      </div>
      <div className="space-y-1 max-h-64 overflow-y-auto -mx-1 px-1">
        {loading ? <p className="text-sm text-slate-500 py-2">Loading…</p>
          : error ? <p className="text-sm text-amber-400 py-2">{error}</p>
            : accounts.length === 0 ? <p className="text-sm text-slate-500 py-2">No accounts found.</p>
              : accounts.map((acc) => {
                const isSelected = selectedAccountIds[0] === acc.id
                return (
                  <label key={acc.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all
                ${isSelected
                        ? 'bg-accent-red/10 border border-accent-red/30 shadow-sm shadow-red-900/20'
                        : 'hover:bg-white/4 border border-transparent'
                      }`}
                    onClick={() => selectable && select(acc.id)}
                  >
                    {selectable && (
                      /* Custom radio circle */
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'border-accent-red bg-accent-red' : 'border-white/30'
                        }`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{acc.email || acc.phone}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Warmup {acc.warmup_level ?? 0}%</div>
                    </div>
                    <StatusBadge status={acc.status} />
                  </label>
                )
              })}
      </div>
    </SectionCard>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ListingsTable
// ─────────────────────────────────────────────────────────────────────────────
export function ListingsTable({ title = 'Listings', selectable = false, selectedIds = [], onToggle }) {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const loadListings = useCallback(async () => {
    setError('')
    try {
      const data = await api.getListings({ limit: 50 })
      const map = new Map()
      const precedence = ['published', 'draft', 'expired', 'deleted']
      const score = (s) => {
        if (!s) return precedence.length
        const idx = precedence.indexOf(s)
        return idx === -1 ? precedence.length : idx
      }
        ; (data || []).forEach((item) => {
          if (!item?.id) return
          const id = String(item.id)
          const existing = map.get(id)
          if (!existing) { map.set(id, item); return }
          const exScore = score(existing.status)
          const newScore = score(item.status)
          if (newScore < exScore) {
            map.set(id, item)
          } else if (newScore === exScore) {
            const exTime = existing.updated_at ? new Date(existing.updated_at).getTime() : 0
            const newTime = item.updated_at ? new Date(item.updated_at).getTime() : 0
            if (newTime >= exTime) map.set(id, item)
          }
        })
      const uniqueListings = Array.from(map.values())
      setListings(uniqueListings)
    } catch {
      setError('Unable to load listings.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadListings() }, [loadListings])

  const handleDelete = async (id) => {
    setDeletingId(id)
    try { await api.deleteListing(id); await loadListings() }
    catch { setError('Failed to delete.') }
    finally { setDeletingId(null) }
  }

  // Radio behavior — sirf ek listing select
  const handleSelect = (id) => {
    if (onToggle) onToggle(id)
  }

  const statusColor = {
    published: 'text-emerald-400', active: 'text-emerald-400',
    draft: 'text-blue-400', deleted: 'text-red-400',
  }

  return (
    <SectionCard title={title} icon="📋">
      {loading ? <p className="text-sm text-slate-500">Loading listings…</p>
        : error ? <p className="text-sm text-amber-400">{error}</p>
          : listings.length === 0 ? <p className="text-sm text-slate-500">No listings found.</p>
            : <div className="space-y-1.5 max-h-72 overflow-y-auto -mx-1 px-1">
              {listings.map((item) => {
                const isSelected = selectedIds.includes(item.id)
                return (
                  <div key={item.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all border cursor-pointer
                  ${isSelected
                        ? 'bg-accent-red/10 border-accent-red/30'
                        : 'hover:bg-white/4 border-transparent hover:border-white/5'
                      }`}
                    onClick={() => selectable && handleSelect(item.id)}
                  >
                    {selectable && (
                      /* Custom radio circle */
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'border-accent-red bg-accent-red' : 'border-white/30'
                        }`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{item.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {item.price ? `$${(item.price / 100).toFixed(2)}` : 'No price'} · {item.category || 'No category'}
                      </div>
                    </div>
                    <span className={`text-[11px] font-semibold ${statusColor[item.status] || 'text-slate-400'}`}>
                      {item.status}
                    </span>
                    <button type="button" disabled={deletingId === item.id}
                      className="text-[11px] text-slate-600 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-400/10"
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id) }}>
                      {deletingId === item.id ? '…' : 'Delete'}
                    </button>
                  </div>
                )
              })}
            </div>
      }
    </SectionCard>
  )
}
