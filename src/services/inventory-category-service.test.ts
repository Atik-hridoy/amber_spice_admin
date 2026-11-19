import { describe, expect, it, vi } from 'vitest'
import { inventoryCategoryService } from './inventory-category-service'
import { storeAdminSession } from './admin-session'
import { jsonResponse, manager } from '../test/menu-fixtures'
import type { InventoryCategory } from '../types/inventory-category'
import { API_ENDPOINTS, resolveApiUrl } from './endpoints'

function invCatFixture(overrides: Partial<InventoryCategory> = {}): InventoryCategory {
  return {
    id: 1,
    name: 'Meat & Poultry',
    slug: 'meat-poultry',
    description: 'Fresh chicken and meats',
    is_active: true,
    itemsCount: 5,
    createdAt: '2026-11-15T00:00:00Z',
    updatedAt: '2026-11-15T00:00:00Z',
    ...overrides,
  }
}

describe('inventory category service', () => {
  it('loads all categories using admin authorization', async () => {
    storeAdminSession('inv-access', 'refresh', manager, false)
    const page1 = { count: 2, next: resolveApiUrl(`${API_ENDPOINTS.INVENTORY.CATEGORIES}?ordering=name&page=2`), previous: null, results: [invCatFixture()] }
    const page2 = { count: 2, next: null, previous: null, results: [invCatFixture({ id: 2, name: 'Spices' })] }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(page1))
      .mockResolvedValueOnce(jsonResponse(page2))
    vi.stubGlobal('fetch', fetchMock)

    const categories = await inventoryCategoryService.list()
    expect(categories.map((c) => c.name)).toEqual(['Meat & Poultry', 'Spices'])
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer inv-access')
  })

  it('creates an inventory category with JSON body', async () => {
    storeAdminSession('inv-access', 'refresh', manager, false)
    const created = invCatFixture({ id: 3, name: 'Dairy' })
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(created, 201))
    vi.stubGlobal('fetch', fetchMock)

    const payload = { name: 'Dairy', description: 'Fresh milk and cheese', is_active: true }
    const result = await inventoryCategoryService.create(payload)
    expect(result).toEqual(created)
    expect(fetchMock.mock.calls[0][1].method).toBe('POST')
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(payload)
    expect(fetchMock.mock.calls[0][1].headers.get('Content-Type')).toBe('application/json')
  })

  it('updates an inventory category via PATCH', async () => {
    storeAdminSession('inv-access', 'refresh', manager, false)
    const updated = invCatFixture({ id: 1, name: 'Meat, Poultry & Game' })
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(updated, 200))
    vi.stubGlobal('fetch', fetchMock)

    const result = await inventoryCategoryService.update(1, { name: 'Meat, Poultry & Game' })
    expect(result.name).toBe('Meat, Poultry & Game')
    expect(fetchMock.mock.calls[0][1].method).toBe('PATCH')
  })

  it('deletes an inventory category via DELETE', async () => {
    storeAdminSession('inv-access', 'refresh', manager, false)
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    await inventoryCategoryService.delete(1)
    expect(fetchMock.mock.calls[0][1].method).toBe('DELETE')
  })
})
