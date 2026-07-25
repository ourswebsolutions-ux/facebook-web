import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useAppStore } from '../../store'
import api from '../../utils/api'
import { useWebSocket } from '../../hooks/useWebSocket'

function StatusBadge({ status }) {
  const map = {
    sent: 'badge-green',
    pending: 'badge-amber',
    failed: 'badge-red',
    skipped: 'badge-amber',
    read: 'badge-green',
    unread: 'badge-blue',
    completed: 'badge-green',
    running: 'badge-blue',
    queued: 'badge-amber',
    cancelled: 'badge-amber',
  }
  return <span className={map[status] || 'badge-amber'}>{status || 'unknown'}</span>
}

function TaskProgress({ task, logs, onCancel }) {
  if (!task) return null

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300">Task Progress</h3>
        <StatusBadge status={task.status} />
      </div>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent-green transition-all duration-300"
          style={{ width: `${task.progress || 0}%` }}
        />
      </div>
      <div className="text-xs text-slate-500">
        Progress: {task.progress || 0}% — {task.completed_steps || 0}/{task.total_steps || 0} steps
      </div>
      {task.error && <div className="text-xs text-red-300">{task.error}</div>}
      {task.result && (
        <div className="text-xs text-slate-400">
          Result: {JSON.stringify(task.result)}
        </div>
      )}
      {logs.length > 0 && (
        <div className="max-h-24 overflow-y-auto text-xs space-y-0.5 bg-white/5 rounded p-2">
          {logs.map((log, i) => (
            <div key={log.id || i} className="text-slate-400">
              <span className={log.status === 'failed' ? 'text-red-300' : log.status === 'success' ? 'text-accent-green' : 'text-slate-400'}>
                [{log.action}]
              </span>
              {' '}{log.details ? Object.entries(log.details).map(([k, v]) => `${k}=${v}`).join(' ') : ''}
              {log.error ? <span className="text-red-300"> ERROR: {log.error}</span> : ''}
            </div>
          ))}
        </div>
      )}
      {(task.status === 'running' || task.status === 'pending' || task.status === 'queued') && onCancel && (
        <button type="button" className="btn-danger text-xs py-1" onClick={onCancel}>
          Cancel Task
        </button>
      )}
    </div>
  )
}

