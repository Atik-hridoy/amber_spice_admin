import { useEffect, useState } from 'react'
import type { AdminUser, RoleConfig } from '../../types/admin'
import { roleService, type PermissionCatalogResponse } from '../../services/role-service'

export function RolesManagementView({ currentUser }: { currentUser: AdminUser }) {
  const [roles, setRoles] = useState<RoleConfig[]>([])
  const [catalog, setCatalog] = useState<PermissionCatalogResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [selected, setSelected] = useState<RoleConfig | null>(null)
  const [permissions, setPermissions] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)
  const [roleKey, setRoleKey] = useState('')
  const [roleName, setRoleName] = useState('')
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('')
    Promise.all([roleService.listRoles(controller.signal), roleService.getCatalog(controller.signal)]).then(([rows, definitions]) => { if (!controller.signal.aborted) { setRoles(rows); setCatalog(definitions) } }).catch(err => { if (!controller.signal.aborted) setError(err.message) }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [retry])
  async function save(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError('')
    try {
      if (creating) await roleService.createRole({ role: roleKey.trim(), name: roleName.trim(), permissions, description: '' })
      else if (selected) await roleService.updateRolePermissions(selected.id, permissions)
      setSelected(null); setCreating(false); setRetry(value => value + 1)
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save role. Retry saving.') }
    finally { setSaving(false) }
  }
  return <div className="space-y-5"><h1 className="text-2xl font-bold">Roles & Permissions</h1><p className="text-sm text-stone-500">Signed in as {currentUser.fullName}. Changes are saved to backend role configuration.</p>{loading && <p role="status">Loading roles…</p>}{error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-red-800">{error} <button className="underline" onClick={() => setRetry(value => value + 1)}>Retry</button></div>}<button className="rounded-xl bg-[#B84A22] p-3 text-white" onClick={() => { setCreating(true); setSelected(null); setPermissions([]); setRoleKey(''); setRoleName('') }}>Create role</button>{!loading && !roles.length && !error && <p>No role configurations found.</p>}<div className="grid sm:grid-cols-2 gap-4">{roles.map(role => <button key={role.id} onClick={() => { setCreating(false); setSelected(role); setPermissions(role.permissions) }} className="rounded-2xl border bg-white p-5 text-left"><h2 className="font-bold">{role.name}</h2><p className="text-sm">{role.role} · {role.permissions.length} permissions</p><p className="text-xs text-stone-500">{role.is_customizable ? 'Edit permissions' : 'Fixed owner permissions'}</p></button>)}</div>{(selected || creating) && catalog && <form onSubmit={save} className="space-y-4 rounded-2xl border bg-white p-5"><h2 className="text-lg font-bold">{creating ? 'New role' : selected?.name}</h2>{creating && <><label className="block">Role key<input required pattern="[a-z][a-z0-9_]*" maxLength={30} value={roleKey} onChange={e => setRoleKey(e.target.value)} className="block w-full rounded-xl border p-3" /></label><label className="block">Role name<input required value={roleName} onChange={e => setRoleName(e.target.value)} className="block w-full rounded-xl border p-3" /></label></>}<fieldset disabled={saving || Boolean(selected && !selected.is_customizable)} className="grid sm:grid-cols-2 gap-3">{Object.entries(catalog.permissions).map(([key, label]) => <label key={key} className="flex gap-2 text-sm"><input type="checkbox" checked={permissions.includes(key)} onChange={e => setPermissions(previous => e.target.checked ? [...previous, key] : previous.filter(permission => permission !== key))} />{label}</label>)}</fieldset><div className="flex gap-3">{(creating || selected?.is_customizable) && <button disabled={saving} className="rounded-xl bg-[#B84A22] p-3 text-white">{saving ? 'Saving…' : 'Save permissions'}</button>}<button type="button" onClick={() => { setSelected(null); setCreating(false) }}>Close</button></div></form>}</div>
}
