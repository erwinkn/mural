// Port of apps/ios/Core/LearningEngine.swift + CaptionWords segmentation.

import { moduleFor, DEFAULT_LANGUAGE_ID } from './languages'
import {
  passageEndMS,
  passageRevisionKey,
  passageStartMS,
  passageText,
  sessionPassages,
  wordKey,
  type Assessment,
  type SessionRecord,
  type WordProposal,
} from './models'

export interface WordState {
  id: string
  lemma: string
  meaning: string
  form: string
  example: string
  bars: number
  understandingCount: number
  independentCount: number
  lastSeen: number
  dueAt: number
}
export function wordLabel(w: WordState): string {
  return ['New', 'Fragile', 'Growing', 'Steady'][Math.min(3, Math.max(0, w.bars))]
}
export function wordExplanation(w: WordState): string {
  if (w.independentCount === 0) return 'Heard or used with support. Try using it in your own words.'
  if (w.bars === 1) return 'Used independently. We’ll bring it back soon.'
  if (w.bars === 2) return 'Recalled on different days. Still worth revisiting.'
  return 'Recalled across days and contexts. Strength can fade with time.'
}

export interface LearnerState {
  challenge: number
  observationCount: number
  nextGoal: string
  capabilities: string[]
  words: WordState[]
}
export function levelLabel(l: LearnerState): string {
  return l.observationCount < 4 ? 'Getting to know you' : 'Finding your pace'
}

