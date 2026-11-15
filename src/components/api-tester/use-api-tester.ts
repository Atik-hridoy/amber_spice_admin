import { useEffect, useRef, useState } from 'react'
import { sendTesterRequest } from '../../services/api-tester-service'
import type { ApiPreset, TesterRequest, TesterResponse } from '../../types/api-tester'
import { API_PRESETS } from './api-presets'

export function useApiTester() {
  const initial = API_PRESETS[0]
  const [selected, setSelected] = useState(initial)
  const [request, setRequest] = useState<TesterRequest>({ method: initial.method, url: initial.url, variables: {},
    body: '', bodyMode: 'none', headers: JSON.stringify({ Accept: 'application/json' }, null, 2),
    authMode: 'session', token: '', file: null, fileField: 'image',
  })
  const [response, setResponse] = useState<TesterResponse | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [requestNumber, setRequestNumber] = useState(0)
  const controllerRef = useRef<AbortController | null>(null)
  const pending = useRef(false)
  useEffect(() => () => controllerRef.current?.abort(), [])
  const update = (patch: Partial<TesterRequest>) => setRequest((previous) => ({ ...previous, ...patch }))
  const variable = (key: string, value: string) => setRequest((previous) => {
    let body = previous.body
    if (key === 'categoryId') {
      try {
        const properties: unknown = JSON.parse(body)
        if (properties && typeof properties === 'object' && !Array.isArray(properties) && 'category' in properties) {
          body = JSON.stringify({ ...properties, category: value ? Number(value) : null }, null, 2)
        }
      } catch { /* Retain the user's body while they are typing. */ }
    }
    if (['dishId', 'deliveryStaffId', 'ticketCode', 'bagCount', 'packedItems'].includes(key)) {
      try {
        const properties = JSON.parse(body)
        if (key === 'dishId' && Array.isArray(properties.items) && properties.items.length && 'dish_id' in properties.items[0]) properties.items[0].dish_id = value ? Number(value) : null
        if (key === 'deliveryStaffId' && 'delivery_staff_id' in properties) properties.delivery_staff_id = value ? Number(value) : null
        if (key === 'deliveryStaffId' && 'rider_id' in properties) properties.rider_id = value ? Number(value) : null
        if (key === 'ticketCode' && 'ticket_code' in properties) properties.ticket_code = value
        if (key === 'bagCount' && 'bag_count' in properties && value) properties.bag_count = Number(value)
        if (key === 'packedItems' && 'rider_id' in properties && value) properties.items = JSON.parse(value)
        body = JSON.stringify(properties, null, 2)
      } catch { /* Keep incomplete user JSON. */ }
    }
    return { ...previous, body, variables: { ...previous.variables, [key]: value } }
  })
  const select = (preset: ApiPreset) => {
    setSelected(preset)
    setResponse(null)
    setError('')
    setRequest((previous) => {
      let body = preset.body || ''
      if (previous.variables.categoryId && body) {
        const properties: unknown = JSON.parse(body)
        if (properties && typeof properties === 'object' && !Array.isArray(properties) && 'category' in properties) body = JSON.stringify({ ...properties, category: Number(previous.variables.categoryId) }, null, 2)
      }
      if (body && preset.resource === 'order') {
        const properties = JSON.parse(body)
        if (Array.isArray(properties.items) && properties.items.length && 'dish_id' in properties.items[0] && previous.variables.dishId) properties.items[0].dish_id = Number(previous.variables.dishId)
        if ('delivery_staff_id' in properties && previous.variables.deliveryStaffId) properties.delivery_staff_id = Number(previous.variables.deliveryStaffId)
        if ('rider_id' in properties && previous.variables.deliveryStaffId) properties.rider_id = Number(previous.variables.deliveryStaffId)
        if ('rider_id' in properties && previous.variables.packedItems) properties.items = JSON.parse(previous.variables.packedItems)
        if ('ticket_code' in properties && previous.variables.ticketCode) properties.ticket_code = previous.variables.ticketCode
        if ('bag_count' in properties && previous.variables.bagCount) properties.bag_count = Number(previous.variables.bagCount)
        body = JSON.stringify(properties, null, 2)
      }
      if (body) {
        const properties = JSON.parse(body)
        if ('client_message_id' in properties && !properties.client_message_id) { properties.client_message_id = crypto.randomUUID(); body = JSON.stringify(properties, null, 2) }
      }
      let headers = previous.headers
      try {
        const values = JSON.parse(headers || '{}')
        delete values['X-Order-Contact-Token']
        if (preset.id.startsWith('customer-') && preset.url.includes('/contact/') && previous.variables.customerContactToken) values['X-Order-Contact-Token'] = previous.variables.customerContactToken
        headers = JSON.stringify(values, null, 2)
      } catch { /* Keep editable invalid headers; sending will show validation. */ }
      return { ...previous, headers, method: preset.method, url: preset.url, body,
        bodyMode: preset.bodyMode || (body ? 'json' : 'none'), file: null,
        authMode: preset.auth === 'none' ? 'none' : previous.authMode === 'none' ? 'session' : previous.authMode,
      }
    })
  }
  const send = async () => {
    if (pending.current) return
    pending.current = true
    setIsLoading(true)
    setRequestNumber((number) => number + 1)
    setError('')
    setResponse(null)
    const controller = new AbortController()
    controllerRef.current = controller
    try {
      const result = await sendTesterRequest(request, controller.signal)
      setResponse(result)
      const json = result.json
      if (result.status >= 200 && result.status < 300 && json && typeof json === 'object' && !Array.isArray(json)) {
        if ('id' in json && selected.resource && (typeof json.id === 'number' || typeof json.id === 'string')) variable(`${selected.resource}Id`, String(json.id))
        if ('orderNumber' in json && typeof json.orderNumber === 'string') variable('orderNumber', json.orderNumber)
        if ('ticketCode' in json && typeof json.ticketCode === 'string') variable('ticketCode', json.ticketCode)
        if ('bagCount' in json && Number(json.bagCount) > 0) variable('bagCount', String(json.bagCount))
        if ('assignedRider' in json && json.assignedRider && typeof json.assignedRider === 'object' && 'id' in json.assignedRider) variable('deliveryStaffId', String(json.assignedRider.id))
        if (selected.id === 'kitchen-ticket' && 'items' in json && Array.isArray(json.items)) variable('packedItems', JSON.stringify(json.items.map((item: { id: number; quantity: number }) => ({ item_id: item.id, quantity: item.quantity }))))
        if ('customerContactToken' in json && typeof json.customerContactToken === 'string') {
          variable('customerContactToken', json.customerContactToken)
        }
        if ('access' in json && typeof json.access === 'string') update({ token: json.access, authMode: 'manual' })
      }
    } catch (failure) {
      setError(controller.signal.aborted ? 'Request cancelled.' : failure instanceof Error ? failure.message : 'Request failed.')
    } finally {
      pending.current = false
      setIsLoading(false)
    }
  }
  return { request, response, selected, error, isLoading, requestNumber, update, variable, select, send,
    cancel: () => controllerRef.current?.abort(),
  }
}
