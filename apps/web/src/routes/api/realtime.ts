import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '../../server/auth'
import { asString, readJson, route, HttpError } from '../../server/http'
import { createLiveSession } from '../../server/openai'

export const Route = createFileRoute('/api/realtime')({
  server: {
    handlers: {
      POST: route(async ({ request }) => {
        await requireAuth()
        const body = (await readJson(request)) as { instructions?: unknown; sdp?: unknown }
        const instructions = asString(body.instructions, 16_000)
        const sdp = asString(body.sdp, 100_000)
        if (!instructions || !sdp) throw new HttpError(400, 'Missing instructions or SDP offer.')
        const result = await createLiveSession(instructions, sdp)
        return Response.json(result)
      }),
    },
  },
})
