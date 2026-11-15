import { ADMIN_API_BASE_URL } from '../../services/endpoints'
import type { ApiPreset } from '../../types/api-tester'

const base = `${ADMIN_API_BASE_URL}/rider`
const category = 'Rider · Shift and delivery workflow'
const auth = 'session' as const

export const RIDER_PRESETS: ApiPreset[] = [
  { id: 'rider-me', name: '1. Rider shift overview', category, method: 'GET', auth, url: `${base}/me/`,
    description: 'JWT delivery_staff with deliveries:view_assigned. Use Sign in with real rider credentials to obtain a Manual bearer token. Own shift, vehicle, job counts, cash totals and configured pickup location. No body.' },
  { id: 'rider-start-shift', name: '2. Start rider shift', category, method: 'PATCH', auth, url: `${base}/me/`,
    description: 'JWT delivery_staff with deliveries:update_status. on_duty is optional boolean; vehicle_type is bicycle/motorbike/car/walking, vehicle_registration optional up to 30 characters. Requires real account; never creates a staff account.',
    body: JSON.stringify({ on_duty: true, vehicle_type: 'bicycle', vehicle_registration: '' }, null, 2) },
  { id: 'rider-jobs', name: '3. Load assigned rider jobs', category, method: 'GET', auth, resource: 'order', url: `${base}/jobs/?scope=active`,
    description: 'JWT delivery_staff. Admin must first assign a delivery order using the Orders workflow. Paginated own queue only. Copy a returned id into orderId below; no guessed IDs. availableActions reflects duty, kitchen status, delivery stage and issues.' },
  { id: 'rider-job-detail', name: '4. Reload rider job', category, method: 'GET', auth, resource: 'order', url: `${base}/jobs/{orderId}/`,
    description: 'JWT assigned delivery_staff. Enter id from the rider queue. Response captures orderId for subsequent steps. Verify actual address, contact, contents, payment and delivery events.' },
  ...([
    ['accept', '5. Accept assignment', 'On duty. Assigned stage only; does not dispatch food.'],
    ['pickup', '6. Confirm pickup', 'On duty. Requires accepted assignment and ready kitchen status; updates order to out_for_delivery.'],
    ['arrive', '7. Record arrival', 'On duty. Requires recorded pickup; customer tracking shows rider arrival.'],
    ['complete', '8. Confirm doorstep handover', 'On duty. Requires arrival and no unresolved issue; updates order to delivered.'],
    ['collect-cash', '9. Record cash received', 'After actual handover and receipt of full total. Delivered cash orders only; records one receipt.'],
  ] as const).map(([action, name, detail]) => ({
    id: `rider-${action}`, name, category, method: 'POST' as const, auth, resource: 'order' as const,
    url: `${base}/jobs/{orderId}/${action}/`, description: `JWT assigned delivery_staff with deliveries:update_status. ${detail} No body. Safe to retry; timestamps/events are not duplicated.`,
  })),
  { id: 'rider-completed', name: '10. Reload completed deliveries', category, method: 'GET', auth, resource: 'order', url: `${base}/jobs/?scope=completed`,
    description: 'JWT delivery_staff. Verify completion/payment persists on a fresh read. Delivered cash still pending remains in active queue until cash collection is confirmed.' },
  { id: 'rider-end-shift', name: '11. End rider shift', category, method: 'PATCH', auth, url: `${base}/me/`,
    description: 'JWT delivery_staff with deliveries:update_status. Cannot end shift while accepted/in-transit deliveries or delivered cash receipts are outstanding.', body: JSON.stringify({ on_duty: false }, null, 2) },
  { id: 'rider-issue', name: 'Report delivery problem', category, method: 'POST', auth, resource: 'order', url: `${base}/jobs/{orderId}/report-issue/`,
    description: 'JWT assigned rider. Required code: customer_unavailable/address_problem/vehicle_problem/order_problem/other; required note up to 1000 characters. Pauses delivery progress until operations resolves it.',
    body: JSON.stringify({ code: 'customer_unavailable', note: '' }, null, 2) },
  { id: 'rider-decline', name: 'Return assignment before pickup', category, method: 'POST', auth, resource: 'order', url: `${base}/jobs/{orderId}/decline/`,
    description: 'JWT assigned rider. Required note up to 1000 characters. Before pickup only. Clears assignment and returns 204; order remains available for admin reassignment. Reload queue after success.', body: JSON.stringify({ note: '' }, null, 2) },
  { id: 'rider-ops-activity', name: 'Dispatch: review delivery activity', category, method: 'GET', auth, resource: 'order', url: `${ADMIN_API_BASE_URL}/orders/{orderId}/delivery/`,
    description: 'Switch Auth to current admin session or operator bearer token with orders:view. Includes private issue details and actor-stamped audit events. Customer tracking exposes stage/timestamps only.' },
  { id: 'rider-ops-resolve', name: 'Dispatch: resolve reported issue', category, method: 'POST', auth, resource: 'order', url: `${ADMIN_API_BASE_URL}/orders/{orderId}/delivery/resolve-issue/`,
    description: 'Operator JWT with orders:update_status. Required resolution note up to 1000 characters. Save the real resolution, then switch back to the rider bearer token and refresh the job to resume.', body: JSON.stringify({ note: '' }, null, 2) },
  { id: 'rider-ops-return', name: 'Dispatch: approve failed delivery return', category, method: 'POST', auth, resource: 'order', url: `${ADMIN_API_BASE_URL}/orders/{orderId}/delivery/request-return/`,
    description: 'Operator JWT with orders:update_status. In-transit delivery with an open issue only. Required note with return instructions. Changes stage to returning. Rider must confirm actual handover back at the restaurant.', body: JSON.stringify({ note: '' }, null, 2) },
  { id: 'rider-confirm-return', name: 'Confirm return to restaurant', category, method: 'POST', auth, resource: 'order', url: `${base}/jobs/{orderId}/confirm-return/`,
    description: 'JWT assigned rider on duty. Only after operations approves return. Confirm actual handover to restaurant staff. Cancels the undelivered order, records a returned event, and performs no payment/refund. No body; safe to retry.' },
]
