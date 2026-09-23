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
  rus: 'ru',
}

/// franc-min ranks about half of short Russian passages as Bulgarian, Serbian
/// or Bosnian, which would redirect correct Russian speech. ы, э and ё mark
/// Russian unless the text also has letters that Russian lacks (Ukrainian,
/// Belarusian, Serbian or Macedonian), so such text is still ranked by franc.
function looksRussian(text: string): boolean {
  return /[ыэё]/iu.test(text) && !/[іїєґўјљњћђџѓќѕ]/iu.test(text)
}

/**
 * Best-guess language id and a 0–1 confidence, or null when unsure.
 * franc scores are relative strengths; >0.9 means a runaway winner.
 */
export function detectLanguage(text: string): { id: string; confidence: number } | null {
  if (text.trim().length < 20) return null
  const letters = text.match(/\p{L}/gu)?.length ?? 0
  const mostlyCyrillic = (text.match(/\p{Script=Cyrillic}/gu)?.length ?? 0) * 2 > letters
  if (mostlyCyrillic && looksRussian(text)) return { id: 'ru', confidence: 1 }
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
