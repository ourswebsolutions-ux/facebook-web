import { useState } from 'react'
import { useAppStore } from '../../../store'
import {
  PageShell, ActionButtons, AccountTable,
  Field, SectionCard, useAutomationTask, TaskProgressView, DropdownSelect,
} from '../shared/FeatureHelpers'

const SCHEDULE_OPTIONS = ['Manual', 'Daily', 'Weekly', 'Monthly']

// Each step maps to a backend workflow_type or a separate endpoint route
const WORKFLOW_STEPS = [
  {
    id:           'renew',
    label:        'Renew Listings',
    icon:         '♻️',
    desc:         'Boost visibility of existing listings',
    route:        'listing-automation',
    workflow_type: 'renew',
  },
  {
    id:           'relist',
    label:        'Relist Listings',
    icon:         '🔁',
    desc:         'Delete and re-post for fresh exposure',
    route:        'listing-automation',
    workflow_type: 'relist',
  },
  {
    id:           'delete_and_repost',
    label:        'Delete & Repost',
    icon:         '🗑️',
    desc:         'Remove published listings then repost',
    route:        'listing-automation',
    workflow_type: 'delete_and_repost',
  },
  {
    id:           'warmup',
    label:        'Warm Up Accounts',
    icon:         '🔥',
    desc:         'Build trust signals before posting',
    route:        'warmup',
    workflow_type: null,   // warmup has its own endpoint
  },
  {
    id:           'drafts',
    label:        'AI Create Drafts',
    icon:         '🤖',
    desc:         'Generate listings with AI (no images needed)',
    route:        'create-drafts',
    workflow_type: null,   // create-drafts has its own endpoint
  },
]

