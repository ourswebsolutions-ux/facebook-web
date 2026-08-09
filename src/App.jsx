import React, { useEffect, useState, useCallback } from 'react'
import { useAppStore } from './store'
import { getFeature } from './config/features'
import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import GlobalTaskPoller from './components/GlobalTaskPoller'
import Dashboard from './components/Dashboard/Dashboard'
import ActivityView from './components/Admin/ActivityView'
import SettingsView from './components/Admin/SettingsView'
import InboxView from './components/Admin/InboxView'
import AccountsView from './components/Admin/AccountsView'
import FeaturePage from './components/FeaturePage'
import LoginPage from './components/LoginPage'
import api, { hasToken, clearToken } from './utils/api'

// ── Main app shell (shown only when logged in) ────────────────────────────────
function AppShell() {
  const activeTab = useAppStore((s) => s.activeTab)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  let content
  if (activeTab === 'dashboard')   content = <Dashboard />
  else if (activeTab === 'activity') content = <ActivityView />
  else if (activeTab === 'inbox')    content = <InboxView />
  else if (activeTab === 'settings') content = <SettingsView />
  else if (activeTab === 'accounts') content = <AccountsView />
  else content = <FeaturePage feature={getFeature(activeTab)} />

  return (
    <>
      <GlobalTaskPoller />
      <div className="flex flex-col h-screen bg-surface overflow-hidden">
        <TitleBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <div className="flex flex-1 min-h-0 relative">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 min-h-0 overflow-hidden bg-surface min-w-0">
            {content}
          </main>
        </div>
      </div>
    </>
  )
}

// ── Root component ────────────────────────────────────────────────────────────
export default function App() {
  // 'loading' → checking saved token on startup
  // 'login'   → not authenticated, show login page
  // 'app'     → authenticated, show main app
  const [appState, setAppState] = useState('loading')
  const setAuth = useAppStore((s) => s.setAuth)

  // Called when the user successfully logs in via LoginPage
  const handleLoginSuccess = useCallback(() => {
    setAppState('app')
  }, [])

  // Called when we need to force the user back to login
  const handleLogout = useCallback(() => {
    clearToken()
    setAuth({ user: null, loading: false, error: null })
    setAppState('login')
  }, [setAuth])

  // On startup: check if we have a valid saved token
  useEffect(() => {
    const checkAuth = async () => {
      if (!hasToken()) {
        // No token at all → go straight to login
        setAuth({ user: null, loading: false, error: null })
        setAppState('login')
        return
      }

      try {
        // Validate the saved token with the backend
        const me = await api.me()
        setAuth({ user: { email: me.email, userId: me.user_id }, loading: false, error: null })
        setAppState('app')
      } catch {
        // Token is stale / invalid
        clearToken()
        setAuth({ user: null, loading: false, error: null })
        setAppState('login')
      }
    }

    checkAuth()
  }, [setAuth])

  // Listen for 401 events from the axios interceptor
  useEffect(() => {
    window.addEventListener('auth:logout', handleLogout)
    return () => window.removeEventListener('auth:logout', handleLogout)
  }, [handleLogout])

  // ── Render ──────────────────────────────────────────────────────────────────
  if (appState === 'loading') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0d1117]">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-accent-red" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-sm text-slate-500">Checking session…</span>
        </div>
      </div>
    )
  }

  if (appState === 'login') {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />
  }

  return <AppShell />
}
