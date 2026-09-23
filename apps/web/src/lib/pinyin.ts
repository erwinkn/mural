// Mandarin reading aid. The iOS app uses the system tokenizer + dictionary
// (CFStringTokenizer latin transcription); on the web we use pinyin-pro,
// loaded on demand so the ~1MB dictionary only downloads for Mandarin users.

type PinyinModule = typeof import('pinyin-pro')
let mod: Promise<PinyinModule> | undefined
function load(): Promise<PinyinModule> {
  return (mod ??= import('pinyin-pro'))
}

const HAS_HAN = /[㐀-䶿一-鿿豈-﫿]/

/** Returns a pinyin reading for `text`, or null when it has no Han characters. */
export async function pinyinReading(text: string): Promise<string | null> {
  if (!HAS_HAN.test(text)) return null
  const { pinyin } = await load()
  const reading = pinyin(text, {
    toneType: 'symbol',
    type: 'string',
    nonZh: 'consecutive',
    v: true,
  }).trim()
  return reading || null
}
