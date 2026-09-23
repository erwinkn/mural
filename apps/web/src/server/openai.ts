// Server-side OpenAI access: live-session SDP exchange plus the Responses
// API prompts ported from apps/ios/App/APIClient.swift. The API key never
// leaves the Worker.

import { getEnv, openAIBase, textModel, voiceModel } from './env'
import { safeURL, type SourceLink } from '../lib/models'
import type { AIRequest, AIResponse, AIUsage } from '../lib/api'
import { moduleFor, type LanguageModule } from '../lib/languages'
import {
  assessmentInstructions,
  currentTopicInstructions,
  delegationInstructions,
  lookupInstructions,
  translationInstructions,
  typedReplyInstructions,
} from '../lib/teaching'

export class ApiHttpError extends Error {
  constructor(readonly status: number) {
    super(httpMessage(status))
  }
}

function httpMessage(status: number): string {
  switch (status) {
    case 401:
    case 403:
      return 'OpenAI rejected the key on the server. Check OPENAI_API_KEY.'
    case 404:
      return 'This endpoint is not available.'
    case 429:
      return 'Too many requests. Wait a moment, then try again.'
    default:
      return `OpenAI request failed (HTTP ${status}).`
  }
}

function apiKey(): string {
  const key = getEnv().OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY is not configured on the server.')
  return key
}

async function request(url: string, body: unknown, timeout = 15_000): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeout),
    redirect: 'manual',
  })
}

// ---- Live sessions ----

export interface LiveSessionResult {
  sdp: string
  session?: { id: string; billing?: string }
}

export async function createLiveSession(instructions: string, sdp: string): Promise<LiveSessionResult> {
  const res = await request(`${openAIBase()}/v1/live/sessions`, {
    session: {
      model: voiceModel(),
      instructions,
      input: [],
      store: false,
      delegation: { type: 'client' },
      audio: { output: { voice: 'marin' } },
    },
    transport: { type: 'webrtc', sdp },
  })
  if (!res.ok) throw new ApiHttpError(res.status)
  const json = (await res.json()) as {
    transport?: { type?: string; sdp?: string }
    session?: { id: string; billing?: string }
  }
  if (json.transport?.type !== 'webrtc' || !json.transport.sdp) {
    throw new Error('Unexpected response format')
  }
  return { sdp: json.transport.sdp, session: json.session }
}

// ---- Responses API ----

