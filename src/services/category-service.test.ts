import { describe, expect, it, vi } from 'vitest'
import { categoryService } from './category-service'
import { AdminApiError } from './api-error'
import { getStoredAdminUser, storeAdminSession } from './admin-session'
import { categoryFixture, categoryPage, jsonResponse, manager } from '../test/menu-fixtures'

describe('category service and admin authentication', () => {
  it('loads every category page and sends the access token', async () => {
    storeAdminSession('access-test', 'refresh-test', manager, true)
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(categoryPage([categoryFixture()], 'http://127.0.0.1:8000/api/v1/menu/categories/?page=2')))
      .mockResolvedValueOnce(jsonResponse(categoryPage([categoryFixture({ id: 2, name: 'Curries' })])))
    vi.stubGlobal('fetch', fetchMock)
    const result = await categoryService.list()
    expect(result.map((item) => item.id)).toEqual([1, 2])
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer access-test')
  })

  it('posts the API property names using session credentials when remember me is off', async () => {
    storeAdminSession('session-access', 'session-refresh', manager, false)
    const saved = categoryFixture({ id: 9, name: 'Seafood' })
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(saved, 201))
    vi.stubGlobal('fetch', fetchMock)
    const payload = { name: 'Seafood', imageUrl: 'https://example.com/seafood.webp', order: 3, is_active: true }
    expect(await categoryService.create(payload)).toEqual(saved)
    expect(fetchMock.mock.calls[0][0]).toBe('http://127.0.0.1:8000/api/v1/menu/categories/')
    expect(fetchMock.mock.calls[0][1].method).toBe('POST')
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(payload)
    expect(fetchMock.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer session-access')
    expect(localStorage.getItem('amber_admin_token')).toBeNull()
    expect(getStoredAdminUser()?.id).toBe(manager.id)
  })

  it('uploads the file and category properties as multipart without overriding its boundary', async () => {
    storeAdminSession('upload-access', 'refresh-test', manager, false)
    const saved = categoryFixture({ imageUrl: 'http://127.0.0.1:8000/media/menu/categories/saved.png' })
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(saved, 201))
    vi.stubGlobal('fetch', fetchMock)
    const image = new File(['image-data'], 'seafood.png', { type: 'image/png' })
    expect(await categoryService.create({ name: 'Seafood', image, order: 0, is_active: false })).toEqual(saved)
    const request = fetchMock.mock.calls[0][1]
    expect(request.body).toBeInstanceOf(FormData)
    expect(request.body.get('image')).toBe(image)
    expect(request.body.get('name')).toBe('Seafood')
    expect(request.body.get('order')).toBe('0')
    expect(request.body.get('is_active')).toBe('false')
    expect(request.headers.has('Content-Type')).toBe(false)
    expect(request.headers.get('Authorization')).toBe('Bearer upload-access')
  })

  it('preserves backend field errors instead of returning a successful category', async () => {
    storeAdminSession('access-test', 'refresh-test', manager, true)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ name: ['A category with this name already exists.'] }, 400)))
    await expect(categoryService.create({ name: 'Biryani' })).rejects.toMatchObject({
      status: 400, fieldErrors: { name: ['A category with this name already exists.'] },
    })
  })

  it('refreshes an expired access token once and retries with rotated credentials', async () => {
    storeAdminSession('old-access', 'old-refresh', manager, false)
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ detail: 'Expired' }, 401))
      .mockResolvedValueOnce(jsonResponse({ access: 'new-access', refresh: 'new-refresh' }))
      .mockResolvedValueOnce(jsonResponse(categoryFixture(), 201))
    vi.stubGlobal('fetch', fetchMock)
    await categoryService.create({ name: 'Biryani' })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[1][0]).toContain('/auth/token/refresh/')
    expect(fetchMock.mock.calls[2][1].headers.get('Authorization')).toBe('Bearer new-access')
    expect(sessionStorage.getItem('amber_admin_refresh')).toBe('new-refresh')
  })

  it('refuses to save with an offline preview token', async () => {
    localStorage.setItem('amber_admin_token', 'offline-manager-token')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(categoryService.create({ name: 'Seafood' })).rejects.toBeInstanceOf(AdminApiError)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not forward a token to another origin through a pagination URL', async () => {
    storeAdminSession('access-test', 'refresh-test', manager, true)
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(categoryPage([], 'https://other.example.com/api/v1/menu/categories/')))
    vi.stubGlobal('fetch', fetchMock)
    await expect(categoryService.list()).rejects.toThrow('invalid pagination address')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('reports network failure without retrying a category POST', async () => {
    storeAdminSession('access-test', 'refresh-test', manager, true)
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    vi.stubGlobal('fetch', fetchMock)
    await expect(categoryService.create({ name: 'Seafood' })).rejects.toThrow('Cannot connect')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
