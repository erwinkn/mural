import { ArchiveError } from '../lib/archive'
import { UnauthorizedError } from './auth'
import { ApiHttpError } from './openai'

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    throw new HttpError(400, 'Invalid JSON body.')
  }
}

export function asString(v: unknown, max = 10_000): string | undefined {
  return typeof v === 'string' && v.length <= max ? v : undefined
}

type Ctx = { request: Request; params: Record<string, string> }

/// Wraps an api-route handler: consistent error → Response mapping.
export function route(handler: (ctx: Ctx) => Promise<Response>): (ctx: Ctx) => Promise<Response> {
  return async (ctx) => {
    try {
      return await handler(ctx)
    } catch (e) {
      if (e instanceof UnauthorizedError) {
        return Response.json({ error: 'unauthorized' }, { status: 401 })
      }
      if (e instanceof ArchiveError) {
        return Response.json({ error: e.description }, { status: 400 })
      }
      if (e instanceof HttpError) {
        return Response.json({ error: e.message }, { status: e.status })
      }
      if (e instanceof ApiHttpError) {
        return Response.json({ error: e.message }, { status: e.status === 429 ? 429 : 502 })
      }
      const message = e instanceof Error ? e.message : 'Request failed.'
      return Response.json({ error: message }, { status: 500 })
    }
  }
}
