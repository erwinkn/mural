import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react'
import { ConversationCoordinator } from './coordinator'
import { LearningStore } from './store'
import { interfaceLanguageOf, translate, type Params, type StringKey } from './i18n'

export interface App {
  store: LearningStore
  coordinator: ConversationCoordinator
}

const AppContext = createContext<App | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const app = useMemo<App>(() => {
    const store = new LearningStore()
    return { store, coordinator: new ConversationCoordinator(store) }
  }, [])
  return <AppContext.Provider value={app}>{children}</AppContext.Provider>
}

export function useApp(): App {
  const app = useContext(AppContext)
  if (!app) throw new Error('useApp outside AppProvider')
  return app
}

/// Re-render when the learning store changes.
export function useStore(): LearningStore {
  const { store } = useApp()
  useSyncExternalStore(store.subscribe, store.getVersion, store.getVersion)
  return store
}

/// Re-render when the coordinator changes.
export function useCoordinator(): ConversationCoordinator {
  const { coordinator } = useApp()
  useSyncExternalStore(coordinator.subscribe, coordinator.getVersion, coordinator.getVersion)
  return coordinator
}

const noopSubscribe = () => () => {}
const zeroVersion = () => 0

/// Interface-language translator bound to the user's preference. Falls back to
/// the default language outside AppProvider (e.g. the login page).
export function useT() {
  const app = useContext(AppContext)
  useSyncExternalStore(
    app ? app.store.subscribe : noopSubscribe,
    app ? app.store.getVersion : zeroVersion,
    app ? app.store.getVersion : zeroVersion,
  )
  const lang = interfaceLanguageOf(app?.store.preferences ?? {})
  return useMemo(
    () => (key: StringKey, params?: Params) => translate(lang, key, params),
    [lang],
  )
}

/// The active interface language ('en', 'pt-BR', …) — for localizing
/// interpolated values like language names.
export function useInterfaceLanguage() {
  const app = useContext(AppContext)
  useSyncExternalStore(
    app ? app.store.subscribe : noopSubscribe,
    app ? app.store.getVersion : zeroVersion,
    app ? app.store.getVersion : zeroVersion,
  )
  return interfaceLanguageOf(app?.store.preferences ?? {})
}
