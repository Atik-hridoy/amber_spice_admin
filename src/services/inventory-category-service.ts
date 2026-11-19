import type { InventoryCategory, InventoryCategoryPayload } from '../types/inventory-category'
import { adminRequest } from './api-client'
import { AdminApiError } from './api-error'
import { API_ENDPOINTS } from './endpoints/api-endpoints'

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export const inventoryCategoryService = {
  async list(signal?: AbortSignal, ordering: string = 'name'): Promise<InventoryCategory[]> {
    const categories: InventoryCategory[] = []
    const visited = new Set<string>()
    let next: string | null = API_ENDPOINTS.INVENTORY.categoriesList(ordering)
    while (next) {
      if (visited.has(next)) throw new AdminApiError('The inventory category list could not be loaded. Please retry.')
      visited.add(next)
      const response: PaginatedResponse<InventoryCategory> | InventoryCategory[] = await adminRequest(next, { signal })
      if (Array.isArray(response)) {
        return response
      }
      if (!response || !Array.isArray(response.results)) {
        throw new AdminApiError('The server returned an invalid inventory category list.')
      }
      categories.push(...response.results)
      next = response.next
    }
    return categories
  },

  get(id: number | string, signal?: AbortSignal): Promise<InventoryCategory> {
    return adminRequest(API_ENDPOINTS.INVENTORY.categoryDetail(id), {
      method: 'GET',
      signal,
    })
  },

  create(payload: InventoryCategoryPayload): Promise<InventoryCategory> {
    return adminRequest(API_ENDPOINTS.INVENTORY.CATEGORIES, {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify(payload),
    })
  },

  update(id: number | string, payload: Partial<InventoryCategoryPayload>): Promise<InventoryCategory> {
    return adminRequest(API_ENDPOINTS.INVENTORY.categoryDetail(id), {
      method: 'PATCH',
      requireAuth: true,
      body: JSON.stringify(payload),
    })
  },

  delete(id: number | string): Promise<void> {
    return adminRequest(API_ENDPOINTS.INVENTORY.categoryDetail(id), {
      method: 'DELETE',
      requireAuth: true,
    })
  },
}
