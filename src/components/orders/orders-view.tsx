import { useState } from 'react'
import {
  CheckCircle2,
  Eye,
  Filter,
  Flame,
  Search,
} from 'lucide-react'
import type { Order, OrderStatus } from '../../types/admin'
import { OrderDetailsModal } from '../kitchen/order-details-modal'

interface OrdersViewProps {
  orders: Order[]
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void
  onForwardToChef?: (order: Order) => void
}

export function OrdersView({ orders, onUpdateOrderStatus, onForwardToChef }: OrdersViewProps) {
  const [selectedDiningType, setSelectedDiningType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [forwardToast, setForwardToast] = useState<string | null>(null)

  const handleForwardOrder = (order: Order) => {
    onUpdateOrderStatus(order.id, 'preparing')
    if (onForwardToChef) {
      onForwardToChef(order)
    }
    setForwardToast(`Order ${order.orderNumber} forwarded to Chef Marco's kitchen prep queue!`)
    setTimeout(() => {
      setForwardToast(null)
    }, 3500)
  }

  const filteredOrders = orders.filter((order) => {
    const matchesDining = selectedDiningType === 'all' || order.diningType === selectedDiningType
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus
    const matchesSearch =
      !searchQuery.trim() ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.tableNumber && order.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesDining && matchesStatus && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Real-time Order Forwarding Toast */}
      {forwardToast && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-3 text-white shadow-lg animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p className="text-xs font-bold">{forwardToast}</p>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order #, guest name, table..."
            className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] py-2 pl-10 pr-4 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#B84A22] focus:bg-white focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-stone-500 font-medium">
            <Filter className="h-3.5 w-3.5" />
            <span>Type:</span>
          </div>

          <select
            value={selectedDiningType}
            onChange={(e) => setSelectedDiningType(e.target.value)}
            className="rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 focus:outline-none"
          >
            <option value="all">All Dining Types</option>
            <option value="dine-in">Dine-In Tables</option>
            <option value="delivery">Online Delivery</option>
            <option value="takeaway">Takeaway Pickup</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="preparing">Cooking</option>
            <option value="ready">Ready to Serve</option>
            <option value="out-for-delivery">Out for Delivery</option>
            <option value="delivered">Delivered / Completed</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-stone-200 bg-stone-50 text-[11px] font-bold tracking-wider text-stone-500 uppercase">
              <tr>
                <th className="px-5 py-3.5">Order ID</th>
                <th className="px-5 py-3.5">Guest & Contact</th>
                <th className="px-5 py-3.5">Service Type</th>
                <th className="px-5 py-3.5">Items Summary</th>
                <th className="px-5 py-3.5">Total & Payment</th>
                <th className="px-5 py-3.5">Order Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-500">
                    No orders matching your criteria found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const statusColors: Record<OrderStatus, string> = {
                    pending: 'bg-stone-100 text-stone-700',
                    preparing: 'bg-amber-100 text-amber-800 border-amber-200',
                    ready: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                    'out-for-delivery': 'bg-purple-100 text-purple-800 border-purple-200',
                    delivered: 'bg-blue-50 text-blue-700',
                    cancelled: 'bg-red-50 text-red-700',
                  }

                  return (
                    <tr key={order.id} className="hover:bg-stone-50/70 transition">
                      <td className="px-5 py-4 font-mono font-bold text-stone-900">
                        {order.orderNumber}
                        <span className="block font-sans text-[10px] font-normal text-stone-400">
                          {order.createdAt}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-semibold text-stone-800 block">
                          {order.customerName}
                        </span>
                        <span className="text-[11px] text-stone-400">
                          {order.customerPhone}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="capitalize font-semibold text-stone-700">
                          {order.diningType === 'dine-in' ? order.tableNumber : order.diningType}
                        </span>
                      </td>

                      <td className="px-5 py-4 max-w-xs truncate text-stone-600">
                        {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-bold text-stone-900 block">
                          €{order.totalAmount.toFixed(2)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-700 uppercase">
                          {order.paymentStatus} &bull; {order.paymentMethod}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold capitalize border ${statusColors[order.status]}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {order.status === 'out-for-delivery' ? 'Out for Delivery' : order.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:border-[#B84A22] hover:text-[#B84A22] transition cursor-pointer"
                            title="View Order Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {order.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => handleForwardOrder(order)}
                              className="rounded-lg bg-[#B84A22] px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#9E3E1C] active:scale-95 transition cursor-pointer flex items-center gap-1.5"
                              title="Forward order to Chef's prep station"
                            >
                              <Flame className="h-3 w-3 text-amber-300" />
                              <span>Forward to Chef 👨‍🍳</span>
                            </button>
                          )}
                          {order.status === 'preparing' && (
                            <button
                              type="button"
                              onClick={() => onUpdateOrderStatus(order.id, 'ready')}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700 transition cursor-pointer"
                            >
                              Ready
                            </button>
                          )}
                          {order.status === 'ready' && (
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateOrderStatus(
                                  order.id,
                                  order.diningType === 'delivery' ? 'out-for-delivery' : 'delivered'
                                )
                              }
                              className="rounded-lg bg-stone-900 px-2.5 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-stone-800 transition cursor-pointer"
                            >
                              {order.diningType === 'delivery' ? 'Dispatch' : 'Done'}
                            </button>
                          )}
                          {order.status === 'out-for-delivery' && (
                            <button
                              type="button"
                              onClick={() => onUpdateOrderStatus(order.id, 'delivered')}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700 transition cursor-pointer"
                            >
                              Delivered
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal (Figma node #24057:12413) */}
      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={onUpdateOrderStatus}
      />
    </div>
  )
}
