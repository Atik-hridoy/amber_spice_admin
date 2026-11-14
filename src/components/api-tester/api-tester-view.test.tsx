import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApiTesterView } from './api-tester-view'
import { storeAdminSession } from '../../services/admin-session'
import { categoryFixture, categoryPage, dishFixture, jsonResponse, manager } from '../../test/menu-fixtures'

const schema = { paths: {} }
const waitForCollection = () => waitFor(() => expect(screen.queryByText('Loading live API schema…')).toBeNull())

describe('admin API tester', () => {
  it('sends a real request on Send, supports uploads, previews the returned image and carries the new ID to detail requests', async () => {
    const user = userEvent.setup()
    storeAdminSession('tester-access', 'refresh', manager, false)
    const imageUrl = 'http://127.0.0.1:8000/media/menu/dishes/server-image.png'
    const fetchMock = vi.fn().mockImplementation((url: string, options: RequestInit = {}) => Promise.resolve(
      url.includes('/api/schema/') ? jsonResponse(schema) : jsonResponse(dishFixture({ id: 44, imageUrl }), options.method === 'POST' ? 201 : 200),
    ))
    vi.stubGlobal('fetch', fetchMock)
    render(<ApiTesterView />)
    await waitForCollection()
    await user.click(screen.getByRole('button', { name: 'Create dish with image' }))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    fireEvent.change(screen.getByLabelText('Request body'), { target: { value: JSON.stringify({ name: 'API dish', category: 7, price: '12.50', dietary: ['halal'] }) } })
    const image = new File(['image'], 'dish.png', { type: 'image/png' })
    await user.upload(screen.getByLabelText('Upload file'), image)
    await user.click(screen.getByRole('button', { name: 'Send' }))
    await waitFor(() => expect(screen.getByLabelText('Response body').textContent).toContain('"id": 44'))
    const post = fetchMock.mock.calls.find(([, options]) => options.method === 'POST')!
    expect(post[1].body.get('image')).toBe(image)
    expect(post[1].body.get('category')).toBe('7')
    expect(post[1].headers.get('Authorization')).toBe('Bearer tester-access')
    expect(post[1].headers.has('Content-Type')).toBe(false)
    expect(screen.getByAltText('API image preview').getAttribute('src')).toBe(imageUrl)
    await user.click(screen.getByRole('button', { name: 'Dish detail' }))
    expect((screen.getByLabelText('dishId') as HTMLInputElement).value).toBe('44')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    await waitFor(() => expect(fetchMock.mock.calls.at(-1)?.[0]).toBe('http://127.0.0.1:8000/api/v1/menu/dishes/44/'))
  })

  it('loads real category/dish IDs into controls and fills the dish category property', async () => {
    const user = userEvent.setup()
    storeAdminSession('tester-access', 'refresh', manager, true)
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => Promise.resolve(jsonResponse(
      url.includes('/api/schema/') ? schema : url.includes('/categories/')
        ? categoryPage([categoryFixture({ id: 13, name: 'Saved category' })])
        : { results: [dishFixture({ id: 69 })], next: null },
    ))))
    render(<ApiTesterView />)
    await waitForCollection()
    await user.click(screen.getByRole('button', { name: 'Create dish' }))
    await user.click(screen.getByRole('button', { name: 'Load menu IDs' }))
    await screen.findByRole('option', { name: '13 · Saved category' })
    await user.selectOptions(screen.getByLabelText('Saved category'), '13')
    expect(JSON.parse((screen.getByLabelText('Request body') as HTMLTextAreaElement).value).category).toBe(13)
    await user.selectOptions(screen.getByLabelText('Saved dish'), '69')
    await user.click(screen.getByRole('button', { name: 'Edit dish' }))
    expect((screen.getByLabelText('dishId') as HTMLInputElement).value).toBe('69')
  })

  it('does not send on preset selection, blocks missing IDs and clears stale write bodies', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(schema))
    vi.stubGlobal('fetch', fetchMock)
    render(<ApiTesterView />)
    await waitForCollection()
    await user.click(screen.getByRole('button', { name: 'Edit category' }))
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect((await screen.findByRole('alert')).textContent).toContain('Enter categoryId')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'Archive category' }))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect((screen.getByLabelText('Body format') as HTMLSelectElement).value).toBe('none')
    expect(screen.queryByLabelText('Request body')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('preserves HTTP errors and exposes response headers', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => Promise.resolve(
      url.includes('/api/schema/') ? jsonResponse(schema) : jsonResponse({ name: ['This field is required.'] }, 400),
    )))
    render(<ApiTesterView />)
    await waitForCollection()
    await user.click(screen.getByRole('button', { name: 'Create category' }))
    await user.click(screen.getByRole('button', { name: 'Send' }))
    await waitFor(() => expect(screen.getByLabelText('Response body').textContent).toContain('This field is required.'))
    expect(screen.getByRole('status').textContent).toContain('400')
    await user.click(screen.getByRole('button', { name: 'Response headers' }))
    expect(screen.getByLabelText('Response headers').textContent).toContain('application/json')
  })

  it('uses a login response token for manual tests without overwriting the signed-in admin session', async () => {
    const user = userEvent.setup()
    storeAdminSession('original-session', 'original-refresh', manager, true)
    const fetchMock = vi.fn().mockImplementation((url: string) => Promise.resolve(jsonResponse(
      url.includes('/api/schema/') ? schema : url.includes('/auth/login/') ? { access: 'test-account-access' } : { id: 3 },
    )))
    vi.stubGlobal('fetch', fetchMock)
    render(<ApiTesterView />)
    await waitForCollection()
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    fireEvent.change(screen.getByLabelText('Request body'), { target: { value: '{"email":"test@example.com","password":"test-password"}' } })
    await user.click(screen.getByRole('button', { name: 'Send' }))
    await waitFor(() => expect(screen.getByLabelText('Response body').textContent).toContain('test-account-access'))
    expect(fetchMock.mock.calls[1][1].headers.has('Authorization')).toBe(false)
    expect(localStorage.getItem('amber_admin_token')).toBe('original-session')
    await user.click(screen.getByRole('button', { name: 'Current user and permissions' }))
    await user.click(screen.getByRole('tab', { name: 'auth' }))
    expect((screen.getByLabelText('JWT access token') as HTMLInputElement).value).toBe('test-account-access')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    await waitFor(() => expect(fetchMock.mock.calls.at(-1)?.[1].headers.get('Authorization')).toBe('Bearer test-account-access'))
  })

  it('reports schema failure and refreshes to discover newly added backend APIs', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(jsonResponse({ paths: { '/api/v1/future/': { get: { summary: 'Future API endpoint', tags: ['Future'] } } } }))
    vi.stubGlobal('fetch', fetchMock)
    render(<ApiTesterView />)
    expect(await screen.findByRole('alert')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Refresh API collection' }))
    expect(await screen.findByRole('button', { name: 'Future API endpoint' })).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('cancels a pending request and restores Send without showing a successful response', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string, options: RequestInit = {}) => {
      if (url.includes('/api/schema/')) return Promise.resolve(jsonResponse(schema))
      return new Promise<Response>((_, reject) => options.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true }))
    }))
    render(<ApiTesterView />)
    await waitForCollection()
    await user.click(screen.getByRole('button', { name: 'Send' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect((await screen.findByRole('alert')).textContent).toContain('Request cancelled')
    expect(screen.queryByLabelText('Response body')).toBeNull()
    expect((screen.getByRole('button', { name: 'Send' }) as HTMLButtonElement).disabled).toBe(false)
  })
})
