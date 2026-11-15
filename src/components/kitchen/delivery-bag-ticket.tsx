import { createPortal } from 'react-dom'
import type { KitchenTicket } from '../../services/delivery-handover-service'
import { customizationText } from './customization-text'

function Label({ ticket, bag }: { ticket: KitchenTicket; bag: number }) {
  return <article className="bag-label space-y-2 rounded-xl border-2 border-dashed border-stone-300 bg-white p-4 text-xs text-black">
    <p className="font-bold uppercase">Delivery bag {bag} / {ticket.bagCount}</p>
    <h3 className="break-all text-lg font-black">{ticket.orderNumber}</h3>
    <p className="text-xl font-bold">{ticket.customerName}</p>
    <p>{ticket.deliveryAddress} {ticket.deliveryPostalCode}</p>
    {ticket.customerPhone && <p>Customer: {ticket.customerPhone}</p>}
    <p>Assigned rider: <strong>{ticket.assignedRider?.name || 'Unassigned'}</strong></p>
    <p className="border-y border-stone-300 py-2 text-lg font-bold tracking-widest">Ticket: {ticket.ticketCode}</p>
    <p className="font-semibold">Full order contents · {ticket.items.reduce((sum, item) => sum + item.quantity, 0)} items</p>
    <ul>{ticket.items.map((item) => <li key={item.id} className="py-1"><strong>{item.quantity} × {item.name}</strong>{Object.keys(item.customizations).length > 0 && <p className="text-[11px]">{customizationText(item.customizations)}</p>}</li>)}</ul>
    {ticket.notes && <p className="border-t border-stone-200 pt-2"><strong>Delivery instructions:</strong> {ticket.notes}</p>}
    <p>Sealed by {ticket.handedOverBy} · {ticket.handoverAt ? new Date(ticket.handoverAt).toLocaleString() : ''}</p>
    <p className="text-[10px]">Match name, address, ticket and every bag at pickup and delivery. Keep the seal closed.</p>
  </article>
}
export function DeliveryBagTicket({ ticket }: { ticket: KitchenTicket }) {
  if (!ticket.ticketCode || !ticket.bagCount) return null
  return <>
    <details className="mt-4"><summary className="cursor-pointer font-semibold text-[#B84A22]">Preview bag label</summary><div className="mt-3"><Label ticket={ticket} bag={1} /></div></details>
    {createPortal(<div id="delivery-bag-tickets" style={{ display: 'none' }}>
      <style>{`@media print { body > *:not(#delivery-bag-tickets) { display: none !important; } #delivery-bag-tickets { display: block !important; } .bag-label { break-after: page; margin: 0; } .bag-label:last-child { break-after: auto; } }`}</style>
      {Array.from({ length: ticket.bagCount }, (_, index) => <Label key={index} ticket={ticket} bag={index + 1} />)}
    </div>, document.body)}
  </>
}
