import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '../../server/auth'
import { route } from '../../server/http'

export const Route = createFileRoute('/api/session')({
  server: {
    handlers: {
      GET: route(async () => {
        await requireAuth()
        return Response.json({ ok: true })
      }),
    },
  },
})
