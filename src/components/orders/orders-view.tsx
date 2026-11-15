import { useEffect, useState } from 'react'
import type { AdminUser, Order, OrderStatus } from '../../types/admin'
import { orderService } from '../../services/order-service'
import { OrderDetailsModal } from '../kitchen/order-details-modal'
import { CreateOrderForm } from './create-order-form'
import { DeliveryActivityPanel } from './delivery-activity-panel'

interface OrdersViewProps {
  orders: Order[]
  onUpdateOrderStatus: (id: string, status: OrderStatus) => Promise<boolean>
  onForwardToChef?: (order: Order) => void
  currentUser: AdminUser
  busy?: boolean
  onReload: () => void
}

export function OrdersView({ orders, onUpdateOrderStatus, onForwardToChef, currentUser, busy, onReload }: OrdersViewProps) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drivers, setDrivers] = useState<{ id: number; name: string; phone: string; onDuty?: boolean; activeJobs?: number }[]>([])
  const [driversLoading, setDriversLoading] = useState(false)
  const [driversError, setDriversError] = useState('')
  const [driverRetry, setDriverRetry] = useState(0)
  const [actionError, setActionError] = useState('')
  const [actionBusy, setActionBusy] = useState(false)
  const [creating, setCreating] = useState(false)
  const canManage = currentUser.permissions.includes('orders:update_status')
  const canDeliver = currentUser.permissions.includes('deliveries:update_status')
  const canCancel = currentUser.permissions.includes('orders:cancel')
  useEffect(() => {
    if (!canManage) return
    const controller = new AbortController()
    setDriversLoading(true)
    let pending = false
    const loadDrivers = () => {
      if (pending || controller.signal.aborted) return
      pending = true
      orderService.deliveryStaff(controller.signal).then(data => {
      if (!controller.signal.aborted) { setDrivers(data); setDriversError('') }
    }).catch(err => { if (!controller.signal.aborted) setDriversError(err instanceof Error ? err.message : 'Unable to load delivery staff.') })
      .finally(() => { pending = false; if (!controller.signal.aborted) setDriversLoading(false) })
    }
    loadDrivers()
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') loadDrivers() }, 15000)
    return () => { controller.abort(); window.clearInterval(timer) }
  }, [canManage, driverRetry])

  async function action(run: () => Promise<unknown>) {
    if (actionBusy) return
    setActionBusy(true)
    setActionError('')
    try { await run(); onReload() }
    catch (err) { setActionError(err instanceof Error ? err.message : 'Unable to save. Please retry.') }
    finally { setActionBusy(false) }
  }
  const rows = orders.filter(order => (status === 'all' || order.status === status) && `${order.orderNumber} ${order.customerName}`.toLowerCase().includes(query.toLowerCase()))
  if (currentUser.role === 'delivery_staff') {
    const customerSite = (import.meta.env.VITE_CUSTOMER_SITE_URL || 'http://localhost:5173').replace(/\/+$/, '')
    return <div className="rounded-2xl border border-stone-200 bg-white p-8 space-y-4"><h1 className="text-2xl font-bold">Your rider workspace</h1><p className="text-sm text-stone-600">Manage your shift, assigned pickups, doorstep handovers, delivery issues and cash receipts in the rider workspace. Sign in with this same rider account.</p><a className="inline-block rounded-xl bg-[#B84A22] px-5 py-3 text-sm font-semibold text-white" href={`${customerSite}/rider`}>Open rider workspace</a></div>
  }
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">{currentUser.role === 'delivery_staff' ? 'Assigned Deliveries' : 'Orders'}</h1>
      {currentUser.permissions.includes('orders:create') && <button className="rounded-xl bg-[#B84A22] p-3 text-white" onClick={() => setCreating(value => !value)}>{creating ? 'Close form' : 'Create Order'}</button>}
      <button className="underline" onClick={onReload}>Refresh</button>
    </div>
    {creating && <CreateOrderForm onSaved={() => { setCreating(false); onReload() }} />}
    <div className="flex gap-3"><input aria-label="Search orders" placeholder="Search number or customer" value={query} onChange={e => setQuery(e.target.value)} className="min-w-0 flex-1 rounded-xl border p-3" /><select aria-label="Order status" value={status} onChange={e => setStatus(e.target.value)} className="rounded-xl border p-3">{['all', 'pending', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled'].map(value => <option key={value} value={value}>{value}</option>)}</select></div>
    {actionError && <div role="alert" className="rounded-xl bg-red-50 p-3 text-red-800">{actionError} Retry the action below.</div>}
    {driversLoading && <p role="status">Loading delivery staff…</p>}
    {driversError && <div role="alert">{driversError} <button className="underline" onClick={() => setDriverRetry(value => value + 1)}>Retry delivery staff</button></div>}
    {!rows.length && <p className="rounded-xl border bg-white p-8 text-center text-stone-500">No orders found.</p>}
    {rows.map(order => <article key={order.id} className="space-y-3 rounded-2xl border bg-white p-5">
      <div className="flex justify-between gap-3"><h2 className="font-bold">{order.orderNumber}</h2><span>{order.status.replaceAll('-', ' ')}</span></div>
      <p>{order.customerName} · {order.diningType} · €{order.totalAmount.toFixed(2)}</p>
      {order.scheduledFor && <p className="text-sm">Scheduled: {new Date(order.scheduledFor).toLocaleString()}</p>}
      <p className="text-sm">{order.items.map(item => `${item.quantity} × ${item.name}`).join(', ')}</p>
      {order.deliveryAddress && <p className="text-sm">{order.deliveryAddress}</p>}
      <p className="text-sm">Payment: {order.paymentMethod} / {order.paymentStatus}</p>
      {order.diningType === 'delivery' && <p className="text-sm">Courier: {order.assignedDriver?.name || 'Not assigned'}</p>}
      {order.diningType === 'delivery' && currentUser.permissions.includes('orders:view') && <DeliveryActivityPanel orderId={order.id} progress={order.deliveryProgress} canResolve={canManage} onReload={onReload} />}
      <fieldset disabled={busy || actionBusy} className="flex flex-wrap items-center gap-3 text-sm disabled:opacity-50">
        <button className="underline" onClick={() => setSelectedId(order.id)}>Details</button>
        {canManage && order.diningType === 'delivery' && ['pending', 'preparing', 'ready'].includes(order.status) && <label>Assign courier <select aria-label={`Courier for ${order.orderNumber}`} className="rounded-lg border p-2" disabled={driversLoading || Boolean(driversError)} value={order.assignedDriver?.id || ''} onChange={e => { if (e.target.value) void action(() => orderService.assignDelivery(order.id, e.target.value)) }}><option value="">{drivers.length ? 'Select delivery staff' : 'No active delivery staff'}</option>{drivers.map(driver => <option key={driver.id} value={driver.id}>{driver.name} · {driver.onDuty === undefined ? 'Duty unknown' : driver.onDuty ? 'On duty' : 'Off duty'}{driver.activeJobs !== undefined ? ` · ${driver.activeJobs} active` : ''}</option>)}</select></label>}
        {canManage && order.status === 'pending' && <button className="rounded-lg bg-orange-600 p-2 text-white" onClick={async () => { if (await onUpdateOrderStatus(order.id, 'preparing')) onForwardToChef?.(order) }}>Forward to Kitchen</button>}
        {canManage && order.status === 'preparing' && <button className="rounded-lg bg-emerald-700 p-2 text-white" onClick={() => void onUpdateOrderStatus(order.id, 'ready')}>Mark Ready</button>}
        {(canManage || canDeliver) && order.status === 'ready' && <button disabled={order.diningType === 'delivery' && !order.assignedDriver} className="rounded-lg bg-stone-800 p-2 text-white disabled:opacity-40" onClick={() => void onUpdateOrderStatus(order.id, order.diningType === 'delivery' ? 'out-for-delivery' : 'delivered')}>{order.diningType === 'delivery' ? 'Dispatch' : 'Confirm Handover'}</button>}
        {(canManage || canDeliver) && order.status === 'out-for-delivery' && <button className="rounded-lg bg-emerald-700 p-2 text-white" onClick={() => void onUpdateOrderStatus(order.id, 'delivered')}>Mark Delivered</button>}
        {(canManage || canDeliver) && order.status === 'delivered' && order.paymentMethod === 'cash' && order.paymentStatus === 'pending' && <button className="rounded-lg border p-2" onClick={() => void action(() => orderService.collectCash(order.id))}>Confirm Cash Collected</button>}
        {canCancel && ['pending', 'preparing', 'ready'].includes(order.status) && <button className="text-red-700 underline" onClick={() => void onUpdateOrderStatus(order.id, 'cancelled')}>Cancel Order</button>}
      </fieldset>
    </article>)}
    <OrderDetailsModal order={orders.find(order => order.id === selectedId) || null} onClose={() => setSelectedId(null)} />
  </div>
}
