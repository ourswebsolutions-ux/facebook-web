import { useState } from 'react'
import { useAppStore } from '../../../store'
import {
  PageShell, ActionButtons, MultiAccountSelector, SectionCard,
  ConfigPanel, Field, DropdownSelect, ImageUploader, useAutomationTask, TaskProgressView,
} from '../shared/FeatureHelpers'
import { FB_CATEGORIES } from '../shared/constants'
import api from '../../../utils/api'

export default function CreateDrafts({ feature }) {
  const selectedAccountIds = useAppStore((s) => s.selectedAccountIds)
  const [draftCount, setDraftCount] = useState(5)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState(0)
  const [category, setCategory] = useState('Electronics')
  const [condition, setCondition] = useState('used_good')
  const [useAi, setUseAi] = useState(true)
  const [imagePaths, setImagePaths] = useState([])
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const { statusMessage, busy, task, runTask, cancelTask } = useAutomationTask()

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return
    setAiLoading(true)
    setAiError('')
    try {
      const res = await api.generateProduct(aiPrompt.trim())
      if (res.title) setTitle(res.title)
      if (res.description) setDescription(res.description)
    } catch (err) {
      setAiError(err?.response?.data?.detail || 'AI generation failed. Try again.')
    } finally {
      setAiLoading(false)
    }
  }

  const canStart = selectedAccountIds.length > 0 && imagePaths.length > 0

  const handleAction = async () => {
    if (!canStart) return
    for (const accountId of selectedAccountIds) {
      await runTask('create-drafts', {
        account_id: accountId,
        draft_count: Math.min(100, Math.max(1, draftCount)),
        title: title || 'Draft listing',
        description,
        price: price * 100,
        category, condition,
        images: imagePaths,
        use_ai: useAi,
      })
    }
  }

  return (
    <PageShell title={feature.title} description={feature.description} actions={
      <ActionButtons actions={feature.actions} onAction={handleAction} disabled={!canStart || busy} busy={busy} />
    }>
      <div className="grid lg:grid-cols-[320px_1fr] gap-5">
        <div className="space-y-4">
          <MultiAccountSelector />
          <SectionCard title="Status" icon="📊">
            {statusMessage ? <p className="text-sm text-slate-300 leading-relaxed">{statusMessage}</p>
              : <p className="text-xs text-slate-600">No active task.</p>}
            <TaskProgressView task={task} busy={busy} onCancel={cancelTask} />
          </SectionCard>
        </div>
        <div className="space-y-4">
          <SectionCard title="Product Images" icon="🖼️">
            <ImageUploader imagePaths={imagePaths} onChange={setImagePaths} required />
          </SectionCard>

          {/* AI Generate */}
          <SectionCard title="AI Generate" icon="✨">
            <div className="flex gap-2">
              <input
                className="input flex-1 text-sm"
                placeholder="e.g. used iPhone 14 Pro Max 256GB space black"
                value={aiPrompt}
                onChange={(e) => { setAiPrompt(e.target.value); setAiError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
              />
              <button
                type="button"
                onClick={handleAiGenerate}
                disabled={aiLoading || !aiPrompt.trim()}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors flex items-center gap-2 shrink-0"
              >
                {aiLoading
                  ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>Generating...</>
                  : '⚡ Generate'}
              </button>
            </div>
            {aiError && <p className="text-xs text-red-400 mt-1">{aiError}</p>}
            <p className="text-xs text-slate-500 mt-1">Title and description will be auto-filled below.</p>
          </SectionCard>

          <ConfigPanel title="Draft Details" icon="📝">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Title">
                <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Draft listing title" />
              </Field>
              <Field label="Category">
                <DropdownSelect options={FB_CATEGORIES} value={category} onChange={setCategory} />
              </Field>
              <Field label="Condition">
                <select className="input" value={condition} onChange={(e) => setCondition(e.target.value)}>
                  <option value="new">New</option>
                  <option value="used_like_new">Used — Like new</option>
                  <option value="used_good">Used — Good</option>
                  <option value="used_fair">Used — Fair</option>
                </select>
              </Field>
              <Field label="Price (USD $)">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none">$</span>
                  <input className="input pl-7" type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
                </div>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Description">
                  <textarea className="input min-h-[80px] resize-none" value={description}
                    onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
                </Field>
              </div>
            </div>
          </ConfigPanel>
          <ConfigPanel title="Automation Settings" icon="⚙️">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Number of drafts (1–100)">
                <input className="input" type="number" min={1} max={100} value={draftCount} onChange={(e) => setDraftCount(Number(e.target.value))} />
              </Field>
              <Field label="Use AI enhancements">
                <select className="input" value={useAi ? 'yes' : 'no'} onChange={(e) => setUseAi(e.target.value === 'yes')}>
                  <option value="yes">Yes — AI generated</option>
                  <option value="no">No — use title as-is</option>
                </select>
              </Field>
            </div>
          </ConfigPanel>
          {!imagePaths.length && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex items-center gap-2.5 text-sm text-amber-300">
              <span>⚠️</span> Upload at least one product image to enable the Start button.
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
