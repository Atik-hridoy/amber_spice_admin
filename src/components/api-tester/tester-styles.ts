import type { HttpMethod } from '../../types/api-tester'

export const TESTER_INPUT = 'w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-800 outline-none focus:border-[#B84A22] focus:bg-white disabled:opacity-50'
export const TESTER_CARD = 'rounded-2xl border border-stone-200/80 bg-white p-4 shadow-xs'
export const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'text-emerald-700 bg-emerald-50', POST: 'text-amber-700 bg-amber-50',
  PUT: 'text-blue-700 bg-blue-50', PATCH: 'text-purple-700 bg-purple-50', DELETE: 'text-rose-700 bg-rose-50',
}
