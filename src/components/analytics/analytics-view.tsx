import {
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Flame,
  ShoppingBag,
  Sparkles,
  Users,
} from 'lucide-react'
import type { AnalyticsSummary } from '../../types/admin'

interface AnalyticsViewProps {
  analytics: AnalyticsSummary
}

export function AnalyticsView({ analytics }: AnalyticsViewProps) {
  const weeklyData = [
    { day: 'Mon', revenue: 1950, orders: 48 },
    { day: 'Tue', revenue: 2180, orders: 54 },
    { day: 'Wed', revenue: 2420, orders: 62 },
    { day: 'Thu', revenue: 2650, orders: 69 },
    { day: 'Fri', revenue: 3840, orders: 95 },
    { day: 'Sat', revenue: 4210, orders: 110 },
    { day: 'Sun', revenue: 2845, orders: 74 },
  ]

  const maxRevenue = Math.max(...weeklyData.map((d) => d.revenue))

  return (
    <div className="space-y-6">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Gross Sales Today</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-[#B84A22]">
              <DollarSign className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-black text-stone-900">
              €{analytics.todayRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <span className="flex items-center text-xs font-bold text-emerald-600">
              <ArrowUpRight className="h-3.5 w-3.5" />
              +{analytics.revenueGrowthPercent}%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-stone-400">vs. same day last week (€2,408)</p>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Total Orders</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ShoppingBag className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-black text-stone-900">74</p>
            <span className="flex items-center text-xs font-bold text-emerald-600">
              <ArrowUpRight className="h-3.5 w-3.5" />
              +14.5%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-stone-400">4 active right now in kitchen</p>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Avg. Kitchen Prep</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Flame className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-black text-stone-900">
              {analytics.averagePrepTimeMinutes} mins
            </p>
            <span className="flex items-center text-xs font-bold text-emerald-600">
              -2.1m faster
            </span>
          </div>
          <p className="mt-1 text-[11px] text-stone-400">Target goal: &le; 20 minutes</p>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Table Occupancy</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-black text-stone-900">
              {Math.round((analytics.tablesOccupied / analytics.totalTables) * 100)}%
            </p>
            <span className="text-xs font-semibold text-stone-500">
              {analytics.tablesOccupied} of {analytics.totalTables} Tables
            </span>
          </div>
          <p className="mt-1 text-[11px] text-stone-400">2 upcoming reservations</p>
        </div>
      </div>

      {/* Sales Chart and Top Dishes Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Weekly Revenue Bar Chart */}
        <div className="lg:col-span-7 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-serif text-sm font-bold text-stone-900">
                Weekly Revenue Trend
              </h3>
              <p className="text-xs text-stone-500">Gross sales across dining & delivery</p>
            </div>
            <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700">
              This Week
            </span>
          </div>

          {/* Bar Chart Container */}
          <div className="mt-6 flex h-48 items-end justify-between gap-3 px-2 pt-6">
            {weeklyData.map((d) => {
              const heightPercent = Math.round((d.revenue / maxRevenue) * 100)
              const isToday = d.day === 'Sun'

              return (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-bold text-stone-600 opacity-0 group-hover:opacity-100 transition">
                    €{d.revenue}
                  </span>
                  <div
                    className={`w-full max-w-[36px] rounded-t-xl transition-all duration-300 group-hover:brightness-110 ${
                      isToday
                        ? 'bg-gradient-to-t from-[#B84A22] to-[#FBA138]'
                        : 'bg-stone-200 group-hover:bg-stone-300'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span
                    className={`text-xs ${
                      isToday ? 'font-bold text-[#B84A22]' : 'text-stone-500'
                    }`}
                  >
                    {d.day}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Selling Dishes */}
        <div className="lg:col-span-5 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-serif text-sm font-bold text-stone-900">
              Bestseller Dishes
            </h3>
            <span className="text-xs text-[#B84A22] font-semibold">Top Ranked</span>
          </div>

          <div className="mt-4 space-y-3.5">
            {analytics.topSellingDishes.map((dish, idx) => (
              <div key={dish.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-xs font-black text-stone-800">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-stone-900">{dish.name}</p>
                    <p className="text-[11px] text-stone-400">{dish.sales} orders placed</p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-stone-900">
                  €{dish.revenue.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dining & Payment Mode Distribution */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-2xs">
          <h4 className="font-serif text-sm font-bold text-stone-900 mb-3">
            Dining Mode Breakdown
          </h4>
          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1">
                <span>Dine-In Restaurant (52%)</span>
                <span>€1,479.66</span>
              </div>
              <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                <div className="h-full bg-[#B84A22] rounded-full" style={{ width: '52%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1">
                <span>Online Delivery (34%)</span>
                <span>€967.47</span>
              </div>
              <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                <div className="h-full bg-[#FBA138] rounded-full" style={{ width: '34%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1">
                <span>Takeaway Pickup (14%)</span>
                <span>€398.37</span>
              </div>
              <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                <div className="h-full bg-stone-400 rounded-full" style={{ width: '14%' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-2xs">
          <h4 className="font-serif text-sm font-bold text-stone-900 mb-3">
            Payment Methods
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 text-xs">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-stone-800">Visa / Mastercard (Stripe)</span>
              </div>
              <span className="font-bold text-stone-900">68% &bull; €1,934.94</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span className="font-semibold text-stone-800">Apple Pay & Google Pay</span>
              </div>
              <span className="font-bold text-stone-900">24% &bull; €682.92</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 text-xs">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-stone-800">Cash on Delivery / Pickup</span>
              </div>
              <span className="font-bold text-stone-900">8% &bull; €227.64</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
