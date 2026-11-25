import { useEffect, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChefHat,
  Clock,
  Download,
  Euro,
  Flame,
  RefreshCw,
  ShoppingBag,
  Star,
  TrendingUp,
  UtensilsCrossed,
} from 'lucide-react'
import { adminRequest } from '../../services/api-client'

interface TopDishMetric {
  id: number
  name: string
  price?: string | number
  orders_count: number
  rating?: number
}

interface DailySaleMetric {
  date: string
  orders: number
  revenue: string
}

export interface AnalyticsSummaryResponse {
  totalRevenue: number
  todayRevenue: number
  totalOrders: number
  todayOrders: number
  activeKitchenOrders: number
  lowStockAlerts: number
  tables: {
    total: number
    occupied: number
    available: number
  }
  topDishes: TopDishMetric[]
  dailySales: DailySaleMetric[]
  timestamp?: string
}

export function AnalyticsLiveView() {
  const [data, setData] = useState<AnalyticsSummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [chartMetric, setChartMetric] = useState<'revenue' | 'orders'>('revenue')

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    adminRequest<AnalyticsSummaryResponse>('analytics/summary/', {
      requireAuth: true,
      signal: controller.signal,
    })
      .then((value) => {
        if (!controller.signal.aborted) {
          setData(value)
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Unable to load analytics report.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [retry])

  const handleExportCSV = () => {
    if (!data) return
    const headers = ['Date', 'Orders', 'Paid Revenue (EUR)', 'Avg Order Value (EUR)']
    const rows = data.dailySales.map((d) => {
      const rev = Number(d.revenue || 0)
      const aov = d.orders > 0 ? rev / d.orders : 0
      return [d.date, d.orders, rev.toFixed(2), aov.toFixed(2)]
    })
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csvContent))
    link.setAttribute(
      'download',
      `Amber_Spice_Analytics_${new Date().toISOString().slice(0, 10)}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const dailySales = data?.dailySales || []
  const weekRevenue = dailySales.reduce((sum, d) => sum + Number(d.revenue || 0), 0)
  const weekOrders = dailySales.reduce((sum, d) => sum + d.orders, 0)
  const avgOrderValue =
    data && data.totalOrders > 0 ? data.totalRevenue / data.totalOrders : 0

  const maxChartValue = Math.max(
    1,
    ...dailySales.map((d) => (chartMetric === 'revenue' ? Number(d.revenue || 0) : d.orders))
  )

  const totalTables = data?.tables.total || 0
  const occupiedTables = data?.tables.occupied || 0
  const availableTables = data?.tables.available || 0
  const otherTables = Math.max(0, totalTables - occupiedTables - availableTables)
  const occupancyPct = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0

  const maxDishOrders = Math.max(
    1,
    ...(data?.topDishes || []).map((d) => d.orders_count || 0)
  )

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1C1917] tracking-tight">
              Revenue &amp; Operations Analytics
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-stone-400" />
            <span>
              {data?.timestamp
                ? `Synced ${new Date(data.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : 'Real-time sales, kitchen velocity & floor utilization'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!data}
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-50 disabled:opacity-50 transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-stone-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setRetry((v) => v + 1)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#1C1917] px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-stone-800 disabled:opacity-60 transition cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div
          role="alert"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setRetry((v) => v + 1)}
            className="self-start sm:self-auto rounded-lg bg-rose-600 px-3 py-1.5 font-bold text-white hover:bg-rose-700 transition cursor-pointer"
          >
            Retry Report
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !data && !error && (
        <div role="status" className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl border border-stone-200 bg-white p-4" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 h-72 rounded-2xl border border-stone-200 bg-white" />
            <div className="lg:col-span-5 h-72 rounded-2xl border border-stone-200 bg-white" />
          </div>
        </div>
      )}

      {/* Main Dashboard Content */}
      {data && (
        <>
          {/* 4 Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Today's Paid Revenue */}
            <div className="relative overflow-hidden rounded-2xl border border-[#F15A24]/25 bg-gradient-to-br from-white via-white to-amber-50/60 p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-500">Paid Revenue Today</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F15A24]/10 text-[#B84A22]">
                  <Euro className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2.5 text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                €{data.todayRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-[#B84A22]">
                  {data.todayOrders} order{data.todayOrders === 1 ? '' : 's'} today
                </span>
                <span className="text-stone-400">Settled payments</span>
              </div>
            </div>

            {/* Total Paid Revenue + AOV */}
            <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-500">All-Time Paid Revenue</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <TrendingUp className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2.5 text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                €{data.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-emerald-700">
                  Avg Ticket: €{avgOrderValue.toFixed(2)}
                </span>
                <span className="text-stone-400">{data.totalOrders} total orders</span>
              </div>
            </div>

            {/* Live Kitchen & Dining Floor */}
            <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-500">Kitchen &amp; Floor Pulse</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <ChefHat className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <p className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                  {data.activeKitchenOrders}
                </p>
                <span className="text-xs font-semibold text-stone-500">active tickets</span>
              </div>
              <div className="mt-2.5 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-stone-500">Table Occupancy</span>
                  <span className="font-bold text-stone-800">
                    {occupiedTables}/{totalTables} ({occupancyPct}%)
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-stone-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                    style={{ width: `${occupancyPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Inventory Health */}
            <div
              className={`rounded-2xl border p-5 shadow-2xs ${
                data.lowStockAlerts > 0
                  ? 'border-amber-200 bg-amber-50/40'
                  : 'border-emerald-200/80 bg-emerald-50/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-600">Stock &amp; BOM Health</span>
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    data.lowStockAlerts > 0
                      ? 'bg-amber-500/15 text-amber-700'
                      : 'bg-emerald-500/15 text-emerald-700'
                  }`}
                >
                  {data.lowStockAlerts > 0 ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                </span>
              </div>
              <p
                className={`mt-2.5 text-2xl sm:text-3xl font-black tracking-tight ${
                  data.lowStockAlerts > 0 ? 'text-amber-800' : 'text-emerald-800'
                }`}
              >
                {data.lowStockAlerts}
              </p>
              <p className="mt-2 text-[11px] font-medium text-stone-600">
                {data.lowStockAlerts > 0
                  ? 'Ingredients at or below safety stock'
                  : 'All pantry & kitchen ingredients optimal'}
              </p>
            </div>
          </div>

          {/* Interactive 7-Day Trend Chart + Top Selling Dishes */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* 7-Day Sales Chart */}
            <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-5 shadow-2xs">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-[#B84A22]" />
                      <h2 className="text-sm font-bold text-stone-900">
                        Last 7 Days Performance
                      </h2>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      7-day total: <strong className="text-stone-800">€{weekRevenue.toFixed(2)}</strong> across{' '}
                      <strong className="text-stone-800">{weekOrders}</strong> orders
                    </p>
                  </div>

                  {/* Metric Switcher */}
                  <div className="inline-flex self-start sm:self-auto rounded-xl bg-stone-100 p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setChartMetric('revenue')}
                      className={`rounded-lg px-3 py-1 font-semibold transition cursor-pointer ${
                        chartMetric === 'revenue'
                          ? 'bg-white text-stone-900 shadow-2xs'
                          : 'text-stone-500 hover:text-stone-900'
                      }`}
                    >
                      Revenue (€)
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartMetric('orders')}
                      className={`rounded-lg px-3 py-1 font-semibold transition cursor-pointer ${
                        chartMetric === 'orders'
                          ? 'bg-white text-stone-900 shadow-2xs'
                          : 'text-stone-500 hover:text-stone-900'
                      }`}
                    >
                      Orders
                    </button>
                  </div>
                </div>

                {/* Vertical Bar Chart */}
                <div className="mt-6 relative">
                  {/* Subtle horizontal grid lines */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 bottom-7 flex flex-col justify-between">
                    <div className="border-b border-dashed border-stone-100 w-full" />
                    <div className="border-b border-dashed border-stone-100 w-full" />
                    <div className="border-b border-stone-200/80 w-full" />
                  </div>

                  <div className="relative z-10 flex h-56 items-end justify-between gap-2 sm:gap-4 px-1 sm:px-2 pt-8">
                    {dailySales.map((d, idx) => {
                      const rev = Number(d.revenue || 0)
                      const val = chartMetric === 'revenue' ? rev : d.orders
                      const rawPct = Math.round((val / maxChartValue) * 100)
                      const barHeight = val > 0 ? Math.max(10, rawPct) : 4
                      const isToday = idx === dailySales.length - 1
                      const dateObj = new Date(`${d.date}T00:00:00`)
                      const dayLabel = dateObj.toLocaleDateString(undefined, { weekday: 'short' })
                      const shortDate = dateObj.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })

                      return (
                        <div
                          key={d.date}
                          className="flex flex-1 flex-col items-center gap-1.5 h-full justify-end group"
                        >
                          {/* Value Label */}
                          <span
                            className={`text-[10px] font-bold transition ${
                              val > 0
                                ? 'text-stone-700 opacity-90 sm:opacity-70 group-hover:opacity-100'
                                : 'text-stone-300 opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            {chartMetric === 'revenue' ? `€${rev.toFixed(0)}` : d.orders}
                          </span>

                          {/* Bar */}
                          <div className="w-full flex items-end justify-center flex-1">
                            <div
                              title={`${shortDate}: €${rev.toFixed(2)} (${d.orders} orders)`}
                              className={`w-full max-w-[40px] rounded-t-xl transition-all duration-500 group-hover:brightness-105 ${
                                val === 0
                                  ? 'bg-stone-100'
                                  : isToday
                                  ? 'bg-gradient-to-t from-[#B84A22] to-[#FBA138] shadow-sm'
                                  : 'bg-gradient-to-t from-stone-300 to-stone-200 group-hover:from-[#F15A24]/70 group-hover:to-[#FBA138]/70'
                              }`}
                              style={{ height: `${barHeight}%` }}
                            />
                          </div>

                          {/* X-Axis Labels */}
                          <div className="text-center leading-tight">
                            <span
                              className={`block text-[11px] ${
                                isToday ? 'font-bold text-[#B84A22]' : 'font-semibold text-stone-600'
                              }`}
                            >
                              {dayLabel}
                            </span>
                            <span className="hidden sm:block text-[9px] text-stone-400">
                              {shortDate}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Footer note */}
              <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 text-[11px] text-stone-400">
                <span>Hover or tap bars for daily breakdown</span>
                <span className="font-semibold text-[#B84A22]">Today highlighted</span>
              </div>
            </div>

            {/* Top Selling Dishes Leaderboard */}
            <div className="lg:col-span-5 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-2xs flex flex-col">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-[#F15A24]" />
                  <h2 className="text-sm font-bold text-stone-900">Top Selling Dishes</h2>
                </div>
                <span className="rounded-full bg-[#FFF7ED] border border-[#F15A24]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#B84A22]">
                  By Order Volume
                </span>
              </div>

              {data.topDishes.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-stone-400">
                  <UtensilsCrossed className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-xs font-semibold text-stone-600">No dish orders recorded yet</p>
                  <p className="text-[11px] mt-0.5">Bestsellers will appear here as orders come in.</p>
                </div>
              ) : (
                <div className="mt-4 space-y-4 flex-1">
                  {data.topDishes.map((dish, idx) => {
                    const pct = Math.max(8, Math.round((dish.orders_count / maxDishOrders) * 100))
                    const rankStyle =
                      idx === 0
                        ? 'bg-amber-400/20 text-amber-800 border-amber-300'
                        : idx === 1
                        ? 'bg-stone-200/70 text-stone-700 border-stone-300'
                        : idx === 2
                        ? 'bg-orange-100 text-orange-800 border-orange-200'
                        : 'bg-stone-100 text-stone-600 border-stone-200'

                    return (
                      <div key={dish.id} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-[11px] font-black ${rankStyle}`}
                            >
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-stone-900 truncate">
                                {dish.name}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-stone-400">
                                {dish.price !== undefined && (
                                  <span className="font-mono font-semibold text-stone-600">
                                    €{Number(dish.price).toFixed(2)}
                                  </span>
                                )}
                                {dish.rating !== undefined && Number(dish.rating) > 0 && (
                                  <span className="inline-flex items-center gap-0.5 text-amber-600 font-semibold">
                                    <Star className="h-2.5 w-2.5 fill-current" />
                                    {Number(dish.rating).toFixed(1)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <span className="shrink-0 text-xs font-black text-stone-800">
                            {dish.orders_count}{' '}
                            <span className="font-medium text-[10px] text-stone-400">sold</span>
                          </span>
                        </div>

                        <div className="h-1.5 w-full rounded-full bg-stone-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              idx === 0
                                ? 'bg-gradient-to-r from-[#B84A22] to-[#FBA138]'
                                : 'bg-stone-300'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Floor Utilization + 7-Day Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Dining Floor Card */}
            <div className="lg:col-span-4 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h2 className="text-sm font-bold text-stone-900">Dining Floor Snapshot</h2>
                <span className="text-xs font-bold text-indigo-600">{totalTables} Tables</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-indigo-50/70 border border-indigo-100 p-3">
                  <p className="text-lg font-black text-indigo-800">{occupiedTables}</p>
                  <p className="text-[10px] font-semibold text-indigo-600 uppercase">Occupied</p>
                </div>
                <div className="rounded-xl bg-emerald-50/70 border border-emerald-100 p-3">
                  <p className="text-lg font-black text-emerald-800">{availableTables}</p>
                  <p className="text-[10px] font-semibold text-emerald-600 uppercase">Available</p>
                </div>
                <div className="rounded-xl bg-amber-50/70 border border-amber-100 p-3">
                  <p className="text-lg font-black text-amber-800">{otherTables}</p>
                  <p className="text-[10px] font-semibold text-amber-600 uppercase">Reserved</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-500">Current Capacity Load</span>
                  <span className="font-bold text-stone-900">{occupancyPct}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-stone-100 overflow-hidden flex">
                  {totalTables > 0 && (
                    <>
                      <div
                        className="bg-indigo-500 h-full"
                        style={{ width: `${(occupiedTables / totalTables) * 100}%` }}
                      />
                      <div
                        className="bg-amber-400 h-full"
                        style={{ width: `${(otherTables / totalTables) * 100}%` }}
                      />
                      <div
                        className="bg-emerald-400 h-full"
                        style={{ width: `${(availableTables / totalTables) * 100}%` }}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 7-Day Daily Breakdown Table / Mobile Cards */}
            <div className="lg:col-span-8 overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-2xs">
              <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-stone-500" />
                  <h2 className="text-sm font-bold text-stone-900">Daily Sales Ledger (7 Days)</h2>
                </div>
                <span className="text-[11px] text-stone-400">Paid orders only</span>
              </div>

              {/* Mobile Card List */}
              <div className="sm:hidden divide-y divide-stone-100">
                {dailySales.map((day) => {
                  const rev = Number(day.revenue || 0)
                  const aov = day.orders > 0 ? rev / day.orders : 0
                  return (
                    <div key={day.date} className="flex items-center justify-between px-4 py-3 text-xs">
                      <div>
                        <p className="font-bold text-stone-900">{day.date}</p>
                        <p className="text-[11px] text-stone-500">
                          {day.orders} orders • Avg €{aov.toFixed(2)}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-[#B84A22]">€{rev.toFixed(2)}</span>
                    </div>
                  )
                })}
              </div>

              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    <tr>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Orders</th>
                      <th className="px-5 py-3">Paid Revenue</th>
                      <th className="px-5 py-3 text-right">Avg Ticket</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {dailySales.map((day) => {
                      const rev = Number(day.revenue || 0)
                      const aov = day.orders > 0 ? rev / day.orders : 0
                      return (
                        <tr key={day.date} className="hover:bg-stone-50/70 transition">
                          <td className="px-5 py-3 font-semibold text-stone-900">{day.date}</td>
                          <td className="px-5 py-3 text-stone-600">{day.orders}</td>
                          <td className="px-5 py-3 font-mono font-bold text-[#B84A22]">
                            €{rev.toFixed(2)}
                          </td>
                          <td className="px-5 py-3 text-right font-mono text-stone-600">
                            €{aov.toFixed(2)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
