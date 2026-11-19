import type { AddedBy } from './menu-category'

export interface MenuDish {
  id: number
  name: string
  slug: string
  category: number
  category_name: string
  price: string
  description: string
  imageUrl: string | null
  station: string
  spicyLevel: number
  rating: number
  ordersCount: number
  isAvailable: boolean
  isPopular: boolean
  isBestseller: boolean
  isSpecial: boolean
  prepTime: string
  dietary: string[]
  addedBy: AddedBy | null
  created_at: string
}

export interface DishPayload {
  name: string
  category: number
  price: string
  description: string
  image?: File | null
  imageUrl?: string | null
  station: string
  spicyLevel: number
  isAvailable: boolean
  isPopular: boolean
  isBestseller: boolean
  isSpecial: boolean
  prepTime: string
  dietary: string[]
}
