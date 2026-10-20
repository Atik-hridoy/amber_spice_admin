import { useState } from 'react'
import { Crown, Download, Mail, Phone, Search } from 'lucide-react'
import type { Customer } from '../../types/admin'

interface CustomersViewProps {
  customers: Customer[]
}

export function CustomersView({ customers }: CustomersViewProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  )

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, email or phone..."
            className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] py-2 pl-10 pr-4 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#B84A22] focus:bg-white focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => alert('Customer guest list exported as CSV!')}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
        >
          <Download className="h-4 w-4 text-stone-500" />
          <span>Export Guest List</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-stone-200 bg-stone-50 text-[11px] font-bold tracking-wider text-stone-500 uppercase">
              <tr>
                <th className="px-5 py-3.5">Customer Name</th>
                <th className="px-5 py-3.5">Contact Details</th>
                <th className="px-5 py-3.5">Orders Frequency</th>
                <th className="px-5 py-3.5">Lifetime Spend</th>
                <th className="px-5 py-3.5">VIP Loyalty</th>
                <th className="px-5 py-3.5">Last Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((customer) => (
                <tr key={customer.id} className="hover:bg-stone-50/70 transition">
                  <td className="px-5 py-4 font-bold text-stone-900">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 font-bold text-stone-700">
                        {customer.name.charAt(0)}
                      </div>
                      <span>{customer.name}</span>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-stone-600">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3 text-stone-400" />
                      <span>{customer.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-stone-400">
                      <Phone className="h-3 w-3" />
                      <span>{customer.phone}</span>
                    </div>
                  </td>

                  <td className="px-5 py-4 font-semibold text-stone-900">
                    {customer.ordersCount} Orders
                  </td>

                  <td className="px-5 py-4 font-mono font-bold text-[#B84A22]">
                    €{customer.totalSpent.toFixed(2)}
                  </td>

                  <td className="px-5 py-4">
                    {customer.isVip ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                        <Crown className="h-3 w-3 text-amber-500" />
                        <span>VIP Gold Member</span>
                      </span>
                    ) : (
                      <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-semibold text-stone-600">
                        Regular Guest
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-stone-500">
                    {customer.lastOrderDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
