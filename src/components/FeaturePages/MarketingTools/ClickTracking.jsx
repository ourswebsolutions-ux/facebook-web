import { useState } from 'react'
import { useAppStore } from '../../../store'
import api from '../../../utils/api'
import {
  PageShell, ActionButtons, AccountTable,
  Field, SectionCard,
} from '../shared/FeatureHelpers'

function StatCard({ label, value, icon, color = 'text-white' }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 p-4 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  )
}

export default function ClickTracking({ feature }) {
  const selectedAccountIds = useAppStore((s) => s.selectedAccountIds)
  const [listingIds, setListingIds]     = useState('')
  const [clicks, setClicks]             = useState(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [busy, setBusy]                 = useState(false)

  const handleAction = async () => {
    if (!selectedAccountIds.length) return
    setBusy(true); setStatusMessage('')
    try {
      const data = await api.getClicks({
        account_id:  selectedAccountIds[0],
        listing_ids: listingIds.split(',').map((id) => id.trim()).filter(Boolean),
      })
      setClicks(data)
      setStatusMessage('Click data loaded successfully.')
    } catch (err) {
      setStatusMessage(err?.response?.data?.detail || err.message || 'Failed to load click data.')
    } finally {
      setBusy(false)
    }
  }

  // Summarise stats if available
  const totalClicks   = clicks?.total_clicks   ?? '—'
  const totalViews    = clicks?.total_views    ?? '—'
  const totalMessages = clicks?.total_messages ?? '—'
  const ctr           = clicks?.ctr            ?? '—'

  return (
    <PageShell
      title={feature.title}
      description={feature.description}
      actions={
        <ActionButtons
          actions={feature.actions}
          onAction={handleAction}
          disabled={busy || !selectedAccountIds.length}
          busy={busy}
        />
      }
    >
      <div className="grid lg:grid-cols-[280px_1fr] gap-5">

        {/* Col 1 — Account + filter */}
        <div className="space-y-4">
          <AccountTable />

          <SectionCard title="Filter" icon="🔍">
            <Field label="Listing IDs (comma separated)" hint="Leave blank for all listings">
              <input className="input" value={listingIds}
                onChange={(e) => setListingIds(e.target.value)}
                placeholder="id1, id2, id3" />
            </Field>
          </SectionCard>
        </div>

        {/* Col 2 — Stats + results */}
        <div className="space-y-5">
          {/* Summary stats */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <StatCard label="Total Clicks"   value={totalClicks}   icon="👆" color="text-blue-400" />
            <StatCard label="Total Views"    value={totalViews}    icon="👁️" color="text-purple-400" />
            <StatCard label="Messages"       value={totalMessages} icon="💬" color="text-emerald-400" />
            <StatCard label="CTR"            value={ctr}           icon="📈" color="text-amber-400" />
          </div>

          {/* Status message */}
          {statusMessage && (
            <div className={`rounded-xl border px-4 py-3 text-sm ${
              statusMessage.includes('success')
                ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
                : 'border-white/10 bg-white/5 text-slate-300'
            }`}>
              {statusMessage}
            </div>
          )}

          {/* Raw data */}
          {clicks && (
            <SectionCard title="Raw Response" icon="📋">
              <pre className="text-xs text-slate-300 leading-relaxed overflow-x-auto max-h-64 whitespace-pre-wrap break-all">
                {JSON.stringify(clicks, null, 2)}
              </pre>
            </SectionCard>
          )}

          {/* Empty state */}
          {!clicks && !busy && (
            <SectionCard title="No data yet" icon="📭">
              <p className="text-sm text-slate-500">
                Select an account and click <strong className="text-slate-300">Refresh Stats</strong> to load click tracking data.
              </p>
            </SectionCard>
          )}

          {busy && (
            <div className="flex items-center gap-3 text-sm text-slate-400 px-2">
              <svg className="animate-spin h-4 w-4 text-accent-red shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Loading marketplace click stats…
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
