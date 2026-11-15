import { adminRequest } from './api-client'

export type ResourceRow = Record<string, unknown> & { id: number | string }

export async function listRecords<T = ResourceRow>(endpoint: string, signal?: AbortSignal): Promise<T[]> {
  const rows: T[] = []
  const visited = new Set<string>()
  let next: string | null = endpoint
  while (next) {
    if (visited.has(next)) throw new Error('The server returned a repeated page. Please retry.')
    visited.add(next)
    const page: T[] | { results: T[]; next?: string | null } = await adminRequest(next, { requireAuth: true, signal })
    if (Array.isArray(page)) return [...rows, ...page]
    if (!page || !Array.isArray(page.results)) throw new Error('The server returned an invalid list. Please retry.')
    rows.push(...page.results)
    next = page.next || null
  }
  return rows
}

export function saveRecord(endpoint: string, values: Record<string, unknown>, id?: string | number): Promise<ResourceRow> {
  return adminRequest(id === undefined ? endpoint : `${endpoint}${id}/`, { method: id === undefined ? 'POST' : 'PATCH', requireAuth: true, body: JSON.stringify(values) })
}
