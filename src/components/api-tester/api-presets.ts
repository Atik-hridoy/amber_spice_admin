export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface ApiPreset {
  id: string
  name: string
  category: string
  method: HttpMethod
  url: string
  body?: string
  description: string
}

export const API_PRESETS: ApiPreset[] = [
  {
    id: 'auth-register',
    name: 'Customer Registration',
    category: 'Authentication',
    method: 'POST',
    url: 'http://127.0.0.1:8000/api/v1/auth/register/',
    description: 'Register a new customer account',
    body: JSON.stringify(
      {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@restaurant.com',
        phone: '+353871234567',
        password: 'SecurePassword123!',
        confirm_password: 'SecurePassword123!',
      },
      null,
      2
    ),
  },
  {
    id: 'auth-login-admin',
    name: 'Admin Sign In',
    category: 'Authentication',
    method: 'POST',
    url: 'http://127.0.0.1:8000/api/v1/auth/login/',
    description: 'Sign in as Owner/Admin (Full Access)',
    body: JSON.stringify(
      {
        email: 'admin@restaurant.com',
        password: 'admin123',
      },
      null,
      2
    ),
  },
  {
    id: 'auth-login-kitchen',
    name: 'Kitchen Staff Sign In',
    category: 'Authentication',
    method: 'POST',
    url: 'http://127.0.0.1:8000/api/v1/auth/login/',
    description: 'Sign in as Kitchen Staff (KDS Access)',
    body: JSON.stringify(
      {
        email: 'chef@restaurant.com',
        password: 'kitchen123',
      },
      null,
      2
    ),
  },
  {
    id: 'auth-me',
    name: 'Current User Profile & Permissions',
    category: 'Authentication',
    method: 'GET',
    url: 'http://127.0.0.1:8000/api/v1/auth/me/',
    description: 'Inspect resolved RBAC permissions matrix',
  },
  {
    id: 'menu-categories',
    name: 'Get All Categories',
    category: 'Menu',
    method: 'GET',
    url: 'http://127.0.0.1:8000/api/v1/menu/categories/',
    description: 'Retrieve categories (Redis cached)',
  },
  {
    id: 'menu-dishes',
    name: 'Get All Dishes',
    category: 'Menu',
    method: 'GET',
    url: 'http://127.0.0.1:8000/api/v1/menu/dishes/',
    description: 'List menu items with portion and extra options',
  },
  {
    id: 'menu-toggle-availability',
    name: 'Toggle Dish Availability',
    category: 'Menu',
    method: 'PATCH',
    url: 'http://127.0.0.1:8000/api/v1/menu/dishes/1/toggle-availability/',
    description: 'Mark item out of stock / unavailable',
    body: JSON.stringify(
      {
        is_available: false,
      },
      null,
      2
    ),
  },
  {
    id: 'orders-kitchen',
    name: 'Kitchen Display System (KDS)',
    category: 'Orders',
    method: 'GET',
    url: 'http://127.0.0.1:8000/api/v1/orders/kitchen/',
    description: 'Active orders pending preparation',
  },
  {
    id: 'orders-create',
    name: 'Create Order',
    category: 'Orders',
    method: 'POST',
    url: 'http://127.0.0.1:8000/api/v1/orders/',
    description: 'Place a new dine-in or takeaway order',
    body: JSON.stringify(
      {
        customer_name: 'Mark Jecno',
        customer_phone: '+353871234567',
        dining_type: 'dine-in',
        table_number: 'T-01',
        payment_method: 'card',
        subtotal: 28.98,
        tax: 2.90,
        total_amount: 31.88,
        items: [
          {
            dish_id: 1,
            name: 'Royal Chicken Dum Biryani',
            quantity: 2,
            price: 14.49,
            station: 'biryani',
          },
        ],
      },
      null,
      2
    ),
  },
  {
    id: 'inventory-list',
    name: 'List Inventory Items',
    category: 'Inventory',
    method: 'GET',
    url: 'http://127.0.0.1:8000/api/v1/inventory/items/',
    description: 'Check stock levels and thresholds',
  },
  {
    id: 'inventory-low-stock',
    name: 'Low Stock Alerts',
    category: 'Inventory',
    method: 'GET',
    url: 'http://127.0.0.1:8000/api/v1/inventory/items/low_stock/',
    description: 'Critical items below threshold',
  },
  {
    id: 'analytics-summary',
    name: 'Analytics Summary',
    category: 'Analytics',
    method: 'GET',
    url: 'http://127.0.0.1:8000/api/v1/analytics/summary/',
    description: 'Real-time revenue, orders count, and popular dishes',
  },
  {
    id: 'tables-list',
    name: 'Dining Tables & Reservations',
    category: 'Tables',
    method: 'GET',
    url: 'http://127.0.0.1:8000/api/v1/reservations/tables/',
    description: 'Check seating occupancy and availability',
  },
]

