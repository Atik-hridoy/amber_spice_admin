import { useCallback, useEffect, useState } from 'react'
import { Header } from './components/layout/header'
import { Sidebar } from './components/layout/sidebar'
import { KitchenKdsView } from './components/kitchen/kitchen-kds-view'
import { OrdersView } from './components/orders/orders-view'
import { InventoryView } from './components/inventory/inventory-view'
import { ProductsView } from './components/products/products-view'
import { RolesManagementView } from './components/roles/roles-management-view'
import { ApiTesterView } from './components/api-tester/api-tester-view'
import { AdminLoginView } from './components/auth/admin-login-view'
import { AnalyticsLiveView, ContentManagementView, CustomersDirectoryView, PromotionsLiveView, StaffAccountsView, TablesBookingsView } from './components/operations/operations-views'
import { AccountView } from './components/operations/account-view'
import type { AdminUser, AdminView, InventoryItem, Order, OrderStatus, SystemAlert } from './types/admin'
import { getAllowedViews, getDefaultViewForRole, isViewAllowed } from './utils/roles'
import { clearAdminSession, getStoredAdminUser } from './services/admin-session'
import { adminRequest } from './services/api-client'
import { listRecords } from './services/resource-service'
import { orderService } from './services/order-service'
import { inventoryService } from './services/inventory-service'

interface StockAlert { id: number; item_name: string; stock_remaining_percent: number; note: string; reporter_name: string; created_at: string; resolved: boolean }

