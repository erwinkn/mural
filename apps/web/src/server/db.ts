import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import { defaultPreferencesWith, mergeArchives, validateArchive } from '../lib/archive'
import type { Archive, Preferences, SessionRecord } from '../lib/models'
import { getEnv } from './env'
import { kv, sessions } from './schema'

function db() {
  return drizzle(getEnv().DB)
}

export async function getArchive(): Promise<Archive> {
  const [rows, pref] = await Promise.all([
    db().select().from(sessions),
    db().select().from(kv).where(eq(kv.key, 'preferences')),
  ])
  const archive: Archive = {
    schemaVersion: 2,
    sessions: rows.map((r) => JSON.parse(r.payload) as SessionRecord),
    preferences: pref[0]
      ? ({ ...defaultPreferencesWith(), ...JSON.parse(pref[0].value) } as Preferences)
      : defaultPreferencesWith(),
  }
  archive.sessions.sort((a, b) => b.startedAt - a.startedAt)
  return archive
}

export async function saveSession(record: SessionRecord): Promise<void> {
  await db()
    .insert(sessions)
    .values({
      id: record.id,
      languageId: record.languageID,
      startedAt: record.startedAt,
      endedAt: record.endedAt ?? null,
      title: record.title,
      payload: JSON.stringify(record),
    })
    .onConflictDoUpdate({
      target: sessions.id,
      set: {
        languageId: record.languageID,
        startedAt: record.startedAt,
        endedAt: record.endedAt ?? null,
        title: record.title,
        payload: JSON.stringify(record),
      },
    })
}

export async function deleteSession(id: string): Promise<void> {
  await db().delete(sessions).where(eq(sessions.id, id))
}

export async function savePreferences(prefs: Preferences): Promise<void> {
  await db()
    .insert(kv)
    .values({ key: 'preferences', value: JSON.stringify(prefs) })
    .onConflictDoUpdate({ target: kv.key, set: { value: JSON.stringify(prefs) } })
}

export async function deleteAll(): Promise<void> {
  await db().delete(sessions)
  await savePreferences(defaultPreferencesWith())
}

/// Merge an imported archive into the stored one (same semantics as the
/// native app) and return the merged archive.
export async function importArchive(incomingRaw: unknown): Promise<Archive> {
  const incoming = incomingRaw as Archive
  validateArchive(incoming)
  const current = await getArchive()
  const merged = mergeArchives(current, incoming)
  const existing = new Set(current.sessions.map((s) => s.id))
  const d = db()
  for (const s of merged.sessions) {
    if (existing.has(s.id)) continue
    await d.insert(sessions).values({
      id: s.id,
      languageId: s.languageID,
      startedAt: s.startedAt,
      endedAt: s.endedAt ?? null,
      title: s.title,
      payload: JSON.stringify(s),
    })
  }
  return merged
}
