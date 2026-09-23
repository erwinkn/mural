// Thin client for the Worker's /api endpoints. All calls include the session
// cookie; a 401 surfaces as AuthError so the app can bounce to /login.

import type { Archive, Preferences, SessionRecord, SourceLink } from './models'

export class AuthError extends Error {
  constructor() {
    super('unauthorized')
  }
}
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

async function call<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const response = await fetch(path, {
    method: options.method ?? (options.body === undefined ? 'GET' : 'POST'),
    headers: options.body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    credentials: 'same-origin',
  })
  if (response.status === 401) throw new AuthError()
  if (!response.ok) {
    let message = `Request failed (HTTP ${response.status}).`
    try {
      const data = (await response.json()) as { error?: string }
      if (data.error) message = data.error
    } catch {
      /* keep default */
    }
    throw new ApiError(response.status, message)
  }
  return (await response.json()) as T
}

export const api = {
  session: () => call<{ ok: true }>('/api/session'),
  login: (password: string) => call<{ ok: true }>('/api/login', { body: { password } }),
  logout: () => call<{ ok: true }>('/api/logout', { method: 'POST', body: {} }),

  getArchive: () => call<{ archive: Archive }>('/api/archive'),
  savePreferences: (preferences: Preferences) =>
    call<{ ok: true }>('/api/preferences', { method: 'PUT', body: { preferences } }),
  saveSession: (session: SessionRecord) =>
    call<{ ok: true }>('/api/sessions', { method: 'PUT', body: { session } }),
  deleteSession: (id: string) =>
    call<{ ok: true }>('/api/sessions/delete', { body: { id } }),
  deleteAll: () => call<{ ok: true }>('/api/archive/delete-all', { method: 'POST', body: {} }),
  importArchive: (archive: Archive) =>
    call<{ archive: Archive }>('/api/archive/import', { body: { archive } }),

  createVoiceSession: (instructions: string, sdp: string) =>
    call<{ sdp: string; session?: Record<string, unknown> }>('/api/realtime', {
      body: { instructions, sdp },
    }),

  ai: (request: AIRequest) => call<AIResponse>('/api/ai', { body: request }),
}

export type AIRequest =
  | { kind: 'translate'; languageId: string; meaningLanguage: string; text: string }
  | { kind: 'assess'; languageId: string; context: string }
  | { kind: 'lookup'; languageId: string; meaningLanguage: string; word: string; sentence: string }
  | { kind: 'typedReply'; languageId: string; context: string }
  | { kind: 'delegation'; languageId: string; context: string; allowSearch: boolean }
  | { kind: 'topic'; languageId: string; query: string }

export interface AIUsage {
  input: number
  output: number
  searches: number
}
export interface AIResponse {
  text: string
  sources: SourceLink[]
  usage: AIUsage
}
