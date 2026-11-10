import { useState } from 'react'
import { Header } from './components/layout/header'
import { Sidebar } from './components/layout/sidebar'
import { KitchenKdsView } from './components/kitchen/kitchen-kds-view'
import { OrdersView } from './components/orders/orders-view'
import { TablesView } from './components/tables/tables-view'
import { AnalyticsView } from './components/analytics/analytics-view'
import { InventoryView } from './components/inventory/inventory-view'
import { ProductsView } from './components/products/products-view'
import { PromotionsView } from './components/promotions/promotions-view'
import { CustomersView } from './components/customers/customers-view'
import { StaffView } from './components/staff/staff-view'
import { ApiTesterView } from './components/api-tester/api-tester-view'
import { AdminLoginView } from './components/auth/admin-login-view'
import {
  ANALYTICS_DATA,
  INITIAL_CUSTOMERS,
  INITIAL_INVENTORY,
  INITIAL_MENU_ITEMS,
  INITIAL_ORDERS,
  INITIAL_PROMOTIONS,
  INITIAL_STAFF,
  INITIAL_TABLES,
} from './data/mock-admin-data'
import type {
  AdminUser,
  AdminView,
  Customer,
  InventoryItem,
  MenuItem,
  Order,
  OrderStatus,
  Promotion,
  StaffMember,
  TableItem,
  WastageRecord,
} from './types/admin'

export default function App() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => {
    try {
      const saved = localStorage.getItem('amber_admin_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const [activeView, setActiveView] = useState<AdminView>('kitchen')
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS)
  const [tables, setTables] = useState<TableItem[]>(INITIAL_TABLES)
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS)
  const [promotions, setPromotions] = useState<Promotion[]>(INITIAL_PROMOTIONS)
  const [, setWastageRecords] = useState<WastageRecord[]>([])
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF)
  const [customers] = useState<Customer[]>(INITIAL_CUSTOMERS)
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const handleLogout = () => {
    try {
      localStorage.removeItem('amber_admin_token')
      localStorage.removeItem('amber_admin_refresh')
      localStorage.removeItem('amber_admin_user')
    } catch {
      // ignore
    }
    setCurrentUser(null)
  }

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
          const newStock = Math.max(0, item.currentStock + addAmount)
          return {
            ...item,
            currentStock: newStock,
            status: newStock >= item.minimumStock ? 'optimal' : 'low',
            lastRestocked: addAmount > 0 ? 'Just now' : item.lastRestocked,
          }
        }
        return item
      })
    )
  }

  const handleLogWastage = (record: WastageRecord) => {
    setWastageRecords((prev) => [record, ...prev])
  }

  const handleToggleAvailability = (itemId: string) => {
    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item
      )
    )
  }

  const handleAddDish = (dish: MenuItem) => {
    setMenuItems((prev) => [dish, ...prev])
  }

  const handleUpdateDish = (dish: MenuItem) => {
    setMenuItems((prev) => prev.map((item) => (item.id === dish.id ? dish : item)))
  }

  const handleAddPromotion = (promo: Promotion) => {
    setPromotions((prev) => [promo, ...prev])
  }

  const handleUpdatePromotion = (promo: Promotion) => {
    setPromotions((prev) => prev.map((p) => (p.id === promo.id ? promo : p)))
  }

  const handleDeletePromotion = (id: string) => {
    if (confirm('Are you sure you want to delete this promotion voucher?')) {
      setPromotions((prev) => prev.filter((p) => p.id !== id))
    }
  }

  const handleTogglePromotionStatus = (id: string) => {
    setPromotions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
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

  if (!currentUser) {
    return <AdminLoginView onLoginSuccess={setCurrentUser} />
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
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Container Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Sticky Header */}
        <Header
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeOrdersCount={activeKitchenCount}
          currentUser={currentUser}
          onLogout={handleLogout}
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
              onLogWastage={handleLogWastage}
            />
          )}

          {activeView === 'products' && (
            <ProductsView
              items={menuItems}
              onToggleAvailability={handleToggleAvailability}
              onAddDish={handleAddDish}
              onUpdateDish={handleUpdateDish}
            />
          )}

          {activeView === 'promotions' && (
            <PromotionsView
              promotions={promotions}
              onAddPromotion={handleAddPromotion}
              onUpdatePromotion={handleUpdatePromotion}
              onDeletePromotion={handleDeletePromotion}
              onToggleStatus={handleTogglePromotionStatus}
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

          {activeView === 'api-tester' && <ApiTesterView />}
        </main>
      </div>
    </div>
  )
}
