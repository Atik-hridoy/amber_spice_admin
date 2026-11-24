import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  ChefHat,
  Flame,
  Mail,
  ShoppingBag,
  Volume2,
  VolumeX,
  X,
  Layers,
} from 'lucide-react'
import { isAudioMuted, toggleAudioMuted } from '../../services/audio-alert'

export interface ToastItem {
  id: string
  title: string
  message: string
  type: 'order_created' | 'order_status' | 'kitchen_ticket' | 'stock_alert' | 'customer_arrived' | 'reservation_created' | 'contact_message'
  orderId?: string
  orderNumber?: string
  pickupCode?: string
  customerName?: string
  diningType?: string
  totalAmount?: number | string
  itemsCount?: number
  inquiryId?: string | number
  timestamp?: string
  autoDismissMs?: number
}

interface ToastStackProps {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
  onDismissAll: () => void
  onViewOrder?: (orderId: string) => void
  onSendToKitchen?: (orderId: string) => void
  onOpenKitchenKds?: () => void
  onViewInquiry?: (inquiryId?: string | number) => void
}

const MAX_VISIBLE_TOASTS = 3
const DEFAULT_AUTO_DISMISS_MS = 8000

export function ToastStack({
  toasts,
  onDismiss,
  onDismissAll,
  onViewOrder,
  onSendToKitchen,
  onOpenKitchenKds,
  onViewInquiry,
}: ToastStackProps) {
  const [muted, setMuted] = useState(isAudioMuted())
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const handleToggleMute = () => {
    const next = toggleAudioMuted()
    setMuted(next)
  }

  // Active visible slice and queue count
  const visibleToasts = toasts.slice(0, MAX_VISIBLE_TOASTS)
  const queuedCount = Math.max(0, toasts.length - MAX_VISIBLE_TOASTS)

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none"
    >
      {/* High-volume rush header control bar */}
      <div className="flex items-center justify-between gap-2 rounded-xl bg-stone-900/90 backdrop-blur-md px-3 py-1.5 text-xs text-white shadow-xl pointer-events-auto w-full max-w-sm sm:max-w-md border border-stone-700/80">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <span className="font-semibold text-[11px] uppercase tracking-wider text-amber-400">
            Live Stream
          </span>
          {queuedCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
              <Layers className="h-3 w-3" />
              +{queuedCount} in queue
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleToggleMute}
            className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] text-stone-300 hover:text-white hover:bg-stone-800 transition cursor-pointer"
            title={muted ? 'Unmute notification chime' : 'Mute notification chime'}
          >
            {muted ? <VolumeX className="h-3.5 w-3.5 text-rose-400" /> : <Volume2 className="h-3.5 w-3.5 text-emerald-400" />}
            <span className="hidden sm:inline">{muted ? 'Muted' : 'Sound On'}</span>
          </button>

          {toasts.length > 1 && (
            <button
              type="button"
              onClick={onDismissAll}
              className="rounded-lg bg-stone-800 px-2 py-0.5 text-[11px] font-medium text-stone-300 hover:bg-stone-700 hover:text-white transition cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Visible Toasts */}
      <div className="flex flex-col gap-2 w-full">
        {visibleToasts.map((toast) => (
          <ToastCard
            key={toast.id}
            toast={toast}
            isHovered={hoveredId === toast.id}
            onMouseEnter={() => setHoveredId(toast.id)}
            onMouseLeave={() => setHoveredId(null)}
            onDismiss={() => onDismiss(toast.id)}
            onViewOrder={onViewOrder}
            onSendToKitchen={onSendToKitchen}
            onOpenKitchenKds={onOpenKitchenKds}
            onViewInquiry={onViewInquiry}
          />
        ))}
      </div>
    </div>
  )
}

