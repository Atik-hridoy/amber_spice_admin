import { Send, Square } from 'lucide-react'
import type { HttpMethod, TesterRequest } from '../../types/api-tester'
import { METHOD_COLORS, TESTER_INPUT } from './tester-styles'

interface Props {
  request: TesterRequest
  isLoading: boolean
  onChange: (values: Partial<TesterRequest>) => void
  onSend: () => void
  onCancel: () => void
}

export function TesterRequestBar({ request, isLoading, onChange, onSend, onCancel }: Props) {
  return <div className="flex flex-col gap-2 sm:flex-row">
    <select aria-label="HTTP method" value={request.method} disabled={isLoading} onChange={(event) => onChange({ method: event.target.value as HttpMethod })} className={`rounded-xl border border-stone-200 px-3 py-2 text-xs font-bold ${METHOD_COLORS[request.method]}`}>{Object.keys(METHOD_COLORS).map((method) => <option key={method}>{method}</option>)}</select>
    <input aria-label="Request URL" value={request.url} disabled={isLoading} onChange={(event) => onChange({ url: event.target.value })} className={`${TESTER_INPUT} min-w-0 flex-1 font-mono`} />
    <button type="button" onClick={onSend} disabled={isLoading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#B84A22] to-[#FBA138] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50"><Send size={15} />{isLoading ? 'Sending…' : 'Send'}</button>
    {isLoading && <button type="button" onClick={onCancel} className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-xs"><Square size={13} />Cancel</button>}
  </div>
}
