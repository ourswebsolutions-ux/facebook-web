/**
 * GlobalTaskPoller — runs at the App level, survives tab switches.
 * Polls all running tasks in the Zustand store every 3 seconds.
 * Tasks are added by useGlobalTask hook.
 */
import { useEffect } from 'react'
import { useAppStore } from '../store'
import api from '../utils/api'

export default function GlobalTaskPoller() {
  const runningTasks   = useAppStore((s) => s.runningTasks)
  const setRunningTask = useAppStore((s) => s.setRunningTask)
  const removeRunningTask = useAppStore((s) => s.removeRunningTask)

  useEffect(() => {
    const ids = Object.keys(runningTasks).filter(
      (id) => !['completed','failed','cancelled'].includes(runningTasks[id]?.status)
    )
    if (!ids.length) return

    const timer = setTimeout(async () => {
      await Promise.all(ids.map(async (taskId) => {
        try {
          const data = await api.getTask(taskId)
          setRunningTask(taskId, { ...runningTasks[taskId], ...data })
          if (['completed','failed','cancelled'].includes(data.status)) {
            // Keep in store for 30s so UI can show final state, then remove
            setTimeout(() => removeRunningTask(taskId), 30000)
          }
        } catch {
          // ignore poll errors
        }
      }))
    }, 3000)

    return () => clearTimeout(timer)
  }, [runningTasks, setRunningTask, removeRunningTask])

  return null
}
