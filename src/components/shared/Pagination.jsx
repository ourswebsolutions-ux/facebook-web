/**
 * Shared Pagination component — smart ellipsis style
 * Shows: « 1 … 4 5 [6] 7 8 … 32 »
 */
export default function Pagination({ page, total, pageSize, onChange }) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  const getPages = () => {
    const delta = 2
    const pages = []
    const left  = Math.max(2, page - delta)
    const right = Math.min(totalPages - 1, page + delta)

    pages.push(1)
    if (left > 2) pages.push('...')
    for (let i = left; i <= right; i++) pages.push(i)
    if (right < totalPages - 1) pages.push('...')
    if (totalPages > 1) pages.push(totalPages)
    return pages
  }

  return (
    <div className="flex items-center justify-end px-5 py-3 border-t border-white/5 gap-1">
      {/* Count */}
      <span className="text-xs text-slate-500 mr-auto">
        {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} / {total}
      </span>

      {/* Prev */}
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400
                   hover:bg-white/10 disabled:opacity-30 transition-colors text-base"
      >
        ‹
      </button>

      {/* Page numbers */}
      {getPages().map((p, i) =>
        p === '...'
          ? <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-slate-600 text-sm select-none">…</span>
          : <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-all ${
                p === page
                  ? 'bg-accent-red text-white shadow shadow-red-900/40'
                  : 'text-slate-400 hover:bg-white/10'
              }`}
            >
              {p}
            </button>
      )}

      {/* Next */}
      <button
        type="button"
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400
                   hover:bg-white/10 disabled:opacity-30 transition-colors text-base"
      >
        ›
      </button>
    </div>
  )
}
