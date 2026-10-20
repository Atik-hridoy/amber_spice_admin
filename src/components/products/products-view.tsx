import { useState } from 'react'
import {
  Flame,
  Plus,
  Search,
  Star,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import type { MenuItem } from '../../types/admin'

interface ProductsViewProps {
  items: MenuItem[]
  onToggleAvailability: (itemId: string) => void
}

export function ProductsView({ items, onToggleAvailability }: ProductsViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const categories = ['all', 'Biryani', 'Curries', 'Tandoor & Grills', 'Breads', 'Desserts']

  const filteredItems = items.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory
    const matchesSearch =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCat && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search menu dishes..."
            className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] py-2 pl-10 pr-4 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#B84A22] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => alert('New dish creation form opened!')}
            className="flex items-center gap-1.5 rounded-xl bg-[#B84A22] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#9E3E1C] transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Dish</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold shrink-0 transition cursor-pointer ${
              selectedCategory === cat
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {cat === 'all' ? 'All Dishes' : cat}
          </button>
        ))}
      </div>

      {/* Dishes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((dish) => (
          <div
            key={dish.id}
            className="flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-4 shadow-2xs hover:border-[#B84A22]/40 transition overflow-hidden"
          >
            <div>
              <div className="relative overflow-hidden rounded-xl bg-stone-100 h-40">
                <img
                  src={dish.imageUrl}
                  alt={dish.name}
                  className="h-full w-full object-cover"
                />
                <span className="absolute top-2.5 right-2.5 rounded-lg bg-stone-900/80 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white">
                  {dish.category}
                </span>
                {dish.spicyLevel && (
                  <span className="absolute top-2.5 left-2.5 flex items-center gap-0.5 rounded-lg bg-red-600/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white">
                    <Flame className="h-3 w-3" />
                    <span>Spice {dish.spicyLevel}</span>
                  </span>
                )}
              </div>

              <div className="mt-3">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-serif text-sm font-bold text-stone-900 line-clamp-1">
                    {dish.name}
                  </h4>
                  <span className="font-mono text-sm font-bold text-[#B84A22]">
                    €{dish.price.toFixed(2)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-stone-500 line-clamp-2">
                  {dish.description}
                </p>
              </div>

              <div className="mt-3 flex items-center gap-3 text-xs text-stone-500">
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span>{dish.rating}</span>
                </div>
                <span>&bull;</span>
                <span>{dish.ordersCount} Total Orders</span>
              </div>
            </div>

            {/* Availability Toggle */}
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-700">
                {dish.isAvailable ? 'In Stock (Live)' : 'Sold Out / Disabled'}
              </span>

              <button
                type="button"
                onClick={() => onToggleAvailability(dish.id)}
                className="cursor-pointer"
                title="Toggle Dish Availability"
              >
                {dish.isAvailable ? (
                  <ToggleRight className="h-7 w-7 text-emerald-600" />
                ) : (
                  <ToggleLeft className="h-7 w-7 text-stone-400" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
