import type { AdminUser, AdminView } from '../types/admin'

/**
 * Role Permission Matrix:
 * 1. Manager (Super Admin): ALL ACCESS across the whole system.
 * 2. Staff: Inventory management, Dish creation/pricing, Taking/Forwarding orders to Chef, Table booking.
 * 3. Chef: Sees placed orders on KDS, Prepares orders, and Sends stock-running-low notifications.
 */
export const ROLE_ALLOWED_VIEWS: Record<string, AdminView[]> = {
  super_admin: [
    'kitchen',
    'orders',
    'inventory',
    'products',
    'tables',
    'analytics',
    'customers',
    'promotions',
    'staff',
    'transactions',
    'api-tester',
  ],
  manager: [
    'kitchen',
    'orders',
    'inventory',
    'products',
    'tables',
    'analytics',
    'customers',
    'promotions',
    'staff',
    'transactions',
    'api-tester',
  ],
  admin: [
    'kitchen',
    'orders',
    'inventory',
    'products',
    'tables',
    'analytics',
    'customers',
    'promotions',
    'staff',
    'transactions',
    'api-tester',
  ],

  // Operations Staff: Maintains inventory, creates dishes, manages orders and tables
  staff: ['orders', 'products', 'inventory', 'tables'],
  cashier_front: ['orders', 'tables'],
  delivery_staff: ['orders'],

  // Chef: Kitchen Orders (KDS) & Stock Alerts
  chef: ['kitchen'],
  kitchen_staff: ['kitchen'],
}

export function getAllowedViews(user?: AdminUser | null): AdminView[] {
  if (!user) return []
  if (
    user.isSuperAdmin ||
    user.role === 'super_admin' ||
    user.role === 'manager' ||
    user.role === 'admin'
  ) {
    return ROLE_ALLOWED_VIEWS.manager
  }
  return ROLE_ALLOWED_VIEWS[user.role] || ['orders']
}

export function isViewAllowed(view: AdminView, user?: AdminUser | null): boolean {
  const allowed = getAllowedViews(user)
  return allowed.includes(view)
}

export function getDefaultViewForRole(role?: string): AdminView {
  if (role === 'chef' || role === 'kitchen_staff') return 'kitchen'
  if (role === 'staff' || role === 'cashier_front' || role === 'delivery_staff') return 'orders'
  return 'kitchen'
}

