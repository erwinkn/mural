// Language detection for the wrong-language redirect guard.
// iOS uses NaturalLanguage; the web build uses franc's trigram scores.

import { francAll } from 'franc-min'

const ISO3_TO_MODULE: Record<string, string> = {
  nno: 'nb',
  nob: 'nb',
  nor: 'nb',
  spa: 'es',
  eng: 'en',
  fra: 'fr',
  deu: 'de',
  ita: 'it',
  por: 'pt',
  cmn: 'zh',
  zho: 'zh',
}

/**
 * Best-guess language id and a 0–1 confidence, or null when unsure.
 * franc scores are relative strengths; >0.9 means a runaway winner.
 */
export function detectLanguage(text: string): { id: string; confidence: number } | null {
  if (text.trim().length < 20) return null
  let ranked: [string, number][]
  try {
    ranked = francAll(text, { minLength: 20 }) as [string, number][]
  } catch {
    return null
  }
  const top = ranked[0]
  if (!top) return null
  const id = ISO3_TO_MODULE[top[0]] ?? top[0]
  return { id, confidence: top[1] }
}
