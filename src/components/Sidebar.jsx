import React, { useEffect, useState } from 'react'
import { useAppStore } from '../store'
import { FEATURE_SECTIONS } from '../config/features'

// ── Per-item border colors (cycling through colors like the client's screenshot)
const ITEM_COLORS = [
  { border: 'border-blue-500/70',   icon: 'text-blue-400',   hover: 'hover:border-blue-400' },
  { border: 'border-purple-500/70', icon: 'text-purple-400', hover: 'hover:border-purple-400' },
  { border: 'border-cyan-500/70',   icon: 'text-cyan-400',   hover: 'hover:border-cyan-400' },
  { border: 'border-green-500/70',  icon: 'text-green-400',  hover: 'hover:border-green-400' },
  { border: 'border-teal-500/70',   icon: 'text-teal-400',   hover: 'hover:border-teal-400' },
  { border: 'border-amber-500/70',  icon: 'text-amber-400',  hover: 'hover:border-amber-400' },
  { border: 'border-pink-500/70',   icon: 'text-pink-400',   hover: 'hover:border-pink-400' },
  { border: 'border-indigo-500/70', icon: 'text-indigo-400', hover: 'hover:border-indigo-400' },
]

// Assign a stable color per item id
const colorCache = {}
let colorCounter = 0
function getItemColor(id) {
  if (!colorCache[id]) {
    colorCache[id] = ITEM_COLORS[colorCounter % ITEM_COLORS.length]
    colorCounter++
  }
  return colorCache[id]
}

const ICONS = {
  dashboard: (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  activity: (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  settings: (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  accounts: (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  default: (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
}

function navIcon(id) {
  return ICONS[id] || ICONS.default
}

function Chevron({ open }) {
  return (
    <svg
      className={`w-3.5 h-3.5 shrink-0 text-slate-500 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}

function sectionContainsTab(section, tabId) {
  return section.items.some((item) => item.id === tabId)
}

export default function Sidebar({ open, onClose }) {
  const activeTab = useAppStore((s) => s.activeTab)
  const setTab = useAppStore((s) => s.setActiveTab)

  const handleTabClick = (id) => {
    setTab(id)
    onClose?.() // close sidebar on mobile after click
  }

  const [openSections, setOpenSections] = useState(() => {
    const initial = {}
    FEATURE_SECTIONS.forEach((section) => {
      initial[section.id] = sectionContainsTab(section, 'dashboard') || section.id === 'overview'
    })
    return initial
  })

  useEffect(() => {
    const owner = FEATURE_SECTIONS.find((s) => sectionContainsTab(s, activeTab))
    if (!owner) return
    setOpenSections((prev) => (prev[owner.id] ? prev : { ...prev, [owner.id]: true }))
  }, [activeTab])

  const toggleSection = (sectionId) => {
    setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full z-50 w-60 flex flex-col bg-black border-r border-white/5
        transform transition-transform duration-200 ease-out
        lg:static lg:translate-x-0 lg:z-auto lg:flex-shrink-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
      {/* Close button — mobile only */}
      <button
        type="button"
        onClick={onClose}
        className="lg:hidden absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors z-10"
        title="Close menu"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Branding header */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-accent-red flex items-center justify-center shrink-0 shadow shadow-red-900/50">
            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">FB Marketplace</div>
            <div className="text-sm font-bold text-white leading-tight">Automation Suite</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {FEATURE_SECTIONS.map((section) => {
          const open = !!openSections[section.id]
          const hasActive = sectionContainsTab(section, activeTab)

          return (
            <div key={section.id}>
              {/* Section header */}
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-150 mt-1
                  ${hasActive
                    ? 'text-white bg-white/5 border border-white/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
              >
                <Chevron open={open} />
                <span className="flex-1 text-left truncate">{section.label}</span>
                <span className={`text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full
                  ${hasActive ? 'bg-accent-red/20 text-red-400' : 'bg-white/8 text-slate-500'}`}>
                  {section.items.length}
                </span>
              </button>

              {/* Items */}
              <div className={`overflow-hidden transition-all duration-200 ease-out ${
                open ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="space-y-0.5 mb-1">
                  {section.items.map((item) => {
                    const isActive = activeTab === item.id
                    const color = getItemColor(item.id)

                    if (isActive) {
                      // Active → solid red button, no border
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleTabClick(item.id)}
                          title={item.label}
                          className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm font-semibold
                                     bg-accent-red text-white shadow shadow-red-900/50 transition-all duration-150"
                        >
                          <span className="text-white">{navIcon(item.id)}</span>
                          <span className="truncate">{item.label}</span>
                        </button>
                      )
                    }

                    // Inactive → transparent bg, colored border, matching icon color
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleTabClick(item.id)}
                        title={item.label}
                        className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm font-medium
                                   border bg-transparent text-slate-300
                                   hover:bg-white/5 hover:text-white
                                   transition-all duration-150
                                   ${color.border} ${color.hover}`}
                      >
                        <span className={color.icon}>{navIcon(item.id)}</span>
                        <span className="truncate">{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-ping-slow shrink-0" />
          <span className="text-xs text-slate-400 truncate">System Ready</span>
        </div>
      </div>
    </aside>
    </>
  )
}
