import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Custom React hook for establishing and maintaining a real-time WebSocket connection.
 * Supports auto-reconnection, event subscription, ping/pong heartbeats, and status tracking.
 */
export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState(null)

  const socketRef = useRef(null)
  const listenersRef = useRef(new Map())
  const reconnectTimeoutRef = useRef(null)
  const pingIntervalRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)

  // Calculate WebSocket URL
  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    // If running under Vite dev server or production, use relative host or 127.0.0.1:8000
    const host = window.location.host
    if (host.includes('5173') || host.includes('3000')) {
      return `${protocol}//127.0.0.1:8000/api/ws`
    }
    return `${protocol}//${host}/api/ws`
  }, [])

  // Subscribe to specific event types
  const subscribe = useCallback((eventType, callback) => {
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, new Set())
    }
    listenersRef.current.get(eventType).add(callback)

    return () => {
      if (listenersRef.current.has(eventType)) {
        listenersRef.current.get(eventType).delete(callback)
      }
    }
  }, [])

  // Dispatch incoming WebSocket messages to subscribers
  const handleMessage = useCallback((event) => {
    try {
      const payload = JSON.parse(event.data)
      if (payload.type === 'pong') return

      const { type, data } = payload
      if (type && listenersRef.current.has(type)) {
        listenersRef.current.get(type).forEach((cb) => {
          try {
            cb(data)
          } catch (err) {
            console.error(`[WebSocket] Listener error for event '${type}':`, err)
          }
        })
      }
    } catch (err) {
      console.warn('[WebSocket] Received non-JSON message:', event.data)
    }
  }, [])

  // Connect / Reconnect handler
  const connect = useCallback(() => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return
    }

    const wsUrl = getWebSocketUrl()
    console.log(`[WebSocket] Connecting to ${wsUrl}...`)

    try {
      const ws = new WebSocket(wsUrl)
      socketRef.current = ws

      ws.onopen = () => {
        console.log('[WebSocket] Connected successfully')
        setIsConnected(true)
        setConnectionError(null)
        reconnectAttemptsRef.current = 0

        // Start 30s ping heartbeat
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current)
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping')
          }
        }, 60000)
      }

      ws.onmessage = handleMessage

      ws.onerror = (err) => {
        console.warn('[WebSocket] Error encountered:', err)
        setConnectionError('WebSocket connection error')
      }

      ws.onclose = (event) => {
        console.log(`[WebSocket] Connection closed (code: ${event.code})`)
        setIsConnected(false)
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current)

        // Exponential backoff reconnect: min 1s, max 10s
        const timeout = Math.min(1000 * Math.pow(1.5, reconnectAttemptsRef.current), 10000)
        reconnectAttemptsRef.current += 1
        console.log(`[WebSocket] Scheduling reconnect in ${Math.round(timeout / 1000)}s...`)

        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, timeout)
      }
    } catch (err) {
      console.error('[WebSocket] Instantiation failed:', err)
      setConnectionError('Failed to initialize WebSocket')
    }
  }, [getWebSocketUrl, handleMessage])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current)
      if (socketRef.current) {
        socketRef.current.onclose = null // Prevent triggering reconnect on unmount
        socketRef.current.close()
      }
    }
  }, [connect])

  return {
    isConnected,
    connectionError,
    subscribe,
  }
}
