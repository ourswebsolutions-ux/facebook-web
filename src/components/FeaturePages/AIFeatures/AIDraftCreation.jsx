import { useState } from 'react'
import { useAppStore } from '../../../store'
import {
  PageShell,
  ActionButtons,
  AccountTable,
  ConfigPanel,
  Field,
  useAutomationTask,
} from '../shared/FeatureHelpers'

export default function AIDraftCreation({ feature }) {
  const selectedAccountIds = useAppStore((s) => s.selectedAccountIds)
  const [prompt, setPrompt] = useState('Create a listing draft for a used DSLR camera with lens.')
  const [draftCount, setDraftCount] = useState(5)
  const [output, setOutput] = useState('')
  const { statusMessage, busy, runTask, setStatusMessage } = useAutomationTask()

  const handleAction = async () => {
    if (!selectedAccountIds.length) {
      setStatusMessage('Please select an account first.')
      return
    }

    const data = await runTask('create-drafts', {
      account_id: selectedAccountIds[0],
      draft_count: draftCount,
      title: prompt,
      description: prompt,
      price: 29900,
      category: 'Electronics',
      condition: 'used_good',
      images: [],
      use_ai: true,
    })

    setOutput(JSON.stringify(data, null, 2))
  }

  return (
    <PageShell title={feature.title} description={feature.description} actions={
      <ActionButtons actions={feature.actions} onAction={handleAction} />
    }>
      <div className="grid lg:grid-cols-2 gap-4">
        <AccountTable />
        <div className="space-y-3">
          {statusMessage && <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-slate-300">{statusMessage}</div>}
          {busy && <div className="text-sm text-slate-400">Creating draft(s)...</div>}
          <div className="card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-300">Backend Response</h3>
            <textarea className="input min-h-[220px] font-mono text-xs" readOnly value={output || 'Run the action to see backend response.'} />
          </div>
        </div>
        <ConfigPanel>
          <Field label="Draft prompt">
            <textarea className="input min-h-[120px]" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </Field>
          <Field label="Draft count">
            <input className="input" type="number" min={1} value={draftCount} onChange={(e) => setDraftCount(Number(e.target.value))} />
          </Field>
        </ConfigPanel>
      </div>
    </PageShell>
  )
}
