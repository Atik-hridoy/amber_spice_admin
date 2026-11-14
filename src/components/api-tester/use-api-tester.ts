import { useEffect, useRef, useState } from 'react'
import { sendTesterRequest } from '../../services/api-tester-service'
import type { ApiPreset, TesterRequest, TesterResponse } from '../../types/api-tester'
import { API_PRESETS } from './api-presets'

export function useApiTester() {
  const initial = API_PRESETS[0]
  const [selected, setSelected] = useState(initial)
  const [request, setRequest] = useState<TesterRequest>({ method: initial.method, url: initial.url, variables: {},
    body: '', bodyMode: 'none', headers: JSON.stringify({ Accept: 'application/json' }, null, 2),
    authMode: 'session', token: '', file: null, fileField: 'image',
  })
  const [response, setResponse] = useState<TesterResponse | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [requestNumber, setRequestNumber] = useState(0)
  const controllerRef = useRef<AbortController | null>(null)
  const pending = useRef(false)
  useEffect(() => () => controllerRef.current?.abort(), [])
  const update = (patch: Partial<TesterRequest>) => setRequest((previous) => ({ ...previous, ...patch }))
  const variable = (key: string, value: string) => setRequest((previous) => {
    let body = previous.body
    if (key === 'categoryId') {
      try {
        const properties: unknown = JSON.parse(body)
        if (properties && typeof properties === 'object' && !Array.isArray(properties) && 'category' in properties) {
          body = JSON.stringify({ ...properties, category: value ? Number(value) : null }, null, 2)
        }
      } catch { /* Retain the user's body while they are typing. */ }
    }
    return { ...previous, body, variables: { ...previous.variables, [key]: value } }
  })
  const select = (preset: ApiPreset) => {
    setSelected(preset)
    setResponse(null)
    setError('')
    setRequest((previous) => {
      let body = preset.body || ''
      if (previous.variables.categoryId && body) {
        const properties: unknown = JSON.parse(body)
        if (properties && typeof properties === 'object' && !Array.isArray(properties) && 'category' in properties) body = JSON.stringify({ ...properties, category: Number(previous.variables.categoryId) }, null, 2)
      }
      return { ...previous, method: preset.method, url: preset.url, body,
        bodyMode: preset.bodyMode || (body ? 'json' : 'none'), file: null,
        authMode: preset.auth === 'none' ? 'none' : previous.authMode === 'none' ? 'session' : previous.authMode,
      }
    })
  }
  const send = async () => {
    if (pending.current) return
    pending.current = true
    setIsLoading(true)
    setRequestNumber((number) => number + 1)
    setError('')
    setResponse(null)
    const controller = new AbortController()
    controllerRef.current = controller
    try {
      const result = await sendTesterRequest(request, controller.signal)
      setResponse(result)
      const json = result.json
      if (result.status >= 200 && result.status < 300 && json && typeof json === 'object' && !Array.isArray(json)) {
        if ('id' in json && selected.resource && (typeof json.id === 'number' || typeof json.id === 'string')) variable(`${selected.resource}Id`, String(json.id))
        if ('access' in json && typeof json.access === 'string') update({ token: json.access, authMode: 'manual' })
      }
    } catch (failure) {
      setError(controller.signal.aborted ? 'Request cancelled.' : failure instanceof Error ? failure.message : 'Request failed.')
    } finally {
      pending.current = false
      setIsLoading(false)
    }
  }
  return { request, response, selected, error, isLoading, requestNumber, update, variable, select, send,
    cancel: () => controllerRef.current?.abort(),
  }
}
