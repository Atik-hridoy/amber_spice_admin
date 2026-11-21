import { useState, useEffect } from 'react'
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Package,
  ShoppingBag,
  User,
  X,
} from 'lucide-react'
import type { Order } from '../../types/admin'

interface TakeawaySettlementModalProps {
  order: Order | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (
    orderId: string,
    options: { paymentMethod?: 'cash' | 'card' | 'apple-pay'; counterNotes?: string }
  ) => Promise<void>
  busy?: boolean
}

export function TakeawaySettlementModal({
  order,
  isOpen,
  onClose,
  onConfirm,
  busy = false,
}: TakeawaySettlementModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash')
  const [counterNotes, setCounterNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (order) {
      // Default to order's method if it was card/cash, otherwise cash
      setPaymentMethod(order.paymentMethod === 'card' ? 'card' : 'cash')
      setCounterNotes('')
      setError('')
      setSubmitting(false)
    }
  }, [order, isOpen])

  if (!isOpen || !order) return null

  const isAlreadyPaid = order.paymentStatus === 'paid'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting || busy) return
    setError('')
    setSubmitting(true)
    try {
      await onConfirm(order.id, {
        paymentMethod: isAlreadyPaid ? order.paymentMethod : paymentMethod,
        counterNotes: counterNotes.trim() || undefined,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record takeaway settlement.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="takeaway-settlement-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h3 id="takeaway-settlement-title" className="text-base font-bold text-stone-900">
                Takeaway Counter Handover &amp; Settlement
              </h3>
              <p className="text-xs text-stone-500">
                Ticket <span className="font-mono font-bold text-stone-700">{order.orderNumber}</span> · Code{' '}
                <span className="font-mono font-bold text-emerald-700">#{order.pickupCode || 'TK'}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting || busy}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Guest & Rack Summary Card */}
          <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-stone-400" /> Guest:
              </span>
              <span className="font-bold text-stone-900">
                {order.customerName} {order.customerPhone ? `(${order.customerPhone})` : ''}
              </span>
            </div>
            {order.pickupRack && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-200/60">
                <span className="text-stone-500 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-stone-400" /> Warming Shelf:
                </span>
                <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                  {order.pickupRack}
                </span>
              </div>
            )}
            {order.customerArrivedAt && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-200/60">
                <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-emerald-600" /> Customer Status:
                </span>
                <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  At Counter Now ({new Date(order.customerArrivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                </span>
              </div>
            )}
          </div>

          {/* Order Items Preview */}
          <div className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider">
              <span>Items ({order.items.reduce((acc, i) => acc + i.quantity, 0)})</span>
              <span>Amount</span>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1.5 text-xs text-stone-800 pr-1">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-0.5">
                  <span className="line-clamp-1">
                    <strong className="text-stone-900">{item.quantity}×</strong> {item.name}
                  </span>
                  <span className="font-mono text-stone-600 shrink-0 ml-2">
                    €{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-stone-200 flex items-center justify-between font-bold text-sm text-stone-900">
              <span>Total Balance</span>
              <span className="text-base text-[#B84A22] font-black">€{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Status & Settlement Controls */}
          {isAlreadyPaid ? (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>Payment Already Settled</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                This order was paid online via <strong className="uppercase">{order.paymentMethod}</strong> (€{order.totalAmount.toFixed(2)}).
                No counter collection required. Confirm bag handover to complete the ticket.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-amber-300 bg-amber-50/80 p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-950 font-black text-sm">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                  <span>PAYMENT REQUIRED AT COUNTER</span>
                </div>
                <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-extrabold text-amber-900">
                  Due: €{order.totalAmount.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-amber-900">
                Please collect payment from the guest before handing over the food package:
              </p>

              {/* Payment Method Selector */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 font-bold ring-2 ring-emerald-500/30'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <Banknote className="h-5 w-5 mb-1 text-emerald-700" />
                  <span className="text-xs font-bold">💵 Cash Drawer</span>
                  <span className="text-[10px] text-stone-500 font-normal">Physical cash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold ring-2 ring-indigo-500/30'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <CreditCard className="h-5 w-5 mb-1 text-indigo-700" />
                  <span className="text-xs font-bold">💳 POS Terminal</span>
                  <span className="text-[10px] text-stone-500 font-normal">Card tap / swipe</span>
                </button>
              </div>
            </div>
          )}

          {/* Staff Counter Notes */}
          <div className="space-y-1.5">
            <label htmlFor="counterNotes" className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-stone-400" />
              <span>Counter Staff Note / Reference (Optional)</span>
            </label>
            <input
              id="counterNotes"
              type="text"
              value={counterNotes}
              onChange={(e) => setCounterNotes(e.target.value)}
              placeholder={
                isAlreadyPaid
                  ? 'e.g. Handed to customer in person'
                  : paymentMethod === 'cash'
                  ? 'e.g. Received €50 cash, change €15 given'
                  : 'e.g. POS Auth code #482910'
              }
              className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#B84A22] focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting || busy}
              className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || busy}
              className={`rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-sm transition cursor-pointer flex items-center gap-2 disabled:opacity-50 ${
                isAlreadyPaid
                  ? 'bg-emerald-700 hover:bg-emerald-800'
                  : 'bg-gradient-to-r from-[#B84A22] to-[#FBA138] hover:brightness-105 active:scale-98'
              }`}
            >
              {submitting ? (
                <span>Recording Handover...</span>
              ) : isAlreadyPaid ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Confirm Handover to Guest</span>
                </>
              ) : (
                <>
                  <Banknote className="h-4 w-4" />
                  <span>Collect €{order.totalAmount.toFixed(2)} &amp; Handover</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
