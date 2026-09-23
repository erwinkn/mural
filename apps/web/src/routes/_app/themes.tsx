import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowUpRight, AudioWaveform, Search } from 'lucide-react'
import { useState } from 'react'
import { PageHeading } from '../../components/brand'
import { ThemeIcon } from '../../components/icons'
import { CurrentTopicSheet } from '../../components/sheets'
import { useCoordinator, useStore, useT } from '../../lib/app'
import { themeSubtitle } from '../../lib/i18n'
import { moduleThemes } from '../../lib/languages'
import type { ConversationTheme } from '../../lib/themes'

const PANELS = ['bg-peach', 'bg-lilac', 'bg-sage', 'bg-butter']

export const Route = createFileRoute('/_app/themes')({
  component: ThemesPage,
})

function ThemesPage() {
  const coordinator = useCoordinator()
  const store = useStore()
  const t = useT()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [current, setCurrent] = useState(false)

  const meaningLanguage = store.preferences.meaningLanguage
  const categoryLabels: Record<string, string> = {
    Everyday: t('themes.cat.everyday'),
    Connection: t('themes.cat.connection'),
    'Local life': t('themes.cat.localLife'),
    Interests: t('themes.cat.interests'),
  }

  const all = moduleThemes(coordinator.language)
  const categories = ['All', ...new Set(all.map((t) => t.category))]
  const themes = all.filter(
    (t) =>
      (category === 'All' || t.category === category) &&
      (!search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase())),
  )

  function choose(theme: ConversationTheme | null) {
    coordinator.chooseTheme(theme)
    void navigate({ to: '/' })
  }

  return (
    <div className="flex flex-col gap-6 px-6 pt-6">
      <PageHeading
        eyebrow={t('themes.eyebrow')}
        title={t('themes.title')}
        subtitle={t('themes.subtitle')}
      />

      <button
        type="button"
        className="card flex items-center gap-3 p-6 text-left font-semibold"
        onClick={() => choose(null)}
      >
        <AudioWaveform size={20} />
        {t('themes.justTalk')}
        <ArrowUpRight size={18} className="ml-auto" />
      </button>

      <label className="field flex items-center gap-2.5 !py-3.5">
        <Search size={17} className="shrink-0 text-cocoa" />
        <input
          className="w-full bg-transparent outline-none placeholder:text-cocoa/60"
          placeholder={t('themes.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>

      <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none]">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={category === c}
            className={`shrink-0 rounded-full px-4 py-2.5 text-[0.8rem] ${
              category === c ? 'bg-peach' : 'bg-white/65'
            }`}
            onClick={() => setCategory(c)}
          >
            {c === 'All' ? t('themes.all') : (categoryLabels[c] ?? c)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 sm:grid-cols-[repeat(auto-fill,minmax(190px,1fr))]">
        {themes.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`flex min-h-36 flex-col items-start justify-between gap-7 rounded-[27px] p-5 text-left ${PANELS[t.colorIndex % PANELS.length]}`}
            onClick={() => (t.id === 'today' ? setCurrent(true) : choose(t))}
          >
            <ThemeIcon symbol={t.symbol} />
            <span className="flex flex-col items-start gap-1">
              <span className="font-semibold">{t.title}</span>
              <span className="text-[0.8rem] text-cocoa">{themeSubtitle(t.subtitle, meaningLanguage)}</span>
            </span>
          </button>
        ))}
      </div>
      {themes.length === 0 ? (
        <p className="py-8 text-center text-cocoa">{t('themes.none', { search })}</p>
      ) : null}

      <CurrentTopicSheet
        open={current}
        onOpenChange={setCurrent}
        onSelected={() => void navigate({ to: '/' })}
      />
    </div>
  )
}
