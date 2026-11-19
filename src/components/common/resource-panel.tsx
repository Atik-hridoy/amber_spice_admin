import { useCallback, useEffect, useState } from 'react'
import { adminRequest } from '../../services/api-client'
import { listRecords, saveRecord, type ResourceRow } from '../../services/resource-service'

export interface ResourceField {
  key: string
  label: string
  type?: 'text' | 'number' | 'email' | 'date' | 'time' | 'textarea' | 'checkbox' | 'password' | 'select'
  required?: boolean
  options?: string[]
  source?: { endpoint: string; label: string; valueKey?: string; numeric?: boolean }
  defaultValue?: unknown
  min?: number
}
interface Props {
  title: string
  endpoint: string
  columns: { key: string; label: string }[]
  fields?: ResourceField[]
  createFields?: ResourceField[]
  canCreate?: boolean
  canDelete?: boolean
  singleton?: boolean
}
function display(value: unknown) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.join(', ')
  return typeof value === 'object' ? JSON.stringify(value) : String(value)
}

export function ResourcePanel({ title, endpoint, columns, fields = [], createFields, canCreate = false, canDelete = false, singleton = false }: Props) {
  const [rows, setRows] = useState<ResourceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<ResourceRow | 'new' | null>(null)
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [options, setOptions] = useState<Record<string, ResourceRow[]>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const reload = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    try { const data = await listRecords(endpoint, signal); if (!signal?.aborted) { setRows(data); setError('') } }
    catch (err) { if (!signal?.aborted) setError(err instanceof Error ? err.message : 'Unable to load saved records.') }
    finally { if (!signal?.aborted) setLoading(false) }
  }, [endpoint])
  useEffect(() => { const controller = new AbortController(); void reload(controller.signal); return () => controller.abort() }, [reload])
  const formFields = editing === 'new' ? createFields || fields : fields
  async function open(row: ResourceRow | 'new') {
    setEditing(row)
    setSaveError('')
    const selected = row === 'new' ? createFields || fields : fields
    setValues(Object.fromEntries(selected.map(field => [field.key, row === 'new' ? field.defaultValue ?? (field.type === 'checkbox' ? false : '') : row[field.key] ?? ''])))
    setOptions({})
    try {
      const loaded = await Promise.all(selected.filter(field => field.source).map(async field => [field.key, await listRecords(field.source!.endpoint)] as const))
      setOptions(Object.fromEntries(loaded))
    } catch (err) { setSaveError(err instanceof Error ? err.message : 'Unable to load linked records.') }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (saving || !editing) return
    setSaving(true)
    setSaveError('')
    const body = Object.fromEntries(formFields.map(field => [field.key, field.type === 'number' || (field.source && field.source.numeric !== false) ? values[field.key] === '' ? null : Number(values[field.key]) : values[field.key]]))
    try { await saveRecord(endpoint, body, editing === 'new' ? undefined : editing.id); setEditing(null); await reload() }
    catch (err) { setSaveError(err instanceof Error ? err.message : 'Unable to save. Please retry.') }
    finally { setSaving(false) }
  }
  async function remove(row: ResourceRow) {
    if (!window.confirm(`Delete this ${title.toLowerCase()} record?`)) return
    try { await adminRequest(`${endpoint}${row.id}/`, { method: 'DELETE', requireAuth: true }); await reload() }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to delete. Please retry.') }
  }
  const filtered = rows.filter(row => columns.some(column => display(row[column.key]).toLowerCase().includes(query.toLowerCase())))
  return <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">{title}</h2><div className="flex gap-3"><button onClick={() => void reload()} className="text-sm underline">Refresh</button>{canCreate && (!singleton || !rows.length) && <button onClick={() => void open('new')} className="rounded-xl bg-[#B84A22] px-4 py-2 text-sm text-white">Add {title}</button>}</div></div>
    {loading && <p role="status">Loading {title.toLowerCase()}…</p>}
    {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error} <button className="underline" onClick={() => void reload()}>Retry</button></div>}
    <input aria-label={`Search ${title}`} value={query} onChange={event => setQuery(event.target.value)} placeholder={`Search ${title.toLowerCase()}`} className="w-full rounded-xl border bg-white p-3 text-sm" />
    {!loading && !error && !filtered.length && <p className="rounded-xl border bg-white p-6 text-stone-500">No {title.toLowerCase()} found.</p>}
    {filtered.length > 0 && <div className="overflow-x-auto rounded-2xl border bg-white"><table className="w-full text-left text-sm"><thead><tr>{columns.map(column => <th key={column.key} className="p-3">{column.label}</th>)}{(fields.length > 0 || canDelete) && <th className="p-3">Actions</th>}</tr></thead><tbody>{filtered.map(row => <tr key={row.id} className="border-t">{columns.map(column => <td key={column.key} className="max-w-sm whitespace-pre-wrap break-words p-3">{display(row[column.key])}</td>)}{(fields.length > 0 || canDelete) && <td className="p-3"><div className="flex gap-3">{fields.length > 0 && <button className="underline" onClick={() => void open(row)}>Edit</button>}{canDelete && <button className="text-red-700 underline" onClick={() => void remove(row)}>Delete</button>}</div></td>}</tr>)}</tbody></table></div>}
    {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><form onSubmit={submit} role="dialog" aria-modal="true" aria-label={`${editing === 'new' ? 'Add' : 'Edit'} ${title}`} className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-3xl bg-white p-6">
      <h3 className="text-xl font-bold">{editing === 'new' ? 'Add' : 'Edit'} {title}</h3>
      <fieldset disabled={saving} className="space-y-4">{formFields.map(field => {
        const style = 'mt-1 block w-full rounded-xl border p-3 text-sm'
        return <label key={field.key} className="block text-sm font-medium">{field.label}{field.required ? ' *' : ''}{field.type === 'checkbox' ? <input type="checkbox" className="ml-3" checked={Boolean(values[field.key])} onChange={e => setValues(previous => ({ ...previous, [field.key]: e.target.checked }))} /> : field.type === 'textarea' ? <textarea required={field.required} className={style} value={String(values[field.key] ?? '')} onChange={e => setValues(previous => ({ ...previous, [field.key]: e.target.value }))} /> : field.type === 'select' || field.source ? <select required={field.required} className={style} value={String(values[field.key] ?? '')} onChange={e => setValues(previous => ({ ...previous, [field.key]: e.target.value }))}><option value="">Select {field.label.toLowerCase()}</option>{field.source ? (options[field.key] || []).map(option => <option key={option.id} value={String(option[field.source!.valueKey || 'id'])}>{display(option[field.source!.label])}</option>) : field.options?.map(option => <option key={option}>{option}</option>)}</select> : <input required={field.required} type={field.type || 'text'} min={field.min} step={field.type === 'number' ? '0.01' : undefined} className={style} autoComplete={field.type === 'password' ? 'new-password' : undefined} value={String(values[field.key] ?? '')} onChange={e => setValues(previous => ({ ...previous, [field.key]: e.target.value }))} />}</label>
      })}</fieldset>
      {saveError && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{saveError} Retry saving, or close and reopen to reload linked records.</div>}
      <div className="flex gap-3"><button disabled={saving} className="rounded-xl bg-[#B84A22] px-5 py-3 text-white">{saving ? 'Saving…' : 'Save'}</button><button type="button" disabled={saving} onClick={() => setEditing(null)}>Cancel</button></div>
    </form></div>}
  </section>
}
