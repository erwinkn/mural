import { createFileRoute } from '@tanstack/react-router'
import { History, Leaf, Search } from 'lucide-react'
import { useState } from 'react'
import { PageHeading, RecallBars } from '../../components/brand'
import { WordDetailSheet } from '../../components/sheets'
import { SessionHistorySheet } from '../../components/transcript'
import { useCoordinator, useStore } from '../../lib/app'
import { wordLabel, type WordState } from '../../lib/learning'

export const Route = createFileRoute('/_app/words')({
  component: WordsPage,
})

function WordsPage() {
  const coordinator = useCoordinator()
  const store = useStore()
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
        eyebrow={`Little by little · ${coordinator.language.name}`}
        title="Your words."
        subtitle="Familiar words, ready for another conversation."
      />

      <label className="field flex items-center gap-2.5 !py-3.5">
        <Search size={17} className="shrink-0 text-cocoa" />
        <input
          className="w-full bg-transparent outline-none placeholder:text-cocoa/60"
          placeholder="Find a word"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>

      {words.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-[28px] bg-sage p-7">
          <Leaf size={34} strokeWidth={1.5} aria-hidden />
          <h2 className="text-2xl font-medium">
            {search ? 'No matching words yet.' : 'They’ll grow from here.'}
          </h2>
          <p className="text-[0.95rem] text-cocoa">
            {search
              ? `Try another ${coordinator.language.name} word or English meaning.`
              : 'As we talk, useful words and phrases find a home here. Their strength grows when you recall them over time.'}
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
                  <span className="text-[0.7rem] text-cocoa">{wordLabel(w)}</span>
                </span>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between text-[0.8rem] text-cocoa">
        <span>1 · Fragile</span>
        <span>2 · Growing</span>
        <span>3 · Steady</span>
      </div>
      <p className="text-[0.85rem] leading-relaxed text-cocoa">
        The bars estimate spoken recall, not permanent mastery. Using a word with visible meanings
        counts as supported practice.
      </p>

      {learner.capabilities.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-3xl bg-butter p-6">
          <h2 className="text-xl font-semibold">Finding your voice</h2>
          {learner.capabilities.map((c) => (
            <p key={c} className="text-[0.95rem]">
              {c}
            </p>
          ))}
          <p className="text-[0.8rem] text-cocoa">
            Observed across conversations. These are provisional, not formal level certificates.
          </p>
        </div>
      ) : null}

      <button
        type="button"
        className="flex items-center gap-2 py-2 text-[0.95rem]"
        onClick={() => setSessions(true)}
      >
        <History size={17} /> Past conversations
      </button>

      <WordDetailSheet word={selected} onClose={() => setSelected(null)} />
      <SessionHistorySheet open={sessions} onOpenChange={setSessions} />
    </div>
  )
}
