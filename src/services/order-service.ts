import type { Order, OrderStatus } from '../types/admin'
import { adminRequest } from './api-client'
import { AdminApiError } from './api-error'
import { API_ENDPOINTS } from './endpoints/api-endpoints'

interface PaginatedOrdersResponse {
  count?: number
  next?: string | null
  previous?: string | null
  results: Record<string, unknown>[]
}

function mapOrderFromApi(raw: Record<string, unknown>): Order {
  const items = Array.isArray(raw.items)
    ? (raw.items as Record<string, unknown>[]).map((item) => {
        let customs: string[] = []
        if (Array.isArray(item.customizations)) {
          customs = item.customizations.map(String)
        } else if (item.customizations && typeof item.customizations === 'object') {
          customs = Object.entries(item.customizations).map(([k, v]) => `${k}: ${v}`)
        }

        return {
          id: String(item.id ?? ''),
          name: String(item.name ?? 'Item'),
          quantity: Number(item.quantity) || 1,
          price: Number(item.price) || 0,
          station: (item.station as 'biryani' | 'curry' | 'grill' | 'breads' | 'dessert') || 'curry',
          customizations: customs,
        }
      })
    : []

  const staff = raw.assignedDeliveryStaff as { id: number; name: string; phone?: string } | null | undefined

  return {
    id: String(raw.id ?? ''),
    orderNumber: String(raw.orderNumber || `ORD-${raw.id}`),
    customerName: String(raw.customerName || 'Customer'),
    customerPhone: raw.customerPhone ? String(raw.customerPhone) : undefined,
    diningType: (raw.diningType as 'dine-in' | 'takeaway' | 'delivery') || 'dine-in',
    tableNumber: raw.tableNumber ? String(raw.tableNumber) : undefined,
    status: String(raw.status).replace('out_for_delivery', 'out-for-delivery') as OrderStatus,
    items,
    totalAmount: Number(raw.totalAmount) || 0,
    subtotal: Number(raw.subtotal),
    tax: Number(raw.tax),
    deliveryFee: Number(raw.deliveryFee ?? raw.delivery_fee),
    discountAmount: Number(raw.discountAmount ?? 0),
    couponCode: String(raw.couponCode || ''),
    scheduledFor: raw.scheduledFor ? String(raw.scheduledFor) : null,
    paymentStatus: (raw.paymentStatus as 'paid' | 'pending' | 'refunded') || 'pending',
    paymentMethod: (raw.paymentMethod as 'card' | 'cash' | 'apple-pay') || 'card',
    createdAt: String(raw.createdAt || new Date().toISOString()),
    estimatedTimeMinutes: Number(raw.estimatedTimeMinutes) || 35,
    elapsedMinutes: Number(raw.elapsedMinutes) || 0,
    notes: raw.notes ? String(raw.notes) : undefined,
    deliveryAddress: raw.deliveryAddress ? String(raw.deliveryAddress) : undefined,
    assignedDriver: staff
      ? {
          id: String(staff.id),
          name: staff.name,
          phone: staff.phone || '',
          status: 'on-delivery',
        }
      : undefined,
  }
}

export const orderService = {
  async list(
    params?: { status?: string; dining_type?: string; search?: string },
    signal?: AbortSignal
  ): Promise<Order[]> {
    const query = new URLSearchParams()
    if (params?.status && params.status !== 'all') query.set('status', params.status)
    if (params?.dining_type && params.dining_type !== 'all') query.set('dining_type', params.dining_type)
    if (params?.search?.trim()) query.set('search', params.search.trim())

    const queryString = query.toString()
    const endpoint = API_ENDPOINTS.ORDERS.ordersList(queryString)

    const response = await adminRequest<PaginatedOrdersResponse | Record<string, unknown>[]>(
      endpoint,
      { requireAuth: true, signal }
    )

    let rows: Record<string, unknown>[] = []
    if (Array.isArray(response)) {
      rows = response
    } else if (response && Array.isArray(response.results)) {
      rows = response.results
    } else {
      throw new AdminApiError('The server returned an invalid order list.')
    }

    let page = 2
    while (!Array.isArray(response) && response.next) {
      const next = await adminRequest<PaginatedOrdersResponse>(API_ENDPOINTS.ORDERS.ordersList(`${queryString}${queryString ? '&' : ''}page=${page}`), { requireAuth: true, signal })
      if (!Array.isArray(next.results)) throw new AdminApiError('The server returned an invalid order list.')
      rows.push(...next.results)
      if (!next.next) break
      page += 1
    }
    return rows.map(mapOrderFromApi)
  },

  async getKitchenOrders(station?: string, signal?: AbortSignal): Promise<Order[]> {
    const endpoint = API_ENDPOINTS.ORDERS.kitchenOrders(station)
    const response = await adminRequest<Record<string, unknown>[] | PaginatedOrdersResponse>(
      endpoint,
      { requireAuth: true, signal }
    )

    const rows = Array.isArray(response)
      ? response
      : response && Array.isArray(response.results)
      ? response.results
      : null

    if (!rows) throw new AdminApiError('The server returned an invalid kitchen order list.')

    return rows.map(mapOrderFromApi)
  },

  async getDeliveryOrders(signal?: AbortSignal): Promise<Order[]> {
    const response = await adminRequest<Record<string, unknown>[] | PaginatedOrdersResponse>(
      API_ENDPOINTS.ORDERS.DELIVERIES,
      { requireAuth: true, signal }
    )

    const rows = Array.isArray(response)
      ? response
      : response && Array.isArray(response.results)
      ? response.results
      : null

    if (!rows) throw new AdminApiError('The server returned an invalid delivery order list.')

    return rows.map(mapOrderFromApi)
  },

  async get(id: number | string, signal?: AbortSignal): Promise<Order> {
    const raw = await adminRequest<Record<string, unknown>>(
      API_ENDPOINTS.ORDERS.orderDetail(id),
      { requireAuth: true, signal }
    )
    return mapOrderFromApi(raw)
  },

  async updateStatus(id: number | string, newStatus: OrderStatus): Promise<Order> {
    const raw = await adminRequest<Record<string, unknown>>(
      API_ENDPOINTS.ORDERS.updateStatus(id),
      {
        method: 'PATCH',
        requireAuth: true,
        body: JSON.stringify({ status: newStatus.replace('out-for-delivery', 'out_for_delivery') }),
      }
    )
    return mapOrderFromApi(raw)
  },

  async assignDelivery(
    id: number | string,
    deliveryStaffId: number | string
  ): Promise<{ message: string; order: Order }> {
    const response = await adminRequest<{ message: string; order: Record<string, unknown> }>(
      API_ENDPOINTS.ORDERS.assignDelivery(id),
      {
        method: 'POST',
        requireAuth: true,
        body: JSON.stringify({ delivery_staff_id: deliveryStaffId }),
      }
    )
    return {
      message: response.message,
      order: mapOrderFromApi(response.order),
    }
  },

  async deliveryStaff(signal?: AbortSignal): Promise<{ id: number; name: string; phone: string }[]> {
    return adminRequest('orders/delivery-staff/', { requireAuth: true, signal })
  },

  async collectCash(id: string): Promise<Order> {
    const raw = await adminRequest<Record<string, unknown>>(`orders/${id}/collect-cash/`, {
      method: 'POST', requireAuth: true, body: JSON.stringify({ payment_status: 'paid' }),
    })
    return mapOrderFromApi(raw)
  },
}
