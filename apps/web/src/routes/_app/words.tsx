import { createFileRoute } from '@tanstack/react-router'
import { History, Leaf, Search } from 'lucide-react'
import { useState } from 'react'
import { PageHeading, RecallBars } from '../../components/brand'
import { WordDetailSheet } from '../../components/sheets'
import { SessionHistorySheet } from '../../components/transcript'
import { useCoordinator, useInterfaceLanguage, useStore, useT } from '../../lib/app'
import { languageName } from '../../lib/i18n'
import { wordLabelKey, type WordState } from '../../lib/learning'

export const Route = createFileRoute('/_app/words')({
  component: WordsPage,
})

function WordsPage() {
  const coordinator = useCoordinator()
  const store = useStore()
  const t = useT()
  const ui = useInterfaceLanguage()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<WordState | null>(null)
  const [sessions, setSessions] = useState(false)

  const learner = store.learner
  const words = learner.words.filter(
    (w) =>
      !search ||
      w.lemma.toLowerCase().includes(search.toLowerCase()) ||
      w.meaning.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="flex flex-col gap-6 px-6 pt-6">
      <PageHeading
        eyebrow={t('words.eyebrow', { language: languageName(coordinator.language, ui) })}
        title={t('words.title')}
        subtitle={t('words.subtitle')}
      />

      <label className="field flex items-center gap-2.5 !py-3.5">
        <Search size={17} className="shrink-0 text-cocoa" />
        <input
          className="w-full bg-transparent outline-none placeholder:text-cocoa/60"
          placeholder={t('words.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>

      {words.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-[28px] bg-sage p-7">
          <Leaf size={34} strokeWidth={1.5} aria-hidden />
          <h2 className="text-2xl font-medium">
            {search ? t('words.emptySearchTitle') : t('words.emptyTitle')}
          </h2>
          <p className="text-[0.95rem] text-cocoa">
            {search
              ? t('words.emptySearchBody', {
                  language: languageName(coordinator.language, ui),
                  meaning: store.preferences.meaningLanguage,
                })
              : t('words.emptyBody')}
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {words.map((w) => (
            <div key={w.id} className="border-b border-peach last:border-0">
              <button
                type="button"
                className="flex w-full items-center gap-4 py-5 text-left"
                onClick={() => setSelected(w)}
              >
                <span className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
                  <span className="text-2xl font-medium">{w.lemma}</span>
                  <span className="text-[0.95rem] text-cocoa">{w.meaning}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-2">
                  <RecallBars count={w.bars} />
                  <span className="text-[0.7rem] text-cocoa">{t(wordLabelKey(w))}</span>
                </span>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between text-[0.8rem] text-cocoa">
        <span>{t('words.legend', { n: 1, label: t('word.fragile') })}</span>
        <span>{t('words.legend', { n: 2, label: t('word.growing') })}</span>
        <span>{t('words.legend', { n: 3, label: t('word.steady') })}</span>
      </div>
      <p className="text-[0.85rem] leading-relaxed text-cocoa">
        {t('words.legendNote')}
      </p>

      {learner.capabilities.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-3xl bg-butter p-6">
          <h2 className="text-xl font-semibold">{t('words.capabilities')}</h2>
          {learner.capabilities.map((c) => (
            <p key={c} className="text-[0.95rem]">
              {c}
            </p>
          ))}
          <p className="text-[0.8rem] text-cocoa">
            {t('words.capNote')}
          </p>
        </div>
      ) : null}

      <button
        type="button"
        className="flex items-center gap-2 py-2 text-[0.95rem]"
        onClick={() => setSessions(true)}
      >
        <History size={17} /> {t('words.past')}
      </button>

      <WordDetailSheet word={selected} onClose={() => setSelected(null)} />
      <SessionHistorySheet open={sessions} onOpenChange={setSessions} />
    </div>
  )
}
