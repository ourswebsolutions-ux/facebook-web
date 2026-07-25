import { useState } from 'react'
import { useAppStore } from '../../../store'
import {
  PageShell,
  ActionButtons,
  AccountTable,
  ListingsTable,
  ConfigPanel,
  Field,
  useAutomationTask,
  TaskProgressView,
} from '../shared/FeatureHelpers'

export default function DeleteAllListings({ feature }) {
  const selectedAccountIds = useAppStore((s) => s.selectedAccountIds)
  const [confirmInput, setConfirmInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const { statusMessage, busy, task, runTask, cancelTask, setStatusMessage } = useAutomationTask()

  const handleAction = async () => {
    if (!selectedAccountIds.length) {
      setStatusMessage('Select at least one account first.')
      return
    }
    if (confirmInput !== 'DELETE') {
      setStatusMessage('Type DELETE to confirm before running this action.')
      return
    }

    await runTask('delete-all-listings', {
      account_id: selectedAccountIds[0],
      status_filter: statusFilter || null,
      confirm: true,
    })
  }

  return (
    <PageShell title={feature.title} description={feature.description} actions={
      <ActionButtons actions={feature.actions} onAction={handleAction} danger disabled={busy} />
    }>
      <div className="grid lg:grid-cols-2 gap-4">
        <AccountTable />
        <div className="space-y-3">
          {statusMessage && <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-slate-300">{statusMessage}</div>}
          <TaskProgressView task={task} busy={busy} onCancel={cancelTask} />
          <ConfigPanel title="Danger Zone">
            <Field label="Status filter (optional)">
              <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="relisted">Relisted</option>
                <option value="deleted">Deleted</option>
              </select>
            </Field>
            <Field label="Confirmation phrase">
              <input className="input" value={confirmInput} onChange={(e) => setConfirmInput(e.target.value)} placeholder="Type DELETE" />
            </Field>
            <div className="rounded-lg border border-accent-red/30 bg-accent-red/10 p-3 text-sm text-red-200">
              This action will delete all listings for the selected account. Use with extreme caution.
            </div>
          </ConfigPanel>
        </div>
      </div>
      <ListingsTable title="Current Listings" />
    </PageShell>
  )
}
