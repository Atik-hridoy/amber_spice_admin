import {
  BarChart3,
  Boxes,
  CalendarDays,
  ChefHat,
  ChevronRight,
  ClipboardList,
  Flame,
  LayoutGrid,
  ShieldCheck,
  Users,
  UtensilsCrossed,
} from 'lucide-react'
import type { AdminView } from '../../types/admin'

interface SidebarProps {
  activeView: AdminView
  onSelectView: (view: AdminView) => void
  activeKitchenCount: number
  lowStockCount: number
  isOpenMobile: boolean
  onCloseMobile: () => void
}

export function Sidebar({
  activeView,
  onSelectView,
  activeKitchenCount,
  lowStockCount,
  isOpenMobile,
  onCloseMobile,
}: SidebarProps) {
  const operationsNav: {
    id: AdminView
    label: string
    icon: typeof Flame
    badge?: number | string
    badgeColor?: string
  }[] = [
    {
      id: 'kitchen',
      label: 'Kitchen KDS',
      icon: Flame,
      badge: activeKitchenCount > 0 ? `${activeKitchenCount} Active` : undefined,
      badgeColor: 'bg-[#B84A22] text-white animate-pulse',
    },
    {
      id: 'orders',
      label: 'All Orders',
      icon: ClipboardList,
    },
    {
      id: 'tables',
      label: 'Tables & Booking',
      icon: CalendarDays,
    },
  ]

  const managementNav: {
    id: AdminView
    label: string
    icon: typeof LayoutGrid
    badge?: number | string
    badgeColor?: string
  }[] = [
    {
      id: 'analytics',
      label: 'Analytics & Sales',
      icon: BarChart3,
    },
    {
      id: 'inventory',
      label: 'Inventory & Stock',
      icon: Boxes,
      badge: lowStockCount > 0 ? `${lowStockCount} Low` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    },
    {
      id: 'products',
      label: 'Products & Menu',
      icon: UtensilsCrossed,
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
    },
    {
      id: 'staff',
      label: 'Staff & Roles',
      icon: ChefHat,
    },
  ]

  const handleSelect = (view: AdminView) => {
    onSelectView(view)
    onCloseMobile()
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-[#292524] bg-[#140F0C] text-stone-300 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-[#292524] px-5">
          <div className="flex items-center gap-3">
            <img
              src="/figma-assets/logo.png"
              alt="Amber Spice"
              className="h-9 w-auto object-contain"
            />
            <div>
              <span className="font-sans text-sm font-extrabold tracking-wider text-white uppercase">
                AMBER SPICE
              </span>
              <p className="text-[10px] font-medium text-amber-400/90 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Operations Portal
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Operations Section */}
          <div>
            <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-stone-500 uppercase">
              Operations
            </div>
            <div className="space-y-1">
              {operationsNav.map((item) => {
                const Icon = item.icon
                const isActive = activeView === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition cursor-pointer ${
                      isActive
                        ? 'bg-[#B84A22] text-white shadow-md'
                        : 'text-stone-300 hover:bg-[#1F1814] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-stone-400 group-hover:text-amber-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Management Section */}
          <div>
            <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-stone-500 uppercase">
              Management
            </div>
            <div className="space-y-1">
              {managementNav.map((item) => {
                const Icon = item.icon
                const isActive = activeView === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition cursor-pointer ${
                      isActive
                        ? 'bg-[#B84A22] text-white shadow-md'
                        : 'text-stone-300 hover:bg-[#1F1814] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-stone-400 group-hover:text-amber-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge ? (
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    ) : (
                      <ChevronRight className={`h-3 w-3 opacity-0 group-hover:opacity-100 transition ${isActive ? 'text-white' : 'text-stone-500'}`} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Staff Profile Footer */}
        <div className="border-t border-[#292524] p-3.5 bg-[#100C0A]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-[#B84A22] to-[#FBA138] text-xs font-bold text-white shadow-xs">
                T
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 border border-[#140F0C]" />
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-tight">Chef Tariqul</p>
                <p className="text-[10px] text-stone-400">Head Chef & QC</p>
              </div>
            </div>

            <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-3 w-3" />
              <span>Admin</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
