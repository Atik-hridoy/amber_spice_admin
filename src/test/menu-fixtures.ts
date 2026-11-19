import type { MenuDish } from '../types/menu-dish'
import type { AdminUser } from '../types/admin'
import type { MenuCategory } from '../types/menu-category'

export const manager: AdminUser = {
  id: 1, uuid: 'test-manager', username: 'manager', email: 'manager@example.com',
  fullName: 'Menu Manager', role: 'manager', roleDisplay: 'Manager', isStaff: true,
  permissions: ['menu:manage'],
}

export function categoryFixture(overrides: Partial<MenuCategory> = {}): MenuCategory {
  return {
    id: 1, name: 'Biryani', slug: 'biryani', description: '', imageUrl: null, order: 0,
    is_active: true, dishCount: 2, created_at: '2026-11-14T12:00:00Z', addedBy: { id: 1, name: 'Menu Manager', role: 'manager' }, ...overrides,
  }
}

export function categoryPage(results: MenuCategory[], next: string | null = null) {
  return { count: results.length, next, previous: null, results }
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

export function dishFixture(overrides: Partial<MenuDish> = {}): MenuDish {
  return {
    id: 20, name: 'Fresh Dish', slug: 'fresh-dish', category: 1, category_name: 'Biryani',
    description: 'Made fresh', price: '12.50', imageUrl: null, station: 'curry', spicyLevel: 0,
    rating: 0, ordersCount: 0, isAvailable: true, isPopular: false, isBestseller: false,
    isSpecial: false, prepTime: '15-20 min', dietary: [], addedBy: { id: 1, name: 'Menu Manager', role: 'manager' },
    created_at: '2026-11-15T00:00:00Z', ...overrides,
  }
}
