import { useState } from 'react'
import {
  Check,
  Clock,
  Code2,
  Copy,
  ExternalLink,
  Key,
  Layers,
  RotateCcw,
  Send,
  Terminal,
} from 'lucide-react'
import { API_PRESETS, type ApiPreset, type HttpMethod } from './api-presets'

interface ApiResponseState {
  status: number | null
  statusText: string
  timeMs: number | null
  sizeBytes: number | null
  headers: Record<string, string>
  body: string | null
  error?: string
}

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  POST: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  PUT: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  PATCH: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  DELETE: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
}

export function ApiTesterView() {
  const [selectedMethod, setSelectedMethod] = useState<HttpMethod>('POST')
  const [url, setUrl] = useState('http://127.0.0.1:8000/api/v1/auth/login/')
  const [activeReqTab, setActiveReqTab] = useState<'body' | 'headers' | 'auth'>('body')
  const [requestBody, setRequestBody] = useState(
    JSON.stringify({ email: 'admin@restaurant.com', password: 'admin123' }, null, 2)
  )
  const [authToken, setAuthToken] = useState('')
  const [headersText, setHeadersText] = useState(
    JSON.stringify({ 'Content-Type': 'application/json', Accept: 'application/json' }, null, 2)
  )
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [response, setResponse] = useState<ApiResponseState | null>(null)
  const [searchFilter, setSearchFilter] = useState('')

  const handleSelectPreset = (preset: ApiPreset) => {
    setSelectedMethod(preset.method)
    setUrl(preset.url)
    if (preset.body) {
      setRequestBody(preset.body)
      setActiveReqTab('body')
    } else {
      setActiveReqTab('headers')
    }
  }

  const handleSendRequest = async () => {
    setIsLoading(true)
    const startTime = performance.now()

    try {
      const headersInit: Record<string, string> = {}
      try {
        Object.assign(headersInit, JSON.parse(headersText))
      } catch {
        headersInit['Content-Type'] = 'application/json'
      }

      if (authToken.trim()) {
        headersInit['Authorization'] = `Bearer ${authToken.trim()}`
      }

      const reqInit: RequestInit = {
        method: selectedMethod,
        headers: headersInit,
      }

      if (['POST', 'PUT', 'PATCH'].includes(selectedMethod) && requestBody.trim()) {
        reqInit.body = requestBody.trim()
      }

      const res = await fetch(url, reqInit)
      const endTime = performance.now()
      const timeMs = Math.round(endTime - startTime)

      const resHeaders: Record<string, string> = {}
      res.headers.forEach((val, key) => {
        resHeaders[key] = val
      })

      const rawText = await res.text()
      const sizeBytes = new Blob([rawText]).size

      let formattedBody = rawText
      try {
        const json = JSON.parse(rawText)
        formattedBody = JSON.stringify(json, null, 2)
        if (json.access && typeof json.access === 'string') {
          setAuthToken(json.access)
        }
      } catch {
        formattedBody = rawText
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        timeMs,
        sizeBytes,
        headers: resHeaders,
        body: formattedBody,
      })
    } catch (err: unknown) {
      const endTime = performance.now()
      setResponse({
        status: 0,
        statusText: 'Network Error',
        timeMs: Math.round(endTime - startTime),
        sizeBytes: 0,
        headers: {},
        body: null,
        error: err instanceof Error ? err.message : 'Connection failed. Ensure Django server is running.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyResponse = () => {
    if (response?.body) {
      navigator.clipboard.writeText(response.body)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
  }

  const handlePrettifyJson = () => {
    try {
      const parsed = JSON.parse(requestBody)
      setRequestBody(JSON.stringify(parsed, null, 2))
    } catch {}
  }

  const filteredPresets = API_PRESETS.filter(
    (p) =>
      p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.category.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.url.toLowerCase().includes(searchFilter.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#B84A22] to-[#FBA138] text-white shadow-sm">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1A130E]">
                API Studio (Postman Tester)
              </h1>
              <p className="text-xs sm:text-sm text-[#7A746E]">
                Live REST API sandbox with instant token injection, presets, and response inspection.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="http://127.0.0.1:8000/api/docs/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E6E1DC] bg-white px-3.5 py-2 text-xs font-semibold text-[#1A130E] hover:border-[#B84A22]/40 hover:bg-[#FAF9F5] shadow-xs transition"
          >
            <span>Swagger Docs</span>
            <ExternalLink className="h-3.5 w-3.5 text-[#7A746E]" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 rounded-2xl border border-[#EFEAE4] bg-white p-4 shadow-xs flex flex-col h-[680px]">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#F4EFEA]">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#B84A22]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#1A130E]">
                Endpoints Collection
              </span>
            </div>
            <span className="text-[11px] font-semibold text-[#7A746E] bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#EFEAE4]">
              {API_PRESETS.length}
            </span>
          </div>

          <input
            type="text"
            placeholder="Filter endpoints..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full rounded-xl border border-[#E6E1DC] bg-[#FAF8F5] px-3 py-1.5 text-xs text-[#1A130E] placeholder:text-[#9CA3AF] focus:border-[#B84A22] focus:bg-white focus:outline-none mb-3"
          />

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                  url === preset.url && selectedMethod === preset.method
                    ? 'border-[#B84A22] bg-[#FFF7ED]'
                    : 'border-transparent hover:border-[#EFEAE4] hover:bg-[#FAF8F5]'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5 mb-1">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      METHOD_COLORS[preset.method]
                    }`}
                  >
                    {preset.method}
                  </span>
                  <span className="text-[10px] text-[#9CA3AF] truncate">{preset.category}</span>
                </div>
                <div className="text-xs font-semibold text-[#1A130E] truncate">{preset.name}</div>
                <div className="text-[11px] text-[#7A746E] truncate">{preset.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-5">
          <div className="rounded-2xl border border-[#EFEAE4] bg-white p-4 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value as HttpMethod)}
                className={`rounded-xl border px-3 py-2.5 text-xs font-bold focus:outline-none cursor-pointer ${
                  METHOD_COLORS[selectedMethod]
                }`}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>

              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="http://127.0.0.1:8000/api/v1/..."
                className="flex-1 rounded-xl border border-[#E6E1DC] bg-[#FAF8F5] px-3.5 py-2.5 text-xs font-mono text-[#1A130E] focus:border-[#B84A22] focus:bg-white focus:outline-none"
              />

              <button
                type="button"
                onClick={handleSendRequest}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#B84A22] to-[#FBA138] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:brightness-105 active:scale-95 transition disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <RotateCcw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span>{isLoading ? 'Sending...' : 'Send'}</span>
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between border-b border-[#F4EFEA] pb-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveReqTab('body')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      activeReqTab === 'body'
                        ? 'bg-[#1A130E] text-white'
                        : 'text-[#7A746E] hover:text-[#1A130E]'
                    }`}
                  >
                    Body (JSON)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveReqTab('headers')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      activeReqTab === 'headers'
                        ? 'bg-[#1A130E] text-white'
                        : 'text-[#7A746E] hover:text-[#1A130E]'
                    }`}
                  >
                    Headers
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveReqTab('auth')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      activeReqTab === 'auth'
                        ? 'bg-[#1A130E] text-white'
                        : 'text-[#7A746E] hover:text-[#1A130E]'
                    }`}
                  >
                    Auth Bearer
                  </button>
                </div>

                {activeReqTab === 'body' && (
                  <button
                    type="button"
                    onClick={handlePrettifyJson}
                    className="text-[11px] font-semibold text-[#B84A22] hover:underline cursor-pointer"
                  >
                    Format JSON
                  </button>
                )}
              </div>

              <div className="mt-3">
                {activeReqTab === 'body' && (
                  <textarea
                    rows={6}
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    placeholder='{\n  "key": "value"\n}'
                    className="w-full rounded-xl border border-[#E6E1DC] bg-[#FAF8F5] p-3 text-xs font-mono text-[#1A130E] focus:border-[#B84A22] focus:bg-white focus:outline-none"
                  />
                )}

                {activeReqTab === 'headers' && (
                  <textarea
                    rows={6}
                    value={headersText}
                    onChange={(e) => setHeadersText(e.target.value)}
                    placeholder='{\n  "Content-Type": "application/json"\n}'
                    className="w-full rounded-xl border border-[#E6E1DC] bg-[#FAF8F5] p-3 text-xs font-mono text-[#1A130E] focus:border-[#B84A22] focus:bg-white focus:outline-none"
                  />
                )}

                {activeReqTab === 'auth' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-[#1A130E]">
                      JWT Bearer Token
                    </label>
                    <div className="relative">
                      <Key className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
                      <input
                        type="text"
                        value={authToken}
                        onChange={(e) => setAuthToken(e.target.value)}
                        placeholder="Paste JWT Access Token or login to auto-fill..."
                        className="w-full rounded-xl border border-[#E6E1DC] bg-[#FAF8F5] py-2 pl-10 pr-3.5 text-xs font-mono text-[#1A130E] focus:border-[#B84A22] focus:bg-white focus:outline-none"
                      />
                    </div>
                    <p className="text-[11px] text-[#7A746E]">
                      Sending a login request automatically populates this field with the generated access token.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#EFEAE4] bg-white p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#F4EFEA]">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-[#B84A22]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#1A130E]">
                  Response
                </span>
                {response?.status !== null && response?.status !== undefined && (
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                      response.status >= 200 && response.status < 300
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {response.status === 0 ? 'Failed' : `${response.status} ${response.statusText}`}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {response?.timeMs !== null && response?.timeMs !== undefined && (
                  <div className="flex items-center gap-1 text-xs text-[#7A746E]">
                    <Clock className="h-3.5 w-3.5 text-[#9CA3AF]" />
                    <span>{response.timeMs} ms</span>
                  </div>
                )}
                {response?.sizeBytes !== null && response?.sizeBytes !== undefined && (
                  <div className="text-xs text-[#7A746E]">
                    {(response.sizeBytes / 1024).toFixed(1)} KB
                  </div>
                )}
                {response?.body && (
                  <button
                    type="button"
                    onClick={handleCopyResponse}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#1A130E] hover:text-[#B84A22] transition cursor-pointer"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>
            </div>

            {response ? (
              response.error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-mono text-red-600">
                  {response.error}
                </div>
              ) : (
                <pre className="max-h-[380px] overflow-auto rounded-xl border border-[#E6E1DC] bg-[#FAF8F5] p-4 text-xs font-mono text-[#1A130E]">
                  {response.body || '(Empty Response)'}
                </pre>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center text-[#9CA3AF]">
                <Send className="h-8 w-8 stroke-1 mb-2 text-[#CBD5E1]" />
                <p className="text-xs font-medium text-[#7A746E]">
                  No response yet. Select an endpoint preset or enter a URL and click "Send".
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
