import { describe, expect, it, vi } from 'vitest'
import { dishService } from './dish-service'
import { storeAdminSession } from './admin-session'
import { dishFixture, jsonResponse, manager } from '../test/menu-fixtures'
import type { DishPayload } from '../types/menu-dish'

const payload: DishPayload = { name: 'Fresh Dish', category: 1, price: '12.50', description: '', station: 'curry', spicyLevel: 0, dietary: [], prepTime: '', isAvailable: true, isBestseller: false, isPopular: false, isSpecial: false }

describe('dish API service', () => {
  it('loads all backend pages with admin authentication', async () => {
    storeAdminSession('dish-access', 'refresh', manager, false)
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ results: [dishFixture()], next: 'http://127.0.0.1:8000/api/v1/menu/dishes/?page=2' }))
      .mockResolvedValueOnce(jsonResponse({ results: [dishFixture({ id: 21 })], next: null }))
    vi.stubGlobal('fetch', fetchMock)
    expect((await dishService.list()).map((dish) => dish.id)).toEqual([20, 21])
    expect(fetchMock.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer dish-access')
  })

  it('posts multipart image, numeric category ID, false flags and explicit empty dietary labels', async () => {
    storeAdminSession('dish-access', 'refresh', manager, false)
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(dishFixture(), 201))
    vi.stubGlobal('fetch', fetchMock)
    const image = new File(['image'], 'dish.webp', { type: 'image/webp' })
    await dishService.save({ ...payload, image, isAvailable: false })
    const request = fetchMock.mock.calls[0][1]
    expect(request.method).toBe('POST')
    expect(request.body.get('category')).toBe('1')
    expect(request.body.get('image')).toBe(image)
    expect(request.body.get('isAvailable')).toBe('false')
    expect(request.body.get('dietary')).toBe('[]')
    expect(request.body.has('addedBy')).toBe(false)
    expect(request.headers.has('Content-Type')).toBe(false)
  })

  it('patches existing dishes and only returns a confirmed server response', async () => {
    storeAdminSession('dish-access', 'refresh', manager, true)
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ price: ['Invalid price'] }, 400))
    vi.stubGlobal('fetch', fetchMock)
    await expect(dishService.save(payload, 20)).rejects.toMatchObject({ status: 400, fieldErrors: { price: ['Invalid price'] } })
    expect(fetchMock.mock.calls[0][0]).toContain('/dishes/20/')
    expect(fetchMock.mock.calls[0][1].method).toBe('PATCH')
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(payload)
  })
})
