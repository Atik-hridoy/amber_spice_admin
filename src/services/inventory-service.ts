import type { InventoryItem } from '../types/admin'
import { adminRequest } from './api-client'
import { AdminApiError } from './api-error'
import { API_ENDPOINTS } from './endpoints/api-endpoints'

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface InventoryItemPayload {
  name: string
  category: string
  categoryRef?: number | null
  currentStock: number | string
  minimumStock: number | string
  unit: string
  supplier?: string
}

export const inventoryService = {
  async list(signal?: AbortSignal, ordering: string = 'name'): Promise<InventoryItem[]> {
    const items: InventoryItem[] = []
    const visited = new Set<string>()
    let next: string | null = `${API_ENDPOINTS.INVENTORY.ITEMS}?ordering=${ordering}`
    while (next) {
      if (visited.has(next)) throw new AdminApiError('The inventory list could not be loaded. Please retry.')
      visited.add(next)
      const response: PaginatedResponse<InventoryItem> | InventoryItem[] = await adminRequest(next, { signal })
      if (Array.isArray(response)) {
        return response
      }
      if (!response || !Array.isArray(response.results)) {
        throw new AdminApiError('The server returned an invalid inventory list.')
      }
      items.push(...response.results)
      next = response.next
    }
    return items
  },

  get(id: number | string, signal?: AbortSignal): Promise<InventoryItem> {
    return adminRequest(API_ENDPOINTS.INVENTORY.itemDetail(id), {
      method: 'GET',
      signal,
    })
  },

  create(payload: InventoryItemPayload): Promise<InventoryItem> {
    return adminRequest(API_ENDPOINTS.INVENTORY.ITEMS, {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify(payload),
    })
  },

  update(id: number | string, payload: Partial<InventoryItemPayload>): Promise<InventoryItem> {
    return adminRequest(API_ENDPOINTS.INVENTORY.itemDetail(id), {
      method: 'PATCH',
      requireAuth: true,
      body: JSON.stringify(payload),
    })
  },

  delete(id: number | string): Promise<void> {
    return adminRequest(API_ENDPOINTS.INVENTORY.itemDetail(id), {
      method: 'DELETE',
      requireAuth: true,
    })
  },

  restock(id: number | string, amount: number): Promise<InventoryItem> {
    return adminRequest(API_ENDPOINTS.INVENTORY.restock(id), {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify({ amount }),
    })
  },

  lowStock(signal?: AbortSignal): Promise<InventoryItem[]> {
    return adminRequest(API_ENDPOINTS.INVENTORY.LOW_STOCK, {
      method: 'GET',
      signal,
    })
  },
}
