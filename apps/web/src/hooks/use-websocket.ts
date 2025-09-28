'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
}

export interface WebSocketOptions {
  url: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: Event) => void
  onMessage?: (message: WebSocketMessage) => void
}

export interface WebSocketHook {
  isConnected: boolean
  isConnecting: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  sendMessage: (message: any) => boolean
  lastMessage: WebSocketMessage | null
  error: Event | null
}

export function useWebSocket({
  url,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5,
  onOpen,
  onClose,
  onError,
  onMessage,
}: WebSocketOptions): WebSocketHook {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<WebSocketHook['connectionStatus']>('disconnected')
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const [error, setError] = useState<Event | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    setIsConnecting(true)
    setConnectionStatus('connecting')
    setError(null)

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        setIsConnecting(false)
        setConnectionStatus('connected')
        reconnectAttemptsRef.current = 0
        onOpen?.()
      }

      ws.onclose = () => {
        setIsConnected(false)
        setIsConnecting(false)
        setConnectionStatus('disconnected')
        onClose?.()

        // Attempt to reconnect if we haven't exceeded max attempts
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectInterval)
        }
      }

      ws.onerror = (event) => {
        setError(event)
        setIsConnecting(false)
        setConnectionStatus('error')
        onError?.(event)
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          setLastMessage(message)
          onMessage?.(message)
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }
    } catch (err) {
      setIsConnecting(false)
      setConnectionStatus('error')
      console.error('Failed to create WebSocket connection:', err)
    }
  }, [url, maxReconnectAttempts, reconnectInterval, onOpen, onClose, onError, onMessage])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setIsConnected(false)
    setIsConnecting(false)
    setConnectionStatus('disconnected')
  }, [])

  const sendMessage = useCallback((message: any): boolean => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        const messageToSend = {
          ...message,
          timestamp: new Date().toISOString(),
        }
        wsRef.current.send(JSON.stringify(messageToSend))
        return true
      } catch (err) {
        console.error('Failed to send WebSocket message:', err)
        return false
      }
    }
    return false
  }, [])

  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    isConnected,
    isConnecting,
    connectionStatus,
    sendMessage,
    lastMessage,
    error,
  }
}

// Dashboard-specific WebSocket hook for real-time updates
export function useDashboardWebSocket() {
  const [kpiUpdates, setKpiUpdates] = useState<any>(null)
  const [activityUpdates, setActivityUpdates] = useState<any>(null)
  const [clientUpdates, setClientUpdates] = useState<any>(null)

  const { isConnected, connectionStatus, lastMessage } = useWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws',
    onMessage: (message) => {
      switch (message.type) {
        case 'kpi_update':
          setKpiUpdates(message.data)
          break
        case 'activity_update':
          setActivityUpdates(message.data)
          break
        case 'client_update':
          setClientUpdates(message.data)
          break
        default:
          console.log('Unhandled message type:', message.type)
      }
    },
  })

  return {
    isConnected,
    connectionStatus,
    kpiUpdates,
    activityUpdates,
    clientUpdates,
    lastMessage,
  }
}

// Auto-refresh hook for periodic data updates
export function useAutoRefresh(callback: () => void, interval: number = 30000) {
  const callbackRef = useRef(callback)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    const tick = () => {
      callbackRef.current()
    }

    // Initial call
    tick()

    // Set up interval
    intervalRef.current = setInterval(tick, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [interval])

  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }
}