import { useState } from 'react'
import {
  AlertCircle,
  Check,
  Clock,
  MapPin,
  Phone,
  Printer,
  Receipt,
  User,
  X,
} from 'lucide-react'
import type { Order } from '../../types/admin'

interface OrderDetailsModalProps {
  order: Order | null
  onClose: () => void
  onUpdateStatus?: (orderId: string, newStatus: any) => void
}

export function OrderDetailsModal({
  order,
  onClose,
  onUpdateStatus,
}: OrderDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'slip'>('details')
  const [isPrinting, setIsPrinting] = useState(false)
  const [printSuccess, setPrintSuccess] = useState(false)

  if (!order) return null

  const handlePrint = () => {
    setIsPrinting(true)
    setTimeout(() => {
      setIsPrinting(false)
      setPrintSuccess(true)
      setTimeout(() => setPrintSuccess(false), 2500)
    }, 600)
  }

  const paymentLabel = order.paymentMethod
    ? order.paymentMethod.replace('-', '_').toUpperCase()
    : 'CARD'

  const totalItemsCount = order.items.reduce((acc, i) => acc + i.quantity, 0)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-details-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Dialog Card (Figma node #24057:12413) */}
      <div className="relative z-10 w-full max-w-[512px] rounded-2xl bg-white border border-[#E7E5E4] shadow-[0px_8px_10px_-6px_rgba(0,0,0,0.1),0px_20px_25px_-5px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header (Figma node #24057:12414) */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F5F5F4] bg-white">
          <div className="flex items-center gap-2.5">
            <h3
              id="order-details-title"
              className="font-sans text-base font-semibold text-[#1C1917] leading-6"
            >
              Ticket {order.orderNumber}
            </h3>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                order.status === 'pending'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : order.status === 'preparing'
                  ? 'bg-orange-50 text-orange-700 border border-orange-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {order.status === 'pending'
                ? 'Incoming'
                : order.status === 'preparing'
                ? 'In Progress'
                : 'Ready'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body Content (Figma node #24057:12423) */}
        <div className="overflow-y-auto p-5 space-y-4 flex-1">
          {activeTab === 'details' ? (
            <>
              {/* Summary Information Card (Figma node #24057:12425) */}
              <div className="rounded-xl border border-[#E7E5E4]/80 bg-[#FAFAF9] p-3 space-y-2">
                {/* Customer Row */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#78716C] font-normal">Customer:</span>
                  <div className="flex items-center gap-1.5 font-semibold text-[#1C1917]">
                    <User className="h-3.5 w-3.5 text-[#78716C]" />
                    <span>{order.customerName}</span>
                  </div>
                </div>

                {/* Contact Row */}
                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[#E7E5E4]/60">
                  <span className="text-[#78716C] font-normal">Contact:</span>
                  <a
                    href={`tel:${order.customerPhone ?? '+353871234567'}`}
                    className="flex items-center gap-1 font-semibold text-[#F15A24] hover:underline"
                  >
                    <Phone className="h-3 w-3" />
                    <span>{order.customerPhone ?? '+353 87 123 4567'}</span>
                  </a>
                </div>

                {/* Order Type Row */}
                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[#E7E5E4]/60">
                  <span className="text-[#78716C] font-normal">Order Type:</span>
                  <span className="rounded-md bg-[#E7E5E4]/80 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-[#44403C] uppercase">
                    {order.diningType === 'takeaway' ? 'collection' : order.diningType}
                  </span>
                </div>

                {/* Delivery Address / Table Number Row */}
                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[#E7E5E4]/60">
                  <span className="text-[#78716C] font-normal">
                    {order.diningType === 'dine-in' ? 'Table:' : 'Address:'}
                  </span>
                  <div className="flex items-center gap-1 font-medium text-[#1C1917] text-right">
                    <MapPin className="h-3 w-3 text-[#78716C] shrink-0" />
                    <span>
                      {order.diningType === 'dine-in'
                        ? order.tableNumber ?? 'Table 5'
                        : order.deliveryAddress ??
                          '12 Fitzwilliam Square, Dublin 2 (D02 X381)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Special Note Box (Figma node #24057:12463) */}
              {order.notes ? (
                <div className="rounded-lg border border-[#FDE68A]/80 bg-[#FFFBEB] p-2.5 flex items-start gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-[#B45309] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#78350F] leading-[19.5px]">
                    {order.notes}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-[#FDE68A]/80 bg-[#FFFBEB] p-2.5 flex items-start gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-[#B45309] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#78350F] leading-[19.5px]">
                    Ring Apt 3 buzzer, leave at reception
                  </p>
                </div>
              )}

              {/* Items Breakdown (Figma node #24057:12472) */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-[#292524] tracking-[0.05em] uppercase">
                  Items ({totalItemsCount})
                </h4>

                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-[#E7E5E4]/80 bg-white p-3 flex flex-col gap-1 shadow-2xs"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#1C1917]">
                          {item.quantity}&times; {item.name}
                        </span>
                        <span className="font-semibold text-[#1C1917]">
                          €{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>

                      {/* Customizations / Spice note */}
                      {item.customizations && item.customizations.length > 0 ? (
                        <div className="pl-4 text-[11px] font-medium text-[#B45309] flex items-center gap-1">
                          <span>⚠</span>
                          <span>{item.customizations.join(', ')}</span>
                        </div>
                      ) : (
                        <div className="pl-4 text-[11px] font-medium text-[#B45309] flex items-center gap-1">
                          <span>⚠</span>
                          <span>Medium spice, gravy on side</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Paid Row (Figma node #24057:12487) */}
              <div className="pt-2 border-t border-[#E7E5E4] flex items-center justify-between">
                <span className="font-bold text-sm text-[#1C1917]">
                  Total Paid ({paymentLabel})
                </span>
                <span className="font-bold text-sm text-[#F15A24]">
                  €{order.totalAmount.toFixed(2)}
                </span>
              </div>
            </>
          ) : (
            /* Thermal POS Receipt View */
            <div className="rounded-xl border border-stone-300 bg-[#FCFBF8] p-4 font-mono text-xs text-stone-900 shadow-inner space-y-3">
              <div className="text-center space-y-1 border-b border-dashed border-stone-400 pb-3">
                <p className="font-bold text-sm tracking-wider uppercase">AMBER SPICE</p>
                <p className="text-[11px] text-stone-600">Royal Indian Cuisine Dublin</p>
                <p className="text-[10px] text-stone-500">VAT Reg: IE9823419H &bull; Tel: +353 1 234 5678</p>
              </div>

              <div className="text-[11px] space-y-1 border-b border-dashed border-stone-400 pb-2">
                <div className="flex justify-between">
                  <span>TICKET:</span>
                  <span className="font-bold">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>TIME:</span>
                  <span>{order.createdAt} ({order.elapsedMinutes}m elapsed)</span>
                </div>
                <div className="flex justify-between">
                  <span>ORDER TYPE:</span>
                  <span className="font-bold uppercase">{order.diningType}</span>
                </div>
                <div className="flex justify-between">
                  <span>CUSTOMER:</span>
                  <span>{order.customerName}</span>
                </div>
                {order.deliveryAddress && (
                  <div className="text-[10px] text-stone-700">
                    ADDR: {order.deliveryAddress}
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-1.5 border-b border-dashed border-stone-400 pb-3 text-xs">
                {order.items.map((i) => (
                  <div key={i.id}>
                    <div className="flex justify-between">
                      <span>{i.quantity}x {i.name}</span>
                      <span>€{(i.price * i.quantity).toFixed(2)}</span>
                    </div>
                    {i.customizations && (
                      <p className="text-[10px] text-stone-600 pl-2">
                        &gt; {i.customizations.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Financials */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>SUBTOTAL:</span>
                  <span>€{(order.totalAmount - (order.diningType === 'delivery' ? 2 : 0)).toFixed(2)}</span>
                </div>
                {order.diningType === 'delivery' && (
                  <div className="flex justify-between text-stone-600">
                    <span>DELIVERY:</span>
                    <span>€2.00</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-stone-300">
                  <span>TOTAL:</span>
                  <span>€{order.totalAmount.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-stone-500 text-center pt-1">
                  PAID VIA {paymentLabel} (APPROVED)
                </p>
              </div>

              {order.notes && (
                <div className="bg-amber-50 p-2 rounded border border-amber-200 text-[11px] text-amber-900">
                  <strong>NOTE:</strong> {order.notes}
                </div>
              )}

              <div className="text-center text-[10px] text-stone-400 pt-2">
                *** THANK YOU FOR DINING AT AMBER SPICE ***
              </div>
            </div>
          )}
        </div>

        {/* Footer (Figma node #24057:12496) */}
        <div className="border-t border-[#F5F5F4] bg-[#FAFAF9]/80 px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
          {/* View Toggles */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`h-8 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-[#1C1917] text-white shadow-2xs'
                  : 'text-[#57534E] hover:bg-stone-200/50'
              }`}
            >
              Order Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('slip')}
              className={`h-8 px-3 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                activeTab === 'slip'
                  ? 'bg-[#1C1917] text-white shadow-2xs'
                  : 'text-[#57534E] hover:bg-stone-200/50'
              }`}
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>Thermal Slip</span>
            </button>
          </div>

          {/* Quick Actions & Print */}
          <div className="flex items-center gap-2">
            {onUpdateStatus && order.status === 'pending' && (
              <button
                type="button"
                onClick={() => {
                  onUpdateStatus(order.id, 'preparing')
                  onClose()
                }}
                className="h-8 px-3 rounded-lg bg-[#F15A24] text-xs font-semibold text-white shadow-2xs hover:brightness-105 active:scale-95 transition cursor-pointer"
              >
                Fire Ticket
              </button>
            )}

            {onUpdateStatus && order.status === 'preparing' && (
              <button
                type="button"
                onClick={() => {
                  onUpdateStatus(order.id, 'ready')
                  onClose()
                }}
                className="h-8 px-3 rounded-lg bg-[#059669] text-xs font-semibold text-white shadow-2xs hover:bg-[#047857] active:scale-95 transition cursor-pointer"
              >
                Mark Ready
              </button>
            )}

            {onUpdateStatus && order.status === 'ready' && (
              <button
                type="button"
                onClick={() => {
                  onUpdateStatus(order.id, 'delivered')
                  onClose()
                }}
                className="h-8 px-3 rounded-lg bg-[#1C1917] text-xs font-semibold text-white shadow-2xs hover:bg-stone-800 active:scale-95 transition cursor-pointer"
              >
                Handover
              </button>
            )}

            {/* Print Button (Figma node #24057:12503) */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-[#E7E5E4] bg-white px-2.5 text-xs font-medium text-[#292524] shadow-2xs hover:border-[#F15A24] hover:text-[#F15A24] transition cursor-pointer disabled:opacity-50"
            >
              {printSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Printed</span>
                </>
              ) : isPrinting ? (
                <>
                  <Clock className="h-3.5 w-3.5 animate-spin text-[#F15A24]" />
                  <span>Printing...</span>
                </>
              ) : (
                <>
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Ticket</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
