import { useState, useEffect, useCallback } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { contactService } from '../../services/contact-service'
import type { ContactMessage } from '../../types/contact'

interface ContactInquiriesTabProps {
  initialSelectedId?: number | string | null
  onClearSelectedId?: () => void
}

export function ContactInquiriesTab({
  initialSelectedId,
  onClearSelectedId,
}: ContactInquiriesTabProps) {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'read' | 'resolved'>('all')
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [actionBusyId, setActionBusyId] = useState<number | null>(null)

  const loadMessages = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError('')
    try {
      const data = await contactService.list(undefined, signal)
      setMessages(data)
    } catch (err) {
      if (signal?.aborted) return
      setError(err instanceof Error ? err.message : 'Unable to load contact inquiries.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadMessages(controller.signal)
    return () => controller.abort()
  }, [loadMessages])

  // If opened via notification click
  useEffect(() => {
    if (initialSelectedId && messages.length > 0) {
      const found = messages.find((m) => String(m.id) === String(initialSelectedId))
      if (found) {
        setSelectedMessage(found)
        if (found.status === 'new') {
          void handleUpdateStatus(found.id, 'read')
        }
      }
    }
  }, [initialSelectedId, messages])

  const handleUpdateStatus = async (id: number, newStatus: 'new' | 'read' | 'resolved') => {
    setActionBusyId(id)
    try {
      const updated = await contactService.updateStatus(id, newStatus)
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated, status: newStatus } : m)))
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage((prev) => (prev ? { ...prev, status: newStatus } : null))
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status.')
    } finally {
      setActionBusyId(null)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this inquiry message?')) return
    setActionBusyId(id)
    try {
      await contactService.delete(id)
      setMessages((prev) => prev.filter((m) => m.id !== id))
      if (selectedMessage?.id === id) {
        setSelectedMessage(null)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete message.')
    } finally {
      setActionBusyId(null)
    }
  }

  // Filter messages
  const filtered = messages.filter((m) => {
    const matchStatus = statusFilter === 'all' || m.status === statusFilter
    const q = searchQuery.toLowerCase().trim()
    const matchSearch =
      !q ||
      m.fullName.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.subject.toLowerCase().includes(q) ||
      m.message.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  const newCount = messages.filter((m) => m.status === 'new').length
  const readCount = messages.filter((m) => m.status === 'read').length
  const resolvedCount = messages.filter((m) => m.status === 'resolved').length

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Total Inquiries</span>
            <Mail className="h-4 w-4 text-stone-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-stone-900">{messages.length}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Website contact submissions</p>
        </div>

        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">Action Required (New)</span>
            {newCount > 0 && (
              <span className="flex h-2 w-2 rounded-full bg-[#F15A24] animate-ping" />
            )}
          </div>
          <p className="mt-2 text-2xl font-black text-[#F15A24]">{newCount}</p>
          <p className="text-[11px] text-amber-700/80 mt-0.5">Awaiting staff response</p>
        </div>

        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Resolved / Closed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-700">{resolvedCount}</p>
          <p className="text-[11px] text-emerald-600/80 mt-0.5">Customer answered</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, email, subject..."
            className="w-full rounded-xl border border-stone-200 bg-[#FAF9F5] py-2 pl-10 pr-4 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#B84A22] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter tabs */}
          <div className="flex items-center rounded-xl bg-stone-100 p-1 text-xs">
            {(['all', 'new', 'read', 'resolved'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`rounded-lg px-3 py-1 font-semibold capitalize transition cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                {tab === 'all'
                  ? `All (${messages.length})`
                  : tab === 'new'
                  ? `New (${newCount})`
                  : tab === 'read'
                  ? `Read (${readCount})`
                  : `Resolved (${resolvedCount})`}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void loadMessages()}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 transition cursor-pointer"
            title="Refresh Inquiries"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => void loadMessages()}
            className="font-bold underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-2xs">
        {loading && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-[#F15A24]" />
            <p className="mt-3 text-xs text-stone-500">Loading website contact messages...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400">
              <Mail className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-bold text-stone-800">No inquiries found</p>
            <p className="text-xs text-stone-400 mt-1">
              {searchQuery
                ? `No messages match "${searchQuery}".`
                : statusFilter !== 'all'
                ? `No messages with status "${statusFilter}".`
                : 'Any messages sent from the website contact page will appear here in real time.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stone-200 bg-stone-50 text-[11px] font-bold tracking-wider text-stone-500 uppercase">
                <tr>
                  <th className="px-5 py-3.5">Customer & Email</th>
                  <th className="px-5 py-3.5">Subject & Preview</th>
                  <th className="px-5 py-3.5">Submitted At</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((item) => {
                  const isNew = item.status === 'new'
                  const isRead = item.status === 'read'
                  const isResolved = item.status === 'resolved'

                  return (
                    <tr
                      key={item.id}
                      onClick={() => {
                        setSelectedMessage(item)
                        if (isNew) void handleUpdateStatus(item.id, 'read')
                      }}
                      className={`hover:bg-stone-50/80 transition cursor-pointer ${
                        isNew ? 'bg-amber-50/20 font-medium' : ''
                      }`}
                    >
                      {/* Customer */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                              isNew
                                ? 'bg-[#F15A24]/10 text-[#F15A24]'
                                : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            {item.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-stone-900">{item.fullName}</p>
                            <a
                              href={`mailto:${item.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[11px] text-stone-500 hover:text-[#F15A24] transition flex items-center gap-1 mt-0.5"
                            >
                              <span>{item.email}</span>
                            </a>
                          </div>
                        </div>
                      </td>

                      {/* Subject & Preview */}
                      <td className="px-5 py-4 max-w-xs">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-stone-900 truncate">{item.subject}</p>
                          {isNew && (
                            <span className="rounded-full bg-[#F15A24] px-1.5 py-0.2 text-[9px] font-bold text-white shrink-0">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                          {item.message}
                        </p>
                      </td>

                      {/* Submitted At */}
                      <td className="px-5 py-4 text-stone-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Clock className="h-3 w-3 text-stone-400" />
                          <span>
                            {new Date(item.createdAt || item.created_at || '').toLocaleDateString(
                              undefined,
                              {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                            isNew
                              ? 'bg-amber-500/10 text-amber-700 border-amber-300'
                              : isRead
                              ? 'bg-blue-500/10 text-blue-700 border-blue-200'
                              : 'bg-emerald-500/10 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {isNew ? '● New' : isRead ? 'Read' : '✓ Resolved'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMessage(item)
                              if (isNew) void handleUpdateStatus(item.id, 'read')
                            }}
                            className="rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition"
                          >
                            View
                          </button>

                          {!isResolved && (
                            <button
                              type="button"
                              disabled={actionBusyId === item.id}
                              onClick={() => void handleUpdateStatus(item.id, 'resolved')}
                              className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-50"
                              title="Mark as Resolved"
                            >
                              Resolve
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={actionBusyId === item.id}
                            onClick={() => void handleDelete(item.id)}
                            className="p-1 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-100 transition disabled:opacity-50"
                            title="Delete inquiry"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Message Detail & Reply Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-stone-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.2 text-[10px] font-bold uppercase tracking-wider border ${
                      selectedMessage.status === 'new'
                        ? 'bg-amber-500/10 text-amber-700 border-amber-300'
                        : selectedMessage.status === 'read'
                        ? 'bg-blue-500/10 text-blue-700 border-blue-200'
                        : 'bg-emerald-500/10 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {selectedMessage.status}
                  </span>
                  <span className="text-[11px] text-stone-400">
                    {new Date(
                      selectedMessage.createdAt || selectedMessage.created_at || ''
                    ).toLocaleString()}
                  </span>
                </div>
                <h3 className="mt-1 text-base font-bold text-stone-900">
                  {selectedMessage.subject}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedMessage(null)
                  if (onClearSelectedId) onClearSelectedId()
                }}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sender details */}
            <div className="mt-4 rounded-xl bg-stone-50 p-3.5 border border-stone-200/80 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-stone-500">From:</span>
                <span className="font-bold text-stone-900">{selectedMessage.fullName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Email:</span>
                <a
                  href={`mailto:${selectedMessage.email}`}
                  className="font-semibold text-[#F15A24] hover:underline"
                >
                  {selectedMessage.email}
                </a>
              </div>
            </div>

            {/* Message Body */}
            <div className="mt-4">
              <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                Inquiry Message:
              </label>
              <div className="mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-stone-200 bg-[#FAF9F5] p-4 text-xs leading-relaxed text-stone-800 whitespace-pre-wrap font-sans">
                {selectedMessage.message}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-stone-100 pt-4">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {selectedMessage.status !== 'resolved' ? (
                  <button
                    type="button"
                    onClick={() => void handleUpdateStatus(selectedMessage.id, 'resolved')}
                    className="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
                  >
                    Mark as Resolved
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleUpdateStatus(selectedMessage.id, 'read')}
                    className="rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                  >
                    Mark as Unresolved (Read)
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(
                    selectedMessage.subject
                  )}&body=${encodeURIComponent(
                    `\n\n\n--- Customer Inquiry from Amber Spice Website ---\n"${selectedMessage.message}"\n`
                  )}`}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#B84A22] to-[#FBA138] px-4 py-2 text-xs font-bold text-white shadow-sm hover:brightness-105 transition cursor-pointer"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Reply via Email</span>
                  <ExternalLink className="h-3 w-3 opacity-80" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
