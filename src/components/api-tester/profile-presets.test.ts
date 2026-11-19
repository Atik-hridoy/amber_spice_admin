import { describe, expect, it } from 'vitest'
import { API_PRESETS } from './api-presets'
import { ADDRESS_PRESETS, PROFILE_PRESETS } from './profile-presets'

describe('Checkout autofill API Studio workflow', () => {
  it('provides authenticated profile read/save, default address save and fresh read steps', () => {
    expect(PROFILE_PRESETS.map((preset) => preset.method)).toEqual(['GET', 'PATCH', 'POST', 'GET'])
    for (const preset of PROFILE_PRESETS) {
      expect(preset.auth).toBe('session')
      expect(API_PRESETS).toContainEqual(preset)
    }
    expect(JSON.parse(PROFILE_PRESETS[1].body!)).toHaveProperty('phone')
    expect(JSON.parse(PROFILE_PRESETS[2].body!)).toMatchObject({ is_default: true, postal_code: '', address_line1: '' })
    expect(PROFILE_PRESETS[3].url).toBe(PROFILE_PRESETS[0].url)
  })
  it('includes authenticated Home/Work/Other CRUD and reload operations with captured address IDs', () => {
    expect(ADDRESS_PRESETS).toHaveLength(9)
    for (const preset of ADDRESS_PRESETS) {
      expect(preset.auth).toBe('session')
      expect(API_PRESETS).toContainEqual(preset)
    }
    expect(ADDRESS_PRESETS.filter((preset) => preset.id.startsWith('address-create-')).map((preset) => JSON.parse(preset.body!).label)).toEqual(['home', 'work', 'other'])
    expect(ADDRESS_PRESETS.find((preset) => preset.id === 'address-edit')?.url).toContain('{addressId}')
    expect(ADDRESS_PRESETS.find((preset) => preset.id === 'address-delete')?.method).toBe('DELETE')
  })
})
