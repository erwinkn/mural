// Port of apps/ios/App/Storage.swift's LearningStore — the archive lives in
// memory on the client and is persisted per-record through the Worker API.

import { api, AuthError } from './api'
import { defaultPreferencesWith } from './archive'
import { moduleFor, defaultTitle, DEFAULT_LANGUAGE_ID } from './languages'
import { interfaceLanguageOf, translate } from './i18n'
import { projectLearner, type LearnerState } from './learning'
import {
  correctFragment,
  sessionPassages,
  type Archive,
  type Preferences,
  type SessionRecord,
} from './models'

type Listener = () => void

export class LearningStore {
  archive: Archive = { schemaVersion: 2, sessions: [], preferences: defaultPreferencesWith() }
  error: string | null = null
  onSessionInvalidation?: (id: string) => void
  onAuthFailure?: () => void

  private listeners = new Set<Listener>()
  private version = 0
  private hydrated = false

  subscribe = (fn: Listener): (() => void) => {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }
  getVersion = (): number => this.version
  get isHydrated(): boolean {
    return this.hydrated
  }

  clearError(): void {
    this.error = null
    this.emit()
  }

  setError(message: string | null): void {
    this.error = message
    this.emit()
  }

  private emit(): void {
    this.version += 1
    this.listeners.forEach((l) => l())
  }

  private report<T>(p: Promise<T>): void {
    p.catch((e) => {
      if (e instanceof AuthError) {
        this.onAuthFailure?.()
        return
      }
      this.error = translate(interfaceLanguageOf(this.preferences), 'error.saveProgress')
      this.emit()
    })
  }

  /// Writes are serialized per resource — parallel PUTs race on the server and
  /// an older snapshot can land last. Each queued task snapshots state at send
  /// time so the final write always carries the newest data.
  private prefQueue: Promise<void> = Promise.resolve()
  private sessionQueues = new Map<string, Promise<void>>()

  private enqueue(
    queue: Promise<void>,
    set: (next: Promise<void>) => void,
    task: () => Promise<unknown>,
  ): void {
    const next = queue.then(async () => {
      await task()
    })
    set(next.catch(() => {}))
    this.report(next)
  }

  private persistPreferences(): void {
    this.enqueue(
      this.prefQueue,
      (q) => (this.prefQueue = q),
      () => api.savePreferences({ ...this.archive.preferences }),
    )
  }

  private persistSession(id: string, task: () => Promise<unknown>): void {
    this.enqueue(
      this.sessionQueues.get(id) ?? Promise.resolve(),
      (q) => this.sessionQueues.set(id, q),
      task,
    )
  }

  hydrate(archive: Archive): void {
    // Sessions that were never ended are closed on load, like the native store.
    for (const s of archive.sessions) {
      if (s.endedAt == null) {
        s.endedAt = Date.now()
        s.endReason = 'App closed before finalization'
      }
    }
    this.archive = archive
    this.hydrated = true
    this.emit()
  }

  get preferences(): Preferences {
    return this.archive.preferences
  }
  get language() {
    return moduleFor(this.preferences.learningLanguageID) ?? moduleFor(DEFAULT_LANGUAGE_ID)!
  }
  get sessions(): SessionRecord[] {
    return [...this.archive.sessions].sort((a, b) => b.startedAt - a.startedAt)
  }
  get learningSessions(): SessionRecord[] {
    return this.sessions.filter((s) => s.languageID === this.language.id)
  }
  get learner(): LearnerState {
    return projectLearner(
      this.archive.sessions,
      this.language.id,
      this.archive.preferences.hiddenWords,
    )
  }

  selectLanguage(id: string): void {
    if (!moduleFor(id)) return
    this.archive.preferences.learningLanguageID = id
    this.emit()
    this.persistPreferences()
  }

  updatePreferences(change: (p: Preferences) => void): void {
    change(this.archive.preferences)
    this.emit()
    this.persistPreferences()
  }

  save(session: SessionRecord): void {
    const i = this.archive.sessions.findIndex((s) => s.id === session.id)
    if (i >= 0) this.archive.sessions[i] = session
    else this.archive.sessions.push(session)
    this.emit()
    this.persistSession(session.id, () => {
      const current = this.archive.sessions.find((s) => s.id === session.id)
      return current ? api.saveSession({ ...current }) : Promise.resolve()
    })
  }

  deleteSession(id: string): void {
    this.onSessionInvalidation?.(id)
    this.archive.sessions = this.archive.sessions.filter((s) => s.id !== id)
    this.emit()
    this.persistSession(id, () => api.deleteSession(id))
  }

  hideWord(id: string): void {
    this.archive.preferences.hiddenWords.push(id)
    this.emit()
    this.persistPreferences()
  }

  correctPassage(sessionID: string, passageID: string, text: string): void {
    const session = this.archive.sessions.find((s) => s.id === sessionID)
    if (!session) return
    const passage = sessionPassages(session).find((p) => p.id === passageID && p.speaker === 'user')
    if (!passage) return
    passage.fragments.forEach((fragment, offset) => {
      correctFragment(session, fragment.id, offset === 0 ? text.slice(0, 10_000) : '')
    })
    this.onSessionInvalidation?.(sessionID)
    this.emit()
    this.persistSession(sessionID, () => {
      const current = this.archive.sessions.find((s) => s.id === sessionID)
      return current ? api.saveSession({ ...current }) : Promise.resolve()
    })
  }

  deleteAll(): void {
    this.archive.sessions.forEach((s) => this.onSessionInvalidation?.(s.id))
    this.archive.sessions = []
    this.archive.preferences.hiddenWords = []
    this.sessionQueues.clear()
    this.emit()
    this.report(api.deleteAll())
  }

  replaceArchive(archive: Archive): void {
    this.archive = archive
    this.emit()
  }

  async importArchive(incoming: Archive): Promise<void> {
    const { archive } = await api.importArchive(incoming)
    this.replaceArchive(archive)
  }
}
