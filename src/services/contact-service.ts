import { adminRequest } from './api-client'
import type { ContactMessage } from '../types/contact'

interface ContactMessageListResponse {
  count?: number
  results: ContactMessage[]
}

export const contactService = {
  async list(status?: string, signal?: AbortSignal): Promise<ContactMessage[]> {
    const endpoint = status ? `contact/messages/?status=${status}` : 'contact/messages/'
    const res = await adminRequest<ContactMessageListResponse | ContactMessage[]>(endpoint, {
      requireAuth: true,
      signal,
    })
    if (Array.isArray(res)) return res
    if (res && Array.isArray(res.results)) return res.results
    return []
  },

  async get(id: number | string, signal?: AbortSignal): Promise<ContactMessage> {
    return adminRequest<ContactMessage>(`contact/messages/${id}/`, {
      requireAuth: true,
      signal,
    })
  },

  async updateStatus(id: number | string, status: 'new' | 'read' | 'resolved'): Promise<ContactMessage> {
    return adminRequest<ContactMessage>(`contact/messages/${id}/`, {
      method: 'PATCH',
      requireAuth: true,
      body: JSON.stringify({ status }),
    })
  },

  async delete(id: number | string): Promise<void> {
    await adminRequest(`contact/messages/${id}/`, {
      method: 'DELETE',
      requireAuth: true,
    })
  },
}
