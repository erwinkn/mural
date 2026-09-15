// Port of apps/ios/Core/Models.swift — keep field names identical so learning
// backups remain compatible with the native app's JSON archive format.

export type Speaker = 'user' | 'assistant'
export type EvidenceKind = 'exposure' | 'understanding' | 'assisted' | 'independent' | 'lapse'
export type Outcome = 'success' | 'partial' | 'breakdown' | 'uncertain'

export interface Fragment {
  id: string
  revision: number
  previousTexts: string[]
  speaker: Speaker
  text: string
  startMS: number
  endMS: number
  receivedAt: number // epoch ms (encoded as ISO string in iOS exports; see codecs below)
  meaningVisible: boolean
  typed: boolean
}

export interface Passage {
  id: string
  speaker: Speaker
  fragments: Fragment[]
}

export function passageText(p: Passage): string {
  return p.fragments.map((f) => f.text).join('')
}
export function passageRevisionKey(p: Passage): string {
  return p.fragments.map((f) => `${f.id}:${f.revision}`).join(',')
}
export function passageStartMS(p: Passage): number {
  return p.fragments[0]?.startMS ?? 0
}
export function passageEndMS(p: Passage): number {
  return Math.max(0, ...p.fragments.map((f) => f.endMS))
}

/// Presentation grouping only: neither the gap nor the arrival of another
/// speaker proves a completed turn.
export function passagesOf(fragments: Fragment[]): Passage[] {
  const result: Passage[] = []
  const indexed = fragments
    .map((element, offset) => ({ element, offset }))
    .sort((a, b) =>
      a.element.startMS === b.element.startMS
        ? a.offset - b.offset
        : a.element.startMS - b.element.startMS,
    )
  for (const { element: fragment } of indexed) {
    const last = result.findLast((p) => p.speaker === fragment.speaker)
    if (
      last &&
      fragment.startMS - passageEndMS(last) <= 2200 &&
      !fragment.typed &&
      !(last.fragments[last.fragments.length - 1]?.typed ?? false)
    ) {
      last.fragments.push(fragment)
    } else {
      result.push({ id: fragment.id, speaker: fragment.speaker, fragments: [fragment] })
    }
  }
  return result.sort((a, b) => passageStartMS(a) - passageStartMS(b))
}

export interface WordProposal {
  lemma: string
  meaning: string
  form: string
  kind: EvidenceKind
  confidence: number
  sourceIDs: string[]
  quote: string
  language: string
}
export function wordKey(w: Pick<WordProposal, 'language' | 'lemma' | 'meaning'>): string {
  return `${w.language}|${w.lemma.trim().toLowerCase()}|${w.meaning.toLowerCase()}`
}

export interface Assessment {
  passageID: string
  revisionKey: string
  outcome: Outcome
  suggestedLevel: number
  nextGoal: string
  capability: string
  words: WordProposal[]
  createdAt: number
  context: string
}

export interface SourceLink {
  title: string
  url: string
}
export function safeURL(s: SourceLink): string | null {
  try {
    const u = new URL(s.url)
    if (u.protocol !== 'https:' || !u.host || u.username) return null
    return s.url
  } catch {
    return null
  }
}

export interface TopicBrief {
  id: string
  languageID: string
  query: string
  text: string
  sources: SourceLink[]
  retrievedAt: number
}
export function topicIsFresh(t: TopicBrief, now = Date.now()): boolean {
  return now - t.retrievedAt < 6 * 3600 * 1000
}

export interface SessionRecord {
  id: string
  languageID: string
  providerID?: string
  startedAt: number
  endedAt?: number
  themeID?: string
  title: string
  fragments: Fragment[]
  assessments: Assessment[]
  translations: Record<string, string>
  topics: TopicBrief[]
  voiceSeconds: number
  usageFinal: boolean
  inputTokens: number
  outputTokens: number
  searchCalls: number
  endReason?: string
}

export function makeSession(languageID: string, themeID?: string, title?: string): SessionRecord {
  return {
    id: crypto.randomUUID(),
    languageID,
    startedAt: Date.now(),
    themeID,
    title: title ?? 'A conversation',
    fragments: [],
    assessments: [],
    translations: {},
    topics: [],
    voiceSeconds: 0,
    usageFinal: false,
    inputTokens: 0,
    outputTokens: 0,
    searchCalls: 0,
  }
}

export function sessionPassages(s: SessionRecord): Passage[] {
  return passagesOf(s.fragments)
}

export function appendFragment(s: SessionRecord, fragment: Fragment): void {
  if (s.fragments.some((f) => f.id === fragment.id)) return
  s.fragments.push(fragment)
  invalidateChangedAssessments(s)
}

export function invalidateChangedAssessments(s: SessionRecord): void {
  const current = new Map(sessionPassages(s).map((p) => [p.id, passageRevisionKey(p)]))
  s.assessments = s.assessments.filter((a) => current.get(a.passageID) === a.revisionKey)
}

export function correctFragment(s: SessionRecord, id: string, text: string): void {
  const fragment = s.fragments.find((f) => f.id === id)
  if (!fragment) return
  fragment.previousTexts.push(fragment.text)
  fragment.text = text
  fragment.revision += 1
  s.translations = {}
  invalidateChangedAssessments(s)
}

export interface Preferences {
  learningLanguageID: string
  interfaceLanguage?: string
  meaningVisible: boolean
  meaningLanguage: string
  sessionMinutes: number
  hiddenWords: string[]
  interests: string
  hasOnboarded: boolean
  aiConsentVersion?: number
}
export const DEFAULT_MEANING_LANGUAGE = 'Brazilian Portuguese'

export function defaultPreferences(defaultLanguageID: string): Preferences {
  return {
    learningLanguageID: defaultLanguageID,
    interfaceLanguage: 'en',
    meaningVisible: true,
    meaningLanguage: DEFAULT_MEANING_LANGUAGE,
    sessionMinutes: 15,
    hiddenWords: [],
    interests: '',
    hasOnboarded: false,
  }
}

export interface Archive {
  schemaVersion: number
  sessions: SessionRecord[]
  preferences: Preferences
}
