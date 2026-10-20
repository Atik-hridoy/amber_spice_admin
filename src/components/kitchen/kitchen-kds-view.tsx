import { useState } from 'react'
import {
  AlertCircle,
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  Soup,
  Sparkles,
  Timer,
  UtensilsCrossed,
} from 'lucide-react'
import type { KitchenStation, Order, OrderStatus } from '../../types/admin'

interface KitchenKdsViewProps {
  orders: Order[]
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void
}

export function KitchenKdsView({ orders, onUpdateOrderStatus }: KitchenKdsViewProps) {
  const [selectedStation, setSelectedStation] = useState<KitchenStation>('all')
  const [activeTab, setActiveTab] = useState<'all' | 'preparing' | 'ready'>('all')

  const stations: { id: KitchenStation; label: string; icon: typeof Flame }[] = [
    { id: 'all', label: 'All Stations', icon: UtensilsCrossed },
    { id: 'tandoor', label: 'Tandoor & Grill', icon: Flame },
    { id: 'curry', label: 'Curry & Gravy', icon: Soup },
    { id: 'biryani', label: 'Dum Biryani Line', icon: Sparkles },
    { id: 'dessert', label: 'Desserts & Cold', icon: Timer },
  ]

  // Filter orders by active kitchen status
  const kitchenOrders = orders.filter((order) => {
    const isLive = order.status === 'pending' || order.status === 'preparing' || order.status === 'ready'
    const matchesTab = activeTab === 'all' || order.status === activeTab
    return isLive && matchesTab
  })

  // Filter items in each order by selected station
  const filteredOrders = kitchenOrders.filter((order) => {
    if (selectedStation === 'all') return true
    return order.items.some((item) => item.station === selectedStation)
  })

  return (
    <div className="space-y-6">
      {/* KDS Control Header Banner */}
      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-[#1A130E] via-[#2A1E17] to-[#1A130E] p-4 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="font-serif text-lg sm:text-xl font-bold tracking-wide text-white">
              Executive Kitchen Display System (KDS)
            </h2>
          </div>
          <p className="mt-1 text-xs text-stone-300">
            Live order queue for Tandoor, Handi Curry & Dum Biryani clay pots.
          </p>
        </div>

        {/* Quick KDS Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => alert('Chime sound alert tested!')}
            className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-xs hover:bg-white/20 transition cursor-pointer"
          >
            <Bell className="h-3.5 w-3.5 text-amber-400" />
            <span>Test Sound</span>
          </button>

          <div className="flex items-center gap-1 rounded-xl bg-[#B84A22] px-3 py-1.5 text-xs font-bold text-white shadow-sm">
            <span>{filteredOrders.length} Active Tickets</span>
          </div>
        </div>
      </div>

      {/* Station Filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap border-b border-stone-200/80 pb-3">
        {/* Station Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {stations.map((st) => {
            const Icon = st.icon
            const isSelected = selectedStation === st.id
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStation(st.id)}
                className={`flex items-center gap-2 shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#B84A22] text-white shadow-sm'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-white' : 'text-stone-500'}`} />
                <span>{st.label}</span>
              </button>
            )
          })}
        </div>

        {/* Status Filter Tab Pills */}
        <div className="flex items-center rounded-xl bg-stone-200/60 p-1 text-xs font-semibold">
          {(['all', 'preparing', 'ready'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3 py-1 capitalize transition cursor-pointer ${
                activeTab === tab
                  ? 'bg-white text-stone-900 shadow-2xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {tab === 'all' ? 'All Live' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* KDS Order Tickets Grid */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 bg-white p-12 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          <h3 className="mt-3 font-serif text-lg font-bold text-stone-900">
            Kitchen Queue Clear!
          </h3>
          <p className="mt-1 text-xs text-stone-500 max-w-sm">
            All active station orders have been prepared and delivered to dining tables.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
          {filteredOrders.map((order) => {
            const isUrgent = order.elapsedMinutes > order.estimatedTimeMinutes
            const displayItems =
              selectedStation === 'all'
                ? order.items
                : order.items.filter((item) => item.station === selectedStation)

            return (
              <div
                key={order.id}
                className={`flex flex-col rounded-2xl border bg-white shadow-sm transition-all overflow-hidden ${
                  isUrgent
                    ? 'border-red-400 ring-2 ring-red-400/20'
                    : order.status === 'ready'
                    ? 'border-emerald-400/80 ring-1 ring-emerald-400/20'
                    : 'border-stone-200/80 hover:border-[#B84A22]/50'
                }`}
              >
                {/* Ticket Header */}
                <div
                  className={`flex items-center justify-between p-3.5 border-b ${
                    isUrgent
                      ? 'bg-red-50/70 border-red-200'
                      : order.status === 'ready'
                      ? 'bg-emerald-50/70 border-emerald-200'
                      : 'bg-stone-50/80 border-stone-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-stone-900">
                        {order.orderNumber}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          order.diningType === 'dine-in'
                            ? 'bg-amber-100 text-amber-800'
                            : order.diningType === 'delivery'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-stone-200 text-stone-800'
                        }`}
                      >
                        {order.diningType === 'dine-in' ? order.tableNumber || 'Dine In' : order.diningType}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                      Guest: <span className="text-stone-800 font-semibold">{order.customerName}</span>
                    </p>
                  </div>

                  {/* Elapsed Timer Pill */}
                  <div
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${
                      isUrgent
                        ? 'bg-red-600 text-white animate-pulse'
                        : order.status === 'ready'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-200 text-stone-800'
                    }`}
                  >
                    <Clock className="h-3 w-3" />
                    <span>{order.elapsedMinutes}m</span>
                  </div>
                </div>

                {/* Items List */}
                <div className="flex-1 p-3.5 space-y-2.5">
                  {displayItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-2 border-b border-stone-100 pb-2 last:border-none last:pb-0"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-stone-900 text-xs font-black text-white">
                          {item.quantity}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-stone-900 leading-snug">
                            {item.name}
                          </p>
                          {item.customizations && item.customizations.length > 0 && (
                            <p className="text-[10px] font-medium text-[#B84A22] mt-0.5">
                              {item.customizations.join(' • ')}
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="shrink-0 rounded-md bg-stone-100 px-1.5 py-0.5 text-[9px] font-semibold text-stone-500 uppercase">
                        {item.station}
                      </span>
                    </div>
                  ))}

                  {/* Order Special Notes */}
                  {order.notes && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-2 text-[11px] text-amber-800 flex items-start gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600 mt-0.5" />
                      <span>{order.notes}</span>
                    </div>
                  )}
                </div>

                {/* Ticket Action Footer */}
                <div className="border-t border-stone-200/80 bg-stone-50/50 p-3 flex items-center gap-2">
                  {order.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => onUpdateOrderStatus(order.id, 'preparing')}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#B84A22] py-2 text-xs font-bold text-white shadow-xs hover:bg-[#9E3E1C] active:scale-98 transition cursor-pointer"
                    >
                      <Flame className="h-3.5 w-3.5" />
                      <span>Start Cooking</span>
                    </button>
                  )}

                  {order.status === 'preparing' && (
                    <button
                      type="button"
                      onClick={() => onUpdateOrderStatus(order.id, 'ready')}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-98 transition cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Mark Ready</span>
                    </button>
                  )}

                  {order.status === 'ready' && (
                    <button
                      type="button"
                      onClick={() => onUpdateOrderStatus(order.id, 'delivered')}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-stone-900 py-2 text-xs font-bold text-white shadow-xs hover:bg-stone-800 active:scale-98 transition cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Serve / Complete</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
