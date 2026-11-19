import { useEffect, useRef, useState } from 'react'
import { adminRequest } from '../../services/api-client'
import { dishService } from '../../services/dish-service'
import type { MenuDish } from '../../types/menu-dish'

export function CreateOrderForm({ onSaved }: { onSaved: () => void }) {
  const [dishes, setDishes] = useState<MenuDish[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [dishId, setDishId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [mode, setMode] = useState('takeaway')
  const [table, setTable] = useState('')
  const [busy, setBusy] = useState(false)
  const [quote, setQuote] = useState<{ totalAmount: string } | null>(null)
  const attempt = useRef<{ signature: string; id: string } | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    dishService.list(controller.signal).then(rows => { if (!controller.signal.aborted) { setDishes(rows.filter(dish => dish.isAvailable)); setError('') } })
      .catch(err => { if (!controller.signal.aborted) setError(err.message) }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [retry])
  useEffect(() => {
    const controller = new AbortController()
    setQuote(null)
    if (dishId) adminRequest<{ totalAmount: string }>('orders/quote/', { method: 'POST', requireAuth: true, signal: controller.signal,
      body: JSON.stringify({ diningType: mode, items: [{ dishId: Number(dishId), quantity }] }),
    }).then(data => { if (!controller.signal.aborted) { setQuote(data); setError('') } }).catch(err => { if (!controller.signal.aborted) setError(err.message) })
    return () => controller.abort()
  }, [dishId, quantity, mode, retry])
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy || !quote) return
    const payload = { customerName: name.trim(), customerPhone: phone.trim(), deliveryAddress: address.trim(),
      diningType: mode, tableNumber: mode === 'dine-in' ? table : undefined, paymentMethod: 'cash', totalAmount: Number(quote.totalAmount),
      items: [{ dishId: Number(dishId), quantity }] }
    const signature = JSON.stringify(payload)
    if (attempt.current?.signature !== signature) attempt.current = { signature, id: crypto.randomUUID() }
    setBusy(true)
    try { await adminRequest('orders/', { method: 'POST', requireAuth: true, body: JSON.stringify({ ...payload, clientRequestId: attempt.current.id }) }); onSaved() }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to save order.'); setRetry(value => value + 1) }
    finally { setBusy(false) }
  }
  const style = 'rounded-xl border p-3 w-full'
  return <form onSubmit={submit} className="space-y-3 rounded-2xl border bg-white p-5">
    <h2 className="font-bold">Create cash order</h2>
    {loading && <p role="status">Loading menu…</p>}
    {error && <div role="alert">{error} <button type="button" className="underline" onClick={() => setRetry(value => value + 1)}>Retry</button></div>}
    {!loading && !dishes.length && !error && <p>No available dishes. Add dishes under Menu first.</p>}
    <fieldset disabled={busy} className="grid sm:grid-cols-2 gap-3">
      <label>Customer name<input required className={style} value={name} onChange={e => setName(e.target.value)} /></label>
      <label>Phone<input type="tel" required={mode === 'delivery'} className={style} value={phone} onChange={e => setPhone(e.target.value)} /></label>
      <label>Fulfillment<select className={style} value={mode} onChange={e => setMode(e.target.value)}><option value="takeaway">Takeaway</option><option value="delivery">Delivery</option><option value="dine-in">Dine-in</option></select></label>
      <label>Dish<select required className={style} value={dishId} onChange={e => setDishId(e.target.value)}><option value="">Select dish</option>{dishes.map(dish => <option key={dish.id} value={dish.id}>{dish.name} · €{dish.price}</option>)}</select></label>
      <label>Quantity<input type="number" min={1} max={100} required className={style} value={quantity} onChange={e => setQuantity(Number(e.target.value))} /></label>
      {mode === 'delivery' && <label>Delivery address<input required className={style} value={address} onChange={e => setAddress(e.target.value)} /></label>}
      {mode === 'dine-in' && <label>Table number<input required className={style} value={table} onChange={e => setTable(e.target.value)} /></label>}
    </fieldset>
    {dishId && !quote && !error && <p role="status">Calculating total…</p>}
    {quote && <p>Total due in cash: €{quote.totalAmount}</p>}
    <button disabled={busy || !quote} className="rounded-xl bg-[#B84A22] p-3 text-white disabled:opacity-50">{busy ? 'Saving…' : 'Save Order'}</button>
  </form>
}
