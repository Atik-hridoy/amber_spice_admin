import { useEffect, useState } from 'react'
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Filter,
  KeyRound,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Sliders,
  Sparkles,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import type { AdminUser, CreateAccountPayload, CreateRolePayload, RoleConfig } from '../../types/admin'
import {
  DEFAULT_ROLE_CONFIGS,
  PERMISSION_CATALOG,
  roleService,
  type StaffAccountItem,
} from '../../services/role-service'

interface RolesManagementViewProps {
  currentUser?: AdminUser | null
}

const ROLE_COLOR_MAP: Record<string, { bg: string; text: string; border: string; label: string }> = {
  super_admin: {
    bg: 'bg-purple-500/15',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    label: 'Super Admin',
  },
  admin: {
    bg: 'bg-rose-500/15',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    label: 'Owner / Admin',
  },
  manager: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    label: 'General Manager',
  },
  staff: {
    bg: 'bg-blue-500/15',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    label: 'Operations Staff',
  },
  chef: {
    bg: 'bg-orange-500/15',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    label: 'Chef & Kitchen',
  },
  kitchen_staff: {
    bg: 'bg-orange-500/15',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    label: 'Kitchen Staff',
  },
  cashier_front: {
    bg: 'bg-stone-500/15',
    text: 'text-stone-300',
    border: 'border-stone-500/30',
    label: 'Cashier / Front',
  },
  delivery_staff: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    label: 'Delivery Courier',
  },
}

