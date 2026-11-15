import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import * as api from '../../services/api-client'
import { DeliveryConversationPanel } from './delivery-conversation-panel'

describe('Support delivery conversation', () => {
  it('retries real reads, follows message pages and offers read-only history', async () => {
    const read = vi.spyOn(api, 'adminRequest').mockRejectedValueOnce(new Error('Messages offline'))
      .mockResolvedValueOnce({ messages: [{ id: 3, senderRole: 'customer', senderName: 'Buyer', body: 'Door on left', createdAt: '2026-11-16T10:00:00Z' }], hasMore: true, nextAfterId: 3 })
      .mockResolvedValueOnce({ messages: [{ id: 5, senderRole: 'rider', senderName: 'Assigned Rider', body: 'Arriving now', createdAt: '2026-11-16T10:01:00Z' }], hasMore: false, nextAfterId: 5 })
    const view = render(<DeliveryConversationPanel orderId="44" />)
    await screen.findByText(/Messages offline/)
    await userEvent.click(screen.getByRole('button', { name: 'Retry messages' }))
    await screen.findByText('Door on left')
    expect(screen.getByText('Arriving now')).toBeTruthy()
    expect(read.mock.calls[2][0]).toContain('after_id=3')
    expect(screen.queryByRole('textbox')).toBeNull()
    view.unmount()
    read.mockResolvedValueOnce({ messages: [], hasMore: false, nextAfterId: 0 })
    render(<DeliveryConversationPanel orderId="45" />)
    await screen.findByText(/No saved messages/)
  })
})
