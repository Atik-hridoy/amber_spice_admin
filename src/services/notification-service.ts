/**
 * Service to manage REST notifications for Amber Spice operations.
 */

import { adminRequest } from './api-client'

export interface OperationalNotification {
  id: number
  type: 'order_created' | 'order_status' | 'kitchen_alert' | 'kitchen_ready' | 'stock_alert' | 'general'
  title: string
  message: string
  targetRole: string
  orderId?: number | null
  data?: Record<string, unknown>
  isRead: boolean
  createdAt: string
}

interface NotificationListResponse {
  count?: number
  results: OperationalNotification[]
}

export const notificationService = {
  async list(unreadOnly = false, signal?: AbortSignal): Promise<OperationalNotification[]> {
    const endpoint = unreadOnly ? 'notifications/?unread=true' : 'notifications/'
    const res = await adminRequest<NotificationListResponse | OperationalNotification[]>(endpoint, {
      requireAuth: true,
      signal,
    })
    if (Array.isArray(res)) return res
    if (res && Array.isArray(res.results)) return res.results
    return []
  },

  async markAsRead(id: number | string): Promise<OperationalNotification> {
    return adminRequest<OperationalNotification>(`notifications/${id}/read/`, {
      method: 'PATCH',
      requireAuth: true,
      body: JSON.stringify({ is_read: true }),
    })
  },

  async markAllRead(): Promise<{ message: string; markedCount: number }> {
    return adminRequest<{ message: string; markedCount: number }>('notifications/mark-all-read/', {
      method: 'POST',
      requireAuth: true,
    })
  },
}
