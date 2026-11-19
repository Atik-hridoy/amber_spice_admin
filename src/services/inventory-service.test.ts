import { describe, expect, it, vi } from 'vitest'
import { inventoryService } from './inventory-service'
import { storeAdminSession } from './admin-session'
import { jsonResponse, manager } from '../test/menu-fixtures'
import type { InventoryItem } from '../types/admin'
import { API_ENDPOINTS, resolveApiUrl } from './endpoints'

function invItemFixture(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: '1',
    name: 'Basmati Rice',
    category: 'Pantry',
    currentStock: 100,
    minimumStock: 30,
    unit: 'kg',
    status: 'optimal',
    lastRestocked: '2026-11-15T00:00:00Z',
    supplier: 'Himalayan Mills',
    ...overrides,
  }
}

describe('inventory item service', () => {
  it('loads all items across paginated pages', async () => {
    storeAdminSession('item-access', 'refresh', manager, false)
    const page1 = { count: 2, next: resolveApiUrl(`${API_ENDPOINTS.INVENTORY.ITEMS}?ordering=name&page=2`), previous: null, results: [invItemFixture()] }
    const page2 = { count: 2, next: null, previous: null, results: [invItemFixture({ id: '2', name: 'Chicken' })] }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(page1))
      .mockResolvedValueOnce(jsonResponse(page2))
    vi.stubGlobal('fetch', fetchMock)

    const items = await inventoryService.list()
    expect(items.map((i) => i.name)).toEqual(['Basmati Rice', 'Chicken'])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('creates an inventory item with JSON payload', async () => {
    storeAdminSession('item-access', 'refresh', manager, false)
    const created = invItemFixture({ id: '3', name: 'Fresh Milk' })
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(created, 201))
    vi.stubGlobal('fetch', fetchMock)

    const payload = {
      name: 'Fresh Milk',
      category: 'Dairy',
      currentStock: 50,
      minimumStock: 15,
      unit: 'ltr',
      supplier: 'Local Dairy',
    }
    const result = await inventoryService.create(payload)
    expect(result).toEqual(created)
    expect(fetchMock.mock.calls[0][1].method).toBe('POST')
  })

  it('updates an inventory item via PATCH', async () => {
    storeAdminSession('item-access', 'refresh', manager, false)
    const updated = invItemFixture({ id: '1', currentStock: 120 })
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(updated, 200))
    vi.stubGlobal('fetch', fetchMock)

    const result = await inventoryService.update('1', { currentStock: 120 })
    expect(result.currentStock).toBe(120)
    expect(fetchMock.mock.calls[0][1].method).toBe('PATCH')
  })

  it('deletes an inventory item via DELETE', async () => {
    storeAdminSession('item-access', 'refresh', manager, false)
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    await inventoryService.delete('1')
    expect(fetchMock.mock.calls[0][1].method).toBe('DELETE')
  })

  it('restocks an inventory item via POST restock action', async () => {
    storeAdminSession('item-access', 'refresh', manager, false)
    const restocked = invItemFixture({ id: '1', currentStock: 130 })
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(restocked, 200))
    vi.stubGlobal('fetch', fetchMock)

    const result = await inventoryService.restock('1', 30)
    expect(result.currentStock).toBe(130)
    expect(fetchMock.mock.calls[0][1].method).toBe('POST')
  })
})
