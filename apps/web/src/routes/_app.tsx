import {
  Outlet,
  createFileRoute,
  redirect,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { AudioWaveform, Book, LayoutGrid, Loader2, SlidersHorizontal } from 'lucide-react'
import { useEffect } from 'react'
import { Brand } from '../components/brand'
import { ConsentSheet } from '../components/sheets'
import { SettingsSheet } from '../components/settings'
import { Sheet } from '../components/sheet'
import { api, AuthError } from '../lib/api'
import { AppProvider, useApp, useCoordinator, useStore, useT } from '../lib/app'
import { authStateFn } from '../server/fns'

export const Route = createFileRoute('/_app')({
  beforeLoad: async () => {
    const { authed } = await authStateFn()
    if (!authed) throw redirect({ to: '/login' })
  },
  component: AppLayout,
})

const TABS = [
  { to: '/', label: 'tab.talk', icon: AudioWaveform },
  { to: '/themes', label: 'tab.themes', icon: LayoutGrid },
  { to: '/words', label: 'tab.words', icon: Book },
] as const

function AppLayout() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}

function Shell() {
  const app = useApp()
  const store = useStore()
  const coordinator = useCoordinator()
  const t = useT()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isOnboarding = pathname === '/onboarding'

  useEffect(() => {
    app.store.onAuthFailure = () => void navigate({ to: '/login' })
    let alive = true
    api
      .getArchive()
      .then(({ archive }) => {
        if (alive) app.store.hydrate(archive)
      })
      .catch((e) => {
        if (!alive) return
        if (e instanceof AuthError) {
          void navigate({ to: '/login' })
          return
        }
        app.store.setError(e instanceof Error ? e.message : 'Couldn’t load your learning record.')
      })
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') app.coordinator.background()
      else app.coordinator.resume()
    }
    const onPageHide = () => app.coordinator.background()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      alive = false
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onPageHide)
    }
  }, [app, navigate])

  const hydrated = store.isHydrated
  const onboarded = store.preferences.hasOnboarded
  useEffect(() => {
    if (hydrated && !onboarded && !isOnboarding) {
      void navigate({ to: '/onboarding' })
    }
  }, [hydrated, onboarded, isOnboarding, navigate])

  const alertMessage = coordinator.error ?? store.error
  const closeAlert = () => {
    coordinator.clearError()
    store.clearError()
  }

  return (
    <div className="min-h-dvh bg-cream text-ink">
      {!isOnboarding ? (
        <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 pt-5">
          <Brand />
          <button
            type="button"
            className="glass flex size-11 items-center justify-center rounded-full text-ink"
            aria-label={t('shell.settings')}
            onClick={() => coordinator.setShowSettings(true)}
          >
            <SlidersHorizontal size={19} />
          </button>
        </header>
      ) : null}

      <main className={isOnboarding ? '' : 'mx-auto w-full max-w-3xl px-2 pb-32 md:pl-24'}>
        {store.isHydrated ? (
          <Outlet />
        ) : (
          <div className="flex min-h-[60dvh] items-center justify-center gap-2 text-cocoa">
            <Loader2 size={18} className="spin" /> {t('shell.warming')}
          </div>
        )}
      </main>

      {!isOnboarding ? (
        <nav className="tabbar glass" aria-label="Sections">
          {TABS.map(({ to, label, icon: Icon }) => (
            <button
              key={to}
              type="button"
              aria-current={pathname === to ? 'page' : undefined}
              onClick={() => void navigate({ to })}
            >
              <Icon size={20} />
              {t(label)}
            </button>
          ))}
        </nav>
      ) : null}

      <SettingsSheet />
      <ConsentSheet />
      <Sheet open={alertMessage != null} onOpenChange={(v) => !v && closeAlert()} title={t('alert.title')}>
        <div className="flex flex-col gap-5 px-6 pt-2 pb-8">
          <p className="text-[0.95rem]">{alertMessage}</p>
          <button type="button" className="btn-primary" onClick={closeAlert}>
            {t('alert.ok')}
          </button>
        </div>
      </Sheet>
    </div>
  )
}