function startOfDay(t: number): number {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function validateAssessment(a: Assessment, session: SessionRecord): Assessment | null {
  if (!moduleFor(session.languageID)) return null
  const passage = sessionPassages(session).find(
    (p) => p.id === a.passageID && p.speaker === 'user',
  )
  if (!passage || passageRevisionKey(passage) !== a.revisionKey) return null
  if (!(a.suggestedLevel >= 0 && a.suggestedLevel <= 5) || a.words.length > 12) return null
  const allowed = new Set(passage.fragments.map((f) => f.id))
  const validated: Assessment = {
    ...a,
    nextGoal: a.nextGoal.slice(0, 300),
    capability: a.capability.slice(0, 160),
    words: [],
  }
  const ciIncludes = (hay: string, needle: string) =>
    hay.toLocaleLowerCase().includes(needle.toLocaleLowerCase())
  for (const word of a.words) {
    if (
      word.language !== session.languageID ||
      word.sourceIDs.length === 0 ||
      !word.sourceIDs.every((id) => allowed.has(id)) ||
      !Number.isFinite(word.confidence) ||
      word.confidence < 0.8 ||
      word.confidence > 1 ||
      !word.lemma ||
      word.lemma.length >= 100 ||
      !word.meaning ||
      word.meaning.length >= 180 ||
      !word.form ||
      !word.quote ||
      !ciIncludes(passageText(passage), word.quote) ||
      !ciIncludes(word.quote, word.form)
    )
      continue
    const refs = passage.fragments
      .filter((f) => word.sourceIDs.includes(f.id))
      .map((f) => f.text)
      .join('')
    if (!ciIncludes(refs, word.quote)) continue
    const result = { ...word }
    if (result.kind === 'independent') {
      // A visible meaning or immediate imitation is supporting evidence, never independent recall.
      const start = passageStartMS(passage)
      const recentlyModeled = sessionPassages(session).some(
        (p) =>
          p.speaker === 'assistant' &&
          passageStartMS(p) <= start &&
          start - passageEndMS(p) < 90_000 &&
          ciIncludes(passageText(p), word.form),
      )
      if (passage.fragments.some((f) => f.meaningVisible || f.typed) || recentlyModeled) {
        result.kind = 'assisted'
      }
    }
    validated.words.push(result)
  }
  return validated
}

export function projectLearner(
  sessions: SessionRecord[],
  languageID: string = DEFAULT_LANGUAGE_ID,
  hiddenWords: string[] = [],
  now: number = Date.now(),
): LearnerState {
  let level = 0
  let count = 0
  let successes = 0
  let nextGoal =
    'Start with a greeting and one small question. Adjust from what the learner actually says.'
  const capabilityEvidence = new Map<string, Set<string>>()
  const events = new Map<string, { word: WordProposal; at: number; context: string }[]>()

  for (const session of sessions
    .filter((s) => s.languageID === languageID)
    .sort((a, b) => a.startedAt - b.startedAt)) {
    const seen = new Set<string>()
    for (const raw of [...session.assessments].sort((a, b) => a.createdAt - b.createdAt)) {
      if (seen.has(raw.passageID)) continue
      seen.add(raw.passageID)
      const a = validateAssessment(raw, session)
      if (!a) continue
      count += 1
      if (a.outcome === 'breakdown') {
        level = Math.max(0, level - 1)
        successes = 0
      } else if (a.outcome === 'success') {
        successes += 1
        if (successes >= 2) {
          level = Math.min(5, Math.max(level, Math.min(level + 1, a.suggestedLevel)))
          successes = 0
        }
      } else {
        successes = 0
      }
      if (a.nextGoal) nextGoal = a.nextGoal
      if (a.outcome === 'success' && a.capability) {
        const set = capabilityEvidence.get(a.capability) ?? new Set<string>()
        set.add(`${startOfDay(a.createdAt)}|${a.context}`)
        capabilityEvidence.set(a.capability, set)
      }
      const seenWords = new Set<string>()
      for (const word of a.words) {
        const key = wordKey(word)
        if (hiddenWords.includes(key) || seenWords.has(key)) continue
        seenWords.add(key)
        const list = events.get(key) ?? []
        list.push({ word, at: a.createdAt, context: a.context })
        events.set(key, list)
      }
    }
  }

  const words: WordState[] = []
  for (const [key, observations] of events) {
    const last = observations[observations.length - 1]
    if (!last) continue
    const independent = observations.filter((o) => o.word.kind === 'independent')
    const days = new Set(independent.map((o) => startOfDay(o.at))).size
    const contexts = new Set(independent.map((o) => o.context)).size
    const lastRecall = independent[independent.length - 1]?.at as number | undefined
    let bars = independent.length === 0 ? 0 : 1
    if (days >= 2) bars = 2
    if (
      days >= 3 &&
      contexts >= 2 &&
      independent[independent.length - 1]!.at - independent[0]!.at >= 7 * 86400_000
    )
      bars = 3
    const interval = [1, 1, 4, 14][bars] * 86400_000
    const due = (lastRecall ?? last.at) + interval
    if (now > due && bars > 1) bars -= 1
    const lapse = observations.filter((o) => o.word.kind === 'lapse').pop()
    if (lapse && lapse.at > (lastRecall ?? 0)) bars = Math.min(bars, 1)
    words.push({
      id: key,
      lemma: last.word.lemma,
      meaning: last.word.meaning,
      form: last.word.form,
      example: last.word.quote,
      bars,
      understandingCount: observations.filter((o) => o.word.kind === 'understanding').length,
      independentCount: independent.length,
      lastSeen: last.at,
      dueAt: due,
    })
  }
  words.sort((a, b) => b.lastSeen - a.lastSeen)

  const capabilities = [...capabilityEvidence.entries()]
    .filter(([, v]) => v.size >= 3)
    .map(([k]) => k)
    .sort()
  return { challenge: level, observationCount: count, nextGoal, capabilities, words }
}

// ---- Caption word segmentation (port of CaptionWords) ----

export interface CaptionSegment {
  text: string
  lookup?: string
}

const LETTER = /\p{L}/u

let zhSegmenter: Intl.Segmenter | undefined
function getZhSegmenter(): Intl.Segmenter | undefined {
  if (zhSegmenter !== undefined) return zhSegmenter
  try {
    zhSegmenter = new Intl.Segmenter('zh', { granularity: 'word' })
  } catch {
    zhSegmenter = undefined
  }
  return zhSegmenter
}

/// Keeps every source character, linking Chinese words instead of whole sentences.
export function captionSegments(text: string, languageID: string): CaptionSegment[] {
  if (languageID === 'zh') {
    const segmenter = getZhSegmenter()
    if (segmenter) {
      const result: CaptionSegment[] = []
      for (const part of segmenter.segment(text)) {
        const t = part.segment
        result.push({ text: t, lookup: LETTER.test(t) ? t : undefined })
      }
      return result
    }
    return [{ text, lookup: LETTER.test(text) ? text : undefined }]
  }
  const result: CaptionSegment[] = []
  let run = ''
  const isWS = (c: string) => /\s/.test(c)
  for (const character of text) {
    if (run && isWS(run[run.length - 1]) !== isWS(character)) {
      result.push(makeSegment(run))
      run = ''
    }
    run += character
  }
  if (run) result.push(makeSegment(run))
  return result
}

function makeSegment(text: string): CaptionSegment {
  const word = text.replace(/^[\p{P}\p{S}\s]+|[\p{P}\p{S}\s]+$/gu, '')
  return { text, lookup: LETTER.test(word) ? word : undefined }
}
