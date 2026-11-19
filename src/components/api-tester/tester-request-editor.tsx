import { useState } from 'react'
import { getAdminAccessToken, getAdminRefreshToken } from '../../services/admin-session'
import type { AuthMode, BodyMode, TesterRequest } from '../../types/api-tester'
import { TESTER_INPUT } from './tester-styles'

interface Props {
  request: TesterRequest
  disabled: boolean
  onChange: (values: Partial<TesterRequest>) => void
  onVariable: (key: string, value: string) => void
}

export function TesterRequestEditor({ request, disabled, onChange, onVariable }: Props) {
  const [tab, setTab] = useState('body')
  const [formatError, setFormatError] = useState('')
  const parameters = [...new Set([...request.url.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]))]
  const format = () => {
    try { onChange({ body: JSON.stringify(JSON.parse(request.body), null, 2) }); setFormatError('') }
    catch { setFormatError('The body is not valid JSON.') }
  }
  return <fieldset disabled={disabled} className="min-w-0 space-y-4">
    {parameters.length > 0 && <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{parameters.map((key) => <label key={key} className="text-xs font-semibold text-stone-600">{key}<input aria-label={key} value={request.variables[key] || ''} onChange={(event) => onVariable(key, event.target.value)} placeholder="Enter an existing ID" className={`${TESTER_INPUT} mt-1 font-mono`} /></label>)}</div>}
    <div role="tablist" aria-label="Request sections" className="flex gap-2 border-b border-stone-100 pb-2">{['body', 'headers', 'auth'].map((item) => <button key={item} type="button" role="tab" aria-selected={tab === item} onClick={() => setTab(item)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${tab === item ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-50'}`}>{item}</button>)}</div>
    {tab === 'body' && <div className="space-y-3">
      <div className="flex items-center justify-between gap-3"><label className="text-xs text-stone-600">Body format<select aria-label="Body format" value={request.bodyMode} onChange={(event) => onChange({ bodyMode: event.target.value as BodyMode })} className={`${TESTER_INPUT} mt-1`}><option value="none">No body</option><option value="json">JSON</option><option value="multipart">Multipart / file upload</option></select></label>{request.bodyMode !== 'none' && <button type="button" onClick={format} className="text-xs font-semibold text-[#B84A22]">Format JSON</button>}</div>
      {request.bodyMode !== 'none' && <><label className="block text-xs text-stone-600">{request.bodyMode === 'multipart' ? 'Multipart properties (JSON)' : 'JSON body'}<textarea aria-label="Request body" rows={9} spellCheck={false} value={request.body} onChange={(event) => { onChange({ body: event.target.value }); setFormatError('') }} className={`${TESTER_INPUT} mt-1 font-mono`} /></label>{formatError && <p role="alert" className="text-xs text-red-700">{formatError}</p>}</>}
      {request.bodyMode === 'multipart' && <div className="grid gap-3 rounded-xl border border-dashed border-stone-300 p-3 sm:grid-cols-2"><label className="text-xs text-stone-600">File field<input aria-label="File field" value={request.fileField} onChange={(event) => onChange({ fileField: event.target.value })} className={`${TESTER_INPUT} mt-1`} /></label><label className="text-xs text-stone-600">Upload file<input aria-label="Upload file" type="file" onChange={(event) => onChange({ file: event.target.files?.[0] || null })} className="mt-2 block max-w-full text-xs" />{request.file && <span className="mt-1 block truncate text-xs">{request.file.name}</span>}</label><p className="text-[11px] text-stone-500 sm:col-span-2">For category/dish images use field image, JPG/PNG/WebP up to 5 MB. The browser sets the multipart boundary. Clear an image with JSON: &#123;"image": null&#125;.</p></div>}
      {['GET', 'DELETE'].includes(request.method) && <p className="text-xs text-stone-500">This request sends no body.</p>}
    </div>}
    {tab === 'headers' && <label className="block text-xs text-stone-600">Headers (JSON)<textarea aria-label="Request headers" value={request.headers} onChange={(event) => onChange({ headers: event.target.value })} rows={7} spellCheck={false} className={`${TESTER_INPUT} mt-1 font-mono`} /><span className="mt-2 block text-[11px] text-stone-500">Set Authorization through the Auth tab. Multipart Content-Type is set automatically.</span></label>}
    {tab === 'auth' && <div className="space-y-3"><label className="block text-xs text-stone-600">Authentication<select aria-label="Authentication" value={request.authMode} onChange={(event) => onChange({ authMode: event.target.value as AuthMode })} className={`${TESTER_INPUT} mt-1`}><option value="session">Current admin session</option><option value="manual">Manual bearer token</option><option value="none">No authentication (public test)</option></select></label>
      {request.authMode === 'session' && <p className="text-xs text-stone-500">{getAdminAccessToken() || getAdminRefreshToken() ? 'Uses your connected admin account, including token refresh.' : 'No connected admin session. Protected requests will return an authentication error.'}</p>}
      {request.authMode === 'manual' && <label className="block text-xs text-stone-600">JWT access token<input aria-label="JWT access token" type="password" autoComplete="off" value={request.token} onChange={(event) => onChange({ token: event.target.value })} className={`${TESTER_INPUT} mt-1 font-mono`} /><span className="mt-2 block text-[11px] text-stone-500">A successful login/refresh response fills this field for testing; it does not replace your admin login.</span></label>}
      {request.authMode === 'none' && <p className="text-xs text-stone-500">No Authorization header is sent. Use this to check public visibility and denied writes.</p>}
    </div>}
  </fieldset>
}
