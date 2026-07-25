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

export default function AutomatedWorkflowSupport({ feature }) {
  const selectedAccountIds = useAppStore((s) => s.selectedAccountIds)
  const [workflowName, setWorkflowName] = useState('AI Draft Workflow')
  const [schedule, setSchedule] = useState('manual')
  const [draftCount, setDraftCount] = useState(5)
  const [price, setPrice] = useState(19900)
  const [category, setCategory] = useState('Electronics')
  const [condition, setCondition] = useState('used_good')
  const [steps, setSteps] = useState(['AI create drafts'])
  const { statusMessage, busy, setStatusMessage } = useAutomationTask()

  const handleAction = async () => {
    if (!selectedAccountIds.length) {
      setStatusMessage('Please select an account first.')
      return
    }

    setStatusMessage('Automated workflow endpoint is not available in the current backend build.')
  }

  return (
    <PageShell title={feature.title} description={feature.description} actions={
      <ActionButtons actions={feature.actions} onAction={handleAction} />
    }>
      <div className="grid lg:grid-cols-2 gap-4">
        <AccountTable />
        <div className="space-y-3">
          {statusMessage && <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-slate-300">{statusMessage}</div>}
          {busy && <div className="text-sm text-slate-400">Running automated workflow...</div>}
          <div className="rounded-lg border border-white/10 bg-surface p-4 text-sm text-slate-300">
            This page currently triggers a backend draft workflow using the selected account.
          </div>
        </div>
        <ConfigPanel>
          <Field label="Workflow name">
            <input className="input" value={workflowName} onChange={(e) => setWorkflowName(e.target.value)} />
          </Field>
          <Field label="Steps">
            <select className="input" multiple size={5} value={steps} onChange={(e) => setSteps(Array.from(e.target.selectedOptions, (o) => o.value))}>
              <option>AI create drafts</option>
              <option>Publish listings</option>
              <option>Renew listings</option>
              <option>Monitor clicks</option>
            </select>
          </Field>
          <Field label="Schedule">
            <select className="input" value={schedule} onChange={(e) => setSchedule(e.target.value)}>
              <option value="manual">Manual</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </Field>
          <Field label="Draft count">
            <input className="input" type="number" min={1} value={draftCount} onChange={(e) => setDraftCount(Number(e.target.value))} />
          </Field>
          <Field label="Category">
            <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} />
          </Field>
          <Field label="Condition">
            <select className="input" value={condition} onChange={(e) => setCondition(e.target.value)}>
              <option value="new">New</option>
              <option value="used_good">Used, good</option>
              <option value="used_fair">Used, fair</option>
            </select>
          </Field>
          <Field label="Price (cents)">
            <input className="input" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          </Field>
        </ConfigPanel>
      </div>
    </PageShell>
  )
}
