import { useState } from 'react'
import {
  Briefcase,
  Check,
  ChefHat,
  Clock,
  KeyRound,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  X,
} from 'lucide-react'
import type { StaffMember } from '../../types/admin'
import { API_ENDPOINTS, resolveApiUrl } from '../../services/endpoints'

interface StaffViewProps {
  staff: StaffMember[]
  onUpdateStaffStatus: (staffId: string, status: 'active' | 'break' | 'off-duty') => void
  onAddStaffMember?: (newStaff: StaffMember) => void
  onDeleteStaffMember?: (staffId: string) => void
}

const AVAILABLE_ROLES = [
  { id: 'manager', label: 'General Manager (Whole Access)', category: 'manager', badge: 'bg-amber-500/15 text-amber-800 border-amber-300' },
  { id: 'staff', label: 'Operations Staff (Inventory, Dishes & Orders)', category: 'staff', badge: 'bg-blue-500/15 text-blue-800 border-blue-300' },
  { id: 'chef', label: 'Executive Chef (Kitchen KDS & Orders)', category: 'kitchen', badge: 'bg-orange-500/15 text-orange-800 border-orange-300' },
  { id: 'super_admin', label: 'Super Admin (System Owner)', category: 'admin', badge: 'bg-purple-500/15 text-purple-800 border-purple-300' },
  { id: 'cashier', label: 'Cashier / Front Host', category: 'front', badge: 'bg-stone-500/15 text-stone-800 border-stone-300' },
  { id: 'delivery', label: 'Delivery Courier / Driver', category: 'delivery', badge: 'bg-emerald-500/15 text-emerald-800 border-emerald-300' },
]

