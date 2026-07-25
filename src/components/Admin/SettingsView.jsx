import React, { useRef, useState } from 'react'
import { useAppStore } from '../../store'
import api, { setBaseUrl, getBaseUrl, clearToken } from '../../utils/api'

// ── Auth Modal ────────────────────────────────────────────────────────────────
function AuthModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const overlayRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) { setError('Email and password are required'); return }
    setError(''); setSuccessMsg(''); setLoading(true)
    try {
      if (mode === 'login') {
        const data = await api.login(email, password)
        onSuccess({ email: data.email, userId: data.user_id })
      } else {
        await api.signup(email, password)
        setSuccessMsg('Account created! Signing you in…')
        await new Promise((r) => setTimeout(r, 700))
        const data = await api.login(email, password)
        onSuccess({ email: data.email, userId: data.user_id })
      }
    } catch (err) {
      setError(err?.response?.data?.detail || (mode === 'login' ? 'Invalid email or password.' : 'Signup failed. Try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="w-full max-w-md mx-6 rounded-2xl bg-[#1a1f35] border border-white/10 shadow-2xl shadow-black/70 overflow-hidden">

        {/* Header */}
        <div className="px-7 pt-7 pb-5 border-b border-white/5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-accent-red flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">FB Automation</span>
              </div>
              <h2 className="text-xl font-bold text-white">
                {mode === 'login' ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                {mode === 'login' ? 'Sign in to your automation suite' : 'Get started in seconds'}
              </p>
            </div>
            <button type="button" onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-white/10 hover:text-white transition-colors mt-0.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Toggle */}
          <div className="mt-5 flex gap-1 p-1 bg-white/5 rounded-xl">
            {[['login','Sign In'],['signup','Sign Up']].map(([m, label]) => (
              <button key={m} type="button"
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  mode === m ? 'bg-accent-red text-white shadow shadow-red-900/50' : 'text-slate-400 hover:text-white'
                }`}
                onClick={() => { setMode(m); setError(''); setSuccessMsg('') }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 flex items-center gap-2">
              <span>⚠</span><span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 flex items-center gap-2">
              <span>✓</span><span>{successMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email address</label>
            <input className="input" type="email" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} autoFocus autoComplete="email" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
            <div className="flex gap-2">
              <input className="input flex-1" type={showPass ? 'text' : 'password'}
                placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="px-3 rounded-lg border border-white/10 bg-white/5 text-xs text-slate-400 hover:text-white transition-colors shrink-0">
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 mt-1 rounded-xl bg-accent-red text-white font-bold text-sm
                       hover:bg-red-500 transition-all shadow-lg shadow-red-900/40
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading
              ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>{mode === 'login' ? 'Signing in…' : 'Creating…'}</>
              : mode === 'login' ? 'Sign In →' : 'Create Account →'
            }
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Settings View ─────────────────────────────────────────────────────────────
export default function SettingsView() {
  const settings = useAppStore((s) => s.settings)
  const setSettings = useAppStore((s) => s.setSettings)
  const auth = useAppStore((s) => s.auth)
  const setAuth = useAppStore((s) => s.setAuth)

  const [baseUrl, setBaseUrlValue] = useState(getBaseUrl())
  const [saveState, setSaveState] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  const update = (key, value) => setSettings({ ...settings, [key]: value })

  const saveBaseUrl = () => {
    const nextUrl = setBaseUrl(baseUrl)
    update('backendUrl', nextUrl)
    setSaveState('Saved ✓')
    setTimeout(() => setSaveState(''), 2000)
  }

  const handleAuthSuccess = (user) => {
    setAuth({ user, loading: false, error: null })
    setShowAuthModal(false)
  }

  const handleLogout = async () => {
    setAuthLoading(true)
    try { await api.logout() } catch { /* ignore */ }
    clearToken()
    setAuth({ user: null, loading: false, error: null })
    setAuthLoading(false)
  }

  const user = auth?.user

  return (
    <div className="h-full overflow-y-auto relative">

      {/* ── Page Header with Sign In button ── */}
      <div className="sticky top-0 z-10 px-8 py-5 bg-surface border-b border-white/5 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-slate-400 mt-0.5">System preferences and account management</p>
        </div>

        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5 border border-white/8">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-red to-red-700
                              flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user.email?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-white leading-tight truncate max-w-[150px]">{user.email}</div>
                <div className="text-[10px] text-emerald-400">● Signed in</div>
              </div>
            </div>
            <button type="button" disabled={authLoading} onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl
                         bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold
                         hover:bg-red-500/20 transition-all disabled:opacity-50 whitespace-nowrap">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {authLoading ? 'Signing out…' : 'Sign Out'}
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                       bg-accent-red text-white font-bold text-sm
                       hover:bg-red-500 transition-all shadow-lg shadow-red-900/30 whitespace-nowrap">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Sign In / Sign Up
          </button>
        )}
      </div>

      {/* ── Content ── */}
      <div className="px-8 py-6 space-y-6">

        {/* API Connection */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">API Connection</h3>
              <p className="text-xs text-slate-500">Backend server URL</p>
            </div>
          </div>
          <div className="flex gap-3">
            <input className="input flex-1" value={baseUrl}
              onChange={(e) => setBaseUrlValue(e.target.value)}
              placeholder="http://localhost:8000" />
            <button type="button" className="btn-primary shrink-0" onClick={saveBaseUrl}>Save</button>
          </div>
          {saveState && <p className="text-sm text-emerald-400 font-medium">{saveState}</p>}
        </div>

        {/* Automation Settings */}
        <div className="card space-y-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Automation Settings</h3>
              <p className="text-xs text-slate-500">Delay and safety defaults</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <label className="block space-y-1.5">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Delay Min (sec)</span>
              <input className="input" type="number"
                value={settings.defaultDelayMin}
                onChange={(e) => update('defaultDelayMin', Number(e.target.value))} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Delay Max (sec)</span>
              <input className="input" type="number"
                value={settings.defaultDelayMax}
                onChange={(e) => update('defaultDelayMax', Number(e.target.value))} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Max per Run</span>
              <input className="input" type="number" max={100}
                value={settings.maxListingsPerRun}
                onChange={(e) => update('maxListingsPerRun', Number(e.target.value))} />
            </label>
          </div>

          <div className="pt-2 border-t border-white/5 space-y-3">
            <label className="flex items-center justify-between gap-4 cursor-pointer group">
              <div>
                <div className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">Safe mode</div>
                <div className="text-xs text-slate-500">Slower listings, lower ban risk</div>
              </div>
              <div className="relative shrink-0">
                <input type="checkbox" className="sr-only peer" checked={settings.safeMode}
                  onChange={(e) => update('safeMode', e.target.checked)} />
                <div className="w-10 h-5 rounded-full bg-white/10 peer-checked:bg-accent-red transition-colors cursor-pointer"
                  onClick={() => update('safeMode', !settings.safeMode)} />
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${settings.safeMode ? 'translate-x-5' : ''}`}
                  onClick={() => update('safeMode', !settings.safeMode)} />
              </div>
            </label>
            <label className="flex items-center justify-between gap-4 cursor-pointer group">
              <div>
                <div className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">Auto-retry failed jobs</div>
                <div className="text-xs text-slate-500">Automatically retry on errors</div>
              </div>
              <div className="relative shrink-0">
                <input type="checkbox" className="sr-only peer" checked={settings.autoRetry}
                  onChange={(e) => update('autoRetry', e.target.checked)} />
                <div className="w-10 h-5 rounded-full bg-white/10 peer-checked:bg-accent-red transition-colors cursor-pointer"
                  onClick={() => update('autoRetry', !settings.autoRetry)} />
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${settings.autoRetry ? 'translate-x-5' : ''}`}
                  onClick={() => update('autoRetry', !settings.autoRetry)} />
              </div>
            </label>
          </div>
        </div>

      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  )
}
