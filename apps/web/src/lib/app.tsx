import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react'
import { ConversationCoordinator } from './coordinator'
import { LearningStore } from './store'

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