export function StaffView({
  staff,
  onUpdateStaffStatus,
  onAddStaffMember,
  onDeleteStaffMember,
}: StaffViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRoleCategory, setSelectedRoleCategory] = useState<string>('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Floor Manager',
    systemRole: 'manager',
    shift: 'Full Day',
    assignedSection: 'Operations & Floor Management',
    phone: '',
    password: 'Manager@2026!',
  })

  // Filter staff by search and role
  const filteredStaff = staff.filter((member) => {
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !q ||
      member.name.toLowerCase().includes(q) ||
      member.role.toLowerCase().includes(q) ||
      member.assignedSection.toLowerCase().includes(q)

    let matchesCategory = true
    if (selectedRoleCategory === 'manager') {
      matchesCategory = member.role.toLowerCase().includes('manager')
    } else if (selectedRoleCategory === 'admin') {
      matchesCategory = member.role.toLowerCase().includes('admin')
    } else if (selectedRoleCategory === 'kitchen') {
      matchesCategory =
        member.role.toLowerCase().includes('chef') ||
        member.role.toLowerCase().includes('cook') ||
        member.role.toLowerCase().includes('kitchen')
    } else if (selectedRoleCategory === 'front') {
      matchesCategory =
        member.role.toLowerCase().includes('server') ||
        member.role.toLowerCase().includes('cashier') ||
        member.role.toLowerCase().includes('host')
    }

    return matchesSearch && matchesCategory
  })

  const handleRoleSelect = (roleItem: typeof AVAILABLE_ROLES[0]) => {
    let defaultSection = 'Operations & Floor Management'
    let defaultPass = 'Staff@2026!'
    if (roleItem.category === 'kitchen' || roleItem.id === 'chef') {
      defaultSection = 'Executive Kitchen & Orders KDS'
      defaultPass = 'Chef@2026!'
    } else if (roleItem.category === 'staff' || roleItem.id === 'staff') {
      defaultSection = 'Inventory & Dishes Management'
      defaultPass = 'Staff@2026!'
    } else if (roleItem.category === 'front') {
      defaultSection = 'Front Desk & Cashier POS'
      defaultPass = 'Staff@2026!'
    } else if (roleItem.category === 'delivery') {
      defaultSection = 'Delivery & Logistics'
      defaultPass = 'Staff@2026!'
    } else if (roleItem.category === 'manager' || roleItem.id === 'manager') {
      defaultSection = 'Whole Operations & Store Management'
      defaultPass = 'Manager@2026!'
    } else if (roleItem.category === 'admin') {
      defaultSection = 'Executive Administration & Management'
      defaultPass = 'Admin@2026!'
    }

    setFormData((prev) => ({
      ...prev,
      role: roleItem.label,
      systemRole: roleItem.id,
      assignedSection: defaultSection,
      password: defaultPass,
    }))
  }

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Please fill in name and email.')
      return
    }

    setIsSubmitting(true)
    setFeedbackMessage(null)

    const newStaffItem: StaffMember = {
      id: `staff-${Date.now()}`,
      name: formData.name.trim(),
      role: formData.role,
      shift: formData.shift,
      status: 'active',
      avatar: formData.name.trim().charAt(0).toUpperCase() || 'M',
      assignedSection: formData.assignedSection,
      email: formData.email.trim(),
      phone: formData.phone.trim() || undefined,
      systemRole: formData.systemRole,
    }

    // Try creating via Backend API
    try {
      const token = localStorage.getItem('amber_admin_token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token && !token.startsWith('offline')) {
        headers['Authorization'] = `Bearer ${token}`
      }

      await fetch(resolveApiUrl(API_ENDPOINTS.AUTH.STAFF), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: formData.email.trim(),
          name: formData.name.trim(),
          role: formData.systemRole,
          password: formData.password,
          phone: formData.phone.trim(),
          shift: formData.shift,
          assigned_section: formData.assignedSection,
        }),
      })
    } catch {
      // Backend offline or local standalone mode
    }

    // Always update React state
    if (onAddStaffMember) {
      onAddStaffMember(newStaffItem)
    }

    setIsSubmitting(false)
    setIsAddModalOpen(false)
    setFeedbackMessage({
      text: `Successfully created ${formData.role}: ${formData.name}`,
      type: 'success',
    })
    setTimeout(() => setFeedbackMessage(null), 4000)

    // Reset form
    setFormData({
      name: '',
      email: '',
      role: 'Floor Manager',
      systemRole: 'manager',
      shift: 'Full Day',
      assignedSection: 'Operations & Floor Management',
      phone: '',
      password: 'Manager@2026!',
    })
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-sans text-base font-bold text-stone-900">
              Staff &amp; Management Roster
            </h3>
            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-[#B84A22] border border-[#B84A22]/20">
              {staff.length} Team Members
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Create and manage Managers, Admins, Kitchen Chefs, and Front of House staff.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#B84A22] to-[#FBA138] hover:from-[#a03f1b] hover:to-[#e5922e] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:brightness-105 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Staff / Manager</span>
        </button>
      </div>

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600" />
            {feedbackMessage.text}
          </span>
          <button type="button" onClick={() => setFeedbackMessage(null)} className="text-emerald-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Role Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Roles' },
            { id: 'manager', label: 'Managers' },
            { id: 'admin', label: 'Admins' },
            { id: 'kitchen', label: 'Kitchen Line' },
            { id: 'front', label: 'Front / Cashiers' },
          ].map((tab) => {
            const isActive = selectedRoleCategory === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedRoleCategory(tab.id)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-[#1C1917] text-white shadow-xs'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Quick Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, role, section..."
            className="w-full h-9 rounded-xl border border-stone-200 bg-white pl-9 pr-3 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#B84A22] focus:outline-none transition"
          />
        </div>
      </div>

      {/* Staff Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStaff.map((member) => {
          const isManager = member.role.toLowerCase().includes('manager')
          const isAdmin = member.role.toLowerCase().includes('admin')

          return (
            <div
              key={member.id}
              className={`flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-2xs transition hover:shadow-md ${
                isManager
                  ? 'border-amber-300 ring-1 ring-amber-400/20'
                  : isAdmin
                  ? 'border-purple-300 ring-1 ring-purple-400/20'
                  : 'border-stone-200/80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl font-sans text-sm font-bold text-white shadow-xs ${
                        isManager
                          ? 'bg-gradient-to-br from-amber-600 to-amber-800'
                          : isAdmin
                          ? 'bg-gradient-to-br from-purple-700 to-indigo-900'
                          : 'bg-gradient-to-br from-[#1A130E] to-[#2B2019]'
                      }`}
                    >
                      {member.avatar}
                    </div>
                    <div>
                      <h4 className="font-sans text-sm font-bold text-stone-900 leading-tight">
                        {member.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`text-xs font-semibold ${
                            isManager
                              ? 'text-amber-800'
                              : isAdmin
                              ? 'text-purple-800'
                              : 'text-[#B84A22]'
                          }`}
                        >
                          {member.role}
                        </span>
                        {isManager && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[9px] font-black text-amber-800">
                            MANAGER
                          </span>
                        )}
                        {isAdmin && (
                          <span className="rounded bg-purple-100 px-1.5 py-0.2 text-[9px] font-black text-purple-800">
                            ADMIN
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      member.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : member.status === 'break'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {member.status}
                  </span>
                </div>

                <div className="mt-4 space-y-2 border-t border-stone-100 pt-3 text-xs text-stone-600">
                  <div className="flex items-center gap-1.5">
                    <ChefHat className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                    <span className="font-medium text-stone-800">{member.assignedSection}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                    <span>{member.shift}</span>
                  </div>
                  {member.email && (
                    <div className="flex items-center gap-1.5 text-stone-500 font-mono text-[11px]">
                      <Mail className="h-3 w-3 text-stone-400 shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Shift Status Quick Toggle & Delete */}
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateStaffStatus(member.id, 'active')}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition cursor-pointer ${
                    member.status === 'active'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  On Duty
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateStaffStatus(member.id, 'break')}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition cursor-pointer ${
                    member.status === 'break'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Break
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateStaffStatus(member.id, 'off-duty')}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition cursor-pointer ${
                    member.status === 'off-duty'
                      ? 'bg-stone-800 text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Off
                </button>

                {onDeleteStaffMember && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Remove ${member.name} (${member.role}) from staff roster?`)) {
                        onDeleteStaffMember(member.id)
                      }
                    }}
                    title="Remove Staff"
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ========================================================================= */}
      {/* ADD STAFF / MANAGER MODAL */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-white border border-stone-200 p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-stone-100 pb-4 mb-5">
              <div>
                <h3 className="font-sans text-lg font-bold text-stone-900 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-[#B84A22]" />
                  <span>Create Staff or Manager Account</span>
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Admins have full authority to create any person with any operational or administrative role.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              {/* Full Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Tariq Al-Hassan"
                      className="w-full h-10 rounded-xl border border-stone-300 bg-white pl-9 pr-3 text-xs text-stone-900 focus:border-[#B84A22] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Work Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="manager@amberspice.com"
                      className="w-full h-10 rounded-xl border border-stone-300 bg-white pl-9 pr-3 text-xs text-stone-900 focus:border-[#B84A22] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Role Selection Picker */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center justify-between">
                  <span>Assign System Role *</span>
                  <span className="text-[11px] text-amber-700 font-normal">
                    Select Manager, Admin, Kitchen, or Cashier
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AVAILABLE_ROLES.map((r) => {
                    const isSelected = formData.systemRole === r.id
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleRoleSelect(r)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#B84A22] bg-[#B84A22]/10 text-[#B84A22] font-bold ring-1 ring-[#B84A22]'
                            : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                        }`}
                      >
                        <span className="truncate">{r.label}</span>
                        <span className="text-[10px] text-stone-400 capitalize mt-1">
                          {r.category}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Shift & Assigned Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Work Shift
                  </label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                    className="w-full h-10 rounded-xl border border-stone-300 bg-white px-3 text-xs text-stone-900 focus:border-[#B84A22] focus:outline-none cursor-pointer"
                  >
                    <option value="Morning (10:00 - 16:00)">Morning (10:00 - 16:00)</option>
                    <option value="Evening (16:00 - 23:00)">Evening (16:00 - 23:00)</option>
                    <option value="Full Day">Full Day (All Shifts)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Assigned Section / Station
                  </label>
                  <input
                    type="text"
                    value={formData.assignedSection}
                    onChange={(e) => setFormData({ ...formData, assignedSection: e.target.value })}
                    placeholder="e.g. Operations & Floor Management"
                    className="w-full h-10 rounded-xl border border-stone-300 bg-white px-3 text-xs text-stone-900 focus:border-[#B84A22] focus:outline-none"
                  />
                </div>
              </div>

              {/* Phone & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Phone (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+353 (89) 948 5800"
                      className="w-full h-10 rounded-xl border border-stone-300 bg-white pl-9 pr-3 text-xs text-stone-900 focus:border-[#B84A22] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                    <span>Portal Password *</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          password: `AmberPass@${Math.floor(1000 + Math.random() * 9000)}!`,
                        })
                      }
                      className="text-[10px] text-[#B84A22] font-semibold hover:underline"
                    >
                      Generate
                    </button>
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <input
                      type="text"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full h-10 rounded-xl border border-stone-300 bg-white pl-9 pr-3 text-xs text-stone-900 font-mono focus:border-[#B84A22] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-gradient-to-r from-[#B84A22] to-[#FBA138] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:brightness-105 active:scale-98 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating Account...' : `Create ${formData.role}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
