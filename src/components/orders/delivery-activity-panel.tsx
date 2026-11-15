import { useEffect, useState } from 'react'
import type { DeliveryActivity, DeliverySummary } from '../../types/admin'
import { orderService } from '../../services/order-service'

interface DeliveryActivityPanelProps {
  orderId: string
  progress: DeliverySummary | null | undefined
  canResolve: boolean
  onReload: () => void
}

export function DeliveryActivityPanel({ orderId, progress, canResolve, onReload }: DeliveryActivityPanelProps) {
  const [open, setOpen] = useState(Boolean(progress?.hasIssue))
  const [attempt, setAttempt] = useState(0)
  const key = `${orderId}:${JSON.stringify(progress)}:${attempt}`
  const [result, setResult] = useState<{ key: string; data: DeliveryActivity | null; error: string } | null>(null)
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    orderService.deliveryProgress(orderId, controller.signal).then(
      (data) => { if (!controller.signal.aborted) setResult({ key, data, error: '' }) },
      (error: unknown) => { if (!controller.signal.aborted) setResult({ key, data: null, error: error instanceof Error ? error.message : 'Unable to load rider activity.' }) },
    )
    return () => controller.abort()
  }, [open, orderId, key])
  const resolve = async (approveReturn = false) => {
    if (isSaving || !note.trim()) return
    setIsSaving(true)
    setSaveError('')
    try {
      const saved = await (approveReturn ? orderService.requestDeliveryReturn(orderId, note.trim()) : orderService.resolveDeliveryIssue(orderId, note.trim()))
      setResult({ key, data: saved, error: '' })
      setNote('')
      onReload()
    } catch (error) { setSaveError(error instanceof Error ? error.message : 'Unable to resolve issue. Please retry.') }
    finally { setIsSaving(false) }
  }
  const current = result?.key === key ? result : null
  return <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs">
    <button type="button" className="flex w-full justify-between font-semibold text-[#B84A22]" aria-expanded={open} onClick={() => { setOpen(!open); setAttempt((value) => value + 1) }}>
      <span>{progress?.hasIssue ? 'Delivery issue · Review rider report' : 'Rider activity'}{progress ? ` · ${progress.stage.replaceAll('_', ' ')}` : ''}</span><span>{open ? '−' : '+'}</span>
    </button>
    {open && (!current ? <p role="status" className="mt-3">Loading rider activity…</p> : current.error ? <div role="alert" className="mt-3 text-red-700">{current.error} <button type="button" className="underline" onClick={() => setAttempt((value) => value + 1)}>Retry rider activity</button></div> : !current.data ? <p className="mt-3 text-stone-500">No rider activity recorded for this order.</p> : <div className="mt-4 space-y-3">
      {current.data.issue && <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
        <strong className="capitalize">{current.data.issue.code.replaceAll('_', ' ')}</strong><p className="mt-1">{current.data.issue.note}</p><p className="mt-1 text-stone-500">Reported {new Date(current.data.issue.reportedAt).toLocaleString()}</p>
        {canResolve && <form onSubmit={(event) => { event.preventDefault(); void resolve() }} className="mt-3 space-y-2">
          <label className="block">Resolution note<textarea aria-label="Delivery resolution note" required maxLength={1000} rows={2} value={note} disabled={isSaving} onChange={(event) => setNote(event.target.value)} className="mt-1 w-full rounded-lg border border-orange-200 bg-white p-2" /></label>
          {saveError && <p role="alert" className="text-red-700">{saveError} Retry after checking the note.</p>}
          <button disabled={isSaving || !note.trim()} className="rounded-lg bg-[#B84A22] px-3 py-2 text-white disabled:opacity-50">{isSaving ? 'Saving…' : 'Resolve and let rider continue'}</button>
          {['picked_up', 'arrived'].includes(current.data.stage) && <button type="button" disabled={isSaving || !note.trim()} onClick={() => void resolve(true)} className="ml-2 rounded-lg border border-orange-300 px-3 py-2 disabled:opacity-50">Approve return to restaurant</button>}
        </form>}
      </div>}
      {current.data.events.length === 0 ? <p>No recorded rider events yet.</p> : <ol className="space-y-2">{current.data.events.map((event) => <li key={event.id} className="border-l-2 border-stone-200 pl-3">
        <strong className="capitalize">{event.action.replaceAll('_', ' ')}</strong><span className="ml-2 text-stone-500">{event.actorName} · {new Date(event.createdAt).toLocaleString()}</span>{event.note && <p className="mt-1">{event.note}</p>}{event.amount !== null && <p>€{event.amount} cash recorded</p>}
      </li>)}</ol>}
    </div>)}
  </div>
}
