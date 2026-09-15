import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// Each session is stored as its full SessionRecord JSON document — the same
// shape the native apps keep in their Archive — plus indexed columns for
// listing and per-language filtering.
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  languageId: text('language_id').notNull(),
  startedAt: integer('started_at').notNull(),
  endedAt: integer('ended_at'),
  title: text('title').notNull(),
  payload: text('payload').notNull(),
})

// Single-row store for Preferences (including hiddenWords).
export const kv = sqliteTable('kv', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
})
