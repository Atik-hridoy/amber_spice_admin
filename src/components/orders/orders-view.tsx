import { useEffect, useState } from 'react'
import {
  Bike,
  Clock,
  Flame,
  LayoutGrid,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  TableProperties,
} from 'lucide-react'
import type { AdminUser, Order, OrderStatus } from '../../types/admin'
import { orderService } from '../../services/order-service'
import { OrderDetailsModal } from '../kitchen/order-details-modal'
import { CreateOrderForm } from './create-order-form'
import { DeliveryActivityPanel } from './delivery-activity-panel'

interface OrdersViewProps {
  orders: Order[]
  onUpdateOrderStatus: (id: string, status: OrderStatus) => Promise<boolean>
  onCompleteTakeaway?: (id: string) => Promise<boolean>
  onForwardToChef?: (order: Order) => void
  currentUser: AdminUser
  busy?: boolean
  onReload: () => void
}

const statusBadgeStyles: Record<string, { label: string; bg: string; text: string; border: string }> = {
  pending: { label: 'Pending (Kitchen Fire)', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  preparing: { label: 'Cooking in Kitchen', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  ready: { label: 'Ready at Pass', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  'out-for-delivery': { label: 'Out for Delivery', bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  delivered: { label: 'Delivered / Completed', bg: 'bg-stone-100', text: 'text-stone-800', border: 'border-stone-300' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
}

export function OrdersView({ orders, onUpdateOrderStatus, onCompleteTakeaway, onForwardToChef, currentUser, busy, onReload }: OrdersViewProps) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [diningType, setDiningType] = useState('all')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState<'details' | 'handover'>('details')
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
      }).catch(err => {
        if (!controller.signal.aborted) setDriversError(err instanceof Error ? err.message : 'Unable to load delivery staff.')
      }).finally(() => {
        pending = false
        if (!controller.signal.aborted) setDriversLoading(false)
      })
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

  // Summary KPIs for executive & operations oversight
  const totalOrdersCount = orders.length
  const pendingCount = orders.filter(o => o.status === 'pending').length
  const inKitchenCount = orders.filter(o => ['preparing', 'ready'].includes(o.status)).length
  const inTransitCount = orders.filter(o => o.status === 'out-for-delivery').length
  const completedCount = orders.filter(o => o.status === 'delivered').length
  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.totalAmount : 0), 0)

  // Filtered rows for display
  const rows = orders.filter(order => {
    const matchesStatus = status === 'all' || order.status === status
    const matchesDining = diningType === 'all' || order.diningType === diningType
    const matchesQuery = !query.trim() || `${order.orderNumber} ${order.customerName} ${order.tableNumber || ''} ${order.deliveryAddress || ''}`.toLowerCase().includes(query.toLowerCase())
    return matchesStatus && matchesDining && matchesQuery
  })

  if (currentUser.role === 'delivery_staff') {
    const customerSite = (import.meta.env.VITE_CUSTOMER_SITE_URL || 'http://localhost:5173').replace(/\/+$/, '')
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-8 space-y-4">
        <h1 className="text-2xl font-bold">Your rider workspace</h1>
        <p className="text-sm text-stone-600">
          Manage your shift, assigned pickups, doorstep handovers, delivery issues and cash receipts in the rider workspace. Sign in with this same rider account.
        </p>
        <a className="inline-block rounded-xl bg-[#B84A22] px-5 py-3 text-sm font-semibold text-white" href={`${customerSite}/rider`}>
          Open rider workspace
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & Operations Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1917] tracking-tight">Orders & Operations</h1>
          <p className="text-xs text-stone-500 mt-0.5">Live restaurant orders, dining allocations, courier dispatch & payment tracking</p>
        </div>
        <div className="flex items-center gap-2">
          {currentUser.permissions.includes('orders:create') && (
            <button
              type="button"
              onClick={() => setCreating(value => !value)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#B84A22] px-4 py-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#9E3E1C] transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{creating ? 'Close Form' : 'Create Order'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onReload}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 text-stone-500" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Strip (Executive & Operations Insights) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-2xl border border-stone-200/90 bg-white p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">Total Orders</span>
          <span className="text-xl font-bold text-[#1C1917] mt-1 block">{totalOrdersCount}</span>
          <span className="text-[10px] text-stone-400">All registered tickets</span>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">Needs Action</span>
          <span className="text-xl font-bold text-rose-800 mt-1 block">{pendingCount}</span>
          <span className="text-[10px] text-rose-600">Pending kitchen fire</span>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">In Kitchen</span>
          <span className="text-xl font-bold text-amber-800 mt-1 block">{inKitchenCount}</span>
          <span className="text-[10px] text-amber-600">Cooking & ready at pass</span>
        </div>

        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">On the Road</span>
          <span className="text-xl font-bold text-indigo-800 mt-1 block">{inTransitCount}</span>
          <span className="text-[10px] text-indigo-600">Out with couriers</span>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Completed</span>
          <span className="text-xl font-bold text-emerald-800 mt-1 block">{completedCount}</span>
          <span className="text-[10px] text-emerald-600">Served or delivered</span>
        </div>

        <div className="rounded-2xl border border-stone-200/90 bg-white p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">Total Value</span>
          <span className="text-xl font-bold text-[#F15A24] mt-1 block">€{totalRevenue.toFixed(2)}</span>
          <span className="text-[10px] text-stone-400">Excluding cancelled</span>
        </div>
      </div>

      {creating && <CreateOrderForm onSaved={() => { setCreating(false); onReload() }} />}

      {/* 3. Controls Bar: Dining Type Tabs, Search, Status Select, View Toggle */}
      <div className="flex flex-col gap-3 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-2xs">
        {/* Top Filter Row: Dining Type Segment & View Mode Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Dining Type Segment */}
          <div className="h-10 rounded-xl bg-[#F5F5F4]/90 border border-[#E7E5E4]/80 p-1 flex items-center gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All Orders', count: orders.length },
              { id: 'dine-in', label: 'Dine-In', count: orders.filter(o => o.diningType === 'dine-in').length },
              { id: 'delivery', label: 'Delivery', count: orders.filter(o => o.diningType === 'delivery').length },
              { id: 'takeaway', label: 'Takeaway', count: orders.filter(o => o.diningType === 'takeaway').length },
            ].map(type => {
              const active = diningType === type.id
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setDiningType(type.id)}
                  className={`h-8 rounded-lg px-3 text-xs flex items-center gap-1.5 transition cursor-pointer ${
                    active
                      ? 'bg-white text-[#1C1917] font-semibold border border-[#E7E5E4] shadow-2xs'
                      : 'text-[#78716C] font-medium hover:text-[#1C1917]'
                  }`}
                >
                  <span>{type.label}</span>
                  <span className="rounded-full bg-stone-100 px-1.5 py-0.2 text-[10px] font-bold text-stone-600">{type.count}</span>
                </button>
              )
            })}
          </div>

          {/* View Mode Toggle */}
          <div className="h-10 rounded-xl bg-[#F5F5F4]/90 border border-[#E7E5E4]/80 p-1 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`h-8 rounded-lg px-3 text-xs flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#1C1917] font-semibold border border-[#E7E5E4] shadow-2xs'
                  : 'text-[#78716C] font-medium hover:text-[#1C1917]'
              }`}
            >
              <TableProperties className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`h-8 rounded-lg px-3 text-xs flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-[#1C1917] font-semibold border border-[#E7E5E4] shadow-2xs'
                  : 'text-[#78716C] font-medium hover:text-[#1C1917]'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Cards</span>
            </button>
          </div>
        </div>

        {/* Bottom Filter Row: Search & Status Dropdown */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              aria-label="Search orders"
              placeholder="Search number, customer, table or address"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] py-2 pl-10 pr-4 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#B84A22] focus:bg-white focus:outline-none"
            />
          </div>

          <select
            aria-label="Order status"
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-800 focus:border-[#B84A22] focus:outline-none"
          >
            {[
              { id: 'all', label: 'All Lifecycle Statuses' },
              { id: 'pending', label: 'Pending Kitchen Action' },
              { id: 'preparing', label: 'Cooking in Kitchen' },
              { id: 'ready', label: 'Ready for Dispatch / Serve' },
              { id: 'out-for-delivery', label: 'Out with Courier' },
              { id: 'delivered', label: 'Delivered / Completed' },
              { id: 'cancelled', label: 'Cancelled' },
            ].map(item => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Action / Error Alerts */}
      {actionError && <div role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-800">{actionError} Retry the action below.</div>}
      {driversLoading && <p role="status" className="text-xs text-stone-500">Loading delivery staff roster…</p>}
      {driversError && (
        <div role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-800">
          {driversError} <button type="button" className="underline font-semibold" onClick={() => setDriverRetry(value => value + 1)}>Retry delivery staff</button>
        </div>
      )}

      {/* Empty State */}
      {!rows.length && (
        <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center text-stone-500 space-y-2">
          <Package className="h-8 w-8 text-stone-300 mx-auto" />
          <p className="font-semibold text-sm">No orders found.</p>
          <p className="text-xs text-stone-400">Try adjusting your dining type, status filter, or search query.</p>
        </div>
      )}

      {/* 4. Table View (High-Density Operations Table) */}
      {viewMode === 'table' && rows.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stone-200 bg-[#FAFAF9] text-[11px] font-bold tracking-wider text-stone-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Order & Time</th>
                  <th className="px-4 py-3">Customer & Type</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Payment & Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Courier Logistics</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rows.map(order => {
                  const badge = statusBadgeStyles[order.status] || { label: order.status, bg: 'bg-stone-100', text: 'text-stone-800', border: 'border-stone-200' }
                  return (
                    <tr key={order.id} className="hover:bg-stone-50/70 transition">
                      {/* Order & Time */}
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => { setSelectedTab('details'); setSelectedId(order.id) }}
                          className="font-mono text-xs font-bold text-[#1C1917] hover:text-[#B84A22] text-left transition cursor-pointer block"
                        >
                          {order.orderNumber}
                        </button>
                        <span className="text-[11px] text-stone-400 mt-0.5 block flex items-center gap-1">
                          <Clock className="h-3 w-3 inline" />
                          {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                        {order.scheduledFor && (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200 inline-block mt-1">
                            Scheduled: {new Date(order.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </td>

                      {/* Customer & Dining Type */}
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-stone-900 block">{order.customerName}</span>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {order.diningType === 'delivery' ? (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.2 text-[10px] font-bold text-amber-700 border border-amber-200">
                              <Bike className="h-3 w-3" /> Delivery
                            </span>
                          ) : order.diningType === 'dine-in' ? (
                            <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.2 text-[10px] font-bold text-blue-700 border border-blue-200">
                              <TableProperties className="h-3 w-3" /> Table {order.tableNumber || 'Dine-In'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                              <ShoppingBag className="h-3 w-3" /> Takeaway
                            </span>
                          )}

                          {order.diningType === 'takeaway' && (
                            <>
                              <span className="font-mono font-bold text-[10px] bg-stone-900 text-white px-1.5 py-0.2 rounded shadow-2xs">
                                #{order.pickupCode || 'TK'}
                              </span>
                              {order.customerArrivedAt && (
                                <span className="inline-flex items-center gap-1 rounded bg-emerald-600 text-white px-1.5 py-0.2 text-[10px] font-bold animate-pulse shadow-2xs">
                                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                  At Counter Now
                                </span>
                              )}
                              {order.pickupRack && (
                                <span className="text-[10px] font-medium text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                  Rack: {order.pickupRack}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        {order.deliveryAddress && (
                          <span className="text-[10px] text-stone-500 truncate max-w-[180px] block mt-0.5" title={order.deliveryAddress}>
                            {order.deliveryAddress}
                          </span>
                        )}
                      </td>

                      {/* Items */}
                      <td className="px-4 py-3.5 max-w-xs">
                        <span className="text-stone-700 line-clamp-2">
                          {order.items.map(i => `${i.quantity}× ${i.name}`).join(', ')}
                        </span>
                        <span className="text-[10px] text-stone-400 mt-0.5 block">
                          {order.items.reduce((sum, i) => sum + i.quantity, 0)} items total
                        </span>
                      </td>

                      {/* Payment & Total */}
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-stone-900 text-sm block">€{order.totalAmount.toFixed(2)}</span>
                        <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.2 text-[10px] font-bold uppercase ${
                          order.paymentStatus === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {order.paymentStatus} &bull; {order.paymentMethod}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          <span>{badge.label}</span>
                        </span>
                        {order.status === 'out-for-delivery' && (
                          <span className="text-[10px] text-stone-500 block mt-1">Ticket verified at doorstep</span>
                        )}
                      </td>

                      {/* Courier Logistics */}
                      <td className="px-4 py-3.5">
                        {order.diningType === 'delivery' ? (
                          <div className="space-y-1">
                            <span className="text-stone-800 font-medium block">
                              {order.assignedDriver?.name ? `Courier: ${order.assignedDriver.name}` : 'No courier assigned'}
                            </span>
                            {canManage && ['pending', 'preparing', 'ready'].includes(order.status) && (
                              <label className="block">
                                <select
                                  aria-label={`Courier for ${order.orderNumber}`}
                                  className="w-full rounded-lg border border-stone-200 bg-white p-1 text-[11px] focus:outline-none"
                                  disabled={driversLoading || Boolean(driversError)}
                                  value={order.assignedDriver?.id || ''}
                                  onChange={e => { if (e.target.value) void action(() => orderService.assignDelivery(order.id, e.target.value)) }}
                                >
                                  <option value="">{drivers.length ? 'Select courier...' : 'No delivery staff'}</option>
                                  {drivers.map(driver => (
                                    <option key={driver.id} value={driver.id}>
                                      {driver.name} &bull; {driver.onDuty ? 'On duty' : 'Off duty'}{driver.activeJobs !== undefined ? ` (${driver.activeJobs} active)` : ''}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-stone-400">N/A ({order.diningType})</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <fieldset disabled={busy || actionBusy} className="inline-flex items-center justify-end gap-1.5 disabled:opacity-50">
                          <button
                            type="button"
                            onClick={() => { setSelectedTab('details'); setSelectedId(order.id) }}
                            className="rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 hover:border-stone-400 transition cursor-pointer"
                          >
                            Details
                          </button>

                          {canManage && order.status === 'pending' && (
                            <button
                              type="button"
                              onClick={async () => { if (await onUpdateOrderStatus(order.id, 'preparing')) onForwardToChef?.(order) }}
                              className="rounded-lg bg-[#B84A22] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#9E3E1C] active:scale-95 transition cursor-pointer flex items-center gap-1"
                            >
                              <Flame className="h-3 w-3 text-amber-300" />
                              <span>Forward to Kitchen</span>
                            </button>
                          )}

                          {canManage && order.status === 'preparing' && (
                            <button
                              type="button"
                              onClick={() => void onUpdateOrderStatus(order.id, 'ready')}
                              className="rounded-lg bg-emerald-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-800 transition cursor-pointer"
                            >
                              Mark Ready
                            </button>
                          )}

                          {(canManage || canDeliver) && order.status === 'ready' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (order.diningType === 'delivery') {
                                  setSelectedTab('handover')
                                  setSelectedId(order.id)
                                } else if (order.diningType === 'takeaway' && onCompleteTakeaway) {
                                  void action(() => onCompleteTakeaway(order.id))
                                } else {
                                  void onUpdateOrderStatus(order.id, 'delivered')
                                }
                              }}
                              className={`rounded-lg px-2.5 py-1 text-xs font-semibold text-white transition cursor-pointer ${
                                order.diningType === 'takeaway'
                                  ? 'bg-emerald-700 hover:bg-emerald-800'
                                  : 'bg-stone-900 hover:bg-stone-800'
                              }`}
                            >
                              {order.diningType === 'delivery'
                                ? 'Kitchen handover & bag ticket'
                                : order.diningType === 'takeaway'
                                ? `Handover & Complete (#${order.pickupCode || 'TK'})`
                                : 'Confirm Handover'}
                            </button>
                          )}

                          {(canManage || canDeliver) && order.status === 'delivered' && order.paymentMethod === 'cash' && order.paymentStatus === 'pending' && (
                            <button
                              type="button"
                              onClick={() => void action(() => orderService.collectCash(order.id))}
                              className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800 hover:bg-amber-100 transition cursor-pointer"
                            >
                              Confirm Cash Collected
                            </button>
                          )}

                          {canCancel && ['pending', 'preparing', 'ready'].includes(order.status) && (
                            <button
                              type="button"
                              onClick={() => void onUpdateOrderStatus(order.id, 'cancelled')}
                              className="text-red-700 underline text-xs px-1 hover:text-red-900 cursor-pointer"
                            >
                              Cancel Order
                            </button>
                          )}
                        </fieldset>

                        {order.diningType === 'delivery' && currentUser.permissions.includes('orders:view') && (
                          <div className="mt-2 text-left">
                            <DeliveryActivityPanel orderId={order.id} progress={order.deliveryProgress} canResolve={canManage} onReload={onReload} />
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Cards View (Visual Cards for Touch & Mobile) */}
      {viewMode === 'cards' && rows.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rows.map(order => {
            const badge = statusBadgeStyles[order.status] || { label: order.status, bg: 'bg-stone-100', text: 'text-stone-800', border: 'border-stone-200' }
            return (
              <article key={order.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs space-y-3.5">
                {/* Header Row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-base text-[#1C1917]">{order.orderNumber}</h2>
                    {order.diningType === 'delivery' ? (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                        <Bike className="h-3 w-3" /> Delivery
                      </span>
                    ) : order.diningType === 'dine-in' ? (
                      <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                        <TableProperties className="h-3 w-3" /> Table {order.tableNumber || 'Dine-In'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        <ShoppingBag className="h-3 w-3" /> Takeaway
                      </span>
                    )}

                    {order.diningType === 'takeaway' && (
                      <>
                        <span className="font-mono font-bold text-[10px] bg-stone-900 text-white px-2 py-0.5 rounded shadow-2xs">
                          #{order.pickupCode || 'TK'}
                        </span>
                        {order.customerArrivedAt && (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-600 text-white px-2 py-0.5 text-[10px] font-bold animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                            At Counter Now
                          </span>
                        )}
                        {order.pickupRack && (
                          <span className="text-[10px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Rack: {order.pickupRack}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                    <span>{badge.label}</span>
                  </span>
                </div>

                {/* Customer, Time & Address */}
                <div className="text-xs space-y-1 text-stone-600">
                  <p className="font-semibold text-stone-900">{order.customerName} {order.customerPhone ? `&bull; ${order.customerPhone}` : ''}</p>
                  {order.deliveryAddress && <p className="text-stone-500">Address: {order.deliveryAddress}</p>}
                  {order.scheduledFor && <p className="text-amber-800">Scheduled: {new Date(order.scheduledFor).toLocaleString()}</p>}
                </div>

                {/* Items */}
                <div className="rounded-xl bg-stone-50 p-2.5 text-xs text-stone-700">
                  <p className="font-medium text-stone-900 mb-1">Items ({order.items.reduce((sum, i) => sum + i.quantity, 0)}):</p>
                  <p>{order.items.map(item => `${item.quantity} × ${item.name}`).join(', ')}</p>
                </div>

                {/* Financials & Courier */}
                <div className="flex flex-wrap items-center justify-between text-xs pt-1 border-t border-stone-100 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#1C1917]">€{order.totalAmount.toFixed(2)}</span>
                    <span className="text-stone-500">Payment: {order.paymentMethod} / {order.paymentStatus}</span>
                  </div>
                  {order.diningType === 'delivery' && (
                    <span className="text-stone-600 font-medium">
                      Courier: {order.assignedDriver?.name || 'Not assigned'}
                    </span>
                  )}
                </div>

                {/* Activity Panel */}
                {order.diningType === 'delivery' && currentUser.permissions.includes('orders:view') && (
                  <DeliveryActivityPanel orderId={order.id} progress={order.deliveryProgress} canResolve={canManage} onReload={onReload} />
                )}

                {/* Operations Action Fieldset */}
                <fieldset disabled={busy || actionBusy} className="flex flex-wrap items-center gap-2 text-xs pt-2 border-t border-stone-100 disabled:opacity-50">
                  <button
                    type="button"
                    className="underline text-stone-600 hover:text-stone-900"
                    onClick={() => { setSelectedTab('details'); setSelectedId(order.id) }}
                  >
                    Details
                  </button>

                  {canManage && order.diningType === 'delivery' && ['pending', 'preparing', 'ready'].includes(order.status) && (
                    <label className="flex items-center gap-1.5 text-xs">
                      <span>Assign courier</span>
                      <select
                        aria-label={`Courier for ${order.orderNumber}`}
                        className="rounded-lg border border-stone-200 bg-white p-1 text-xs"
                        disabled={driversLoading || Boolean(driversError)}
                        value={order.assignedDriver?.id || ''}
                        onChange={e => { if (e.target.value) void action(() => orderService.assignDelivery(order.id, e.target.value)) }}
                      >
                        <option value="">{drivers.length ? 'Select delivery staff' : 'No active delivery staff'}</option>
                        {drivers.map(driver => (
                          <option key={driver.id} value={driver.id}>
                            {driver.name} &bull; {driver.onDuty === undefined ? 'Duty unknown' : driver.onDuty ? 'On duty' : 'Off duty'}{driver.activeJobs !== undefined ? ` &bull; ${driver.activeJobs} active` : ''}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  {canManage && order.status === 'pending' && (
                    <button
                      type="button"
                      className="rounded-lg bg-[#B84A22] px-3 py-1.5 font-bold text-white hover:bg-[#9E3E1C] transition cursor-pointer"
                      onClick={async () => { if (await onUpdateOrderStatus(order.id, 'preparing')) onForwardToChef?.(order) }}
                    >
                      Forward to Kitchen
                    </button>
                  )}

                  {canManage && order.status === 'preparing' && (
                    <button
                      type="button"
                      className="rounded-lg bg-emerald-700 px-3 py-1.5 font-semibold text-white hover:bg-emerald-800 transition cursor-pointer"
                      onClick={() => void onUpdateOrderStatus(order.id, 'ready')}
                    >
                      Mark Ready
                    </button>
                  )}

                  {(canManage || canDeliver) && order.status === 'ready' && (
                    <button
                      type="button"
                      className={`rounded-lg px-3 py-1.5 font-semibold text-white transition cursor-pointer ${
                        order.diningType === 'takeaway'
                          ? 'bg-emerald-700 hover:bg-emerald-800'
                          : 'bg-stone-900 hover:bg-stone-800'
                      }`}
                      onClick={() => {
                        if (order.diningType === 'delivery') {
                          setSelectedTab('handover')
                          setSelectedId(order.id)
                        } else if (order.diningType === 'takeaway' && onCompleteTakeaway) {
                          void action(() => onCompleteTakeaway(order.id))
                        } else {
                          void onUpdateOrderStatus(order.id, 'delivered')
                        }
                      }}
                    >
                      {order.diningType === 'delivery'
                        ? 'Kitchen handover & bag ticket'
                        : order.diningType === 'takeaway'
                        ? `Handover & Complete (#${order.pickupCode || 'TK'})`
                        : 'Confirm Handover'}
                    </button>
                  )}

                  {order.status === 'out-for-delivery' && (
                    <p className="text-xs text-stone-500">Rider must verify the bag ticket at the doorstep to complete delivery.</p>
                  )}

                  {(canManage || canDeliver) && order.status === 'delivered' && order.paymentMethod === 'cash' && order.paymentStatus === 'pending' && (
                    <button
                      type="button"
                      className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 font-bold text-amber-800 hover:bg-amber-100 transition cursor-pointer"
                      onClick={() => void action(() => orderService.collectCash(order.id))}
                    >
                      Confirm Cash Collected
                    </button>
                  )}

                  {canCancel && ['pending', 'preparing', 'ready'].includes(order.status) && (
                    <button
                      type="button"
                      className="text-red-700 underline hover:text-red-900 ml-auto cursor-pointer"
                      onClick={() => void onUpdateOrderStatus(order.id, 'cancelled')}
                    >
                      Cancel Order
                    </button>
                  )}
                </fieldset>
              </article>
            )
          })}
        </div>
      )}

      {/* 6. Order Details & Thermal Slip Modal */}
      <OrderDetailsModal
        order={orders.find(order => order.id === selectedId) || null}
        initialTab={selectedTab}
        onClose={() => setSelectedId(null)}
        onUpdateStatus={onUpdateOrderStatus}
      />
    </div>
  )
}
