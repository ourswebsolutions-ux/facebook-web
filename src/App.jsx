import React, { useEffect, useState } from 'react'
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
import api, { hasToken } from './utils/api'

function AuthGate({ children }) {
  const [ready, setReady] = useState(false)
  const [authError, setAuthError] = useState('')
  const setAuth = useAppStore((s) => s.setAuth)

  useEffect(() => {
    const checkAuth = async () => {
      if (!hasToken()) {
        setAuth({ user: null, loading: false, error: null })
        setReady(true)
        return
      }

      try {
        const me = await api.me()
        setAuth({ user: me, loading: false, error: null })
      } catch (err) {
        setAuthError('Session expired or token missing. Please login again in Settings.')
        setAuth({ user: null, loading: false, error: err?.response?.data?.detail || err.message })
      } finally {
        setReady(true)
      }
    }

    checkAuth()
  }, [setAuth])

  if (!ready) {
    return <div className="flex h-screen items-center justify-center text-slate-400">Checking backend connection…</div>
  }

  return (
    <>
      {authError ? <div className="absolute top-3 right-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">{authError}</div> : null}
      {children}
    </>
  )
}

export default function App() {
  const activeTab = useAppStore((s) => s.activeTab)

  let content
  if (activeTab === 'dashboard') content = <Dashboard />
  else if (activeTab === 'activity') content = <ActivityView />
  else if (activeTab === 'inbox') content = <InboxView />
  else if (activeTab === 'settings') content = <SettingsView />
  else if (activeTab === 'accounts') content = <AccountsView />
  else content = <FeaturePage feature={getFeature(activeTab)} />

  return (
    <AuthGate>
      <GlobalTaskPoller />
      <div className="flex flex-col h-screen bg-surface overflow-hidden">
        <TitleBar />
        <div className="flex flex-1 min-h-0">
          <Sidebar />
          <main className="flex-1 min-h-0 overflow-hidden bg-surface min-w-0">
            {content}
          </main>
        </div>
      </div>
    </AuthGate>
  )
}
