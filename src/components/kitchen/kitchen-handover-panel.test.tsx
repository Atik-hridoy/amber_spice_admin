import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deliveryHandoverService, type KitchenTicket } from '../../services/delivery-handover-service'
import { KitchenHandoverPanel } from './kitchen-handover-panel'

const ticket: KitchenTicket = { id: 44, orderNumber: 'ORD-CHECKED', customerName: 'Actual Buyer', customerPhone: '01011111111',
  deliveryAddress: 'Actual saved address', deliveryPostalCode: 'R93 TEST', notes: 'Use side entrance', status: 'ready',
  items: [{ id: 123, name: 'Saved biryani', quantity: 2, customizations: { spiceLevel: 'Mild' } }], assignedRider: { id: 8, name: 'Assigned Rider', phone: '' },
  stage: 'accepted', canHandOver: true, bagCount: 0, sealed: false, handoverAt: null, handedOverBy: '', ticketCode: '', pickupVerifiedAt: null, deliveryVerifiedAt: null }
const released: KitchenTicket = { ...ticket, bagCount: 2, sealed: true, handoverAt: '2026-11-16T10:00:00Z', handedOverBy: 'Actual Chef', ticketCode: 'TESTCODE' }

describe('Kitchen sealed-bag handover', () => {
  beforeEach(() => vi.restoreAllMocks())
  it('requires item, quantity, seal and rider checks, keeps failed input and reloads saved printable bag labels', async () => {
    const read = vi.spyOn(deliveryHandoverService, 'ticket').mockResolvedValue(ticket)
    const save = vi.spyOn(deliveryHandoverService, 'release').mockRejectedValueOnce(new Error('Save unconfirmed')).mockImplementationOnce(async () => { read.mockResolvedValue(released); return released })
    const page = render(<KitchenHandoverPanel orderId="44" />)
    const button = await screen.findByRole('button', { name: 'Record kitchen handover' })
    expect((button as HTMLButtonElement).disabled).toBe(true)
    await userEvent.click(screen.getByRole('checkbox', { name: /2 × Saved biryani/ }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'All food packed and bags sealed' }))
    expect((button as HTMLButtonElement).disabled).toBe(true)
    await userEvent.click(screen.getByRole('checkbox', { name: 'I am handing these bags to Assigned Rider' }))
    fireEvent.change(screen.getByLabelText('Number of sealed bags'), { target: { value: '2' } })
    await userEvent.click(button)
    await screen.findByText(/Save unconfirmed/)
    expect((screen.getByRole('checkbox', { name: /2 × Saved biryani/ }) as HTMLInputElement).checked).toBe(true)
    expect((button as HTMLButtonElement).disabled).toBe(true)
    await userEvent.click(screen.getByRole('button', { name: 'Retry handover' }))
    await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false))
    await userEvent.click(button)
    await screen.findByRole('button', { name: 'Print 2 bag label(s)' })
    expect(save.mock.calls[1]).toEqual(['44', { rider_id: 8, bag_count: 2, sealed: true, items: [{ item_id: 123, quantity: 2 }] }])
    expect(document.getElementById('delivery-bag-tickets')?.textContent).toContain('Delivery bag 2 / 2')
    expect(document.getElementById('delivery-bag-tickets')?.textContent).toContain('Actual saved address')
    expect(document.getElementById('delivery-bag-tickets')?.textContent).toContain('TESTCODE')
    page.unmount()
    render(<KitchenHandoverPanel orderId="44" />)
    await screen.findByRole('button', { name: 'Print 2 bag label(s)' })
    expect(save).toHaveBeenCalledTimes(2)
  })
  it('waits for rider acceptance and retries read errors without a fabricated ticket', async () => {
    vi.spyOn(deliveryHandoverService, 'ticket').mockRejectedValueOnce(new Error('Ticket offline')).mockResolvedValueOnce({ ...ticket, stage: 'assigned', canHandOver: false })
    render(<KitchenHandoverPanel orderId="44" />)
    await screen.findByText(/Ticket offline/)
    expect(document.getElementById('delivery-bag-tickets')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Retry handover' }))
    await screen.findByText('Waiting for the assigned rider to accept.')
    expect(screen.queryByRole('button', { name: 'Record kitchen handover' })).toBeNull()
  })
})
