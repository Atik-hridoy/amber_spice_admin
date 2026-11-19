export class AdminApiError extends Error {
  status: number
  fieldErrors: Record<string, string[]>

  constructor(message: string, status = 0, fieldErrors: Record<string, string[]> = {}) {
    super(message)
    this.name = 'AdminApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

export function errorFromResponse(status: number, body: unknown): AdminApiError {
  const fieldErrors: Record<string, string[]> = {}
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string') fieldErrors[key] = [value]
      else if (Array.isArray(value)) fieldErrors[key] = value.filter((item): item is string => typeof item === 'string')
    }
  }
  const detail = fieldErrors.detail?.[0] || fieldErrors.non_field_errors?.[0]
  const message = status === 401
    ? 'Your session has expired. Please sign in again.'
    : status === 403
      ? 'Your account does not have permission to manage this menu resource.'
      : detail || Object.values(fieldErrors).flat()[0] || 'The request could not be completed. Please try again.'
  return new AdminApiError(message, status, fieldErrors)
}
