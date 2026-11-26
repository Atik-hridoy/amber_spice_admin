import { useCallback, useEffect, useState } from 'react'
import { Header } from './components/layout/header'
import { Sidebar } from './components/layout/sidebar'
import { MobileAdminBottomNav } from './components/layout/mobile-bottom-nav'
import { KitchenKdsView } from './components/kitchen/kitchen-kds-view'
import { OrdersView } from './components/orders/orders-view'
import { InventoryView } from './components/inventory/inventory-view'
import { ProductsView } from './components/products/products-view'
import { RolesManagementView } from './components/roles/roles-management-view'
import { AdminLoginView } from './components/auth/admin-login-view'
import {
  AnalyticsLiveView,
  ContentManagementView,
  CustomersDirectoryView,
  StaffAccountsView,
  TablesBookingsView,
} from './components/operations/operations-views'
import { PromotionsLiveView } from './components/promotions/promotions-live-view'
import { AccountView } from './components/operations/account-view'
import type { AdminUser, AdminView, InventoryItem, Order, OrderStatus, SystemAlert } from './types/admin'
import { getAllowedViews, getDefaultViewForRole, isViewAllowed } from './utils/roles'
import { clearAdminSession, getStoredAdminUser } from './services/admin-session'
import { adminRequest } from './services/api-client'
import { listRecords } from './services/resource-service'
import { mapOrderFromApi, orderService } from './services/order-service'
import { inventoryService } from './services/inventory-service'
import { websocketService } from './services/websocket-service'
import { playCustomerArrivedAlert, playKitchenAlert, playOrderAlert, playStockAlert } from './services/audio-alert'
import { ToastStack, type ToastItem } from './components/notifications/toast-stack'
import { notificationService, type OperationalNotification } from './services/notification-service'

