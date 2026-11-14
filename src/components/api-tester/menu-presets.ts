import { ADMIN_API_BASE_URL } from '../../services/api-client'
import type { ApiPreset, BodyMode, HttpMethod, MenuResource } from '../../types/api-tester'

const category = { name: '', description: '', order: 0, is_active: true }
const dish = { name: '', category: null, price: '', description: '', station: 'curry', spicyLevel: 0,
  dietary: [], prepTime: '', isAvailable: true, isPopular: false, isBestseller: false, isSpecial: false }

function preset(id: string, resource: MenuResource, name: string, method: HttpMethod, path: string,
  description: string, body?: unknown, bodyMode?: BodyMode): ApiPreset {
  return { id, name, method, url: `${ADMIN_API_BASE_URL}/menu/${path}`, description,
    category: resource === 'category' ? 'Menu · Categories' : 'Menu · Dishes', resource,
    body: body === undefined ? undefined : JSON.stringify(body, null, 2), bodyMode,
  }
}

export const MENU_PRESETS: ApiPreset[] = [
  preset('category-list', 'category', 'List categories', 'GET', 'categories/', 'Active categories publicly; managers also see hidden entries.'),
  preset('category-detail', 'category', 'Category detail', 'GET', 'categories/{categoryId}/', 'Inspect fields, dish count, imageUrl and Added by.'),
  preset('category-create', 'category', 'Create category', 'POST', 'categories/', 'Fill name before sending. Creator comes from authentication.', category),
  preset('category-edit', 'category', 'Edit category', 'PATCH', 'categories/{categoryId}/', 'Send only properties you want to change.', { description: '' }),
  preset('category-replace', 'category', 'Replace category', 'PUT', 'categories/{categoryId}/', 'Full update; name is required.', category),
  preset('category-upload', 'category', 'Create category with image', 'POST', 'categories/', 'Choose a JPEG, PNG or WebP image, up to 5 MB.', category, 'multipart'),
  preset('category-image-replace', 'category', 'Replace category image', 'PATCH', 'categories/{categoryId}/', 'Upload a file using the image field.', {}, 'multipart'),
  preset('category-image-clear', 'category', 'Clear category image', 'PATCH', 'categories/{categoryId}/', 'Removes the stored image after commit.', { image: null }),
  preset('category-archive', 'category', 'Archive category', 'DELETE', 'categories/{categoryId}/', 'Hides the category and its dishes; records are preserved.'),
  preset('category-restore', 'category', 'Restore category', 'PATCH', 'categories/{categoryId}/', 'Makes the category active again.', { is_active: true }),
  preset('dish-list', 'dish', 'List dishes', 'GET', 'dishes/', 'All accessible dishes, including unavailable dishes for maintenance.'),
  preset('dish-available', 'dish', 'Available customer dishes', 'GET', 'dishes/?is_available=true', 'Inspect the customer menu response.'),
  preset('dish-by-category', 'dish', 'Dishes by category', 'GET', 'dishes/?category={categoryId}', 'Filter using a real category ID.'),
  preset('dish-detail', 'dish', 'Dish detail', 'GET', 'dishes/{dishId}/', 'Inspect category, imageUrl, options and Added by.'),
  preset('dish-create', 'dish', 'Create dish', 'POST', 'dishes/', 'Fill name, category ID and positive price.', dish),
  preset('dish-edit', 'dish', 'Edit dish', 'PATCH', 'dishes/{dishId}/', 'Send only properties you want to change.', { description: '' }),
  preset('dish-replace', 'dish', 'Replace dish', 'PUT', 'dishes/{dishId}/', 'Full update; name, category ID and price are required.', dish),
  preset('dish-upload', 'dish', 'Create dish with image', 'POST', 'dishes/', 'Choose a JPEG, PNG or WebP file. Dietary arrays are encoded automatically.', dish, 'multipart'),
  preset('dish-image-replace', 'dish', 'Replace dish image', 'PATCH', 'dishes/{dishId}/', 'Upload a file using the image field.', {}, 'multipart'),
  preset('dish-image-clear', 'dish', 'Clear dish image', 'PATCH', 'dishes/{dishId}/', 'Clears the image without changing other properties.', { image: null }),
  preset('dish-availability', 'dish', 'Set dish availability', 'PATCH', 'dishes/{dishId}/toggle-availability/', 'Requires menu:toggle_availability.', { is_available: false }),
  preset('dish-popular', 'dish', 'Popular dishes', 'GET', 'dishes/popular/', 'Active, available dishes marked popular.'),
  preset('dish-bestsellers', 'dish', 'Bestseller dishes', 'GET', 'dishes/bestsellers/', 'Active, available dishes marked bestseller.'),
  preset('dish-delete', 'dish', 'Delete dish', 'DELETE', 'dishes/{dishId}/', 'Permanently deletes the selected dish.'),
]
