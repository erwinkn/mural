import { ChevronDown, ChevronUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useT } from '../lib/app'
import { pinyinReading } from '../lib/pinyin'

/// Optional pinyin reading under Han text; loads pinyin-pro on demand.
export function PinyinHelp({ text }: { text: string }) {
  const t = useT()
  const [reading, setReading] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    let alive = true
    setReading(null)
    void pinyinReading(text).then((r) => {
      if (alive) setReading(r)
    })
    return () => {
      alive = false
    }
  }, [text])

  if (!reading) return null
  return (
    <div className="flex flex-col items-center gap-1.5 text-cocoa">
      <button
        type="button"
        className="flex items-center gap-1 text-[0.8rem]"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {expanded ? t('pinyin.hide') : t('pinyin.show')}
      </button>
      {expanded ? <p className="text-[0.95rem] select-text">{reading}</p> : null}
    </div>
  )
}
