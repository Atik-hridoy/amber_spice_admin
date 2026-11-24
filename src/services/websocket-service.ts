/**
 * Real-time WebSocket connection manager for Amber Spice Admin & Kitchen.
 * Manages operations feed, auto-reconnect, keepalive pings, and event dispatch.
 */

import { ADMIN_API_BASE_URL } from './endpoints/base-url'

export type WebSocketChannel = 'operations' | 'kitchen'

export interface WebSocketEventMap {
  'connection.established': { channel: string; user: string; role: string }
  'order.created': { order: Record<string, unknown>; notification?: Record<string, unknown> }
  'order.status_updated': { order: Record<string, unknown>; notification?: Record<string, unknown> }
  'kitchen.ticket_received': { ticket: Record<string, unknown>; notification?: Record<string, unknown> }
  'kitchen.ticket_updated': { ticket: Record<string, unknown>; notification?: Record<string, unknown> }
  'customer.arrived': { order: Record<string, unknown>; notification?: Record<string, unknown> }
  'reservation.created': { reservation: Record<string, unknown>; notification?: Record<string, unknown> }
  'reservation.guest_arrived': { reservation: Record<string, unknown>; notification?: Record<string, unknown> }
  'reservation.status_updated': { reservation: Record<string, unknown>; notification?: Record<string, unknown> }
  'contact.message_created': { message: Record<string, unknown>; notification?: Record<string, unknown> }
  'stock.alert': { alert: Record<string, unknown> }
  'connection.status': { connected: boolean; reconnecting: boolean }
}

export type WebSocketEventHandler<T = unknown> = (data: T) => void

class WebSocketService {
  private socket: WebSocket | null = null
  private channel: WebSocketChannel = 'operations'
  private token: string | null = null
  private pingInterval: number | null = null
  private reconnectTimeout: number | null = null
  private reconnectAttempts = 0
  private maxReconnectDelay = 10000
  private isExplicitlyClosed = false
  private listeners: Map<string, Set<WebSocketEventHandler>> = new Map()

  /**
   * Derives ws:// or wss:// URL from the configured API base URL.
   */
  public getWebSocketUrl(channel: WebSocketChannel = 'operations', token?: string | null): string {
    const apiUrl = new URL(ADMIN_API_BASE_URL)
    const protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = apiUrl.host
    const path = `/ws/${channel}/`
    const url = new URL(`${protocol}//${host}${path}`)
    if (token) {
      url.searchParams.set('token', token)
    }
    return url.toString()
  }

  /**
   * Connects to the WebSocket channel with the user's access token.
   */
  public connect(channel: WebSocketChannel = 'operations', token?: string | null) {
    if (typeof window === 'undefined') return

    this.channel = channel
    this.token = token || localStorage.getItem('admin_access_token')
    this.isExplicitlyClosed = false

    // Close any previous socket cleanly
    if (this.socket) {
      this.clearTimers()
      try {
        this.socket.close()
      } catch {
        // ignore
      }
      this.socket = null
    }

    const wsUrl = this.getWebSocketUrl(channel, this.token)
    try {
      this.socket = new WebSocket(wsUrl)
    } catch (err) {
      console.warn('Failed to construct WebSocket:', err)
      this.scheduleReconnect()
      return
    }

    this.socket.onopen = () => {
      this.reconnectAttempts = 0
      this.emit('connection.status', { connected: true, reconnecting: false })
      this.startPing()
    }

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'pong') return
        if (data.type) {
          this.emit(data.type, data)
        }
      } catch (err) {
        console.warn('Invalid JSON from WebSocket:', err)
      }
    }

    this.socket.onerror = () => {
      this.emit('connection.status', { connected: false, reconnecting: true })
    }

    this.socket.onclose = (event) => {
      this.clearTimers()
      this.emit('connection.status', { connected: false, reconnecting: !this.isExplicitlyClosed })
      if (!this.isExplicitlyClosed && event.code !== 4003) {
        this.scheduleReconnect()
      }
    }
  }

  /**
   * Disconnects and stops reconnect loops.
   */
  public disconnect() {
    this.isExplicitlyClosed = true
    this.clearTimers()
    if (this.socket) {
      try {
        this.socket.close()
      } catch {
        // ignore
      }
      this.socket = null
    }
    this.emit('connection.status', { connected: false, reconnecting: false })
  }

  /**
   * Subscribes to a WebSocket event. Returns an unsubscribe function.
   */
  public on<K extends keyof WebSocketEventMap>(
    event: K,
    handler: WebSocketEventHandler<WebSocketEventMap[K]>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    const handlers = this.listeners.get(event)!
    handlers.add(handler as WebSocketEventHandler)

    return () => {
      handlers.delete(handler as WebSocketEventHandler)
    }
  }

  private emit(event: string, data: unknown) {
    const handlers = this.listeners.get(event)
    if (handlers) {
      handlers.forEach((fn) => {
        try {
          fn(data)
        } catch (err) {
          console.error(`Error in WebSocket listener for ${event}:`, err)
        }
      })
    }
  }

  private startPing() {
    this.clearTimers()
    this.pingInterval = window.setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'ping' }))
      }
    }, 25000)
  }

  private clearTimers() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
  }

  private scheduleReconnect() {
    if (this.isExplicitlyClosed) return
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), this.maxReconnectDelay)
    this.reconnectAttempts++
    this.reconnectTimeout = window.setTimeout(() => {
      if (!this.isExplicitlyClosed) {
        this.connect(this.channel, this.token)
      }
    }, delay)
  }
}

export const websocketService = new WebSocketService()
