import { AlertCircle, FolderOpen, Loader2, RefreshCw } from 'lucide-react'
import { AddedBy } from './added-by'
import type { MenuCategory } from '../../types/menu-category'

interface CategoryTabsProps {
  categories: MenuCategory[]
  selected: string
  isLoading: boolean
  error: string
  onSelect: (category: string) => void
  onReload: () => void
}

export function CategoryTabs({ categories, selected, isLoading, error, onSelect, onReload }: CategoryTabsProps) {
  return (
    <section aria-label="Menu categories" className="rounded-2xl border border-stone-200/80 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-stone-800"><FolderOpen size={17} className="text-[#B84A22]" />Categories<span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-500">{categories.length}</span></div>
        <button type="button" onClick={onReload} disabled={isLoading} aria-label="Refresh categories" className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 disabled:opacity-50"><RefreshCw size={15} className={isLoading ? 'animate-spin motion-reduce:animate-none' : ''} /></button>
      </div>
      {error && <div role="alert" className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800"><AlertCircle size={15} />{error}<button type="button" onClick={onReload} className="font-semibold underline underline-offset-2">Retry</button></div>}
      {isLoading && <p role="status" className="mb-3 flex items-center gap-2 text-xs text-stone-500"><Loader2 size={14} className="animate-spin motion-reduce:animate-none" />Loading categories…</p>}
      {!isLoading && !error && categories.length === 0 && <p className="mb-3 text-xs text-stone-500">No categories yet. Add your first category to organize this menu.</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" aria-pressed={selected === 'all'} onClick={() => onSelect('all')} className={`shrink-0 rounded-xl border px-4 py-2 text-xs font-semibold transition-colors ${selected === 'all' ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 text-stone-600 hover:bg-stone-50'}`}>All Dishes</button>
        {categories.map((category) => <button key={category.id} type="button" aria-label={category.name} aria-pressed={selected === String(category.id)} onClick={() => onSelect(String(category.id))} className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${selected === String(category.id) ? 'border-[#B84A22] bg-[#FFF7ED] text-[#B84A22]' : 'border-stone-200 text-stone-600 hover:bg-stone-50'}`}>
          {category.imageUrl && <img src={category.imageUrl} alt="" className="h-6 w-6 rounded-md object-cover" onError={(event) => { event.currentTarget.style.display = 'none' }} />}
          <span className="text-left"><span className="block">{category.name}</span><AddedBy creator={category.addedBy} /></span>{!category.is_active && <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[9px] font-medium text-stone-500">Hidden</span>}
        </button>)}
      </div>
    </section>
  )
}
