import React, { useState } from 'react'
import { DEMO_USERS, PERMISSIONS } from '../../data/demoData'
import Pagination from '../shared/Pagination'

const PAGE_SIZE = 8

export default function UsersView() {
  const [users] = useState(DEMO_USERS)
  const [role, setRole]   = useState('Operator')
  const [page, setPage]   = useState(1)

  const paginated = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">User Management</h1>
            <p className="text-sm text-slate-400 mt-1">
              Multiple users, roles & permissions for the admin dashboard.
            </p>
          </div>
          <button type="button" className="btn-primary">Add User</button>
        </div>

        <div className="card overflow-hidden p-0">
          <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">
              Users
              <span className="ml-2 text-xs font-medium text-slate-500 bg-white/8 px-2 py-0.5 rounded-full">{users.length}</span>
            </h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-white/5 bg-white/2">
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginated.map((u) => (
                <tr key={u.id} className="hover:bg-white/3 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-red/40 to-red-900/60 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {(u.name || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-medium">{u.name}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-300">{u.role}</td>
                  <td className="px-4 py-3.5">
                    <span className={u.status === 'active' ? 'badge-green' : 'badge-red'}>{u.status}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <button type="button"
                      className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/8 transition-all">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} total={users.length} pageSize={PAGE_SIZE} onChange={setPage} />
        </div>

        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-slate-300">Role Permissions</h3>
          <div className="flex gap-2 flex-wrap">
            {['Admin', 'Operator', 'Viewer'].map((r) => (
              <button key={r} type="button" onClick={() => setRole(r)}
                className={role === r ? 'btn-primary' : 'btn-secondary'}>{r}</button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {PERMISSIONS.map((p) => (
              <label key={p} className="flex items-center gap-2 text-sm text-slate-300 px-2 py-1.5 rounded-lg hover:bg-white/5">
                <input type="checkbox"
                  defaultChecked={role === 'Admin' || (role === 'Operator' && !p.includes('users'))}
                  disabled={role === 'Viewer' && p !== 'View activity logs'} />
                {p}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
