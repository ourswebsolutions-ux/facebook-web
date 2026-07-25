import React, { useEffect, useState } from 'react'
import api from '../utils/api'

export default function TaskMonitor({ taskId, onComplete }) {
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(Boolean(taskId))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!taskId) return

    let cancelled = false
    let intervalId

    const poll = async () => {
      try {
        const data = await api.getTask(taskId)
        if (!cancelled) {
          setTask(data)
          setLoading(false)
          if (data.status && !['queued', 'running', 'pending'].includes(data.status)) {
            if (onComplete) onComplete(data)
            clearInterval(intervalId)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError('Unable to load task status')
          setLoading(false)
        }
      }
    }

    poll()
    intervalId = setInterval(poll, 2500)

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [taskId, onComplete])

  if (!taskId) return null

  return (
    <div className="card space-y-3">
      <h3 className="text-sm font-semibold text-slate-300">Task Monitor</h3>
      {loading && <div className="text-sm text-slate-400">Starting task…</div>}
      {error && <div className="text-sm text-amber-200">{error}</div>}
      {task && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Status</span>
            <span className="badge-blue">{task.status}</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-accent-green transition-all" style={{ width: `${task.progress || 0}%` }} />
          </div>
          <div className="text-xs text-slate-500">
            Progress: {task.progress || 0}% • {task.completed_steps || 0}/{task.total_steps || 0}
          </div>
          {task.error ? <div className="text-xs text-red-300">{task.error}</div> : null}
        </div>
      )}
    </div>
  )
}
