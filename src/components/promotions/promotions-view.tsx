import { useState } from 'react'
import {
  Edit2,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from 'lucide-react'
import type { Promotion } from '../../types/admin'

interface PromotionsViewProps {
  promotions: Promotion[]
  onAddPromotion: (promo: Promotion) => void
  onUpdatePromotion: (promo: Promotion) => void
  onDeletePromotion: (id: string) => void
  onToggleStatus: (id: string) => void
}

export function PromotionsView({
  promotions,
  onAddPromotion,
  onUpdatePromotion,
  onDeletePromotion,
  onToggleStatus,
}: PromotionsViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null)

  // Form State
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [badge, setBadge] = useState('')
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [discountValue, setDiscountValue] = useState(10)
  const [minSpend, setMinSpend] = useState(25)
  const [usageLimit, setUsageLimit] = useState(500)
  const [validUntil, setValidUntil] = useState('2026-12-31')

  const filtered = promotions.filter(
    (p) =>
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const openCreateModal = () => {
    setEditingPromo(null)
    setCode('')
    setTitle('')
    setDescription('')
    setBadge('10% OFF')
    setDiscountType('percentage')
    setDiscountValue(10)
    setMinSpend(25)
    setUsageLimit(500)
    setValidUntil('2026-12-31')
    setIsModalOpen(true)
  }

  const openEditModal = (promo: Promotion) => {
    setEditingPromo(promo)
    setCode(promo.code)
    setTitle(promo.title)
    setDescription(promo.description)
    setBadge(promo.badge)
    setDiscountType(promo.discountType)
    setDiscountValue(promo.discountValue)
    setMinSpend(promo.minSpend)
    setUsageLimit(promo.usageLimit)
    setValidUntil(promo.validUntil)
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || !title.trim()) return

    if (editingPromo) {
      onUpdatePromotion({
        ...editingPromo,
        code: code.trim().toUpperCase(),
        title: title.trim(),
        description: description.trim(),
        badge: badge.trim() || `${discountValue}% OFF`,
        discountType,
        discountValue: Number(discountValue),
        minSpend: Number(minSpend),
        usageLimit: Number(usageLimit),
        validUntil,
      })
    } else {
      onAddPromotion({
        id: `promo-${Date.now()}`,
        code: code.trim().toUpperCase(),
        title: title.trim(),
        description: description.trim(),
        badge: badge.trim() || `${discountValue}% OFF`,
        discountType,
        discountValue: Number(discountValue),
        minSpend: Number(minSpend),
        usageLimit: Number(usageLimit),
        usageCount: 0,
        validUntil,
        isActive: true,
      })
    }
    setIsModalOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E7E5E4]/80 pb-3">
        <div>
          <h2 className="font-sans text-xl font-bold tracking-[-0.025em] text-[#1C1917]">
            Promotions & Discounts
          </h2>
          <p className="text-[11.5px] leading-[17.25px] text-[#78716C] mt-0.5">
            Manage active coupon vouchers, minimum spends and customer discount campaigns.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#F15A24] px-3.5 py-1.5 text-xs font-medium text-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04)] hover:brightness-105 active:scale-95 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Promotion</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search promo code or title..."
            className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] py-2 pl-10 pr-4 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#B84A22] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="text-xs text-stone-500 font-medium">
          Showing <strong className="font-bold text-stone-900">{filtered.length}</strong> campaigns
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-stone-200 bg-stone-50 text-[11px] font-bold tracking-wider text-stone-500 uppercase">
              <tr>
                <th className="px-5 py-3.5">Coupon Code</th>
                <th className="px-5 py-3.5">Campaign Title</th>
                <th className="px-5 py-3.5">Benefit</th>
                <th className="px-5 py-3.5">Min Spend</th>
                <th className="px-5 py-3.5">Usage</th>
                <th className="px-5 py-3.5">Valid Until</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((promo) => (
                <tr key={promo.id} className="hover:bg-stone-50/70 transition">
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs font-bold text-stone-900 bg-stone-100 px-2 py-1 rounded-md border border-stone-200">
                      {promo.code}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span className="font-semibold text-stone-900 block">{promo.title}</span>
                    <span className="text-[11px] text-stone-400 line-clamp-1">{promo.description}</span>
                  </td>

                  <td className="px-5 py-4 font-bold text-[#B84A22]">
                    {promo.discountType === 'percentage'
                      ? `${promo.discountValue}% OFF`
                      : `€${promo.discountValue.toFixed(2)} OFF`}
                  </td>

                  <td className="px-5 py-4 font-semibold text-stone-800">
                    €{promo.minSpend.toFixed(2)}
                  </td>

                  <td className="px-5 py-4 text-stone-600">
                    {promo.usageCount} / {promo.usageLimit}
                  </td>

                  <td className="px-5 py-4 text-stone-500 font-medium">
                    {promo.validUntil}
                  </td>

                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => onToggleStatus(promo.id)}
                      className="cursor-pointer"
                      title={promo.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {promo.isActive ? (
                        <ToggleRight className="h-6 w-6 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-stone-400" />
                      )}
                    </button>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(promo)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:border-[#B84A22] hover:text-[#B84A22] transition cursor-pointer"
                        title="Edit promotion"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeletePromotion(promo.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-400 hover:text-red-600 hover:border-red-200 transition cursor-pointer"
                        title="Delete promotion"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />

          <div className="relative z-10 w-full max-w-[480px] rounded-2xl bg-white border border-[#E7E5E4] shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F5F5F4]">
              <h3 className="font-sans text-base font-semibold text-[#1C1917]">
                {editingPromo ? 'Edit Promotion' : 'New Promotion Voucher'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-stone-700 block mb-1">Coupon Code</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. DUBLIN10"
                    className="w-full font-mono rounded-xl border border-stone-200 bg-[#FAF9F5] p-2.5 text-stone-900 focus:border-[#B84A22] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-medium text-stone-700 block mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="e.g. 10% OFF"
                    className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] p-2.5 text-stone-900 focus:border-[#B84A22] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-stone-700 block mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Dublin Welcome Discount"
                  className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] p-2.5 text-stone-900 focus:border-[#B84A22] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-medium text-stone-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Terms and conditions..."
                  className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] p-2.5 text-stone-900 focus:border-[#B84A22] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-stone-700 block mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full rounded-xl border border-stone-200 bg-white p-2.5 text-stone-900 focus:border-[#B84A22] focus:outline-none"
                  >
                    <option value="percentage">Percentage Off (%)</option>
                    <option value="fixed">Fixed Euro Amount (€)</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-stone-700 block mb-1">
                    Value {discountType === 'percentage' ? '(%)' : '(€)'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] p-2.5 text-stone-900 focus:border-[#B84A22] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-stone-700 block mb-1">Min Spend (€)</label>
                  <input
                    type="number"
                    min="0"
                    value={minSpend}
                    onChange={(e) => setMinSpend(Number(e.target.value))}
                    className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] p-2.5 text-stone-900 focus:border-[#B84A22] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-medium text-stone-700 block mb-1">Valid Until</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] p-2.5 text-stone-900 focus:border-[#B84A22] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-stone-200 px-4 py-2 font-medium text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#F15A24] px-5 py-2 font-bold text-white shadow-xs hover:brightness-105 cursor-pointer"
                >
                  {editingPromo ? 'Save Changes' : 'Publish Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

