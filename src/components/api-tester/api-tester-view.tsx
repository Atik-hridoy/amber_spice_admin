import { ExternalLink, Terminal } from 'lucide-react'
import { API_DOCS_URL } from '../../services/api-tester-service'
import { TesterCollection } from './tester-collection'
import { TesterMenuIds } from './tester-menu-ids'
import { TesterRequestBar } from './tester-request-bar'
import { TesterRequestEditor } from './tester-request-editor'
import { TesterResponse } from './tester-response'
import { TESTER_CARD } from './tester-styles'
import { useApiCollection } from './use-api-collection'
import { useApiTester } from './use-api-tester'

export function ApiTesterView() {
  const collection = useApiCollection()
  const tester = useApiTester()
  const selected = collection.presets.find((preset) => preset.id === tester.selected.id) || tester.selected
  return <div className="space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3"><span className="rounded-xl bg-[#B84A22] p-3 text-white"><Terminal size={21} /></span><div><h1 className="text-xl font-bold text-stone-900">API Studio</h1><p className="mt-1 text-xs text-stone-500">Live backend collection, JSON requests, file uploads and response inspection.</p></div></div>
      <a href={API_DOCS_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700">Swagger Docs<ExternalLink size={13} /></a>
    </header>
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
      <TesterCollection presets={collection.presets} selectedId={selected.id} isLoading={collection.isLoading} disabled={tester.isLoading} error={collection.error} onReload={() => void collection.reload()} onSelect={tester.select} />
      <div className="min-w-0 space-y-5 lg:col-span-3">
        <section className={`${TESTER_CARD} space-y-4`}>
          <div><h2 className="text-sm font-bold text-stone-800">{selected.name}</h2><p className="mt-1 text-xs text-stone-500">{selected.description}</p><p className="mt-2 text-[11px] text-stone-500">Fill editable templates before Send. POST, PUT, PATCH and DELETE change real backend records.</p></div>
          <TesterRequestBar request={tester.request} isLoading={tester.isLoading} onChange={tester.update} onSend={() => void tester.send()} onCancel={tester.cancel} />
          {selected.resource && <TesterMenuIds variables={tester.request.variables} disabled={tester.isLoading} onVariable={tester.variable} />}
          {selected.fields?.length ? <details className="rounded-xl bg-stone-50 p-3 text-xs text-stone-500"><summary className="cursor-pointer font-semibold">API fields (* required)</summary><p className="mt-2 leading-relaxed">{selected.fields.join(', ')}</p></details> : null}
          <TesterRequestEditor key={selected.id} request={tester.request} disabled={tester.isLoading} onChange={tester.update} onVariable={tester.variable} />
        </section>
        <TesterResponse key={`${selected.id}:${tester.requestNumber}`} response={tester.response} error={tester.error} />
      </div>
    </div>
  </div>
}
