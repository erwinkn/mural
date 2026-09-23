import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Brand } from '../components/brand'
import { MuralOrb } from '../components/orb'
import { api } from '../lib/api'
import { authStateFn } from '../server/fns'
import { useT } from '../lib/app'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const { authed } = await authStateFn()
    if (authed) throw redirect({ to: '/' })
  },
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const t = useT()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!password || busy) return
    setBusy(true)
    setError(null)
    try {
      await api.login(password)
      void navigate({ to: '/' })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.error'))
      setBusy(false)
    }
  }

  return (
    <>
      <div className="mesh-bg" aria-hidden />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-7 pt-6 pb-8">
        <Brand />
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <MuralOrb className="w-40" />
          <div className="text-center">
            <h1 className="text-4xl font-semibold tracking-[-1px]">{t('login.title')}</h1>
            <p className="mt-3 text-cocoa">{t('login.subtitle')}</p>
          </div>
          <form onSubmit={submit} className="flex w-full flex-col gap-4">
            <input
              type="password"
              className="field text-center"
              placeholder={t('login.password')}
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-label={t('login.password')}
            />
            {error ? <p className="text-center text-[0.85rem] text-red-700/80">{error}</p> : null}
            <button type="submit" className="btn-primary" disabled={busy || !password}>
              {busy ? t('login.opening') : t('login.continue')}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
