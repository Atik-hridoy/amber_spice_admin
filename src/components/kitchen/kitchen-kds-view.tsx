import { useState } from 'react'
import {
  AlertTriangle,
  Bike,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  Flame,
  LayoutGrid,
  PackageCheck,
  Printer,
  Search,
  ShoppingBag,
  TableProperties,
  X,
} from 'lucide-react'
import type { KitchenStation, Order, OrderStatus } from '../../types/admin'
import { OrderDetailsModal } from './order-details-modal'

interface KitchenKdsViewProps {
  orders: Order[]
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => Promise<boolean>
  busy?: boolean
  onReportLowStock?: (alert: {
    ingredientName: string
    stockRemainingPercent: number
    note: string
  }) => Promise<void>
  inventoryList?: { id: string; name: string; currentStock: number; unit: string }[]
}

export function KitchenKdsView({
  orders,
  onUpdateOrderStatus,
  busy,
  onReportLowStock,
  inventoryList = [],
}: KitchenKdsViewProps) {
  const [selectedStation, setSelectedStation] = useState<KitchenStation>('all')
  const [selectedServiceType, setSelectedServiceType] = useState<'all' | 'delivery' | 'takeaway'>('all')
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table')
  const [stageFilter, setStageFilter] = useState<'all' | 'pending' | 'preparing' | 'ready'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null)
  const [selectedModalTab, setSelectedModalTab] = useState<'details' | 'slip' | 'handover'>('details')

  // Stock alert modal state (Chef alerts Manager & Staff)
  const [isStockAlertModalOpen, setIsStockAlertModalOpen] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState('')
  const [stockRemainingPercent, setStockRemainingPercent] = useState(20)
  const [stockAlertNote, setStockAlertNote] = useState('')
  const [stockAlertSuccess, setStockAlertSuccess] = useState<string | null>(null)
  const [stockAlertError, setStockAlertError] = useState('')
  const [stockAlertSending, setStockAlertSending] = useState(false)

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

  const handleSendStockAlert = async (e: React.FormEvent) => {
    e.preventDefault()
    if (stockAlertSending) return
    setStockAlertError('')
    const name = selectedIngredient || inventoryList[0]?.name
    if (!name || !onReportLowStock) { setStockAlertError('No saved inventory ingredient is available.'); return }
    setStockAlertSending(true)
    try {
      await onReportLowStock({ ingredientName: name, stockRemainingPercent, note: stockAlertNote.trim() })
      setStockAlertSuccess(`Stock alert for "${name}" saved for operations.`)
    } catch (error) { setStockAlertError(error instanceof Error ? error.message : 'Unable to save stock alert. Retry sending.') }
    finally { setStockAlertSending(false) }
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

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => { setStockAlertSuccess(null); setStockAlertError(''); setIsStockAlertModalOpen(true) }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3.5 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-500/20 active:scale-95 transition cursor-pointer"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <span>⚠️ Report Stock Running Low</span>
          </button>


        </div>
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
                            <button
                              type="button"
                              onClick={() => setSelectedOrderForModal(order)}
                              className="font-mono text-xs font-bold tracking-[-0.025em] text-[#1C1917] hover:text-[#F15A24] text-left transition cursor-pointer block"
                            >
                              {order.orderNumber}
                            </button>
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
                                disabled={busy} onClick={() => void onUpdateOrderStatus(order.id, 'preparing')}
                                className="inline-flex items-center gap-1 rounded-lg bg-[#F15A24] px-3 py-1.5 text-xs font-medium text-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04)] hover:brightness-105 active:scale-95 transition cursor-pointer"
                              >
                                <Flame className="h-3 w-3" />
                                <span>Fire Ticket</span>
                              </button>
                            )}
                            {isInProgress && (
                              <button
                                type="button"
                                disabled={busy} onClick={() => void onUpdateOrderStatus(order.id, 'ready')}
                                className="inline-flex items-center gap-1 rounded-lg bg-[#059669] px-3 py-1.5 text-xs font-medium text-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04)] hover:bg-[#047857] active:scale-95 transition cursor-pointer"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Mark Ready</span>
                              </button>
                            )}
                            {isReady && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (order.diningType === 'delivery') {
                                    setSelectedModalTab('handover')
                                    setSelectedOrderForModal(order)
                                  } else {
                                    void onUpdateOrderStatus(order.id, 'delivered')
                                  }
                                }}
                                className="inline-flex items-center gap-1 rounded-lg bg-[#B84A22] px-3 py-1.5 text-xs font-medium text-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04)] hover:bg-[#a03e1b] active:scale-95 transition cursor-pointer"
                              >
                                <PackageCheck className="h-3.5 w-3.5" />
                                <span>{order.diningType === 'delivery' ? 'Bags & Handover' : 'Confirm Handover'}</span>
                              </button>
                            )}

                            {/* Print Docket Button */}
                            {(isInProgress || isReady) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedModalTab(isReady && order.diningType === 'delivery' ? 'handover' : 'slip')
                                  setSelectedOrderForModal(order)
                                }}
                                title={isReady && order.diningType === 'delivery' ? 'Bag Tickets' : 'Print Kitchen Docket'}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E7E5E4] bg-white text-stone-600 hover:border-[#F15A24] hover:text-[#F15A24] transition cursor-pointer"
                              >
                                <Printer className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* View Detail Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedModalTab('details')
                                setSelectedOrderForModal(order)
                              }}
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
                      <button
                        type="button"
                        onClick={() => setSelectedOrderForModal(order)}
                        className="font-mono text-xs font-bold text-stone-900 hover:text-[#F15A24] transition cursor-pointer text-left"
                      >
                        {order.orderNumber}
                      </button>
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
                      disabled={busy} onClick={() => void onUpdateOrderStatus(order.id, 'preparing')}
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
                      <button
                        type="button"
                        onClick={() => setSelectedOrderForModal(order)}
                        className="font-mono text-xs font-bold text-stone-900 hover:text-[#F15A24] transition cursor-pointer text-left"
                      >
                        {order.orderNumber}
                      </button>
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
                      disabled={busy} onClick={() => void onUpdateOrderStatus(order.id, 'ready')}
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
                      <button
                        type="button"
                        onClick={() => setSelectedOrderForModal(order)}
                        className="font-mono text-xs font-bold text-stone-900 hover:text-[#F15A24] transition cursor-pointer text-left"
                      >
                        {order.orderNumber}
                      </button>
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
                      onClick={() => {
                        if (order.diningType === 'delivery') {
                          setSelectedModalTab('handover')
                          setSelectedOrderForModal(order)
                        } else {
                          void onUpdateOrderStatus(order.id, 'delivered')
                        }
                      }}
                      className="w-full rounded-lg bg-[#B84A22] py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#a03e1b] active:scale-98 transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <PackageCheck className="h-3.5 w-3.5" />
                      <span>{order.diningType === 'delivery' ? 'Bags & Handover' : 'Confirm Handover'}</span>
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Order Details / Thermal Slip Modal (Figma node #24057:12413) */}
      <OrderDetailsModal
        order={orders.find(order => order.id === selectedOrderForModal?.id) || null}
        initialTab={selectedModalTab}
        onClose={() => setSelectedOrderForModal(null)}
        onUpdateStatus={onUpdateOrderStatus}
      />

      {/* 4. Chef Stock-Running-Low Alert Modal */}
      {isStockAlertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-700">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">
                    Report Stock Running Low
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Notify Operations Staff &amp; Manager before stock runs out
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStockAlertModalOpen(false)}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {stockAlertSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-xs text-center space-y-1">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto" />
                <p className="font-bold text-sm">Stock Alert Saved</p>
                <p className="text-[11px]">{stockAlertSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleSendStockAlert} className="space-y-4 text-xs">
                {stockAlertError && <p role="alert" className="text-red-700">{stockAlertError}</p>}
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Select Ingredient Running Low:
                  </label>
                  <select
                    value={selectedIngredient || inventoryList[0]?.name || ''}
                    onChange={(e) => setSelectedIngredient(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-white p-2.5 text-stone-900 font-medium focus:outline-none focus:border-amber-500"
                  >
                    {!inventoryList.length && <option value="">No saved ingredients</option>}
                    {inventoryList.map(item => <option key={item.id} value={item.name}>{item.name} ({item.currentStock} {item.unit} remaining)</option>)}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Current Stock Remaining Estimate:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { percent: 25, label: '~25% Low', color: 'border-amber-400 bg-amber-50 text-amber-800' },
                      { percent: 15, label: '~15% Very Low', color: 'border-orange-400 bg-orange-50 text-orange-800' },
                      { percent: 5, label: '~5% Critical', color: 'border-rose-400 bg-rose-50 text-rose-800' },
                    ].map((opt) => (
                      <button
                        key={opt.percent}
                        type="button"
                        onClick={() => setStockRemainingPercent(opt.percent)}
                        className={`rounded-xl border p-2 text-center font-bold text-xs transition cursor-pointer ${
                          stockRemainingPercent === opt.percent
                            ? `${opt.color} ring-2 ring-amber-500`
                            : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Chef Note / Restock Urgent Request (Optional):
                  </label>
                  <textarea
                    rows={3}
                    value={stockAlertNote}
                    onChange={(e) => setStockAlertNote(e.target.value)}
                    placeholder="e.g. Running out fast during dinner prep. Need 5 kg before 8 PM."
                    className="w-full rounded-xl border border-stone-200 p-2.5 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsStockAlertModalOpen(false)}
                    className="flex-1 rounded-xl border border-stone-200 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-amber-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 active:scale-98 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>{stockAlertSending ? 'Saving?' : 'Save Stock Alert'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
