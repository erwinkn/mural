import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '../../../server/auth'
import { importArchive } from '../../../server/db'
import { readJson, route } from '../../../server/http'

export const Route = createFileRoute('/api/archive/import')({
  server: {
    handlers: {
      POST: route(async ({ request }) => {
        await requireAuth()
        const body = (await readJson(request)) as { archive?: unknown }
        return Response.json({ archive: await importArchive(body.archive) })
      }),
    },
  },
})
