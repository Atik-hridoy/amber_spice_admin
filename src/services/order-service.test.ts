import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { orderService } from './order-service'
import { storeAdminSession } from './admin-session'

const mockOrderApiResponse = {
  id: 101,
  orderNumber: 'ORD-20261115-A1B2C',
  customerName: 'Rahim Uddin',
  customerPhone: '+353 87 123 4567',
  diningType: 'delivery',
  tableNumber: null,
  status: 'pending',
  paymentStatus: 'paid',
  paymentMethod: 'card',
  totalAmount: '45.50',
  deliveryAddress: '12 Grafton St, Dublin 2',
  estimatedTimeMinutes: 35,
  elapsedMinutes: 5,
  createdAt: '2026-11-15T14:00:00Z',
  assignedDeliveryStaff: {
    id: 5,
    name: 'Sean Kelly',
    phone: '+353 87 999 8888',
  },
  items: [
    {
      id: 1,
      name: 'Chicken Dum Biryani',
      quantity: 2,
      price: '18.50',
      station: 'biryani',
      customizations: { spicy: 'Level 2' },
    },
  ],
}

describe('admin orderService', () => {
  beforeEach(() => {
    storeAdminSession(
      'test-token',
      'refresh-token',
      {
        id: 1,
        username: 'superadmin',
        email: 'superadmin@amberspice.com',
        fullName: 'Super Admin',
        role: 'super_admin',
        uuid: 'test-admin',
        roleDisplay: 'Super Admin',
        isStaff: true,
        permissions: ['orders:view', 'orders:update_status'],
      },
      false
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('lists orders from backend API and maps to admin Order model', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ results: [mockOrderApiResponse] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const orders = await orderService.list()
    expect(orders).toHaveLength(1)
    expect(orders[0].id).toBe('101')
    expect(orders[0].orderNumber).toBe('ORD-20261115-A1B2C')
    expect(orders[0].customerName).toBe('Rahim Uddin')
    expect(orders[0].totalAmount).toBe(45.5)
    expect(orders[0].items[0].station).toBe('biryani')
    expect(orders[0].assignedDriver?.name).toBe('Sean Kelly')
  })

  it('fetches kitchen orders for KDS display', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([mockOrderApiResponse]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const orders = await orderService.getKitchenOrders('biryani')
    expect(orders).toHaveLength(1)
    expect(fetchMock.mock.calls[0][0]).toContain('orders/kitchen/?station=biryani')
  })

  it('updates order status via PATCH', async () => {
    const updatedResponse = { ...mockOrderApiResponse, status: 'preparing' }
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(updatedResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const order = await orderService.updateStatus('101', 'preparing')
    expect(order.status).toBe('preparing')
    expect(fetchMock.mock.calls[0][1]?.method).toBe('PATCH')
    expect(JSON.parse(fetchMock.mock.calls[0][1]?.body as string)).toEqual({ status: 'preparing' })
  })

  it('assigns delivery staff to an order', async () => {
    const assignResponse = {
      message: 'Order #ORD-20261115-A1B2C assigned to Sean Kelly.',
      order: mockOrderApiResponse,
    }
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(assignResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await orderService.assignDelivery('101', 5)
    expect(result.message).toContain('assigned to Sean Kelly')
    expect(result.order.id).toBe('101')
    expect(fetchMock.mock.calls[0][1]?.method).toBe('POST')
  })

  it('maps backend delivery status and sends the backend spelling on dispatch', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...mockOrderApiResponse, status: 'out_for_delivery' }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const order = await orderService.updateStatus('101', 'out-for-delivery')
    expect(order.status).toBe('out-for-delivery')
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({ status: 'out_for_delivery' })
  })

  it('reads all saved pages instead of dropping orders after the first page', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ results: [mockOrderApiResponse], next: 'http://127.0.0.1:8000/api/v1/orders/?page=2' })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ results: [{ ...mockOrderApiResponse, id: 102 }], next: null })))
    vi.stubGlobal('fetch', fetchMock)
    expect((await orderService.list()).map(order => order.id)).toEqual(['101', '102'])
    expect(fetchMock.mock.calls[1][0]).toContain('page=2')
  })

  it('does not turn an invalid kitchen response into an empty success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ unexpected: true }))))
    await expect(orderService.getKitchenOrders()).rejects.toThrow('invalid kitchen order list')
  })
})
