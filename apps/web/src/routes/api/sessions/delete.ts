import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '../../../server/auth'
import { deleteSession } from '../../../server/db'
import { asString, readJson, route } from '../../../server/http'

export const Route = createFileRoute('/api/sessions/delete')({
  server: {
    handlers: {
      POST: route(async ({ request }) => {
        await requireAuth()
        const body = (await readJson(request)) as { id?: unknown }
        const id = asString(body.id, 100)
        if (!id) return Response.json({ error: 'Missing session id.' }, { status: 400 })
        await deleteSession(id)
        return Response.json({ ok: true })
      }),
    },
  },
})
