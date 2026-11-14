import { describe, expect, it, vi } from 'vitest'
import { sendTesterRequest } from './api-tester-service'
import { storeAdminSession } from './admin-session'
import { jsonResponse, manager } from '../test/menu-fixtures'
import { API_ENDPOINTS, resolveApiUrl } from './endpoints'
import type { TesterRequest } from '../types/api-tester'

const request: TesterRequest = { method: 'POST', url: resolveApiUrl(API_ENDPOINTS.MENU.DISHES),
  variables: {}, body: '{"name":"Dish","category":7,"price":"10.00","dietary":[],"isAvailable":false}',
  bodyMode: 'json', headers: '{}', authMode: 'session', token: '', file: null, fileField: 'image',
}

describe('API tester transport', () => {
  it('uses the current session and reports the actual HTTP validation response instead of throwing it away', async () => {
    storeAdminSession('session-access', 'refresh', manager, false)
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ name: ['Required'] }, 400))
    vi.stubGlobal('fetch', fetchMock)
    const result = await sendTesterRequest(request)
    expect(result.status).toBe(400)
    expect(result.json).toEqual({ name: ['Required'] })
    expect(result.body).toContain('Required')
    expect(result.sizeBytes).toBeGreaterThan(0)
    expect(fetchMock.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer session-access')
  })

  it('sends multipart files, arrays and false values without a JSON content type', async () => {
    storeAdminSession('session-access', 'refresh', manager, true)
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 8 }, 201))
    vi.stubGlobal('fetch', fetchMock)
    const file = new File(['image'], 'dish.png', { type: 'image/png' })
    const result = await sendTesterRequest({ ...request, bodyMode: 'multipart', file, headers: '{"Content-Type":"application/json"}' })
    const sent = fetchMock.mock.calls[0][1]
    expect(result.status).toBe(201)
    expect(sent.body).toBeInstanceOf(FormData)
    expect(sent.body.get('image')).toBe(file)
    expect(sent.body.get('dietary')).toBe('[]')
    expect(sent.body.get('isAvailable')).toBe('false')
    expect(sent.headers.has('Content-Type')).toBe(false)
  })

  it('sends public requests without session or custom Authorization headers', async () => {
    storeAdminSession('private-access', 'private-refresh', manager, true)
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ detail: 'Not allowed' }, 403))
    vi.stubGlobal('fetch', fetchMock)
    const result = await sendTesterRequest({ ...request, authMode: 'none', headers: '{"authorization":"Bearer accidental-token"}' })
    expect(result.status).toBe(403)
    expect(fetchMock.mock.calls[0][1].headers.has('Authorization')).toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('uses manual credentials without replacing them with the admin session or refreshing them on 401', async () => {
    storeAdminSession('admin-access', 'admin-refresh', manager, true)
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ detail: 'Invalid token' }, 401))
    vi.stubGlobal('fetch', fetchMock)
    const result = await sendTesterRequest({ ...request, authMode: 'manual', token: 'Bearer other-account' })
    expect(result.status).toBe(401)
    expect(fetchMock.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer other-account')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('rejects unresolved IDs, external URLs and invalid header/form objects before sending', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(sendTesterRequest({ ...request, url: `${request.url}{dishId}/` })).rejects.toThrow('Enter dishId')
    await expect(sendTesterRequest({ ...request, url: 'https://other.example.com/api/v1/menu/' })).rejects.toThrow('configured restaurant API')
    await expect(sendTesterRequest({ ...request, headers: 'invalid' })).rejects.toThrow('Headers')
    await expect(sendTesterRequest({ ...request, bodyMode: 'multipart', body: '[]' })).rejects.toThrow('JSON object')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('substitutes IDs, drops stale bodies for GET and preserves empty 204 responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse({ id: 8 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 })))
    await sendTesterRequest({ ...request, url: `${request.url}{dishId}/`, variables: { dishId: '8' }, method: 'GET' })
    const fetchMock = vi.mocked(fetch)
    expect(fetchMock.mock.calls[0][0]).toBe(`${request.url}8/`)
    expect(fetchMock.mock.calls[0][1]?.body).toBeUndefined()
    const result = await sendTesterRequest({ ...request, method: 'DELETE' })
    expect(result.status).toBe(204)
    expect(result.body).toBe('')
  })

  it('honors custom headers and displays non-JSON responses without inventing JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('Actual server text', { status: 200, headers: { 'Content-Type': 'text/plain' } }))
    vi.stubGlobal('fetch', fetchMock)
    const result = await sendTesterRequest({ ...request, authMode: 'none', headers: '{"Accept":"text/plain","X-Request-ID":"tester-42"}' })
    expect(fetchMock.mock.calls[0][1].headers.get('Accept')).toBe('text/plain')
    expect(fetchMock.mock.calls[0][1].headers.get('X-Request-ID')).toBe('tester-42')
    expect(result.body).toBe('Actual server text')
    expect(result.json).toBeUndefined()
  })
})