/// Exact port of APIClient.assessmentSchema — field names and enums are the
/// storage contract for learning evidence, shared with the native apps.
function assessmentSchema(languageID: string): Record<string, unknown> {
  const object = (fields: Record<string, unknown>) => ({
    type: 'object',
    properties: fields,
    required: Object.keys(fields).sort(),
    additionalProperties: false,
  })
  const string = { type: 'string' }
  return object({
    outcome: { type: 'string', enum: ['success', 'partial', 'breakdown', 'uncertain'] },
    suggestedLevel: { type: 'integer', minimum: 0, maximum: 5 },
    nextGoal: string,
    capability: string,
    words: {
      type: 'array',
      maxItems: 12,
      items: object({
        lemma: string,
        meaning: string,
        form: string,
        quote: string,
        language: {
          type: 'string',
          enum: [...new Set([languageID, 'en', 'mixed', 'uncertain'])].sort(),
        },
        kind: {
          type: 'string',
          enum: ['exposure', 'understanding', 'assisted', 'independent', 'lapse'],
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        sourceIDs: { type: 'array', items: { type: 'string' } },
      }),
    },
  })
}

interface RespondResult {
  text: string
  usage: AIUsage
  sources: SourceLink[]
}

async function respond(opts: {
  instructions: string
  input: string
  schema?: Record<string, unknown>
  search?: boolean
}): Promise<RespondResult> {
  const body: Record<string, unknown> = {
    model: textModel(),
    store: false,
    instructions: opts.instructions,
    input: [{ role: 'user', content: opts.input }],
    max_output_tokens: opts.schema ? 2200 : 1400,
    reasoning: { effort: 'low' },
  }
  if (opts.schema) {
    body.text = {
      format: { type: 'json_schema', name: 'mural_result', strict: true, schema: opts.schema },
    }
  }
  if (opts.search) {
    body.tools = [{ type: 'web_search' }]
    body.tool_choice = 'auto'
    body.max_tool_calls = 1
  }

  const res = await request(`${openAIBase()}/v1/responses`, body, 60_000)
  if (!res.ok) throw new ApiHttpError(res.status)
  const json = (await res.json()) as {
    status?: string
    output?: Array<{
      type: string
      content?: Array<{
        type: string
        text?: string
        annotations?: Array<{ type: string; url?: string; title?: string }>
      }>
    }>
    usage?: { input_tokens?: number; output_tokens?: number }
  }
  if (json.status !== 'completed') throw new Error('OpenAI returned an incomplete response. Please try again.')

  let text = ''
  const sources: SourceLink[] = []
  const usage: AIUsage = {
    input: json.usage?.input_tokens ?? 0,
    output: json.usage?.output_tokens ?? 0,
    searches: 0,
  }
  for (const item of json.output ?? []) {
    if (item.type === 'web_search_call') usage.searches += 1
    for (const part of item.content ?? []) {
      if (part.type === 'refusal') {
        throw new Error('Mural couldn’t complete that request. Try a different topic.')
      }
      if (part.type === 'output_text') text += part.text ?? ''
      for (const a of part.annotations ?? []) {
        if (a.type !== 'url_citation' || !a.url) continue
        const source: SourceLink = { title: a.title ?? 'Source', url: a.url }
        if (safeURL(source) && !sources.some((s) => s.url === source.url)) sources.push(source)
      }
    }
  }
  if (!text) throw new Error('OpenAI returned an incomplete response. Please try again.')
  return { text, usage, sources }
}

function empty(): never {
  throw new Error('This response came back empty. Please try again.')
}

// ---- Dispatch — same prompts as the native apps (TeachingPolicy) ----

export async function callAI(req: AIRequest): Promise<AIResponse> {
  const lang = moduleFor(req.languageId)
  if (!lang) throw new Error('unsupported language')
  switch (req.kind) {
    case 'translate': {
      if (!req.text || !req.meaningLanguage) empty()
      const r = await respond({
        instructions: translationInstructions(lang, req.meaningLanguage),
        input: req.text.slice(0, 2200),
      })
      if (!r.text.trim()) empty()
      return { text: r.text, usage: r.usage, sources: r.sources }
    }
    case 'assess': {
      if (!req.context) empty()
      const r = await respond({
        instructions: assessmentInstructions(lang),
        input: req.context.slice(0, 6000),
        schema: assessmentSchema(lang.id),
      })
      return { text: r.text, usage: r.usage, sources: r.sources }
    }
    case 'typedReply': {
      if (!req.context) empty()
      const r = await respond({
        instructions: typedReplyInstructions(lang),
        input: req.context.slice(0, 6000),
      })
      return { text: r.text, usage: r.usage, sources: r.sources }
    }
    case 'delegation': {
      if (!req.context) empty()
      const r = await respond({
        instructions: delegationInstructions(lang),
        input: req.context.slice(0, 6000),
        search: req.allowSearch === true,
      })
      return { text: r.text, usage: r.usage, sources: r.sources }
    }
    case 'topic': {
      if (!req.query?.trim()) empty()
      const r = await respond({
        instructions: currentTopicInstructions(lang),
        input: req.query.slice(0, 500),
        search: true,
      })
      if (r.sources.length === 0) {
        throw new Error('The search didn’t return verifiable sources. Try a more specific topic.')
      }
      return { text: r.text, usage: r.usage, sources: r.sources }
    }
    case 'lookup': {
      if (!req.word || !req.sentence || !req.meaningLanguage) empty()
      const r = await respond({
        instructions: lookupInstructions(lang, req.meaningLanguage),
        input: `Selected: ${req.word.slice(0, 220)}\nSentence: ${req.sentence.slice(0, 500)}`,
      })
      return { text: r.text, usage: r.usage, sources: r.sources }
    }
  }
}
