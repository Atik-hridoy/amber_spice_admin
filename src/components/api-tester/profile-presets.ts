import { ADMIN_API_BASE_URL } from '../../services/endpoints'
import type { ApiPreset } from '../../types/api-tester'

const base = `${ADMIN_API_BASE_URL}/profiles`
const category = 'Profiles · Checkout autofill'

export const PROFILE_PRESETS: ApiPreset[] = [
  { id: 'profile-checkout-read', name: '1. Load checkout details', category, method: 'GET', url: `${base}/me/`, auth: 'session',
    description: 'JWT required. Reads the token owner’s fullName, phone, email, default_delivery_instructions, defaultAddress and savedAddresses. Checkout selects Home first, otherwise the default/first address. Use Manual bearer with a customer token. No request body.' },
  { id: 'profile-checkout-update', name: '2. Save contact details', category, method: 'PATCH', url: `${base}/me/`, auth: 'session',
    description: 'JWT required. Update the token owner’s name, phone, email and default delivery instructions with actual values. Reload step 4 to verify persistence.',
    body: JSON.stringify({ name: '', phone: '', email: '', default_delivery_instructions: '' }, null, 2) },
  { id: 'profile-checkout-address', name: '3. Save default delivery address', category, method: 'POST', url: `${base}/addresses/`, auth: 'session',
    description: 'JWT required. Creates an address for the token owner. Fill address_line1 and postal_code; label is home/work/office/other. Optional recipient_name, recipient_phone, address_line2, city, county_or_state and delivery_instructions. is_default=true selects it for checkout. Use live discovery for editing or deleting an existing address.',
    body: JSON.stringify({ label: 'home', address_line1: '', address_line2: '', city: '', county_or_state: '', postal_code: '', delivery_instructions: '', is_default: true }, null, 2) },
  { id: 'profile-checkout-reload', name: '4. Reload saved checkout details', category, method: 'GET', url: `${base}/me/`, auth: 'session',
    description: 'JWT required. Fresh read after saves. Verify contact fields and defaultAddress, then reopen customer checkout with the same account. Missing saved values stay empty and editable.' },
]

const addressCategory = 'Profiles · Saved addresses workflow'
const addressBody = { address_line1: '', address_line2: '', city: '', county_or_state: '', postal_code: '',
  recipient_name: '', recipient_phone: '', delivery_instructions: '' }

export const ADDRESS_PRESETS: ApiPreset[] = [
  { id: 'address-list', name: '1. List my saved addresses', category: addressCategory, method: 'GET', resource: 'address', auth: 'session', url: `${base}/addresses/`,
    description: 'JWT required. Only the token owner’s addresses. Paginated; use ?page=2 for additional pages. One Home, one Work, multiple Other. Use Manual bearer to test a customer account.' },
  ...(['home', 'work', 'other'] as const).map((label, index) => ({
    id: `address-create-${label}`, name: `${index + 2}. Save ${label} address`, category: addressCategory, resource: 'address' as const,
    method: 'POST' as const, auth: 'session' as const, url: `${base}/addresses/`,
    description: `JWT required. Saves for the token owner. Fill address_line1 and postal_code; city, county_or_state, address_line2, recipient_name, recipient_phone and delivery_instructions are editable. ${label === 'other' ? 'Multiple Other addresses are allowed.' : `A second ${label} returns 400; edit the existing address instead.`} Response captures addressId for subsequent steps.`,
    body: JSON.stringify({ label, ...addressBody }, null, 2),
  })),
  { id: 'address-detail', name: '5. Reload saved address', category: addressCategory, method: 'GET', resource: 'address', auth: 'session', url: `${base}/addresses/{addressId}/`,
    description: 'JWT required. addressId is captured from create or may be entered from list results. Fresh read verifies persistence. Another account’s ID returns 404.' },
  { id: 'address-edit', name: '6. Edit saved address', category: addressCategory, method: 'PATCH', resource: 'address', auth: 'session', url: `${base}/addresses/{addressId}/`,
    description: 'JWT required. Owner only. Partial update; use actual values. Optional label is home/work/other (one Home and Work each). Checkout edits alone do not change saved addresses.',
    body: JSON.stringify({ address_line1: '', postal_code: '', delivery_instructions: '' }, null, 2) },
  { id: 'address-default', name: '7. Select fallback default', category: addressCategory, method: 'POST', resource: 'address', auth: 'session', url: `${base}/addresses/{addressId}/set-default/`,
    description: 'JWT required. Owner only; no body. Selects the fallback when no Home exists. Checkout uses Home first even when Work/Other is marked default.' },
  { id: 'address-checkout-reload', name: '8. Reload checkout address choices', category: addressCategory, method: 'GET', auth: 'session', url: `${base}/me/`,
    description: 'JWT required. Verify savedAddresses includes Home, Work and Other and defaultAddress matches the saved fallback. Open checkout using the same account: Home is selected and all addresses remain selectable/editable.' },
  { id: 'address-delete', name: '9. Delete saved address', category: addressCategory, method: 'DELETE', resource: 'address', auth: 'session', url: `${base}/addresses/{addressId}/`,
    description: 'JWT required. Owner only. Deletes the selected address, including the last one. Reload list/profile to verify removal. Existing orders retain their address snapshots.' },
]
