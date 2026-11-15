import { ADMIN_API_BASE_URL } from '../../services/endpoints'
import type { ApiPreset } from '../../types/api-tester'

const base = `${ADMIN_API_BASE_URL}/orders`
const category = 'Delivery · Kitchen ticket and customer contact'
const auth = 'session' as const
export const HANDOVER_CONTACT_PRESETS: ApiPreset[] = [
  { id: 'kitchen-ticket', name: '1. Load private kitchen bag ticket', category, auth, resource: 'order', method: 'GET', url: `${base}/{orderId}/handover/`,
    description: 'Kitchen/operator JWT with kitchen:view_orders or orders:view; never rider/customer. First assign an active rider, start their shift, accept assignment and mark food ready. Returns exact order-item IDs/quantities, assigned rider, handover status and private printed ticket code. Captures packedItems, deliveryStaffId, ticketCode and bagCount for later steps. Do not share the code through public tracking.' },
  { id: 'kitchen-release', name: '2. Record actual sealed-bag handover', category, auth, resource: 'order', method: 'POST', url: `${base}/{orderId}/handover/`,
    description: 'Kitchen/operator JWT with kitchen:update_status or orders:update_status. READY order + ACCEPTED rider. Required rider_id must match assignment; bag_count 1–30; sealed must be true; items must contain every exact item_id and quantity once. Load ticket first to fill real IDs. Physically verify contents, seals and rider before sending. Safe identical retry; a changed bag count reissues the ticket before pickup.',
    body: JSON.stringify({ rider_id: null, bag_count: 1, sealed: true, items: [] }, null, 2) },
  { id: 'customer-contact', name: '3. Customer: contact availability', category, auth, method: 'GET', url: `${base}/track/{orderNumber}/contact/`,
    description: 'Order-owner customer JWT. Guest: choose No auth and add X-Order-Contact-Token header using the separate customerContactToken from original checkout (automatically captured in request headers by guest checkout). Public order number alone cannot read or send chat. Opens after verified rider pickup; closes on delivery/cancellation.' },
  { id: 'customer-messages', name: '4. Customer: reload saved conversation', category, auth, method: 'GET', url: `${base}/track/{orderNumber}/contact/messages/?after_id=0`,
    description: 'Same owner JWT / private guest header. Read persisted messages after a fresh request or reload; follow nextAfterId while hasMore=true. Completed conversations remain readable to participants.' },
  { id: 'customer-message-send', name: '5. Customer: send delivery message', category, auth, method: 'POST', url: `${base}/track/{orderNumber}/contact/messages/`,
    description: 'Same owner JWT / private guest header. Active picked-up delivery only. body 1–2000 characters; required client_message_id UUID (generated when selecting this workflow). Keep the same UUID and text on retry; new text needs a new UUID. Sender role/identity is server-controlled. Use a test order to avoid messaging a real rider.',
    body: JSON.stringify({ body: '', client_message_id: '' }, null, 2) },
  { id: 'rider-contact', name: '6. Assigned rider: contact availability', category, auth, method: 'GET', url: `${ADMIN_API_BASE_URL}/rider/jobs/{orderId}/contact/`, description: 'Assigned delivery_staff JWT with deliveries:view_assigned. Own delivery conversation and actual contact availability. Other riders receive 404.' },
  { id: 'rider-messages', name: '7. Assigned rider: reload messages', category, auth, method: 'GET', url: `${ADMIN_API_BASE_URL}/rider/jobs/{orderId}/contact/messages/?after_id=0`, description: 'Assigned delivery_staff JWT. Persisted messages with cursor pagination. Read history after delivery. No guest header needed.' },
  { id: 'rider-message-send', name: '8. Assigned rider: reply', category, auth, method: 'POST', url: `${ADMIN_API_BASE_URL}/rider/jobs/{orderId}/contact/messages/`,
    description: 'Assigned delivery_staff JWT with deliveries:update_status. Active pickup only. body and unique client_message_id UUID required. Retry identical request with same UUID; do not impersonate customer. Use test orders.', body: JSON.stringify({ body: '', client_message_id: '' }, null, 2) },
  { id: 'dispatch-contact', name: 'Support: conversation state', category, auth, method: 'GET', url: `${base}/{orderId}/delivery/contact/`, description: 'Operator JWT with orders:view. Read-only metadata; canSend=false. No support impersonation.' },
  { id: 'dispatch-messages', name: 'Support: saved delivery messages', category, auth, method: 'GET', url: `${base}/{orderId}/delivery/contact/messages/?after_id=0`, description: 'Operator JWT with orders:view. Read-only real conversation. Cursor pagination. POST unsupported.' },
]
