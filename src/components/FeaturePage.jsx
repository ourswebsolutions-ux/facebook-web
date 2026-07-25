import React from 'react'
import FEATURE_PAGE_MAP from './FeaturePages'

export default function FeaturePage({ feature }) {
  const PageComponent = FEATURE_PAGE_MAP[feature?.id]

  if (!PageComponent) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <h1 className="text-2xl font-bold text-white">{feature?.title || 'Feature'}</h1>
            <p className="text-sm text-slate-400 mt-1">{feature?.description || 'No UI implementation available yet.'}</p>
            <div className="mt-4 rounded-lg border border-white/10 bg-surface p-4 text-sm text-slate-300">
              This feature is not implemented in a dedicated screen yet. Please pick another tab or add a feature page component in  ok`src/components/FeaturePages`.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <PageComponent feature={feature} />
}