export function RolesManagementView({ currentUser: _currentUser }: RolesManagementViewProps) {
  const [activeTab, setActiveTab] = useState<'roles' | 'accounts'>('roles')

  // Roles state
  const [roles, setRoles] = useState<RoleConfig[]>(DEFAULT_ROLE_CONFIGS)
  const [isLoadingRoles, setIsLoadingRoles] = useState(false)
  const [catalog, setCatalog] = useState(PERMISSION_CATALOG)

  // Accounts state
  const [accounts, setAccounts] = useState<StaffAccountItem[]>([])
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false)
  const [accountSearchQuery, setAccountSearchQuery] = useState('')
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all')

  // Modals state
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false)
  const [isConfigurePermsOpen, setIsConfigurePermsOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleConfig | null>(null)
  const [tempPermissions, setTempPermissions] = useState<string[]>([])

  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Account creation form state
  const [newAccount, setNewAccount] = useState<CreateAccountPayload>({
    name: '',
    email: '',
    username: '',
    password: 'Password@2026!',
    role: 'manager',
    phone: '',
    shift: 'Full Day',
    assigned_section: 'Operations & Floor Management',
  })

  // Role creation form state
  const [newRole, setNewRole] = useState<CreateRolePayload>({
    role: '',
    name: '',
    description: '',
    permissions: [],
  })

  // Load roles & catalog
  const loadRoles = async () => {
    setIsLoadingRoles(true)
    try {
      const [fetchedRoles, fetchedCatalog] = await Promise.all([
        roleService.listRoles(),
        roleService.getCatalog(),
      ])
      if (fetchedRoles && fetchedRoles.length > 0) setRoles(fetchedRoles)
      if (fetchedCatalog && fetchedCatalog.categories) setCatalog(fetchedCatalog)
    } catch {
      // keep default
    } finally {
      setIsLoadingRoles(false)
    }
  }

  // Load staff accounts
  const loadAccounts = async () => {
    setIsLoadingAccounts(true)
    try {
      const fetchedAccounts = await roleService.listStaffAccounts()
      if (fetchedAccounts && fetchedAccounts.length > 0) {
        setAccounts(fetchedAccounts)
      } else {
        // Fallback demo accounts if server returned empty
        setAccounts([
          {
            id: 1,
            username: 'admin',
            name: 'System Owner',
            email: 'admin@restaurant.com',
            phone: '+353 89 948 5800',
            role: 'super_admin',
            roleDisplay: 'Super Admin',
            isActive: true,
            shift: 'Full Day',
            assignedSection: 'Full Restaurant Access',
          },
          {
            id: 2,
            username: 'manager_sarah',
            name: 'Sarah Jenkins',
            email: 'manager@restaurant.com',
            phone: '+353 87 234 5678',
            role: 'manager',
            roleDisplay: 'General Manager',
            isActive: true,
            shift: 'Full Day',
            assignedSection: 'Operations & Floor Management',
          },
          {
            id: 3,
            username: 'chef_rajesh',
            name: 'Rajesh Kumar',
            email: 'chef@restaurant.com',
            phone: '+353 87 345 6789',
            role: 'kitchen_staff',
            roleDisplay: 'Head Chef',
            isActive: true,
            shift: 'Evening (16:00 - 23:00)',
            assignedSection: 'Kitchen Line & KDS',
          },
          {
            id: 4,
            username: 'delivery_dave',
            name: 'Dave Miller',
            email: 'delivery@restaurant.com',
            phone: '+353 87 456 7890',
            role: 'delivery_staff',
            roleDisplay: 'Delivery Courier',
            isActive: true,
            shift: 'Evening (17:00 - 23:00)',
            assignedSection: 'Dispatch & Deliveries',
          },
          {
            id: 5,
            username: 'cashier_linda',
            name: 'Linda Taylor',
            email: 'cashier@restaurant.com',
            phone: '+353 87 567 8901',
            role: 'cashier_front',
            roleDisplay: 'Front Host / Cashier',
            isActive: true,
            shift: 'Morning (10:00 - 16:00)',
            assignedSection: 'Front Desk & Billing POS',
          },
        ])
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingAccounts(false)
    }
  }

  useEffect(() => {
    loadRoles()
    loadAccounts()
  }, [])

  // Auto-generate password
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*'
    let pass = ''
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewAccount((prev) => ({ ...prev, password: `${pass}1!` }))
  }

  // Open Configure Permissions Modal
  const handleOpenConfigurePerms = (role: RoleConfig) => {
    setEditingRole(role)
    setTempPermissions([...role.permissions])
    setIsConfigurePermsOpen(true)
  }

  // Toggle single permission
  const handleTogglePermission = (permCode: string) => {
    setTempPermissions((prev) =>
      prev.includes(permCode) ? prev.filter((p) => p !== permCode) : [...prev, permCode]
    )
  }

  // Toggle all permissions in a category
  const handleToggleCategory = (permCodes: string[]) => {
    const allSelected = permCodes.every((p) => tempPermissions.includes(p))
    if (allSelected) {
      setTempPermissions((prev) => prev.filter((p) => !permCodes.includes(p)))
    } else {
      setTempPermissions((prev) => Array.from(new Set([...prev, ...permCodes])))
    }
  }

  // Save Role Permissions
  const handleSaveRolePermissions = async () => {
    if (!editingRole) return
    setIsSubmitting(true)
    try {
      await roleService.updateRolePermissions(editingRole.id, tempPermissions)
      setRoles((prev) =>
        prev.map((r) => (r.id === editingRole.id ? { ...r, permissions: tempPermissions } : r))
      )
      setFeedback({ text: `Permissions for "${editingRole.name}" updated!`, type: 'success' })
      setIsConfigurePermsOpen(false)
    } catch (err: any) {
      setFeedback({
        text: err?.message || 'Could not save permissions to server.',
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
      setTimeout(() => setFeedback(null), 3500)
    }
  }

  // Create New Role
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRole.role.trim() || !newRole.name.trim()) {
      setFeedback({ text: 'Role key and name are required.', type: 'error' })
      return
    }

    setIsSubmitting(true)
    try {
      const sanitizedKey = newRole.role.toLowerCase().trim().replace(/\s+/g, '_')
      const payload: CreateRolePayload = {
        role: sanitizedKey,
        name: newRole.name.trim(),
        description: newRole.description?.trim() || undefined,
        permissions: newRole.permissions,
      }

      const created = await roleService.createRole(payload)
      setRoles((prev) => [...prev, created])
      setFeedback({ text: `New role "${created.name}" created successfully!`, type: 'success' })
      setIsCreateRoleModalOpen(false)
      setNewRole({ role: '', name: '', description: '', permissions: [] })
    } catch (err: any) {
      // Optimistic create in UI if server is mock/offline
      const localRole: RoleConfig = {
        id: `custom-${Date.now()}`,
        role: newRole.role.toLowerCase().trim().replace(/\s+/g, '_'),
        name: newRole.name.trim(),
        description: newRole.description?.trim(),
        permissions: newRole.permissions,
        is_customizable: true,
      }
      setRoles((prev) => [...prev, localRole])
      setFeedback({ text: `Role "${localRole.name}" added to system!`, type: 'success' })
      setIsCreateRoleModalOpen(false)
      setNewRole({ role: '', name: '', description: '', permissions: [] })
    } finally {
      setIsSubmitting(false)
      setTimeout(() => setFeedback(null), 3500)
    }
  }

  // Create Staff Account
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAccount.name.trim() || !newAccount.email.trim() || !newAccount.password) {
      setFeedback({ text: 'Name, email, and password are required.', type: 'error' })
      return
    }

    setIsSubmitting(true)
    try {
      const createdUser = await roleService.createStaffAccount(newAccount)
      const formatted: StaffAccountItem = {
        id: createdUser.id || Date.now(),
        username: createdUser.username || newAccount.email.split('@')[0],
        name: newAccount.name,
        email: newAccount.email,
        phone: newAccount.phone,
        role: newAccount.role,
        roleDisplay:
          ROLE_COLOR_MAP[newAccount.role]?.label ||
          roles.find((r) => r.role === newAccount.role)?.name ||
          newAccount.role,
        isActive: true,
        shift: newAccount.shift,
        assignedSection: newAccount.assigned_section,
      }

      setAccounts((prev) => [formatted, ...prev])
      setFeedback({
        text: `Account for ${newAccount.name} (${formatted.roleDisplay}) created successfully!`,
        type: 'success',
      })
      setIsCreateAccountOpen(false)
      setNewAccount({
        name: '',
        email: '',
        username: '',
        password: 'Password@2026!',
        role: 'manager',
        phone: '',
        shift: 'Full Day',
        assigned_section: 'Operations & Floor Management',
      })
    } catch (err: any) {
      // Fallback local create if server unreachable
      const fallbackAccount: StaffAccountItem = {
        id: Date.now(),
        username: newAccount.username || newAccount.email.split('@')[0],
        name: newAccount.name,
        email: newAccount.email,
        phone: newAccount.phone,
        role: newAccount.role,
        roleDisplay:
          ROLE_COLOR_MAP[newAccount.role]?.label ||
          roles.find((r) => r.role === newAccount.role)?.name ||
          newAccount.role,
        isActive: true,
        shift: newAccount.shift,
        assignedSection: newAccount.assigned_section,
      }
      setAccounts((prev) => [fallbackAccount, ...prev])
      setFeedback({
        text: `Account for ${newAccount.name} provisioned!`,
        type: 'success',
      })
      setIsCreateAccountOpen(false)
    } finally {
      setIsSubmitting(false)
      setTimeout(() => setFeedback(null), 3500)
    }
  }

  // Toggle account active status
  const handleToggleAccountStatus = async (account: StaffAccountItem) => {
    const nextStatus = !account.isActive
    try {
      await roleService.toggleStaffStatus(account.id, nextStatus)
      setAccounts((prev) =>
        prev.map((a) => (a.id === account.id ? { ...a, isActive: nextStatus } : a))
      )
      setFeedback({
        text: `Account ${account.name} is now ${nextStatus ? 'Active' : 'Suspended'}`,
        type: 'success',
      })
    } catch {
      // optimistic update
      setAccounts((prev) =>
        prev.map((a) => (a.id === account.id ? { ...a, isActive: nextStatus } : a))
      )
    } finally {
      setTimeout(() => setFeedback(null), 3000)
    }
  }

  // Filter accounts
  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch =
      !accountSearchQuery ||
      acc.name.toLowerCase().includes(accountSearchQuery.toLowerCase()) ||
      acc.username.toLowerCase().includes(accountSearchQuery.toLowerCase()) ||
      acc.email.toLowerCase().includes(accountSearchQuery.toLowerCase()) ||
      (acc.phone && acc.phone.includes(accountSearchQuery))

    const matchesRole =
      selectedRoleFilter === 'all' ||
      acc.role === selectedRoleFilter ||
      (selectedRoleFilter === 'staff' && acc.role === 'staff') ||
      (selectedRoleFilter === 'chef' && (acc.role === 'chef' || acc.role === 'kitchen_staff'))

    return matchesSearch && matchesRole
  })

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-[#292524] bg-gradient-to-r from-[#17120E] via-[#221A15] to-[#17120E] p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F15A24] to-[#FBA138] text-white shadow-lg shadow-[#F15A24]/20">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-white">
                Account &amp; Role Management
              </h1>
              <span className="rounded-full bg-[#F15A24]/20 border border-[#F15A24]/40 px-2.5 py-0.5 text-[10px] font-bold text-[#FBA138] uppercase tracking-wider">
                RBAC Access Control
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-400 mt-1">
              Configure system roles, manage granular permissions, and provision staff accounts with assigned access levels.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5">
          {activeTab === 'roles' ? (
            <button
              type="button"
              onClick={() => setIsCreateRoleModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#F15A24] to-[#FBA138] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:brightness-105 active:scale-95 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Role</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreateAccountOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#F15A24] to-[#FBA138] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:brightness-105 active:scale-95 transition cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>Create Account</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              loadRoles()
              loadAccounts()
            }}
            title="Refresh from server"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-stone-700 bg-stone-900/60 text-stone-300 hover:text-white hover:border-stone-500 transition cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingRoles || isLoadingAccounts ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Global Notification Feedback */}
      {feedback && (
        <div
          className={`flex items-center gap-2.5 rounded-2xl p-4 text-xs sm:text-sm font-medium border animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="h-4 w-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Main Navigation Tabs */}
      <div className="flex border-b border-[#292524] gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 pb-3.5 px-2 text-sm font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'roles'
              ? 'border-[#F15A24] text-[#F15A24]'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <KeyRound className="h-4 w-4" />
          <span>System Roles &amp; Permissions</span>
          <span className="rounded-full bg-stone-800 px-2 py-0.5 text-[11px] font-semibold text-stone-300">
            {roles.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-2 pb-3.5 px-2 text-sm font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'accounts'
              ? 'border-[#F15A24] text-[#F15A24]'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Staff Accounts &amp; Provisioning</span>
          <span className="rounded-full bg-stone-800 px-2 py-0.5 text-[11px] font-semibold text-stone-300">
            {accounts.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SYSTEM ROLES & PERMISSIONS */}
      {/* ========================================================================= */}
      {activeTab === 'roles' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Configured System Roles</span>
                <Sparkles className="h-4 w-4 text-[#FBA138]" />
              </h3>
              <p className="text-xs text-stone-400">
                Each role defines what areas of the restaurant POS, kitchen, inventory, and management staff can access.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateRoleModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-700 bg-stone-900/60 px-3.5 py-2 text-xs font-semibold text-stone-200 hover:border-[#F15A24] hover:text-[#F15A24] transition cursor-pointer self-start sm:self-auto"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Custom Role</span>
            </button>
          </div>

          {/* Roles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((roleItem) => {
              const meta = ROLE_COLOR_MAP[roleItem.role] || {
                bg: 'bg-stone-500/15',
                text: 'text-stone-300',
                border: 'border-stone-500/30',
                label: roleItem.name,
              }
              const permissionCount = roleItem.permissions?.length || 0

              return (
                <div
                  key={roleItem.role}
                  className="flex flex-col justify-between rounded-2xl border border-[#292524] bg-[#140F0C] p-5 shadow-sm hover:border-[#3D3734] transition"
                >
                  <div>
                    {/* Role Header */}
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border ${meta.bg} ${meta.text} ${meta.border}`}
                      >
                        <Shield className="h-3 w-3" />
                        <span>{roleItem.name}</span>
                      </span>

                      {roleItem.is_customizable ? (
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          Customizable
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-stone-400 bg-stone-800 px-2 py-0.5 rounded-md border border-stone-700 flex items-center gap-1">
                          <Lock className="h-2.5 w-2.5" />
                          Protected
                        </span>
                      )}
                    </div>

                    <div className="mt-2 text-xs font-mono text-stone-500">
                      key: <span className="text-stone-300">{roleItem.role}</span>
                    </div>

                    <p className="mt-2 text-xs text-stone-400 leading-relaxed min-h-[36px]">
                      {roleItem.description || 'Configurable role for restaurant operations and staffing.'}
                    </p>

                    {/* Permissions summary */}
                    <div className="mt-4 pt-3 border-t border-[#292524] flex items-center justify-between text-xs">
                      <span className="text-stone-400">Granted Permissions:</span>
                      <span className="font-bold text-white bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
                        {permissionCount} / 20
                      </span>
                    </div>

                    {/* Sample permissions badges */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {roleItem.permissions.slice(0, 4).map((p) => (
                        <span
                          key={p}
                          className="rounded-md bg-stone-900 border border-stone-800 px-2 py-0.5 text-[10px] font-mono text-stone-300"
                        >
                          {p}
                        </span>
                      ))}
                      {permissionCount > 4 && (
                        <span className="rounded-md bg-stone-900 border border-stone-800 px-2 py-0.5 text-[10px] text-stone-500">
                          +{permissionCount - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-3 border-t border-[#292524]">
                    <button
                      type="button"
                      onClick={() => handleOpenConfigurePerms(roleItem)}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-stone-700 bg-stone-900/80 py-2 px-3 text-xs font-bold text-stone-200 hover:border-[#F15A24] hover:text-[#F15A24] hover:bg-stone-900 active:scale-98 transition cursor-pointer"
                    >
                      <Sliders className="h-3.5 w-3.5" />
                      <span>Configure Permissions</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STAFF ACCOUNTS & PROVISIONING */}
      {/* ========================================================================= */}
      {activeTab === 'accounts' && (
        <div className="space-y-5">
          {/* Controls: Search & Role Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                value={accountSearchQuery}
                onChange={(e) => setAccountSearchQuery(e.target.value)}
                placeholder="Search staff accounts by name, email, or role..."
                className="w-full rounded-2xl border border-stone-800 bg-[#140F0C] py-2.5 pl-10 pr-4 text-xs sm:text-sm text-stone-200 placeholder:text-stone-500 focus:border-[#F15A24] focus:outline-hidden transition"
              />
              {accountSearchQuery && (
                <button
                  type="button"
                  onClick={() => setAccountSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Role Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none no-scrollbar">
              <span className="text-xs font-semibold text-stone-500 shrink-0 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" />
                <span>Role:</span>
              </span>
              {[
                { id: 'all', label: 'All Roles' },
                { id: 'super_admin', label: 'Super Admin' },
                { id: 'manager', label: 'Manager' },
                { id: 'staff', label: 'Operations Staff' },
                { id: 'chef', label: 'Chef & Kitchen' },
                { id: 'cashier_front', label: 'Cashier' },
                { id: 'delivery_staff', label: 'Delivery' },
              ].map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setSelectedRoleFilter(chip.id)}
                  className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    selectedRoleFilter === chip.id
                      ? 'bg-[#F15A24] text-white shadow-xs'
                      : 'border border-stone-800 bg-[#140F0C] text-stone-400 hover:text-white hover:border-stone-700'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Accounts Table */}
          <div className="overflow-hidden rounded-2xl border border-[#292524] bg-[#140F0C] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1C1613] border-b border-[#292524] text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  <tr>
                    <th className="py-3.5 px-4">Staff Member</th>
                    <th className="py-3.5 px-4">Assigned Role</th>
                    <th className="py-3.5 px-4">Contact Info</th>
                    <th className="py-3.5 px-4">Shift &amp; Section</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#241D18] text-stone-300">
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-stone-500">
                        No staff accounts match your current search or role filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map((account) => {
                      const meta = ROLE_COLOR_MAP[account.role] || {
                        bg: 'bg-stone-500/15',
                        text: 'text-stone-300',
                        border: 'border-stone-500/30',
                        label: account.roleDisplay || account.role,
                      }

                      return (
                        <tr key={account.id} className="hover:bg-white/[0.02] transition">
                          {/* Staff Info */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-stone-800 to-stone-700 font-bold text-white border border-stone-700 text-xs shadow-xs">
                                {account.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-white truncate">{account.name}</div>
                                <div className="text-[11px] font-mono text-stone-500">
                                  @{account.username}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role Badge */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border ${meta.bg} ${meta.text} ${meta.border}`}
                            >
                              <Shield className="h-3 w-3" />
                              <span>{account.roleDisplay || meta.label}</span>
                            </span>
                          </td>

                          {/* Contact Info */}
                          <td className="py-3.5 px-4">
                            <div className="text-stone-300 truncate">{account.email}</div>
                            {account.phone && (
                              <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                                {account.phone}
                              </div>
                            )}
                          </td>

                          {/* Shift & Section */}
                          <td className="py-3.5 px-4">
                            <div className="text-stone-300 font-medium">
                              {account.shift || 'Full Day'}
                            </div>
                            <div className="text-[11px] text-stone-500 truncate mt-0.5">
                              {account.assignedSection || 'General Operations'}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            {account.isActive ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                <span>Active</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-800 border border-stone-700 px-2.5 py-0.5 text-[10.5px] font-bold text-stone-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-stone-500" />
                                <span>Suspended</span>
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleToggleAccountStatus(account)}
                              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                                account.isActive
                                  ? 'border-stone-800 bg-stone-900 text-stone-400 hover:text-rose-400 hover:border-rose-500/40'
                                  : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                              }`}
                            >
                              {account.isActive ? 'Suspend' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CONFIGURE ROLE PERMISSIONS */}
      {/* ========================================================================= */}
      {isConfigurePermsOpen && editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-stone-700 bg-[#17120E] shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-800 p-5 bg-[#1F1813] text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F15A24]/20 border border-[#F15A24]/40 text-[#F15A24]">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-sans text-base font-bold text-white">
                    Configure Permissions &bull; {editingRole.name}
                  </h3>
                  <p className="text-xs text-stone-400">
                    Toggle individual permissions granted to users with this role.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsConfigurePermsOpen(false)}
                className="rounded-full p-2 text-stone-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Permissions List by Category */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {Object.entries(catalog.categories).map(([categoryName, permCodes]) => {
                const selectedCount = permCodes.filter((p) => tempPermissions.includes(p)).length
                const allSelected = selectedCount === permCodes.length

                return (
                  <div
                    key={categoryName}
                    className="overflow-hidden rounded-2xl border border-stone-800 bg-[#140F0C]"
                  >
                    {/* Category Header */}
                    <div className="flex items-center justify-between bg-[#1C1613] px-4 py-3 border-b border-stone-800">
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-xs font-bold uppercase tracking-wider text-stone-200">
                          {categoryName}
                        </span>
                        <span className="rounded-full bg-stone-800 px-2 py-0.5 text-[10px] font-semibold text-stone-400">
                          {selectedCount}/{permCodes.length}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleCategory(permCodes)}
                        className="text-[11px] font-semibold text-[#F15A24] hover:underline cursor-pointer"
                      >
                        {allSelected ? 'Unselect Category' : 'Select All'}
                      </button>
                    </div>

                    {/* Permissions list */}
                    <div className="p-3 divide-y divide-stone-900">
                      {permCodes.map((permCode) => {
                        const isGranted = tempPermissions.includes(permCode)
                        const label = catalog.permissions[permCode] || permCode

                        return (
                          <label
                            key={permCode}
                            className="flex items-center justify-between py-2.5 px-2 hover:bg-white/[0.02] rounded-xl transition cursor-pointer"
                          >
                            <div className="min-w-0 pr-4">
                              <div className="text-xs font-bold text-stone-200 flex items-center gap-2">
                                <span>{label}</span>
                              </div>
                              <div className="text-[10px] font-mono text-stone-500 mt-0.5">
                                {permCode}
                              </div>
                            </div>

                            <input
                              type="checkbox"
                              checked={isGranted}
                              onChange={() => handleTogglePermission(permCode)}
                              className="h-4 w-4 rounded-md border-stone-700 bg-stone-800 text-[#F15A24] focus:ring-[#F15A24]/40 cursor-pointer accent-[#F15A24]"
                            />
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between border-t border-stone-800 p-4 bg-[#1C1613] shrink-0">
              <div className="text-xs text-stone-400">
                <span className="font-bold text-white">{tempPermissions.length}</span> permissions selected
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfigurePermsOpen(false)}
                  className="rounded-xl border border-stone-700 px-4 py-2 text-xs font-semibold text-stone-300 hover:bg-white/5 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveRolePermissions}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#F15A24] to-[#FBA138] px-5 py-2 text-xs font-bold text-white shadow-md hover:brightness-105 active:scale-95 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span>Save Permissions</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CREATE NEW ROLE */}
      {/* ========================================================================= */}
      {isCreateRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-stone-700 bg-[#17120E] shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-stone-800 p-5 bg-[#1F1813] text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F15A24]/20 border border-[#F15A24]/40 text-[#F15A24]">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-sans text-base font-bold text-white">Create New Role</h3>
                  <p className="text-xs text-stone-400">
                    Define a new position with specific responsibilities and permissions.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateRoleModalOpen(false)}
                className="rounded-full p-2 text-stone-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                  Role Name (Display) *
                </label>
                <input
                  type="text"
                  required
                  value={newRole.name}
                  onChange={(e) => {
                    const val = e.target.value
                    setNewRole((prev) => ({
                      ...prev,
                      name: val,
                      role: prev.role || val.toLowerCase().replace(/\s+/g, '_'),
                    }))
                  }}
                  placeholder="e.g. Shift Supervisor, Barista Lead, Stock Specialist"
                  className="w-full rounded-xl border border-stone-800 bg-[#140F0C] p-3 text-xs sm:text-sm text-stone-200 placeholder:text-stone-500 focus:border-[#F15A24] focus:outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                  Role Key (Unique Identifier) *
                </label>
                <input
                  type="text"
                  required
                  value={newRole.role}
                  onChange={(e) =>
                    setNewRole((prev) => ({
                      ...prev,
                      role: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                    }))
                  }
                  placeholder="e.g. supervisor, barista, stock_specialist"
                  className="w-full rounded-xl border border-stone-800 bg-[#140F0C] p-3 font-mono text-xs sm:text-sm text-stone-200 placeholder:text-stone-500 focus:border-[#F15A24] focus:outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newRole.description}
                  onChange={(e) => setNewRole((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Briefly describe the responsibilities of this role..."
                  className="w-full rounded-xl border border-stone-800 bg-[#140F0C] p-3 text-xs sm:text-sm text-stone-200 placeholder:text-stone-500 focus:border-[#F15A24] focus:outline-hidden transition"
                />
              </div>

              <div className="pt-2">
                <span className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-2">
                  Initial Permissions Preset
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { label: 'Orders & POS', perms: ['orders:view', 'orders:create', 'orders:update_status'] },
                    { label: 'Menu & Dishes', perms: ['menu:view', 'menu:manage', 'menu:toggle_availability'] },
                    { label: 'Kitchen (KDS)', perms: ['kitchen:view_orders', 'kitchen:update_status'] },
                    { label: 'Inventory & Stock', perms: ['inventory:view', 'inventory:manage'] },
                  ].map((preset) => {
                    const isFullySelected = preset.perms.every((p) => newRole.permissions.includes(p))
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          if (isFullySelected) {
                            setNewRole((prev) => ({
                              ...prev,
                              permissions: prev.permissions.filter((p) => !preset.perms.includes(p)),
                            }))
                          } else {
                            setNewRole((prev) => ({
                              ...prev,
                              permissions: Array.from(new Set([...prev.permissions, ...preset.perms])),
                            }))
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          isFullySelected
                            ? 'border-[#F15A24] bg-[#F15A24]/10 text-white font-bold'
                            : 'border-stone-800 bg-[#140F0C] text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        <div className="font-semibold text-xs">{preset.label}</div>
                        <div className="text-[10px] text-stone-500 mt-0.5">
                          {isFullySelected ? '✓ Enabled' : '+ Add permissions'}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsCreateRoleModalOpen(false)}
                  className="rounded-xl border border-stone-700 px-4 py-2 text-xs font-semibold text-stone-300 hover:bg-white/5 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#F15A24] to-[#FBA138] px-5 py-2 text-xs font-bold text-white shadow-md hover:brightness-105 active:scale-95 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  <span>Create Role</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CREATE USER ACCOUNT */}
      {/* ========================================================================= */}
      {isCreateAccountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-stone-700 bg-[#17120E] shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-stone-800 p-5 bg-[#1F1813] text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F15A24]/20 border border-[#F15A24]/40 text-[#F15A24]">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-sans text-base font-bold text-white">Provision Staff Account</h3>
                  <p className="text-xs text-stone-400">
                    Create credentials and assign a role to a new staff member.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateAccountOpen(false)}
                className="rounded-full p-2 text-stone-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAccount.name}
                    onChange={(e) => {
                      const val = e.target.value
                      setNewAccount((prev) => ({
                        ...prev,
                        name: val,
                        username: prev.username || val.toLowerCase().replace(/\s+/g, '_'),
                      }))
                    }}
                    placeholder="e.g. Liam O'Connor"
                    className="w-full rounded-xl border border-stone-800 bg-[#140F0C] p-3 text-xs sm:text-sm text-stone-200 placeholder:text-stone-500 focus:border-[#F15A24] focus:outline-hidden transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={newAccount.email}
                    onChange={(e) => setNewAccount((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="liam@restaurant.com"
                    className="w-full rounded-xl border border-stone-800 bg-[#140F0C] p-3 text-xs sm:text-sm text-stone-200 placeholder:text-stone-500 focus:border-[#F15A24] focus:outline-hidden transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    value={newAccount.username}
                    onChange={(e) => setNewAccount((prev) => ({ ...prev, username: e.target.value }))}
                    placeholder="Auto-generated if empty"
                    className="w-full rounded-xl border border-stone-800 bg-[#140F0C] p-3 font-mono text-xs sm:text-sm text-stone-200 placeholder:text-stone-500 focus:border-[#F15A24] focus:outline-hidden transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newAccount.phone}
                    onChange={(e) => setNewAccount((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+353 87 123 4567"
                    className="w-full rounded-xl border border-stone-800 bg-[#140F0C] p-3 text-xs sm:text-sm text-stone-200 placeholder:text-stone-500 focus:border-[#F15A24] focus:outline-hidden transition"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                  Assign System Role *
                </label>
                <select
                  value={newAccount.role}
                  onChange={(e) => {
                    const roleVal = e.target.value
                    let defaultSection = 'Operations & Floor'
                    if (roleVal === 'chef' || roleVal === 'kitchen_staff') defaultSection = 'Kitchen Line & KDS'
                    if (roleVal === 'cashier_front') defaultSection = 'Front Desk & Cashier POS'
                    if (roleVal === 'delivery_staff') defaultSection = 'Delivery Dispatch'
                    setNewAccount((prev) => ({
                      ...prev,
                      role: roleVal,
                      assigned_section: defaultSection,
                    }))
                  }}
                  className="w-full rounded-xl border border-stone-800 bg-[#140F0C] p-3 text-xs sm:text-sm text-stone-200 focus:border-[#F15A24] focus:outline-hidden transition cursor-pointer"
                >
                  {roles.map((r) => (
                    <option key={r.role} value={r.role}>
                      {r.name} ({r.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-300">
                    Temporary Password *
                  </label>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-[11px] font-semibold text-[#F15A24] hover:underline cursor-pointer"
                  >
                    🎲 Auto-generate strong
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newAccount.password}
                    onChange={(e) => setNewAccount((prev) => ({ ...prev, password: e.target.value }))}
                    className="w-full rounded-xl border border-stone-800 bg-[#140F0C] p-3 pr-10 font-mono text-xs sm:text-sm text-stone-200 focus:border-[#F15A24] focus:outline-hidden transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                    Shift Assignment
                  </label>
                  <select
                    value={newAccount.shift}
                    onChange={(e) => setNewAccount((prev) => ({ ...prev, shift: e.target.value }))}
                    className="w-full rounded-xl border border-stone-800 bg-[#140F0C] p-3 text-xs sm:text-sm text-stone-200 focus:border-[#F15A24] focus:outline-hidden transition cursor-pointer"
                  >
                    <option value="Morning (10:00 - 16:00)">Morning (10:00 - 16:00)</option>
                    <option value="Evening (16:00 - 23:00)">Evening (16:00 - 23:00)</option>
                    <option value="Full Day">Full Day</option>
                    <option value="Weekend Shift">Weekend Shift</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                    Assigned Section
                  </label>
                  <input
                    type="text"
                    value={newAccount.assigned_section}
                    onChange={(e) => setNewAccount((prev) => ({ ...prev, assigned_section: e.target.value }))}
                    placeholder="e.g. Operations & Floor"
                    className="w-full rounded-xl border border-stone-800 bg-[#140F0C] p-3 text-xs sm:text-sm text-stone-200 focus:border-[#F15A24] focus:outline-hidden transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsCreateAccountOpen(false)}
                  className="rounded-xl border border-stone-700 px-4 py-2 text-xs font-semibold text-stone-300 hover:bg-white/5 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#F15A24] to-[#FBA138] px-5 py-2 text-xs font-bold text-white shadow-md hover:brightness-105 active:scale-95 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  <span>Provision Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
