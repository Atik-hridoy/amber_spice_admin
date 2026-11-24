export interface DishRecipeItem {
  id: number
  dish: number
  dishName?: string
  dishPrice?: string
  ingredient: number
  ingredientName?: string
  ingredientUnit?: string
  ingredientCostPerUnit?: string
  quantity: string | number
  unit: string
  notes?: string
  cost?: string | number
  createdAt?: string
  updatedAt?: string
}

export interface DishCostSummary {
  dishId: number
  dishName: string
  dishCategory: string
  dishPrice: string
  isAvailable: boolean
  recipeItems: DishRecipeItem[]
  totalFoodCost: string
  foodCostPercent: string
  grossProfit: string
  grossMarginPercent: string
  maxPortionsAvailable: number
}

export interface StockTransaction {
  id: number
  item: number
  itemName: string
  itemUnit: string
  transactionType: 'PURCHASE' | 'CONSUMPTION' | 'WASTAGE' | 'ADJUSTMENT'
  quantityDelta: string
  unitCost: string
  totalCost: string
  balanceAfter: string
  order?: number | null
  orderNumber?: string | null
  createdByName: string
  notes: string
  createdAt: string
}

export interface InventoryValuationSummary {
  totalInventoryValuation: string | number
  totalConsumption30Days: string | number
  totalWastage30Days: string | number
  totalItemsCount: number
  lowStockCount: number
}

export interface CreateRecipeItemPayload {
  dish: number
  ingredient: number
  quantity: string | number
  unit?: string
  notes?: string
}

export interface ManualStockAdjustmentPayload {
  item: number
  transactionType: 'PURCHASE' | 'ADJUSTMENT' | 'WASTAGE'
  quantityDelta: string | number
  unitCost?: string | number
  notes?: string
}
