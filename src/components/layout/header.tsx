import { useState } from 'react'
import {
  Bell,
  CheckCircle2,
  Clock,
  Menu,
  RotateCw,
  Search,
  Sparkles,
} from 'lucide-react'
import type { AdminView } from '../../types/admin'

interface HeaderProps {
  activeView: AdminView
  onOpenMobileSidebar: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  activeOrdersCount: number
  occupiedTablesCount: number
  totalRevenue: number
}

const VIEW_TITLES: Record<AdminView, { title: string; subtitle: string }> = {
  kitchen: {
    title: 'Kitchen Display System (KDS)',
    subtitle: 'Real-time order tickets & preparation line',
  },
  orders: {
    title: 'Order Management',
    subtitle: 'Track and process dine-in, takeaway and delivery orders',
  },
  tables: {
    title: 'Dining Tables & Reservations',
    subtitle: 'Floor plan occupancy and reservation schedules',
  },
  analytics: {
    title: 'Business Analytics & Reports',
    subtitle: 'Revenue, sales volume, and popular dish rankings',
  },
  inventory: {
    title: 'Inventory & Stock Control',
    subtitle: 'Ingredient levels, replenishment alerts and supplier contacts',
  },
  products: {
    title: 'Menu Catalog & Products',
    subtitle: 'Dishes, pricing, categories and availability toggles',
  },
  customers: {
    title: 'Customer Directory',
    subtitle: 'Guest profiles, order frequency and VIP memberships',
  },
  staff: {
    title: 'Staff Roster & Operations Roles',
    subtitle: 'Kitchen personnel, front of house shifts and duties',
  },
  transactions: {
    title: 'Financial Transactions',
    subtitle: 'Payment records and invoice reconciliation',
  },
}

export function Header({
  activeView,
  onOpenMobileSidebar,
  searchQuery,
  onSearchChange,
  activeOrdersCount,
  occupiedTablesCount,
  totalRevenue,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 600)
  }

  const { title, subtitle } = VIEW_TITLES[activeView]

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#E7E5E4] bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open sidebar"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 lg:hidden cursor-pointer"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div>
          <h1 className="font-sans text-base sm:text-lg font-bold text-[#1A130E] leading-tight">
            {title}
          </h1>
          <p className="hidden text-xs text-stone-500 sm:block">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Middle & Right: Search & Quick Status & Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Search */}
        <div className="relative hidden md:block w-48 lg:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search orders, dishes..."
            className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] py-1.5 pl-9 pr-3 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#B84A22] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#B84A22]"
          />
        </div>

        {/* Live Status Indicators (Figma Header Pills) */}
        <div className="hidden xl:flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-stone-600 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-stone-800">{activeOrdersCount}</span>
            <span className="text-stone-400">Cooking</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-stone-600 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="font-semibold text-stone-800">{occupiedTablesCount}/12</span>
            <span className="text-stone-400">Tables</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-[#B84A22]/20 bg-[#FFF7ED] px-2.5 py-1 text-[#B84A22] font-bold shadow-2xs">
            <span>€{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <span className="text-[10px] font-normal text-stone-500">Today</span>
          </div>
        </div>

        {/* Live Refresh Button */}
        <button
          type="button"
          onClick={handleRefresh}
          title="Refresh live data"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 shadow-2xs hover:border-[#B84A22] hover:text-[#B84A22] transition active:scale-95 cursor-pointer"
        >
          <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-[#B84A22]' : ''}`} />
        </button>

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 shadow-2xs hover:border-[#B84A22] transition cursor-pointer"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#B84A22] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#B84A22]" />
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-stone-200 bg-white p-3 shadow-xl z-50">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="text-xs font-bold text-stone-900">Live Kitchen Alerts</span>
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  2 New
                </span>
              </div>
              <div className="mt-2 space-y-2">
                <div className="flex items-start gap-2.5 rounded-xl bg-amber-500/5 p-2 text-xs">
                  <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-stone-800">Order #AS-2841 at 12 mins</p>
                    <p className="text-[11px] text-stone-500">Tandoor station preparing naan and chicken</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 rounded-xl bg-emerald-500/5 p-2 text-xs">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-stone-800">Table 7 ready to serve</p>
                    <p className="text-[11px] text-stone-500">Old Delhi Tikka & Pulao ready for pickup</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Store Open / Status Badge */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#B84A22] to-[#FBA138] px-3 py-1.5 text-xs font-bold text-white shadow-xs">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Dublin Central Live</span>
        </div>
      </div>
    </header>
  )
}
