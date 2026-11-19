import { useState } from 'react'
import { orderService } from '../../services/order-service'
import { TESTER_INPUT } from './tester-styles'

export function TesterOrderIds({ variables, disabled, onVariable }: {
  variables: Record<string, string>; disabled: boolean; onVariable: (key: string, value: string) => void
}) {
  const [drivers, setDrivers] = useState<{ id: number; name: string }[]>([])
  const [orders, setOrders] = useState<{ id: string; orderNumber: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  async function load() {
    setLoading(true)
    setError('')
    const results = await Promise.allSettled([orderService.list(), orderService.deliveryStaff()])
    if (results[0].status === 'fulfilled') setOrders(results[0].value)
    if (results[1].status === 'fulfilled') setDrivers(results[1].value)
    const failed = results.find(result => result.status === 'rejected')
    if (failed?.status === 'rejected') setError(failed.reason instanceof Error ? failed.reason.message : 'Unable to load linked IDs.')
    setLoading(false)
  }
  return <div className="space-y-3 rounded-xl border p-3">
    <button type="button" disabled={disabled || loading} onClick={() => void load()} className="text-xs font-semibold text-[#B84A22]">{loading ? 'Loading saved IDs…' : 'Load order and courier IDs'}</button>
    {error && <p role="alert" className="text-xs text-red-700">{error} Use Load to retry.</p>}
    <fieldset disabled={disabled || loading} className="grid sm:grid-cols-2 gap-3 text-xs">
      <label>Saved order<select aria-label="Saved order" value={variables.orderId || ''} className={TESTER_INPUT} onChange={event => { const order = orders.find(order => order.id === event.target.value); onVariable('orderId', event.target.value); if (order) onVariable('orderNumber', order.orderNumber) }}><option value="">Select saved order</option>{variables.orderId && !orders.some(order => order.id === variables.orderId) && <option value={variables.orderId}>ID {variables.orderId}</option>}{orders.map(order => <option key={order.id} value={order.id}>{order.orderNumber}</option>)}</select></label>
      <label>Delivery staff<select aria-label="Saved courier" value={variables.deliveryStaffId || ''} className={TESTER_INPUT} onChange={event => onVariable('deliveryStaffId', event.target.value)}><option value="">Select active courier</option>{drivers.map(driver => <option key={driver.id} value={driver.id}>{driver.id} · {driver.name}</option>)}</select></label>
    </fieldset>
  </div>
}
