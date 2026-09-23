import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '../../server/auth'
import { getArchive } from '../../server/db'
import { route } from '../../server/http'

export const Route = createFileRoute('/api/archive')({
  server: {
    handlers: {
      GET: route(async () => {
        await requireAuth()
        return Response.json({ archive: await getArchive() })
      }),
    },
  },
})
