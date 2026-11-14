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
import { RolesManagementView } from './components/roles/roles-management-view'
import { ApiTesterView } from './components/api-tester/api-tester-view'
import { AdminLoginView } from './components/auth/admin-login-view'
import {
  ANALYTICS_DATA,
  INITIAL_CUSTOMERS,
  INITIAL_INVENTORY,
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
  Order,
  OrderStatus,
  Promotion,
  StaffMember,
  SystemAlert,
  TableItem,
  WastageRecord,
} from './types/admin'
import { getDefaultViewForRole, isViewAllowed } from './utils/roles'
import { clearAdminSession, getStoredAdminUser } from './services/admin-session'

const INITIAL_ALERTS: SystemAlert[] = [
  {
    id: 'alert-1',
    title: '⚠️ Low Stock: Pure Saffron Threads (~20% left)',
    message: 'Chef Marco flagged: Saffron running low before dinner rush. Restock needed.',
    type: 'stock_low',
    timestamp: '12m ago',
    senderRole: 'chef',
    senderName: 'Chef Marco Rossi',
    read: false,
  },
  {
    id: 'alert-2',
    title: '⚠️ Low Stock: Organic Fresh Cream & Ghee (~10% left)',
    message: 'Only 8 litres remaining in chill walk-in.',
    type: 'stock_critical',
    timestamp: '25m ago',
    senderRole: 'chef',
    senderName: 'Sous Chef Vikram',
    read: false,
  },
]

export default function App() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(getStoredAdminUser)

  const [requestedView, setActiveView] = useState<AdminView>(() => {
    return currentUser ? getDefaultViewForRole(currentUser.role) : 'kitchen'
  })
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS)
  const [tables, setTables] = useState<TableItem[]>(INITIAL_TABLES)
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY)
  const [promotions, setPromotions] = useState<Promotion[]>(INITIAL_PROMOTIONS)
  const [, setWastageRecords] = useState<WastageRecord[]>([])
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF)
  const [customers] = useState<Customer[]>(INITIAL_CUSTOMERS)
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [alerts, setAlerts] = useState<SystemAlert[]>(INITIAL_ALERTS)

  const activeView = currentUser && !isViewAllowed(requestedView, currentUser)
    ? getDefaultViewForRole(currentUser.role)
    : requestedView

  const handleSelectView = (view: AdminView) => {
    if (isViewAllowed(view, currentUser)) {
      setActiveView(view)
    }
  }

  const handleLogout = () => {
    clearAdminSession()
    setCurrentUser(null)
  }

  // Chef Reports Low Stock -> Broadcasts alert and marks inventory
  const handleReportLowStock = (data: {
    ingredientName: string
    stockRemainingPercent: number
    note: string
  }) => {
    const newAlert: SystemAlert = {
      id: `alert-${Date.now()}`,
      title: `⚠️ Low Stock: ${data.ingredientName} (~${data.stockRemainingPercent}% left)`,
      message: data.note,
      type: data.stockRemainingPercent <= 10 ? 'stock_critical' : 'stock_low',
      timestamp: 'Just now',
      senderRole: 'chef',
      senderName: currentUser?.fullName || 'Chef Marco',
      read: false,
    }
    setAlerts((prev) => [newAlert, ...prev])

    // Update matching inventory item to low or critical
    setInventory((prev) =>
      prev.map((item) => {
        if (
          item.name.toLowerCase().includes(data.ingredientName.toLowerCase()) ||
          data.ingredientName.toLowerCase().includes(item.name.toLowerCase())
        ) {
          return {
            ...item,
            status: data.stockRemainingPercent <= 10 ? 'critical' : 'low',
          }
        }
        return item
      })
    )
  }

  // Staff forwards placed order to Chef
  const handleForwardToChef = (order: Order) => {
    const fwdAlert: SystemAlert = {
      id: `alert-fwd-${Date.now()}`,
      title: `👨‍🍳 Order ${order.orderNumber} Transmitted to Kitchen`,
      message: `${order.customerName}'s order (${order.items.length} dishes) forwarded to Chef's active prep queue.`,
      type: 'order_forwarded',
      timestamp: 'Just now',
      senderRole: 'staff',
      senderName: currentUser?.fullName || 'Operations Staff',
      read: false,
    }
    setAlerts((prev) => [fwdAlert, ...prev])
  }

  const handleDismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
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

  const handleAddStaffMember = (newMember: StaffMember) => {
    setStaff((prev) => [newMember, ...prev])
  }

  const handleDeleteStaffMember = (staffId: string) => {
    setStaff((prev) => prev.filter((s) => s.id !== staffId))
  }

  if (!currentUser) {
    return (
      <AdminLoginView
        onLoginSuccess={(user) => {
          setCurrentUser(user)
          setActiveView(getDefaultViewForRole(user.role))
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#FBF9F7] text-[#1A130E] flex">
      {/* Collapsible Left Sidebar */}
      <Sidebar
        activeView={activeView}
        onSelectView={handleSelectView}
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
          alerts={alerts}
          onDismissAlert={handleDismissAlert}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {activeView === 'kitchen' && (
            <KitchenKdsView
              orders={orders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onAddTicket={(ticket) => setOrders((prev) => [ticket, ...prev])}
              onReportLowStock={handleReportLowStock}
              inventoryList={inventory}
            />
          )}

          {activeView === 'orders' && (
            <OrdersView
              orders={orders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onForwardToChef={handleForwardToChef}
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
              currentUser={currentUser}
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
              onAddStaffMember={handleAddStaffMember}
              onDeleteStaffMember={handleDeleteStaffMember}
            />
          )}

          {activeView === 'roles' && (
            <RolesManagementView currentUser={currentUser} />
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
