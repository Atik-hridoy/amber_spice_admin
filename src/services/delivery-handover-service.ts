import { adminRequest } from './api-client'

export interface KitchenTicket {
  id: number; orderNumber: string; customerName: string; customerPhone: string
  deliveryAddress: string; deliveryPostalCode: string; notes: string; status: string
  items: { id: number; name: string; quantity: number; customizations: Record<string, unknown> }[]
  assignedRider: { id: number; name: string; phone: string } | null
  stage: string; canHandOver: boolean; bagCount: number; sealed: boolean
  handoverAt: string | null; handedOverBy: string; ticketCode: string
  pickupVerifiedAt: string | null; deliveryVerifiedAt: string | null
}
export interface HandoverPayload {
  rider_id: number; bag_count: number; items: { item_id: number; quantity: number }[]; sealed: boolean
}
export const deliveryHandoverService = {
  ticket: (id: string, signal?: AbortSignal) => adminRequest<KitchenTicket>(`orders/${id}/handover/`, { requireAuth: true, signal }),
  release: (id: string, payload: HandoverPayload) => adminRequest<KitchenTicket>(`orders/${id}/handover/`, { requireAuth: true, method: 'POST', body: JSON.stringify(payload) }),
}
