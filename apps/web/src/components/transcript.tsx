import { useState } from 'react'
import { useStore } from '../lib/app'
import type { LearningStore } from '../lib/store'
import { meaningCacheKey } from '../lib/coordinator'
import {
  passageRevisionKey,
  passageText,
  safeURL,
  sessionPassages,
  type Passage,
  type SessionRecord,
  type SourceLink,
} from '../lib/models'
import { PinyinHelp } from './pinyin'
import { Sheet } from './sheet'

const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })
const dateTimeFmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export function Sources({ sources, date }: { sources: SourceLink[]; date: number }) {
  if (sources.length === 0) return null
  return (
    <div className="flex flex-col gap-2">
      <div className="text-[0.8rem] text-cocoa">Sources · {dateFmt.format(date)}</div>
      {sources.map((s) => {
        const url = safeURL(s)
        return url ? (
          <a
            key={s.url}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-[0.95rem] text-ink underline decoration-cocoa/40 underline-offset-2"
          >
            {s.title}
          </a>
        ) : null
      })}
    </div>
  )
}

function PassageView({
  passage,
  session,
  meaningLanguage,
  editable,
  onEdit,
}: {
  passage: Passage
  session: SessionRecord
  meaningLanguage: string
  editable?: boolean
  onEdit?: (p: Passage) => void
}) {
  const translation =
    session.translations[meaningCacheKey(passageRevisionKey(passage), meaningLanguage)] ??
    session.translations[passageRevisionKey(passage)]
  return (
    <div className="flex w-full flex-col items-start gap-2">
      <div className="flex w-full items-center justify-between text-[0.8rem] tracking-[1px] text-cocoa">
        <span>{passage.speaker === 'user' ? 'YOU' : 'MURAL'}</span>
        {editable && passage.speaker === 'user' && session.endedAt != null ? (
          <button type="button" className="text-[0.8rem] text-ink underline" onClick={() => onEdit?.(passage)}>
            Edit
          </button>
        ) : null}
      </div>
      <p className="text-xl font-medium select-text">{passageText(passage)}</p>
      {session.languageID === 'zh' ? <PinyinHelp text={passageText(passage)} /> : null}
      {translation ? <p className="text-[0.95rem] text-cocoa select-text">{translation}</p> : null}
    </div>
  )
}

function Topics({ session }: { session: SessionRecord }) {
  return (
    <>
      {session.topics.map((t) => (
        <div key={t.id} className="flex flex-col gap-3">
          <p className="select-text whitespace-pre-wrap">{t.text}</p>
          <Sources sources={t.sources} date={t.retrievedAt} />
        </div>
      ))}
    </>
  )
}

export function TranscriptSheet({
  session,
  meaningLanguage,
  onClose,
}: {
  session: SessionRecord | null
  meaningLanguage: string
  onClose: () => void
}) {
  return (
    <Sheet open={session != null} onOpenChange={(v) => !v && onClose()} title="Our conversation">
      <div className="flex flex-col gap-6 px-6 pt-3 pb-10">
        {session ? (
          <>
            {sessionPassages(session).map((p) => (
              <PassageView key={p.id} passage={p} session={session} meaningLanguage={meaningLanguage} />
            ))}
            <Topics session={session} />
            {session.fragments.length === 0 && session.topics.length === 0 ? (
              <p className="text-cocoa">Your conversation will appear here.</p>
            ) : null}
          </>
        ) : (
          <p>Start a conversation and your words will appear here.</p>
        )}
      </div>
    </Sheet>
  )
}

function EditableTranscript({
  sessionID,
  store,
  meaningLanguage,
}: {
  sessionID: string
  store: LearningStore
  meaningLanguage: string
}) {
  const session = store.sessions.find((s) => s.id === sessionID)
  const [editing, setEditing] = useState<Passage | null>(null)
  const [text, setText] = useState('')
  if (!session) return <p className="px-6 py-4 text-cocoa">This conversation was deleted.</p>
  return (
    <div className="flex flex-col gap-6 px-6 pt-3 pb-10">
      {sessionPassages(session).map((p) => (
        <PassageView
          key={p.id}
          passage={p}
          session={session}
          meaningLanguage={meaningLanguage}
          editable
          onEdit={(passage) => {
            setEditing(passage)
            setText(passageText(passage))
          }}
        />
      ))}
      <Topics session={session} />
      <Sheet open={editing != null} onOpenChange={(v) => !v && setEditing(null)} title="What you said">
        <div className="flex flex-col gap-5 px-6 pt-2 pb-8">
          <textarea
            className="field min-h-32"
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="What you said"
          />
          <p className="text-[0.8rem] leading-relaxed text-cocoa">
            Correct a misheard phrase. Learning evidence from the old wording will be removed; the
            original remains in your backup history.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              if (editing) store.correctPassage(sessionID, editing.id, text)
              setEditing(null)
            }}
          >
            Save
          </button>
        </div>
      </Sheet>
    </div>
  )
}

export function SessionHistorySheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const store = useStore()
  const [selected, setSelected] = useState<SessionRecord | null>(null)
  const [deleting, setDeleting] = useState<SessionRecord | null>(null)
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Past conversations" wide>
      <div className="flex flex-col gap-1 px-6 pt-2 pb-10">
        {store.learningSessions.length === 0 ? (
          <p className="py-4 text-cocoa">
            Your {store.language.name} conversations will appear here.
          </p>
        ) : null}
        {store.learningSessions.map((s) => (
          <div key={s.id} className="flex items-center gap-3 border-b border-peach py-4 last:border-0">
            <button type="button" className="flex flex-1 flex-col items-start gap-1 text-left" onClick={() => setSelected(s)}>
              <span className="font-semibold">{s.title}</span>
              <span className="text-[0.8rem] text-cocoa">{dateTimeFmt.format(s.startedAt)}</span>
            </button>
            {s.endedAt != null ? (
              <button
                type="button"
                className="text-[0.8rem] text-red-700/80 underline"
                onClick={() => setDeleting(s)}
              >
                Delete
              </button>
            ) : null}
          </div>
        ))}
      </div>
      <Sheet open={selected != null} onOpenChange={(v) => !v && setSelected(null)} title="Our conversation" wide>
        {selected ? (
          <EditableTranscript
            sessionID={selected.id}
            store={store}
            meaningLanguage={store.preferences.meaningLanguage}
          />
        ) : null}
      </Sheet>
      <Sheet open={deleting != null} onOpenChange={(v) => !v && setDeleting(null)} title="Delete conversation?">
        <div className="flex flex-col gap-5 px-6 pt-2 pb-8">
          <p className="text-[0.95rem] text-cocoa">
            Delete this conversation and its learning evidence?
          </p>
          <button
            type="button"
            className="btn-soft !bg-red-100 text-red-800"
            onClick={() => {
              if (deleting) store.deleteSession(deleting.id)
              setDeleting(null)
              setSelected(null)
            }}
          >
            Delete conversation
          </button>
        </div>
      </Sheet>
    </Sheet>
  )
}
