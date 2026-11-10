export type AdminView =
  | 'kitchen'
  | 'orders'
  | 'tables'
  | 'analytics'
  | 'inventory'
  | 'products'
  | 'promotions'
  | 'customers'
  | 'staff'
  | 'transactions'
  | 'api-tester'

export type OrderStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'out-for-delivery'
  | 'delivered'
  | 'cancelled'

export type DiningType = 'dine-in' | 'takeaway' | 'delivery'
export type KitchenStation = 'all' | 'biryani' | 'curry' | 'grill' | 'breads' | 'dessert'

export interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  station: 'biryani' | 'curry' | 'grill' | 'breads' | 'dessert'
  customizations?: string[]
}

export interface DeliveryDriver {
  id: string
  name: string
  phone: string
  vehicle: 'E-Bike' | 'Scooter' | 'Car'
  status: 'available' | 'on-delivery'
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
  deliveryAddress?: string
  assignedDriver?: DeliveryDriver
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
  costPerUnit?: number
}

export interface WastageRecord {
  id: string
  ingredientId: string
  ingredientName: string
  quantity: number
  unit: string
  reason: 'Expired' | 'Damaged in transit' | 'Kitchen prep error' | 'Storage defect / Spoilage'
  reportedBy: string
  timestamp: string
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
  recipeCost?: number
}

export interface Promotion {
  id: string
  code: string
  title: string
  description: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minSpend: number
  validUntil: string
  usageLimit: number
  usageCount: number
  isActive: boolean
  badge: string
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
  role: 'General Manager' | 'Floor Manager' | 'Operations Staff' | 'Head Chef' | 'Sous Chef' | 'Station Cook' | 'Host' | 'Server' | 'Cashier' | 'Delivery Rider' | 'Super Admin' | 'Branch Admin' | string
  shift: 'Morning (10:00 - 16:00)' | 'Evening (16:00 - 23:00)' | 'Full Day' | string
  status: 'active' | 'break' | 'off-duty'
  avatar: string
  assignedSection: string
  email?: string
  phone?: string
  systemRole?: 'super_admin' | 'admin' | 'manager' | 'staff' | 'chef' | 'kitchen_staff' | 'delivery_staff' | 'cashier_front' | 'customer' | string
}

export interface SystemAlert {
  id: string
  title: string
  message: string
  type: 'stock_low' | 'stock_critical' | 'order_pending' | 'order_forwarded' | 'order_ready'
  timestamp: string
  senderRole?: 'chef' | 'staff' | 'manager' | 'system'
  senderName?: string
  ingredientId?: string
  read?: boolean
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

export interface AdminUser {
  id: number
  uuid: string
  username: string
  email: string
  fullName: string
  role: 'super_admin' | 'admin' | 'manager' | 'staff' | 'chef' | 'kitchen_staff' | 'delivery_staff' | 'cashier_front' | string
  roleDisplay: string
  avatar?: string | null
  phone?: string | null
  isStaff: boolean
  isSuperAdmin?: boolean
  permissions: string[]
}
