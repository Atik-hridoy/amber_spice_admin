import { useState } from 'react'
import { Header } from './components/layout/header'
import { Sidebar } from './components/layout/sidebar'
import { KitchenKdsView } from './components/kitchen/kitchen-kds-view'
import { OrdersView } from './components/orders/orders-view'
import { TablesView } from './components/tables/tables-view'
import { AnalyticsView } from './components/analytics/analytics-view'
import { InventoryView } from './components/inventory/inventory-view'
import { ProductsView } from './components/products/products-view'
import { CustomersView } from './components/customers/customers-view'
import { StaffView } from './components/staff/staff-view'
import {
  ANALYTICS_DATA,
  INITIAL_CUSTOMERS,
  INITIAL_INVENTORY,
  INITIAL_MENU_ITEMS,
  INITIAL_ORDERS,
  INITIAL_STAFF,
  INITIAL_TABLES,
} from './data/mock-admin-data'
import type {
  AdminView,
  Customer,
  InventoryItem,
  MenuItem,
  Order,
  OrderStatus,
  StaffMember,
  TableItem,
} from './types/admin'

export default function App() {
  const [activeView, setActiveView] = useState<AdminView>('kitchen')
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS)
  const [tables, setTables] = useState<TableItem[]>(INITIAL_TABLES)
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS)
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF)
  const [customers] = useState<Customer[]>(INITIAL_CUSTOMERS)
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Derived counts
  const activeKitchenCount = orders.filter(
    (o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready'
  ).length
  const lowStockCount = inventory.filter((i) => i.status !== 'optimal').length

  // Action handlers
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    )
  }

  const handleUpdateTableStatus = (
    tableId: string,
    status: 'available' | 'occupied' | 'reserved'
  ) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? {
              ...t,
              status,
              guestName: status === 'available' ? undefined : t.guestName,
              currentOrder: status === 'available' ? undefined : t.currentOrder,
            }
          : t
      )
    )
  }

  const handleRestockItem = (itemId: string, addAmount: number) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const newStock = item.currentStock + addAmount
          return {
            ...item,
            currentStock: newStock,
            status: newStock >= item.minimumStock ? 'optimal' : 'low',
            lastRestocked: 'Just now',
          }
        }
        return item
      })
    )
  }

  const handleToggleAvailability = (itemId: string) => {
    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item
      )
    )
  }

  const handleUpdateStaffStatus = (
    staffId: string,
    status: 'active' | 'break' | 'off-duty'
  ) => {
    setStaff((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, status } : s))
    )
  }

  return (
    <div className="min-h-screen bg-[#FBF9F7] text-[#1A130E] flex">
      {/* Collapsible Left Sidebar */}
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        activeKitchenCount={activeKitchenCount}
        lowStockCount={lowStockCount}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Container Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Sticky Header */}
        <Header
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeOrdersCount={activeKitchenCount}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {activeView === 'kitchen' && (
            <KitchenKdsView
              orders={orders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onAddTicket={(ticket) => setOrders((prev) => [ticket, ...prev])}
            />
          )}

          {activeView === 'orders' && (
            <OrdersView
              orders={orders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
            />
          )}

          {activeView === 'tables' && (
            <TablesView
              tables={tables}
              onUpdateTableStatus={handleUpdateTableStatus}
            />
          )}

          {activeView === 'analytics' && (
            <AnalyticsView analytics={ANALYTICS_DATA} />
          )}

          {activeView === 'inventory' && (
            <InventoryView
              inventory={inventory}
              onRestockItem={handleRestockItem}
            />
          )}

          {activeView === 'products' && (
            <ProductsView
              items={menuItems}
              onToggleAvailability={handleToggleAvailability}
            />
          )}

          {activeView === 'customers' && (
            <CustomersView customers={customers} />
          )}

          {activeView === 'staff' && (
            <StaffView
              staff={staff}
              onUpdateStaffStatus={handleUpdateStaffStatus}
            />
          )}

          {activeView === 'transactions' && (
            <OrdersView
              orders={orders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
            />
          )}
        </main>
      </div>
    </div>
  )
}
