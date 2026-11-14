import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface FormDialogProps {
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
  busy?: boolean
}

export function FormDialog({ title, description, children, onClose, busy = false }: FormDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    const previousOverflow = document.body.style.overflow
    if (dialog && !dialog.open) dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog?.close()
      document.body.style.overflow = previousOverflow
    }
  }, [])

  return (
    <dialog
      ref={ref}
      aria-labelledby="menu-dialog-title"
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-3xl border border-stone-200 bg-white p-0 text-stone-900 shadow-2xl backdrop:bg-stone-950/50 backdrop:backdrop-blur-sm"
      onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }}
      onClick={(event) => { if (event.target === event.currentTarget && !busy) onClose() }}
    >
      <header className="flex items-start justify-between gap-4 border-b border-stone-100 px-6 py-5">
        <div>
          <h2 id="menu-dialog-title" className="text-lg font-bold tracking-tight">{title}</h2>
          {description && <p className="mt-1 text-xs leading-relaxed text-stone-500">{description}</p>}
        </div>
        <button type="button" aria-label={`Close ${title}`} onClick={onClose} disabled={busy} className="rounded-full p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-800 disabled:cursor-wait">
          <X size={18} />
        </button>
      </header>
      {children}
    </dialog>
  )
}
