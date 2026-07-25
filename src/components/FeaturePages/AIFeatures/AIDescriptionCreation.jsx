import { useState } from 'react'
import {
  PageShell,
  ActionButtons,
  ConfigPanel,
  Field,
  useAutomationTask,
} from '../shared/FeatureHelpers'

export default function AIDescriptionCreation({ feature }) {
  const [prompt, setPrompt] = useState('A durable gaming chair with lumbar support and adjustable height.')
  const [style, setStyle] = useState('persuasive')
  const [output, setOutput] = useState('')
  const { statusMessage, busy, setStatusMessage } = useAutomationTask()

  const handleAction = async () => {
    setOutput('This backend endpoint is not available in the current backend build.')
    setStatusMessage('AI description creation is unavailable with this backend.')
  }

  return (
    <PageShell title={feature.title} description={feature.description} actions={
      <ActionButtons actions={feature.actions} onAction={handleAction} />
    }>
      <div className="grid lg:grid-cols-2 gap-4">
        <ConfigPanel>
          <Field label="Listing prompt">
            <textarea className="input min-h-[120px]" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </Field>
          <Field label="Description style">
            <select className="input" value={style} onChange={(e) => setStyle(e.target.value)}>
              <option value="persuasive">Persuasive</option>
              <option value="technical">Technical</option>
              <option value="short">Short & sweet</option>
            </select>
          </Field>
        </ConfigPanel>
        <div className="card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">Generated Description</h3>
          <textarea className="input min-h-[220px] font-mono text-xs" readOnly value={output || 'Press Generate to view a description.'} />
          {statusMessage && <div className="text-sm text-slate-400">{statusMessage}</div>}
          {busy && <div className="text-sm text-slate-400">Generating AI description...</div>}
        </div>
      </div>
    </PageShell>
  )
}
