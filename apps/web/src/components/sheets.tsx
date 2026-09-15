import { ArrowUp, AudioWaveform, Loader2, Search, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useCoordinator, useStore } from '../lib/app'
import { AI_CONSENT_SUMMARY } from '../lib/coordinator'
import type { TopicBrief } from '../lib/models'
import type { WordState } from '../lib/learning'
import { wordExplanation, wordLabel } from '../lib/learning'
import { PinyinHelp } from './pinyin'
import { RecallBars } from './brand'
import { Sheet } from './sheet'
import { Sources } from './transcript'

const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

// ---- Typed reply ----

export function TypedReplySheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const coordinator = useCoordinator()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  useEffect(() => {
    if (open) setText('')
  }, [open])
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Say it your way.">
      <div className="flex flex-col gap-5 px-6 pt-2 pb-8">
        <textarea
          autoFocus
          className="field min-h-32"
          placeholder={`Reply in ${coordinator.language.name} or another language`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="button"
          className="btn-primary"
          disabled={sending || !text.trim()}
          onClick={async () => {
            setSending(true)
            try {
              await coordinator.sendTyped(text)
              onOpenChange(false)
            } finally {
              setSending(false)
            }
          }}
        >
          {sending ? 'Sending…' : 'Send reply'}
          <ArrowUp size={18} />
        </button>
      </div>
    </Sheet>
  )
}

// ---- Word lookup ----

export interface WordLookup {
  word: string
  sentence: string
}

export function LookupSheet({
  item,
  onClose,
}: {
  item: WordLookup | null
  onClose: () => void
}) {
  const coordinator = useCoordinator()
  const [explanation, setExplanation] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!item) return
    let alive = true
    setExplanation(null)
    setError(null)
    coordinator
      .lookup(item.word, item.sentence)
      .then((t) => alive && setExplanation(t))
      .catch((e) => alive && setError(e instanceof Error ? e.message : String(e)))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.word, item?.sentence])

  return (
    <Sheet open={item != null} onOpenChange={(v) => !v && onClose()} title="A little meaning">
      {item ? (
        <div className="flex flex-col items-start gap-5 px-6 pt-2 pb-10">
          <h2 className="text-4xl font-medium">{item.word}</h2>
          {coordinator.language.id === 'zh' ? <PinyinHelp text={item.word} /> : null}
          <p className="text-xl text-cocoa">{item.sentence}</p>
          {explanation ? (
            <p className="select-text">{explanation}</p>
          ) : error ? (
            <p className="text-cocoa">{error}</p>
          ) : (
            <p className="flex items-center gap-2 text-cocoa">
              <Loader2 size={16} className="spin" /> Finding the meaning…
            </p>
          )}
        </div>
      ) : null}
    </Sheet>
  )
}

// ---- Word detail ----

export function WordDetailSheet({ word, onClose }: { word: WordState | null; onClose: () => void }) {
  const store = useStore()
  return (
    <Sheet open={word != null} onOpenChange={(v) => !v && onClose()} title="Word">
      {word ? (
        <div className="flex flex-col items-start gap-6 px-6 pt-2 pb-10">
          <h2 className="text-4xl font-medium">{word.lemma}</h2>
          {store.language.id === 'zh' ? <PinyinHelp text={word.lemma} /> : null}
          <p className="text-xl text-cocoa">{word.meaning}</p>
          <div className="flex items-center gap-3">
            <RecallBars count={word.bars} />
            <span>{wordLabel(word)}</span>
          </div>
          <p>{wordExplanation(word)}</p>
          <blockquote className="card w-full !bg-peach p-5 text-xl font-medium">
            “{word.example}”
          </blockquote>
          <p className="text-[0.8rem] text-cocoa">
            {word.independentCount} independent uses · Last seen {dateFmt.format(word.lastSeen)}
          </p>
          <button
            type="button"
            className="text-[0.85rem] text-red-700/80 underline"
            onClick={() => {
              store.hideWord(word.id)
              onClose()
            }}
          >
            Remove from my words
          </button>
        </div>
      ) : null}
    </Sheet>
  )
}

// ---- AI consent ----

export function ConsentSheet() {
  const coordinator = useCoordinator()
  return (
    <Sheet
      open={coordinator.showAIConsent}
      onOpenChange={(v) => {
        if (!v) coordinator.resumeAfterAIConsent()
      }}
    >
      <div className="flex flex-col items-start gap-5 px-7 pt-4 pb-10">
        <AudioWaveform size={32} strokeWidth={1.5} className="text-orange" aria-hidden />
        <h2 className="text-3xl font-semibold">Before we talk.</h2>
        <p>{AI_CONSENT_SUMMARY}</p>
        <p className="text-[0.95rem] text-cocoa">
          Your learning record stays with this Mural. Mural does not save raw audio. You can keep
          browsing your saved words and conversations without agreeing.
        </p>
        <a
          className="text-[0.95rem] underline"
          href="https://mural.chat/privacy/"
          target="_blank"
          rel="noreferrer"
        >
          Privacy policy
        </a>
        <button
          type="button"
          className="btn-primary"
          onClick={() => coordinator.acceptAIConsent()}
        >
          Agree and continue
        </button>
        <button
          type="button"
          className="w-full text-center text-[0.95rem]"
          onClick={() => coordinator.declineAIConsent()}
        >
          Not now
        </button>
      </div>
    </Sheet>
  )
}

// ---- Current topic ----

export function CurrentTopicSheet({
  open,
  onOpenChange,
  onSelected,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSelected: () => void
}) {
  const coordinator = useCoordinator()
  const [query, setQuery] = useState('')
  const [brief, setBrief] = useState<TopicBrief | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setBrief(null)
      setError(null)
    }
  }, [open])

  async function find() {
    setLoading(true)
    setError(null)
    try {
      setBrief(await coordinator.currentTopic(query))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="The world today" wide>
      <div className="flex flex-col items-start gap-5 px-6 pt-2 pb-10">
        <h2 className="text-3xl font-semibold">A fresh conversation.</h2>
        <p className="text-cocoa">What would you like to talk about?</p>
        <textarea
          className="field min-h-20"
          placeholder={coordinator.language.topicPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="button"
          className="btn-soft"
          disabled={loading || !query.trim()}
          onClick={() => void find()}
        >
          {loading ? 'Finding something interesting…' : 'Find a topic'}
          {loading ? <Loader2 size={18} className="spin" /> : <Search size={18} />}
        </button>
        {error ? <p className="text-[0.85rem] text-cocoa">{error}</p> : null}
        {brief ? (
          <>
            <p className="select-text whitespace-pre-wrap">{brief.text}</p>
            <Sources sources={brief.sources} date={brief.retrievedAt} />
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                coordinator.discuss(brief)
                onSelected()
                onOpenChange(false)
              }}
            >
              Talk about this
              <Sparkles size={18} />
            </button>
          </>
        ) : null}
        <p className="text-[0.8rem] text-cocoa">
          Search uses your hosted OpenAI account. Sources stay attached to the topic.
        </p>
      </div>
    </Sheet>
  )
}
