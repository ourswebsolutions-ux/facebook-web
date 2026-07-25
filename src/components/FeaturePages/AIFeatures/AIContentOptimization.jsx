import { useState } from 'react'
import {
  PageShell,
  ActionButtons,
  ConfigPanel,
  Field,
  useAutomationTask,
} from '../shared/FeatureHelpers'

export default function AIContentOptimization({ feature }) {
  const [existingText, setExistingText] = useState('This item is in good condition and includes all accessories.')
  const [goal, setGoal] = useState('more engaging')
  const [output, setOutput] = useState('')
  const { statusMessage, busy, setStatusMessage } = useAutomationTask()

  const handleAction = async () => {
    setOutput('This backend endpoint is not available in the current backend build.')
    setStatusMessage('AI content optimization is unavailable with this backend.')
  }

  return (
    <PageShell title={feature.title} description={feature.description} actions={
      <ActionButtons actions={feature.actions} onAction={handleAction} />
    }>
      <div className="grid lg:grid-cols-2 gap-4">
        <ConfigPanel>
          <Field label="Current description">
            <textarea className="input min-h-[120px]" value={existingText} onChange={(e) => setExistingText(e.target.value)} />
          </Field>
          <Field label="Improvement goal">
            <select className="input" value={goal} onChange={(e) => setGoal(e.target.value)}>
              <option value="more engaging">More persuasive</option>
              <option value="shorter">Shorter</option>
              <option value="more detailed">More detailed</option>
            </select>
          </Field>
        </ConfigPanel>
        <div className="card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">Optimized Description</h3>
          <textarea className="input min-h-[220px] font-mono text-xs" readOnly value={output || 'Press Optimize to see improved text.'} />
          {statusMessage && <div className="text-sm text-slate-400">{statusMessage}</div>}
          {busy && <div className="text-sm text-slate-400">Optimizing content...</div>}
        </div>
      </div>
    </PageShell>
  )
}
