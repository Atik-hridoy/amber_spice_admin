import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import type { ApiPreset } from '../../types/api-tester'
import { METHOD_COLORS, TESTER_CARD, TESTER_INPUT } from './tester-styles'

interface Props {
  presets: ApiPreset[]
  selectedId: string
  isLoading: boolean
  disabled: boolean
  error: string
  onReload: () => void
  onSelect: (preset: ApiPreset) => void
}

export function TesterCollection({ presets, selectedId, isLoading, disabled, error, onReload, onSelect }: Props) {
  const [search, setSearch] = useState('')
  const filtered = presets.filter((preset) => `${preset.name} ${preset.category} ${preset.url} ${preset.method}`.toLowerCase().includes(search.toLowerCase()))
  return <aside className={`${TESTER_CARD} flex max-h-[760px] flex-col lg:sticky lg:top-4`}>
    <div className="mb-3 flex items-center justify-between gap-2"><h2 className="text-xs font-bold uppercase tracking-wide text-stone-800">API collection ({presets.length})</h2><button type="button" onClick={onReload} disabled={disabled || isLoading} aria-label="Refresh API collection" className="rounded-lg p-2 text-[#B84A22] disabled:opacity-50"><RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} /></button></div>
    {isLoading && <p role="status" className="mb-2 text-xs text-stone-500">Loading live API schema…</p>}
    {error && <p role="alert" className="mb-3 text-xs text-red-700">{error} Menu templates remain available. Refresh to retry.</p>}
    <input aria-label="Filter endpoints" placeholder="Search endpoint, method or app…" value={search} onChange={(event) => setSearch(event.target.value)} className={TESTER_INPUT} />
    <div className="mt-3 min-h-0 space-y-2 overflow-y-auto pr-1">
      {filtered.map((preset) => <button key={preset.id} type="button" disabled={disabled} aria-label={preset.name} aria-pressed={selectedId === preset.id} onClick={() => onSelect(preset)} className={`w-full rounded-xl border p-3 text-left transition-colors disabled:opacity-50 ${selectedId === preset.id ? 'border-[#B84A22]/60 bg-orange-50' : 'border-transparent hover:border-stone-200 hover:bg-stone-50'}`}>
        <span className="mb-1 flex items-center justify-between gap-2"><span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${METHOD_COLORS[preset.method]}`}>{preset.method}</span><span className="truncate text-[10px] text-stone-400">{preset.category}</span></span>
        <span className="block text-xs font-semibold text-stone-800">{preset.name}</span><span className="mt-1 block truncate font-mono text-[10px] text-stone-500">{new URL(preset.url).pathname.replaceAll('%7B', '{').replaceAll('%7D', '}')}</span>
      </button>)}
      {!filtered.length && <p className="py-6 text-xs text-stone-500">No matching endpoints.</p>}
    </div>
  </aside>
}
