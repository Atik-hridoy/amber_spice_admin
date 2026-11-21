import { useState, type FormEvent } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import type { TableItem } from '../../types/admin'

interface TablesViewProps {
  tables: TableItem[]
  onUpdateTableStatus: (tableId: string, status: 'available' | 'occupied' | 'reserved') => void
  onSeatWalkin?: (tableId: string, guestName: string, timeSlot?: string) => Promise<void>
  onClearTable?: (tableId: string) => Promise<void>
}

export function TablesView({
  tables,
  onUpdateTableStatus,
  onSeatWalkin,
  onClearTable,
}: TablesViewProps) {
  const [filter, setFilter] = useState<'all' | 'available' | 'occupied' | 'reserved'>('all')

  // Walk-in modal state
  const [isWalkinModalOpen, setIsWalkinModalOpen] = useState(false)
  const [selectedTableId, setSelectedTableId] = useState<string>('')
  const [walkinGuestName, setWalkinGuestName] = useState('Walk-in Guest')
  const [walkinTimeSlot, setWalkinTimeSlot] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  )
  const [isSubmittingWalkin, setIsSubmittingWalkin] = useState(false)
  const [modalError, setModalError] = useState('')

  const availableTables = tables.filter((t) => t.status === 'available')
  const occupiedCount = tables.filter((t) => t.status === 'occupied').length
  const reservedCount = tables.filter((t) => t.status === 'reserved').length
  const availableCount = availableTables.length

  const filteredTables = tables.filter((table) => {
    if (filter === 'all') return true
    return table.status === filter
  })

  const openWalkinModal = (preselectedTableId?: string) => {
    const tableId = preselectedTableId || (availableTables[0]?.id ? String(availableTables[0].id) : '')
    setSelectedTableId(tableId)
    setWalkinGuestName('Walk-in Guest')
    setWalkinTimeSlot(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    setModalError('')
    setIsWalkinModalOpen(true)
  }

  const handleSeatWalkinSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedTableId) {
      setModalError('Please select an available table.')
      return
    }

    setIsSubmittingWalkin(true)
    setModalError('')
    try {
      if (onSeatWalkin) {
        await onSeatWalkin(selectedTableId, walkinGuestName.trim() || 'Walk-in Guest', walkinTimeSlot)
      } else {
        onUpdateTableStatus(selectedTableId, 'occupied')
      }
      setIsWalkinModalOpen(false)
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Unable to seat guest.')
    } finally {
      setIsSubmittingWalkin(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Floor Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Available Tables</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-stone-900">{availableCount}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Ready for immediate seating</span>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Currently Seated</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-stone-900">{occupiedCount}</p>
          <span className="text-[11px] text-amber-600 font-medium">Active dining guests</span>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Booked &amp; Reserved</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <CalendarDays className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-stone-900">{reservedCount}</p>
          <span className="text-[11px] text-blue-600 font-medium">Upcoming reservations</span>
        </div>
      </div>

      {/* Filter Tabs & Walk-in Action */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          {(['all', 'available', 'occupied', 'reserved'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold capitalize transition cursor-pointer ${
                filter === tab
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => openWalkinModal()}
          disabled={availableCount === 0}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#B84A22] to-[#FBA138] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:brightness-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Seat Walk-in Guest</span>
        </button>
      </div>

      {/* Tables Grid Layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTables.map((table) => {
          const isOccupied = table.status === 'occupied'
          const isReserved = table.status === 'reserved'

          return (
            <div
              key={table.id}
              className={`flex flex-col justify-between rounded-2xl border p-4 shadow-2xs transition-all ${
                isOccupied
                  ? 'border-amber-300 bg-amber-50/40 ring-1 ring-amber-300/30'
                  : isReserved
                  ? 'border-blue-300 bg-blue-50/40'
                  : 'border-stone-200 bg-white hover:border-emerald-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-serif text-base font-bold text-stone-900">
                    Table {table.number}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      isOccupied
                        ? 'bg-amber-100 text-amber-800'
                        : isReserved
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {table.status}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-1.5 text-xs text-stone-500">
                  <Users className="h-3.5 w-3.5" />
                  <span>{table.capacity} Seats Capacity</span>
                </div>

                {table.guestName && (
                  <div className="mt-3 rounded-xl bg-white/80 p-2.5 text-xs border border-stone-200/60 space-y-0.5">
                    <p className="font-bold text-stone-900 truncate">{table.guestName}</p>
                    {table.timeSlot && (
                      <p className="text-[10px] text-stone-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{table.timeSlot}</span>
                      </p>
                    )}
                    {table.currentOrder && (
                      <p className="text-[10px] text-[#B84A22] font-mono font-bold">
                        Order #{table.currentOrder}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Status Action Buttons */}
              <div className="mt-4 pt-3 border-t border-stone-100 flex flex-col gap-1.5">
                {table.status === 'available' && (
                  <button
                    type="button"
                    onClick={() => openWalkinModal(String(table.id))}
                    className="w-full rounded-lg bg-[#B84A22] py-1.5 text-xs font-semibold text-white hover:bg-[#9E3E1C] transition cursor-pointer"
                  >
                    Seat Guest
                  </button>
                )}

                {table.status === 'reserved' && (
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => onUpdateTableStatus(String(table.id), 'occupied')}
                      className="flex-1 rounded-lg bg-emerald-700 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 transition cursor-pointer"
                    >
                      Seat Party
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (onClearTable) onClearTable(String(table.id))
                        else onUpdateTableStatus(String(table.id), 'available')
                      }}
                      className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition cursor-pointer"
                      title="Release table / mark no-show"
                    >
                      Release
                    </button>
                  </div>
                )}

                {table.status === 'occupied' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onClearTable) onClearTable(String(table.id))
                      else onUpdateTableStatus(String(table.id), 'available')
                    }}
                    className="w-full rounded-lg border border-stone-300 bg-white py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:border-emerald-500 hover:text-emerald-700 transition cursor-pointer"
                  >
                    Clear &amp; Sanitize Table
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Seat Walk-in Guest Modal */}
      {isWalkinModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsWalkinModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#B84A22]" /> Seat Walk-in Guest
              </h3>
              <button
                type="button"
                onClick={() => setIsWalkinModalOpen(false)}
                className="rounded-lg p-1 text-stone-400 hover:text-stone-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-800">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSeatWalkinSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700">Select Available Table</label>
                <select
                  value={selectedTableId}
                  onChange={(e) => setSelectedTableId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-xs text-stone-900 focus:border-[#B84A22] focus:outline-none"
                  required
                >
                  {availableTables.map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      Table {t.number} ({t.capacity} Seats)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Guest Name / Party Title</label>
                <input
                  type="text"
                  placeholder="e.g. Liam Smith or Walk-in (Party of 2)"
                  value={walkinGuestName}
                  onChange={(e) => setWalkinGuestName(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-xs text-stone-900 focus:border-[#B84A22] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Seating Time</label>
                <input
                  type="text"
                  value={walkinTimeSlot}
                  onChange={(e) => setWalkinTimeSlot(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-xs text-stone-900 focus:border-[#B84A22] focus:outline-none"
                />
              </div>

              <div className="mt-5 pt-3 border-t border-stone-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsWalkinModalOpen(false)}
                  className="flex-1 rounded-xl border border-stone-300 bg-white py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWalkin}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#B84A22] to-[#FBA138] py-2.5 text-xs font-bold text-white shadow-xs hover:brightness-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingWalkin ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Seat Now</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
