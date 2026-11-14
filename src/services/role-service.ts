import type { CreateAccountPayload, CreateRolePayload, RoleConfig } from '../types/admin'
import { adminRequest } from './api-client'

export interface PermissionCatalogResponse {
  permissions: Record<string, string>
  categories: Record<string, string[]>
}

export interface StaffAccountItem {
  id: number | string
  username: string
  name: string
  fullName?: string
  email: string
  phone?: string | null
  role: string
  roleDisplay?: string
  isActive: boolean
  shift?: string
  assignedSection?: string
  dateJoined?: string
}

// Fallback Default Role Permissions for offline or initial display
export const DEFAULT_ROLE_CONFIGS: RoleConfig[] = [
  {
    id: 1,
    role: 'super_admin',
    name: 'Super Admin (System Owner)',
    description: 'Full unrestricted access to all restaurant modules, settings, role configuration, and staff accounts.',
    permissions: [
      'orders:view', 'orders:create', 'orders:update_status', 'orders:cancel',
      'kitchen:view_orders', 'kitchen:update_status',
      'deliveries:view_assigned', 'deliveries:update_status',
      'menu:view', 'menu:manage', 'menu:toggle_availability',
      'inventory:view', 'inventory:manage',
      'reports:view', 'staff:view', 'staff:manage',
      'reservations:view', 'reservations:manage',
      'customers:view', 'settings:manage',
    ],
    is_customizable: false,
  },
  {
    id: 2,
    role: 'manager',
    name: 'General Manager (Whole Access)',
    description: 'Comprehensive access to orders, menu, inventory, analytics/reports, reservations, and staff management.',
    permissions: [
      'orders:view', 'orders:create', 'orders:update_status', 'orders:cancel',
      'kitchen:view_orders', 'kitchen:update_status',
      'deliveries:view_assigned', 'deliveries:update_status',
      'menu:view', 'menu:manage', 'menu:toggle_availability',
      'inventory:view', 'inventory:manage',
      'reports:view', 'staff:view', 'staff:manage',
      'reservations:view', 'reservations:manage',
      'customers:view',
    ],
    is_customizable: true,
  },
  {
    id: 3,
    role: 'staff',
    name: 'Operations Staff',
    description: 'Maintains stock inventory, creates and prices dishes, takes customer orders, and forwards orders to Chef.',
    permissions: [
      'orders:view', 'orders:create', 'orders:update_status',
      'menu:view', 'menu:manage', 'menu:toggle_availability',
      'inventory:view', 'inventory:manage',
      'reservations:view', 'reservations:manage',
    ],
    is_customizable: true,
  },
  {
    id: 4,
    role: 'chef',
    name: 'Head Chef & Kitchen Staff',
    description: 'Monitors Kitchen Display System (KDS), prepares orders, and reports low ingredient stocks.',
    permissions: [
      'kitchen:view_orders', 'kitchen:update_status',
      'menu:toggle_availability', 'inventory:view',
    ],
    is_customizable: true,
  },
  {
    id: 5,
    role: 'cashier_front',
    name: 'Cashier / Front Host',
    description: 'Handles POS billing, takes takeaway orders, and manages table seating & guest reservations.',
    permissions: [
      'orders:view', 'orders:create', 'orders:update_status',
      'menu:view', 'menu:toggle_availability',
      'reservations:view', 'reservations:manage',
      'customers:view',
    ],
    is_customizable: true,
  },
  {
    id: 6,
    role: 'delivery_staff',
    name: 'Delivery Courier / Driver',
    description: 'Views assigned delivery orders, updates delivery status, and tracks drop-off locations.',
    permissions: [
      'deliveries:view_assigned', 'deliveries:update_status',
    ],
    is_customizable: true,
  },
]

