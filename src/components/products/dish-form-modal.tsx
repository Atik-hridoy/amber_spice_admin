import { useState, type FormEvent } from 'react'
import type { DishPayload, MenuDish } from '../../types/menu-dish'
import type { MenuCategory } from '../../types/menu-category'
import { AdminApiError } from '../../services/api-error'
import { FormDialog } from './form-dialog'
import { MenuImageInput } from './menu-image-input'
import { DishSettingsFields } from './dish-settings-fields'

interface DishFormModalProps {
  dish?: MenuDish
  categories: MenuCategory[]
  initialCategory?: string
  isSaving: boolean
  onClose: () => void
  onSave: (payload: DishPayload) => Promise<MenuDish>
}

const DISH_INPUT_CLASS = 'mt-1.5 w-full rounded-xl border border-stone-200 bg-[#FAF9F5] p-2.5 text-sm outline-none focus:border-[#B84A22] focus:ring-2 focus:ring-[#B84A22]/15'

export function DishFormModal({ dish, categories, initialCategory, isSaving, onClose, onSave }: DishFormModalProps) {
  const activeCategories = categories.filter((category) => category.is_active || category.id === dish?.category)
  const [form, setForm] = useState({
    name: dish?.name || '', category: String(dish?.category || initialCategory || activeCategories[0]?.id || ''),
    price: dish?.price || '', description: dish?.description || '', imageUrl: dish?.imageUrl || '',
    spicyLevel: dish?.spicyLevel ?? 0, station: dish?.station || 'curry', prepTime: dish?.prepTime || '',
    dietary: dish?.dietary || [], isAvailable: dish?.isAvailable ?? true,
    isPopular: dish?.isPopular ?? false, isBestseller: dish?.isBestseller ?? false, isSpecial: dish?.isSpecial ?? false,
  })
  const [image, setImage] = useState<File | null>(null)
  const [imageChanged, setImageChanged] = useState(false)
  const [imageError, setImageError] = useState('')
  const [error, setError] = useState<AdminApiError | null>(null)
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (isSaving || imageError) return
    setError(null)
    const { imageUrl, ...properties } = form
    try {
      await onSave({ ...properties, name: form.name.trim(), category: Number(form.category),
        ...(imageChanged ? image ? { image } : { imageUrl: imageUrl.trim() || null } : {}),
      })
    } catch (failure) {
      setError(failure instanceof AdminApiError ? failure : new AdminApiError(failure instanceof Error ? failure.message : 'Could not save dish.'))
    }
  }
  return (
    <FormDialog title={dish ? 'Edit Dish' : 'Add New Dish'} description="Choose a category and save this dish to the customer menu." onClose={onClose} busy={isSaving}>
      <form onSubmit={submit} className="space-y-4 p-6">
        {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{Object.entries(error.fieldErrors).length ? Object.entries(error.fieldErrors).map(([field, messages]) => <p key={field}>{field}: {messages.join(' ')}</p>) : error.message}</div>}
        <fieldset disabled={isSaving} className="space-y-4">
          <div><label htmlFor="dish-name" className="text-xs font-semibold text-stone-700">Dish Name</label><input id="dish-name" required maxLength={200} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={DISH_INPUT_CLASS} /></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><label htmlFor="dish-category" className="text-xs font-semibold text-stone-700">Category</label><select id="dish-category" required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className={DISH_INPUT_CLASS}>
              {!form.category && <option value="">Create an active category first</option>}
              {activeCategories.map((category) => <option key={category.id} value={category.id}>{category.name}{!category.is_active ? ' (hidden)' : ''}</option>)}
            </select></div>
            <div><label htmlFor="dish-price" className="text-xs font-semibold text-stone-700">Price (EUR)</label><input id="dish-price" type="number" min="0.01" max="99999999.99" step="0.01" required value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className={DISH_INPUT_CLASS} /></div>
          </div>
          <div><label htmlFor="dish-description" className="text-xs font-semibold text-stone-700">Description</label><textarea id="dish-description" rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={DISH_INPUT_CLASS} /></div>
          <MenuImageInput kind="Dish" file={image} imageUrl={form.imageUrl} error={imageError || error?.fieldErrors.image?.join(' ') || error?.fieldErrors.imageUrl?.join(' ')}
            onFileChange={(file, message) => { setImage(file); setImageChanged(true); setImageError(message); setForm({ ...form, imageUrl: '' }); setError(null) }}
            onUrlChange={(url) => { setImage(null); setImageChanged(true); setImageError(''); setForm({ ...form, imageUrl: url }); setError(null) }} />
          <DishSettingsFields form={form} onChange={(values) => setForm({ ...form, ...values })} />
        </fieldset>
        <div className="flex justify-end gap-2 border-t border-stone-100 pt-4"><button type="button" onClick={onClose} disabled={isSaving} className="rounded-xl border border-stone-200 px-4 py-2.5 text-xs font-semibold text-stone-600">Cancel</button><button type="submit" disabled={isSaving || !!imageError || !form.category} className="rounded-xl bg-[#B84A22] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#9E3E1C] disabled:opacity-50">{isSaving ? 'Saving dish…' : dish ? 'Update Dish' : 'Add Dish'}</button></div>
      </form>
    </FormDialog>
  )
}
