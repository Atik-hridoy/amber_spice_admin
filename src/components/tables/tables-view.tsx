import { useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Plus,
  Users,
} from 'lucide-react'
import type { TableItem } from '../../types/admin'

interface TablesViewProps {
  tables: TableItem[]
  onUpdateTableStatus: (tableId: string, status: 'available' | 'occupied' | 'reserved') => void
}

export function TablesView({ tables, onUpdateTableStatus }: TablesViewProps) {
  const [filter, setFilter] = useState<'all' | 'available' | 'occupied' | 'reserved'>('all')

  const filteredTables = tables.filter((table) => {
    if (filter === 'all') return true
    return table.status === filter
  })

  const occupiedCount = tables.filter((t) => t.status === 'occupied').length
  const reservedCount = tables.filter((t) => t.status === 'reserved').length
  const availableCount = tables.filter((t) => t.status === 'available').length

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
            <span className="text-xs font-semibold text-stone-500">Booked & Reserved</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <CalendarDays className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-stone-900">{reservedCount}</p>
          <span className="text-[11px] text-blue-600 font-medium">Upcoming tonight</span>
        </div>
      </div>

      {/* Filter Tabs */}
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
          onClick={() => alert('New Walk-in seated!')}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#B84A22] to-[#FBA138] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:brightness-105 active:scale-95 cursor-pointer"
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
                    {table.number}
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
                  <div className="mt-3 rounded-xl bg-white/80 p-2 text-xs border border-stone-200/60">
                    <p className="font-semibold text-stone-900">{table.guestName}</p>
                    {table.timeSlot && (
                      <p className="text-[10px] text-stone-500 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        <span>{table.timeSlot}</span>
                      </p>
                    )}
                    {table.currentOrder && (
                      <p className="text-[10px] text-[#B84A22] font-mono font-bold mt-0.5">
                        Order {table.currentOrder}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Status Action Buttons */}
              <div className="mt-4 pt-3 border-t border-stone-100 flex gap-1.5">
                {table.status === 'available' ? (
                  <button
                    type="button"
                    onClick={() => onUpdateTableStatus(table.id, 'occupied')}
                    className="flex-1 rounded-lg bg-[#B84A22] py-1.5 text-xs font-semibold text-white hover:bg-[#9E3E1C] transition cursor-pointer"
                  >
                    Seat Table
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onUpdateTableStatus(table.id, 'available')}
                    className="flex-1 rounded-lg border border-stone-200 bg-white py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                  >
                    Clear Table
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
