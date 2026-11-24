import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChefHat,
  ChevronDown,
  ChevronUp,
  Percent,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import type { DishCostSummary } from '../../types/recipe'
import type { InventoryItem } from '../../types/admin'
import { recipeService } from '../../services/recipe-service'
import { AdminApiError } from '../../services/api-error'

interface DishRecipesTabProps {
  inventoryItems: InventoryItem[]
  onReloadInventory: () => void
}

export function DishRecipesTab({ inventoryItems, onReloadInventory }: DishRecipesTabProps) {
  const [summaries, setSummaries] = useState<DishCostSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedDishId, setExpandedDishId] = useState<number | null>(null)

  // Add/Edit Ingredient to Recipe Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [targetDish, setTargetDish] = useState<DishCostSummary | null>(null)
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>('')
  const [recipeQuantity, setRecipeQuantity] = useState<string>('0.200')
  const [recipeUnit, setRecipeUnit] = useState<string>('kg')
  const [recipeNotes, setRecipeNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Load recipe cost summaries
  const loadSummaries = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await recipeService.getCostSummaries()
      setSummaries(data)
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Failed to load dish recipe BOM costing.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSummaries()
  }, [])

  // Categories list derived from dishes
  const categories = Array.from(new Set(summaries.map((s) => s.dishCategory).filter(Boolean)))

  const filteredDishes = summaries.filter((d) => {
    const matchesCategory = selectedCategory === 'all' || d.dishCategory === selectedCategory
    const matchesSearch = !searchQuery.trim() || d.dishName.toLowerCase().includes(searchQuery.toLowerCase().trim())
    return matchesCategory && matchesSearch
  })

  const openAddIngredientModal = (dish: DishCostSummary) => {
    setTargetDish(dish)
    setSelectedIngredientId(inventoryItems[0]?.id ? String(inventoryItems[0].id) : '')
    setRecipeQuantity('0.250')
    setRecipeUnit(inventoryItems[0]?.unit || 'kg')
    setRecipeNotes('')
    setModalError(null)
    setIsModalOpen(true)
  }

  const handleIngredientChange = (ingId: string) => {
    setSelectedIngredientId(ingId)
    const ing = inventoryItems.find((i) => String(i.id) === ingId)
    if (ing) {
      setRecipeUnit(ing.unit)
    }
  }

  const handleSaveRecipeItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetDish || !selectedIngredientId) return

    const qty = parseFloat(recipeQuantity)
    if (isNaN(qty) || qty <= 0) {
      setModalError('Quantity must be greater than zero.')
      return
    }

    setIsSubmitting(true)
    setModalError(null)
    try {
      await recipeService.createRecipeItem({
        dish: targetDish.dishId,
        ingredient: parseInt(selectedIngredientId, 10),
        quantity: qty,
        unit: recipeUnit,
        notes: recipeNotes.trim(),
      })
      setIsModalOpen(false)
      await loadSummaries()
      onReloadInventory()
    } catch (err: any) {
      setModalError(err?.message || 'Failed to add ingredient to recipe. It may already be in the recipe.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteRecipeItem = async (itemId: number) => {
    if (!confirm('Are you sure you want to remove this ingredient from the dish recipe?')) return
    try {
      await recipeService.deleteRecipeItem(itemId)
      await loadSummaries()
      onReloadInventory()
    } catch (err: any) {
      alert(err?.message || 'Failed to delete recipe item.')
    }
  }

  // Cost status styling helper
  const getCostPercentBadge = (pct: number) => {
    if (pct === 0) {
      return <span className="inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">No Recipe</span>
    }
    if (pct < 28) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={12} /> {pct.toFixed(1)}% Optimal
        </span>
      )
    }
    if (pct <= 35) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
          <Percent size={12} /> {pct.toFixed(1)}% Standard
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
        <AlertTriangle size={12} /> {pct.toFixed(1)}% High Cost
      </span>
    )
  }

  const selectedIngObj = inventoryItems.find((i) => String(i.id) === selectedIngredientId)
  const previewCost = selectedIngObj
    ? (parseFloat(recipeQuantity || '0') * (selectedIngObj.costPerUnit || 0)).toFixed(2)
    : '0.00'

  return (
    <div className="space-y-6">
      {/* Search and Filters Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input
              type="text"
              placeholder="Search dish recipes & Bill of Materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-stone-200/80 bg-white py-2.5 pl-10 pr-4 text-sm text-stone-900 placeholder-stone-400 focus:border-[#8D070D] focus:outline-none focus:ring-1 focus:ring-[#8D070D]"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-stone-200/80 bg-white px-3.5 py-2.5 text-sm font-medium text-stone-700 focus:border-[#8D070D] focus:outline-none"
          >
            <option value="all">All Categories ({summaries.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={loadSummaries}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl border border-stone-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadSummaries} className="font-semibold underline">Retry</button>
        </div>
      )}

      {/* Dishes Recipe Accordion List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="animate-spin text-stone-400" size={32} />
        </div>
      ) : filteredDishes.length === 0 ? (
        <div className="rounded-2xl border border-stone-200/80 bg-white p-12 text-center">
          <BookOpen className="mx-auto text-stone-300" size={48} />
          <h3 className="mt-3 font-serif text-lg font-bold text-stone-900">No dish recipes found</h3>
          <p className="mt-1 text-sm text-stone-500">
            {searchQuery ? 'Try clearing your search query' : 'Your menu dishes are listed here with automated Bill of Materials.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDishes.map((dish) => {
            const isExpanded = expandedDishId === dish.dishId
            const foodCost = parseFloat(dish.totalFoodCost || '0')
            const price = parseFloat(dish.dishPrice || '0')
            const foodCostPct = parseFloat(dish.foodCostPercent || '0')
            const margin = parseFloat(dish.grossMarginPercent || '0')

            return (
              <div
                key={dish.dishId}
                className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm transition hover:border-[#8D070D]/40"
              >
                {/* Header row */}
                <div
                  onClick={() => setExpandedDishId(isExpanded ? null : dish.dishId)}
                  className="flex cursor-pointer flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-[#8D070D]">
                      <ChefHat size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif text-base font-bold text-stone-900">{dish.dishName}</h4>
                        <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-600">
                          {dish.dishCategory}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500">
                        {dish.recipeItems.length} recipe ingredients defined • Max {dish.maxPortionsAvailable} portions available with current stock
                      </p>
                    </div>
                  </div>

                  {/* Financial Metrics Strip */}
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <div className="text-right">
                      <span className="block text-[11px] font-medium uppercase tracking-wider text-stone-400">Selling Price</span>
                      <span className="font-mono text-sm font-bold text-stone-900">€{price.toFixed(2)}</span>
                    </div>

                    <div className="text-right">
                      <span className="block text-[11px] font-medium uppercase tracking-wider text-stone-400">Food Cost</span>
                      <span className="font-mono text-sm font-bold text-[#8D070D]">€{foodCost.toFixed(2)}</span>
                    </div>

                    <div className="text-right">
                      <span className="block text-[11px] font-medium uppercase tracking-wider text-stone-400">Food Cost %</span>
                      <div>{getCostPercentBadge(foodCostPct)}</div>
                    </div>

                    <div className="text-right">
                      <span className="block text-[11px] font-medium uppercase tracking-wider text-stone-400">Gross Margin</span>
                      <span className="font-mono text-sm font-bold text-emerald-700">
                        {margin > 0 ? `${margin.toFixed(1)}%` : '0%'}
                      </span>
                    </div>

                    <div className="text-stone-400">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Recipe Bill of Materials */}
                {isExpanded && (
                  <div className="border-t border-stone-100 bg-stone-50/50 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                        Recipe Ingredients (Bill of Materials)
                      </h5>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          openAddIngredientModal(dish)
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-[#8D070D] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#720304]"
                      >
                        <Plus size={14} /> Add Ingredient
                      </button>
                    </div>

                    {dish.recipeItems.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-stone-200 bg-white p-6 text-center text-xs text-stone-400">
                        No recipe ingredients linked yet. Click "Add Ingredient" to start tracking automatic stock depletion and food costs.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-stone-200/80 bg-white shadow-sm">
                        <table className="w-full text-left text-xs">
                          <thead className="border-b border-stone-100 bg-stone-50 font-semibold text-stone-500">
                            <tr>
                              <th className="py-2.5 pl-4 pr-3">Ingredient</th>
                              <th className="py-2.5 px-3">Portion Qty</th>
                              <th className="py-2.5 px-3">Unit Cost</th>
                              <th className="py-2.5 px-3">Cost / Portion</th>
                              <th className="py-2.5 px-3">Notes</th>
                              <th className="py-2.5 pl-3 pr-4 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                            {dish.recipeItems.map((item) => {
                              const itemCost = parseFloat(String(item.cost || '0'))
                              const unitCost = parseFloat(String(item.ingredientCostPerUnit || '0'))

                              return (
                                <tr key={item.id} className="hover:bg-stone-50/80">
                                  <td className="py-2.5 pl-4 pr-3 font-semibold text-stone-900">
                                    {item.ingredientName}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono">
                                    {item.quantity} {item.unit || item.ingredientUnit}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-stone-500">
                                    €{unitCost.toFixed(2)} / {item.unit || item.ingredientUnit}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono font-bold text-[#8D070D]">
                                    €{itemCost.toFixed(2)}
                                  </td>
                                  <td className="py-2.5 px-3 text-stone-400 max-w-xs truncate">
                                    {item.notes || '-'}
                                  </td>
                                  <td className="py-2.5 pl-3 pr-4 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteRecipeItem(item.id)}
                                      className="text-stone-400 hover:text-rose-600 transition p-1"
                                      title="Remove ingredient"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add Ingredient to Recipe Modal */}
      {isModalOpen && targetDish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">Add Recipe Ingredient</h3>
                <p className="text-xs text-stone-500">{targetDish.dishName}</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveRecipeItem} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Select Raw Ingredient</label>
                <select
                  value={selectedIngredientId}
                  onChange={(e) => handleIngredientChange(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm text-stone-900 focus:border-[#8D070D] focus:outline-none"
                  required
                >
                  {inventoryItems.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} ({ing.unit}) - Cost: €{Number(ing.costPerUnit || 0).toFixed(2)}/{ing.unit} (Stock: {ing.currentStock} {ing.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Portion Quantity</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={recipeQuantity}
                    onChange={(e) => setRecipeQuantity(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm text-stone-900 focus:border-[#8D070D] focus:outline-none"
                    placeholder="0.250"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={recipeUnit}
                    onChange={(e) => setRecipeUnit(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-sm text-stone-700 focus:border-[#8D070D] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Live Cost Preview */}
              <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3 flex items-center justify-between text-xs">
                <span className="font-medium text-amber-900">Estimated Cost per Portion:</span>
                <span className="font-mono text-sm font-bold text-[#8D070D]">€{previewCost}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Preparation Note (Optional)</label>
                <input
                  type="text"
                  value={recipeNotes}
                  onChange={(e) => setRecipeNotes(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm text-stone-900 focus:border-[#8D070D] focus:outline-none"
                  placeholder="e.g. Marinated boneless cut"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-[#8D070D] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#720304] disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Add to Recipe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
