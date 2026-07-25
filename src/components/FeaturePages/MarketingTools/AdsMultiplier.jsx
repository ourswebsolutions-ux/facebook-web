import { useState } from 'react'
import { useAppStore } from '../../../store'
import {
  PageShell, ActionButtons, AccountTable,
  Field, useAutomationTask, TaskProgressView, SectionCard,
} from '../shared/FeatureHelpers'

export default function AdsMultiplier({ feature }) {
  const selectedAccountIds = useAppStore((s) => s.selectedAccountIds)
  const [listingIds, setListingIds]   = useState('')
  const [multiplier, setMultiplier]   = useState(3)
  const [delaySeconds, setDelaySeconds] = useState(20)
  const { statusMessage, busy, task, runTask, cancelTask } = useAutomationTask()

  const handleAction = async () => {
    if (!selectedAccountIds.length) return
    await runTask('ads-multiplier', {
      account_id:  selectedAccountIds[0],
      listing_ids: listingIds.split(',').map((id) => id.trim()).filter(Boolean),
      multiplier,
      delay_seconds: delaySeconds,
    })
  }

  return (
    <PageShell
      title={feature.title}
      description={feature.description}
      actions={
        <ActionButtons
          actions={feature.actions}
          onAction={handleAction}
          disabled={busy || !selectedAccountIds.length}
          busy={busy}
        />
      }
    >
      {/* ── 3-column layout ── */}
      <div className="grid lg:grid-cols-[280px_1fr_1fr] gap-5">

        {/* Col 1 — Account */}
        <div className="space-y-4">
          <AccountTable />
        </div>

        {/* Col 2 — Config */}
        <SectionCard title="Campaign Settings" icon="⚙️">
          <Field label="Listing IDs (comma separated)" hint="Leave empty to use all active listings">
            <input className="input" value={listingIds}
              onChange={(e) => setListingIds(e.target.value)}
              placeholder="e.g. id1, id2, id3" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Multiplier" hint="How many times to amplify">
              <input className="input" type="number" min={1} max={20}
                value={multiplier} onChange={(e) => setMultiplier(Number(e.target.value))} />
            </Field>
            <Field label="Delay (sec)" hint="Between each action">
              <input className="input" type="number" min={1}
                value={delaySeconds} onChange={(e) => setDelaySeconds(Number(e.target.value))} />
            </Field>
          </div>

          {/* Info banner */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 p-3 text-xs text-amber-300 leading-relaxed mt-2">
            💡 Higher multipliers with short delays may trigger Facebook rate limits. Keep delay ≥ 15 sec.
          </div>
        </SectionCard>

        {/* Col 3 — Status */}
        <div className="space-y-4">
          <SectionCard title="Status" icon="📊">
            {statusMessage
              ? <p className="text-sm text-slate-300 leading-relaxed">{statusMessage}</p>
              : <p className="text-xs text-slate-600">No active campaign.</p>
            }
            <TaskProgressView task={task} busy={busy} onCancel={cancelTask} />
          </SectionCard>

          {/* What it does */}
          <SectionCard title="How it works" icon="ℹ️">
            <ul className="space-y-2">
              {[
                'Boosts selected listings across multiple sessions',
                'Simulates organic engagement signals',
                'Scales reach without duplicating listings',
                'Respects configured delays to avoid detection',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2 text-sm text-slate-400">
                  <span className="text-accent-red mt-0.5 shrink-0">→</span>{t}
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>
    </PageShell>
  )
}