export default function App() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(getStoredAdminUser)
  const [requestedView, setActiveView] = useState<AdminView>(() => getDefaultViewForRole(currentUser?.role))
  const [orders, setOrders] = useState<Order[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [alerts, setAlerts] = useState<SystemAlert[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState('')
  const [error, setError] = useState('')
  const [orderBusy, setOrderBusy] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const activeView = currentUser && !isViewAllowed(requestedView, currentUser) ? getAllowedViews(currentUser)[0] || 'account' : requestedView

  useEffect(() => {
    const stored = getStoredAdminUser()
    if (!stored) return
    const controller = new AbortController()
    adminRequest<AdminUser>('auth/me/', { requireAuth: true, signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) setCurrentUser({ ...stored, ...data })
    }).catch(err => {
      if (controller.signal.aborted) return
      if (err.status === 401) { clearAdminSession(); setCurrentUser(null) }
      else setError('Unable to verify the account connection. Retry by reloading the portal.')
    })
    return () => controller.abort()
  }, [])

  const loadOrders = useCallback(async (signal?: AbortSignal) => {
    if (!currentUser) return
    try {
      const live = currentUser.role === 'delivery_staff' ? await orderService.getDeliveryOrders(signal)
        : activeView === 'kitchen' ? await orderService.getKitchenOrders(undefined, signal) : await orderService.list(undefined, signal)
      if (!signal?.aborted) { setOrders(live); setOrdersError('') }
    } catch (err) { if (!signal?.aborted) setOrdersError(err instanceof Error ? err.message : 'Unable to load orders.') }
    finally { if (!signal?.aborted) setOrdersLoading(false) }
  }, [currentUser, activeView])
  useEffect(() => {
    setOrders([])
    if (!currentUser || !['kitchen', 'orders', 'transactions'].includes(activeView)) return
    const controller = new AbortController()
    setOrdersLoading(true)
    void loadOrders(controller.signal)
    const timer = window.setInterval(() => void loadOrders(controller.signal), 10000)
    return () => { controller.abort(); window.clearInterval(timer) }
  }, [currentUser, activeView, loadOrders])

  const loadOperations = useCallback(async (signal?: AbortSignal) => {
    if (!currentUser) return
    const results = await Promise.allSettled([
      currentUser.permissions.includes('inventory:view') ? inventoryService.list(signal) : Promise.resolve([]),
      listRecords<StockAlert>('inventory/alerts/?resolved=false', signal),
    ])
    if (signal?.aborted) return
    if (results[0].status === 'fulfilled') setInventory(results[0].value)
    if (results[1].status === 'fulfilled') setAlerts(results[1].value.map(row => ({
      id: String(row.id), title: `Low stock: ${row.item_name}`, message: row.note,
      type: row.stock_remaining_percent <= 10 ? 'stock_critical' : 'stock_low', timestamp: new Date(row.created_at).toLocaleString(), senderName: row.reporter_name, read: row.resolved,
    })))
    const failed = results.find(result => result.status === 'rejected')
    if (failed?.status === 'rejected') setError(failed.reason instanceof Error ? failed.reason.message : 'Unable to load operations data.')
  }, [currentUser])
  useEffect(() => {
    if (!currentUser) return
    const controller = new AbortController()
    void loadOperations(controller.signal)
    const timer = window.setInterval(() => void loadOperations(controller.signal), 15000)
    return () => { controller.abort(); window.clearInterval(timer) }
  }, [currentUser, loadOperations])

  async function updateStatus(id: string, status: OrderStatus) {
    setOrderBusy(true); setError('')
    try { const saved = await orderService.updateStatus(id, status); setOrders(previous => previous.map(order => order.id === saved.id ? saved : order)); return true }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to update. Retry the action.'); return false }
    finally { setOrderBusy(false) }
  }
  async function reportStock(data: { ingredientName: string; stockRemainingPercent: number; note: string }) {
    const item = inventory.find(item => item.name === data.ingredientName)
    if (!item) throw new Error('Select a saved inventory ingredient.')
    await adminRequest('inventory/alerts/', { method: 'POST', requireAuth: true, body: JSON.stringify({ item: item.id, stock_remaining_percent: data.stockRemainingPercent, note: data.note }) })
    await loadOperations()
  }
  async function dismissAlert(id: string) {
    try { await adminRequest(`inventory/alerts/${id}/`, { method: 'PATCH', requireAuth: true, body: JSON.stringify({ resolved: true }) }); await loadOperations() }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to resolve alert.') }
  }
  const logout = () => { clearAdminSession(); setCurrentUser(null); setOrders([]); setInventory([]); setAlerts([]) }
  if (!currentUser) return <AdminLoginView onLoginSuccess={user => { setCurrentUser(user); setActiveView(getDefaultViewForRole(user.role)) }} />
  const activeKitchenCount = orders.filter(order => ['pending', 'preparing', 'ready'].includes(order.status)).length
  const lowStockCount = inventory.filter(item => item.status !== 'optimal').length
  return <div className="min-h-screen bg-[#FBF9F7] text-[#1A130E] flex">
    <Sidebar activeView={activeView} onSelectView={view => { if (isViewAllowed(view, currentUser)) setActiveView(view) }} activeKitchenCount={activeKitchenCount} lowStockCount={lowStockCount} isOpenMobile={isMobileSidebarOpen} onCloseMobile={() => setIsMobileSidebarOpen(false)} currentUser={currentUser} onLogout={logout} />
    <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
      <Header onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} searchQuery={searchQuery} onSearchChange={setSearchQuery} activeOrdersCount={activeKitchenCount} currentUser={currentUser} onLogout={logout} alerts={alerts} onDismissAlert={currentUser.permissions.includes('inventory:manage') ? id => void dismissAlert(id) : undefined} onSettings={() => setActiveView('account')} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
        {error && <div role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-red-800">{error} <button className="underline" onClick={() => { setError(''); void loadOperations() }}>Retry</button></div>}
        {['kitchen', 'orders', 'transactions'].includes(activeView) && <div className="mb-4">{ordersLoading && <p role="status">Loading live orders…</p>}{ordersError && <div role="alert">{ordersError} <button className="underline" onClick={() => void loadOrders()}>Retry</button></div>}</div>}
        {activeView === 'kitchen' && <KitchenKdsView orders={orders} onUpdateOrderStatus={updateStatus} onReportLowStock={reportStock} inventoryList={inventory} busy={orderBusy} />}
        {(activeView === 'orders' || activeView === 'transactions') && <OrdersView orders={orders} onUpdateOrderStatus={updateStatus} currentUser={currentUser} busy={orderBusy} onReload={() => void loadOrders()} />}
        {activeView === 'tables' && <TablesBookingsView />}
        {activeView === 'analytics' && <AnalyticsLiveView />}
        {activeView === 'inventory' && <InventoryView inventory={inventory} onRestockItem={() => void loadOperations()} />}
        {activeView === 'products' && <ProductsView currentUser={currentUser} />}
        {activeView === 'promotions' && <PromotionsLiveView />}
        {activeView === 'customers' && <CustomersDirectoryView />}
        {activeView === 'staff' && <StaffAccountsView />}
        {activeView === 'roles' && <RolesManagementView currentUser={currentUser} />}
        {activeView === 'content' && <ContentManagementView />}
        {activeView === 'account' && <AccountView user={currentUser} onSaved={setCurrentUser} />}
        {activeView === 'api-tester' && <ApiTesterView />}
      </main>
    </div>
  </div>
}
