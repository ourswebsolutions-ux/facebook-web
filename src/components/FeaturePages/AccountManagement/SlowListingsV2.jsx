import { useState } from 'react'
import { useAppStore } from '../../../store'
import {
  PageShell, ActionButtons, MultiAccountSelector, SectionCard,
  ConfigPanel, Field, DropdownSelect, ImageUploader, useAutomationTask, TaskProgressView,
} from '../shared/FeatureHelpers'
import { FB_CATEGORIES } from '../shared/constants'

export default function SlowListingsV2({ feature }) {
  const selectedAccountIds = useAppStore((s) => s.selectedAccountIds)
  const [delaySeconds, setDelaySeconds]   = useState(30)
  const [warmupBefore, setWarmupBefore]   = useState(true)
  const [warmupSteps, setWarmupSteps]     = useState(3)
  const [productName, setProductName]     = useState('')
  const [description, setDescription]     = useState('')
  const [category, setCategory]           = useState('Electronics')
  const [condition, setCondition]         = useState('used_good')
  const [price, setPrice]                 = useState(0)
  const [useAi, setUseAi]                 = useState(true)
  const [imagePaths, setImagePaths]       = useState([])
  const { statusMessage, busy, task, runTask, cancelTask, setStatusMessage } = useAutomationTask()

  const canStart = selectedAccountIds.length > 0 && imagePaths.length > 0

  const handleAction = async () => {
    if (!canStart) return
    for (const accountId of selectedAccountIds) {
      setStatusMessage(`Posting on account ${accountId.slice(0, 8)}…`)
      await runTask('new-account-slow-v2', {
        account_id: accountId,
        listing_count: 1,
        delay_seconds: Math.min(300, Math.max(5, delaySeconds)),
        use_ai: useAi,
        product_name: productName || null,
        description: description || '',
        category, condition,
        price: price * 100,
        images: imagePaths,
        warmup_before: warmupBefore,
        warmup_steps: Math.min(10, Math.max(1, warmupSteps)),
      })
    }
  }

  return (
    <PageShell title={feature.title} description={feature.description} actions={
      <ActionButtons actions={feature.actions} onAction={handleAction} disabled={!canStart || busy} busy={busy} />
    }>
      <div className="grid lg:grid-cols-[300px_1fr] gap-5">
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
          <ConfigPanel title="Listing Details" icon="📝">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Product Name">
                <input className="input" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. iPhone 14 Pro" />
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
                <Field label="Description" hint="Optional — AI enhances if blank">
                  <textarea className="input min-h-[80px] resize-none" value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Slight scratch on back, original box included…" />
                </Field>
              </div>
            </div>
          </ConfigPanel>
          <ConfigPanel title="Warmup & Automation" icon="🔥">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Warm up before listing">
                <select className="input" value={warmupBefore ? 'yes' : 'no'} onChange={(e) => setWarmupBefore(e.target.value === 'yes')}>
                  <option value="yes">Yes — warm up first</option>
                  <option value="no">No — skip warmup</option>
                </select>
              </Field>
              <Field label="Warm-up steps (1–10)">
                <input className="input" type="number" min={1} max={10} value={warmupSteps} disabled={!warmupBefore}
                  onChange={(e) => setWarmupSteps(Number(e.target.value))} />
              </Field>
              <Field label="Delay between posts (sec)">
                <input className="input" type="number" min={5} max={300} value={delaySeconds} onChange={(e) => setDelaySeconds(Number(e.target.value))} />
              </Field>
              <Field label="Use AI for content">
                <select className="input" value={useAi ? 'yes' : 'no'} onChange={(e) => setUseAi(e.target.value === 'yes')}>
                  <option value="yes">Yes — AI generated</option>
                  <option value="no">No — use product name</option>
                </select>
              </Field>
            </div>
            {selectedAccountIds.length > 0 && (
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/8 px-4 py-3 text-xs text-blue-300">
                ℹ️ This listing will be posted on <strong className="text-blue-200">{selectedAccountIds.length} account{selectedAccountIds.length > 1 ? 's' : ''}</strong> — 1 post per account.
              </div>
            )}
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
