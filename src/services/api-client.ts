import { AdminApiError, errorFromResponse } from './api-error'
import { clearAdminSession, getAdminAccessToken, getAdminRefreshToken, updateAdminTokens } from './admin-session'

export const ADMIN_API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1'
).replace(/\/+$/, '')

interface AdminRequestOptions extends RequestInit {
  requireAuth?: boolean
  useSession?: boolean
  timeoutMs?: number
}

let refreshPromise: Promise<string | null> | null = null

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController()
  const cancel = () => controller.abort()
  const timer = setTimeout(cancel, timeoutMs)
  options.signal?.addEventListener('abort', cancel, { once: true })
  if (options.signal?.aborted) cancel()
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
    options.signal?.removeEventListener('abort', cancel)
  }
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise
  const refresh = getAdminRefreshToken()
  if (!refresh) return null
  refreshPromise = (async () => {
    try {
      const response = await fetchWithTimeout(`${ADMIN_API_BASE_URL}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      })
      if (!response.ok) {
        if (response.status === 400 || response.status === 401) clearAdminSession()
        return null
      }
      const data: { access?: string; refresh?: string } = await response.json()
      if (!data.access) return null
      updateAdminTokens(data.access, data.refresh)
      return data.access
    } catch {
      return null
    } finally {
      refreshPromise = null
    }
  })()
  return refreshPromise
}

function resolveApiUrl(endpoint: string): string {
  const base = new URL(`${ADMIN_API_BASE_URL}/`)
  const url = /^https?:\/\//.test(endpoint) ? new URL(endpoint) : new URL(endpoint.replace(/^\/+/, ''), base)
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) {
    throw new AdminApiError('The server returned an invalid pagination address.')
  }
  return url.toString()
}

export async function adminFetch(endpoint: string, options: AdminRequestOptions = {}): Promise<Response> {
  const { requireAuth = false, useSession = true, timeoutMs = 15000, ...requestOptions } = options
  const url = resolveApiUrl(endpoint)
  let token = useSession ? getAdminAccessToken() : null
  if (useSession && !token && getAdminRefreshToken()) token = await refreshAccessToken()
  if (requireAuth && !token) {
    throw new AdminApiError('Sign in with a connected restaurant account to manage the menu.', 401)
  }

  const send = (access: string | null) => {
    const headers = new Headers(requestOptions.headers)
    headers.set('Accept', 'application/json')
    if (requestOptions.body instanceof FormData) headers.delete('Content-Type')
    else if (requestOptions.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
    if (access) headers.set('Authorization', `Bearer ${access}`)
    return fetchWithTimeout(url, { ...requestOptions, headers }, timeoutMs)
  }

  let response: Response
  try {
    response = await send(token)
    if (useSession && response.status === 401 && getAdminRefreshToken()) {
      const freshToken = await refreshAccessToken()
      if (freshToken) response = await send(freshToken)
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError' && requestOptions.signal?.aborted) throw error
    throw new AdminApiError('Cannot connect to the restaurant server. Check your connection and try again.')
  }
  return response
}

export async function adminRequest<T>(endpoint: string, options: AdminRequestOptions = {}): Promise<T> {
  const response = await adminFetch(endpoint, options)
  const data: unknown = response.status === 204 ? undefined : await response.json().catch(() => null)
  if (!response.ok) throw errorFromResponse(response.status, data)
  return data as T
}
