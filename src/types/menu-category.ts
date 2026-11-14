export interface AddedBy { id: number; name: string; role: string }

export interface MenuCategory {
  id: number
  name: string
  slug: string
  description: string
  imageUrl: string | null
  order: number
  is_active: boolean
  dishCount: number
  created_at: string
  addedBy: AddedBy | null
}

export interface CreateCategoryPayload {
  name: string
  slug?: string
  description?: string
  imageUrl?: string | null
  image?: File
  order?: number
  is_active?: boolean
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
