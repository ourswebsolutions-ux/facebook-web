import React, { useRef, useState } from 'react'
import api from '../utils/api'
import { useAppStore } from '../store'

export default function LoginPage({ onLoginSuccess }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const setAuth = useAppStore((s) => s.setAuth)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required')
      return
    }
    setError('')
    setSuccessMsg('')
    setNeedsConfirmation(false)
    setLoading(true)
    try {
      if (mode === 'login') {
        const data = await api.login(email, password)
        setAuth({ user: { email: data.email, userId: data.user_id }, loading: false, error: null })
        onLoginSuccess()
      } else {
        const signupData = await api.signup(email, password)
        if (signupData.needs_confirmation) {
          // Email confirmation required — show info, don't auto-login
          setNeedsConfirmation(true)
          setSuccessMsg(signupData.message)
          setMode('login')
        } else {
          // No confirmation needed — auto login
          setSuccessMsg('Account created! Signing you in…')
          await new Promise((r) => setTimeout(r, 600))
          const data = await api.login(email, password)
          setAuth({ user: { email: data.email, userId: data.user_id }, loading: false, error: null })
          onLoginSuccess()
        }
      }
    } catch (err) {
      const detail = err?.response?.data?.detail || ''
      if (detail.startsWith('EMAIL_NOT_CONFIRMED:')) {
        setNeedsConfirmation(true)
        setError('') 
        setSuccessMsg(detail.replace('EMAIL_NOT_CONFIRMED: ', ''))
      } else {
        setError(
          detail ||
          (mode === 'login' ? 'Invalid email or password.' : 'Signup failed. Try again.')
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#0d1117]">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-red-900/20 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md mx-6">
        {/* Logo / brand */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-red shadow-lg shadow-red-900/50 mb-4">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">FB Automation</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to your workspace</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-[#0f0f0f] border border-white/8 shadow-2xl shadow-black/60 overflow-hidden">
          {/* Tab toggle */}
          <div className="flex gap-1 p-3 border-b border-white/5 bg-[#0a0a0a]">
            {[['login', 'Sign In'], ['signup', 'Sign Up']].map(([m, label]) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(''); setSuccessMsg(''); setNeedsConfirmation(false) }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  mode === m
                    ? 'bg-accent-red text-white shadow shadow-red-900/50'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-7 py-7 space-y-5">
            {/* Error / success banners */}
            {error && (
              <div className="flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            {needsConfirmation && (
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-4 text-sm text-blue-200 space-y-1">
                <div className="flex items-center gap-2 font-semibold text-blue-300">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  Check your email
                </div>
                <p className="text-blue-300/80 text-xs leading-relaxed">
                  A confirmation link was sent to <span className="font-semibold text-blue-200">{email}</span>.
                  Click that link, then come back here and sign in.
                </p>
              </div>
            )}
            {!needsConfirmation && successMsg && (
              <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{successMsg}</span>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                Email address
              </label>
              <input
                className="input w-full"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                autoComplete="email"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                Password
              </label>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="shrink-0 px-3 rounded-lg border border-white/10 bg-white/5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-1 rounded-xl bg-accent-red text-white font-bold text-sm
                         hover:bg-red-500 active:scale-[0.98] transition-all
                         shadow-lg shadow-red-900/40
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                </>
              ) : (
                mode === 'login' ? 'Sign In →' : 'Create Account →'
              )}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-slate-600">
          Your session is stored locally and never shared.
        </p>
      </div>
    </div>
  )
}
