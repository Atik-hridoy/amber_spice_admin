import type {
  DishRecipeItem,
  DishCostSummary,
  StockTransaction,
  InventoryValuationSummary,
  CreateRecipeItemPayload,
  ManualStockAdjustmentPayload,
} from '../types/recipe'
import { adminRequest } from './api-client'
import { API_ENDPOINTS } from './endpoints/api-endpoints'

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export const recipeService = {
  async getCostSummaries(dishId?: number, signal?: AbortSignal): Promise<DishCostSummary[]> {
    const endpoint = API_ENDPOINTS.INVENTORY.recipeCostSummary(dishId)
    const res = await adminRequest<DishCostSummary[]>(endpoint, { signal })
    return Array.isArray(res) ? res : []
  },

  async listRecipes(dishId?: number, signal?: AbortSignal): Promise<DishRecipeItem[]> {
    const endpoint = API_ENDPOINTS.INVENTORY.recipesList(dishId)
    const res = await adminRequest<PaginatedResponse<DishRecipeItem> | DishRecipeItem[]>(endpoint, { signal })
    if (Array.isArray(res)) return res
    if (res && Array.isArray(res.results)) return res.results
    return []
  },

  createRecipeItem(payload: CreateRecipeItemPayload): Promise<DishRecipeItem> {
    return adminRequest(API_ENDPOINTS.INVENTORY.RECIPES, {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify(payload),
    })
  },

  updateRecipeItem(id: number, payload: Partial<CreateRecipeItemPayload>): Promise<DishRecipeItem> {
    return adminRequest(API_ENDPOINTS.INVENTORY.recipeDetail(id), {
      method: 'PATCH',
      requireAuth: true,
      body: JSON.stringify(payload),
    })
  },

  deleteRecipeItem(id: number): Promise<void> {
    return adminRequest(API_ENDPOINTS.INVENTORY.recipeDetail(id), {
      method: 'DELETE',
      requireAuth: true,
    })
  },

  async listTransactions(signal?: AbortSignal): Promise<StockTransaction[]> {
    const res = await adminRequest<PaginatedResponse<StockTransaction> | StockTransaction[]>(
      API_ENDPOINTS.INVENTORY.TRANSACTIONS,
      { signal }
    )
    if (Array.isArray(res)) return res
    if (res && Array.isArray(res.results)) return res.results
    return []
  },

  adjustStock(payload: ManualStockAdjustmentPayload): Promise<StockTransaction> {
    return adminRequest(API_ENDPOINTS.INVENTORY.TRANSACTIONS_ADJUST, {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify(payload),
    })
  },

  getValuationSummary(signal?: AbortSignal): Promise<InventoryValuationSummary> {
    return adminRequest(API_ENDPOINTS.INVENTORY.TRANSACTIONS_SUMMARY, { signal })
  },
}
