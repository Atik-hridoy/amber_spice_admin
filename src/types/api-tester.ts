export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
export type BodyMode = 'json' | 'multipart' | 'none'
export type AuthMode = 'session' | 'manual' | 'none'
export type MenuResource = 'category' | 'dish'

export interface ApiPreset {
  id: string
  name: string
  category: string
  method: HttpMethod
  url: string
  body?: string
  description: string
  bodyMode?: BodyMode
  auth?: AuthMode
  resource?: MenuResource
  fields?: string[]
}

export interface TesterRequest {
  method: HttpMethod
  url: string
  variables: Record<string, string>
  body: string
  bodyMode: BodyMode
  headers: string
  authMode: AuthMode
  token: string
  file: File | null
  fileField: string
}

export interface TesterResponse {
  status: number
  statusText: string
  timeMs: number
  sizeBytes: number
  headers: Record<string, string>
  body: string
  json?: unknown
}
