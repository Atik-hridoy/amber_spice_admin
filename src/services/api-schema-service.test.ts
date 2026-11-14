import { describe, expect, it } from 'vitest'
import { presetsFromSchema } from './api-schema-service'
import { API_PRESETS } from '../components/api-tester/api-presets'

describe('live API collection', () => {
  it('discovers new APIs and request properties without code changes and retains menu upload workflows', () => {
    const presets = presetsFromSchema({ paths: {
      '/api/v1/menu/dishes/{id}/': { get: { summary: 'Dish retrieve' } },
      '/api/v1/future-feature/': { post: { summary: 'Create future record', tags: ['Future'], requestBody: { content: {
        'application/json': { schema: { $ref: '#/components/schemas/FutureRequest' } },
      } } } },
    }, components: { schemas: { FutureRequest: { type: 'object', required: ['name'], properties: {
      name: { type: 'string' }, addedBy: { type: 'string', readOnly: true },
    } } } } }, API_PRESETS)
    const future = presets.find((preset) => preset.name === 'Create future record')!
    expect(future.method).toBe('POST')
    expect(future.url).toContain('/api/v1/future-feature/')
    expect(JSON.parse(future.body!)).toEqual({ name: '' })
    expect(future.fields).toEqual(['name *'])
    expect(presets.filter((preset) => preset.method === 'GET' && preset.url.endsWith('dishes/{dishId}/'))).toHaveLength(1)
    expect(presets.find((preset) => preset.id === 'dish-upload')?.bodyMode).toBe('multipart')
  })

  it('contains category/dish CRUD, upload, image removal and availability requests without guessed IDs', () => {
    const ids = new Set(API_PRESETS.map((preset) => preset.id))
    for (const id of ['category-list', 'category-create', 'category-edit', 'category-replace', 'category-archive', 'category-restore', 'category-upload', 'category-image-clear', 'dish-list', 'dish-create', 'dish-edit', 'dish-replace', 'dish-delete', 'dish-upload', 'dish-image-clear', 'dish-availability', 'dish-by-category', 'dish-popular', 'dish-bestsellers']) expect(ids.has(id)).toBe(true)
    expect(API_PRESETS.filter((preset) => /\/menu\/(categories|dishes)\/\d+\//.test(preset.url))).toEqual([])
  })
})
