import { useState } from 'react'
import { useAppStore } from '../../../store'
import {
  PageShell, ActionButtons, MultiAccountSelector, SectionCard,
  ConfigPanel, Field, DropdownSelect, ImageUploader, useAutomationTask, TaskProgressView,
} from '../shared/FeatureHelpers'

const FB_CATEGORIES = [
  'Vehicles','Property Rentals','Apparel','Classifieds','Electronics',
  'Entertainment','Family','Free Stuff','Garden & Outdoor','Hobbies',
  'Home Goods','Home Improvement Supplies','Home Sales','Musical Instruments',
  'Office Supplies','Pet Supplies','Sporting Goods','Toys & Games',
  'Buy and sell groups','Other',
]

export default function SlowListings({ feature }) {
  const selectedAccountIds = useAppStore((s) => s.selectedAccountIds)
  const [delaySeconds, setDelaySeconds] = useState(45)
  const [productName, setProductName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Electronics')
  const [condition, setCondition] = useState('used_good')
  const [price, setPrice] = useState(399)
  const [imagePaths, setImagePaths] = useState([])
  const { statusMessage, busy, task, runTask, cancelTask, setStatusMessage } = useAutomationTask()

  const canStart = selectedAccountIds.length > 0 && imagePaths.length > 0

  const handleAction = async () => {
    if (!canStart) return
    for (const accountId of selectedAccountIds) {
      setStatusMessage(`Posting on account ${accountId.slice(0, 8)}…`)
      await runTask('new-account-slow', {
        account_id: accountId,
        listing_count: 1,
        delay_seconds: delaySeconds,
        use_ai: true,
        product_name: productName || 'Sample product',
        description: description || '',
        category, condition,
        price: price * 100,
        images: imagePaths,
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
                <input className="input" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. Samsung Galaxy S24" />
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
                <Field label="Description" hint="Optional — AI will generate if blank">
                  <textarea className="input min-h-[80px] resize-none" value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Excellent condition, original packaging included…" />
                </Field>
              </div>
            </div>
          </ConfigPanel>
          <ConfigPanel title="Automation Settings" icon="⚡">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Delay between posts (sec)" hint="Min 10s recommended">
                <input className="input" type="number" min={10} max={300} value={delaySeconds} onChange={(e) => setDelaySeconds(Number(e.target.value))} />
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
