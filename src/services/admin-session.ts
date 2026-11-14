import type { AdminUser } from '../types/admin'

const ACCESS_KEY = 'amber_admin_token'
const REFRESH_KEY = 'amber_admin_refresh'
const USER_KEY = 'amber_admin_user'

function readValue(key: string): string | null {
  return sessionStorage.getItem(key) || localStorage.getItem(key)
}

export function getAdminAccessToken(): string | null {
  const token = readValue(ACCESS_KEY)
  return token && !token.startsWith('offline') ? token : null
}

export function getAdminRefreshToken(): string | null {
  const token = readValue(REFRESH_KEY)
  return token && !token.startsWith('offline') ? token : null
}

export function getStoredAdminUser(): AdminUser | null {
  try {
    const value = readValue(USER_KEY)
    return value ? JSON.parse(value) as AdminUser : null
  } catch {
    return null
  }
}

export function clearAdminSession() {
  for (const storage of [localStorage, sessionStorage]) {
    for (const key of [ACCESS_KEY, REFRESH_KEY, USER_KEY]) storage.removeItem(key)
  }
}

export function storeAdminSession(access: string, refresh: string, user: AdminUser, remember: boolean) {
  clearAdminSession()
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(ACCESS_KEY, access)
  storage.setItem(REFRESH_KEY, refresh)
  storage.setItem(USER_KEY, JSON.stringify(user))
}

export function updateAdminTokens(access: string, refresh?: string) {
  const storage = sessionStorage.getItem(REFRESH_KEY) ? sessionStorage : localStorage
  storage.setItem(ACCESS_KEY, access)
  if (refresh) storage.setItem(REFRESH_KEY, refresh)
}
