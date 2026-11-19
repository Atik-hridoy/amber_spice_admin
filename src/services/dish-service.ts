import type { DishPayload, MenuDish } from '../types/menu-dish'
import type { PaginatedResponse } from '../types/menu-category'
import { adminRequest } from './api-client'
import { AdminApiError } from './api-error'
import { API_ENDPOINTS } from './endpoints/api-endpoints'

function bodyFor(payload: DishPayload): BodyInit {
  if (!payload.image) return JSON.stringify(payload)
  const body = new FormData()
  for (const [key, value] of Object.entries(payload)) {
    if (key === 'dietary') body.append(key, JSON.stringify(value))
    else if (value !== undefined && value !== null) body.append(key, value instanceof File ? value : String(value))
  }
  return body
}

export const dishService = {
  async list(signal?: AbortSignal): Promise<MenuDish[]> {
    const dishes: MenuDish[] = []
    const visited = new Set<string>()
    let next: string | null = API_ENDPOINTS.MENU.dishesList('-created_at')
    while (next) {
      if (visited.has(next)) throw new AdminApiError('The dish list could not be loaded. Please retry.')
      visited.add(next)
      const page: PaginatedResponse<MenuDish> = await adminRequest(next, { requireAuth: true, signal })
      if (!page || !Array.isArray(page.results)) throw new AdminApiError('The server returned an invalid dish list.')
      dishes.push(...page.results)
      next = page.next
    }
    return dishes
  },
  save(payload: DishPayload, id?: number): Promise<MenuDish> {
    const endpoint = id ? API_ENDPOINTS.MENU.dishDetail(id) : API_ENDPOINTS.MENU.DISHES
    return adminRequest(endpoint, {
      method: id ? 'PATCH' : 'POST', requireAuth: true, body: bodyFor(payload), timeoutMs: payload.image ? 60000 : 15000,
    })
  },
  async setAvailability(dish: MenuDish): Promise<MenuDish> {
    await adminRequest(API_ENDPOINTS.MENU.dishToggleAvailability(dish.id), {
      method: 'PATCH', requireAuth: true, body: JSON.stringify({ is_available: !dish.isAvailable }),
    })
    return adminRequest(API_ENDPOINTS.MENU.dishDetail(dish.id), { requireAuth: true })
  },
}