interface StockAlert {
  id: number
  item_name: string
  stock_remaining_percent: number
  note: string
  reporter_name: string
  created_at: string
  resolved: boolean
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(getStoredAdminUser)
  const [requestedView, setActiveView] = useState<AdminView>(() => getDefaultViewForRole(currentUser?.role))
  const [orders, setOrders] = useState<Order[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [alerts, setAlerts] = useState<SystemAlert[]>([])
  const [notifications, setNotifications] = useState<OperationalNotification[]>([])
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [wsConnected, setWsConnected] = useState(false)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState('')
  const [error, setError] = useState('')
  const [orderBusy, setOrderBusy] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [selectedInquiryId, setSelectedInquiryId] = useState<number | string | null>(null)

  const activeView =
    currentUser && !isViewAllowed(requestedView, currentUser)
      ? getAllowedViews(currentUser)[0] || 'account'
      : requestedView

  // Verify auth token on initial mount
  useEffect(() => {
    const stored = getStoredAdminUser()
    if (!stored) return
    const controller = new AbortController()
    adminRequest<AdminUser>('auth/me/', { requireAuth: true, signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setCurrentUser({ ...stored, ...data })
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        if (err.status === 401) {
          clearAdminSession()
          setCurrentUser(null)
        } else {
          setError('Unable to verify the account connection. Retry by reloading the portal.')
        }
      })
    return () => controller.abort()
  }, [])

  // Load orders for active views
  const loadOrders = useCallback(
    async (signal?: AbortSignal) => {
      if (!currentUser) return
      try {
        const live =
          currentUser.role === 'delivery_staff'
            ? await orderService.getDeliveryOrders(signal)
            : activeView === 'kitchen'
            ? await orderService.getKitchenOrders(undefined, signal)
            : await orderService.list(undefined, signal)
        if (!signal?.aborted) {
          setOrders(live)
          setOrdersError('')
        }
      } catch (err) {
        if (!signal?.aborted) setOrdersError(err instanceof Error ? err.message : 'Unable to load orders.')
      } finally {
        if (!signal?.aborted) setOrdersLoading(false)
      }
    },
    [currentUser, activeView]
  )

  useEffect(() => {
    setOrders([])
    if (!currentUser || !['kitchen', 'orders', 'transactions'].includes(activeView)) return
    const controller = new AbortController()
    setOrdersLoading(true)
    void loadOrders(controller.signal)
    const timer = window.setInterval(() => void loadOrders(controller.signal), 15000)
    return () => {
      controller.abort()
      window.clearInterval(timer)
    }
  }, [currentUser, activeView, loadOrders])

  // Load inventory and alerts
  const loadOperations = useCallback(
    async (signal?: AbortSignal) => {
      if (!currentUser) return
      const results = await Promise.allSettled([
        currentUser.permissions.includes('inventory:view') ? inventoryService.list(signal) : Promise.resolve([]),
        listRecords<StockAlert>('inventory/alerts/?resolved=false', signal),
      ])
      if (signal?.aborted) return
      if (results[0].status === 'fulfilled') setInventory(results[0].value)
      if (results[1].status === 'fulfilled') {
        setAlerts(
          results[1].value.map((row) => ({
            id: String(row.id),
            title: `Low stock: ${row.item_name}`,
            message: row.note,
            type: row.stock_remaining_percent <= 10 ? 'stock_critical' : 'stock_low',
            timestamp: new Date(row.created_at).toLocaleString(),
            senderName: row.reporter_name,
            read: row.resolved,
          }))
        )
      }
      const failed = results.find((result) => result.status === 'rejected')
      if (failed?.status === 'rejected') {
        setError(failed.reason instanceof Error ? failed.reason.message : 'Unable to load operations data.')
      }
    },
    [currentUser]
  )

  useEffect(() => {
    if (!currentUser) return
    const controller = new AbortController()
    void loadOperations(controller.signal)
    const timer = window.setInterval(() => void loadOperations(controller.signal), 20000)
    return () => {
      controller.abort()
      window.clearInterval(timer)
    }
  }, [currentUser, loadOperations])

  // Load initial notifications list
  useEffect(() => {
    if (!currentUser) return
    const controller = new AbortController()
    notificationService
      .list(false, controller.signal)
      .then((list) => {
        if (!controller.signal.aborted) setNotifications(list)
      })
      .catch(() => {
        // non-blocking
      })
    return () => controller.abort()
  }, [currentUser])

  // Real-time WebSocket connection lifecycle
  useEffect(() => {
    if (!currentUser) {
      websocketService.disconnect()
      setWsConnected(false)
      return
    }

    const channel =
      currentUser.role === 'chef' || currentUser.role === 'kitchen_staff' ? 'kitchen' : 'operations'
    websocketService.connect(channel)

    const unsubStatus = websocketService.on('connection.status', (status) => {
      setWsConnected(status.connected)
    })

    const unsubOrderCreated = websocketService.on('order.created', (event) => {
      const mapped = mapOrderFromApi(event.order)
      setOrders((prev) => [mapped, ...prev.filter((o) => o.id !== mapped.id)])
      playOrderAlert()

      const toastId = `ord-${mapped.id}-${Date.now()}`
      setToasts((prev) => [
        {
          id: toastId,
          title: `New Order #${mapped.orderNumber}`,
          message: `${mapped.customerName} placed a ${mapped.diningType.toUpperCase()} order for €${mapped.totalAmount.toFixed(2)}`,
          type: 'order_created',
          orderId: mapped.id,
          orderNumber: mapped.orderNumber,
          customerName: mapped.customerName,
          diningType: mapped.diningType,
          totalAmount: mapped.totalAmount,
          itemsCount: mapped.items.reduce((acc, it) => acc + it.quantity, 0),
        },
        ...prev,
      ])

      if (event.notification) {
        setNotifications((prev) => [
          {
            id: Number(event.notification!.id),
            type: 'order_created',
            title: String(event.notification!.title),
            message: String(event.notification!.message),
            targetRole: 'admin',
            orderId: Number(mapped.id),
            isRead: false,
            createdAt: String(event.notification!.createdAt || new Date().toISOString()),
          },
          ...prev,
        ])
      }
    })

    const unsubOrderStatus = websocketService.on('order.status_updated', (event) => {
      const mapped = mapOrderFromApi(event.order)
      setOrders((prev) => prev.map((o) => (o.id === mapped.id ? mapped : o)))

      if (event.notification) {
        setNotifications((prev) => [
          {
            id: Number(event.notification!.id),
            type: 'order_status',
            title: String(event.notification!.title),
            message: String(event.notification!.message),
            targetRole: 'all',
            orderId: Number(mapped.id),
            isRead: false,
            createdAt: String(event.notification!.createdAt || new Date().toISOString()),
          },
          ...prev,
        ])
      }
    })

    const unsubKitchenTicket = websocketService.on('kitchen.ticket_received', (event) => {
      const mapped = mapOrderFromApi(event.ticket)
      setOrders((prev) => [mapped, ...prev.filter((o) => o.id !== mapped.id)])

      if (['chef', 'kitchen_staff', 'super_admin', 'admin', 'manager'].includes(currentUser.role)) {
        playKitchenAlert()
      }

      const toastId = `kitch-${mapped.id}-${Date.now()}`
      setToasts((prev) => [
        {
          id: toastId,
          title: `Kitchen Ticket #${mapped.orderNumber}`,
          message: `${mapped.items.length} items sent for prep (${mapped.diningType.toUpperCase()})`,
          type: 'kitchen_ticket',
          orderId: mapped.id,
          orderNumber: mapped.orderNumber,
          customerName: mapped.customerName,
          diningType: mapped.diningType,
          itemsCount: mapped.items.reduce((acc, it) => acc + it.quantity, 0),
        },
        ...prev,
      ])

      if (event.notification) {
        setNotifications((prev) => [
          {
            id: Number(event.notification!.id),
            type: 'kitchen_alert',
            title: String(event.notification!.title),
            message: String(event.notification!.message),
            targetRole: 'kitchen',
            orderId: Number(mapped.id),
            isRead: false,
            createdAt: String(event.notification!.createdAt || new Date().toISOString()),
          },
          ...prev,
        ])
      }
    })

    const unsubKitchenTicketUpdated = websocketService.on('kitchen.ticket_updated', (event) => {
      const mapped = mapOrderFromApi(event.ticket)
      setOrders((prev) => prev.map((o) => (o.id === mapped.id ? mapped : o)))
    })

    const unsubCustomerArrived = websocketService.on('customer.arrived', (event) => {
      const mapped = mapOrderFromApi(event.order)
      setOrders((prev) => [mapped, ...prev.filter((o) => o.id !== mapped.id)])
      playCustomerArrivedAlert()

      const toastId = `arr-${mapped.id}-${Date.now()}`
      setToasts((prev) => [
        {
          id: toastId,
          title: `Customer at Counter! #${mapped.pickupCode || mapped.orderNumber}`,
          message: `${mapped.customerName} has arrived at the counter for Takeaway ${mapped.pickupCode || mapped.orderNumber}.`,
          type: 'customer_arrived',
          orderId: mapped.id,
          orderNumber: mapped.orderNumber,
          pickupCode: mapped.pickupCode,
          customerName: mapped.customerName,
          diningType: mapped.diningType,
          itemsCount: mapped.items.reduce((acc, it) => acc + it.quantity, 0),
        },
        ...prev,
      ])
    })

    const unsubReservationCreated = websocketService.on('reservation.created', (event) => {
      playOrderAlert()
      const res = event.reservation || {}
      const notifData = event.notification || {}
      const title = String(notifData.title || `Table Reserved: ${res.guestName || 'Guest'}`)
      const message = String(notifData.message || `${res.guestName} reserved Table ${res.tableNumber || ''} for ${res.guestsCount || 2} guests on ${res.reservationDate} at ${res.timeSlot}`)

      setNotifications((prev) => [
        {
          id: Number(notifData.id || Date.now()),
          type: 'reservation_created',
          title,
          message,
          targetRole: 'admin',
          createdAt: String(notifData.createdAt || new Date().toISOString()),
          isRead: false,
        },
        ...prev,
      ])

      setToasts((prev) => [
        {
          id: `res-${Date.now()}`,
          title: `📅 ${title}`,
          message,
          type: 'reservation_created',
        },
        ...prev,
      ])
    })

    const unsubReservationGuestArrived = websocketService.on('reservation.guest_arrived', (event) => {
      playCustomerArrivedAlert()
      const res = event.reservation || {}
      const notifData = event.notification || {}
      const title = String(notifData.title || `Dining Guest Arrived: Table ${res.tableNumber || ''}`)
      const message = String(notifData.message || `${res.guestName} (Party of ${res.guestsCount || 2}) checked in at reception for Table ${res.tableNumber}`)

      setNotifications((prev) => [
        {
          id: Number(notifData.id || Date.now()),
          type: 'customer_arrived',
          title,
          message,
          targetRole: 'admin',
          createdAt: String(notifData.createdAt || new Date().toISOString()),
          isRead: false,
        },
        ...prev,
      ])

      setToasts((prev) => [
        {
          id: `res-arr-${Date.now()}`,
          title: `🛎️ ${title}`,
          message,
          type: 'customer_arrived',
          customerName: String(res.guestName || ''),
          diningType: 'dine-in',
        },
        ...prev,
      ])
    })

    const unsubStockAlert = websocketService.on('stock.alert', (event) => {
      playStockAlert()
      const alertData = event.alert || {}
      const title = `Low stock: ${alertData.item_name || 'Ingredient'}`
      const message = String(alertData.note || 'Stock level is low')

      setAlerts((prev) => [
        {
          id: String(alertData.id || Date.now()),
          title,
          message,
          type: Number(alertData.stock_remaining_percent) <= 10 ? 'stock_critical' : 'stock_low',
          timestamp: new Date().toLocaleTimeString(),
          senderName: String(alertData.reporter_name || 'Kitchen Staff'),
          read: false,
        },
        ...prev,
      ])

      setToasts((prev) => [
        {
          id: `stock-${Date.now()}`,
          title,
          message,
          type: 'stock_alert',
        },
        ...prev,
      ])
    })

    const unsubContactMessage = websocketService.on('contact.message_created', (event) => {
      playOrderAlert()
      const msg = event.message || {}
      const notifData = event.notification || {}
      const title = String(notifData.title || `New Inquiry: ${msg.subject || 'Website Message'}`)
      const message = String(notifData.message || `${msg.fullName || 'Guest'} (${msg.email || ''}): ${msg.message || ''}`)

      setNotifications((prev) => [
        {
          id: Number(notifData.id || Date.now()),
          type: 'contact_message',
          title,
          message,
          targetRole: 'admin',
          data: { inquiryId: msg.id, ...msg },
          createdAt: String(notifData.createdAt || new Date().toISOString()),
          isRead: false,
        },
        ...prev,
      ])

      setToasts((prev) => [
        {
          id: `contact-${Date.now()}`,
          title,
          message,
          type: 'contact_message',
          inquiryId: msg.id ? String(msg.id) : undefined,
        },
        ...prev,
      ])
    })

    return () => {
      unsubStatus()
      unsubOrderCreated()
      unsubOrderStatus()
      unsubKitchenTicket()
      unsubKitchenTicketUpdated()
      unsubCustomerArrived()
      unsubReservationCreated()
      unsubReservationGuestArrived()
      unsubStockAlert()
      unsubContactMessage()
      websocketService.disconnect()
    }
  }, [currentUser])

  async function handleCompleteTakeaway(
    id: string,
    options?: { paymentMethod?: 'cash' | 'card' | 'apple-pay'; counterNotes?: string }
  ) {
    setOrderBusy(true)
    setError('')
    try {
      const saved = await orderService.completeTakeaway(id, options)
      setOrders((previous) => previous.map((order) => (order.id === saved.id ? saved : order)))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete takeaway handover.')
      return false
    } finally {
      setOrderBusy(false)
    }
  }

  async function updateStatus(id: string, status: OrderStatus) {
    setOrderBusy(true)
    setError('')
    try {
      const saved = await orderService.updateStatus(id, status)
      setOrders((previous) => previous.map((order) => (order.id === saved.id ? saved : order)))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update. Retry the action.')
      return false
    } finally {
      setOrderBusy(false)
    }
  }

  async function reportStock(data: { ingredientName: string; stockRemainingPercent: number; note: string }) {
    const item = inventory.find((item) => item.name === data.ingredientName)
    if (!item) throw new Error('Select a saved inventory ingredient.')
    await adminRequest('inventory/alerts/', {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify({
        item: item.id,
        stock_remaining_percent: data.stockRemainingPercent,
        note: data.note,
      }),
    })
    await loadOperations()
  }

  async function dismissAlert(id: string) {
    try {
      await adminRequest(`inventory/alerts/${id}/`, {
        method: 'PATCH',
        requireAuth: true,
        body: JSON.stringify({ resolved: true }),
      })
      await loadOperations()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to resolve alert.')
    }
  }

  async function markNotificationRead(id: number | string) {
    setNotifications((prev) =>
      prev.map((n) => (String(n.id) === String(id) ? { ...n, isRead: true } : n))
    )
    try {
      await notificationService.markAsRead(id)
    } catch (err) {
      console.warn('Failed to persist notification read:', err)
    }
  }

  async function markAllNotificationsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })))
    try {
      await Promise.allSettled([
        notificationService.markAllRead(),
        ...alerts
          .filter((a) => !a.read)
          .map((a) =>
            adminRequest(`inventory/alerts/${a.id}/`, {
              method: 'PATCH',
              requireAuth: true,
              body: JSON.stringify({ resolved: true }),
            })
          ),
      ])
    } catch (err) {
      console.warn('Failed to mark all notifications as read:', err)
    }
  }

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const dismissAllToasts = () => {
    setToasts([])
  }

  const handleViewOrder = (orderId: string) => {
    const target = orders.find((o) => o.id === orderId)
    if (target?.status === 'pending' || target?.status === 'preparing') {
      setActiveView('kitchen')
    } else {
      setActiveView('orders')
    }
    if (target) {
      setSearchQuery(target.orderNumber)
    }
  }

  const handleSendToKitchen = async (orderId: string) => {
    await updateStatus(orderId, 'preparing')
  }

  const handleOpenKitchenKds = () => {
    setActiveView('kitchen')
  }

  const handleSelectInquiry = (inquiryId?: number | string) => {
    if (inquiryId) {
      setSelectedInquiryId(inquiryId)
    }
    setActiveView('customers')
  }

  const logout = () => {
    clearAdminSession()
    setCurrentUser(null)
    setOrders([])
    setInventory([])
    setAlerts([])
    setNotifications([])
    setToasts([])
    websocketService.disconnect()
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

  const activeKitchenCount = orders.filter((order) =>
    ['pending', 'preparing', 'ready'].includes(order.status)
  ).length
  const lowStockCount = inventory.filter((item) => item.status !== 'optimal').length

  return (
    <div className="min-h-screen bg-[#FBF9F7] text-[#1A130E] flex">
      <Sidebar
        activeView={activeView}
        onSelectView={(view) => {
          if (isViewAllowed(view, currentUser)) setActiveView(view)
        }}
        activeKitchenCount={activeKitchenCount}
        lowStockCount={lowStockCount}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        currentUser={currentUser}
        onLogout={logout}
      />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeOrdersCount={activeKitchenCount}
          currentUser={currentUser}
          onLogout={logout}
          alerts={alerts}
          notifications={notifications}
          onDismissAlert={currentUser.permissions.includes('inventory:manage') ? (id) => void dismissAlert(id) : undefined}
          onMarkNotificationRead={(id) => void markNotificationRead(id)}
          onMarkAllNotificationsRead={() => void markAllNotificationsRead()}
          onSelectOrder={handleViewOrder}
          onSelectInquiry={handleSelectInquiry}
          onSettings={() => setActiveView('account')}
          wsConnected={wsConnected}
        />
        <main className="flex-1 p-3 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-[1600px] w-full mx-auto">
          {error && (
            <div role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-red-800">
              {error}{' '}
              <button
                className="underline cursor-pointer"
                onClick={() => {
                  setError('')
                  void loadOperations()
                }}
              >
                Retry
              </button>
            </div>
          )}
          {['kitchen', 'orders', 'transactions'].includes(activeView) && (
            <div className="mb-4">
              {ordersLoading && <p role="status">Loading live orders…</p>}
              {ordersError && (
                <div role="alert">
                  {ordersError}{' '}
                  <button className="underline cursor-pointer" onClick={() => void loadOrders()}>
                    Retry
                  </button>
                </div>
              )}
            </div>
          )}
          {activeView === 'kitchen' && (
            <KitchenKdsView
              orders={orders}
              onUpdateOrderStatus={updateStatus}
              onCompleteTakeaway={handleCompleteTakeaway}
              onReportLowStock={reportStock}
              inventoryList={inventory}
              busy={orderBusy}
            />
          )}
          {(activeView === 'orders' || activeView === 'transactions') && (
            <OrdersView
              orders={orders}
              onUpdateOrderStatus={updateStatus}
              onCompleteTakeaway={handleCompleteTakeaway}
              currentUser={currentUser}
              busy={orderBusy}
              onReload={() => void loadOrders()}
            />
          )}
          {activeView === 'tables' && <TablesBookingsView />}
          {activeView === 'analytics' && <AnalyticsLiveView />}
          {activeView === 'inventory' && (
            <InventoryView inventory={inventory} onRestockItem={() => void loadOperations()} />
          )}
          {activeView === 'products' && <ProductsView currentUser={currentUser} />}
          {activeView === 'promotions' && <PromotionsLiveView />}
          {activeView === 'customers' && (
            <CustomersDirectoryView
              selectedInquiryId={selectedInquiryId}
              onClearSelectedInquiry={() => setSelectedInquiryId(null)}
            />
          )}
          {activeView === 'staff' && <StaffAccountsView />}
          {activeView === 'roles' && <RolesManagementView currentUser={currentUser} />}
          {activeView === 'content' && <ContentManagementView />}
          {activeView === 'account' && <AccountView user={currentUser} onSaved={setCurrentUser} />}
        </main>
      </div>

      {/* Mobile/Tablet Role-Aware Bottom Quick Navigation */}
      <MobileAdminBottomNav
        activeView={activeView}
        onSelectView={(view) => {
          if (isViewAllowed(view, currentUser)) setActiveView(view)
        }}
        onOpenMenu={() => setIsMobileSidebarOpen(true)}
        currentUser={currentUser}
        activeKitchenCount={activeKitchenCount}
        lowStockCount={lowStockCount}
      />

      {/* Floating high-volume real-time toast notification queue */}
      <ToastStack
        toasts={toasts}
        onDismiss={dismissToast}
        onDismissAll={dismissAllToasts}
        onViewOrder={handleViewOrder}
        onSendToKitchen={handleSendToKitchen}
        onOpenKitchenKds={handleOpenKitchenKds}
        onViewInquiry={handleSelectInquiry}
      />
    </div>
  )
}
