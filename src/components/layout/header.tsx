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
interface HeaderProps {
  onOpenMobileSidebar: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  activeOrdersCount: number
}

export function Header({
  onOpenMobileSidebar,
  searchQuery,
  onSearchChange,
  activeOrdersCount,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [selectedRole, setSelectedRole] = useState('Admin (Manager)')
  const [showRoleDropdown, setShowRoleDropdown] = useState(false)

  const roles = [
    'Admin (Manager)',
    'Head Chef',
    'Line Supervisor',
    'Front of House',
  ]

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

        {/* Role Selector Container (Figma node #24057:4414) */}
        <div className="relative">
          <div className="flex items-center gap-1.5 rounded-xl border border-[#E7E5E4]/80 bg-[#F5F5F4]/90 py-1 px-2.5">
            <Sparkles className="h-3.5 w-3.5 text-[#78716C]" />
            <span className="text-[11px] font-medium text-[#78716C]">Role:</span>

            {/* Custom Dropdown Trigger */}
            <button
              type="button"
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex h-7 items-center justify-between gap-2 rounded-lg border border-[#E7E5E4]/90 bg-white px-2.5 text-xs font-semibold text-[#1C1917] shadow-2xs hover:border-[#F15A24] transition cursor-pointer"
            >
              <span>{selectedRole}</span>
              <span className="text-[10px] text-stone-400">▼</span>
            </button>
          </div>

          {showRoleDropdown && (
            <div className="absolute left-0 mt-1.5 w-48 rounded-xl border border-[#E7E5E4] bg-white p-1.5 shadow-lg z-50">
              {roles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setSelectedRole(r)
                    setShowRoleDropdown(false)
                  }}
                  className={`w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition cursor-pointer ${
                    selectedRole === r
                      ? 'bg-[#F15A24]/10 text-[#F15A24] font-bold'
                      : 'text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
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

        {/* Notification Bell with Badge 3 (Figma node #24057:4430) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-[#E7E5E4] bg-white text-[#57534E] hover:bg-stone-50 hover:border-[#F15A24] transition cursor-pointer"
          >
            <Bell className="h-3.5 w-3.5" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#F15A24] text-[10px] font-bold text-white ring-2 ring-white">
              3
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[#E7E5E4] bg-white p-3 shadow-xl z-50">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="text-xs font-bold text-[#1C1917]">Kitchen Queue Alerts</span>
                <span className="rounded-full bg-[#F15A24]/10 px-2 py-0.5 text-[10px] font-bold text-[#F15A24]">
                  3 Pending
                </span>
              </div>
              <div className="mt-2 space-y-2">
                <div className="flex items-start gap-2.5 rounded-xl bg-amber-500/10 p-2 text-xs">
                  <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-stone-800">#AS-2042 at 22 mins</p>
                    <p className="text-[11px] text-stone-500">Flame-Grilled Tandoori ready for pickup</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 rounded-xl bg-[#F15A24]/10 p-2 text-xs">
                  <CheckCircle2 className="h-4 w-4 text-[#F15A24] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-stone-800">#ZM-4047 Fire Ticket</p>
                    <p className="text-[11px] text-stone-500">Kashmiri Lamb Rogan Josh assigned to Curries</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Link: Tariq (Figma node #24057:4437) */}
        <div className="flex h-8 items-center gap-1.5 rounded-lg border border-[#E7E5E4] bg-white px-2.5 py-1 hover:bg-stone-50 transition cursor-pointer">
          <img
            src="/figma-assets/about/about-chef-tariq.png"
            alt="Tariq"
            className="h-5 w-5 rounded-md object-cover border border-[#E7E5E4]"
          />
          <span className="text-xs font-semibold text-[#292524]">Tariq</span>
        </div>

        {/* Settings/Options Action Button (Figma node #24057:4441) */}
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
