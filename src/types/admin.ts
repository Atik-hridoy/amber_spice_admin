export type AdminView =
  | 'kitchen'
  | 'orders'
  | 'tables'
  | 'analytics'
  | 'inventory'
  | 'products'
  | 'customers'
  | 'staff'
  | 'transactions'

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
export type DiningType = 'dine-in' | 'takeaway' | 'delivery'
export type KitchenStation = 'all' | 'tandoor' | 'curry' | 'biryani' | 'dessert'

export interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  station: 'tandoor' | 'curry' | 'biryani' | 'dessert'
  customizations?: string[]
}

export interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerPhone?: string
  diningType: DiningType
  tableNumber?: string
  status: OrderStatus
  items: OrderItem[]
  totalAmount: number
  paymentStatus: 'paid' | 'pending' | 'refunded'
  paymentMethod: 'card' | 'cash' | 'apple-pay'
  createdAt: string
  estimatedTimeMinutes: number
  elapsedMinutes: number
  notes?: string
}

export interface InventoryItem {
  id: string
  name: string
  category: 'Meat & Poultry' | 'Spices & Seasoning' | 'Dairy' | 'Produce' | 'Pantry'
  currentStock: number
  minimumStock: number
  unit: string
  status: 'optimal' | 'low' | 'critical'
  lastRestocked: string
  supplier: string
}

export interface MenuItem {
  id: string
  name: string
  category: string
  price: number
  description: string
  imageUrl: string
  isAvailable: boolean
  rating: number
  ordersCount: number
  spicyLevel?: 1 | 2 | 3
}

export interface TableItem {
  id: string
  number: string
  capacity: number
  status: 'available' | 'occupied' | 'reserved'
  currentOrder?: string
  guestName?: string
  timeSlot?: string
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  ordersCount: number
  totalSpent: number
  isVip: boolean
  lastOrderDate: string
}

export interface StaffMember {
  id: string
  name: string
  role: 'Head Chef' | 'Sous Chef' | 'Station Cook' | 'Floor Manager' | 'Host' | 'Server'
  shift: 'Morning (10:00 - 16:00)' | 'Evening (16:00 - 23:00)' | 'Full Day'
  status: 'active' | 'break' | 'off-duty'
  avatar: string
  assignedSection: string
}

export interface AnalyticsSummary {
  todayRevenue: number
  revenueGrowthPercent: number
  activeOrdersCount: number
  tablesOccupied: number
  totalTables: number
  averagePrepTimeMinutes: number
  topSellingDishes: { name: string; sales: number; revenue: number }[]
}
