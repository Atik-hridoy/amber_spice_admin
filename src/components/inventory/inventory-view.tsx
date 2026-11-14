import { useEffect, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Package,
  PackagePlus,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import type { InventoryItem, WastageRecord } from '../../types/admin'
import type { InventoryCategory } from '../../types/inventory-category'
import { inventoryCategoryService } from '../../services/inventory-category-service'
import { inventoryService, type InventoryItemPayload } from '../../services/inventory-service'
import { AdminApiError } from '../../services/api-error'
import { InventoryCategoriesTab } from './inventory-categories-tab'

interface InventoryViewProps {
  inventory?: InventoryItem[]
  onRestockItem?: (itemId: string, addAmount: number) => void
  onLogWastage?: (record: WastageRecord) => void
}

const COMMON_UNITS = ['kg', 'ltr', 'bags', 'packs', 'bottles', 'cans', 'boxes', 'grams', 'bunches']

export function InventoryView({ inventory: initialInventory, onRestockItem, onLogWastage }: InventoryViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'items' | 'categories'>('items')
  const [items, setItems] = useState<InventoryItem[]>(initialInventory || [])
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [isLoadingItems, setIsLoadingItems] = useState(true)
  const [itemsError, setItemsError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Item Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null)
  const [restockingItem, setRestockingItem] = useState<InventoryItem | null>(null)
  const [restockAmount, setRestockAmount] = useState<number>(20)

  // Wastage Modal
  const [isWastageModalOpen, setIsWastageModalOpen] = useState(false)
  const [selectedIngredientId, setSelectedIngredientId] = useState(items[0]?.id ? String(items[0].id) : '')
  const [wasteQuantity, setWasteQuantity] = useState(1.0)
  const [wasteReason, setWasteReason] = useState<'Expired' | 'Damaged in transit' | 'Kitchen prep error' | 'Storage defect / Spoilage'>('Kitchen prep error')
  const [wasteReporter, setWasteReporter] = useState('Master Chef Tariqul')

  // Form States for Add/Edit
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formCurrentStock, setFormCurrentStock] = useState<string>('10')
  const [formMinimumStock, setFormMinimumStock] = useState<string>('5')
  const [formUnit, setFormUnit] = useState<string>('kg')
  const [formSupplier, setFormSupplier] = useState<string>('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load items and categories from real backend API
  const loadInventoryData = async () => {
    setIsLoadingItems(true)
    setItemsError(null)
    try {
      const [fetchedItems, fetchedCategories] = await Promise.all([
        inventoryService.list().catch(() => initialInventory || []),
        inventoryCategoryService.list().catch(() => []),
      ])
      setItems(fetchedItems)
      setCategories(fetchedCategories)
      if (fetchedItems.length > 0 && !selectedIngredientId) {
        setSelectedIngredientId(String(fetchedItems[0].id))
      }
    } catch (err) {
      const msg = err instanceof AdminApiError ? err.message : 'Failed to load inventory stock.'
      setItemsError(msg)
    } finally {
      setIsLoadingItems(false)
    }
  }

  useEffect(() => {
    loadInventoryData()
  }, [])

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setFormName('')
    setFormCategory(categories[0]?.name || 'Pantry')
    setFormCurrentStock('10')
    setFormMinimumStock('5')
    setFormUnit('kg')
    setFormSupplier('')
    setFormError(null)
    setIsAddModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item)
    setFormName(item.name)
    setFormCategory(item.category)
    setFormCurrentStock(String(item.currentStock))
    setFormMinimumStock(String(item.minimumStock))
    setFormUnit(item.unit || 'kg')
    setFormSupplier(item.supplier || '')
    setFormError(null)
  }

  // Submit Create Item
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = formName.trim()
    if (!trimmedName) {
      setFormError('Ingredient name is required.')
      return
    }

    const currentStockNum = parseFloat(formCurrentStock)
    const minimumStockNum = parseFloat(formMinimumStock)
    if (isNaN(currentStockNum) || currentStockNum < 0) {
      setFormError('Current stock must be a non-negative number.')
      return
    }
    if (isNaN(minimumStockNum) || minimumStockNum < 0) {
      setFormError('Minimum safety stock must be a non-negative number.')
      return
    }

    setIsSubmitting(true)
    setFormError(null)
    try {
      const payload: InventoryItemPayload = {
        name: trimmedName,
        category: formCategory || 'Pantry',
        currentStock: currentStockNum,
        minimumStock: minimumStockNum,
        unit: formUnit || 'kg',
        supplier: formSupplier.trim(),
      }
      const newItem = await inventoryService.create(payload)
      setItems((prev) => [newItem, ...prev])
      setIsAddModalOpen(false)
    } catch (err) {
      if (err instanceof AdminApiError) {
        setFormError(err.message)
      } else {
        setFormError('Failed to create ingredient. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit Update Item
  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    const trimmedName = formName.trim()
    if (!trimmedName) {
      setFormError('Ingredient name is required.')
      return
    }

    const currentStockNum = parseFloat(formCurrentStock)
    const minimumStockNum = parseFloat(formMinimumStock)
    if (isNaN(currentStockNum) || currentStockNum < 0) {
      setFormError('Current stock must be a non-negative number.')
      return
    }
    if (isNaN(minimumStockNum) || minimumStockNum < 0) {
      setFormError('Minimum safety stock must be a non-negative number.')
      return
    }

    setIsSubmitting(true)
    setFormError(null)
    try {
      const payload: Partial<InventoryItemPayload> = {
        name: trimmedName,
        category: formCategory || editingItem.category,
        currentStock: currentStockNum,
        minimumStock: minimumStockNum,
        unit: formUnit || editingItem.unit,
        supplier: formSupplier.trim(),
      }
      const updated = await inventoryService.update(editingItem.id, payload)
      setItems((prev) => prev.map((item) => (String(item.id) === String(updated.id) ? updated : item)))
      setEditingItem(null)
    } catch (err) {
      if (err instanceof AdminApiError) {
        setFormError(err.message)
      } else {
        setFormError('Failed to update ingredient.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit Delete Item
  const handleDeleteItem = async () => {
    if (!deletingItem) return
    setIsSubmitting(true)
    try {
      await inventoryService.delete(deletingItem.id)
      setItems((prev) => prev.filter((item) => String(item.id) !== String(deletingItem.id)))
      setDeletingItem(null)
    } catch (err) {
      const msg = err instanceof AdminApiError ? err.message : 'Failed to delete ingredient.'
      alert(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Quick Restock Item
  const handleQuickRestock = async (item: InventoryItem, amount: number) => {
    try {
      const updated = await inventoryService.restock(item.id, amount)
      setItems((prev) => prev.map((i) => (String(i.id) === String(updated.id) ? updated : i)))
      onRestockItem?.(String(item.id), amount)
    } catch (err) {
      const msg = err instanceof AdminApiError ? err.message : 'Could not restock ingredient.'
      alert(msg)
    }
  }

  // Custom Restock Modal Submit
  const handleCustomRestock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restockingItem || restockAmount <= 0) return
    setIsSubmitting(true)
    try {
      const updated = await inventoryService.restock(restockingItem.id, restockAmount)
      setItems((prev) => prev.map((i) => (String(i.id) === String(updated.id) ? updated : i)))
      onRestockItem?.(String(restockingItem.id), restockAmount)
      setRestockingItem(null)
    } catch (err) {
      const msg = err instanceof AdminApiError ? err.message : 'Failed to restock ingredient.'
      alert(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Dynamic Category Pills
  const categoryOptions = [
    'all',
    ...Array.from(new Set([
      ...categories.filter((c) => c.is_active).map((c) => c.name),
      ...items.map((item) => item.category),
    ])),
  ]

  const filteredInventory = items.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    const matchesSearch =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.supplier && item.supplier.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesCategory && matchesSearch
  })

  const lowStockItems = items.filter((i) => i.status !== 'optimal')

  return (
    <div className="space-y-6">
      {/* Sub-Tab Navigation Header */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('items')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'items'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Stock & Ingredients</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                activeSubTab === 'items' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
              }`}
            >
              {items.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('categories')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'categories'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            <Boxes className="h-4 w-4" />
            <span>Categories</span>
            {categories.length > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  activeSubTab === 'categories' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                {categories.length}
              </span>
            )}
          </button>
        </div>

        {activeSubTab === 'items' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadInventoryData}
              title="Refresh inventory"
              disabled={isLoadingItems}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900 transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingItems ? 'animate-spin text-[#B84A22]' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 rounded-xl bg-[#B84A22] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#9B3D1B] transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Ingredient</span>
            </button>
          </div>
        )}
      </div>

      {/* CATEGORIES SUB-TAB VIEW */}
      {activeSubTab === 'categories' ? (
        <InventoryCategoriesTab onCategoriesUpdated={setCategories} />
      ) : (
        /* ITEMS SUB-TAB VIEW */
        <div className="space-y-6">
          {/* Error Banner */}
          {itemsError && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{itemsError}</span>
              </div>
              <button
                type="button"
                onClick={loadInventoryData}
                className="font-bold underline hover:text-red-900 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

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
                    {lowStockItems.slice(0, 3).map((i) => i.name).join(', ')}
                    {lowStockItems.length > 3 ? ` and ${lowStockItems.length - 3} more` : ''} are nearing or below minimum thresholds.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  lowStockItems.forEach((item) => handleQuickRestock(item, 25))
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
              {categoryOptions.map((cat) => (
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
              ))}

              <button
                type="button"
                onClick={() => setIsWastageModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:border-red-300 hover:text-red-600 transition cursor-pointer shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Log Wastage</span>
              </button>
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
                  {isLoadingItems && items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-stone-400">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-[#B84A22]" />
                        <span>Loading ingredients from kitchen stock...</span>
                      </td>
                    </tr>
                  ) : filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-stone-400">
                        <Package className="h-6 w-6 mx-auto mb-2 opacity-40" />
                        <p className="font-semibold text-stone-700">No ingredients found</p>
                        <p className="text-[11px] mt-0.5">Click "Add Ingredient" to add items to your stock inventory.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map((item) => {
                      const currentVal = Number(item.currentStock) || 0
                      const minVal = Number(item.minimumStock) || 1
                      const percent = Math.min(100, Math.round((currentVal / (minVal * 2)) * 100))

                      return (
                        <tr key={item.id} className="hover:bg-stone-50/70 transition">
                          <td className="px-5 py-4 font-semibold text-stone-900">
                            {item.name}
                            <span className="block text-[10px] font-normal text-stone-400">
                              {item.lastRestocked ? `Restocked ${new Date(item.lastRestocked).toLocaleDateString()}` : 'In Stock'}
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
                              <span className="truncate max-w-[160px]">{item.supplier || 'Standard Supplier'}</span>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <button
                                type="button"
                                onClick={() => handleQuickRestock(item, 20)}
                                className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 shadow-2xs hover:border-[#B84A22] hover:text-[#B84A22] active:scale-95 transition cursor-pointer"
                                title="Quick restock +20"
                              >
                                <PackagePlus className="h-3 w-3" />
                                <span>+20 {item.unit}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setRestockingItem(item)
                                  setRestockAmount(10)
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:border-amber-400 hover:text-amber-700 transition cursor-pointer"
                                title="Custom Restock Amount"
                              >
                                <Plus className="h-3 w-3" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(item)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:border-[#B84A22] hover:text-[#B84A22] transition cursor-pointer"
                                title="Edit ingredient"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeletingItem(item)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:border-red-300 hover:text-red-600 transition cursor-pointer"
                                title="Delete ingredient"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ADD INGREDIENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-[#B84A22]" />
                <h3 className="text-sm font-bold text-stone-900">Add New Ingredient / Stock Item</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="mt-4 space-y-4">
              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Ingredient Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Basmati Rice, Chicken Breast, Saffron"
                  className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] px-3.5 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#B84A22] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] px-3 py-2.5 text-xs text-stone-900 focus:border-[#B84A22] focus:bg-white focus:outline-none"
                  >
                    {categories.length > 0 ? (
                      categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Meat & Poultry">Meat & Poultry</option>
                        <option value="Spices & Seasoning">Spices & Seasoning</option>
                        <option value="Dairy">Dairy</option>
                        <option value="Produce">Produce</option>
                        <option value="Pantry">Pantry</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Measurement Unit</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] px-3 py-2.5 text-xs text-stone-900 focus:border-[#B84A22] focus:bg-white focus:outline-none"
                  >
                    {COMMON_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Current Stock <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formCurrentStock}
                    onChange={(e) => setFormCurrentStock(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] px-3.5 py-2.5 text-xs text-stone-900 focus:border-[#B84A22] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Safety Minimum Stock <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formMinimumStock}
                    onChange={(e) => setFormMinimumStock(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] px-3.5 py-2.5 text-xs text-stone-900 focus:border-[#B84A22] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Supplier (Optional)</label>
                <input
                  type="text"
                  value={formSupplier}
                  onChange={(e) => setFormSupplier(e.target.value)}
                  placeholder="e.g. Dublin Wholesalers, Himalayan Mills"
                  className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] px-3.5 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#B84A22] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 border-t border-stone-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl bg-[#B84A22] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#9B3D1B] transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Add Ingredient</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT INGREDIENT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-[#B84A22]" />
                <h3 className="text-sm font-bold text-stone-900">Edit Ingredient: {editingItem.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateItem} className="mt-4 space-y-4">
              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Ingredient Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] px-3.5 py-2.5 text-xs text-stone-900 focus:border-[#B84A22] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] px-3 py-2.5 text-xs text-stone-900 focus:border-[#B84A22] focus:bg-white focus:outline-none"
                  >
                    {categories.length > 0 ? (
                      categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Meat & Poultry">Meat & Poultry</option>
                        <option value="Spices & Seasoning">Spices & Seasoning</option>
                        <option value="Dairy">Dairy</option>
                        <option value="Produce">Produce</option>
                        <option value="Pantry">Pantry</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Measurement Unit</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] px-3 py-2.5 text-xs text-stone-900 focus:border-[#B84A22] focus:bg-white focus:outline-none"
                  >
                    {COMMON_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Current Stock <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formCurrentStock}
                    onChange={(e) => setFormCurrentStock(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] px-3.5 py-2.5 text-xs text-stone-900 focus:border-[#B84A22] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Safety Minimum Stock <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formMinimumStock}
                    onChange={(e) => setFormMinimumStock(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] px-3.5 py-2.5 text-xs text-stone-900 focus:border-[#B84A22] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Supplier (Optional)</label>
                <input
                  type="text"
                  value={formSupplier}
                  onChange={(e) => setFormSupplier(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] px-3.5 py-2.5 text-xs text-stone-900 focus:border-[#B84A22] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 border-t border-stone-100 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl bg-[#B84A22] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#9B3D1B] transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Update Ingredient</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE INGREDIENT MODAL */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">Delete Ingredient?</h3>
                <p className="text-xs text-stone-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="mt-4 text-xs text-stone-600 leading-relaxed">
              Are you sure you want to remove <strong className="text-stone-900">"{deletingItem.name}"</strong> from inventory?
              Current recorded stock of {deletingItem.currentStock} {deletingItem.unit} will be removed.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-stone-100 pt-3">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteItem}
                className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-red-700 transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM RESTOCK MODAL */}
      {restockingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <PackagePlus className="h-5 w-5 text-amber-600" />
                <h3 className="text-sm font-bold text-stone-900">Restock: {restockingItem.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setRestockingItem(null)}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCustomRestock} className="mt-4 space-y-4">
              <div className="rounded-xl bg-amber-50 p-3 border border-amber-200 text-xs text-amber-900">
                <p>Current stock: <strong>{restockingItem.currentStock} {restockingItem.unit}</strong></p>
                <p>Safety minimum: <strong>{restockingItem.minimumStock} {restockingItem.unit}</strong></p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Amount to Add ({restockingItem.unit})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] px-3.5 py-2.5 text-xs text-stone-900 focus:border-[#B84A22] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5">
                {[5, 10, 25, 50].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRestockAmount(preset)}
                    className="flex-1 rounded-lg border border-stone-200 bg-white py-1 text-[11px] font-semibold text-stone-600 hover:border-amber-400 hover:text-amber-800 cursor-pointer"
                  >
                    +{preset}
                  </button>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 border-t border-stone-100 pt-3">
                <button
                  type="button"
                  onClick={() => setRestockingItem(null)}
                  className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || restockAmount <= 0}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <PackagePlus className="h-3.5 w-3.5" />
                      <span>Confirm Restock</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WASTAGE LOG MODAL */}
      {isWastageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                <h3 className="text-sm font-bold text-stone-900">Record Kitchen Ingredient Wastage</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWastageModalOpen(false)}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                const ingredient = items.find((i) => String(i.id) === selectedIngredientId)
                if (ingredient) {
                  onLogWastage?.({
                    id: `WST-${Date.now().toString().slice(-4)}`,
                    ingredientId: String(ingredient.id),
                    ingredientName: ingredient.name,
                    quantity: wasteQuantity,
                    unit: ingredient.unit,
                    reason: wasteReason,
                    reportedBy: wasteReporter,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  })
                  setIsWastageModalOpen(false)
                }
              }}
              className="mt-4 space-y-4 text-xs"
            >
              <div>
                <label className="font-medium text-stone-700 block mb-1">Select Ingredient</label>
                <select
                  value={selectedIngredientId}
                  onChange={(e) => setSelectedIngredientId(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] p-2.5 text-stone-900 focus:outline-none"
                >
                  {items.map((i) => (
                    <option key={i.id} value={String(i.id)}>
                      {i.name} (Current: {i.currentStock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-stone-700 block mb-1">Wasted Quantity</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={wasteQuantity}
                    onChange={(e) => setWasteQuantity(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] p-2.5 text-stone-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-medium text-stone-700 block mb-1">Reason</label>
                  <select
                    value={wasteReason}
                    onChange={(e) =>
                      setWasteReason(e.target.value as 'Expired' | 'Damaged in transit' | 'Kitchen prep error' | 'Storage defect / Spoilage')
                    }
                    className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] p-2.5 text-stone-900 focus:outline-none"
                  >
                    <option value="Kitchen prep error">Kitchen prep error</option>
                    <option value="Expired">Expired</option>
                    <option value="Damaged in transit">Damaged in transit</option>
                    <option value="Storage defect / Spoilage">Storage defect / Spoilage</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-medium text-stone-700 block mb-1">Reported by</label>
                <input
                  type="text"
                  value={wasteReporter}
                  onChange={(e) => setWasteReporter(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] p-2.5 text-stone-900 focus:outline-none"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsWastageModalOpen(false)}
                  className="rounded-xl border border-stone-200 px-4 py-2 font-medium text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-red-600 px-5 py-2 font-bold text-white shadow-xs hover:bg-red-700 cursor-pointer"
                >
                  Record & Deduct
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
