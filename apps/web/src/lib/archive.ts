// iOS-compatible learning-backup codec. The native apps encode Date with
// JSONEncoder's default strategy: seconds since 2001-01-01T00:00:00Z.
// Internally the web app uses epoch milliseconds; conversion happens here so
// exports stay readable by the iPhone/Android clients and vice versa.

import { DEFAULT_LANGUAGE_ID, moduleFor } from './languages'
import { invalidateChangedAssessments, type Archive, type Preferences, type SessionRecord } from './models'
import { validateAssessment } from './learning'

const APPLE_EPOCH_OFFSET_MS = 978_307_200_000 // 2001-01-01T00:00:00Z
export const MAX_ARCHIVE_BYTES = 30_000_000
const MAX_SESSIONS = 10_000

export class ArchiveError extends Error {
  constructor(public code: 'tooLarge' | 'unsupportedVersion' | 'unsupportedLanguage' | 'invalid') {
    super(code)
  }
  get description(): string {
    switch (this.code) {
      case 'tooLarge': return 'This backup is too large to import.'
      case 'unsupportedVersion': return 'This backup needs a newer version of Mural.'
      case 'unsupportedLanguage': return 'This backup contains a language module that this version of Mural does not support.'
      default: return 'This backup has invalid or duplicate records.'
    }
  }
}

// ---- Date field codecs ----

const SESSION_DATE_FIELDS = ['startedAt', 'endedAt'] as const
const FRAGMENT_DATE_FIELDS = ['receivedAt'] as const
const ASSESSMENT_DATE_FIELDS = ['createdAt'] as const
const TOPIC_DATE_FIELDS = ['retrievedAt'] as const

function appleToMs(v: unknown): unknown {
  return typeof v === 'number' && Number.isFinite(v) ? v * 1000 + APPLE_EPOCH_OFFSET_MS : v
}
function msToApple(v: unknown): unknown {
  return typeof v === 'number' && Number.isFinite(v) ? (v - APPLE_EPOCH_OFFSET_MS) / 1000 : v
}

function convertDates(value: unknown, fields: readonly string[], convert: (v: unknown) => unknown): unknown {
  if (value == null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map((v) => convertDates(v, fields, convert))
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = fields.includes(k) ? convert(v) : convertDates(v, fields, convert)
  }
  return out
}

function allDateFields(): readonly string[] {
  return [...SESSION_DATE_FIELDS, ...FRAGMENT_DATE_FIELDS, ...ASSESSMENT_DATE_FIELDS, ...TOPIC_DATE_FIELDS]
}

// ---- Decode (import) ----

export function decodeArchive(json: unknown): Archive {
  const migrated = migrateArchive(json)
  const archive = convertDates(migrated, allDateFields(), appleToMs) as Archive
  validateArchive(archive)
  return archive
}

export function decodeArchiveText(text: string): Archive {
  if (new TextEncoder().encode(text).length > MAX_ARCHIVE_BYTES) throw new ArchiveError('tooLarge')
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new ArchiveError('invalid')
  }
  return decodeArchive(json)
}

/// Version 1 was Norwegian-only. Migration assigns that provenance once;
/// version 2 records must explicitly declare their language.
function migrateArchive(json: unknown): unknown {
  if (!json || typeof json !== 'object' || Array.isArray(json)) throw new ArchiveError('invalid')
  const root = { ...(json as Record<string, unknown>) }
  const version = root.schemaVersion
  if (version !== 1 && version !== 2) throw new ArchiveError('unsupportedVersion')
  if (version === 2) return root
  const preferences = { ...(root.preferences as Record<string, unknown> ?? {}) }
  preferences.learningLanguageID = DEFAULT_LANGUAGE_ID
  if (Array.isArray(preferences.hiddenWords)) {
    preferences.hiddenWords = preferences.hiddenWords.map((w) => `${DEFAULT_LANGUAGE_ID}|${w}`)
  }
  root.preferences = preferences
  const sessions = Array.isArray(root.sessions) ? root.sessions : []
  root.sessions = sessions.map((original) => {
    const session: Record<string, unknown> = {
      ...(original as Record<string, unknown>),
      languageID: DEFAULT_LANGUAGE_ID,
    }
    if (Array.isArray(session.topics)) {
      session.topics = (session.topics as unknown[]).map((t) => ({
        ...(t as object),
        languageID: DEFAULT_LANGUAGE_ID,
      }))
    }
    return session
  })
  root.schemaVersion = 2
  return root
}

