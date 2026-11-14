export interface InventoryCategory {
  id: number
  name: string
  slug: string
  description: string
  is_active: boolean
  itemsCount: number
  createdAt: string
  updatedAt: string
}

export interface InventoryCategoryPayload {
  name: string
  description?: string
  is_active?: boolean
}
