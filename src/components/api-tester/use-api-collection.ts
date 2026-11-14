import { useCallback, useEffect, useRef, useState } from 'react'
import { loadApiPresets } from '../../services/api-schema-service'
import { API_PRESETS } from './api-presets'

export function useApiCollection() {
  const [presets, setPresets] = useState(API_PRESETS)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const controllerRef = useRef<AbortController | null>(null)
  const load = useCallback((controller: AbortController) => loadApiPresets(API_PRESETS, controller.signal).then((result) => {
    if (!controller.signal.aborted) setPresets(result)
  }, (failure: unknown) => {
    if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Could not load the API schema.')
  }).finally(() => { if (!controller.signal.aborted) setIsLoading(false) }), [])
  useEffect(() => {
    const controller = new AbortController()
    controllerRef.current = controller
    void load(controller)
    return () => controller.abort()
  }, [load])
  const reload = () => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setIsLoading(true)
    setError('')
    return load(controller)
  }
  return { presets, isLoading, error, reload }
}
