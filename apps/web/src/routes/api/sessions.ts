import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '../../server/auth'
import { saveSession } from '../../server/db'
import { readJson, route } from '../../server/http'
import { asSessionRecord } from '../../server/validate'

export const Route = createFileRoute('/api/sessions')({
  server: {
    handlers: {
      PUT: route(async ({ request }) => {
        await requireAuth()
        const body = (await readJson(request)) as { session?: unknown }
        await saveSession(asSessionRecord(body.session))
        return Response.json({ ok: true })
      }),
    },
  },
})
