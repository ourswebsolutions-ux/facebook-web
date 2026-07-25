import { useState } from 'react'
import { useAppStore } from '../../../store'
import {
  PageShell, ActionButtons, AccountSelector, SectionCard,
  ConfigPanel, Field, ListingsTable, useAutomationTask, TaskProgressView,
} from '../shared/FeatureHelpers'

export default function RelistListings({ feature }) {
  const selectedAccountIds = useAppStore((s) => s.selectedAccountIds)
  const [listingIds, setListingIds] = useState('')
  const [maxRelist, setMaxRelist] = useState(10)
  const [delaySeconds, setDelaySeconds] = useState(10)
  const { statusMessage, busy, task, runTask, cancelTask } = useAutomationTask()

  const handleAction = async () => {
    if (!selectedAccountIds.length) return
    await runTask('relist-listings', {
      account_id: selectedAccountIds[0],
      listing_ids: listingIds.split(',').map((id) => id.trim()).filter(Boolean),
      max_relist: Math.min(200, Math.max(1, maxRelist)),
      delay_seconds: Math.min(120, Math.max(2, delaySeconds)),
    })
  }

  return (
    <PageShell title={feature.title} description={feature.description} actions={
      <ActionButtons actions={feature.actions} onAction={handleAction} disabled={busy || !selectedAccountIds.length} busy={busy} />
    }>
      <div className="grid lg:grid-cols-[320px_1fr] gap-5">
        <div className="space-y-4">
          <AccountSelector />
          <SectionCard title="Status" icon="📊">
            {statusMessage ? <p className="text-sm text-slate-300 leading-relaxed">{statusMessage}</p>
              : <p className="text-xs text-slate-600">No active task.</p>}
            <TaskProgressView task={task} busy={busy} onCancel={cancelTask} />
          </SectionCard>
        </div>
        <div className="space-y-4">
          <ConfigPanel title="Relist Settings" icon="♻️">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Listing IDs (comma separated)" hint="Leave empty to relist all published listings">
                  <input className="input" value={listingIds} onChange={(e) => setListingIds(e.target.value)} placeholder="Leave empty to relist all" />
                </Field>
              </div>
              <Field label="Max relist count (1–200)">
                <input className="input" type="number" min={1} max={200} value={maxRelist} onChange={(e) => setMaxRelist(Number(e.target.value))} />
              </Field>
              <Field label="Delay between relists (sec)">
                <input className="input" type="number" min={2} max={120} value={delaySeconds} onChange={(e) => setDelaySeconds(Number(e.target.value))} />
              </Field>
            </div>
          </ConfigPanel>
          <ListingsTable title="Current Listings" />
        </div>
      </div>
    </PageShell>
  )
}
