import { getCookie, unsealSession, useSession } from '@tanstack/react-start/server'
import { getEnv } from './env'

export class UnauthorizedError extends Error {
  constructor() {
    super('unauthorized')
  }
}

interface SessionData {
  authed?: true
}

const SESSION_NAME = 'mural_session'

function sessionConfig() {
  const secret = getEnv().SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters.')
  }
  return {
    name: SESSION_NAME,
    password: secret,
    maxAge: 30 * 86400,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: 'lax' as const,
      path: '/',
    },
  }
}

/// Read-only check — unseals the cookie directly so unauthenticated requests
/// do not create a fresh session record.
export async function isAuthed(): Promise<boolean> {
  const sealed = getCookie(SESSION_NAME)
  if (!sealed) return false
  try {
    const data = await unsealSession(sessionConfig(), sealed)
    return (data.data as SessionData | undefined)?.authed === true
  } catch {
    return false
  }
}

export async function requireAuth(): Promise<void> {
  if (!(await isAuthed())) throw new UnauthorizedError()
}

export async function verifyPassword(input: string): Promise<boolean> {
  const expected = getEnv().APP_PASSWORD
  if (!expected || !input) return false
  // Constant-time comparison over fixed-length SHA-256 digests.
  const hash = async (v: string) =>
    new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v)))
  const a = await hash(input)
  const b = await hash(expected)
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

export async function markAuthed(): Promise<void> {
  const s = await useSession<SessionData>(sessionConfig())
  await s.update({ authed: true })
}

export async function clearAuthed(): Promise<void> {
  const s = await useSession<SessionData>(sessionConfig())
  await s.clear()
}
