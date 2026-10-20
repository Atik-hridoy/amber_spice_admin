import { useState } from 'react'
import {
  AlertTriangle,
  PackagePlus,
  Search,
  Truck,
} from 'lucide-react'
import type { InventoryItem } from '../../types/admin'

interface InventoryViewProps {
  inventory: InventoryItem[]
  onRestockItem: (itemId: string, addAmount: number) => void
}

export function InventoryView({ inventory, onRestockItem }: InventoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const filteredInventory = inventory.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    const matchesSearch =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCategory && matchesSearch
  })

  const lowStockItems = inventory.filter((i) => i.status !== 'optimal')

  return (
    <div className="space-y-6">
      {/* Stock Health Alerts Banner */}
      {lowStockItems.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold sm:text-sm">
                {lowStockItems.length} Ingredients Require Restocking
              </p>
              <p className="text-xs text-amber-700">
                Fresh cream, Kashmir Saffron, and Fresh Mint are nearing or below minimum kitchen safety thresholds.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              lowStockItems.forEach((item) => onRestockItem(item.id, 25))
              alert('Automated purchase orders sent to Dublin wholesalers!')
            }}
            className="shrink-0 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition cursor-pointer"
          >
            Reorder All Low Stock
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ingredients, spices, suppliers..."
            className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] py-2 pl-10 pr-4 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#B84A22] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {(['all', 'Meat & Poultry', 'Spices & Seasoning', 'Dairy', 'Produce', 'Pantry'] as const).map(
            (cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold shrink-0 transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                {cat === 'all' ? 'All Categories' : cat}
              </button>
            )
          )}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-stone-200 bg-stone-50 text-[11px] font-bold tracking-wider text-stone-500 uppercase">
              <tr>
                <th className="px-5 py-3.5">Ingredient Name</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Stock Level</th>
                <th className="px-5 py-3.5">Safety Min</th>
                <th className="px-5 py-3.5">Stock Status</th>
                <th className="px-5 py-3.5">Supplier</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredInventory.map((item) => {
                const percent = Math.min(100, Math.round((item.currentStock / (item.minimumStock * 2)) * 100))

                return (
                  <tr key={item.id} className="hover:bg-stone-50/70 transition">
                    <td className="px-5 py-4 font-semibold text-stone-900">
                      {item.name}
                      <span className="block text-[10px] font-normal text-stone-400">
                        Restocked {item.lastRestocked}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600">
                        {item.category}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">
                          {item.currentStock} {item.unit}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-24 rounded-full bg-stone-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.status === 'optimal'
                              ? 'bg-emerald-500'
                              : item.status === 'low'
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </td>

                    <td className="px-5 py-4 text-stone-500">
                      {item.minimumStock} {item.unit}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          item.status === 'optimal'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.status === 'low'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        <span className="h-1 w-1 rounded-full bg-current" />
                        {item.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-stone-600">
                      <div className="flex items-center gap-1.5">
                        <Truck className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                        <span className="truncate max-w-[160px]">{item.supplier}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => onRestockItem(item.id, 20)}
                        className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 shadow-2xs hover:border-[#B84A22] hover:text-[#B84A22] active:scale-95 transition cursor-pointer"
                      >
                        <PackagePlus className="h-3 w-3" />
                        <span>+20 {item.unit}</span>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
