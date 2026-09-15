import { moduleFor } from '../lib/languages'
import type { Preferences, SessionRecord } from '../lib/models'
import { HttpError } from './http'

function bad(message: string): never {
  throw new HttpError(400, message)
}
function isObj(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v)
}
function isNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

/// Bounded structural checks for client-supplied records. Import-time data
/// gets the full validateArchive treatment; these guard the per-write routes.
export function asSessionRecord(v: unknown): SessionRecord {
  if (!isObj(v)) bad('Invalid session.')
  if (typeof v.id !== 'string' || v.id.length > 100) bad('Invalid session.')
  if (typeof v.languageID !== 'string' || !moduleFor(v.languageID)) bad('Unsupported language.')
  if (!isNum(v.startedAt) || (v.endedAt != null && !isNum(v.endedAt))) bad('Invalid session.')
  if (typeof v.title !== 'string' || v.title.length > 500) bad('Invalid session.')
  if (!Array.isArray(v.fragments) || v.fragments.length > 50_000) bad('Invalid session.')
  if (!Array.isArray(v.assessments) || !Array.isArray(v.topics)) bad('Invalid session.')
  if (!isObj(v.translations) || Object.keys(v.translations).length > 50_000) bad('Invalid session.')
  const json = JSON.stringify(v)
  if (new TextEncoder().encode(json).length > 8_000_000) bad('Session too large.')
  return v as unknown as SessionRecord
}

export function asPreferences(v: unknown): Preferences {
  if (!isObj(v)) bad('Invalid preferences.')
  if (typeof v.learningLanguageID !== 'string' || !moduleFor(v.learningLanguageID)) {
    bad('Unsupported language.')
  }
  if (typeof v.meaningLanguage !== 'string' || v.meaningLanguage.length > 60) {
    bad('Invalid preferences.')
  }
  if (!isNum(v.sessionMinutes) || v.sessionMinutes < 1 || v.sessionMinutes > 60) {
    bad('Invalid preferences.')
  }
  if (typeof v.interests !== 'string' || v.interests.length > 500) bad('Invalid preferences.')
  if (!Array.isArray(v.hiddenWords) || v.hiddenWords.length > 100_000) bad('Invalid preferences.')
  return v as unknown as Preferences
}