export const PERMISSION_CATALOG: PermissionCatalogResponse = {
  permissions: {
    'orders:view': 'Can view all orders and order details',
    'orders:create': 'Can create new orders (cashier / front desk / phone)',
    'orders:update_status': 'Can update order status and payment status',
    'orders:cancel': 'Can cancel orders or process refunds',
    'kitchen:view_orders': 'Can view kitchen orders on KDS',
    'kitchen:update_status': 'Can mark kitchen items preparing / ready',
    'deliveries:view_assigned': 'Can view assigned delivery orders',
    'deliveries:update_status': 'Can update delivery progress and mark delivered',
    'menu:view': 'Can browse full menu and items',
    'menu:manage': 'Can create, edit, and delete dishes and categories',
    'menu:toggle_availability': 'Can mark menu items available or unavailable when out of stock',
    'inventory:view': 'Can view current inventory stock levels and status',
    'inventory:manage': 'Can add, edit, adjust stock, and restock inventory',
    'reports:view': 'Can view financial reports, sales analytics, and business summaries',
    'staff:view': 'Can view staff list, schedules, and shift assignments',
    'staff:manage': 'Can add, edit, and manage staff accounts and shift schedules',
    'reservations:view': 'Can view table reservations and dining floor status',
    'reservations:manage': 'Can manage tables, create reservations, and assign seats',
    'customers:view': 'Can view customer profiles, VIP status, and order history',
    'settings:manage': 'Full administrative control to configure roles and permissions',
  },
  categories: {
    'Orders & POS': ['orders:view', 'orders:create', 'orders:update_status', 'orders:cancel'],
    'Kitchen Display (KDS)': ['kitchen:view_orders', 'kitchen:update_status'],
    'Delivery & Logistics': ['deliveries:view_assigned', 'deliveries:update_status'],
    'Menu & Dishes': ['menu:view', 'menu:manage', 'menu:toggle_availability'],
    'Inventory & Stock': ['inventory:view', 'inventory:manage'],
    'Reports & Analytics': ['reports:view'],
    'Staff & Scheduling': ['staff:view', 'staff:manage'],
    'Tables & Reservations': ['reservations:view', 'reservations:manage'],
    'Customers': ['customers:view'],
    'System Administration': ['settings:manage'],
  },
}

export const roleService = {
  /**
   * List all configured roles from /api/v1/auth/roles-config/
   */
  async listRoles(signal?: AbortSignal): Promise<RoleConfig[]> {
    try {
      const response = await adminRequest<RoleConfig[] | { results: RoleConfig[] }>(
        'auth/roles-config/',
        { requireAuth: true, signal }
      )
      if (Array.isArray(response)) return response
      if (response && Array.isArray(response.results)) return response.results
      return DEFAULT_ROLE_CONFIGS
    } catch {
      // Fallback to initial roles if server is unreachable
      return DEFAULT_ROLE_CONFIGS
    }
  },

  /**
   * Create a new role definition with permissions
   */
  async createRole(payload: CreateRolePayload): Promise<RoleConfig> {
    return adminRequest<RoleConfig>('auth/roles-config/', {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify(payload),
    })
  },

  /**
   * Update permissions assigned to a role
   */
  async updateRolePermissions(id: number | string, permissions: string[]): Promise<RoleConfig> {
    return adminRequest<RoleConfig>(`auth/roles-config/${id}/`, {
      method: 'PATCH',
      requireAuth: true,
      body: JSON.stringify({ permissions }),
    })
  },

  /**
   * Get permission catalog & categories
   */
  async getCatalog(signal?: AbortSignal): Promise<PermissionCatalogResponse> {
    try {
      return await adminRequest<PermissionCatalogResponse>('auth/roles-config/catalog/', {
        requireAuth: true,
        signal,
      })
    } catch {
      return PERMISSION_CATALOG
    }
  },

  /**
   * List staff accounts from /api/v1/auth/staff/
   */
  async listStaffAccounts(signal?: AbortSignal): Promise<StaffAccountItem[]> {
    try {
      const response = await adminRequest<any>('auth/staff/', { requireAuth: true, signal })
      const rawList = Array.isArray(response) ? response : response?.results || []
      return rawList.map((user: any) => ({
        id: user.id,
        username: user.username,
        name: user.fullName || user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
        fullName: user.fullName || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        email: user.email,
        phone: user.phone,
        role: user.role,
        roleDisplay: user.roleDisplay || user.role,
        isActive: user.is_active ?? true,
        dateJoined: user.date_joined,
      }))
    } catch {
      return []
    }
  },

  /**
   * Create a new user account with role provisioning
   */
  async createStaffAccount(payload: CreateAccountPayload): Promise<any> {
    const response = await adminRequest<any>('auth/staff/', {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify(payload),
    })
    return response
  },

  /**
   * Toggle active/inactive status of a staff account
   */
  async toggleStaffStatus(id: number | string, isActive: boolean): Promise<any> {
    return adminRequest<any>(`auth/staff/${id}/`, {
      method: 'PATCH',
      requireAuth: true,
      body: JSON.stringify({ is_active: isActive }),
    })
  },
}
