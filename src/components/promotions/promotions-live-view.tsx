import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import type { Promotion } from '../../types/admin'
import { adminRequest } from '../../services/api-client'
import { listRecords } from '../../services/resource-service'
import { PromotionsView } from './promotions-view'

export function PromotionsLiveView() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionBusy, setActionBusy] = useState(false)

  const loadPromotions = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true)
      const data = await listRecords<Record<string, unknown>>('promotions/', signal)
      if (!signal?.aborted) {
        const normalized: Promotion[] = data.map((raw) => ({
          id: String(raw.id),
          code: String(raw.code || '').toUpperCase(),
          title: String(raw.title || ''),
          description: String(raw.description || ''),
          discountType: (raw.discountType as 'percentage' | 'fixed') || 'percentage',
          discountValue: Number(raw.discountValue) || 0,
          minSpend: Number(raw.minSpend) || 0,
          validUntil: String(raw.validUntil || ''),
          usageLimit: Number(raw.usageLimit) || 100,
          usageCount: Number(raw.usageCount) || 0,
          isActive: Boolean(raw.isActive),
          badge: String(raw.badge || ''),
          firstOrderOnly: Boolean(raw.firstOrderOnly),
          imageUrl: raw.imageUrl ? String(raw.imageUrl) : undefined,
        }))
        setPromotions(normalized)
        setError('')
      }
    } catch (err) {
      if (!signal?.aborted) {
        setError(err instanceof Error ? err.message : 'Unable to load promotions from server.')
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void loadPromotions(controller.signal)
    return () => controller.abort()
  }, [loadPromotions])

  const handleAddPromotion = async (promo: Promotion) => {
    setActionBusy(true)
    setError('')
    try {
      if (promo.imageFile) {
        const formData = new FormData()
        formData.append('code', promo.code.trim().toUpperCase())
        formData.append('title', promo.title.trim())
        formData.append('description', promo.description.trim())
        formData.append('discountType', promo.discountType)
        formData.append('discountValue', String(promo.discountValue))
        formData.append('minSpend', String(promo.minSpend))
        formData.append('validUntil', promo.validUntil)
        formData.append('usageLimit', String(promo.usageLimit))
        formData.append('isActive', String(promo.isActive))
        formData.append('badge', promo.badge)
        formData.append('firstOrderOnly', String(Boolean(promo.firstOrderOnly)))
        formData.append('image', promo.imageFile)
        await adminRequest('promotions/', {
          method: 'POST',
          requireAuth: true,
          body: formData,
        })
      } else {
        await adminRequest('promotions/', {
          method: 'POST',
          requireAuth: true,
          body: JSON.stringify({
            code: promo.code.trim().toUpperCase(),
            title: promo.title.trim(),
            description: promo.description.trim(),
            discountType: promo.discountType,
            discountValue: promo.discountValue,
            minSpend: promo.minSpend,
            validUntil: promo.validUntil,
            usageLimit: promo.usageLimit,
            isActive: promo.isActive,
            badge: promo.badge,
            imageUrl: promo.imageUrl || '',
            firstOrderOnly: Boolean(promo.firstOrderOnly),
          }),
        })
      }
      await loadPromotions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create promotion voucher.')
    } finally {
      setActionBusy(false)
    }
  }

  const handleUpdatePromotion = async (promo: Promotion) => {
    setActionBusy(true)
    setError('')
    try {
      if (promo.imageFile) {
        const formData = new FormData()
        formData.append('code', promo.code.trim().toUpperCase())
        formData.append('title', promo.title.trim())
        formData.append('description', promo.description.trim())
        formData.append('discountType', promo.discountType)
        formData.append('discountValue', String(promo.discountValue))
        formData.append('minSpend', String(promo.minSpend))
        formData.append('validUntil', promo.validUntil)
        formData.append('usageLimit', String(promo.usageLimit))
        formData.append('badge', promo.badge)
        formData.append('firstOrderOnly', String(Boolean(promo.firstOrderOnly)))
        formData.append('image', promo.imageFile)
        await adminRequest(`promotions/${promo.id}/`, {
          method: 'PATCH',
          requireAuth: true,
          body: formData,
        })
      } else {
        await adminRequest(`promotions/${promo.id}/`, {
          method: 'PATCH',
          requireAuth: true,
          body: JSON.stringify({
            code: promo.code.trim().toUpperCase(),
            title: promo.title.trim(),
            description: promo.description.trim(),
            discountType: promo.discountType,
            discountValue: promo.discountValue,
            minSpend: promo.minSpend,
            validUntil: promo.validUntil,
            usageLimit: promo.usageLimit,
            badge: promo.badge,
            imageUrl: promo.imageUrl || '',
            firstOrderOnly: Boolean(promo.firstOrderOnly),
          }),
        })
      }
      await loadPromotions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update promotion.')
    } finally {
      setActionBusy(false)
    }
  }

  const handleDeletePromotion = async (id: string) => {
    setActionBusy(true)
    setError('')
    try {
      await adminRequest(`promotions/${id}/`, {
        method: 'DELETE',
        requireAuth: true,
      })
      await loadPromotions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete promotion.')
    } finally {
      setActionBusy(false)
    }
  }

  const handleToggleStatus = async (id: string) => {
    setActionBusy(true)
    setError('')
    try {
      await adminRequest(`promotions/${id}/toggle-status/`, {
        method: 'POST',
        requireAuth: true,
      })
      await loadPromotions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle promotion status.')
    } finally {
      setActionBusy(false)
    }
  }

  if (loading && promotions.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-stone-200 bg-white p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-[#B84A22]" />
        <p className="text-xs font-semibold text-stone-500">Loading active promotions &amp; discount campaigns…</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div role="alert" className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => void loadPromotions()}
            disabled={actionBusy}
            className="font-bold underline hover:text-red-950 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      <PromotionsView
        promotions={promotions}
        onAddPromotion={handleAddPromotion}
        onUpdatePromotion={handleUpdatePromotion}
        onDeletePromotion={handleDeletePromotion}
        onToggleStatus={handleToggleStatus}
      />
    </div>
  )
}
