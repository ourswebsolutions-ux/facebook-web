import { useState } from 'react'
import { useAppStore } from '../../../store'
import {
  PageShell, ActionButtons, AccountSelector, SectionCard,
  ConfigPanel, Field, ListingsTable, useAutomationTask, TaskProgressView,
} from '../shared/FeatureHelpers'

export default function AIDraftPublisher({ feature }) {
  const selectedAccountIds = useAppStore((s) => s.selectedAccountIds)
  const [draftIds, setDraftIds] = useState('')
  const [maxPublish, setMaxPublish] = useState(10)
  const [delaySeconds, setDelaySeconds] = useState(30)
  const [improveWithAi, setImproveWithAi] = useState(true)
  const { statusMessage, busy, task, runTask, cancelTask } = useAutomationTask()

  const handleAction = async () => {
    if (!selectedAccountIds.length) return
    await runTask('draft-publisher-ai', {
      account_id: selectedAccountIds[0],
      draft_ids: draftIds.split(',').map((id) => id.trim()).filter(Boolean),
      max_publish: maxPublish,
      delay_seconds: delaySeconds,
      improve_with_ai: improveWithAi,
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
          <ConfigPanel title="Publish Settings" icon="🚀">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Draft IDs (comma separated)" hint="Leave empty to publish all pending drafts">
                  <input className="input" value={draftIds} onChange={(e) => setDraftIds(e.target.value)} placeholder="id1, id2, id3" />
                </Field>
              </div>
              <Field label="Max drafts to publish">
                <input className="input" type="number" min={1} max={200} value={maxPublish} onChange={(e) => setMaxPublish(Number(e.target.value))} />
              </Field>
              <Field label="Delay between publishes (sec)">
                <input className="input" type="number" min={5} max={300} value={delaySeconds} onChange={(e) => setDelaySeconds(Number(e.target.value))} />
              </Field>
              <Field label="AI content improvement">
                <select className="input" value={improveWithAi ? 'yes' : 'no'} onChange={(e) => setImproveWithAi(e.target.value === 'yes')}>
                  <option value="yes">Yes — rewrite with AI</option>
                  <option value="no">No — publish as-is</option>
                </select>
              </Field>
            </div>
          </ConfigPanel>
          <ListingsTable title="Your Drafts" />
        </div>
      </div>
    </PageShell>
  )
}
