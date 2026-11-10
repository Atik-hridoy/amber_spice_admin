import { useState } from 'react'
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  LogOut,
  Menu,
  RotateCw,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import type { AdminUser, SystemAlert } from '../../types/admin'

interface HeaderProps {
  onOpenMobileSidebar: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  activeOrdersCount: number
  currentUser?: AdminUser | null
  onLogout?: () => void
  alerts?: SystemAlert[]
  onDismissAlert?: (id: string) => void
}

export function Header({
  onOpenMobileSidebar,
  searchQuery,
  onSearchChange,
  activeOrdersCount,
  currentUser,
  onLogout,
  alerts = [],
  onDismissAlert,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const currentRoleDisplay =
    currentUser?.role === 'super_admin' || currentUser?.role === 'manager'
      ? '👑 General Manager (Whole Admin)'
      : currentUser?.role === 'chef'
      ? '👨‍🍳 Executive Chef (Kitchen)'
      : '📋 Operations Staff (Dishes & Stock)'

  const unreadAlertsCount = alerts.filter((a) => !a.read).length

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-[#E7E5E4]/90 bg-white px-4 sm:px-6 lg:px-10 backdrop-blur-md">
      {/* Left: Mobile Toggle & Shift / Role bar */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open sidebar"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E7E5E4] bg-white text-stone-700 hover:bg-stone-50 lg:hidden cursor-pointer"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Shift: 10:35 (Figma node #24057:4401) */}
        <div className="flex items-center gap-1.5 text-xs">
          <Clock className="h-3.5 w-3.5 text-[#78716C]" />
          <span className="font-medium text-[#57534E]">Shift:</span>
          <span className="font-semibold text-[#1C1917]">10:35</span>
        </div>

        {/* Divider | (Figma node #24057:4411) */}
        <span className="text-[#D6D3D1] font-light text-base select-none">|</span>

        {/* Active Logged Role Indicator */}
        <div className="flex items-center gap-1.5 rounded-xl border border-[#E7E5E4]/80 bg-[#F5F5F4]/90 py-1 px-3">
          <Sparkles className="h-3.5 w-3.5 text-amber-600" />
          <span className="text-[11px] font-bold text-stone-800">
            {currentRoleDisplay}
          </span>
        </div>
      </div>

      {/* Middle & Right: Search & Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Quick Search */}
        <div className="relative hidden md:block w-48 lg:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A8A29E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search orders, dishes..."
            className="w-full h-8 rounded-lg border border-[#E7E5E4] bg-[#FAFAF9] pl-9 pr-3 text-xs text-[#1C1917] placeholder:text-[#A8A29E] focus:border-[#F15A24] focus:bg-white focus:outline-none transition"
          />
        </div>

        {/* Live Active Badge */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-[#E7E5E4] bg-[#FAFAF9] px-2.5 py-1 text-xs text-[#57534E]">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-[#1C1917]">{activeOrdersCount}</span>
          <span>Active</span>
        </div>

        {/* Notification Bell with Live Alerts Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-[#E7E5E4] bg-white text-[#57534E] hover:bg-stone-50 hover:border-[#F15A24] transition cursor-pointer"
          >
            <Bell className="h-3.5 w-3.5" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#F15A24] text-[10px] font-bold text-white ring-2 ring-white animate-bounce">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-88 rounded-2xl border border-[#E7E5E4] bg-white p-3 shadow-xl z-50">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="text-xs font-bold text-[#1C1917] flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5 text-[#F15A24]" />
                  <span>Real-time Operations Alerts</span>
                </span>
                <span className="rounded-full bg-[#F15A24]/10 px-2 py-0.5 text-[10px] font-bold text-[#F15A24]">
                  {alerts.length} Active
                </span>
              </div>

              <div className="mt-2.5 space-y-2 max-h-80 overflow-y-auto">
                {alerts.length === 0 ? (
                  <p className="text-xs text-stone-400 text-center py-4">
                    No active stock alerts or pending notices.
                  </p>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`flex items-start justify-between gap-2.5 rounded-xl p-2.5 text-xs border ${
                        alert.type === 'stock_low' || alert.type === 'stock_critical'
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-900'
                          : 'bg-blue-500/10 border-blue-500/20 text-blue-900'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {alert.type === 'stock_low' || alert.type === 'stock_critical' ? (
                          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-bold text-stone-900 leading-tight">
                            {alert.title}
                          </p>
                          <p className="text-[11px] text-stone-600 mt-0.5">
                            {alert.message}
                          </p>
                          <p className="text-[10px] text-stone-400 mt-1 font-mono">
                            {alert.timestamp} {alert.senderName ? `• ${alert.senderName}` : ''}
                          </p>
                        </div>
                      </div>

                      {onDismissAlert && (
                        <button
                          type="button"
                          onClick={() => onDismissAlert(alert.id)}
                          className="text-stone-400 hover:text-stone-700 p-1"
                          title="Dismiss"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Link with Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex h-8 items-center gap-2 rounded-lg border border-[#E7E5E4] bg-white px-2.5 py-1 hover:bg-stone-50 transition cursor-pointer"
          >
            <img
              src={currentUser?.avatar || '/figma-assets/about/about-chef-tariq.png'}
              alt={currentUser?.fullName || 'Admin User'}
              className="h-5 w-5 rounded-md object-cover border border-[#E7E5E4]"
            />
            <span className="text-xs font-semibold text-[#292524] max-w-[120px] truncate">
              {currentUser?.fullName?.split(' ')[0] || 'Tariq'}
            </span>
            {currentUser?.role === 'super_admin' && (
              <span className="hidden xl:inline-flex items-center gap-1 rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 text-[9px] font-black text-amber-700">
                <ShieldCheck className="h-2.5 w-2.5 text-amber-600" />
                SUPER ADMIN
              </span>
            )}
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-[#E7E5E4] bg-white p-3 shadow-xl z-50">
              <div className="border-b border-stone-100 pb-2 mb-2">
                <p className="text-xs font-bold text-stone-900 leading-tight">
                  {currentUser?.fullName || 'Super Admin'}
                </p>
                <p className="text-[11px] text-stone-500 truncate mt-0.5">
                  {currentUser?.email || 'superadmin@amberspice.com'}
                </p>
                <div className="mt-1.5">
                  <span className="inline-block rounded-full bg-gradient-to-r from-[#B84A22] to-[#FBA138] px-2 py-0.5 text-[9px] font-bold text-white shadow-2xs">
                    {currentUser?.roleDisplay || 'Whole Admin Manager'}
                  </span>
                </div>
              </div>

              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false)
                    onLogout()
                  }}
                  className="w-full flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out / Lock Portal</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Settings/Options Action Button */}
        <button
          type="button"
          aria-label="Settings"
          title="Kitchen & System Settings"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E7E5E4] bg-white text-[#57534E] hover:bg-stone-50 hover:border-[#F15A24] transition cursor-pointer"
        >
          <RotateCw className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  )
}
