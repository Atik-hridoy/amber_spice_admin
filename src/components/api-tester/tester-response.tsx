import { useState } from 'react'
import type { TesterResponse as ResponseData } from '../../types/api-tester'
import { ADMIN_API_BASE_URL } from '../../services/api-client'
import { TESTER_CARD } from './tester-styles'

function imagesFromResponse(json: unknown): string[] {
  if (!json || typeof json !== 'object') return []
  const rows = Array.isArray(json) ? json : 'results' in json && Array.isArray(json.results) ? json.results : [json]
  return rows.flatMap((row: unknown) => {
    if (!row || typeof row !== 'object' || !('imageUrl' in row) || typeof row.imageUrl !== 'string' || !row.imageUrl) return []
    try { const url = new URL(row.imageUrl, new URL(ADMIN_API_BASE_URL).origin); return ['http:', 'https:'].includes(url.protocol) ? [url.href] : [] }
    catch { return [] }
  }).slice(0, 6)
}

export function TesterResponse({ response, error }: { response: ResponseData | null; error: string }) {
  const [tab, setTab] = useState('body')
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState('')
  const copy = async () => {
    try { await navigator.clipboard.writeText(response?.body || ''); setCopied(true); setCopyError('') }
    catch { setCopyError('Could not copy. Select and copy the response text.') }
  }
  return <section aria-label="API response" className={`${TESTER_CARD} space-y-3`}>
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><h2 className="text-sm font-bold text-stone-800">Response</h2>{response && <span role="status" className={`rounded-full px-2 py-1 text-xs font-bold ${response.status >= 200 && response.status < 300 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{response.status} {response.statusText}</span>}</div>{response && <div className="flex items-center gap-3 text-xs text-stone-500"><span>{response.timeMs} ms</span><span>{(response.sizeBytes / 1024).toFixed(1)} KB</span><button type="button" onClick={() => void copy()} className="font-semibold text-[#B84A22]">{copied ? 'Copied' : 'Copy response'}</button></div>}</div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {copyError && <p role="alert" className="text-xs text-red-700">{copyError}</p>}
    {response ? <>
      <div className="flex gap-3 border-b border-stone-100 pb-2">{['body', 'headers'].map((item) => <button key={item} type="button" aria-pressed={tab === item} onClick={() => setTab(item)} className={`text-xs font-semibold capitalize ${tab === item ? 'text-[#B84A22]' : 'text-stone-500'}`}>Response {item}</button>)}</div>
      <pre aria-label={tab === 'body' ? 'Response body' : 'Response headers'} className="max-h-[430px] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-stone-200 bg-stone-50 p-4 font-mono text-xs text-stone-800">{tab === 'body' ? response.body || '(Empty response)' : JSON.stringify(response.headers, null, 2)}</pre>
      {tab === 'body' && <div className="flex flex-wrap gap-3">{imagesFromResponse(response.json).map((url) => <a key={url} href={url} target="_blank" rel="noreferrer" className="block rounded-lg border border-stone-200 p-2"><img src={url} alt="API image preview" className="h-20 w-24 rounded object-cover" /><span className="mt-1 block text-[10px] text-[#B84A22]">Open image URL</span></a>)}</div>}
    </> : !error && <p className="py-12 text-center text-sm text-stone-400">Select an endpoint and press Send to inspect its real response.</p>}
  </section>
}
