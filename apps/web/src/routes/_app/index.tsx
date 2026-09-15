import { createFileRoute } from '@tanstack/react-router'
import {
  Captions,
  Keyboard,
  Loader2,
  MessageSquareText,
  Mic,
  MicOff,
  PhoneOff,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { useState } from 'react'
import { MuralOrb } from '../../components/orb'
import { PinyinHelp } from '../../components/pinyin'
import {
  LookupSheet,
  TypedReplySheet,
  type WordLookup,
} from '../../components/sheets'
import { TranscriptSheet } from '../../components/transcript'
import { useCoordinator, useInterfaceLanguage, useStore, useT } from '../../lib/app'
import { captionSegments } from '../../lib/learning'
import { passageText, type SessionRecord } from '../../lib/models'
import { meaningGreeting } from '../../lib/languages'
import { languageName } from '../../lib/i18n'

export const Route = createFileRoute('/_app/')({
  component: TalkPage,
})

function TalkPage() {
  const coordinator = useCoordinator()
  const store = useStore()
  const t = useT()
  const ui = useInterfaceLanguage()
  const [typing, setTyping] = useState(false)
  const [transcript, setTranscript] = useState<SessionRecord | null>(null)
  const [lookup, setLookup] = useState<WordLookup | null>(null)

  const running = coordinator.isRunning
  const active = coordinator.state === 'active'
  const passage = coordinator.assistantPassage
  const user = coordinator.userPassage
  const meaningOn = store.preferences.meaningVisible
  const sources = coordinator.session?.topics.at(-1)?.sources ?? []

  return (
    <div className="flex min-h-[calc(100dvh-160px)] flex-col items-center px-6">
      <div className="pt-3">
        <span className="rounded-full bg-butter/60 px-4 py-2 text-[0.8rem] font-medium text-cocoa">
          {coordinator.selectedTheme?.title ?? t('talk.untitledTheme', { language: languageName(coordinator.language, ui) })}
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-4">
        <MuralOrb
          energy={Math.max(coordinator.outputLevel, coordinator.inputLevel * 0.45)}
          listening={active && !coordinator.isMuted}
          className="w-[190px] sm:w-[220px]"
        />
        <p className="pt-4 text-[0.8rem] text-cocoa" aria-live="polite">
          {t(coordinator.statusKey)}
        </p>
      </div>

      <div className="flex min-h-28 w-full flex-col items-center gap-3 text-center">
        <p
          className={`max-w-xl font-medium tracking-[-0.5px] select-text ${
            passage ? 'text-2xl' : 'text-4xl'
          }`}
        >
          {captionSegments(coordinator.caption, coordinator.language.id).map((seg, i) =>
            passage && seg.lookup ? (
              <button
                key={i}
                type="button"
                className="caption-word inline text-inherit"
                onClick={() => setLookup({ word: seg.lookup!, sentence: coordinator.caption })}
              >
                {seg.text}
              </button>
            ) : (
              <span key={i}>{seg.text}</span>
            ),
          )}
        </p>
        {coordinator.language.id === 'zh' ? <PinyinHelp text={coordinator.caption} /> : null}
        {meaningOn ? (
          <>
            <p className="text-[0.95rem] text-cocoa select-text" aria-live="polite">
              {passage == null
                ? meaningGreeting(store.preferences.meaningLanguage)
                : coordinator.meaning || (coordinator.translating ? t('talk.translating') : '')}
            </p>
            {coordinator.meaningError ? (
              <div className="flex flex-col items-center gap-1.5 text-[0.8rem]">
                <p className="text-cocoa">{coordinator.meaningError}</p>
                <button type="button" className="underline" onClick={() => coordinator.retryMeaning()}>
                  {t('talk.retryMeaning')}
                </button>
              </div>
            ) : null}
          </>
        ) : null}
        {user ? (
          <p className="flex items-baseline gap-1.5 pt-1 text-[0.8rem] text-cocoa">
            <span className="text-[0.7rem] font-medium">{t('transcript.you')}</span>
            <span>{passageText(user).slice(-160)}</span>
          </p>
        ) : null}
        {coordinator.working ? (
          <p className="flex items-center gap-2 text-[0.8rem] text-cocoa">
            <Loader2 size={14} className="spin" /> {t('talk.checking')}
          </p>
        ) : null}
        {sources.length > 0 ? (
          <button
            type="button"
            className="text-[0.8rem] underline"
            onClick={() => setTranscript(coordinator.session)}
          >
            {t('talk.sources')}
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-7 pt-5">
        <button
          type="button"
          className="flex flex-col items-center gap-1.5"
          aria-label={meaningOn ? t('talk.hideMeanings') : t('talk.showMeanings')}
          onClick={() => coordinator.toggleMeaning()}
        >
          <span
            className={`glass flex size-12 items-center justify-center rounded-full ${
              meaningOn ? '!bg-butter/70' : ''
            }`}
          >
            <Captions size={21} />
          </span>
          <span className="text-[0.7rem]">{t('talk.meaning')}</span>
        </button>

        <button
          type="button"
          className="-translate-y-2.5"
          disabled={coordinator.state === 'connecting' || coordinator.state === 'closing'}
          aria-label={
            active ? (coordinator.isMuted ? t('talk.unmute') : t('talk.mute')) : t('talk.start')
          }
          onClick={() => (active ? coordinator.toggleMute() : coordinator.start())}
        >
          <span className="flex size-[76px] items-center justify-center rounded-full bg-gradient-to-br from-[#ffba7a] to-orange text-ink shadow-lg shadow-orange/25">
            {coordinator.state === 'connecting' || coordinator.state === 'closing' ? (
              <Loader2 size={28} className="spin" />
            ) : coordinator.isMuted && active ? (
              <MicOff size={28} />
            ) : (
              <Mic size={28} />
            )}
          </span>
        </button>

        <button
          type="button"
          className="flex flex-col items-center gap-1.5"
          disabled={coordinator.session == null}
          aria-label={running ? t('talk.endAria') : t('talk.transcriptAria')}
          onClick={() => (running ? coordinator.end() : setTranscript(coordinator.session))}
        >
          <span className="glass flex size-12 items-center justify-center rounded-full">
            {running ? <PhoneOff size={20} /> : <MessageSquareText size={20} />}
          </span>
          <span className="text-[0.7rem]">{running ? t('talk.end') : t('talk.transcript')}</span>
        </button>
      </div>
      <p className="pt-3 text-[0.7rem] text-cocoa">{t(coordinator.microphoneLabelKey)}</p>

      <div className="flex items-center gap-6 pt-2 pb-3 text-[0.85rem]">
        {active ? (
          <>
            <button type="button" className="flex items-center gap-1.5" onClick={() => setTyping(true)}>
              <Keyboard size={16} /> {t('talk.typeInstead')}
            </button>
            <button type="button" className="flex items-center gap-1.5" onClick={() => coordinator.help()}>
              <Sparkles size={16} /> {t('talk.help')}
            </button>
          </>
        ) : coordinator.session == null ? (
          <p className="text-cocoa">{t('talk.replyHint')}</p>
        ) : !running ? (
          <button
            type="button"
            className="flex items-center gap-1.5"
            onClick={() => coordinator.resetConversation()}
          >
            <RotateCcw size={16} /> {t('talk.new')}
          </button>
        ) : null}
      </div>
      {coordinator.notice ? (
        <p className="pb-4 text-center text-[0.85rem] text-cocoa">{t(coordinator.notice)}</p>
      ) : null}

      <TypedReplySheet open={typing} onOpenChange={setTyping} />
      <TranscriptSheet
        session={transcript}
        meaningLanguage={store.preferences.meaningLanguage}
        onClose={() => setTranscript(null)}
      />
      <LookupSheet item={lookup} onClose={() => setLookup(null)} />
    </div>
  )
}
