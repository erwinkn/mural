import { createServerFn } from '@tanstack/react-start'
import { isAuthed } from './auth'

/// Used by route guards (beforeLoad) — works during SSR because server fns
/// execute in-process with the real request context.
export const authStateFn = createServerFn({ method: 'GET' }).handler(async () => ({
  authed: await isAuthed(),
}))
