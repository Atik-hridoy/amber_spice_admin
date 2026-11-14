/**
 * API Base URLs and Host configuration for Amber Spice Admin.
 * Supports VITE_API_BASE_URL and VITE_BACKEND_URL environment variables with local fallbacks.
 */

import { AdminApiError } from '../api-error'

// Base URL for Django REST API (e.g. 'http://127.0.0.1:8000/api/v1')
export const ADMIN_API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1'
).replace(/\/+$/, '')

// Base Server origin URL (e.g. 'http://127.0.0.1:8000')
export const BACKEND_SERVER_URL = (
  import.meta.env.VITE_BACKEND_URL || new URL(ADMIN_API_BASE_URL).origin
).replace(/\/+$/, '')

/**
 * Resolves an endpoint path to a fully qualified URL, validating cross-origin constraints.
 */
export function resolveApiUrl(endpoint: string, baseUrl: string = ADMIN_API_BASE_URL): string {
  const base = new URL(`${baseUrl}/`)
  const url = /^https?:\/\//.test(endpoint) ? new URL(endpoint) : new URL(endpoint.replace(/^\/+/, ''), base)
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) {
    throw new AdminApiError('The server returned an invalid pagination address.')
  }
  return url.toString()
}

/**
 * Resolves a media or image URL to ensure it has a valid backend origin.
 */
export function resolveMediaUrl(imageUrl?: string | null): string | null {
  if (!imageUrl) return null
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl
  const cleanPath = imageUrl.replace(/^\/+/, '')
  return `${BACKEND_SERVER_URL}/${cleanPath}`
}
