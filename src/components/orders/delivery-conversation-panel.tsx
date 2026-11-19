import { useEffect, useState } from 'react'
import { deliveryContactService, type DeliveryContactMessage } from '../../services/delivery-contact-service'
export function DeliveryConversationPanel({ orderId }: { orderId: string }) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ messages: DeliveryContactMessage[]; error: string } | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    const read = () => deliveryContactService.messages(orderId, controller.signal).then(
      (messages) => { if (!controller.signal.aborted) setResult({ messages, error: '' }) },
      (error: unknown) => { if (!controller.signal.aborted) setResult({ messages: [], error: error instanceof Error ? error.message : 'Unable to read delivery messages.' }) },
    )
    void read()
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void read() }, 10000)
    return () => { controller.abort(); window.clearInterval(timer) }
  }, [orderId, attempt])
  return <section className="mt-4 border-t border-stone-200 pt-4">
    <h4 className="font-semibold">Customer ↔ Rider messages</h4><p className="mt-1 text-stone-500">Read-only support history · refreshes every 10 seconds</p>
    {!result ? <p role="status" className="mt-3">Loading saved messages…</p> : result.error ? <p role="alert" className="mt-3 text-red-700">{result.error} <button type="button" className="underline" onClick={() => setAttempt((value) => value + 1)}>Retry messages</button></p> : result.messages.length ? <ol className="mt-3 max-h-64 space-y-3 overflow-y-auto">{result.messages.map((message) => <li key={message.id} className="rounded-lg border border-stone-200 bg-white p-3"><strong>{message.senderName} · {message.senderRole}</strong><p className="mt-1 whitespace-pre-wrap break-words">{message.body}</p><time className="mt-1 block text-stone-500">{new Date(message.createdAt).toLocaleString()}</time></li>)}</ol> : <p className="mt-3 text-stone-500">No saved messages. Customer/rider messaging opens after verified pickup.</p>}
  </section>
}
