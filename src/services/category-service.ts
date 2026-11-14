import type { CreateCategoryPayload, MenuCategory, PaginatedResponse } from '../types/menu-category'
import { adminRequest } from './api-client'
import { AdminApiError } from './api-error'

export const categoryService = {
  async list(signal?: AbortSignal): Promise<MenuCategory[]> {
    const categories: MenuCategory[] = []
    const visited = new Set<string>()
    let next: string | null = 'menu/categories/?ordering=order,name'
    while (next) {
      if (visited.has(next)) throw new AdminApiError('The category list could not be loaded. Please retry.')
      visited.add(next)
      const page: PaginatedResponse<MenuCategory> = await adminRequest(next, { signal })
      if (!page || !Array.isArray(page.results)) throw new AdminApiError('The server returned an invalid category list.')
      categories.push(...page.results)
      next = page.next
    }
    return categories
  },

  create(payload: CreateCategoryPayload): Promise<MenuCategory> {
    let body: BodyInit
    if (payload.image) {
      const formData = new FormData()
      for (const [key, value] of Object.entries(payload)) {
        if (value !== undefined && value !== null) formData.append(key, value instanceof File ? value : String(value))
      }
      body = formData
    } else {
      body = JSON.stringify(payload)
    }
    return adminRequest('menu/categories/', {
      method: 'POST', requireAuth: true, body, timeoutMs: payload.image ? 60000 : 15000,
    })
  },
}
