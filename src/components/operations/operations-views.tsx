import { useCallback, useEffect, useState } from 'react'
import { adminRequest } from '../../services/api-client'
import { listRecords } from '../../services/resource-service'
import { ResourcePanel, type ResourceField } from '../common/resource-panel'
import { TablesView } from '../tables/tables-view'
import type { TableItem } from '../../types/admin'

const fields = (definitions: [string, string, ResourceField['type']?, boolean?, string[]?][]): ResourceField[] => definitions.map(([key, label, type, required, options]) => ({ key, label, type, required, options, defaultValue: ['isActive', 'is_active', 'ordering_enabled'].includes(key) ? true : undefined }))
const columns = (definitions: [string, string][]) => definitions.map(([key, label]) => ({ key, label }))

function LiveFloorPlanPanel() {
  const [tables, setTables] = useState<TableItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadTables = useCallback(async () => {
    try {
      setLoading(true)
      const data = await listRecords<TableItem>('reservations/tables/')
      setTables(data)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load floor plan.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTables()
  }, [loadTables])

  const handleUpdateStatus = async (tableId: string, status: 'available' | 'occupied' | 'reserved') => {
    try {
      await adminRequest(`reservations/tables/${tableId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      await loadTables()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update table status')
    }
  }

  const handleSeatWalkin = async (tableId: string, guestName: string, timeSlot?: string) => {
    await adminRequest(`reservations/tables/${tableId}/seat_walkin/`, {
      method: 'POST',
      body: JSON.stringify({ guestName, timeSlot }),
    })
    await loadTables()
  }

  const handleClearTable = async (tableId: string) => {
    await adminRequest(`reservations/tables/${tableId}/clear_table/`, {
      method: 'POST',
    })
    await loadTables()
  }

  if (loading) {
    return <div className="p-8 text-center text-xs text-stone-500">Loading live restaurant floor plan...</div>
  }
  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm font-semibold text-red-600">{error}</p>
        <button onClick={loadTables} className="mt-2 text-xs font-bold text-[#B84A22] underline cursor-pointer">
          Retry floor plan
        </button>
      </div>
    )
  }

  return (
    <TablesView
      tables={tables}
      onUpdateTableStatus={handleUpdateStatus}
      onSeatWalkin={handleSeatWalkin}
      onClearTable={handleClearTable}
    />
  )
}

export function TablesBookingsView() {
  const [tab, setTab] = useState<'floor' | 'reservations' | 'tables'>('floor')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-3">
        {[
          { id: 'floor', label: '🍽️ Live Floor Plan & Seating' },
          { id: 'reservations', label: '📅 Reservations & Bookings' },
          { id: 'tables', label: '🪑 Table Directory & Settings' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as 'floor' | 'reservations' | 'tables')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              tab === t.id
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'floor' && <LiveFloorPlanPanel />}
      {tab === 'reservations' && (
        <ResourcePanel
          title="Reservations"
          endpoint="reservations/bookings/"
          canCreate
          fields={[
            ...fields([
              ['guestName', 'Guest name', 'text', true],
              ['guestPhone', 'Phone', 'text', true],
              ['guestEmail', 'Email', 'email'],
              ['guestsCount', 'Guests', 'number', true],
              ['reservationDate', 'Date', 'date', true],
              ['timeSlot', 'Time', 'time', true],
              ['specialRequests', 'Special requests', 'textarea'],
              ['status', 'Status', 'select', true, ['pending', 'confirmed', 'cancelled', 'completed']],
            ]),
            { key: 'table', label: 'Table', source: { endpoint: 'reservations/tables/', label: 'number' } },
          ]}
          columns={columns([
            ['booking_reference', 'Booking reference'],
            ['guestName', 'Guest'],
            ['guestPhone', 'Phone'],
            ['guestsCount', 'Guests'],
            ['reservationDate', 'Date'],
            ['timeSlot', 'Time'],
            ['status', 'Status'],
            ['table', 'Table ID'],
          ])}
        />
      )}
      {tab === 'tables' && (
        <ResourcePanel
          title="Tables"
          endpoint="reservations/tables/"
          canCreate
          fields={fields([
            ['number', 'Table number', 'text', true],
            ['capacity', 'Seats', 'number', true],
            ['status', 'Status', 'select', true, ['available', 'occupied', 'reserved']],
            ['guestName', 'Guest name'],
            ['timeSlot', 'Time slot'],
          ])}
          columns={columns([
            ['number', 'Table'],
            ['capacity', 'Seats'],
            ['status', 'Status'],
            ['guestName', 'Guest'],
            ['currentOrder', 'Current order'],
          ])}
        />
      )}
    </div>
  )
}

export function StaffAccountsView() {
  return <div className="space-y-10">
    <ResourcePanel title="Staff accounts" endpoint="auth/staff/" canCreate
      fields={fields([['first_name', 'First name'], ['last_name', 'Last name'], ['email', 'Email', 'email', true], ['phone', 'Phone'], ['is_active', 'Account active', 'checkbox']])}
      createFields={fields([['name', 'Full name', 'text', true], ['email', 'Email', 'email', true], ['phone', 'Phone'], ['password', 'Initial password', 'password', true], ['role', 'System role', 'select', true, ['manager', 'admin', 'staff', 'chef', 'kitchen_staff', 'delivery_staff', 'cashier_front']], ['shift', 'Shift', 'select', true, ['Morning (10:00 - 16:00)', 'Evening (16:00 - 23:00)', 'Full Day']], ['assigned_section', 'Assigned section']])}
      columns={columns([['fullName', 'Name'], ['email', 'Email'], ['roleDisplay', 'System role'], ['phone', 'Phone'], ['is_active', 'Active']])} />
    <ResourcePanel title="Staff roster" endpoint="staff/" canCreate fields={[
      ...fields([['name', 'Name', 'text', true], ['role', 'Position', 'select', true, ['Head Chef', 'Sous Chef', 'Station Cook', 'Floor Manager', 'Host', 'Server']], ['shift', 'Shift', 'select', true, ['Morning (10:00 - 16:00)', 'Evening (16:00 - 23:00)', 'Full Day']], ['status', 'Status', 'select', true, ['active', 'break', 'off-duty']], ['assignedSection', 'Section', 'text', true], ['phone', 'Phone']]),
      { key: 'user', label: 'Linked account', source: { endpoint: 'auth/staff/', label: 'fullName' } },
    ]} columns={columns([['name', 'Name'], ['role', 'Position'], ['shift', 'Shift'], ['status', 'Status'], ['assignedSection', 'Section'], ['phone', 'Phone']])} />
  </div>
}

import { ContactInquiriesTab } from '../customers/contact-inquiries-tab'
import { Mail, Users } from 'lucide-react'

export function CustomersDirectoryView({
  selectedInquiryId,
  onClearSelectedInquiry,
}: {
  selectedInquiryId?: number | string | null
  onClearSelectedInquiry?: () => void
} = {}) {
  const [subTab, setSubTab] = useState<'directory' | 'inquiries'>(selectedInquiryId ? 'inquiries' : 'directory')

  useEffect(() => {
    if (selectedInquiryId) {
      setSubTab('inquiries')
    }
  }, [selectedInquiryId])

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
        <button
          type="button"
          onClick={() => setSubTab('directory')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
            subTab === 'directory'
              ? 'bg-stone-900 text-white shadow-2xs'
              : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Customer Directory</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('inquiries')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
            subTab === 'inquiries'
              ? 'bg-stone-900 text-white shadow-2xs'
              : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
          }`}
        >
          <Mail className="h-4 w-4 text-[#F15A24]" />
          <span>Website Inquiries & Contact Messages</span>
        </button>
      </div>

      {subTab === 'directory' ? (
        <ResourcePanel
          title="Customers"
          endpoint="auth/customers/"
          columns={columns([
            ['name', 'Name'],
            ['email', 'Email'],
            ['phone', 'Phone'],
            ['orders_count', 'Orders'],
            ['total_spent', 'Paid spend'],
            ['is_vip', 'VIP'],
            ['last_order_date', 'Latest order'],
          ])}
        />
      ) : (
        <ContactInquiriesTab
          initialSelectedId={selectedInquiryId}
          onClearSelectedId={onClearSelectedInquiry}
        />
      )}
    </div>
  )
}

export function PromotionsLiveView() {
  return <ResourcePanel title="Promotions" endpoint="promotions/" canCreate fields={fields([
    ['code', 'Voucher code', 'text', true], ['title', 'Title', 'text', true], ['description', 'Description', 'textarea'], ['discountType', 'Discount type', 'select', true, ['percentage', 'fixed']], ['discountValue', 'Discount value', 'number', true], ['minSpend', 'Minimum spend', 'number', true], ['validUntil', 'Valid until', 'date', true], ['usageLimit', 'Usage limit', 'number', true], ['isActive', 'Active', 'checkbox'], ['firstOrderOnly', 'First signed-in order only', 'checkbox'], ['imageUrl', 'Banner image URL'], ['badge', 'Badge'],
  ])} columns={columns([['code', 'Code'], ['title', 'Title'], ['discountType', 'Type'], ['discountValue', 'Discount'], ['validUntil', 'Valid until'], ['usageCount', 'Used'], ['usageLimit', 'Limit'], ['isActive', 'Active']])} />
}

export function ContentManagementView() {
  const [tab, setTab] = useState('Hero Banners')
  return <div className="space-y-5"><div className="flex flex-wrap gap-2">{['Hero Banners', 'Restaurant', 'FAQ', 'Gallery', 'Reviews', 'Messages', 'Subscribers', 'Stock alerts', 'Wastage'].map(name => <button className={`rounded-xl border px-3 py-2 text-sm ${tab === name ? 'bg-stone-900 text-white' : 'bg-white'}`} key={name} onClick={() => setTab(name)}>{name}</button>)}</div>
    {tab === 'Hero Banners' && <ResourcePanel title="Hero Banners" endpoint="content/banners/" canCreate canDelete fields={fields([
      ['displayOrder', 'Sort Order (e.g. 1, 2, 3)', 'number', true],
      ['tag', 'Badge / Highlight Tag (e.g. WEEKEND SPECIAL)', 'text', true],
      ['titleLine1', 'Title Line 1', 'text', true],
      ['titleLine2', 'Title Line 2 (Highlighted)', 'text'],
      ['subtitle', 'Subtitle / Description', 'textarea'],
      ['ctaText', 'Button Text (e.g. Book a Table)', 'text', true],
      ['ctaLink', 'Button Action', 'select', true, ['reservation', 'menu', 'offers', 'about', 'contact', 'order']],
      ['imageUrl', 'Image URL / Asset Path', 'text', true],
      ['isActive', 'Active & Visible', 'checkbox'],
    ])} columns={columns([['displayOrder', 'Order'], ['tag', 'Badge'], ['titleLine1', 'Title 1'], ['titleLine2', 'Title 2'], ['ctaText', 'Button'], ['ctaLink', 'Action'], ['imageUrl', 'Image'], ['isActive', 'Active']])} />}
    {tab === 'Restaurant' && <ResourcePanel title="Restaurant profile" endpoint="content/restaurant/" canCreate singleton fields={fields([
      ['name', 'Restaurant name', 'text', true], ['story', 'About the restaurant', 'textarea'], ['phone', 'Contact phone'], ['email', 'Contact email', 'email'], ['address', 'Street address'], ['city', 'City'], ['opening_hours', 'Opening hours', 'textarea'], ['latitude', 'Map latitude', 'number'], ['longitude', 'Map longitude', 'number'], ['delivery_postcode_prefixes', 'Delivery postcode prefixes (comma separated)'], ['delivery_fee', 'Delivery fee', 'number', true], ['free_delivery_threshold', 'Free delivery food subtotal threshold', 'number', true], ['included_vat_percent', 'Included VAT percent', 'number', true], ['ordering_enabled', 'Accepting orders', 'checkbox'],
    ])} columns={columns([['name', 'Name'], ['phone', 'Phone'], ['address', 'Address'], ['delivery_fee', 'Delivery fee'], ['ordering_enabled', 'Accepting orders']])} />}
    {tab === 'FAQ' && <ResourcePanel title="FAQ" endpoint="content/faqs/" canCreate fields={fields([['question', 'Question', 'text', true], ['answer', 'Answer', 'textarea', true], ['category', 'Category', 'text', true], ['display_order', 'Display order', 'number', true], ['is_active', 'Visible', 'checkbox']])} columns={columns([['question', 'Question'], ['category', 'Category'], ['answer', 'Answer'], ['is_active', 'Visible']])} />}
    {tab === 'Gallery' && <ResourcePanel title="Gallery" endpoint="content/gallery/" canCreate fields={[...fields([['title', 'Title', 'text', true], ['tag', 'Tag'], ['description', 'Description', 'textarea'], ['category', 'Category', 'select', true, ['Signature Seafood Boils', 'Arabic Charcoal Grills', 'Indian Royal Curries', 'Artisanal Mezze & Chaat', 'Wok & Gourmet Specials']], ['imageUrl', 'Image URL', 'text', true], ['is_active', 'Visible', 'checkbox']]), { key: 'dish', label: 'Linked dish', source: { endpoint: 'menu/dishes/', label: 'name' } }]} columns={columns([['title', 'Title'], ['category', 'Category'], ['imageUrl', 'Image URL'], ['is_active', 'Visible']])} />}
    {tab === 'Reviews' && <ResourcePanel title="Reviews" endpoint="reviews/" fields={fields([['is_approved', 'Approved for public display', 'checkbox'], ['adminReply', 'Owner / Restaurant response', 'textarea']])} columns={columns([['name', 'Customer'], ['rating', 'Rating'], ['dish', 'Dish'], ['comment', 'Comment'], ['adminReply', 'Owner Reply'], ['verified', 'Verified order'], ['is_approved', 'Approved']])} />}
    {tab === 'Messages' && <ContactInquiriesTab />}
    {tab === 'Subscribers' && <ResourcePanel title="Newsletter subscribers" endpoint="newsletter/" columns={columns([['email', 'Email'], ['consent', 'Consent'], ['created_at', 'Subscribed at']])} />}
    {tab === 'Stock alerts' && <ResourcePanel title="Stock alerts" endpoint="inventory/alerts/" fields={fields([['resolved', 'Resolved', 'checkbox']])} columns={columns([['item_name', 'Ingredient'], ['stock_remaining_percent', 'Reported remaining %'], ['note', 'Note'], ['reporter_name', 'Reporter'], ['resolved', 'Resolved']])} />}
    {tab === 'Wastage' && <ResourcePanel title="Wastage" endpoint="inventory/wastage/" canCreate createFields={[{ key: 'item', label: 'Ingredient', required: true, source: { endpoint: 'inventory/items/', label: 'name' } }, ...fields([['quantity', 'Quantity in stock units', 'number', true], ['reason', 'Reason', 'text', true]])]} columns={columns([['item_name', 'Ingredient'], ['quantity', 'Quantity'], ['reason', 'Reason'], ['created_at', 'Recorded at']])} />}
  </div>
}

export { AnalyticsLiveView } from '../analytics/analytics-view'
