import type { CreateAccountPayload, CreateRolePayload, RoleConfig } from '../types/admin'
import { adminRequest } from './api-client'
import { listRecords } from './resource-service'

export interface PermissionCatalogResponse { permissions: Record<string, string>; categories: Record<string, string[]> }
export interface StaffAccountItem { id: number | string; username: string; name: string; fullName?: string; email: string; phone?: string | null; role: string; roleDisplay?: string; isActive: boolean; shift?: string; assignedSection?: string; dateJoined?: string }
export const roleService = {
  listRoles: (signal?: AbortSignal) => listRecords<RoleConfig>('auth/roles-config/', signal),
  getCatalog: (signal?: AbortSignal) => adminRequest<PermissionCatalogResponse>('auth/roles-config/catalog/', { requireAuth: true, signal }),
  createRole: (payload: CreateRolePayload) => adminRequest<RoleConfig>('auth/roles-config/', { method: 'POST', requireAuth: true, body: JSON.stringify(payload) }),
  updateRolePermissions: (id: string | number, permissions: string[]) => adminRequest<RoleConfig>(`auth/roles-config/${id}/`, { method: 'PATCH', requireAuth: true, body: JSON.stringify({ permissions }) }),
  async listStaffAccounts(signal?: AbortSignal): Promise<StaffAccountItem[]> {
    const rows = await listRecords<Record<string, unknown>>('auth/staff/', signal)
    return rows.map(row => ({ id: row.id as number, username: String(row.username), name: String(row.fullName || row.username), fullName: String(row.fullName || ''), email: String(row.email), phone: row.phone as string | null, role: String(row.role), roleDisplay: String(row.roleDisplay), isActive: Boolean(row.is_active), dateJoined: String(row.date_joined) }))
  },
  createStaffAccount: (payload: CreateAccountPayload) => adminRequest('auth/staff/', { method: 'POST', requireAuth: true, body: JSON.stringify(payload) }),
  toggleStaffStatus: (id: string | number, isActive: boolean) => adminRequest(`auth/staff/${id}/`, { method: 'PATCH', requireAuth: true, body: JSON.stringify({ is_active: isActive }) }),
}
