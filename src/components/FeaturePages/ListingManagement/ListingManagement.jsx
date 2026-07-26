import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '../../../store'
import api from '../../../utils/api'
import {
  SectionCard, Field, ConfigPanel,
  ImageUploader, AccountSelector,
  useAutomationTask, TaskProgressView,
} from '../shared/FeatureHelpers'
import Pagination from '../../shared/Pagination'

const PAGE_SIZE = 10

const FB_CATEGORIES = [
  'Vehicles', 'Property Rentals', 'Apparel', 'Classifieds', 'Electronics',
  'Entertainment', 'Family', 'Free Stuff', 'Garden & Outdoor', 'Hobbies',
  'Home Goods', 'Home Improvement Supplies', 'Home Sales', 'Musical Instruments',
  'Office Supplies', 'Pet Supplies', 'Sporting Goods', 'Toys & Games',
  'Buy and sell groups', 'Other',
]

const ACTION_MODES = [
  { id: 'view', label: 'View Only', icon: '👁️' },
  { id: 'renew', label: 'Renew Listings', icon: '🔄' },
  { id: 'relist', label: 'Relist Listings', icon: '♻️' },
  { id: 'delete-all', label: 'Delete All Listings', icon: '🗑️' },
  { id: 'delete-drafts', label: 'X Draft Delete', icon: '🗂️' },
]

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    published: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    draft: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    expired: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    deleted: 'bg-red-500/15 text-red-400 border-red-500/25',
    relisted: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border capitalize ${map[status] || 'bg-slate-500/15 text-slate-400 border-slate-500/25'}`}>
      {status || 'unknown'}
    </span>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color = 'text-white' }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 px-5 py-4 flex-1 min-w-[120px]">
      <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold">{label}</div>
      <div className={`text-3xl font-bold mt-1 ${color}`}>{value ?? '…'}</div>
    </div>
  )
}

// ── Delete confirm modal ──────────────────────────────────────────────────────
function DeleteModal({ listing, onConfirm, onCancel, deleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 rounded-2xl bg-[#1a1f35] border border-white/10 shadow-2xl p-6 space-y-4">
        <div className="text-2xl text-center">🗑️</div>
        <h3 className="text-lg font-bold text-white text-center">Delete Listing?</h3>
        <p className="text-sm text-slate-400 text-center">
          "<span className="text-white font-medium">{listing?.title || 'This listing'}</span>" will be permanently removed.
        </p>
        <div className="flex gap-3">
          <button type="button" disabled={deleting} onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-accent-red text-white font-bold text-sm hover:bg-red-500 disabled:opacity-50 transition-all">
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
          <button type="button" onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-white/8 border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/12 transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Action Panel ──────────────────────────────────────────────────────────────
function ActionPanel({ mode, onDone }) {
  const selectedAccountIds = useAppStore((s) => s.selectedAccountIds)
  const { statusMessage, busy, task, runTask, cancelTask } = useAutomationTask()

  // renew / relist
  const [listingIds, setListingIds] = useState('')
  const [maxCount, setMaxCount] = useState(10)
  const [delaySeconds, setDelaySeconds] = useState(10)
  // delete
  const [draftIds, setDraftIds] = useState('')
  const [maxDelete, setMaxDelete] = useState(50)
  const [statusFilter, setStatusFilter] = useState('')
  const [confirmInput, setConfirmInput] = useState('')

  const accountId = selectedAccountIds?.[0]
  const isDanger = ['delete-all', 'delete-drafts'].includes(mode)

  const canRun = (() => {
    if (!accountId) return false
    if (isDanger && confirmInput !== 'DELETE') return false
    return true
  })()

  const handleRun = async () => {
    if (!canRun || busy) return
    if (mode === 'renew') {
      await runTask('renew-listings', {
        account_id: accountId,
        listing_ids: listingIds.split(',').map((s) => s.trim()).filter(Boolean),
        max_renew: Math.min(200, Math.max(1, maxCount)),
        delay_seconds: Math.min(120, Math.max(2, delaySeconds)),
      })
    } else if (mode === 'relist') {
      await runTask('relist-listings', {
        account_id: accountId,
        listing_ids: listingIds.split(',').map((s) => s.trim()).filter(Boolean),
        max_relist: Math.min(200, Math.max(1, maxCount)),
        delay_seconds: Math.min(120, Math.max(2, delaySeconds)),
      })
    } else if (mode === 'delete-all') {
      await runTask('delete-all-listings', {
        account_id: accountId,
        status_filter: statusFilter || null,
        confirm: true,
      })
      onDone?.()
    } else if (mode === 'delete-drafts') {
      await runTask('draft-delete', {
        account_id: accountId,
        draft_ids: draftIds.split(',').map((s) => s.trim()).filter(Boolean),
        max_delete: Math.min(500, Math.max(1, maxDelete)),
        confirm: true,
      })
      onDone?.()
    }
  }

  return (
    <div className="space-y-4">
      <AccountSelector />

      {/* Renew / Relist config */}
      {['renew', 'relist'].includes(mode) && (
        <ConfigPanel title={mode === 'renew' ? 'Renew Settings' : 'Relist Settings'} icon={mode === 'renew' ? '🔄' : '♻️'}>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Listing IDs (comma separated)" hint="Leave empty for all">
                <input className="input" value={listingIds} onChange={(e) => setListingIds(e.target.value)} placeholder="Leave empty for all" />
              </Field>
            </div>
            <Field label={mode === 'renew' ? 'Max renew (1–200)' : 'Max relist (1–200)'}>
              <input className="input" type="number" min={1} max={200} value={maxCount} onChange={(e) => setMaxCount(Number(e.target.value))} />
            </Field>
            <Field label="Delay (sec)">
              <input className="input" type="number" min={2} max={120} value={delaySeconds} onChange={(e) => setDelaySeconds(Number(e.target.value))} />
            </Field>
          </div>
        </ConfigPanel>
      )}

      {/* Delete All config */}
      {mode === 'delete-all' && (
        <ConfigPanel title="Delete All Listings" icon="🗑️">
          <div className="space-y-3">
            <Field label="Status filter (optional)">
              <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="deleted">Deleted</option>
              </select>
            </Field>
            <Field label='Type "DELETE" to confirm'>
              <input className="input border-red-500/40" value={confirmInput} onChange={(e) => setConfirmInput(e.target.value)} placeholder="DELETE" />
            </Field>
            <div className="rounded-xl border border-red-500/25 bg-red-500/8 px-3 py-2 text-xs text-red-300">
              ⚠️ This action cannot be undone. All listings for the selected account will be deleted.
            </div>
          </div>
        </ConfigPanel>
      )}

      {/* Draft Delete config */}
      {mode === 'delete-drafts' && (
        <ConfigPanel title="X Draft Delete" icon="🗂️">
          <div className="space-y-3">
            <Field label="Draft IDs (comma separated)" hint="Leave empty to delete all drafts">
              <input className="input" value={draftIds} onChange={(e) => setDraftIds(e.target.value)} placeholder="Leave empty for all drafts" />
            </Field>
            <Field label="Max delete count (1–500)">
              <input className="input" type="number" min={1} max={500} value={maxDelete} onChange={(e) => setMaxDelete(Number(e.target.value))} />
            </Field>
            <Field label='Type "DELETE" to confirm'>
              <input className="input border-red-500/40" value={confirmInput} onChange={(e) => setConfirmInput(e.target.value)} placeholder="DELETE" />
            </Field>
            <div className="rounded-xl border border-red-500/25 bg-red-500/8 px-3 py-2 text-xs text-red-300">
              ⚠️ Use carefully. Removes selected drafts including failed or stuck ones.
            </div>
          </div>
        </ConfigPanel>
      )}

      {/* Run button */}
      <button type="button" disabled={busy || !canRun} onClick={handleRun}
        className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${isDanger
          ? 'bg-red-700/90 text-white hover:bg-red-700 border border-red-600/40 disabled:opacity-40'
          : 'bg-accent-red text-white hover:bg-red-500 shadow shadow-red-900/40 disabled:opacity-40'
          }`}>
        {busy
          ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Working…</>
          : ACTION_MODES.find((m) => m.id === mode)?.label || 'Run'
        }
      </button>

      {/* Status + progress */}
      <SectionCard title="Task Status" icon="📊">
        {statusMessage
          ? <p className="text-sm text-slate-300 leading-relaxed">{statusMessage}</p>
          : <p className="text-xs text-slate-600">No active task.</p>}
        <TaskProgressView task={task} busy={busy} onCancel={cancelTask} />
      </SectionCard>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ListingManagement() {
  const selectedAccountIds = useAppStore((s) => s.selectedAccountIds)
  const accountId = selectedAccountIds?.[0]
  const { task, runTask } = useAutomationTask()

  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [tabFilter, setTabFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [actionMode, setActionMode] = useState('view')
  const [showPanel, setShowPanel] = useState(false)
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, expired: 0 })
  // Independent Listing Management account filter (local state)
  const [managementAccountId, setManagementAccountId] = useState('') // '' == All Accounts
  const [verifiedAccounts, setVerifiedAccounts] = useState([])
  const [accountsLoading, setAccountsLoading] = useState(true)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const dedupeById = (items) => {
        const map = new Map()
        const precedence = ['published', 'draft', 'expired', 'deleted']
        const score = (s) => {
          if (!s) return precedence.length
          const idx = precedence.indexOf(s)
          return idx === -1 ? precedence.length : idx
        }
          ; (items || []).forEach((item) => {
            if (!item?.id) return
            const id = String(item.id)
            const existing = map.get(id)
            if (!existing) { map.set(id, item); return }
            const exScore = score(existing.status)
            const newScore = score(item.status)
            if (newScore < exScore) {
              map.set(id, item)
            } else if (newScore === exScore) {
              // prefer newer updated_at if present
              const exTime = existing.updated_at ? new Date(existing.updated_at).getTime() : 0
              const newTime = item.updated_at ? new Date(item.updated_at).getTime() : 0
              if (newTime >= exTime) map.set(id, item)
            }
          })
        return Array.from(map.values())
      }

      // Use local managementAccountId for listing management filtering (independent from global selected account)
      const baseParams = { limit: 500, ...(managementAccountId ? { account_id: managementAccountId } : {}) }
      const allForStats = dedupeById(await api.getListings(baseParams))
      setStats({
        total: allForStats.length,
        published: allForStats.filter((l) => l.status === 'published').length,
        draft: allForStats.filter((l) => l.status === 'draft').length,
        expired: allForStats.filter((l) => l.status === 'expired').length,
      })

      const listParams = { ...baseParams }
      if (tabFilter !== 'all') {
        listParams.status = tabFilter
      }
      let filtered = dedupeById(await api.getListings(listParams))

      // search
      if (search) filtered = filtered.filter((l) => l.title?.toLowerCase().includes(search.toLowerCase()))

      // sort
      filtered = [...filtered].sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at)
        if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at)
        if (sortBy === 'price-high') return (b.price || 0) - (a.price || 0)
        if (sortBy === 'price-low') return (a.price || 0) - (b.price || 0)
        return 0
      })
      setListings(filtered)
    } catch {
      setListings([])
    } finally {
      setLoading(false)
    }
  }, [managementAccountId, tabFilter, search, sortBy])

  useEffect(() => { loadAll() }, [loadAll])
  useEffect(() => { setPage(1) }, [tabFilter, search, sortBy, managementAccountId])

  // Load verified accounts for the local Account filter (only verified accounts shown)
  useEffect(() => {
    let mounted = true
    const load = async () => {
      setAccountsLoading(true)
      try {
        const data = await api.getAccounts()
        // verified accounts: cookies truthy; exclude unverified/deleted/invalid
        const verified = (data || []).filter((a) => a && a.cookies)
        if (!mounted) return
        setVerifiedAccounts(verified)
        // default to All Accounts (empty string) — do not override if user already selected one
        setAccountsLoading(false)
      } catch (e) {
        if (!mounted) return
        setVerifiedAccounts([])
        setAccountsLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (task?.status && ['completed', 'failed', 'cancelled'].includes(task.status)) {
      loadAll()
    }
  }, [task?.status, loadAll])

  const handleDelete = async () => {
    if (!deleteTarget) return
    const targetAccountId = deleteTarget.account_id || accountId
    if (!targetAccountId) return
    setDeleting(true)
    try {
      await runTask('delete-listing', {
        account_id: targetAccountId,
        listing_id: deleteTarget.id,
      })
      setDeleteTarget(null)
    } catch {
    } finally {
      setDeleting(false)
    }
  }

  const handlePublish = async (listing) => {
    const targetAccountId = listing?.account_id || accountId
    if (!targetAccountId) return
    try {
      await runTask('publish-listing', {
        account_id: targetAccountId,
        listing_id: listing.id,
        delay_seconds: 5,
      })
    } catch { }
  }

  const handleRenew = async (listing) => {
    const targetAccountId = listing?.account_id || accountId
    if (!targetAccountId) return
    try {
      await runTask('renew-listings', {
        account_id: targetAccountId,
        listing_ids: [listing.id],
        max_renew: 1,
        delay_seconds: 5,
      })
    } catch { }
  }

  const TABS = [
    { id: 'all', label: 'All Listings', count: stats.total },
    { id: 'published', label: 'Published', count: stats.published },
    { id: 'draft', label: 'Draft', count: stats.draft },
    { id: 'expired', label: 'Expired', count: stats.expired },
  ]

  const paginated = listings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-10 px-8 py-5 bg-surface border-b border-white/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Listing Management</h1>
            <p className="text-sm text-slate-400 mt-0.5">View, renew, relist and delete listings from one central place.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={loadAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/8 border border-white/10 text-sm text-slate-300 hover:bg-white/12 transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button type="button" onClick={() => setShowPanel(!showPanel)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${showPanel ? 'bg-accent-red text-white shadow shadow-red-900/40' : 'bg-white/8 border border-white/10 text-slate-300 hover:bg-white/12'
                }`}>
              ⚡ Actions
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-5 space-y-5">
        {/* Stats */}
        <div className="flex gap-3 flex-wrap">
          <StatCard label="Total Listings" value={stats.total} />
          <StatCard label="Published" value={stats.published} color="text-emerald-400" />
          <StatCard label="Draft" value={stats.draft} color="text-blue-400" />
          <StatCard label="Expired" value={stats.expired} color="text-amber-400" />
        </div>

        {/* Action panel */}
        {showPanel && (
          <div className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-4">
            {/* Mode buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">Action:</span>
              {ACTION_MODES.map((m) => (
                <button key={m.id} type="button" onClick={() => setActionMode(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${actionMode === m.id
                    ? 'bg-accent-red text-white shadow shadow-red-900/30'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/8'
                    }`}>
                  {m.icon} {m.label}
                </button>
              ))}
            </div>

            {actionMode !== 'view' && (
              <div className="pt-3 border-t border-white/5">
                <div className="max-w-md">
                  <ActionPanel mode={actionMode} onDone={() => { loadAll(); setShowPanel(false) }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tabs + search + sort */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
            {TABS.map((t) => (
              <button key={t.id} type="button" onClick={() => setTabFilter(t.id)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tabFilter === t.id ? 'bg-accent-red text-white shadow shadow-red-900/30' : 'text-slate-400 hover:text-white'
                  }`}>
                {t.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tabFilter === t.id ? 'bg-white/20 text-white' : 'bg-white/8 text-slate-500'
                  }`}>{t.count}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input className="input pl-9 w-48 py-1.5 text-sm" placeholder="Search by title…"
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
            </div>
            <select className="input py-1.5 text-sm w-auto" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="price-high">Price: High</option>
              <option value="price-low">Price: Low</option>
            </select>
          </div>
        </div>

        {/* Account filter (local to Listing Management) */}
        <div className="flex items-center justify-start gap-3">
          <div className="text-sm text-slate-400">Account</div>
          <div>
            <select
              className="input text-sm"
              value={managementAccountId || ''}
              onChange={(e) => setManagementAccountId(e.target.value)}
            >
              <option value="">All Accounts</option>
              {accountsLoading ? (
                <option disabled>Loading…</option>
              ) : (
                verifiedAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.email || acc.phone || acc.id.slice(0, 8)}</option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
          {loading ? (
            <div className="flex items-center gap-3 px-6 py-10 text-sm text-slate-400">
              <svg className="animate-spin h-4 w-4 text-accent-red shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Loading listings…
            </div>
          ) : listings.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-slate-400 text-sm">No listings found.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-white/5 bg-white/2">
                      <th className="px-4 py-3">Image</th>
                      <th className="px-4 py-3">Listing Title</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Last Updated</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginated.map((listing) => (
                      <tr key={listing.id} className="hover:bg-white/3 transition-colors">
                        <td className="px-4 py-3">
                          {listing.images?.[0]
                            ? <img src={listing.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover bg-white/8" onError={(e) => { e.target.style.display = 'none' }} />
                            : <div className="w-10 h-10 rounded-lg bg-white/8 flex items-center justify-center text-slate-600">📷</div>
                          }
                        </td>
                        <td className="px-4 py-3 max-w-[220px]">
                          <p className="text-white font-medium truncate" title={listing.title}>{listing.title || 'Untitled'}</p>
                          {listing.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">{listing.description.slice(0, 60)}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                          {listing.price ? `$${(listing.price / 100).toFixed(2)}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{listing.category || '—'}</td>
                        <td className="px-4 py-3"><StatusBadge status={listing.status} /></td>
                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                          {listing.updated_at ? new Date(listing.updated_at).toLocaleString() : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5 flex-wrap">
                            {listing.status === 'draft' && (
                              <button type="button" onClick={() => handlePublish(listing)}
                                className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-all font-semibold">
                                Publish
                              </button>
                            )}
                            {listing.status === 'expired' && (
                              <button type="button" onClick={() => handleRenew(listing)}
                                className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/25 hover:bg-blue-500/25 transition-all font-semibold">
                                Renew
                              </button>
                            )}
                            <button type="button" onClick={() => setDeleteTarget(listing)}
                              className="text-xs px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all font-semibold">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} total={listings.length} pageSize={PAGE_SIZE} onChange={setPage} />
            </>
          )}
        </div>
      </div>

      {deleteTarget && (
        <DeleteModal
          listing={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </div>
  )
}
