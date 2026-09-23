import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '../../../server/auth'
import { deleteAll } from '../../../server/db'
import { route } from '../../../server/http'

export const Route = createFileRoute('/api/archive/delete-all')({
  server: {
    handlers: {
      POST: route(async () => {
        await requireAuth()
        await deleteAll()
        return Response.json({ ok: true })
      }),
    },
  },
})
