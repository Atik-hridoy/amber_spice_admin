import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import * as api from '../../services/api-client'
import { orderService } from '../../services/order-service'
import type { DeliveryActivity } from '../../types/admin'
import { DeliveryActivityPanel } from './delivery-activity-panel'

const activity: DeliveryActivity = { stage: 'arrived', hasIssue: true, acceptedAt: null, pickedUpAt: null, arrivedAt: null, deliveredAt: null, cashCollectedAt: null,
  issue: { code: 'customer_unavailable', note: 'No answer at door', reportedAt: '2026-11-16T10:30:00Z' }, events: [] }

describe('Dispatch rider activity', () => {
  it('loads real issue details, preserves a failed resolution, and retries the API write', async () => {
    vi.spyOn(api, 'adminRequest').mockResolvedValue({ messages: [], hasMore: false, nextAfterId: 0 })
    vi.spyOn(orderService, 'deliveryProgress').mockResolvedValue(activity)
    const resolve = vi.spyOn(orderService, 'resolveDeliveryIssue').mockRejectedValueOnce(new Error('Resolution not saved'))
      .mockResolvedValueOnce({ ...activity, hasIssue: false, issue: null })
    const reload = vi.fn()
    render(<DeliveryActivityPanel orderId="44" progress={activity} canResolve onReload={reload} />)
    await screen.findByText('No answer at door')
    fireEvent.change(screen.getByLabelText('Delivery resolution note'), { target: { value: 'Customer contacted and waiting' } })
    await userEvent.click(screen.getByRole('button', { name: 'Resolve and let rider continue' }))
    expect((await screen.findByRole('alert')).textContent).toContain('Resolution not saved')
    expect(reload).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Resolve and let rider continue' }))
    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1))
    expect(resolve.mock.calls[1]).toEqual(['44', 'Customer contacted and waiting'])
    expect(screen.queryByText('No answer at door')).toBeNull()
  })

  it('saves return approval and supports failed activity reads with retry', async () => {
    vi.spyOn(api, 'adminRequest').mockResolvedValue({ messages: [], hasMore: false, nextAfterId: 0 })
    vi.spyOn(orderService, 'deliveryProgress').mockRejectedValueOnce(new Error('Activity offline')).mockResolvedValueOnce(activity)
    const approve = vi.spyOn(orderService, 'requestDeliveryReturn').mockResolvedValue({ ...activity, stage: 'returning', hasIssue: false, issue: null })
    render(<DeliveryActivityPanel orderId="44" progress={activity} canResolve onReload={vi.fn()} />)
    await screen.findByText('Activity offline', { exact: false })
    await userEvent.click(screen.getByRole('button', { name: 'Retry rider activity' }))
    await screen.findByText('No answer at door')
    fireEvent.change(screen.getByLabelText('Delivery resolution note'), { target: { value: 'Return to restaurant' } })
    await userEvent.click(screen.getByRole('button', { name: 'Approve return to restaurant' }))
    await waitFor(() => expect(approve).toHaveBeenCalledWith('44', 'Return to restaurant'))
  })
})
