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

export default function XDraftDelete({ feature }) {
  const selectedAccountIds = useAppStore((s) => s.selectedAccountIds)
  const [draftIds, setDraftIds] = useState('')
  const [confirmInput, setConfirmInput] = useState('')
  const [maxDelete, setMaxDelete] = useState(50)
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

    await runTask('draft-delete', {
      account_id: selectedAccountIds[0],
      draft_ids: draftIds.split(',').map((id) => id.trim()).filter(Boolean),
      max_delete: Math.min(500, Math.max(1, maxDelete)),
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
            <Field label="Draft IDs (comma separated, optional)">
              <input className="input" value={draftIds} onChange={(e) => setDraftIds(e.target.value)} placeholder="Leave empty to delete all drafts" />
            </Field>
            <Field label="Max delete count (1–500)">
              <input className="input" type="number" min={1} max={500} value={maxDelete} onChange={(e) => setMaxDelete(Number(e.target.value))} />
            </Field>
            <Field label="Confirmation phrase">
              <input className="input" value={confirmInput} onChange={(e) => setConfirmInput(e.target.value)} placeholder="Type DELETE" />
            </Field>
            <div className="rounded-lg border border-accent-red/30 bg-accent-red/10 p-3 text-sm text-red-200">
              This will delete the selected drafts. Use carefully.
            </div>
          </ConfigPanel>
        </div>
      </div>
      <ListingsTable title="Current Drafts" />
    </PageShell>
  )
}
