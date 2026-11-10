import { useState } from 'react'
import {
  Edit2,
  Flame,
  Plus,
  Search,
  Star,
  ToggleLeft,
  ToggleRight,
  X,
} from 'lucide-react'
import type { MenuItem } from '../../types/admin'

interface ProductsViewProps {
  items: MenuItem[]
  onToggleAvailability: (itemId: string) => void
  onAddDish?: (item: MenuItem) => void
  onUpdateDish?: (item: MenuItem) => void
}

export function ProductsView({
  items,
  onToggleAvailability,
  onAddDish,
  onUpdateDish,
}: ProductsViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingDish, setEditingDish] = useState<MenuItem | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Biryani')
  const [price, setPrice] = useState(15.0)
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('/figma-assets/dish-biryani.png')
  const [spicyLevel, setSpicyLevel] = useState<1 | 2 | 3 | undefined>(2)

  const categories = ['all', 'Biryani', 'Curries', 'Tandoor & Grills', 'Breads', 'Desserts']

  const filteredItems = items.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory
    const matchesSearch =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCat && matchesSearch
  })

  const openAddModal = () => {
    setName('')
    setCategory('Biryani')
    setPrice(16.5)
    setDescription('')
    setImageUrl('/figma-assets/dish-biryani.png')
    setSpicyLevel(2)
    setIsAddModalOpen(true)
  }

  const openEditModal = (dish: MenuItem) => {
    setEditingDish(dish)
    setName(dish.name)
    setCategory(dish.category)
    setPrice(dish.price)
    setDescription(dish.description)
    setImageUrl(dish.imageUrl)
    setSpicyLevel(dish.spicyLevel)
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const newDish: MenuItem = {
      id: `menu-${Date.now()}`,
      name: name.trim(),
      category,
      price: Number(price),
      description: description.trim(),
      imageUrl: imageUrl || '/figma-assets/dish-biryani.png',
      isAvailable: true,
      rating: 5.0,
      ordersCount: 0,
      spicyLevel,
    }

    if (onAddDish) {
      onAddDish(newDish)
    }
    setIsAddModalOpen(false)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDish || !name.trim()) return

    const updated: MenuItem = {
      ...editingDish,
      name: name.trim(),
      category,
      price: Number(price),
      description: description.trim(),
      imageUrl: imageUrl || editingDish.imageUrl,
      spicyLevel,
    }

    if (onUpdateDish) {
      onUpdateDish(updated)
    }
    setEditingDish(null)
  }

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
            onClick={openAddModal}
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

            {/* Availability Toggle and Edit Action */}
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
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

              <button
                type="button"
                onClick={() => openEditModal(dish)}
                className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 hover:border-[#B84A22] hover:text-[#B84A22] transition cursor-pointer"
                title="Edit Dish Details"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Dish Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsAddModalOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />

          <div className="relative z-10 w-full max-w-[480px] rounded-2xl bg-white border border-[#E7E5E4] shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F5F5F4]">
              <h3 className="font-sans text-base font-semibold text-[#1C1917]">
                Add New Dish
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-medium text-stone-700 block mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kashmiri Lamb Rogan Josh"
                  className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] p-2.5 text-stone-900 focus:border-[#B84A22] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-stone-700 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-white p-2.5 text-stone-900 focus:border-[#B84A22] focus:outline-none"
                  >
                    <option value="Biryani">Biryani</option>
                    <option value="Curries">Curries</option>
                    <option value="Tandoor & Grills">Tandoor & Grills</option>
                    <option value="Breads">Breads</option>
                    <option value="Desserts">Desserts</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-stone-700 block mb-1">Price (€)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] p-2.5 text-stone-900 focus:border-[#B84A22] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-stone-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description of ingredients & preparation..."
                  className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] p-2.5 text-stone-900 focus:border-[#B84A22] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-stone-700 block mb-1">Spicy Level</label>
                  <select
                    value={spicyLevel || 0}
                    onChange={(e) => setSpicyLevel(Number(e.target.value) as 1 | 2 | 3)}
                    className="w-full rounded-xl border border-stone-200 bg-white p-2.5 text-stone-900 focus:border-[#B84A22] focus:outline-none"
                  >
                    <option value={1}>Mild (Spice 1)</option>
                    <option value={2}>Medium (Spice 2)</option>
                    <option value={3}>Hot (Spice 3)</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-stone-700 block mb-1">Image Asset</label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] p-2.5 text-stone-900 focus:border-[#B84A22] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-stone-200 px-4 py-2 font-medium text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#B84A22] px-5 py-2 font-bold text-white shadow-xs hover:bg-[#9E3E1C] cursor-pointer"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Dish Modal */}
      {editingDish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setEditingDish(null)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />

          <div className="relative z-10 w-full max-w-[480px] rounded-2xl bg-white border border-[#E7E5E4] shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F5F5F4]">
              <h3 className="font-sans text-base font-semibold text-[#1C1917]">
                Edit Dish
              </h3>
              <button
                type="button"
                onClick={() => setEditingDish(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-medium text-stone-700 block mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] p-2.5 text-stone-900 focus:border-[#B84A22] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-stone-700 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-white p-2.5 text-stone-900 focus:border-[#B84A22] focus:outline-none"
                  >
                    <option value="Biryani">Biryani</option>
                    <option value="Curries">Curries</option>
                    <option value="Tandoor & Grills">Tandoor & Grills</option>
                    <option value="Breads">Breads</option>
                    <option value="Desserts">Desserts</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-stone-700 block mb-1">Price (€)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] p-2.5 text-stone-900 focus:border-[#B84A22] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-stone-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] p-2.5 text-stone-900 focus:border-[#B84A22] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-medium text-stone-700 block mb-1">Spicy Level</label>
                <select
                  value={spicyLevel || 0}
                  onChange={(e) => setSpicyLevel(Number(e.target.value) as 1 | 2 | 3)}
                  className="w-full rounded-xl border border-stone-200 bg-white p-2.5 text-stone-900 focus:border-[#B84A22] focus:outline-none"
                >
                  <option value={1}>Mild (Spice 1)</option>
                  <option value={2}>Medium (Spice 2)</option>
                  <option value={3}>Hot (Spice 3)</option>
                </select>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingDish(null)}
                  className="rounded-xl border border-stone-200 px-4 py-2 font-medium text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#B84A22] px-5 py-2 font-bold text-white shadow-xs hover:bg-[#9E3E1C] cursor-pointer"
                >
                  Update Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
