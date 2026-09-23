import { createFileRoute } from '@tanstack/react-router'
import { markAuthed, verifyPassword } from '../../server/auth'
import { asString, readJson, route } from '../../server/http'

export const Route = createFileRoute('/api/login')({
  server: {
    handlers: {
      POST: route(async ({ request }) => {
        const body = (await readJson(request)) as { password?: unknown }
        const password = asString(body.password, 256)
        if (!password || !(await verifyPassword(password))) {
          return Response.json({ error: 'That password doesn’t match.' }, { status: 401 })
        }
        await markAuthed()
        return Response.json({ ok: true })
      }),
    },
  },
})
