export function customizationText(value: unknown): string {
  if (value == null) return ''
  if (Array.isArray(value)) return value.map(customizationText).filter(Boolean).join(', ')
  if (typeof value === 'object') return Object.entries(value).map(([key, entry]) => `${key}: ${customizationText(entry)}`).join('; ')
  return String(value)
}