export default function InboxView() {
  const selectedAccountIds = useAppStore((s) => s.selectedAccountIds)
  const runningTasks    = useAppStore((s) => s.runningTasks)
  const setRunningTask  = useAppStore((s) => s.setRunningTask)
  const pageSessions    = useAppStore((s) => s.pageSessions)
  const setPageSession  = useAppStore((s) => s.setPageSession)

  const INBOX_KEY = 'inbox'
  const taskId    = pageSessions[INBOX_KEY]?.taskId || null
  const task      = taskId ? (runningTasks[taskId] || null) : null
  const setTaskId = (id) => setPageSession(INBOX_KEY, { taskId: id })

  const [messages, setMessages] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [searchAccount, setSearchAccount] = useState('')

  const [taskLogs, setTaskLogs] = useState([])
  const [taskBusy, setTaskBusy] = useState(false)
  const pollRef = useRef(null)
  const messageListRef = useRef(null)

  // Real-time WebSocket hook
  const { isConnected, subscribe } = useWebSocket()

  const loadAccounts = useCallback(async () => {
    try {
      const data = await api.getAccounts()
      setAccounts(data)
    } catch (err) {
      // accounts will stay empty
    }
  }, [])

  const loadMessages = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const params = { limit: 50, include_unassigned: !selectedAccountId }
      if (selectedAccountId) params.account_id = selectedAccountId
      if (filterStatus) params.reply_status = filterStatus
      const data = await api.getInboxMessages(params)
      setMessages(data)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Unable to load inbox messages. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }, [selectedAccountId, filterStatus])

  // Real-time WebSocket Message Handlers
  const handleNewMessage = useCallback((newMsg) => {
    setMessages((prev) => {
      // Deduplicate by ID
      if (prev.some((m) => m.id === newMsg.id)) {
        return prev
      }
      // Account filter check: if an account is selected and msg has an account_id, must match
      if (selectedAccountId && newMsg.account_id && newMsg.account_id !== selectedAccountId) {
        return prev
      }
      // Status filter check
      if (filterStatus && newMsg.reply_status !== filterStatus) {
        return prev
      }

      const next = [newMsg, ...prev]

      // Auto-scroll logic: scroll to top if user is near top/bottom
      if (messageListRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = messageListRef.current
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
        const isAtTop = scrollTop < 50
        if (isAtTop || isAtBottom) {
          setTimeout(() => {
            if (messageListRef.current) {
              messageListRef.current.scrollTop = 0
            }
          }, 50)
        }
      }

      return next
    })
  }, [selectedAccountId, filterStatus])

  const handleMessageUpdated = useCallback((updatedMsg) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m))
    )
  }, [])

  useEffect(() => {
    const unsubNew = subscribe('NEW_MESSAGE', handleNewMessage)
    const unsubUpdate = subscribe('MESSAGE_UPDATED', handleMessageUpdated)
    return () => {
      unsubNew()
      unsubUpdate()
    }
  }, [subscribe, handleNewMessage, handleMessageUpdated])

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  // Poll task — stores result in Zustand so it survives tab switches
  useEffect(() => {
    if (!taskId) return

    const poll = async () => {
      try {
        const [data, logs] = await Promise.all([
          api.getTask(taskId),
          api.getTaskLogs(taskId, 20).catch(() => []),
        ])
        setRunningTask(taskId, data)
        if (logs.length > 0) setTaskLogs(logs)

        if (data.status === 'running' || data.status === 'pending' || data.status === 'queued') {
          setActionMessage(`Task ${data.status} — ${data.completed_steps || 0}/${data.total_steps || 0} steps`)
          pollRef.current = setTimeout(poll, 2000)
        } else {
          setTaskBusy(false)
          if (data.status === 'completed') {
            setActionMessage(`✅ Task completed — ${data.result?.messages_read || data.completed_steps || 0} messages processed.`)
          } else if (data.status === 'failed') {
            setActionMessage(`❌ Task failed: ${data.error || 'Unknown error'}`)
          } else if (data.status === 'cancelled') {
            setActionMessage('Task cancelled.')
          }
        }
      } catch (err) {
        setTaskBusy(false)
        setActionMessage('Unable to fetch task status. The task may still be running in the background.')
      }
    }

    poll()

    return () => {
      if (pollRef.current) clearTimeout(pollRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId])

  const getActiveAccountId = () => {
    if (selectedAccountId) return selectedAccountId
    const verified = accounts.find((acc) => acc.cookies)
    if (verified) return verified.id
    if (accounts.length > 0) return accounts[0].id
    return null
  }

  const readInbox = async () => {
    const targetAccountId = getActiveAccountId()
    if (!targetAccountId) {
      setActionMessage('Please add an account first in Accounts view.')
      return
    }
    
    const selectedAccount = accounts.find(acc => acc.id === targetAccountId)
    if (!selectedAccount?.cookies) {
      setActionMessage('⚠️ Account is not verified. Please verify the account first in Accounts view.')
      return
    }
    
    setTaskBusy(true)
    setTask(null)
    setTaskLogs([])
    setActionMessage('Opening browser to read Facebook Marketplace inbox...')
    try {
      const data = await api.readInbox({ account_id: targetAccountId, max_messages: 20 })
      if (data.task_id) {
        setTaskId(data.task_id)
        setRunningTask(data.task_id, { status: 'running', progress: 0, completed_steps: 0, total_steps: 0 })
      }
    } catch (err) {
      setTaskBusy(false)
      setActionMessage(err?.response?.data?.detail || 'Read inbox request failed')
    }
  }

  const autoReply = async () => {
    const targetAccountId = getActiveAccountId()
    if (!targetAccountId) {
      setActionMessage('Please add an account first in Accounts view.')
      return
    }
    
    const selectedAccount = accounts.find(acc => acc.id === targetAccountId)
    if (!selectedAccount?.cookies) {
      setActionMessage('⚠️ Account is not verified. Please verify the account first in Accounts view.')
      return
    }
    
    setTaskBusy(true)
    setTask(null)
    setTaskLogs([])
    setActionMessage('Opening browser for auto-reply...')
    try {
      const payload = {
        account_id: targetAccountId,
        max_replies: 10,
        tone: 'friendly',
        custom_instructions: 'Reply politely',
        delay_seconds: 5,
      }
      if (selectedId) payload.message_ids = [selectedId]
      const data = await api.autoReplyInbox(payload)
      if (data.task_id) {
        setTaskId(data.task_id)
        setRunningTask(data.task_id, { status: 'running', progress: 0, completed_steps: 0, total_steps: 0 })
      }
    } catch (err) {
      setTaskBusy(false)
      setActionMessage(err?.response?.data?.detail || 'Auto-reply request failed')
    }
  }

  const cancelTask = async () => {
    if (!taskId) return
    try {
      await api.cancelTask(taskId)
      setActionMessage('Task cancellation requested.')
    } catch (err) {
      setActionMessage('Failed to cancel task.')
    }
  }

  const handleReply = async () => {
    if (!selectedId) {
      setActionMessage('Select a message first.')
      return
    }
    if (!replyText.trim()) {
      setActionMessage('Enter a reply before sending.')
      return
    }
    setActionMessage('Sending manual reply…')
    try {
      const result = await api.replyInboxMessage(selectedId, { reply_text: replyText })
      setActionMessage(`Reply ${result.reply_status === 'sent' ? 'sent successfully' : 'failed to send'}.`)
      setReplyText('')
    } catch (err) {
      setActionMessage(err?.response?.data?.detail || 'Reply failed')
    }
  }

  const handleDeleteMessage = async (id) => {
    setDeletingId(id)
    try {
      await api.deleteInboxMessage(id)
      setActionMessage('Message deleted.')
      if (selectedId === id) setSelectedId(null)
      setMessages((prev) => prev.filter((m) => m.id !== id))
    } catch (err) {
      setActionMessage(err?.response?.data?.detail || 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  const selectedMessage = messages.find((m) => m.id === selectedId)

  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">Inbox</h1>
              <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${isConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                {isConnected ? 'Real-Time Live' : 'Connecting...'}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Read Facebook Marketplace messages and send AI-powered or manual replies in real-time.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary" onClick={loadMessages} disabled={loading}>
              {loading ? 'Loading…' : 'Refresh'}
            </button>
            <button type="button" className="btn-primary" onClick={readInbox} disabled={taskBusy}>
              {taskBusy ? 'Working…' : 'Read Inbox'}
            </button>
            <button type="button" className="btn-primary" onClick={autoReply} disabled={taskBusy}>
              Auto Reply
            </button>
          </div>
        </div>

        {/* Account & Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider whitespace-nowrap">Account</span>
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="input pl-8 py-1.5 text-sm w-48"
                placeholder="Search accounts…"
                value={searchAccount}
                onChange={(e) => setSearchAccount(e.target.value)}
              />
            </div>
            <div className="relative">
              <select
                className="input py-1.5 text-sm w-56"
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                size={1}
              >
                <option value="">All accounts</option>
                {accounts
                  .filter((acc) => !searchAccount || (acc.email || acc.phone || '').toLowerCase().includes(searchAccount.toLowerCase()))
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.email || acc.phone} {acc.cookies ? '✓' : '⚠'}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-400">
            <span className="text-xs uppercase tracking-wider">Status</span>
            <select
              className="input py-1.5 text-sm w-auto"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="skipped">Skipped</option>
            </select>
          </label>
        </div>

        {/* Error */}
        {error ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">{error}</div>
        ) : null}

        {/* Action Status */}
        {actionMessage ? (
          <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-slate-300">{actionMessage}</div>
        ) : null}

        {/* Task Progress */}
        <TaskProgress task={task} logs={taskLogs} onCancel={cancelTask} />
        {task && ['running','pending','queued'].includes(task.status) && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-3 py-2 text-[11px] text-emerald-300">
            ✅ Task is running — progress updates even when you switch tabs.
          </div>
        )}

        {/* Main Grid */}
        <div className="grid lg:grid-cols-[1.4fr_0.6fr] gap-4">
          {/* Messages List */}
          <div className="card overflow-hidden p-0">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-300">Messages</h3>
              <span className="text-xs text-slate-500">{loading ? 'Loading…' : `${messages.length} messages`}</span>
            </div>
            {loading ? (
              <div className="px-4 py-3 text-sm text-slate-400">Loading messages…</div>
            ) : messages.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-slate-400 mb-2">No inbox messages found.</p>
                <p className="text-xs text-slate-500">
                  Click <strong className="text-slate-300">Read Inbox</strong> above to fetch messages from Facebook Marketplace.
                  This will open a browser, log into the selected account, and save messages here.
                </p>
              </div>
            ) : (
              <div ref={messageListRef} className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer ${selectedId === msg.id ? 'bg-white/5' : ''}`}
                    onClick={() => setSelectedId(msg.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-white font-medium truncate">
                          {msg.sender_name || 'Unknown sender'}
                        </span>
                        <StatusBadge status={msg.reply_status} />
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {msg.message_text || 'No message content'}
                      </p>
                      <div className="text-xs text-slate-600 mt-1">
                        {msg.created_at ? new Date(msg.created_at).toLocaleString() : 'Unknown time'}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-danger text-xs py-1 px-2 shrink-0"
                      disabled={deletingId === msg.id}
                      onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id) }}
                    >
                      {deletingId === msg.id ? '…' : 'Delete'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Panel — Message Detail & Reply */}
          <div className="space-y-4">
            <div className="card space-y-3">
              <h3 className="text-sm font-semibold text-slate-300">Message Detail</h3>
              {selectedMessage ? (
                <>
                  <div className="text-sm">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">From</div>
                    <div className="text-white">{selectedMessage.sender_name || 'Unknown'}</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Message</div>
                    <div className="text-slate-300 bg-white/5 rounded-lg p-3 text-sm">
                      {selectedMessage.message_text || 'No content'}
                    </div>
                  </div>
                  {selectedMessage.reply_text && (
                    <div className="text-sm">
                      <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Previous Reply</div>
                      <div className="text-slate-400 bg-white/5 rounded-lg p-3 text-xs">
                        {selectedMessage.reply_text}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">Reply status:</span>
                    <StatusBadge status={selectedMessage.reply_status} />
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">Select a message from the list to view details.</p>
              )}
            </div>

            <div className="card space-y-3">
              <h3 className="text-sm font-semibold text-slate-300">Manual Reply</h3>
              <textarea
                rows={5}
                className="input resize-none"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type a reply message…"
                disabled={!selectedId}
              />
              <button
                type="button"
                className="btn-secondary w-full"
                onClick={handleReply}
                disabled={!selectedId}
              >
                Send Reply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
