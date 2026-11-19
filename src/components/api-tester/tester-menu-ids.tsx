import { useState } from 'react'
import { categoryService } from '../../services/category-service'
import { dishService } from '../../services/dish-service'
import type { MenuCategory } from '../../types/menu-category'
import type { MenuDish } from '../../types/menu-dish'
import { TESTER_INPUT } from './tester-styles'

interface Props {
  variables: Record<string, string>
  disabled: boolean
  onVariable: (key: string, value: string) => void
}

export function TesterMenuIds({ variables, disabled, onVariable }: Props) {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [dishes, setDishes] = useState<MenuDish[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const load = async () => {
    setIsLoading(true)
    setError('')
    const [categoryResult, dishResult] = await Promise.allSettled([categoryService.list(), dishService.list()])
    if (categoryResult.status === 'fulfilled') setCategories(categoryResult.value)
    if (dishResult.status === 'fulfilled') setDishes(dishResult.value)
    const failure = [categoryResult, dishResult].find((result) => result.status === 'rejected')
    if (failure?.status === 'rejected') setError(failure.reason instanceof Error ? failure.reason.message : 'Could not load menu IDs.')
    setIsLoading(false)
  }
  return <div className="rounded-xl border border-orange-100 bg-orange-50/40 p-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-stone-600">Use saved records to fill IDs and the dish category.</p><button type="button" onClick={() => void load()} disabled={disabled || isLoading} className="text-xs font-semibold text-[#B84A22] disabled:opacity-50">{isLoading ? 'Loading menu IDs…' : 'Load menu IDs'}</button></div>
    {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
    <fieldset disabled={disabled || isLoading} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="text-xs text-stone-600">Saved category<select aria-label="Saved category" value={variables.categoryId || ''} onChange={(event) => onVariable('categoryId', event.target.value)} className={`${TESTER_INPUT} mt-1`}><option value="">Select a category</option>{variables.categoryId && !categories.some((row) => String(row.id) === variables.categoryId) && <option value={variables.categoryId}>ID {variables.categoryId}</option>}{categories.map((row) => <option key={row.id} value={row.id}>{row.id} · {row.name}{row.is_active ? '' : ' (hidden)'}</option>)}</select></label>
      <label className="text-xs text-stone-600">Saved dish<select aria-label="Saved dish" value={variables.dishId || ''} onChange={(event) => onVariable('dishId', event.target.value)} className={`${TESTER_INPUT} mt-1`}><option value="">Select a dish</option>{variables.dishId && !dishes.some((row) => String(row.id) === variables.dishId) && <option value={variables.dishId}>ID {variables.dishId}</option>}{dishes.map((row) => <option key={row.id} value={row.id}>{row.id} · {row.name}</option>)}</select></label>
    </fieldset>
  </div>
}
