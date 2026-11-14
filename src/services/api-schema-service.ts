import { ADMIN_API_BASE_URL } from './api-client'
import { API_SCHEMA_URL } from './api-tester-service'
import type { ApiPreset, HttpMethod } from '../types/api-tester'

interface Schema {
  $ref?: string
  type?: string
  format?: string
  properties?: Record<string, Schema>
  required?: string[]
  readOnly?: boolean
  default?: unknown
  allOf?: Schema[]
  oneOf?: Schema[]
  anyOf?: Schema[]
}
interface Operation {
  summary?: string
  description?: string
  operationId?: string
  tags?: string[]
  requestBody?: { content?: Record<string, { schema?: Schema }> }
}
interface Document {
  paths: Record<string, Record<string, Operation>>
  components?: { schemas?: Record<string, Schema> }
}

function resolve(schema: Schema, document: Document, depth = 0): Schema {
  if (depth > 8) return {}
  if (schema.$ref) return resolve(document.components?.schemas?.[schema.$ref.split('/').pop()!] || {}, document, depth + 1)
  const branch = schema.allOf?.[0] || schema.oneOf?.[0] || schema.anyOf?.[0]
  return branch ? resolve(branch, document, depth + 1) : schema
}

function template(schema: Schema, document: Document, depth = 0): unknown {
  const resolved = resolve(schema, document)
  if (depth > 3) return null
  if (resolved.default !== undefined) return resolved.default
  if (resolved.properties) return Object.fromEntries(Object.entries(resolved.properties)
    .filter(([name, field]) => !field.readOnly && field.format !== 'binary' && resolved.required?.includes(name))
    .map(([name, field]) => [name, template(field, document, depth + 1)]))
  if (resolved.type === 'array') return []
  if (resolved.type === 'boolean') return false
  if (resolved.type === 'integer' || resolved.type === 'number') return null
  return ''
}

function operationKey(preset: ApiPreset): string {
  return `${preset.method} ${preset.url.split('?')[0]}`
}

export function presetsFromSchema(document: Document, curated: ApiPreset[]): ApiPreset[] {
  if (!document?.paths || typeof document.paths !== 'object') throw new Error('The backend returned an invalid API schema.')
  const discovered: ApiPreset[] = []
  for (const [path, operations] of Object.entries(document.paths)) {
    if (!path.startsWith('/api/v1/')) continue
    const resource = path.includes('/menu/categories/') ? 'category' : path.includes('/menu/dishes/') ? 'dish' : undefined
    const relative = path.slice('/api/v1/'.length).replace(/\{id\}/g, resource ? `{${resource}Id}` : '{id}')
    for (const [verb, operation] of Object.entries(operations)) {
      const method = verb.toUpperCase() as HttpMethod
      if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) continue
      const content = operation.requestBody?.content || {}
      const schema = content['application/json']?.schema || content['multipart/form-data']?.schema
      const resolved = schema ? resolve(schema, document) : {}
      const fields = Object.entries(resolved.properties || {}).filter(([, field]) => !field.readOnly)
        .map(([name, field]) => `${name}${resolved.required?.includes(name) ? ' *' : ''}${field.format === 'binary' ? ' (file)' : ''}`)
      discovered.push({ id: `schema:${method}:${path}`, name: operation.summary || operation.operationId?.replaceAll('_', ' ') || `${method} ${relative}`,
        category: operation.tags?.[0] || relative.split('/')[0], method, url: `${ADMIN_API_BASE_URL}/${relative}`,
        description: operation.description || path, resource, fields,
        auth: /\/auth\/(login|register|token\/refresh)\//.test(path) ? 'none' : undefined,
        body: schema ? JSON.stringify(template(schema, document), null, 2) : undefined,
        bodyMode: schema ? content['application/json'] ? 'json' : 'multipart' : 'none',
      })
    }
  }
  const known = new Set(curated.map(operationKey))
  const byKey = new Map(discovered.map((preset) => [operationKey(preset), preset]))
  return [...curated.map((preset) => ({ ...preset, fields: byKey.get(operationKey(preset))?.fields })),
    ...discovered.filter((preset) => !known.has(operationKey(preset)))]
}

export async function loadApiPresets(curated: ApiPreset[], signal?: AbortSignal): Promise<ApiPreset[]> {
  const timeout = AbortSignal.timeout(15000)
  const response = await fetch(API_SCHEMA_URL, { headers: { Accept: 'application/json' }, signal: signal ? AbortSignal.any([signal, timeout]) : timeout })
  if (!response.ok) throw new Error(`Could not load the live API collection (HTTP ${response.status}).`)
  return presetsFromSchema(await response.json() as Document, curated)
}
