import React from 'react'

export default function TitleBar({ onMenuToggle }) {
  return (
    <div className="h-12 flex items-center justify-between bg-black border-b border-white/5 flex-shrink-0 select-none px-4">
      {/* Left — hamburger + branding */}
      <div className="flex items-center gap-3">
        {/* Hamburger — only on mobile/tablet */}
        <button
          type="button"
          onClick={onMenuToggle}
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          title="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo + name */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#1877F2] rounded-full flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.883v2.252h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
            </svg>
          </div>
          <span className="text-sm font-semibold text-white/90">FB Marketplace Suite</span>
        </div>
      </div>
    </div>
  )
}
