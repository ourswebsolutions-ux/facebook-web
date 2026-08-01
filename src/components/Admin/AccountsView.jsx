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
        <div key={t.id} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl max-w-sm ${t.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
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
  const [activeTab, setActiveTab] = useState('email') // 'email' | 'phone'
  const [email, setEmail] = useState(initial?.email || '')
  const [phone, setPhone] = useState(initial?.phone || '')
  const [sessionText, setSessionText] = useState('')
  const [sessionData, setSessionData] = useState('')
  const [sessionError, setSessionError] = useState('')
  const [sessionStatus, setSessionStatus] = useState('')
  const [verifyingSession, setVerifyingSession] = useState(false)
  const [error, setError] = useState('')
  const overlayRef = useRef(null)

  const canVerifySession = Boolean(sessionText.trim() && !verifyingSession)

  const validateSessionPayload = (value) => {
    if (!value || !value.trim()) throw new Error('Session JSON is required')

    const trimmed = value.trim()

    // ── Semicolon-separated format: name=value; name2=value2 ──
    // Detect if it looks like cookie header string (not JSON)
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
      const pairs = trimmed.split(';').map(p => p.trim()).filter(Boolean)
      const cookies = pairs.map(pair => {
        const eqIdx = pair.indexOf('=')
        if (eqIdx === -1) return null
        return {
          name: pair.slice(0, eqIdx).trim(),
          value: pair.slice(eqIdx + 1).trim(),
          domain: '.facebook.com',
          path: '/',
          httpOnly: false,
          secure: true,
          sameSite: 'None',
        }
      }).filter(Boolean)

      if (cookies.length === 0) throw new Error('No valid cookies found in semicolon-separated input.')
      return { cookies }
    }

    // ── JSON format ──
    let parsed
    try {
      parsed = JSON.parse(trimmed)
    } catch {
      throw new Error('Invalid JSON. Paste a valid Playwright storageState or cookies JSON.')
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Session payload must be a JSON object or an array of cookies.')
    }

    const normalized = Array.isArray(parsed)
      ? { cookies: parsed }
      : parsed

    const hasCookies = Array.isArray(normalized.cookies) && normalized.cookies.length > 0
    const hasOrigins = Array.isArray(normalized.origins) && normalized.origins.length > 0
    const nestedBrowserCookies = normalized.browserSession && Array.isArray(normalized.browserSession.cookies) && normalized.browserSession.cookies.length > 0

    if (!hasCookies && !hasOrigins && !nestedBrowserCookies) {
      throw new Error('Required session data is missing. Expected cookies or origins.')
    }

    return normalized
  }

  const handleSessionTextChange = (e) => {
    const value = e.target.value
    setSessionText(value)
    setSessionStatus('')
    setSessionError('')
    setSessionData('')
  }

  const verifySession = async () => {
    if (!sessionText.trim()) {
      setSessionError('Paste session JSON first')
      return
    }

    let normalized
    try {
      normalized = validateSessionPayload(sessionText)
      setSessionData(JSON.stringify(normalized))
    } catch (err) {
      setSessionError(err.message)
      return
    }

    const normalizedEmail = email.trim()

    const formData = new FormData()
    const blob = new Blob([JSON.stringify(normalized)], { type: 'application/json' })
    formData.append('session_file', blob, 'session.json')
    formData.append('session_data', JSON.stringify(normalized))
    formData.append('account_name', normalizedEmail || 'Facebook Account')
    formData.append('email', normalizedEmail)

    setVerifyingSession(true)
    setSessionError('')

    try {
      const response = await api.verifySession(formData)

      if (response?.valid || response?.verified) {
        setSessionStatus('verified')
        setSessionError('')
        setError('')
      } else {
        setSessionStatus('error')
        setSessionError(response?.message || 'Session verification failed')
      }
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.message || 'Session verification failed'
      setSessionStatus('error')
      setSessionError(detail)
    } finally {
      setVerifyingSession(false)
    }
  }

  const submit = async () => {
    const normalizedEmail = email.trim()
    const normalizedPhone = phone.trim().replace(/\D/g, '')

    if (activeTab === 'email' && !normalizedEmail) {
      setError('Email is required')
      return
    }
    if (activeTab === 'phone' && !normalizedPhone) {
      setError('Phone number is required')
      return
    }

    if (!initial && (!sessionData || sessionStatus !== 'verified')) {
      setError('Verify the session JSON before saving')
      return
    }

    setError('')
    const payload = activeTab === 'email'
      ? { email: normalizedEmail }
      : { email: '', phone: normalizedPhone }
    if (initial?.id) payload.status = initial.status
    try {
      payload.session_data = JSON.parse(sessionData)
    } catch {
      setError('Session JSON could not be parsed')
      return
    }
    await onSave(payload)
  }

  return (
    <div ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="w-full max-w-lg mx-4 rounded-2xl bg-[#0f0f0f] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
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
        <div className="px-7 py-5 space-y-4 overflow-y-auto">
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

          {/* Email / Phone tabs */}
          <div className="flex rounded-xl bg-white/5 border border-white/10 p-1 gap-1">
            <button type="button"
              onClick={() => setActiveTab('email')}
              className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'email' ? 'bg-accent-red text-white' : 'text-slate-400 hover:text-white'}`}>
              Email
            </button>
            <button type="button"
              onClick={() => setActiveTab('phone')}
              className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'phone' ? 'bg-accent-red text-white' : 'text-slate-400 hover:text-white'}`}>
              Phone Number
            </button>
          </div>

          {activeTab === 'email' ? (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email</label>
              <input
                className="input"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phone Number</label>
              <input
                className="input"
                type="tel"
                placeholder="e.g. 923001234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-slate-500">Enter with country code, no + or spaces</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Session JSON / Cookies</label>
            <textarea
              className="input w-full resize-none font-mono text-xs"
              rows={6}
              placeholder={'Paste your cookies here (JSON format)\n\nExample:\n[{"name":"c_user","value":"...","domain":".facebook.com",...}]\n\nOr Playwright storageState: {"cookies":[...],"origins":[...]}'}
              value={sessionText}
              onChange={handleSessionTextChange}
              spellCheck={false}
            />
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                verifySession()
              }}
              disabled={!canVerifySession}
              className="w-full rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50 cursor-pointer"
            >
              {verifyingSession ? 'Verifying…' : 'Verify Session'}
            </button>
            {sessionError && <p className="text-xs text-red-300">{sessionError}</p>}
            {sessionStatus === 'verified' && <p className="text-xs text-emerald-300">✓ Session Verified</p>}
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
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
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
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAccount, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [verifyingId, setVerifyingId] = useState(null)
  const [page, setPage] = useState(1)
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

  const openAdd = () => { setEditing(null); setShowModal(true) }
  const openEdit = (acc) => { setEditing(acc); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditing(null) }

  const handleSave = async (payload, options = {}) => {
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
    addToast('Checking the saved Facebook session…', 'warning', 200000)
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
    const idToDelete = deleteId
    setDeleteId(null)
    try {
      await api.deleteAccount(idToDelete)
      setAccounts((prev) => prev.filter((a) => a.id !== idToDelete))
      setPage(1)
      addToast('Account deleted.', 'success')
    } catch (err) {
      const status = err?.response?.status
      if (status === 404) {
        // Already gone — remove from UI silently
        setAccounts((prev) => prev.filter((a) => a.id !== idToDelete))
        setPage(1)
        addToast('Account deleted.', 'success')
      } else {
        addToast('Failed to delete.', 'error')
      }
    }
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
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
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
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
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
                              className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${acc.cookies
                                ? 'bg-white/8 text-slate-300 hover:bg-white/15 border border-white/10'
                                : 'bg-accent-red text-white hover:bg-red-500 shadow shadow-red-900/30'
                                }`}>
                              {verifyingId === acc.id ? (
                                <span className="flex items-center gap-1">
                                  <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
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
          <div className="w-full max-w-sm mx-4 rounded-2xl bg-[#0f0f0f] border border-white/10 shadow-2xl p-6 space-y-4">
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
