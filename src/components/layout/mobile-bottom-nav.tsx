import {
  Boxes,
  CalendarDays,
  ClipboardList,
  Flame,
  Menu,
  User,
  Users,
} from 'lucide-react'
import type { AdminUser, AdminView } from '../../types/admin'
import { isViewAllowed } from '../../utils/roles'

interface MobileAdminBottomNavProps {
  activeView: AdminView
  onSelectView: (view: AdminView) => void
  onOpenMenu: () => void
  currentUser: AdminUser
  activeKitchenCount: number
  lowStockCount: number
}

export function MobileAdminBottomNav({
  activeView,
  onSelectView,
  onOpenMenu,
  currentUser,
  activeKitchenCount,
  lowStockCount,
}: MobileAdminBottomNavProps) {
  const candidates: {
    id: AdminView
    label: string
    icon: typeof Flame
    badge?: number
  }[] = [
    {
      id: 'kitchen',
      label: 'KDS',
      icon: Flame,
      badge: activeKitchenCount > 0 ? activeKitchenCount : undefined,
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ClipboardList,
    },
    {
      id: 'inventory',
      label: 'Stock',
      icon: Boxes,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    {
      id: 'tables',
      label: 'Tables',
      icon: CalendarDays,
    },
    {
      id: 'customers',
      label: 'Guests',
      icon: Users,
    },
    {
      id: 'account',
      label: 'Account',
      icon: User,
    },
  ]

  // Pick up to 4 highest-priority views allowed for this user's role
  const allowedTabs = candidates
    .filter((item) => isViewAllowed(item.id, currentUser))
    .slice(0, 4)

  return (
    <nav
      aria-label="Mobile quick navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200/90 bg-white/95 backdrop-blur-md lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
    >
      <div className="flex h-16 items-center justify-around px-1.5">
        {allowedTabs.map((tab) => {
          const Icon = tab.icon
          const isActive =
            activeView === tab.id ||
            (tab.id === 'orders' && activeView === 'transactions')
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectView(tab.id)}
              className={`relative flex flex-1 flex-col items-center justify-center py-1.5 rounded-xl transition cursor-pointer ${
                isActive
                  ? 'text-[#F15A24]'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#F15A24] px-1 text-[9px] font-bold text-white ring-2 ring-white">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`mt-0.5 text-[10px] leading-tight ${
                  isActive ? 'font-bold text-[#F15A24]' : 'font-medium'
                }`}
              >
                {tab.label}
              </span>
            </button>
          )
        })}

        {/* Always show Menu button to open full role drawer */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="relative flex flex-1 flex-col items-center justify-center py-1.5 rounded-xl text-stone-500 hover:text-stone-900 transition cursor-pointer"
        >
          <Menu className="h-5 w-5 stroke-2" />
          <span className="mt-0.5 text-[10px] font-medium leading-tight">More</span>
        </button>
      </div>
    </nav>
  )
}
