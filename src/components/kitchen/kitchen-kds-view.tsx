import { useState } from 'react'
import {
  Bike,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  Flame,
  LayoutGrid,
  Plus,
  Printer,
  Search,
  ShoppingBag,
  TableProperties,
  X,
} from 'lucide-react'
import type { KitchenStation, Order, OrderStatus } from '../../types/admin'

interface KitchenKdsViewProps {
  orders: Order[]
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void
  onAddTicket?: (order: Order) => void
}

export function KitchenKdsView({ orders, onUpdateOrderStatus, onAddTicket }: KitchenKdsViewProps) {
  const [selectedStation, setSelectedStation] = useState<KitchenStation>('all')
  const [selectedServiceType, setSelectedServiceType] = useState<'all' | 'delivery' | 'takeaway'>('all')
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table')
  const [stageFilter, setStageFilter] = useState<'all' | 'pending' | 'preparing' | 'ready'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null)
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false)

  // New ticket form state
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newDiningType, setNewDiningType] = useState<'delivery' | 'takeaway' | 'dine-in'>('delivery')
  const [newDishName, setNewDishName] = useState('Royal Chicken Dum Biryani')
  const [newDishStation, setNewDishStation] = useState<'biryani' | 'curry' | 'grill' | 'breads'>('biryani')
  const [newDishQuantity, setNewDishQuantity] = useState(1)
  const [newDishPrice, setNewDishPrice] = useState(14.5)

  // Filter orders by active kitchen status (live tickets)
  const liveOrders = orders.filter(
    (o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready'
  )

  // Stage counts
  const incomingCount = liveOrders.filter((o) => o.status === 'pending').length
  const inProgressCount = liveOrders.filter((o) => o.status === 'preparing').length
  const readyCount = liveOrders.filter((o) => o.status === 'ready').length

  // Filtered orders
  const filteredOrders = liveOrders.filter((order) => {
    // Stage filter
    if (stageFilter !== 'all' && order.status !== stageFilter) return false

    // Service type filter
    if (selectedServiceType === 'delivery' && order.diningType !== 'delivery') return false
    if (selectedServiceType === 'takeaway' && order.diningType !== 'takeaway') return false

    // Station filter
    if (selectedStation !== 'all') {
      const hasStation = order.items.some((item) => item.station === selectedStation)
      if (!hasStation) return false
    }

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const matchOrderNum = order.orderNumber.toLowerCase().includes(query)
      const matchCustomer = order.customerName.toLowerCase().includes(query)
      const matchItem = order.items.some((i) => i.name.toLowerCase().includes(query))
      if (!matchOrderNum && !matchCustomer && !matchItem) return false
    }

    return true
  })

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCustomerName.trim()) return

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `#AS-${Math.floor(2000 + Math.random() * 900)}`,
      customerName: newCustomerName,
      customerPhone: '+353 87 ' + Math.floor(1000000 + Math.random() * 9000000),
      diningType: newDiningType,
      tableNumber: newDiningType === 'dine-in' ? 'Table 5' : undefined,
      status: 'pending',
      totalAmount: newDishPrice * newDishQuantity,
      paymentStatus: 'paid',
      paymentMethod: 'card',
      createdAt: 'Just now',
      estimatedTimeMinutes: 15,
      elapsedMinutes: 1,
      items: [
        {
          id: `item-${Date.now()}`,
          name: newDishName,
          quantity: newDishQuantity,
          price: newDishPrice,
          station: newDishStation,
        },
      ],
    }

    if (onAddTicket) {
      onAddTicket(newOrder)
    }
    setIsNewTicketOpen(false)
    setNewCustomerName('')
  }

  return (
    <div className="space-y-4">
      {/* 1. Header Section (Figma node #24057:4450) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E7E5E4]/80 pb-3">
        <div>
          <h2 className="font-sans text-xl font-bold tracking-[-0.025em] text-[#1C1917]">
            Kitchen Orders
          </h2>
          <p className="text-[11.5px] leading-[17.25px] text-[#78716C] mt-0.5">
            Track and manage live orders across preparation stations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewTicketOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#F15A24] px-3.5 py-1.5 text-xs font-medium text-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04)] hover:brightness-105 active:scale-95 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Ticket</span>
        </button>
      </div>

      {/* 2. Search & Filter Bar Card (Figma node #24057:4468) */}
      <div className="rounded-2xl border border-[#E7E5E4] bg-white p-3 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04)] flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
        {/* Search Input (Figma: width 448px, height 40px) */}
        <div className="relative w-full xl:w-[448px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A29E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ticket # or customer..."
            className="w-full h-10 rounded-xl border border-[#E7E5E4] bg-[#FAFAF9] pl-10 pr-4 text-[13.5px] font-medium text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#F15A24] focus:bg-white transition"
          />
        </div>

        {/* Right Segmented Controls (Figma node #24057:4475) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Station Segment (Figma node #24057:4476) */}
          <div className="h-10 rounded-xl bg-[#F5F5F4]/80 border border-[#E7E5E4]/60 p-1 flex items-center gap-1">
            {(
              [
                { id: 'all', label: 'All Stations' },
                { id: 'biryani', label: 'Biryani' },
                { id: 'curry', label: 'Curries' },
                { id: 'grill', label: 'Grill' },
                { id: 'breads', label: 'Breads' },
              ] as const
            ).map((st) => {
              const isActive = selectedStation === st.id
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSelectedStation(st.id)}
                  className={`h-8 rounded-lg px-2.5 sm:px-3 text-xs transition cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#1C1917] font-semibold border border-[#E7E5E4]/60 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04)]'
                      : 'text-[#78716C] font-medium hover:text-[#1C1917]'
                  }`}
                >
                  {st.label}
                </button>
              )
            })}
          </div>

          {/* Service Type Segment (Figma node #24057:4488) */}
          <div className="h-10 rounded-xl bg-[#F5F5F4]/80 border border-[#E7E5E4]/60 p-1 flex items-center gap-1">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'delivery', label: 'Delivery' },
                { id: 'takeaway', label: 'Pickup' },
              ] as const
            ).map((type) => {
              const isActive = selectedServiceType === type.id
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedServiceType(type.id)}
                  className={`h-8 rounded-lg px-2.5 sm:px-3 text-xs transition cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#1C1917] font-semibold border border-[#E7E5E4]/60 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04)]'
                      : 'text-[#78716C] font-medium hover:text-[#1C1917]'
                  }`}
                >
                  {type.label}
                </button>
              )
            })}
          </div>

          {/* View Mode Segment (Figma node #24057:4495) */}
          <div className="h-10 rounded-xl bg-[#F5F5F4]/80 border border-[#E7E5E4]/60 p-1 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`h-8 rounded-lg px-2.5 sm:px-3 text-xs flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#1C1917] font-semibold border border-[#E7E5E4]/60 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04)]'
                  : 'text-[#78716C] font-medium hover:text-[#1C1917]'
              }`}
            >
              <TableProperties className="h-3.5 w-3.5" />
              <span>Table View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={`h-8 rounded-lg px-2.5 sm:px-3 text-xs flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'board'
                  ? 'bg-white text-[#1C1917] font-semibold border border-[#E7E5E4]/60 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04)]'
                  : 'text-[#78716C] font-medium hover:text-[#1C1917]'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Board View</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Kitchen Orders Main Container Card (Figma node #24057:4514) */}
      <div className="rounded-2xl border border-[#E7E5E4] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04)] overflow-hidden">
        {/* Subheader Tabs Bar (Figma node #24057:4515) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#F5F5F4] bg-[#FAFAF9]/50 px-4 py-3">
          {/* Stage Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setStageFilter('all')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition cursor-pointer ${
                stageFilter === 'all'
                  ? 'bg-white text-[#1C1917] font-semibold border border-[#E7E5E4] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04)]'
                  : 'text-[#78716C] font-semibold hover:text-[#1C1917]'
              }`}
            >
              <span>All Active</span>
              <span className="rounded-full bg-[#F5F5F4] px-1.5 py-0.2 text-[11px] font-bold text-[#57534E]">
                {liveOrders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStageFilter('pending')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition cursor-pointer ${
                stageFilter === 'pending'
                  ? 'bg-white text-[#1C1917] font-semibold border border-[#E7E5E4] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04)]'
                  : 'text-[#78716C] font-semibold hover:text-[#1C1917]'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-[#F43F5E]" />
              <span>Incoming</span>
              <span className="rounded-full bg-[#F5F5F4] px-1.5 py-0.2 text-[11px] font-bold text-[#57534E]">
                {incomingCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStageFilter('preparing')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition cursor-pointer ${
                stageFilter === 'preparing'
                  ? 'bg-white text-[#1C1917] font-semibold border border-[#E7E5E4] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04)]'
                  : 'text-[#78716C] font-semibold hover:text-[#1C1917]'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-[#F15A24]" />
              <span>In Progress</span>
              <span className="rounded-full bg-[#F5F5F4] px-1.5 py-0.2 text-[11px] font-bold text-[#57534E]">
                {inProgressCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStageFilter('ready')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition cursor-pointer ${
                stageFilter === 'ready'
                  ? 'bg-white text-[#1C1917] font-semibold border border-[#E7E5E4] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04)]'
                  : 'text-[#78716C] font-semibold hover:text-[#1C1917]'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-[#10B981]" />
              <span>Ready / Dispatched</span>
              <span className="rounded-full bg-[#F5F5F4] px-1.5 py-0.2 text-[11px] font-bold text-[#57534E]">
                {readyCount}
              </span>
            </button>
          </div>

          {/* Right Text (Figma: Showing 3 active tickets) */}
          <div className="text-xs text-[#A8A29E] font-medium shrink-0">
            Showing <strong className="font-bold text-[#44403C]">{filteredOrders.length}</strong> active tickets
          </div>
        </div>

        {/* 4. Table View (Figma node #24057:4543) */}
        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E7E5E4] bg-[#FAFAF9] text-[11px] font-bold tracking-[0.05em] text-[#78716C] uppercase">
                <tr>
                  <th className="px-4 py-3">Ticket & Type</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Elapsed</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F4]">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-stone-500">
                      No tickets matching current filters.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const isIncoming = order.status === 'pending'
                    const isInProgress = order.status === 'preparing'
                    const isReady = order.status === 'ready'

                    return (
                      <tr key={order.id} className="hover:bg-stone-50/60 transition">
                        {/* Ticket & Type */}
                        <td className="px-4 py-3.5">
                          <div>
                            <span className="font-mono text-xs font-bold tracking-[-0.025em] text-[#1C1917] block">
                              {order.orderNumber}
                            </span>
                            <div className="flex items-center gap-1 mt-0.5 text-[11px] text-[#78716C] font-medium">
                              {order.diningType === 'delivery' ? (
                                <Bike className="h-3.5 w-3.5 text-[#78716C]" />
                              ) : (
                                <ShoppingBag className="h-3.5 w-3.5 text-[#78716C]" />
                              )}
                              <span>{order.diningType === 'takeaway' ? 'collection' : order.diningType}</span>
                            </div>
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="px-4 py-3.5">
                          <div>
                            <span className="font-bold text-xs text-[#1C1917] block">
                              {order.customerName}
                            </span>
                            <span className="text-[11px] font-normal text-[#78716C]">
                              {order.items.reduce((acc, i) => acc + i.quantity, 0)} items &bull; €{order.totalAmount.toFixed(2)}
                            </span>
                          </div>
                        </td>

                        {/* Items */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-1">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex items-center gap-1.5 text-xs">
                                <span className="font-bold text-[#F15A24] shrink-0">
                                  {item.quantity}&times;
                                </span>
                                <span className="font-semibold text-[#1C1917] line-clamp-1">
                                  {item.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Elapsed Timer */}
                        <td className="px-4 py-3.5">
                          <div
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold border ${
                              order.elapsedMinutes >= 20
                                ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#B45309]'
                                : 'bg-[#F5F5F4] border-[#E7E5E4] text-[#57534E]'
                            }`}
                          >
                            <Clock className="h-3 w-3" />
                            <span>{order.elapsedMinutes}m</span>
                          </div>
                        </td>

                        {/* Stage Pill */}
                        <td className="px-4 py-3.5">
                          {isIncoming && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF1F2] border border-[rgba(254,205,211,0.7)] px-2.5 py-1 text-xs font-semibold text-[#BE123C]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#F43F5E]" />
                              <span>Incoming</span>
                            </span>
                          )}
                          {isInProgress && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF7ED] border border-[rgba(254,215,170,0.7)] px-2.5 py-1 text-xs font-semibold text-[#F15A24]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#F15A24]" />
                              <span>In Progress</span>
                            </span>
                          )}
                          {isReady && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF5] border border-[rgba(167,243,208,0.7)] px-2.5 py-1 text-xs font-semibold text-[#047857]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                              <span>Ready</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Primary Action Button */}
                            {isIncoming && (
                              <button
                                type="button"
                                onClick={() => onUpdateOrderStatus(order.id, 'preparing')}
                                className="inline-flex items-center gap-1 rounded-lg bg-[#F15A24] px-3 py-1.5 text-xs font-medium text-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04)] hover:brightness-105 active:scale-95 transition cursor-pointer"
                              >
                                <Flame className="h-3 w-3" />
                                <span>Fire Ticket</span>
                              </button>
                            )}
                            {isInProgress && (
                              <button
                                type="button"
                                onClick={() => onUpdateOrderStatus(order.id, 'ready')}
                                className="inline-flex items-center gap-1 rounded-lg bg-[#059669] px-3 py-1.5 text-xs font-medium text-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04)] hover:bg-[#047857] active:scale-95 transition cursor-pointer"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Mark Ready</span>
                              </button>
                            )}
                            {isReady && (
                              <button
                                type="button"
                                onClick={() => onUpdateOrderStatus(order.id, 'delivered')}
                                className="inline-flex items-center gap-1 rounded-lg bg-[#1C1917] px-3 py-1.5 text-xs font-medium text-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04)] hover:bg-[#292524] active:scale-95 transition cursor-pointer"
                              >
                                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                <span>Handover</span>
                              </button>
                            )}

                            {/* Print Docket Button */}
                            {(isInProgress || isReady) && (
                              <button
                                type="button"
                                onClick={() => alert(`Docket for ${order.orderNumber} sent to kitchen printer!`)}
                                title="Print Kitchen Docket"
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E7E5E4] bg-white text-stone-600 hover:border-[#F15A24] hover:text-[#F15A24] transition cursor-pointer"
                              >
                                <Printer className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* View Detail Button */}
                            <button
                              type="button"
                              onClick={() => setSelectedOrderForModal(order)}
                              title="View Ticket Details"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E7E5E4] bg-white text-stone-600 hover:border-[#F15A24] hover:text-[#F15A24] transition cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* 5. Board View (Kanban 3-Column Display) */
          <div className="p-4 bg-[#FBF9F7] grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {/* Incoming Column */}
            <div className="rounded-2xl border border-red-200 bg-red-50/30 p-3 space-y-3">
              <div className="flex items-center justify-between border-b border-red-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#F43F5E]" />
                  <span className="font-sans text-xs font-bold text-red-950">Incoming</span>
                </div>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
                  {incomingCount}
                </span>
              </div>

              {liveOrders
                .filter((o) => o.status === 'pending')
                .map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-stone-200 bg-white p-3 shadow-2xs hover:border-[#F15A24] transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-stone-900">
                        {order.orderNumber}
                      </span>
                      <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                        {order.elapsedMinutes}m ago
                      </span>
                    </div>
                    <p className="font-semibold text-xs text-stone-800 mt-1">{order.customerName}</p>
                    <div className="my-2 border-t border-stone-100 pt-2 space-y-1">
                      {order.items.map((i) => (
                        <div key={i.id} className="text-xs text-stone-600 flex justify-between">
                          <span>
                            <strong className="text-[#F15A24]">{i.quantity}&times;</strong> {i.name}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => onUpdateOrderStatus(order.id, 'preparing')}
                      className="w-full rounded-lg bg-[#F15A24] py-1.5 text-xs font-semibold text-white shadow-2xs hover:brightness-105 active:scale-98 transition cursor-pointer"
                    >
                      Fire Ticket
                    </button>
                  </div>
                ))}
            </div>

            {/* In Progress Column */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-3 space-y-3">
              <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#F15A24]" />
                  <span className="font-sans text-xs font-bold text-amber-950">In Progress</span>
                </div>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  {inProgressCount}
                </span>
              </div>

              {liveOrders
                .filter((o) => o.status === 'preparing')
                .map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-stone-200 bg-white p-3 shadow-2xs hover:border-[#F15A24] transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-stone-900">
                        {order.orderNumber}
                      </span>
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        {order.elapsedMinutes}m
                      </span>
                    </div>
                    <p className="font-semibold text-xs text-stone-800 mt-1">{order.customerName}</p>
                    <div className="my-2 border-t border-stone-100 pt-2 space-y-1">
                      {order.items.map((i) => (
                        <div key={i.id} className="text-xs text-stone-600 flex justify-between">
                          <span>
                            <strong className="text-[#F15A24]">{i.quantity}&times;</strong> {i.name}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => onUpdateOrderStatus(order.id, 'ready')}
                      className="w-full rounded-lg bg-[#059669] py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#047857] active:scale-98 transition cursor-pointer"
                    >
                      Mark Ready
                    </button>
                  </div>
                ))}
            </div>

            {/* Ready / Dispatched Column */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-3 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#10B981]" />
                  <span className="font-sans text-xs font-bold text-emerald-950">Ready / Dispatched</span>
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  {readyCount}
                </span>
              </div>

              {liveOrders
                .filter((o) => o.status === 'ready')
                .map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-stone-200 bg-white p-3 shadow-2xs hover:border-emerald-500 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-stone-900">
                        {order.orderNumber}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Ready {order.elapsedMinutes}m
                      </span>
                    </div>
                    <p className="font-semibold text-xs text-stone-800 mt-1">{order.customerName}</p>
                    <div className="my-2 border-t border-stone-100 pt-2 space-y-1">
                      {order.items.map((i) => (
                        <div key={i.id} className="text-xs text-stone-600 flex justify-between">
                          <span>
                            <strong className="text-[#F15A24]">{i.quantity}&times;</strong> {i.name}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => onUpdateOrderStatus(order.id, 'delivered')}
                      className="w-full rounded-lg bg-[#1C1917] py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#292524] active:scale-98 transition cursor-pointer"
                    >
                      Handover
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Ticket Details Modal */}
      {selectedOrderForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setSelectedOrderForModal(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="font-mono text-base font-bold text-stone-900">
                  {selectedOrderForModal.orderNumber}
                </span>
                <p className="text-xs text-stone-500">
                  {selectedOrderForModal.customerName} &bull; {selectedOrderForModal.diningType}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForModal(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="h-4 w-4 text-stone-600" />
              </button>
            </div>

            <div className="my-4 space-y-2">
              {selectedOrderForModal.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl bg-stone-50 p-2.5 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#F15A24]">{item.quantity}&times;</span>
                    <span className="font-semibold text-stone-900">{item.name}</span>
                  </div>
                  <span className="font-bold text-stone-800">
                    €{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-stone-100 pt-3 flex justify-between items-center text-xs">
              <span className="font-bold text-stone-900">Total: €{selectedOrderForModal.totalAmount.toFixed(2)}</span>
              <span className="font-medium text-stone-500">Elapsed: {selectedOrderForModal.elapsedMinutes} mins</span>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => alert('Docket sent to printer!')}
                className="flex-1 rounded-xl border border-stone-200 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
              >
                Print Docket
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrderForModal(null)}
                className="flex-1 rounded-xl bg-stone-900 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {isNewTicketOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsNewTicketOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif text-base font-bold text-stone-900">
                Fire New Kitchen Ticket
              </h3>
              <button
                type="button"
                onClick={() => setIsNewTicketOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="h-4 w-4 text-stone-600" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Customer / Table Name</label>
                <input
                  type="text"
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="e.g. Liam Ward or Table 8"
                  className="w-full rounded-xl border border-stone-200 p-2.5 text-stone-900 focus:outline-none focus:border-[#F15A24]"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Service Type</label>
                <select
                  value={newDiningType}
                  onChange={(e) => setNewDiningType(e.target.value as any)}
                  className="w-full rounded-xl border border-stone-200 p-2.5 text-stone-900 focus:outline-none focus:border-[#F15A24]"
                >
                  <option value="delivery">Delivery</option>
                  <option value="takeaway">Pickup / Collection</option>
                  <option value="dine-in">Dine-In Restaurant</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Dish Name</label>
                <select
                  value={newDishName}
                  onChange={(e) => {
                    const dish = e.target.value
                    setNewDishName(dish)
                    if (dish.includes('Biryani')) {
                      setNewDishStation('biryani')
                      setNewDishPrice(16.5)
                    } else if (dish.includes('Chicken') || dish.includes('Curry')) {
                      setNewDishStation('curry')
                      setNewDishPrice(14.5)
                    } else if (dish.includes('Tandoori') || dish.includes('Tikka')) {
                      setNewDishStation('grill')
                      setNewDishPrice(13.5)
                    } else {
                      setNewDishStation('breads')
                      setNewDishPrice(3.5)
                    }
                  }}
                  className="w-full rounded-xl border border-stone-200 p-2.5 text-stone-900 focus:outline-none focus:border-[#F15A24]"
                >
                  <option value="Royal Chicken Dum Biryani">Royal Chicken Dum Biryani (€16.50)</option>
                  <option value="Kashmiri Lamb Rogan Josh">Kashmiri Lamb Rogan Josh (€16.99)</option>
                  <option value="Old Delhi Butter Chicken">Old Delhi Butter Chicken (€14.50)</option>
                  <option value="Flame-Grilled Tandoori Chicken">Flame-Grilled Tandoori Chicken (€13.50)</option>
                  <option value="Garlic Butter Naan">Garlic Butter Naan (€3.50)</option>
                </select>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="font-semibold text-stone-700 block mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newDishQuantity}
                    onChange={(e) => setNewDishQuantity(Number(e.target.value))}
                    className="w-full rounded-xl border border-stone-200 p-2.5 text-stone-900 focus:outline-none focus:border-[#F15A24]"
                  />
                </div>
                <div className="flex-1">
                  <label className="font-semibold text-stone-700 block mb-1">Station</label>
                  <input
                    type="text"
                    disabled
                    value={newDishStation.toUpperCase()}
                    className="w-full rounded-xl border border-stone-200 bg-stone-100 p-2.5 text-stone-600 font-bold uppercase"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewTicketOpen(false)}
                  className="flex-1 rounded-xl border border-stone-200 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#F15A24] py-2.5 text-xs font-bold text-white shadow-xs hover:brightness-105 active:scale-98 transition cursor-pointer"
                >
                  Fire Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
