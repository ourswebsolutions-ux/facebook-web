import React from 'react'
import { windowAPI } from '../utils/ipc'

export default function TitleBar() {
  const platform = window.electronAPI?.platform || 'win32'
  const isMac = platform === 'darwin'

  return (
    <div className="h-10 flex items-center justify-between bg-surface-secondary border-b border-white/5 flex-shrink-0 titlebar-drag select-none">
      {isMac && (
        <div className="flex items-center gap-1.5 px-4 no-drag">
          <button
            onClick={() => windowAPI.close()}
            className="w-3 h-3 rounded-full bg-accent-red hover:brightness-90 transition-all"
            title="Close"
          />
          <button
            onClick={() => windowAPI.minimize()}
            className="w-3 h-3 rounded-full bg-accent-amber hover:brightness-90 transition-all"
            title="Minimize"
          />
          <button
            onClick={() => windowAPI.maximize()}
            className="w-3 h-3 rounded-full bg-accent-green hover:brightness-90 transition-all"
            title="Maximize"
          />
        </div>
      )}

      <div className={`flex items-center gap-2 ${isMac ? 'absolute left-1/2 -translate-x-1/2' : 'px-4'}`}>
        {/* Facebook "f" icon */}
        <div className="w-6 h-6 bg-[#1877F2] rounded-full flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.883v2.252h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
          </svg>
        </div>
        <span className="text-sm font-semibold text-white/90">FB Marketplace Suite</span>
      </div>

      {!isMac && (
        <div className="flex items-center ml-auto">
          <button
            onClick={() => windowAPI.minimize()}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            title="Minimize"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={() => windowAPI.maximize()}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            title="Maximize"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="4" y="4" width="16" height="16" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
            </svg>
          </button>
          <button
            onClick={() => windowAPI.close()}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-accent-red hover:text-white transition-colors"
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
