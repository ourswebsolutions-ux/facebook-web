/**
 * useGlobalTask — like useAutomationTask but task state lives in Zustand store.
 * Tab switches don't interrupt polling — GlobalTaskPoller handles it at app level.
 */
import { useState, useCallback } from 'react'
import { useAppStore } from '../store'
import api from '../utils/api'

export function useGlobalTask() {
  const setRunningTask    = useAppStore((s) => s.setRunningTask)
  const runningTasks      = useAppStore((s) => s.runningTasks)

  const [busy, setBusy]             = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [currentTaskId, setCurrentTaskId] = useState(null)

  const task = currentTaskId ? runningTasks[currentTaskId] : null

  const startTask = useCallback(async (route, payload = {}) => {
    setBusy(true)
    setStatusMessage('')
    setCurrentTaskId(null)
    try {
      const data = await api.startAutomation(route, payload)
      if (data?.task_id) {
        const taskId = data.task_id
        setCurrentTaskId(taskId)
        // Register in global store so poller picks it up
        setRunningTask(taskId, {
          taskId,
          route,
          status: 'running',
          progress: 0,
          total_steps: 0,
          completed_steps: 0,
          error: null,
          result: null,
        })
        setStatusMessage(data.message || 'Task started')
      } else {
        setStatusMessage(data?.message || JSON.stringify(data))
      }
      return data
    } catch (err) {
      const detail = err?.response?.data?.detail
      const msg = Array.isArray(detail)
        ? detail.map((e) => e.msg || JSON.stringify(e)).join('; ')
        : (typeof detail === 'string' ? detail : null) || err.message || 'Request failed'
      setStatusMessage(msg)
      throw err
    } finally {
      setBusy(false)
    }
  }, [setRunningTask])

  const cancelTask = useCallback(async () => {
    if (!currentTaskId) return
    try {
      await api.cancelTask(currentTaskId)
      setStatusMessage('Cancellation requested.')
    } catch {
      setStatusMessage('Failed to cancel.')
    }
  }, [currentTaskId])

  return {
    busy,
    statusMessage,
    setStatusMessage,
    task,
    taskId: currentTaskId,
    startTask,
    cancelTask,
  }
}
