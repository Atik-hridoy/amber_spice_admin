import { adminRequest } from './api-client'

export interface DeliveryContactMessage {
  id: number; senderRole: string; senderName: string; body: string; createdAt: string
}
interface MessagePage { messages: DeliveryContactMessage[]; hasMore: boolean; nextAfterId: number }

export const deliveryContactService = {
  async messages(orderId: string, signal?: AbortSignal): Promise<DeliveryContactMessage[]> {
    const messages: DeliveryContactMessage[] = []
    let cursor = 0
    while (true) {
      const page = await adminRequest<MessagePage>(`orders/${orderId}/delivery/contact/messages/?after_id=${cursor}`, { requireAuth: true, signal })
      if (!Array.isArray(page.messages)) throw new Error('Invalid delivery conversation response.')
      messages.push(...page.messages)
      if (!page.hasMore) return messages
      if (page.nextAfterId <= cursor) throw new Error('Message pagination did not advance.')
      cursor = page.nextAfterId
    }
  },
}
