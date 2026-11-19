import { useEffect, useState } from 'react'
import { CheckCircle2, PackageCheck, Printer } from 'lucide-react'
import { deliveryHandoverService, type KitchenTicket } from '../../services/delivery-handover-service'
import { DeliveryBagTicket } from './delivery-bag-ticket'
import { customizationText } from './customization-text'

export function KitchenHandoverPanel({ orderId }: { orderId: string }) {
  const [ticket, setTicket] = useState<KitchenTicket | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  const [checked, setChecked] = useState<number[]>([])
  const [sealed, setSealed] = useState(false)
  const [confirmedRider, setConfirmedRider] = useState<number | null>(null)
  const [editing, setEditing] = useState(false)
  const [bags, setBags] = useState('1')
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    const read = () => deliveryHandoverService.ticket(orderId, controller.signal).then(
      (saved) => { if (!controller.signal.aborted) { setTicket(saved); setError(''); setLoading(false) } },
      (failure: unknown) => { if (!controller.signal.aborted) { setError(failure instanceof Error ? failure.message : 'Unable to load kitchen handover.'); setLoading(false) } },
    )
    void read()
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void read() }, 10000)
    return () => { controller.abort(); window.clearInterval(timer) }
  }, [orderId, attempt])
  const save = async () => {
    if (!ticket?.assignedRider || saving || error) return
    setSaving(true)
    try {
      const saved = await deliveryHandoverService.release(orderId, { rider_id: ticket.assignedRider.id, bag_count: Number(bags),
        sealed, items: ticket.items.map((item) => ({ item_id: item.id, quantity: item.quantity })) })
      setTicket(saved); setError(''); setChecked([]); setSealed(false); setConfirmedRider(null); setEditing(false)
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Handover was not saved. Retry after refreshing.') }
    finally { setSaving(false) }
  }
  const valid = ticket && ticket.items.length > 0 && ticket.items.every((item) => checked.includes(item.id)) && sealed && confirmedRider === ticket.assignedRider?.id && Number.isInteger(Number(bags)) && Number(bags) >= 1 && Number(bags) <= 30
  return <section className="rounded-xl border border-orange-200 bg-[#FFF9F2] p-4 text-xs">
    <h3 className="flex items-center gap-2 text-sm font-semibold text-[#B84A22]"><PackageCheck size={18} />Kitchen → Rider handover</h3>
    {loading && <p role="status" className="mt-3">Loading saved bag ticket…</p>}
    {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-red-700">{error} <button type="button" onClick={() => setAttempt((value) => value + 1)} className="underline">Retry handover</button></p>}
    {ticket && <div className="mt-3 space-y-3">
      <p><strong>{ticket.customerName}</strong> · {ticket.orderNumber}</p><p>{ticket.deliveryAddress} {ticket.deliveryPostalCode}</p>
      <p>Assigned rider: <strong>{ticket.assignedRider?.name || 'Assign a rider from Orders first.'}</strong></p>
      {ticket.handoverAt && !editing ? <div role="status" className="space-y-2 rounded-lg border border-emerald-200 bg-white p-3">
        <p className="flex items-center gap-2 font-semibold text-emerald-800"><CheckCircle2 size={16} />{ticket.bagCount} sealed bag(s) released by {ticket.handedOverBy}</p>
        <p>Ticket code: <strong className="text-lg tracking-widest">{ticket.ticketCode}</strong></p>
        <p>{ticket.pickupVerifiedAt ? `Rider verified pickup: ${new Date(ticket.pickupVerifiedAt).toLocaleString()}` : 'Waiting for rider to enter the code from the bag.'}</p>
        {ticket.deliveryVerifiedAt && <p>Doorstep ticket verified: {new Date(ticket.deliveryVerifiedAt).toLocaleString()}</p>}
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-3 py-2"><Printer size={14} />Print {ticket.bagCount} bag label(s)</button>
        {ticket.canHandOver && <button type="button" className="ml-2 underline" onClick={() => { setBags(String(ticket.bagCount)); setEditing(true) }}>Correct bag count before pickup</button>}
      </div> : ticket.canHandOver ? <form onSubmit={(event) => { event.preventDefault(); if (valid) void save() }} className="space-y-3">
        <p>Check every item and quantity before sealing. Confirm the actual rider at the counter.</p>
        {ticket.items.map((item) => <label key={item.id} className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white p-3"><input type="checkbox" checked={checked.includes(item.id)} disabled={saving} onChange={(event) => setChecked((previous) => event.target.checked ? [...previous, item.id] : previous.filter((id) => id !== item.id))} /><span><strong>{item.quantity} × {item.name}</strong>{Object.keys(item.customizations).length > 0 && <span className="mt-1 block text-[11px] text-amber-800">{customizationText(item.customizations)}</span>}</span></label>)}
        <label className="block">Number of sealed bags<input aria-label="Number of sealed bags" type="number" min={1} max={30} value={bags} onChange={(event) => setBags(event.target.value)} disabled={saving} className="ml-2 w-20 rounded-lg border border-stone-300 p-2" /></label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={sealed} onChange={(event) => setSealed(event.target.checked)} disabled={saving} />All food packed and bags sealed</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={confirmedRider === ticket.assignedRider?.id} onChange={(event) => setConfirmedRider(event.target.checked ? ticket.assignedRider!.id : null)} disabled={saving} />I am handing these bags to {ticket.assignedRider?.name}</label>
        <button type="submit" disabled={!valid || saving || !!error} className="rounded-xl bg-[#B84A22] px-4 py-2.5 font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Record kitchen handover'}</button>
      </form> : <p className="rounded-lg bg-white p-3">{ticket.stage === 'assigned' ? 'Waiting for the assigned rider to accept.' : ticket.status !== 'ready' ? 'Mark the order ready after preparation. Handover requires an accepted rider assignment.' : 'Handover requires an active, accepted rider assignment with no unresolved issue and kitchen update permission.'}</p>}
      <DeliveryBagTicket ticket={ticket} />
    </div>}
    {!loading && !error && !ticket && <p className="mt-3">No bag ticket is available.</p>}
  </section>
}
