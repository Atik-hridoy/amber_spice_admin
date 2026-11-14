import { useCallback, useEffect, useRef, useState } from 'react'
import { categoryService } from '../services/category-service'
import type { CreateCategoryPayload, MenuCategory } from '../types/menu-category'

export function useMenuCategories() {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const pendingCreate = useRef(false)
  const requestRef = useRef<AbortController | null>(null)

  const load = useCallback((controller: AbortController) => {
    return categoryService.list(controller.signal).then((result) => {
      if (!controller.signal.aborted) setCategories(result)
    }, (error: unknown) => {
      if (!controller.signal.aborted) {
        setLoadError(error instanceof Error ? error.message : 'Could not load categories.')
      }
    }).finally(() => {
      if (!controller.signal.aborted) setIsLoading(false)
    })
  }, [])

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
    setLoadError('')
    return load(controller)
  }

  const createCategory = async (payload: CreateCategoryPayload) => {
    if (pendingCreate.current) throw new Error('A category is already being saved.')
    pendingCreate.current = true
    setIsSaving(true)
    try {
      const saved = await categoryService.create(payload)
      requestRef.current?.abort()
      setIsLoading(false)
      setCategories((previous) => [...previous.filter((item) => item.id !== saved.id), saved]
        .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)))
      return saved
    } finally {
      pendingCreate.current = false
      setIsSaving(false)
    }
  }

  return { categories, isLoading, isSaving, loadError, reload, createCategory }
}
