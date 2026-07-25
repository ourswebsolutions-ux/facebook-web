import React, { useEffect, useState, useCallback, useRef } from 'react'
import api from '../../utils/api'
import Pagination from '../shared/Pagination'

const PAGE_SIZE = 8

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toasts, onRemove }) {
  if (!toasts.length) return null
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl max-w-sm ${
          t.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
          : t.type === 'warning' ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
          : 'border-red-500/30 bg-red-500/10 text-red-200'
        }`}>
          <span className="flex-1">{t.message}</span>
          <button type="button" onClick={() => onRemove(t.id)} className="opacity-50 hover:opacity-100 shrink-0">✕</button>
        </div>
      ))}
    </div>
  )
}

function useToast() {
  const [toasts, setToasts] = useState([])
  const add = useCallback((message, type = 'error', duration = 5000) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration)
  }, [])
  const remove = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), [])
  return { toasts, add, remove }
}

// ── Account Form Modal ────────────────────────────────────────────────────────
function AccountFormModal({ initial, onSave, onClose, saving }) {
  const [loginType, setLoginType] = useState(initial?.phone ? 'phone' : 'email')
  const [email, setEmail]         = useState(initial?.email || '')
  const [phone, setPhone]         = useState(initial?.phone || '')
  const [password, setPassword]   = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [proxy, setProxy]         = useState(initial?.proxy || '')
  const [notes, setNotes]         = useState(initial?.notes || '')
  const [error, setError]         = useState('')
  const overlayRef                = useRef(null)

  const submit = async () => {
    if (loginType === 'email') {
      if (!email.trim()) { setError('Email is required'); return }
      if (!email.includes('@')) { setError('Enter a valid email'); return }
    } else {
      if (!phone.trim()) { setError('Phone is required'); return }
      if (!/^\+?[\d\s\-()]{7,}$/.test(phone.trim())) { setError('Enter a valid phone e.g. +923001234567'); return }
    }
    if (!initial && !password.trim()) { setError('Password is required'); return }
    if (password && password.length < 6) { setError('Password too short (min 6 chars)'); return }
    setError('')
    const payload = {
      email: loginType === 'email' ? email : null,
      phone: loginType === 'phone' ? phone : null,
      proxy: proxy || null,
      notes: notes || null,
    }
    if (password) payload.password = password
    if (initial?.id) payload.status = initial.status
    await onSave(payload)
  }

  return (
    <div ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="w-full max-w-lg mx-4 rounded-2xl bg-[#1a1f35] border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-7 pt-6 pb-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">{initial ? 'Edit Account' : 'Add New FB Account'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{initial ? 'Update account details' : 'Connect a Facebook account for automation'}</p>
          </div>
          <button type="button" onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Body */}
        <div className="px-7 py-5 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300 flex gap-2">
              <span>⚠</span><span>{error}</span>
            </div>
          )}
          {initial?.cookies && (
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
              ✓ Account is verified with saved cookies.
            </div>
          )}
          {!initial && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-2.5 text-xs text-amber-300">
              ⚠ Disable 2FA on Facebook before adding — or add 2fa secret in Notes.
            </div>
          )}

          {/* Login type toggle */}
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
            {[['email','Email'],['phone','Phone Number']].map(([t, label]) => (
              <button key={t} type="button"
                className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  loginType === t ? 'bg-accent-red text-white shadow shadow-red-900/40' : 'text-slate-400 hover:text-white'
                }`}
                onClick={() => setLoginType(t)}>{label}</button>
            ))}
          </div>

          {loginType === 'email' ? (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email</label>
              <input className="input" type="email" placeholder="fbuser@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phone Number</label>
              <input className="input" placeholder="+923001234567"
                value={phone} onChange={(e) => setPhone(e.target.value)} autoFocus />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Password {initial ? '(blank = keep current)' : ''}
            </label>
            <div className="flex gap-2">
              <input className="input flex-1" type={showPass ? 'text' : 'password'}
                placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="px-3 rounded-lg border border-white/10 bg-white/5 text-xs text-slate-400 hover:text-white shrink-0">
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Proxy (optional)</label>
              <input className="input" placeholder="ip:port:user:pass"
                value={proxy} onChange={(e) => setProxy(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Notes (optional)</label>
              <input className="input" placeholder="e.g. 2fa: SECRET"
                value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="px-7 py-4 border-t border-white/5 flex gap-3">
          <button type="button" onClick={submit} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-accent-red text-white font-bold text-sm
                       hover:bg-red-500 transition-all shadow shadow-red-900/40
                       disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? (
              <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>Verifying…</>
            ) : initial ? 'Save Changes' : 'Add Account'}
          </button>
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/8 border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/12 transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main View ─────────────────────────────────────────────────────────────────
export default function AccountsView() {
  const [accounts, setAccounts]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [showModal, setShowModal]     = useState(false)
  const [editingAccount, setEditing]  = useState(null)
  const [saving, setSaving]           = useState(false)
  const [deleteId, setDeleteId]       = useState(null)
  const [verifyingId, setVerifyingId] = useState(null)
  const [page, setPage]               = useState(1)
  const { toasts, add: addToast, remove: removeToast } = useToast()

  const loadAccounts = useCallback(async () => {
    try {
      const data = await api.getAccounts()
      setAccounts(data)
    } catch {
      addToast('Unable to load accounts. Check backend connection.', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => { loadAccounts() }, [loadAccounts])

  const openAdd  = () => { setEditing(null); setShowModal(true) }
  const openEdit = (acc) => { setEditing(acc); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditing(null) }

  const handleSave = async (payload) => {
    setSaving(true)
    try {
      if (editingAccount?.id) {
        const updated = await api.updateAccount(editingAccount.id, payload)
        if (updated) {
          setAccounts((prev) => prev.map((a) => a.id === editingAccount.id ? { ...a, ...updated } : a))
        }
        addToast('Account updated.', 'success')
      } else {
        const result = await api.createAccount(payload)
        if (result) {
          setAccounts((prev) => [result, ...prev.filter((a) => a.id !== result.id)])
        }
        if (result?.warning) {
          addToast(`Saved — ${result.warning}`, 'warning', 8000)
        } else {
          addToast('Account verified and saved!', 'success')
        }
      }
      closeModal()
      setPage(1)
      await loadAccounts()
    } catch (err) {
      const status = err?.response?.status
      const detail = err?.response?.data?.detail || ''
      if (status === 409) addToast(`Account already exists.`, 'warning')
      else addToast(detail || 'Failed to save. Try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleVerify = async (id) => {
    setVerifyingId(id)
    addToast('Opening browser — complete login/2FA if prompted…', 'warning', 200000)
    try {
      const result = await api.verifyAccount(id)
      addToast(result.message || 'Account verified!', 'success')
      setAccounts((prev) => prev.map((a) => a.id === id ? { ...a, cookies: true, status: 'active' } : a))
      await loadAccounts()
      setTimeout(() => loadAccounts(), 1500)
    } catch (err) {
      const status = err?.response?.status
      const detail = err?.response?.data?.detail || 'Verification failed'
      addToast(status === 408 ? 'Timed out — try again.' : detail, 'error')
      await loadAccounts()
    } finally {
      setVerifyingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await api.deleteAccount(deleteId)
      setDeleteId(null)
      addToast('Account deleted.', 'success')
      setPage(1)
      await loadAccounts()
    } catch { addToast('Failed to delete.', 'error') }
  }

  const statusBadge = (status) => {
    const map = { active: 'badge-green', idle: 'badge-blue', warming: 'badge-amber', banned: 'badge-red' }
    return <span className={map[status] || 'badge-amber'}>{status || 'unknown'}</span>
  }

  // Pagination slice
  const paginated = accounts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      <div className="space-y-6">

        {/* Page header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">FB Account Management</h1>
            <p className="text-sm text-slate-400 mt-1">Add, edit, and manage Facebook accounts for marketplace automation.</p>
          </div>
          <button type="button" className="btn-primary" onClick={openAdd}>
            + Add Account
          </button>
        </div>

        {/* Verifying overlay */}
        {saving && (
          <div className="rounded-xl border border-blue-500/25 bg-blue-500/8 p-4 text-sm text-blue-200 flex items-center gap-3">
            <svg className="animate-spin h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <div>
              <div className="font-semibold">Verifying Facebook account…</div>
              <div className="text-xs text-blue-300 mt-0.5">Browser is opening in background. This may take 20–40 seconds.</div>
            </div>
          </div>
        )}

        {/* Accounts table */}
        <div className="card overflow-hidden p-0">
          <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">
              Accounts
              {!loading && <span className="ml-2 text-xs font-medium text-slate-500 bg-white/8 px-2 py-0.5 rounded-full">{accounts.length}</span>}
            </h3>
          </div>

          {loading ? (
            <div className="px-5 py-8 flex items-center gap-3 text-sm text-slate-400">
              <svg className="animate-spin h-4 w-4 text-accent-red shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Loading accounts…
            </div>
          ) : accounts.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="text-4xl mb-3">👤</div>
              <p className="text-slate-400 text-sm">No accounts yet.</p>
              <button type="button" onClick={openAdd} className="mt-3 btn-primary text-sm">+ Add First Account</button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-white/5 bg-white/2">
                      <th className="px-5 py-3 font-semibold">Account</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Warmup</th>
                      <th className="px-4 py-3 font-semibold">Notes</th>
                      <th className="px-4 py-3 font-semibold">Last Used</th>
                      <th className="px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginated.map((acc) => (
                      <tr key={acc.id} className="hover:bg-white/3 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-red/40 to-red-900/60 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {(acc.email || acc.phone || '?')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-white font-medium truncate max-w-[180px]">
                                {acc.email || acc.phone}
                                {acc.phone && !acc.email && <span className="ml-1 text-slate-500">📱</span>}
                              </div>
                              {acc.cookies
                                ? <span className="text-[11px] text-emerald-400 font-medium">✓ verified</span>
                                : <span className="text-[11px] text-amber-400">⚠ unverified</span>
                              }
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">{statusBadge(acc.status)}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                              <div className="h-full rounded-full bg-accent-red transition-all" style={{ width: `${acc.warmup_level ?? 0}%` }} />
                            </div>
                            <span className="text-xs text-slate-400">{acc.warmup_level ?? 0}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-400 text-xs max-w-[160px] truncate">{acc.notes || '—'}</td>
                        <td className="px-4 py-3.5 text-slate-500 text-xs">
                          {acc.last_used_at ? new Date(acc.last_used_at).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-1.5 flex-wrap">
                            <button type="button" disabled={verifyingId === acc.id}
                              onClick={() => handleVerify(acc.id)}
                              className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${
                                acc.cookies
                                  ? 'bg-white/8 text-slate-300 hover:bg-white/15 border border-white/10'
                                  : 'bg-accent-red text-white hover:bg-red-500 shadow shadow-red-900/30'
                              }`}>
                              {verifyingId === acc.id ? (
                                <span className="flex items-center gap-1">
                                  <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                  </svg>Wait…
                                </span>
                              ) : acc.cookies ? 'Re-verify' : 'Verify'}
                            </button>
                            <button type="button" onClick={() => openEdit(acc)}
                              className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/8 transition-all">
                              Edit
                            </button>
                            <button type="button" onClick={() => setDeleteId(acc.id)}
                              className="text-xs px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} total={accounts.length} pageSize={PAGE_SIZE} onChange={setPage} />
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <AccountFormModal
          initial={editingAccount}
          onSave={handleSave}
          onClose={closeModal}
          saving={saving}
        />
      )}

      {/* Delete confirm modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm mx-4 rounded-2xl bg-[#1a1f35] border border-white/10 shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 flex items-center justify-center text-2xl mx-auto">🗑️</div>
            <h3 className="text-lg font-bold text-white text-center">Delete Account?</h3>
            <p className="text-sm text-slate-400 text-center">This permanently removes the account and all its data. This cannot be undone.</p>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-accent-red text-white font-bold text-sm hover:bg-red-500 transition-all">
                Delete
              </button>
              <button type="button" onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/8 border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/12 transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
