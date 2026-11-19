import { Edit2, Flame, Star, ToggleLeft, ToggleRight, Image } from 'lucide-react'
import type { MenuDish } from '../../types/menu-dish'
import { AddedBy } from './added-by'

interface ProductCardProps {
  dish: MenuDish
  onEdit: (dish: MenuDish) => void
  onToggleAvailability: () => void
  canManage: boolean
  canToggle: boolean
  busy: boolean
}

export function ProductCard({ dish, onEdit, onToggleAvailability, canManage, canToggle, busy }: ProductCardProps) {
  return (
    <article className="flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-4 transition-colors hover:border-[#B84A22]/40">
      <div>
        <div className="relative h-40 overflow-hidden rounded-xl bg-stone-100">
          <div className="flex h-full items-center justify-center text-stone-300">{dish.imageUrl ? <img src={dish.imageUrl} alt={dish.name} className="h-full w-full object-cover" /> : <Image size={32} aria-label="No dish image" />}</div>
          <span className="absolute right-2.5 top-2.5 rounded-lg bg-stone-900/80 px-2 py-0.5 text-[10px] font-bold text-white">{dish.category_name}</span>
          {dish.spicyLevel > 0 && <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-lg bg-red-600/90 px-2 py-0.5 text-[10px] font-bold text-white"><Flame size={12} />Spice {dish.spicyLevel}</span>}
        </div>
        <div className="mt-3 flex items-start justify-between gap-2"><h3 className="line-clamp-1 font-serif text-sm font-bold text-stone-900">{dish.name}</h3><span className="shrink-0 font-mono text-sm font-bold text-[#B84A22]">€{Number(dish.price).toFixed(2)}</span></div>
        <p className="mt-1 line-clamp-2 text-xs text-stone-500">{dish.description}</p>
        <div className="mt-3 flex items-center gap-3 text-xs text-stone-500"><span className="flex items-center gap-1 font-bold text-amber-500"><Star size={14} className="fill-current" />{dish.rating}</span><span>•</span><span>{dish.ordersCount} Total Orders</span></div>
        <div className="mt-2"><AddedBy creator={dish.addedBy} /></div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
        <div className="flex items-center gap-2"><span className="text-xs font-semibold text-stone-700">{dish.isAvailable ? 'Available' : 'Sold Out / Disabled'}</span><button type="button" onClick={onToggleAvailability} disabled={!canToggle || busy} aria-label={`Toggle availability for ${dish.name}`} className="rounded focus-visible:outline-[#B84A22]">{dish.isAvailable ? <ToggleRight size={28} className="text-emerald-600" /> : <ToggleLeft size={28} className="text-stone-400" />}</button></div>
        <button type="button" onClick={() => onEdit(dish)} disabled={!canManage || busy} className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-700 transition-colors hover:border-[#B84A22] hover:text-[#B84A22]"><Edit2 size={14} />Edit</button>
      </div>
    </article>
  )
}
