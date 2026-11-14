import { useState } from 'react'
import { CheckCircle2, FolderPlus, Pencil, Plus, Search, X } from 'lucide-react'
import type { AdminUser } from '../../types/admin'
import type { DishPayload, MenuDish } from '../../types/menu-dish'
import { useMenuDishes } from '../../hooks/use-menu-dishes'
import type { CreateCategoryPayload, MenuCategory } from '../../types/menu-category'
import { getAdminAccessToken, getAdminRefreshToken } from '../../services/admin-session'
import { useMenuCategories } from '../../hooks/use-menu-categories'
import { CategoryFormModal } from './category-form-modal'
import { CategoryTabs } from './category-tabs'
import { DishFormModal } from './dish-form-modal'
import { ProductCard } from './product-card'

interface ProductsViewProps {
  currentUser: AdminUser
}

export function ProductsView({ currentUser }: ProductsViewProps) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<MenuCategory | undefined>()
  const [isDishModalOpen, setIsDishModalOpen] = useState(false)
  const [editingDish, setEditingDish] = useState<MenuDish | undefined>()
  const [successMessage, setSuccessMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const dishData = useMenuDishes()
  const { categories, isLoading, isSaving, loadError, reload, createCategory, updateCategory } = useMenuCategories()
  const hasSession = !!(getAdminAccessToken() || getAdminRefreshToken())
  const canManage = ['super_admin', 'admin', 'manager'].includes(currentUser.role) || currentUser.permissions.includes('menu:manage')
  const canCreateCategory = canManage && hasSession
  const hasActiveCategories = categories.some((category) => category.is_active)
  const selectedCategoryObj = categories.find((c) => String(c.id) === selectedCategory)

  const filteredItems = dishData.dishes.filter((item) => (
    (selectedCategory === 'all' || String(item.category) === selectedCategory) &&
    (!searchQuery.trim() || `${item.name} ${item.description}`.toLowerCase().includes(searchQuery.toLowerCase().trim()))
  ))

  const openCategoryCreate = () => {
    setEditingCategory(undefined)
    setIsCategoryModalOpen(true)
  }

  const openCategoryEdit = (category: MenuCategory) => {
    setEditingCategory(category)
    setIsCategoryModalOpen(true)
  }

  const saveCategory = async (payload: CreateCategoryPayload) => {
    let saved: MenuCategory
    if (editingCategory) {
      saved = await updateCategory(editingCategory.id, payload)
      setSuccessMessage(`Category “${saved.name}” updated successfully${saved.is_active ? '.' : ' as hidden.'}`)
    } else {
      saved = await createCategory(payload)
      setSuccessMessage(`Category “${saved.name}” saved successfully${saved.is_active ? '.' : ' as hidden.'}`)
    }
    setIsCategoryModalOpen(false)
    setEditingCategory(undefined)
    setSelectedCategory(String(saved.id))
    void reload()
    return saved
  }

  const openDish = (dish?: MenuDish) => {
    setEditingDish(dish)
    setIsDishModalOpen(true)
  }

  const saveDish = async (payload: DishPayload) => {
    const saved = await dishData.save(payload, editingDish?.id)
    setIsDishModalOpen(false)
    setSelectedCategory(String(saved.category))
    setSuccessMessage(`Dish “${saved.name}” saved successfully.`)
    void reload()
    return saved
  }

  const toggleDish = async (dish: MenuDish) => {
    setActionError('')
    try {
      await dishData.toggle(dish)
      void reload()
    } catch (failure) {
      setActionError(failure instanceof Error ? failure.message : 'Could not update availability.')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-stone-200/80 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            aria-label="Search menu dishes"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search menu dishes..."
            className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] py-2.5 pl-10 pr-4 text-xs outline-none focus:border-[#B84A22] focus:ring-2 focus:ring-[#B84A22]/15"
          />
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {selectedCategoryObj && canCreateCategory && (
            <button
              type="button"
              onClick={() => openCategoryEdit(selectedCategoryObj)}
              title={`Edit category ${selectedCategoryObj.name}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-stone-700 transition-colors hover:border-[#B84A22] hover:text-[#B84A22] cursor-pointer shadow-2xs"
            >
              <Pencil size={14} className="text-[#B84A22]" />
              <span>Edit “{selectedCategoryObj.name}”</span>
            </button>
          )}

          <button
            type="button"
            onClick={openCategoryCreate}
            disabled={!canCreateCategory}
            title={!hasSession ? 'Sign in online to add categories' : !canManage ? 'Menu management permission required' : undefined}
            className="inline-flex items-center gap-2 rounded-xl border border-[#B84A22]/30 bg-[#FFF7ED] px-4 py-2.5 text-xs font-semibold text-[#B84A22] transition-colors hover:bg-[#B84A22]/10 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            <FolderPlus size={16} />
            <span>Add Category</span>
          </button>

          <button
            type="button"
            onClick={() => openDish()}
            disabled={!canCreateCategory || isLoading || !hasActiveCategories || dishData.isBusy}
            title={!hasActiveCategories ? 'Create an active category first' : undefined}
            className="inline-flex items-center gap-2 rounded-xl bg-[#B84A22] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#9E3E1C] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            <Plus size={16} />
            <span>Add New Dish</span>
          </button>
        </div>
      </div>

      {!hasSession && (
        <p className="text-xs text-stone-500">
          Sign in with an online restaurant account to manage categories and dishes.
        </p>
      )}

      {successMessage && (
        <div role="status" className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={17} />
            {successMessage}
          </span>
          <button
            type="button"
            aria-label="Dismiss category confirmation"
            onClick={() => setSuccessMessage('')}
            className="rounded p-1 hover:bg-emerald-100 cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      )}

      <CategoryTabs
        categories={categories}
        selected={selectedCategory}
        isLoading={isLoading}
        error={loadError}
        onSelect={setSelectedCategory}
        onReload={() => void reload()}
        onEditCategory={openCategoryEdit}
        canManage={canCreateCategory}
      />

      {actionError && (
        <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
          {actionError}
        </div>
      )}

      {dishData.error && (
        <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
          {dishData.error}
          <button type="button" onClick={() => void dishData.reload()} className="ml-3 font-semibold underline cursor-pointer">
            Retry dishes
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => void dishData.reload()}
        disabled={dishData.isLoading || dishData.isBusy}
        className="text-xs font-semibold text-[#B84A22] cursor-pointer"
      >
        Refresh dishes
      </button>

      {dishData.isLoading ? (
        <p role="status" className="text-sm text-stone-500">Loading dishes…</p>
      ) : dishData.error ? null : filteredItems.length ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((dish) => (
            <ProductCard
              key={dish.id}
              dish={dish}
              onEdit={openDish}
              onToggleAvailability={() => void toggleDish(dish)}
              canManage={canCreateCategory}
              canToggle={hasSession && (canManage || currentUser.permissions.includes('menu:toggle_availability'))}
              busy={dishData.isBusy}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
          <h3 className="text-sm font-semibold text-stone-800">No dishes found</h3>
          <p className="mt-2 text-xs text-stone-500">
            {searchQuery ? 'Try a different search or category.' : 'Add a dish to start building this category.'}
          </p>
        </div>
      )}

      {isCategoryModalOpen && (
        <CategoryFormModal
          category={editingCategory}
          isSaving={isSaving}
          onClose={() => {
            setIsCategoryModalOpen(false)
            setEditingCategory(undefined)
          }}
          onSubmit={saveCategory}
        />
      )}

      {isDishModalOpen && (
        <DishFormModal
          dish={editingDish}
          categories={categories}
          isSaving={dishData.isBusy}
          initialCategory={categories.some((category) => String(category.id) === selectedCategory && category.is_active) ? selectedCategory : undefined}
          onClose={() => setIsDishModalOpen(false)}
          onSave={saveDish}
        />
      )}
    </div>
  )
}
