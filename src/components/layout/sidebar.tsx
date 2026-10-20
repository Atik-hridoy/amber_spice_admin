import {
  BarChart3,
  Boxes,
  CalendarDays,
  ChefHat,
  ChevronRight,
  ClipboardList,
  Flame,
  LayoutGrid,
  LogOut,
  Settings,
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
      label: 'Kitchen Orders',
      icon: Flame,
      badge: activeKitchenCount > 0 ? `${activeKitchenCount}` : undefined,
      badgeColor: 'bg-white/20 text-white font-bold',
    },
    {
      id: 'orders',
      label: 'All Orders',
      icon: ClipboardList,
    },
    {
      id: 'inventory',
      label: 'Inventory & Stock',
      icon: Boxes,
      badge: lowStockCount > 0 ? `${lowStockCount} Low` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
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
      label: 'Analytics',
      icon: BarChart3,
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: LayoutGrid,
    },
    {
      id: 'products',
      label: 'Products',
      icon: UtensilsCrossed,
    },
    {
      id: 'staff',
      label: 'Staff & Roles',
      icon: ChefHat,
    },
    {
      id: 'tables',
      label: 'Tables & Booking',
      icon: CalendarDays,
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
        {/* Brand Header (Figma node #24057:4231) */}
        <div className="flex h-14 items-center justify-between border-b border-[#292524]/80 px-5">
          <div className="flex items-center gap-3">
            <img
              src="/figma-assets/logo.png"
              alt="Amber Spice"
              className="h-8 w-auto object-contain"
            />
            <div>
              <span className="font-sans text-[15px] font-bold tracking-tight text-white block leading-tight">
                AMBER SPICE
              </span>
              <p className="text-[11px] font-medium text-[#A8A29E] flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                <span>Staff Portal</span>
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {/* Operations Section */}
          <div>
            <div className="px-3 pb-1.5 text-[10.5px] font-bold tracking-[0.05em] text-[#78716C] uppercase">
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
                        ? 'bg-[#F15A24] text-white shadow-[0px_2px_4px_-2px_rgba(241,90,36,0.25),0px_4px_6px_-1px_rgba(241,90,36,0.25)]'
                        : 'text-stone-300 hover:bg-[#1F1814] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-stone-400 group-hover:text-amber-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge ? (
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    ) : (
                      isActive && <ChevronRight className="h-3.5 w-3.5 text-white/80" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Management Section */}
          <div>
            <div className="px-3 pb-1.5 text-[10.5px] font-bold tracking-[0.05em] text-[#78716C] uppercase">
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
                        ? 'bg-[#F15A24] text-white shadow-[0px_2px_4px_-2px_rgba(241,90,36,0.25),0px_4px_6px_-1px_rgba(241,90,36,0.25)]'
                        : 'text-stone-300 hover:bg-[#1F1814] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
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

        {/* Staff Profile Footer Card (Figma node #24057:4376) */}
        <div className="border-t border-[#292524]/80 p-3 bg-[#100C0A]">
          <div className="flex items-center justify-between rounded-xl border border-[#292524] bg-[#1C1917]/90 p-2.5 shadow-xs">
            <div className="flex items-center gap-2.5">
              <img
                src="/figma-assets/about/about-chef-tariq.png"
                alt="Tariq Al-Hassan"
                className="h-8 w-8 rounded-lg object-cover border border-white/15 shadow-xs"
              />
              <div>
                <p className="text-xs font-semibold text-white leading-tight">
                  Tariq Al-Hassan
                </p>
                <p className="text-[10px] text-[#A8A29E] mt-0.5">
                  admin &bull; Profile
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                title="Account Settings"
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title="Sign Out"
                className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-800 transition cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
