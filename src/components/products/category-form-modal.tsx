import { useState, type FormEvent } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import type { CreateCategoryPayload, MenuCategory } from '../../types/menu-category'
import { AdminApiError } from '../../services/api-error'
import { FormDialog } from './form-dialog'
import { MenuImageInput } from './menu-image-input'

interface CategoryFormModalProps {
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: CreateCategoryPayload) => Promise<MenuCategory>
}

const INPUT_CLASS = 'mt-1.5 w-full rounded-xl border border-stone-200 bg-[#FAF9F5] px-3 py-2.5 text-sm text-stone-900 outline-none transition-colors focus:border-[#B84A22] focus:ring-2 focus:ring-[#B84A22]/15 disabled:opacity-60'

export function CategoryFormModal({ isSaving, onClose, onSubmit }: CategoryFormModalProps) {
  const [form, setForm] = useState({ name: '', description: '', slug: '', imageUrl: '', order: '0', is_active: true })
  const [error, setError] = useState<AdminApiError | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageError, setImageError] = useState('')
  const fieldError = (field: string) => error?.fieldErrors[field]?.join(' ')
  const setText = (field: 'name' | 'description' | 'slug' | 'imageUrl' | 'order', value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (isSaving || imageError) return
    setError(null)
    try {
      await onSubmit({
        name: form.name.trim(), description: form.description.trim(),
        ...(form.slug.trim() ? { slug: form.slug.trim() } : {}),
        ...(imageFile ? { image: imageFile } : { imageUrl: form.imageUrl.trim() || null }),
        order: Number(form.order), is_active: form.is_active,
      })
    } catch (failure) {
      setError(failure instanceof AdminApiError ? failure : new AdminApiError(
        failure instanceof Error ? failure.message : 'Could not save the category. Please try again.',
      ))
    }
  }

  return (
    <FormDialog title="Add Category" description="Create a section for your menu. Only the name is required." onClose={onClose} busy={isSaving}>
      <form onSubmit={submit} className="px-6 pb-6 pt-5">
        {error && <div role="alert" className="mb-5 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle size={17} className="mt-0.5 shrink-0" />{error.message}</div>}
        <fieldset disabled={isSaving} className="space-y-4">
          <div>
            <label htmlFor="category-name" className="text-xs font-semibold text-stone-700">Category name <span className="text-[#B84A22]">*</span></label>
            <input id="category-name" value={form.name} onChange={(event) => setText('name', event.target.value)} required maxLength={100} placeholder="e.g. Seafood & Signature Boils" className={INPUT_CLASS} aria-invalid={!!fieldError('name')} aria-describedby="category-name-error" />
            <FieldError id="category-name-error" message={fieldError('name')} />
          </div>
          <div>
            <label htmlFor="category-description" className="text-xs font-semibold text-stone-700">Description <span className="font-normal text-stone-400">(optional)</span></label>
            <textarea id="category-description" value={form.description} onChange={(event) => setText('description', event.target.value)} rows={2} placeholder="A short introduction to this menu section" className={INPUT_CLASS} aria-invalid={!!fieldError('description')} aria-describedby="category-description-error" />
            <FieldError id="category-description-error" message={fieldError('description')} />
          </div>
          <MenuImageInput
            file={imageFile} imageUrl={form.imageUrl} error={imageError || fieldError('image') || fieldError('imageUrl')}
            onFileChange={(file, message) => { setImageFile(file); setImageError(message); setText('imageUrl', ''); setError(null) }}
            onUrlChange={(url) => { setText('imageUrl', url); setImageFile(null); setImageError(''); setError(null) }}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="category-order" className="text-xs font-semibold text-stone-700">Display order</label>
              <input id="category-order" type="number" min={0} step={1} required value={form.order} onChange={(event) => setText('order', event.target.value)} className={INPUT_CLASS} aria-invalid={!!fieldError('order')} aria-describedby="category-order-error" />
              <p className="mt-1.5 text-[11px] text-stone-500">Lower numbers appear first.</p>
              <FieldError id="category-order-error" message={fieldError('order')} />
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 sm:mt-6">
              <input type="checkbox" checked={form.is_active} onChange={(event) => setForm((previous) => ({ ...previous, is_active: event.target.checked }))} className="h-4 w-4 accent-[#B84A22]" />
              <span><span className="block text-xs font-semibold text-stone-800">Active category</span><span className="mt-0.5 block text-[11px] text-stone-500">Available for the customer menu</span></span>
            </label>
          </div>
          <details className="rounded-xl border border-stone-200 px-3 py-2.5">
            <summary className="cursor-pointer text-xs font-medium text-stone-600">Custom URL slug (optional)</summary>
            <label htmlFor="category-slug" className="mt-3 block text-xs text-stone-500">Leave empty to generate from the name.</label>
            <input id="category-slug" value={form.slug} onChange={(event) => setText('slug', event.target.value)} maxLength={120} pattern="[A-Za-z0-9_-]+" placeholder="seafood-signature-boils" className={INPUT_CLASS} aria-invalid={!!fieldError('slug')} aria-describedby="category-slug-error" />
            <FieldError id="category-slug-error" message={fieldError('slug')} />
          </details>
        </fieldset>
        <div className="mt-6 flex items-center justify-end gap-2 border-t border-stone-100 pt-4">
          <button type="button" onClick={onClose} disabled={isSaving} className="rounded-xl border border-stone-200 px-4 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={isSaving || !!imageError} className="inline-flex items-center gap-2 rounded-xl bg-[#B84A22] px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#9E3E1C] disabled:cursor-wait disabled:opacity-60">
            {isSaving && <Loader2 size={15} className="animate-spin motion-reduce:animate-none" />}{isSaving ? 'Saving category…' : 'Save Category'}
          </button>
        </div>
      </form>
    </FormDialog>
  )
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p id={id} className="mt-1 text-xs text-red-700">{message}</p> : null
}

