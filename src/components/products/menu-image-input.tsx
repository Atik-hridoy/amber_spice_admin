import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Image, Upload, X } from 'lucide-react'

interface MenuImageInputProps {
  kind?: 'Category' | 'Dish'
  file: File | null
  imageUrl: string
  error?: string
  onFileChange: (file: File | null, error: string) => void
  onUrlChange: (url: string) => void
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function MenuImageInput({ kind = 'Category', file, imageUrl, error, onFileChange, onUrlChange }: MenuImageInputProps) {
  const prefix = kind.toLowerCase()
  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!selected) return
    if (selected.type ? !IMAGE_TYPES.includes(selected.type) : !/\.(jpe?g|png|webp)$/i.test(selected.name)) {
      onFileChange(null, 'Choose a JPG, PNG or WebP image.')
    } else if (!selected.size || selected.size > MAX_IMAGE_BYTES) {
      onFileChange(null, selected.size ? 'Choose an image up to 5 MB.' : 'This file is empty. Choose another image.')
    } else {
      onFileChange(selected, '')
    }
  }

  return (
    <div>
      <p className="text-xs font-semibold text-stone-700">{kind} image <span className="font-normal text-stone-400">(optional)</span></p>
      <label className={`relative mt-2 flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed bg-[#FAF9F5] p-4 transition-colors focus-within:ring-2 focus-within:ring-[#B84A22]/30 hover:border-[#B84A22] ${error ? 'border-red-400' : 'border-stone-300'}`}>
        <input type="file" aria-label={`Upload ${kind.toLowerCase()} image`} accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={chooseFile} className="sr-only" aria-invalid={!!error} aria-describedby={`${prefix}-upload-help ${prefix}-upload-error`} />
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#B84A22] shadow-sm"><Upload size={20} /></span>
        <span><span className="block text-sm font-semibold text-stone-800">{file ? 'Choose another image' : 'Choose Image'}</span><span id={`${prefix}-upload-help`} className="mt-1 block text-xs text-stone-500">JPG, PNG or WebP · up to 5 MB</span></span>
      </label>
      {(file || error) && <div className="mt-3 flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-2.5">
        {file && <LocalImagePreview file={file} kind={kind} />}
        <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-stone-800">{file?.name || 'Choose another image'}</p>{file && <p className="mt-1 text-[11px] text-stone-500">{(file.size / 1024).toFixed(0)} KB · Ready to upload when you save</p>}</div>
        <button type="button" aria-label={`Remove ${kind.toLowerCase()} image`} onClick={() => onFileChange(null, '')} className="rounded-full p-2 text-stone-500 hover:bg-stone-100 hover:text-red-700"><X size={16} /></button>
      </div>}
      {error && <p id={`${prefix}-upload-error`} role="alert" className="mt-1.5 text-xs text-red-700">{error}</p>}
      <label htmlFor={`${prefix}-image`} className="mt-3 block text-xs text-stone-500">Or use an Image URL</label>
      <input id={`${prefix}-image`} type="url" pattern="https?://.+" maxLength={500} value={imageUrl} onChange={(event) => onUrlChange(event.target.value)} placeholder="https://example.com/images/seafood.webp" className="mt-1.5 w-full rounded-xl border border-stone-200 bg-[#FAF9F5] px-3 py-2.5 text-sm outline-none focus:border-[#B84A22] focus:ring-2 focus:ring-[#B84A22]/15" aria-invalid={!!error} aria-describedby={`${prefix}-upload-error`} />
      {!file && /^https?:\/\//.test(imageUrl) && <RemoteImagePreview key={imageUrl} src={imageUrl} kind={kind} onRemove={() => onUrlChange('')} />}
    </div>
  )
}

function LocalImagePreview({ file, kind }: { file: File; kind: string }) {
  const ref = useRef<HTMLImageElement>(null)
  useEffect(() => {
    const url = URL.createObjectURL(file)
    if (ref.current) ref.current.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])
  return <img ref={ref} alt={`Selected ${kind.toLowerCase()} image preview`} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
}

function RemoteImagePreview({ src, kind, onRemove }: { src: string; kind: string; onRemove: () => void }) {
  const [failed, setFailed] = useState(false)
  return <div className="mt-3 flex items-center gap-3 rounded-xl border border-stone-200 p-2.5">
    {failed ? <Image size={24} className="m-3 text-stone-400" /> : <img src={src} alt={`${kind} preview`} onError={() => setFailed(true)} className="h-14 w-14 rounded-lg object-cover" />}
    <button type="button" aria-label={`Remove ${kind.toLowerCase()} image`} onClick={onRemove} className="ml-auto rounded-full p-2 text-stone-500 hover:bg-stone-100"><X size={16} /></button>
    <p className="text-[11px] text-stone-500">{failed ? 'Image could not be loaded. Check the link.' : `${kind} image preview`}</p>
  </div>
}
