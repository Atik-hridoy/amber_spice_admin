import { useCallback, useEffect, useRef, useState } from 'react'
import { dishService } from '../services/dish-service'
import type { DishPayload, MenuDish } from '../types/menu-dish'

export function useMenuDishes() {
  const [dishes, setDishes] = useState<MenuDish[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState('')
  const requestRef = useRef<AbortController | null>(null)
  const pending = useRef(false)
  const load = useCallback((controller: AbortController) => dishService.list(controller.signal).then((rows) => {
    if (!controller.signal.aborted) setDishes(rows)
  }, (failure: unknown) => {
    if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Could not load dishes.')
  }).finally(() => { if (!controller.signal.aborted) setIsLoading(false) }), [])
  useEffect(() => {
    const controller = new AbortController()
    requestRef.current = controller
    void load(controller)
    return () => controller.abort()
  }, [load])
  const reload = () => {
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller
    setIsLoading(true)
    setError('')
    return load(controller)
  }
  const mutate = async (operation: () => Promise<MenuDish>) => {
    if (pending.current) throw new Error('A dish is already being saved.')
    pending.current = true
    setIsBusy(true)
    try {
      const saved = await operation()
      requestRef.current?.abort()
      setIsLoading(false)
      setError('')
      setDishes((previous) => [saved, ...previous.filter((dish) => dish.id !== saved.id)])
      return saved
    } finally {
      pending.current = false
      setIsBusy(false)
    }
  }
  return { dishes, isLoading, isBusy, error, reload,
    save: (payload: DishPayload, id?: number) => mutate(() => dishService.save(payload, id)),
    toggle: (dish: MenuDish) => mutate(() => dishService.setAvailability(dish)),
  }
}
