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

export default function AIUltraListings({ feature }) {
  const selectedAccountIds = useAppStore((s) => s.selectedAccountIds)
  const [productName, setProductName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Electronics')
  const [condition, setCondition] = useState('used_good')
  const [price, setPrice] = useState(499)
  const [extraDetails, setExtraDetails] = useState('')
  const [imagePaths, setImagePaths] = useState([])
  const { statusMessage, busy, task, runTask, cancelTask, setStatusMessage } = useAutomationTask()

  const canStart = selectedAccountIds.length > 0 && imagePaths.length > 0

  const handleAction = async () => {
    if (!canStart) return
    for (const accountId of selectedAccountIds) {
      setStatusMessage(`Posting on account ${accountId.slice(0, 8)}…`)
      await runTask('ultra-ai-listings', {
        account_id: accountId,
        listing_count: 1,
        product_name: productName || 'Generic product',
        description: description || '',
        category, condition,
        price: price * 100,
        images: imagePaths,
        extra_details: extraDetails,
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
          <ConfigPanel title="Product Details" icon="🤖">
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
              <Field label="Max listings per account (1–100)">
                <input className="input opacity-50" type="number" min={1} max={100} value={1} readOnly />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Description" hint="Optional — AI enhances this">
                  <textarea className="input min-h-[70px] resize-none" value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Excellent condition, original box included…" />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Extra details for AI" hint="AI uses these to write unique titles & descriptions">
                  <textarea className="input min-h-[70px] resize-none" value={extraDetails}
                    onChange={(e) => setExtraDetails(e.target.value)}
                    placeholder="e.g. slight scratch on back, fast shipping, works perfectly" />
                </Field>
              </div>
            </div>
          </ConfigPanel>
          {selectedAccountIds.length > 1 && (
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/8 px-4 py-3 text-xs text-blue-300">
              ℹ️ Will post to <strong className="text-blue-200">{selectedAccountIds.length} accounts</strong> — {listingCount} listing{listingCount > 1 ? 's' : ''} each = <strong className="text-blue-200">{selectedAccountIds.length * listingCount}</strong> total posts.
            </div>
          )}
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
