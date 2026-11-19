import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CategoryFormModal } from './category-form-modal'
import { categoryFixture } from '../../test/menu-fixtures'

describe('category image selection', () => {
  it('blocks invalid or oversized files and allows removing the validation error', async () => {
    const user = userEvent.setup({ applyAccept: false })
    const onSubmit = vi.fn().mockResolvedValue(categoryFixture())
    render(<CategoryFormModal isSaving={false} onClose={vi.fn()} onSubmit={onSubmit} />)
    await user.type(screen.getByLabelText(/Category name/), 'Seafood')
    const input = screen.getByLabelText('Upload category image')
    await user.upload(input, new File(['hello'], 'notes.txt', { type: 'text/plain' }))
    expect(screen.getByRole('alert').textContent).toContain('JPG, PNG or WebP')
    expect((screen.getByRole('button', { name: 'Save Category' }) as HTMLButtonElement).disabled).toBe(true)
    const oversized = new File(['image'], 'large.png', { type: 'image/png' })
    Object.defineProperty(oversized, 'size', { value: 5 * 1024 * 1024 + 1 })
    await user.upload(input, oversized)
    expect(screen.getByRole('alert').textContent).toContain('up to 5 MB')
    expect(onSubmit).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Remove category image' }))
    expect(screen.queryByRole('alert')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Save Category' }))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ imageUrl: null }))
  })

  it('releases replaced and removed previews and lets an external URL replace the selected file', async () => {
    const user = userEvent.setup()
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    const onSubmit = vi.fn().mockResolvedValue(categoryFixture())
    const { unmount } = render(<CategoryFormModal isSaving={false} onClose={vi.fn()} onSubmit={onSubmit} />)
    const input = screen.getByLabelText('Upload category image')
    await user.type(screen.getByLabelText(/Category name/), 'Seafood')
    await user.upload(input, new File(['first'], 'first.png', { type: 'image/png' }))
    await user.upload(input, new File(['second'], 'second.jpg', { type: 'image/jpeg' }))
    expect(screen.getByText('second.jpg')).toBeTruthy()
    expect(revoke).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'Remove category image' }))
    expect(screen.queryByAltText('Selected category image preview')).toBeNull()
    expect(revoke).toHaveBeenCalledTimes(2)
    await user.upload(input, new File(['third'], 'third.webp', { type: 'image/webp' }))
    await user.type(screen.getByLabelText(/Image URL/), 'https://example.com/seafood.png')
    expect(screen.queryByText('third.webp')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Save Category' }))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ imageUrl: 'https://example.com/seafood.png' }))
    expect(onSubmit.mock.calls[0][0].image).toBeUndefined()
    unmount()
    expect(revoke).toHaveBeenCalledTimes(3)
    revoke.mockRestore()
  })
})
