import { useState } from 'react'
import {
  PageShell,
  ActionButtons,
  ConfigPanel,
  Field,
  useAutomationTask,
} from '../shared/FeatureHelpers'

export default function AITitleGeneration({ feature }) {
  const [prompt, setPrompt] = useState('An unlocked phone in excellent condition')
  const [tone, setTone] = useState('professional')
  const [output, setOutput] = useState('')
  const { statusMessage, busy, setStatusMessage } = useAutomationTask()

  const handleAction = async () => {
    setOutput('This backend endpoint is not available in the current backend build.')
    setStatusMessage('AI title generation is unavailable with this backend.')
  }

  return (
    <PageShell title={feature.title} description={feature.description} actions={
      <ActionButtons actions={feature.actions} onAction={handleAction} />
    }>
      <div className="grid lg:grid-cols-2 gap-4">
        <ConfigPanel>
          <Field label="Product prompt">
            <textarea className="input min-h-[120px]" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </Field>
          <Field label="Tone">
            <select className="input" value={tone} onChange={(e) => setTone(e.target.value)}>
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="urgent">Urgent</option>
            </select>
          </Field>
        </ConfigPanel>
        <div className="card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">Generated Title + Description</h3>
          <textarea className="input min-h-[220px] font-mono text-xs" readOnly value={output || 'Press Generate to see AI title output.'} />
          {statusMessage && <div className="text-sm text-slate-400">{statusMessage}</div>}
          {busy && <div className="text-sm text-slate-400">Generating AI title...</div>}
        </div>
      </div>
    </PageShell>
  )
}
