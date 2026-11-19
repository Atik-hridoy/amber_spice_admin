import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import * as transport from '../../services/api-tester-service'
import { API_PRESETS } from './api-presets'
import { useApiTester } from './use-api-tester'

const preset = (id: string) => API_PRESETS.find((entry) => entry.id === id)!
describe('API Studio linked delivery workflow', () => {
  it('carries real item/rider IDs, bag counts and private printed ticket codes into verification requests', async () => {
    vi.spyOn(transport, 'sendTesterRequest').mockResolvedValue({ status: 200, statusText: 'OK', timeMs: 1, sizeBytes: 1, headers: {}, body: '{}',
      json: { id: 44, orderNumber: 'ORD-REAL', assignedRider: { id: 8 }, items: [{ id: 123, quantity: 2 }], ticketCode: 'BAGCODE8', bagCount: 2 } })
    const { result } = renderHook(() => useApiTester())
    act(() => result.current.select(preset('kitchen-ticket')))
    await act(() => result.current.send())
    act(() => result.current.select(preset('kitchen-release')))
    expect(JSON.parse(result.current.request.body)).toEqual({ rider_id: 8, bag_count: 2, sealed: true, items: [{ item_id: 123, quantity: 2 }] })
    expect(result.current.request.variables.orderId).toBe('44')
    act(() => result.current.select(preset('rider-pickup')))
    expect(JSON.parse(result.current.request.body)).toEqual({ ticket_code: 'BAGCODE8', bag_count: 2 })
    act(() => result.current.select(preset('rider-complete')))
    expect(JSON.parse(result.current.request.body)).toEqual({ ticket_code: 'BAGCODE8', bag_count: 2, recipient_confirmed: false })
  })
  it('attaches a guest credential only to customer contact operations and preserves UUID for a message retry', async () => {
    const send = vi.spyOn(transport, 'sendTesterRequest').mockResolvedValue({ status: 201, statusText: 'Created', timeMs: 1, sizeBytes: 1, headers: {}, body: '{}',
      json: { id: 44, orderNumber: 'ORD-GUEST', customerContactToken: 'guest-private' } })
    const { result } = renderHook(() => useApiTester())
    act(() => result.current.select(preset('order-create')))
    await act(() => result.current.send())
    act(() => result.current.select(preset('customer-message-send')))
    expect(JSON.parse(result.current.request.headers)['X-Order-Contact-Token']).toBe('guest-private')
    expect(JSON.parse(result.current.request.body).client_message_id).toMatch(/^[0-9a-f-]{36}$/)
    const body = result.current.request.body
    await act(() => result.current.send())
    await act(() => result.current.send())
    expect(send.mock.calls.at(-1)?.[0].body).toBe(body)
    act(() => result.current.select(preset('kitchen-ticket')))
    expect(JSON.parse(result.current.request.headers)['X-Order-Contact-Token']).toBeUndefined()
    expect(result.current.request.url).not.toContain('guest-private')
  })
})
