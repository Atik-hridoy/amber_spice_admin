/**
 * Centralized API Endpoints registry for Amber Spice Admin.
 * Keeps all endpoint paths structured, typed, and maintainable in one place.
 */

export const API_ENDPOINTS = {
  // Authentication, Profile, and Staff RBAC
  AUTH: {
    LOGIN: 'auth/login/',
    REGISTER: 'auth/register/',
    LOGOUT: 'auth/logout/',
    REFRESH: 'auth/token/refresh/',
    ME: 'auth/me/',
    CHANGE_PASSWORD: 'auth/change-password/',
    SUPERADMIN_SETUP: 'auth/superadmin/setup/',
    CUSTOMERS: 'auth/customers/',
    ROLES_CONFIG: 'auth/roles-config/',
    ROLES_CATALOG: 'auth/roles-config/catalog/',
    roleConfigDetail: (id: number | string) => `auth/roles-config/${id}/`,
    STAFF: 'auth/staff/',
    staffDetail: (id: number | string) => `auth/staff/${id}/`,
    staffPermissions: (id: number | string) => `auth/staff/${id}/permissions/`,
  },

  // Menu Management (Categories & Dishes)
  MENU: {
    CATEGORIES: 'menu/categories/',
    categoriesList: (ordering: string = 'order,name') => `menu/categories/?ordering=${ordering}`,
    categoryDetail: (id: number | string) => `menu/categories/${id}/`,
    DISHES: 'menu/dishes/',
    dishesList: (ordering: string = '-created_at') => `menu/dishes/?ordering=${ordering}`,
    dishDetail: (id: number | string) => `menu/dishes/${id}/`,
    dishToggleAvailability: (id: number | string) => `menu/dishes/${id}/toggle-availability/`,
    DISHES_POPULAR: 'menu/dishes/popular/',
    DISHES_BESTSELLERS: 'menu/dishes/bestsellers/',
  },

  // Orders & Kitchen Display (KDS)
  ORDERS: {
    LIST: 'orders/',
    orderDetail: (id: number | string) => `orders/${id}/`,
    updateStatus: (id: number | string) => `orders/${id}/update-status/`,
    KITCHEN_ACTIVE: 'orders/kitchen/active/',
    forwardToChef: (id: number | string) => `orders/${id}/forward-chef/`,
  },

  // Inventory & Stock Management
  INVENTORY: {
    CATEGORIES: 'inventory/categories/',
    categoriesList: (ordering: string = 'name') => `inventory/categories/?ordering=${ordering}`,
    categoryDetail: (id: number | string) => `inventory/categories/${id}/`,
    ITEMS: 'inventory/items/',
    itemDetail: (id: number | string) => `inventory/items/${id}/`,
    LOW_STOCK: 'inventory/items/low-stock/',
    restock: (id: number | string) => `inventory/items/${id}/restock/`,
    WASTAGE: 'inventory/wastage/',
  },

  // Tables & Reservations
  RESERVATIONS: {
    TABLES: 'reservations/tables/',
    tableDetail: (id: number | string) => `reservations/tables/${id}/`,
    BOOKINGS: 'reservations/bookings/',
    bookingDetail: (id: number | string) => `reservations/bookings/${id}/`,
  },

  // Analytics & Business Reports
  ANALYTICS: {
    SUMMARY: 'analytics/summary/',
    DAILY_SALES: 'analytics/daily-sales/',
    POPULAR_ITEMS: 'analytics/popular-items/',
  },

  // Promotions & Discounts
  PROMOTIONS: {
    LIST: 'promotions/',
    promoDetail: (id: number | string) => `promotions/${id}/`,
    toggleStatus: (id: number | string) => `promotions/${id}/toggle-status/`,
  },

  // OpenAPI Schema & Documentation
  SCHEMA: {
    JSON: 'schema/?format=json',
    DOCS: 'docs/',
    SWAGGER: 'swagger/',
    REDOC: 'redoc/',
  },
} as const

export type ApiEndpoints = typeof API_ENDPOINTS
