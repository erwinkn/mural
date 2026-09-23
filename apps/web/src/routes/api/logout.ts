import { createFileRoute } from '@tanstack/react-router'
import { clearAuthed } from '../../server/auth'
import { route } from '../../server/http'

export const Route = createFileRoute('/api/logout')({
  server: {
    handlers: {
      POST: route(async () => {
        await clearAuthed()
        return Response.json({ ok: true })
      }),
    },
  },
})
