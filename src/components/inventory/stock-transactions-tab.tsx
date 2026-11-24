import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  History,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  TrendingDown,
  X,
} from 'lucide-react'
import type { InventoryItem } from '../../types/admin'
import type { InventoryValuationSummary, StockTransaction } from '../../types/recipe'
import { recipeService } from '../../services/recipe-service'
import { AdminApiError } from '../../services/api-error'

interface StockTransactionsTabProps {
  inventoryItems: InventoryItem[]
  onReloadInventory: () => void
}

export function StockTransactionsTab({ inventoryItems, onReloadInventory }: StockTransactionsTabProps) {
  const [transactions, setTransactions] = useState<StockTransaction[]>([])
  const [valuation, setValuation] = useState<InventoryValuationSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')

  // Manual Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [adjustItemId, setAdjustItemId] = useState<string>(inventoryItems[0]?.id ? String(inventoryItems[0].id) : '')
  const [adjustType, setAdjustType] = useState<'PURCHASE' | 'ADJUSTMENT' | 'WASTAGE'>('PURCHASE')
  const [adjustDelta, setAdjustDelta] = useState<string>('10')
  const [adjustUnitCost, setAdjustUnitCost] = useState<string>('')
  const [adjustNotes, setAdjustNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [txList, valSummary] = await Promise.all([
        recipeService.listTransactions(),
        recipeService.getValuationSummary(),
      ])
      setTransactions(txList)
      setValuation(valSummary)
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Failed to load stock transactions.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredTransactions = transactions.filter((tx) => {
    const matchesType = selectedType === 'all' || tx.transactionType === selectedType
    const matchesSearch =
      !searchQuery.trim() ||
      tx.itemName.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      (tx.notes && tx.notes.toLowerCase().includes(searchQuery.toLowerCase().trim())) ||
      (tx.orderNumber && tx.orderNumber.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    return matchesType && matchesSearch
  })

  const openAdjustModal = () => {
    setAdjustItemId(inventoryItems[0]?.id ? String(inventoryItems[0].id) : '')
    setAdjustType('PURCHASE')
    setAdjustDelta('10')
    const firstItem = inventoryItems[0]
    setAdjustUnitCost(firstItem?.costPerUnit ? String(firstItem.costPerUnit) : '')
    setAdjustNotes('')
    setModalError(null)
    setIsAdjustModalOpen(true)
  }

  const handleAdjustItemChange = (itemId: string) => {
    setAdjustItemId(itemId)
    const item = inventoryItems.find((i) => String(i.id) === itemId)
    if (item && item.costPerUnit) {
      setAdjustUnitCost(String(item.costPerUnit))
    }
  }

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault()
    const delta = parseFloat(adjustDelta)
    if (isNaN(delta) || delta === 0) {
      setModalError('Quantity delta must not be zero.')
      return
    }

    setIsSubmitting(true)
    setModalError(null)
    try {
      const unitCostVal = adjustUnitCost ? parseFloat(adjustUnitCost) : undefined
      await recipeService.adjustStock({
        item: parseInt(adjustItemId, 10),
        transactionType: adjustType,
        quantityDelta: adjustType === 'WASTAGE' && delta > 0 ? -delta : delta,
        unitCost: unitCostVal,
        notes: adjustNotes.trim(),
      })
      setIsAdjustModalOpen(false)
      await loadData()
      onReloadInventory()
    } catch (err: any) {
      setModalError(err?.message || 'Failed to submit stock adjustment.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTransactionTypeBadge = (type: StockTransaction['transactionType']) => {
    switch (type) {
      case 'PURCHASE':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <ArrowUpRight size={12} /> Purchase / Restock
          </span>
        )
      case 'CONSUMPTION':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">
            <ArrowDownRight size={12} /> Order Depletion
          </span>
        )
      case 'WASTAGE':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
            <TrendingDown size={12} /> Wastage / Spoilage
          </span>
        )
      case 'ADJUSTMENT':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
            <SlidersHorizontal size={12} /> Adjustment
          </span>
        )
      default:
        return <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">{type}</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* Financial Valuation KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Total Stock Value</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-[#8D070D]">
              <DollarSign size={18} />
            </div>
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-stone-900">
            €{Number(valuation?.totalInventoryValuation || 0).toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-stone-500">Live inventory asset valuation</p>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">30-Day COGS (Food Cost)</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
              <ArrowDownRight size={18} />
            </div>
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-stone-900">
            €{Number(valuation?.totalConsumption30Days || 0).toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-stone-500">Auto-depleted via customer orders</p>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">30-Day Spoilage Cost</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
              <TrendingDown size={18} />
            </div>
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-stone-900">
            €{Number(valuation?.totalWastage30Days || 0).toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-stone-500">Recorded wastage & kitchen losses</p>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Items Needing Restock</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <AlertTriangle size={18} />
            </div>
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-stone-900">
            {valuation?.lowStockCount ?? 0}
          </p>
          <p className="mt-1 text-xs text-stone-500">Current stock below minimum threshold</p>
        </div>
      </div>

      {/* Action Controls & Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input
              type="text"
              placeholder="Search by ingredient, order #, or audit notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-stone-200/80 bg-white py-2.5 pl-10 pr-4 text-sm text-stone-900 placeholder-stone-400 focus:border-[#8D070D] focus:outline-none"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-xl border border-stone-200/80 bg-white px-3.5 py-2.5 text-sm font-medium text-stone-700 focus:border-[#8D070D] focus:outline-none"
          >
            <option value="all">All Movements</option>
            <option value="CONSUMPTION">Order Depletions</option>
            <option value="PURCHASE">Purchases / Restocks</option>
            <option value="WASTAGE">Wastage / Spoilage</option>
            <option value="ADJUSTMENT">Manual Adjustments</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openAdjustModal}
            className="flex items-center gap-2 rounded-xl bg-[#8D070D] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#720304]"
          >
            <Plus size={16} /> New Stock Adjustment
          </button>
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-xl border border-stone-200/80 bg-white px-3.5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadData} className="font-semibold underline">Retry</button>
        </div>
      )}

      {/* Transaction Log Table */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="animate-spin text-stone-400" size={32} />
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="rounded-2xl border border-stone-200/80 bg-white p-12 text-center">
          <History className="mx-auto text-stone-300" size={48} />
          <h3 className="mt-3 font-serif text-lg font-bold text-stone-900">No stock movements recorded</h3>
          <p className="mt-1 text-sm text-stone-500">
            Every customer order and restock will appear here automatically with before and after stock levels.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stone-100 bg-stone-50 font-semibold text-stone-500">
                <tr>
                  <th className="py-3 pl-4 pr-3">Date / Time</th>
                  <th className="py-3 px-3">Ingredient</th>
                  <th className="py-3 px-3">Movement Type</th>
                  <th className="py-3 px-3">Quantity Delta</th>
                  <th className="py-3 px-3">Unit Cost</th>
                  <th className="py-3 px-3">Financial Impact</th>
                  <th className="py-3 px-3">Balance After</th>
                  <th className="py-3 px-3">Order / Reference</th>
                  <th className="py-3 pl-3 pr-4">Logged By / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                {filteredTransactions.map((tx) => {
                  const delta = parseFloat(tx.quantityDelta)
                  const isPositive = delta > 0
                  const dateStr = new Date(tx.createdAt).toLocaleString('en-IE', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })

                  return (
                    <tr key={tx.id} className="hover:bg-stone-50/80 transition">
                      <td className="py-3 pl-4 pr-3 text-stone-500 whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-3 px-3 font-semibold text-stone-900">
                        {tx.itemName}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getTransactionTypeBadge(tx.transactionType)}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span className={isPositive ? 'text-emerald-700 font-bold' : 'text-stone-800'}>
                          {isPositive ? `+${delta.toFixed(3)}` : delta.toFixed(3)} {tx.itemUnit}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-stone-500">
                        €{Number(tx.unitCost || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-stone-900">
                        €{Number(tx.totalCost || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-stone-600">
                        {Number(tx.balanceAfter).toFixed(2)} {tx.itemUnit}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs">
                        {tx.orderNumber ? (
                          <span className="rounded bg-stone-100 px-1.5 py-0.5 text-stone-800 font-semibold">
                            #{tx.orderNumber}
                          </span>
                        ) : (
                          <span className="text-stone-400">-</span>
                        )}
                      </td>
                      <td className="py-3 pl-3 pr-4 text-stone-500 max-w-xs truncate">
                        <span className="text-stone-700 font-semibold">{tx.createdByName || 'System'}: </span>
                        <span>{tx.notes || 'Automated entry'}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Stock Adjustment Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">Manual Stock Adjustment</h3>
                <p className="text-xs text-stone-500">Record incoming purchases, audit counts, or write-offs</p>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
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

            <form onSubmit={handleSaveAdjustment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Select Ingredient</label>
                <select
                  value={adjustItemId}
                  onChange={(e) => handleAdjustItemChange(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm text-stone-900 focus:border-[#8D070D] focus:outline-none"
                  required
                >
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Current: {item.currentStock} {item.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Adjustment Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('PURCHASE')}
                    className={`rounded-xl border py-2 text-xs font-semibold transition ${
                      adjustType === 'PURCHASE'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    + Purchase
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('ADJUSTMENT')}
                    className={`rounded-xl border py-2 text-xs font-semibold transition ${
                      adjustType === 'ADJUSTMENT'
                        ? 'border-blue-600 bg-blue-50 text-blue-800'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    Audit Count
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('WASTAGE')}
                    className={`rounded-xl border py-2 text-xs font-semibold transition ${
                      adjustType === 'WASTAGE'
                        ? 'border-rose-600 bg-rose-50 text-rose-800'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    - Wastage
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {adjustType === 'PURCHASE' ? 'Quantity to Add' : 'Quantity (+ or -)'}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={adjustDelta}
                    onChange={(e) => setAdjustDelta(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm text-stone-900 focus:border-[#8D070D] focus:outline-none"
                    placeholder="10.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Unit Cost (€)</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={adjustUnitCost}
                    onChange={(e) => setAdjustUnitCost(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm text-stone-900 focus:border-[#8D070D] focus:outline-none"
                    placeholder="e.g. 8.50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Audit Note / Supplier Invoice</label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm text-stone-900 focus:border-[#8D070D] focus:outline-none"
                  placeholder="e.g. Morning farm delivery Inv #892"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-[#8D070D] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#720304] disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Record Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
