import { createFileRoute } from '@tanstack/react-router'
import type { AIRequest } from '../../lib/api'
import { requireAuth } from '../../server/auth'
import { readJson, route, HttpError } from '../../server/http'
import { callAI } from '../../server/openai'

const KINDS = ['translate', 'assess', 'lookup', 'typedReply', 'delegation', 'topic'] as const

export const Route = createFileRoute('/api/ai')({
  server: {
    handlers: {
      POST: route(async ({ request }) => {
        await requireAuth()
        const body = (await readJson(request)) as Partial<AIRequest>
        if (!body || !KINDS.includes(body.kind as (typeof KINDS)[number])) {
          throw new HttpError(400, 'Unknown AI request.')
        }
        return Response.json(await callAI(body as AIRequest))
      }),
    },
  },
})
