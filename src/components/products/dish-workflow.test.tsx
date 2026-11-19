import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ProductsView } from './products-view'
import { storeAdminSession } from '../../services/admin-session'
import { categoryFixture, categoryPage, dishFixture, jsonResponse, manager } from '../../test/menu-fixtures'
import type { MenuDish } from '../../types/menu-dish'

describe('admin dish workflow', () => {
  it('uploads under a category, shows Added by, survives reload, edits and updates availability through the API', async () => {
    const user = userEvent.setup()
    storeAdminSession('dish-access', 'refresh', manager, true)
    let saved: MenuDish | null = null
    const fetchMock = vi.fn().mockImplementation((url: string, request: RequestInit) => {
      if (url.includes('/categories/')) return Promise.resolve(jsonResponse(categoryPage([categoryFixture()])))
      if (request.method === 'POST') {
        saved = dishFixture({ imageUrl: 'http://127.0.0.1:8000/media/menu/dishes/uploaded.webp' })
        return Promise.resolve(jsonResponse(saved, 201))
      }
      if (url.includes('/toggle-availability/')) {
        saved = { ...saved!, isAvailable: false }
        return Promise.resolve(jsonResponse({ is_available: false }))
      }
      if (request.method === 'PATCH') {
        saved = { ...saved!, ...JSON.parse(request.body as string) }
        return Promise.resolve(jsonResponse(saved))
      }
      return Promise.resolve(jsonResponse(/\/dishes\/20\//.test(url) ? saved : { results: saved ? [saved] : [], next: null }))
    })
    vi.stubGlobal('fetch', fetchMock)
    const view = render(<ProductsView currentUser={manager} />)
    await screen.findByText('No dishes found')
    await user.click(screen.getByRole('button', { name: 'Add New Dish' }))
    expect((screen.getByLabelText('Category') as HTMLSelectElement).value).toBe('1')
    await user.type(screen.getByLabelText('Dish Name'), 'Fresh Dish')
    await user.type(screen.getByLabelText('Price (EUR)'), '12.50')
    const image = new File(['image'], 'dish.webp', { type: 'image/webp' })
    await user.upload(screen.getByLabelText('Upload dish image'), image)
    await user.click(screen.getByRole('button', { name: 'Add Dish' }))
    await screen.findByText(/Dish.*saved successfully/)
    expect(screen.queryByRole('dialog')).toBeNull()
    const post = fetchMock.mock.calls.find(([, request]) => request.method === 'POST')!
    expect(post[1].body.get('category')).toBe('1')
    expect(post[1].body.get('image')).toBe(image)
    expect(post[1].body.has('addedBy')).toBe(false)
    expect(screen.getByRole('article').textContent).toContain('Added by: Menu Manager')
    expect(screen.getByRole('button', { name: 'Biryani' }).textContent).toContain('Added by: Menu Manager')
    view.unmount()
    render(<ProductsView currentUser={manager} />)
    await screen.findByRole('heading', { name: 'Fresh Dish' })
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.clear(screen.getByLabelText('Price (EUR)'))
    await user.type(screen.getByLabelText('Price (EUR)'), '14.25')
    await user.click(screen.getByRole('button', { name: 'Update Dish' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    const patch = fetchMock.mock.calls.find(([, request]) => request.method === 'PATCH')!
    expect(JSON.parse(patch[1].body)).not.toHaveProperty('imageUrl')
    expect(screen.getByRole('article').textContent).toContain('14.25')
    await user.click(screen.getByRole('button', { name: 'Toggle availability for Fresh Dish' }))
    await screen.findByText('Sold Out / Disabled')
    expect(screen.getByRole('article').textContent).toContain('Added by: Menu Manager')
  })

  it('keeps the form open on server rejection and never adds an unsaved dish', async () => {
    const user = userEvent.setup()
    storeAdminSession('dish-access', 'refresh', manager, true)
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string, request: RequestInit) => Promise.resolve(
      request.method === 'POST' ? jsonResponse({ name: ['Rejected by server'] }, 400)
        : url.includes('/categories/') ? jsonResponse(categoryPage([categoryFixture()]))
          : jsonResponse({ results: [], next: null }),
    )))
    render(<ProductsView currentUser={manager} />)
    await screen.findByText('No dishes found')
    await user.click(screen.getByRole('button', { name: 'Add New Dish' }))
    await user.type(screen.getByLabelText('Dish Name'), 'Unsaved')
    await user.type(screen.getByLabelText('Price (EUR)'), '10')
    await user.click(screen.getByRole('button', { name: 'Add Dish' }))
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.queryByRole('article')).toBeNull()
    expect((screen.getByLabelText('Dish Name') as HTMLInputElement).value).toBe('Unsaved')
  })

  it('shows dish list errors and retries without falling back to sample dishes', async () => {
    const user = userEvent.setup()
    storeAdminSession('dish-access', 'refresh', manager, true)
    let fail = true
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('/categories/')) return Promise.resolve(jsonResponse(categoryPage([categoryFixture({ addedBy: null })])))
      if (fail) return Promise.reject(new TypeError('Failed to fetch'))
      return Promise.resolve(jsonResponse({ results: [], next: null }))
    }))
    render(<ProductsView currentUser={manager} />)
    await screen.findByRole('button', { name: 'Retry dishes' })
    expect(screen.queryByRole('article')).toBeNull()
    expect(screen.getByText('Added by: Not recorded')).toBeTruthy()
    fail = false
    await user.click(screen.getByRole('button', { name: 'Retry dishes' }))
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
  })
})
