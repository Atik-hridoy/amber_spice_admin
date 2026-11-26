import type { AdminUser, AdminView } from '../types/admin'

const VIEW_PERMISSIONS: Record<AdminView, string[]> = {
  kitchen: ['kitchen:view_orders'], orders: ['orders:view', 'orders:create', 'deliveries:view_assigned'],
  tables: ['reservations:view', 'reservations:manage'], analytics: ['reports:view'],
  inventory: ['inventory:view', 'inventory:manage'], products: ['menu:manage', 'menu:toggle_availability'],
  promotions: ['settings:manage'], customers: ['customers:view'], staff: ['staff:manage'],
  transactions: ['orders:view', 'reports:view'], roles: ['settings:manage'],
  content: ['settings:manage'], account: [],
}
export function getAllowedViews(user?: AdminUser | null): AdminView[] {
  if (!user) return []
  return (Object.keys(VIEW_PERMISSIONS) as AdminView[]).filter(view => view === 'account' || VIEW_PERMISSIONS[view].some(permission => user.permissions?.includes(permission)))
}
export function isViewAllowed(view: AdminView, user?: AdminUser | null) { return getAllowedViews(user).includes(view) }
export function getDefaultViewForRole(role?: string): AdminView {
  return role === 'chef' || role === 'kitchen_staff' || role === 'admin' || role === 'manager' || role === 'super_admin' ? 'kitchen' : 'orders'
}