function isValidDateMs(v: unknown): boolean {
  return typeof v === 'number' && Number.isFinite(v) && v > -8.64e15 && v < 8.64e15
}

export function validateArchive(archive: Archive): void {
  if (!moduleFor(archive.preferences.learningLanguageID)) throw new ArchiveError('unsupportedLanguage')
  const ids = new Set(archive.sessions.map((s) => s.id))
  if (ids.size !== archive.sessions.length || archive.sessions.length > MAX_SESSIONS) {
    throw new ArchiveError('invalid')
  }
  if (archive.preferences.sessionMinutes < 1 || archive.preferences.sessionMinutes > 60) {
    throw new ArchiveError('invalid')
  }
  for (const s of archive.sessions) {
    if (!moduleFor(s.languageID)) throw new ArchiveError('unsupportedLanguage')
    if (
      !Number.isFinite(s.voiceSeconds) ||
      s.voiceSeconds < 0 ||
      s.voiceSeconds > 31_536_000 ||
      [s.inputTokens, s.outputTokens, s.searchCalls].some((n) => n < 0 || n > 1_000_000_000) ||
      !isValidDateMs(s.startedAt) ||
      (s.endedAt !== undefined && !isValidDateMs(s.endedAt)) ||
      !s.assessments.every((a) => isValidDateMs(a.createdAt))
    )
      throw new ArchiveError('invalid')
    const fids = new Set(s.fragments.map((f) => f.id))
    if (
      fids.size !== s.fragments.length ||
      !s.fragments.every(
        (f) =>
          f.startMS >= 0 &&
          f.endMS >= f.startMS &&
          f.text.length <= 50_000 &&
          f.revision >= 0 &&
          f.revision <= 1_000_000 &&
          isValidDateMs(f.receivedAt),
      ) ||
      !s.topics.every((t) => t.languageID === s.languageID && isValidDateMs(t.retrievedAt))
    )
      throw new ArchiveError('invalid')
  }
}

// ---- Merge (import into existing archive) ----

export function mergeArchives(current: Archive, incoming: Archive): Archive {
  validateArchive(incoming)
  const known = new Set(current.sessions.map((s) => s.id))
  const additions = incoming.sessions.filter((s) => !known.has(s.id))
  if (additions.length > MAX_SESSIONS - current.sessions.length) throw new ArchiveError('tooLarge')
  const candidate: Archive = {
    schemaVersion: 2,
    preferences: current.preferences,
    sessions: [...current.sessions],
  }
  for (const original of additions) {
    const session: SessionRecord = structuredClone(original)
    invalidateChangedAssessments(session)
    session.assessments = session.assessments
      .map((a) => validateAssessment(a, session))
      .filter((a): a is Assessment => a !== null)
    candidate.sessions.push(session)
  }
  validateArchive(candidate)
  if (new TextEncoder().encode(JSON.stringify(encodeArchive(candidate))).length > MAX_ARCHIVE_BYTES) {
    throw new ArchiveError('tooLarge')
  }
  return candidate
}
type Assessment = SessionRecord['assessments'][number]

// ---- Encode (export) ----

export function encodeArchive(archive: Archive): unknown {
  return convertDates(
    { schemaVersion: 2, sessions: archive.sessions, preferences: archive.preferences },
    allDateFields(),
    msToApple,
  )
}

export function encodeArchiveText(archive: Archive): string {
  return JSON.stringify(encodeArchive(archive), null, 2)
}

export function defaultPreferencesWith(languageID = DEFAULT_LANGUAGE_ID): Preferences {
  return {
    learningLanguageID: languageID,
    meaningVisible: true,
    meaningLanguage: 'English',
    sessionMinutes: 15,
    hiddenWords: [],
    interests: '',
    hasOnboarded: false,
  }
}
