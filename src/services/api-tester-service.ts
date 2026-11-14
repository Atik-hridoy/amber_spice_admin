import { adminFetch } from './api-client'
import { ADMIN_API_BASE_URL, BACKEND_SERVER_URL } from './endpoints'
import type { TesterRequest, TesterResponse } from '../types/api-tester'

export const API_SCHEMA_URL = `${BACKEND_SERVER_URL}/api/schema/?format=json`
export const API_DOCS_URL = `${BACKEND_SERVER_URL}/api/docs/`

export function resolveTesterUrl(template: string, variables: Record<string, string>): string {
  const resolved = template.replace(/\{([^}]+)\}/g, (_, key: string) => {
    if (!variables[key]?.trim()) throw new Error(`Enter ${key} before sending this request.`)
    return encodeURIComponent(variables[key].trim())
  })
  const base = new URL(`${ADMIN_API_BASE_URL}/`)
  const url = new URL(resolved)
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) {
    throw new Error('Use the configured restaurant API URL for this tester.')
  }
  return url.href
}

function parseProperties(text: string, label: string): Record<string, unknown> {
  let parsed: unknown
  try { parsed = JSON.parse(text || '{}') } catch { throw new Error(`${label} must be a valid JSON object.`) }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(`${label} must be a JSON object.`)
  return parsed as Record<string, unknown>
}

export async function sendTesterRequest(input: TesterRequest, signal?: AbortSignal): Promise<TesterResponse> {
  const url = resolveTesterUrl(input.url, input.variables)
  const headers = new Headers()
  for (const [key, value] of Object.entries(parseProperties(input.headers, 'Headers'))) {
    if (typeof value !== 'string') throw new Error('Header values must be strings.')
    if (key.toLowerCase() === 'authorization') continue
    headers.set(key, value)
  }
  if (input.authMode === 'manual') {
    const token = input.token.trim().replace(/^Bearer\s+/i, '')
    if (!token) throw new Error('Paste an access token or select No authentication.')
    headers.set('Authorization', `Bearer ${token}`)
  }
  let body: BodyInit | undefined
  if (!['GET', 'DELETE'].includes(input.method) && input.bodyMode !== 'none') {
    if (input.bodyMode === 'multipart') {
      const form = new FormData()
      for (const [key, value] of Object.entries(parseProperties(input.body, 'Multipart properties'))) {
        if (value === null || value === undefined) continue
        if (input.file && key === input.fileField) continue
        form.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
      }
      if (input.file) {
        if (!input.fileField.trim()) throw new Error('Enter the file field name.')
        form.append(input.fileField.trim(), input.file)
      }
      headers.delete('Content-Type')
      body = form
    } else if (input.body.trim()) {
      body = input.body
      if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
    }
  }
  const started = performance.now()
  const response = await adminFetch(url, { method: input.method, headers, body, signal,
    useSession: input.authMode === 'session', timeoutMs: input.file ? 60000 : 15000,
  })
  const text = await response.text()
  let json: unknown
  try { json = JSON.parse(text) } catch { /* Preserve non-JSON responses, including server errors. */ }
  return { status: response.status, statusText: response.statusText,
    timeMs: Math.round(performance.now() - started), sizeBytes: new Blob([text]).size,
    headers: Object.fromEntries(response.headers.entries()), body: json === undefined ? text : JSON.stringify(json, null, 2), json,
  }
}
