import { useEffect, useState } from 'react'
import {
  AlertCircle,
  Boxes,
  CheckCircle2,
  FolderPlus,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  X,
} from 'lucide-react'
import type { InventoryCategory } from '../../types/inventory-category'
import { inventoryCategoryService } from '../../services/inventory-category-service'
import { AdminApiError } from '../../services/api-error'

interface InventoryCategoriesTabProps {
  onCategoriesUpdated?: (categories: InventoryCategory[]) => void
}

export function InventoryCategoriesTab({ onCategoriesUpdated }: InventoryCategoriesTabProps) {
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<InventoryCategory | null>(null)

  // Form States
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load Categories from Backend API
  const loadCategories = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const data = await inventoryCategoryService.list()
      setCategories(data)
      onCategoriesUpdated?.(data)
    } catch (err) {
      const message = err instanceof AdminApiError ? err.message : 'Failed to load inventory categories.'
      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setFormName('')
    setFormDescription('')
    setFormIsActive(true)
    setFormError(null)
    setIsAddModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEditModal = (cat: InventoryCategory) => {
    setEditingCategory(cat)
    setFormName(cat.name)
    setFormDescription(cat.description || '')
    setFormIsActive(cat.is_active)
    setFormError(null)
  }

  // Submit Create
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = formName.trim()
    if (!trimmedName) {
      setFormError('Category name is required.')
      return
    }

    setIsSubmitting(true)
    setFormError(null)
    try {
      const newCategory = await inventoryCategoryService.create({
        name: trimmedName,
        description: formDescription.trim(),
        is_active: formIsActive,
      })
      const updatedList = [...categories, newCategory].sort((a, b) => a.name.localeCompare(b.name))
      setCategories(updatedList)
      onCategoriesUpdated?.(updatedList)
      setIsAddModalOpen(false)
    } catch (err) {
      if (err instanceof AdminApiError) {
        setFormError(err.message)
      } else {
        setFormError('Could not save category. Please check your network and try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit Update
  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return
    const trimmedName = formName.trim()
    if (!trimmedName) {
      setFormError('Category name is required.')
      return
    }

    setIsSubmitting(true)
    setFormError(null)
    try {
      const updated = await inventoryCategoryService.update(editingCategory.id, {
        name: trimmedName,
        description: formDescription.trim(),
        is_active: formIsActive,
      })
      const updatedList = categories.map((c) => (c.id === updated.id ? updated : c))
      setCategories(updatedList)
      onCategoriesUpdated?.(updatedList)
      setEditingCategory(null)
    } catch (err) {
      if (err instanceof AdminApiError) {
        setFormError(err.message)
      } else {
        setFormError('Could not update category. Please retry.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit Delete
  const handleDeleteCategory = async () => {
    if (!deletingCategory) return
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      await inventoryCategoryService.delete(deletingCategory.id)
      const updatedList = categories.filter((c) => c.id !== deletingCategory.id)
      setCategories(updatedList)
      onCategoriesUpdated?.(updatedList)
      setDeletingCategory(null)
    } catch (err) {
      const message = err instanceof AdminApiError ? err.message : 'Failed to delete category.'
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter Categories
  const filteredCategories = categories.filter((c) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q))
  })

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B84A22]/10 text-[#B84A22]">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900">Inventory Categories</h2>
            <p className="text-xs text-stone-500">
              {categories.length} total categories · {categories.filter((c) => c.is_active).length} active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories..."
              className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] py-2 pl-9 pr-3 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#B84A22] focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={loadCategories}
            title="Refresh category list"
            disabled={isLoading}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900 transition disabled:opacity-50 cursor-pointer shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-[#B84A22]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 rounded-xl bg-[#B84A22] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#9B3D1B] transition cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={loadCategories}
            className="font-bold underline hover:text-red-900 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && categories.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="h-36 rounded-2xl border border-stone-200 bg-white p-5 animate-pulse space-y-3">
              <div className="h-4 w-1/3 bg-stone-200 rounded" />
              <div className="h-3 w-3/4 bg-stone-100 rounded" />
              <div className="h-3 w-1/2 bg-stone-100 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredCategories.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50/60 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-200/80 text-stone-500 mb-3">
            <Tag className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-stone-900">
            {searchQuery ? 'No categories matching search' : 'No inventory categories yet'}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-stone-500">
            {searchQuery
              ? 'Try adjusting your search terms or clear the filter.'
              : 'Create categories like Dairy, Produce, or Spices to organize ingredients and kitchen stock.'}
          </p>
          {!searchQuery && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="mt-4 flex items-center gap-1.5 rounded-xl bg-[#B84A22] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#9B3D1B] transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create Category</span>
            </button>
          )}
        </div>
      )}

      {/* Category Grid */}
      {!isLoading && filteredCategories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-5 shadow-2xs hover:border-stone-300 transition group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 group-hover:text-[#B84A22] transition">
                      {cat.name}
                    </h3>
                    <span className="inline-block text-[10px] font-mono text-stone-400 mt-0.5">
                      slug: {cat.slug}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      cat.is_active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-stone-100 text-stone-500 border border-stone-200'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${cat.is_active ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                    {cat.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="mt-2 text-xs text-stone-500 line-clamp-2 min-h-[32px]">
                  {cat.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                <span className="rounded-lg bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
                  {cat.itemsCount} {cat.itemsCount === 1 ? 'item' : 'items'}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(cat)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:border-[#B84A22] hover:text-[#B84A22] transition cursor-pointer"
                    title="Edit category"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingCategory(cat)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:border-red-300 hover:text-red-600 transition cursor-pointer"
                    title="Delete category"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-[#B84A22]" />
                <h3 className="text-sm font-bold text-stone-900">Add Inventory Category</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="mt-4 space-y-4">
              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Seafood, Dairy, Dry Spices"
                  className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] px-3.5 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#B84A22] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Notes on ingredients, handling or suppliers under this category..."
                  className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] px-3.5 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#B84A22] focus:bg-white focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50/70 p-3">
                <div>
                  <p className="text-xs font-semibold text-stone-800">Active Status</p>
                  <p className="text-[11px] text-stone-500">Enable to show when organizing kitchen stock</p>
                </div>
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="h-4 w-4 accent-[#B84A22] rounded cursor-pointer"
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
                      <span>Save Category</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-[#B84A22]" />
                <h3 className="text-sm font-bold text-stone-900">Edit Category: {editingCategory.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="mt-4 space-y-4">
              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] px-3.5 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#B84A22] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] px-3.5 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#B84A22] focus:bg-white focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50/70 p-3">
                <div>
                  <p className="text-xs font-semibold text-stone-800">Active Status</p>
                  <p className="text-[11px] text-stone-500">Enable to show when organizing kitchen stock</p>
                </div>
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="h-4 w-4 accent-[#B84A22] rounded cursor-pointer"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 border-t border-stone-100 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
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
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Update Category</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">Delete Category?</h3>
                <p className="text-xs text-stone-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="mt-4 text-xs text-stone-600 leading-relaxed">
              Are you sure you want to delete <strong className="text-stone-900">"{deletingCategory.name}"</strong>?
              {deletingCategory.itemsCount > 0 && (
                <span className="block mt-1 text-amber-700 font-medium">
                  Note: {deletingCategory.itemsCount} ingredient(s) are assigned to this category. Their stock records will remain intact.
                </span>
              )}
            </p>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-stone-100 pt-3">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteCategory}
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
    </div>
  )
}