export default function ListingAutomation({ feature }) {
  const selectedAccountIds = useAppStore((s) => s.selectedAccountIds)
  const [selectedStep, setSelectedStep] = useState('renew')   // one active step
  const [maxListings, setMaxListings]   = useState(10)
  const [delaySeconds, setDelaySeconds] = useState(30)
  const [schedule, setSchedule]         = useState('Manual')
  const [listingIds, setListingIds]     = useState('')

  const { statusMessage, busy, task, runTask, cancelTask, setStatusMessage } = useAutomationTask()

  const activeStep = WORKFLOW_STEPS.find((s) => s.id === selectedStep)

  const handleRun = async () => {
    if (!selectedAccountIds.length) {
      setStatusMessage('Please select an account first.')
      return
    }
    if (!activeStep) return

    const accountId = selectedAccountIds[0]
    const ids = listingIds
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    // ── Route to correct endpoint ──────────────────────────────────────────
    if (activeStep.route === 'listing-automation') {
      // renew / relist / delete_and_repost
      await runTask('listing-automation', {
        account_id:    accountId,
        workflow_type: activeStep.workflow_type,
        listing_ids:   ids.length ? ids : undefined,
        max_listings:  maxListings,
        delay_seconds: delaySeconds,
        repeat_interval: schedule !== 'Manual' ? schedule.toLowerCase() : undefined,
      })

    } else if (activeStep.route === 'warmup') {
      await runTask('warmup', {
        account_id:          accountId,
        duration_minutes:    maxListings,   // reuse field as duration
        actions_per_minute:  3,
      })

    } else if (activeStep.route === 'create-drafts') {
      await runTask('create-drafts', {
        account_id:  accountId,
        draft_count: maxListings,
        title:       'AI Generated Listing',
        description: 'Auto-generated product listing',
        price:       19900,
        category:    'Miscellaneous',
        condition:   'used_good',
        images:      [],
        use_ai:      true,
      })
    }
  }

  return (
    <PageShell
      title={feature.title}
      description={feature.description}
      actions={
        <ActionButtons
          actions={['Run Workflow']}
          onAction={handleRun}
          disabled={busy || !selectedAccountIds.length}
          busy={busy}
        />
      }
    >
      <div className="grid lg:grid-cols-[280px_1fr_1fr] gap-5">

        {/* Col 1 — Account + status */}
        <div className="space-y-4">
          <AccountTable />
          <SectionCard title="Status" icon="📊">
            {statusMessage
              ? <p className="text-sm text-slate-300 leading-relaxed">{statusMessage}</p>
              : <p className="text-xs text-slate-600">No active workflow.</p>
            }
            <TaskProgressView task={task} busy={busy} onCancel={cancelTask} />
          </SectionCard>
        </div>

        {/* Col 2 — Step selector */}
        <SectionCard title="Select Workflow Step" icon="🔗">
          <p className="text-xs text-slate-500 -mt-2 mb-3">
            Pick one step to run — each maps to a specific backend operation
          </p>
          <div className="space-y-2">
            {WORKFLOW_STEPS.map((step) => {
              const isActive = selectedStep === step.id
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setSelectedStep(step.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                    isActive
                      ? 'bg-accent-red/10 border-accent-red/35 text-white shadow-sm shadow-red-900/20'
                      : 'bg-white/3 border-white/8 text-slate-400 hover:bg-white/6 hover:text-slate-200'
                  }`}
                >
                  {/* Radio dot */}
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    isActive ? 'border-accent-red bg-accent-red' : 'border-white/30'
                  }`}>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-base shrink-0">{step.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold leading-tight">{step.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{step.desc}</div>
                  </div>
                  {isActive && (
                    <span className="text-[10px] font-bold text-accent-red bg-accent-red/15 px-2 py-0.5 rounded-full shrink-0">
                      SELECTED
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Active step endpoint info */}
          {activeStep && (
            <div className="mt-3 rounded-xl border border-blue-500/20 bg-blue-500/8 p-3 text-xs text-blue-300 leading-relaxed">
              <span className="font-semibold">Endpoint:</span>{' '}
              <code className="font-mono">POST /api/automation/{activeStep.route}</code>
              {activeStep.workflow_type && (
                <span className="ml-2 text-blue-400">
                  · workflow_type = <code className="font-mono">{activeStep.workflow_type}</code>
                </span>
              )}
            </div>
          )}
        </SectionCard>

        {/* Col 3 — Config */}
        <SectionCard title="Configuration" icon="⚙️">

          {/* Listing IDs — only for listing-automation steps */}
          {activeStep?.route === 'listing-automation' && (
            <Field label="Listing IDs (optional)" hint="Comma separated — leave blank for all">
              <input className="input" value={listingIds}
                onChange={(e) => setListingIds(e.target.value)}
                placeholder="id1, id2, id3" />
            </Field>
          )}

          {/* Max count / duration */}
          <div className="grid grid-cols-2 gap-4">
            <Field
              label={activeStep?.id === 'warmup' ? 'Duration (min)' : 'Max listings'}
              hint={activeStep?.id === 'warmup' ? 'Warmup duration' : 'How many to process'}
            >
              <input className="input" type="number" min={1} max={200}
                value={maxListings}
                onChange={(e) => setMaxListings(Number(e.target.value))} />
            </Field>

            {/* Delay — not relevant for warmup */}
            {activeStep?.id !== 'warmup' && (
              <Field label="Delay (sec)" hint="Between each action">
                <input className="input" type="number" min={5} max={600}
                  value={delaySeconds}
                  onChange={(e) => setDelaySeconds(Number(e.target.value))} />
              </Field>
            )}
          </div>

          {/* Schedule — only for listing-automation */}
          {activeStep?.route === 'listing-automation' && (
            <Field label="Repeat schedule" hint="Manual = run once now">
              <DropdownSelect
                options={SCHEDULE_OPTIONS}
                value={schedule}
                onChange={setSchedule}
              />
            </Field>
          )}

          {/* Safety note */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 p-3 text-xs text-amber-300 leading-relaxed mt-2">
            ⚠️ Keep delay ≥ 15 sec to reduce Facebook rate-limit risk.
          </div>
        </SectionCard>

      </div>
    </PageShell>
  )
}
