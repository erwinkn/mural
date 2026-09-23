import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '../../server/auth'
import { savePreferences } from '../../server/db'
import { readJson, route } from '../../server/http'
import { asPreferences } from '../../server/validate'

export const Route = createFileRoute('/api/preferences')({
  server: {
    handlers: {
      PUT: route(async ({ request }) => {
        await requireAuth()
        const body = (await readJson(request)) as { preferences?: unknown }
        await savePreferences(asPreferences(body.preferences))
        return Response.json({ ok: true })
      }),
    },
  },
})
