import { useState } from 'react'
import {
  PageShell,
  ActionButtons,
  ConfigPanel,
  Field,
  useAutomationTask,
} from '../shared/FeatureHelpers'

export default function SmartSuggestions({ feature }) {
  const [prompt, setPrompt] = useState('Modern home office setup with desk, chair, and monitor.')
  const [suggestionType, setSuggestionType] = useState('pricing')
  const [output, setOutput] = useState('')
  const { statusMessage, busy, setStatusMessage } = useAutomationTask()

  const handleAction = async () => {
    setOutput('This backend endpoint is not available in the current backend build.')
    setStatusMessage('Smart suggestions are unavailable with this backend.')
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
          <Field label="Suggestion type">
            <select className="input" value={suggestionType} onChange={(e) => setSuggestionType(e.target.value)}>
              <option value="pricing">Pricing</option>
              <option value="category">Category</option>
              <option value="keywords">Keywords</option>
            </select>
          </Field>
        </ConfigPanel>
        <div className="card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">Smart Suggestions</h3>
          <textarea className="input min-h-[220px] font-mono text-xs" readOnly value={output || 'Press Generate to see suggestions.'} />
          {statusMessage && <div className="text-sm text-slate-400">{statusMessage}</div>}
          {busy && <div className="text-sm text-slate-400">Generating suggestions...</div>}
        </div>
      </div>
    </PageShell>
  )
}