function ToastCard({
  toast,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onDismiss,
  onViewOrder,
  onSendToKitchen,
  onOpenKitchenKds,
  onViewInquiry,
}: {
  toast: ToastItem
  isHovered: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
  onDismiss: () => void
  onViewOrder?: (orderId: string) => void
  onSendToKitchen?: (orderId: string) => void
  onOpenKitchenKds?: () => void
  onViewInquiry?: (inquiryId?: string | number) => void
}) {
  const dismissDuration = toast.autoDismissMs ?? DEFAULT_AUTO_DISMISS_MS
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (isHovered) return

    const intervalTime = 50
    const decrement = (intervalTime / dismissDuration) * 100

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer)
          onDismiss()
          return 0
        }
        return prev - decrement
      })
    }, intervalTime)

    return () => clearInterval(timer)
  }, [isHovered, dismissDuration, onDismiss])

  // Style according to event type
  const isOrder = toast.type === 'order_created'
  const isKitchen = toast.type === 'kitchen_ticket'
  const isStock = toast.type === 'stock_alert'
  const isCustomerArrived = toast.type === 'customer_arrived'
  const isContact = toast.type === 'contact_message'

  const borderAccent = isCustomerArrived
    ? 'border-l-4 border-l-emerald-500'
    : isOrder
    ? 'border-l-4 border-l-[#F15A24]'
    : isKitchen
    ? 'border-l-4 border-l-rose-500'
    : isStock
    ? 'border-l-4 border-l-amber-500'
    : isContact
    ? 'border-l-4 border-l-sky-500'
    : 'border-l-4 border-l-blue-500'

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl border border-[#E7E5E4] bg-white p-3.5 shadow-2xl transition-all duration-300 transform translate-y-0 ${borderAccent}`}
    >
      {/* Progress countdown bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 bg-[#F15A24]/20"
        style={{ width: '100%' }}
      >
        <div
          className={`h-full transition-all linear ${
            isCustomerArrived
              ? 'bg-emerald-500'
              : isOrder
              ? 'bg-[#F15A24]'
              : isKitchen
              ? 'bg-rose-500'
              : isStock
              ? 'bg-amber-500'
              : isContact
              ? 'bg-sky-500'
              : 'bg-blue-500'
          }`}
          style={{ width: `${progress}%`, transitionDuration: '50ms' }}
        />
      </div>

      <div className="flex items-start justify-between gap-3 mt-1">
        <div className="flex items-start gap-2.5 min-w-0">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-xs ${
              isCustomerArrived
                ? 'bg-emerald-500/15 text-emerald-700 ring-2 ring-emerald-500/30'
                : isOrder
                ? 'bg-[#F15A24]/10 text-[#F15A24]'
                : isKitchen
                ? 'bg-rose-500/10 text-rose-600'
                : isStock
                ? 'bg-amber-500/10 text-amber-600'
                : isContact
                ? 'bg-sky-500/10 text-sky-600 ring-2 ring-sky-500/20'
                : 'bg-blue-500/10 text-blue-600'
            }`}
          >
            {isCustomerArrived ? (
              <BellRing className="h-4 w-4 animate-bounce" />
            ) : isOrder ? (
              <ShoppingBag className="h-4 w-4" />
            ) : isKitchen ? (
              <ChefHat className="h-4 w-4" />
            ) : isStock ? (
              <AlertTriangle className="h-4 w-4" />
            ) : isContact ? (
              <Mail className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-xs text-[#1C1917] truncate">
                {toast.title}
              </span>
              {toast.diningType && (
                <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-stone-700">
                  {toast.diningType}
                </span>
              )}
            </div>

            <p className="text-xs text-stone-600 mt-0.5 line-clamp-2 leading-relaxed">
              {toast.message}
            </p>

            {/* Quick meta indicators */}
            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-stone-500">
              {toast.totalAmount !== undefined && (
                <span className="font-semibold text-stone-800">
                  €{Number(toast.totalAmount).toFixed(2)}
                </span>
              )}
              {toast.itemsCount !== undefined && (
                <>
                  <span>•</span>
                  <span>{toast.itemsCount} item{toast.itemsCount > 1 ? 's' : ''}</span>
                </>
              )}
              <span>•</span>
              <span className="text-[10px] text-stone-400">Just now</span>
            </div>
          </div>
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onDismiss}
          className="text-stone-400 hover:text-stone-700 p-1 rounded-md hover:bg-stone-100 transition cursor-pointer shrink-0"
          title="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="mt-3 flex items-center justify-end gap-2 border-t border-stone-100 pt-2.5">
        {isCustomerArrived && toast.orderId && onViewOrder && (
          <button
            type="button"
            onClick={() => {
              onViewOrder(toast.orderId!)
              onDismiss()
            }}
            className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition cursor-pointer"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Attend at Counter</span>
          </button>
        )}

        {isOrder && toast.orderId && onSendToKitchen && (
          <button
            type="button"
            onClick={() => {
              onSendToKitchen(toast.orderId!)
              onDismiss()
            }}
            className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#B84A22] to-[#FBA138] px-2.5 py-1 text-xs font-bold text-white shadow-sm hover:opacity-95 transition cursor-pointer"
          >
            <Flame className="h-3.5 w-3.5" />
            <span>Send to Kitchen</span>
          </button>
        )}

        {isKitchen && onOpenKitchenKds && (
          <button
            type="button"
            onClick={() => {
              onOpenKitchenKds()
              onDismiss()
            }}
            className="flex items-center gap-1 rounded-xl bg-rose-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition cursor-pointer"
          >
            <ChefHat className="h-3.5 w-3.5" />
            <span>Open KDS</span>
          </button>
        )}

        {isContact && onViewInquiry && (
          <button
            type="button"
            onClick={() => {
              onViewInquiry(toast.inquiryId)
              onDismiss()
            }}
            className="flex items-center gap-1 rounded-xl bg-sky-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm hover:bg-sky-700 transition cursor-pointer"
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Open Inquiry</span>
          </button>
        )}

        {toast.orderId && onViewOrder && (
          <button
            type="button"
            onClick={() => {
              onViewOrder(toast.orderId!)
              onDismiss()
            }}
            className="rounded-xl border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
          >
            View Details
          </button>
        )}
      </div>
    </div>
  )
}
