import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { CheckCircle2, ChevronLeft, Circle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Brand } from '../../components/brand'
import { MuralOrb } from '../../components/orb'
import { PinyinHelp } from '../../components/pinyin'
import { Picker } from '../../components/sheet'
import { useApp } from '../../lib/app'
import { AI_CONSENT_SUMMARY, AI_CONSENT_VERSION } from '../../lib/coordinator'
import { DEFAULT_MEANING_LANGUAGE } from '../../lib/models'
import {
  ALL_LANGUAGES,
  MEANING_LANGUAGES,
  meaningGreeting,
  moduleFor,
  settingsTitle,
} from '../../lib/languages'

export const Route = createFileRoute('/_app/onboarding')({
  component: OnboardingPage,
})

const displayNames = (() => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' })
  } catch {
    return null
  }
})()

/// Mirrors the iOS advance() logic: when the learner hasn't picked a meaning
/// language, guess from browser language preferences.
function preferredMeaning(targetName: string): string {
  for (const id of navigator.languages ?? []) {
    let code = id
    try {
      code = new Intl.Locale(id).language ?? id
    } catch {
      /* keep raw */
    }
    const name =
      code === 'zh'
        ? 'Chinese (Simplified)'
        : (moduleFor(code)?.name ?? displayNames?.of(code) ?? '')
    if (MEANING_LANGUAGES.includes(name) && name !== targetName) return name
  }
  return MEANING_LANGUAGES.find((n) => n !== targetName) ?? 'English'
}

function OnboardingPage() {
  const { store, coordinator } = useApp()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [targetID, setTargetID] = useState(coordinator.language.id)
  const [meaning, setMeaning] = useState(store.preferences.meaningLanguage)
  const [chosenMeaning, setChosenMeaning] = useState(
    store.preferences.meaningLanguage !== DEFAULT_MEANING_LANGUAGE ||
      store.preferences.hasOnboarded,
  )
  const [greetingIndex, setGreetingIndex] = useState(0)

  const target = useMemo(() => moduleFor(targetID) ?? ALL_LANGUAGES[0], [targetID])
  const reduceMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )
  const greeting = reduceMotion ? target.greeting : ALL_LANGUAGES[greetingIndex].greeting

  useEffect(() => {
    if (reduceMotion) return
    const t = window.setInterval(() => setGreetingIndex((i) => (i + 1) % ALL_LANGUAGES.length), 3800)
    return () => window.clearInterval(t)
  }, [reduceMotion])

  function advance() {
    if (step === 0) {
      if (!chosenMeaning && meaning === target.name) setMeaning(preferredMeaning(target.name))
      setStep(1)
    } else {
      coordinator.selectLanguage(targetID)
      coordinator.selectMeaningLanguage(meaning)
      store.updatePreferences((p) => {
        p.meaningVisible = true
        p.aiConsentVersion = AI_CONSENT_VERSION
        p.hasOnboarded = true
      })
      void navigate({ to: '/' })
    }
  }

  const consent = (
    <div className="flex flex-col items-center gap-3">
      <p className="text-center text-[0.85rem] leading-relaxed text-cocoa">{AI_CONSENT_SUMMARY}</p>
      <a
        href="https://mural.chat/privacy/"
        target="_blank"
        rel="noreferrer"
        className="text-[0.85rem] underline"
      >
        Privacy policy
      </a>
    </div>
  )

  return (
    <>
      <div className="mesh-bg" aria-hidden />
      <div className="relative mx-auto flex h-dvh w-full max-w-xl flex-col">
        <div className="flex h-14 items-center justify-between px-6 pt-2">
          {step === 1 ? (
            <button
              type="button"
              aria-label="Back to learning language"
              className="glass flex size-11 items-center justify-center rounded-full"
              onClick={() => setStep(0)}
            >
              <ChevronLeft size={20} />
            </button>
          ) : (
            <Brand />
          )}
          <div className="flex items-center gap-1.5" aria-label={`Step ${step + 1} of 2`}>
            {[0, 1].map((i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-orange' : 'w-2 bg-peach'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className={`flex flex-col items-center ${step === 0 ? 'gap-5' : 'gap-4'}`}>
            <div className="flex flex-col items-center gap-1 pt-2">
              <MuralOrb className={step === 0 ? 'w-32' : 'w-20'} />
              <p
                key={greeting}
                className={`fade-in font-medium tracking-[-2px] ${
                  step === 0 ? 'text-6xl' : 'text-5xl'
                }`}
              >
                {greeting}
              </p>
            </div>

            {step === 0 ? (
              <div className="flex w-full flex-col gap-4">
                <h1 className="text-center text-2xl font-semibold tracking-[-0.5px] whitespace-pre-line">
                  {'What would you\nlike to speak?'}
                </h1>
                <div className="flex flex-col gap-2.5">
                  {ALL_LANGUAGES.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      aria-pressed={targetID === l.id}
                      className={`flex items-center gap-3.5 rounded-[22px] px-5 py-3.5 text-left transition-colors ${
                        targetID === l.id
                          ? 'bg-white/95 ring-[1.5px] ring-orange/55'
                          : 'bg-white/50'
                      }`}
                      onClick={() => setTargetID(l.id)}
                    >
                      <span className="flex flex-1 flex-col items-start gap-0.5">
                        <span className="font-semibold">{l.nativeName}</span>
                        <span className="text-[0.8rem] text-cocoa">{settingsTitle(l)}</span>
                      </span>
                      {targetID === l.id ? (
                        <CheckCircle2 size={22} className="text-orange" />
                      ) : (
                        <Circle size={22} className="text-cocoa/40" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex w-full flex-col items-center gap-5">
                <div className="flex flex-col items-center gap-2.5 text-center">
                  <h1 className="text-2xl font-semibold tracking-[-0.5px] whitespace-pre-line">
                    {'A little help,\nin your language.'}
                  </h1>
                  <p className="text-[0.95rem] text-cocoa">
                    Mural speaks {target.name}. Choose the language you read most easily for
                    meanings.
                  </p>
                </div>
                <Picker
                  label="Subtitle language"
                  value={meaning}
                  onChange={(v) => {
                    setMeaning(v)
                    setChosenMeaning(true)
                  }}
                  options={MEANING_LANGUAGES}
                />
                <div className="flex flex-col items-center gap-2 py-2 text-center">
                  <p className="text-2xl font-medium">{target.greeting}</p>
                  {target.id === 'zh' ? <PinyinHelp text={target.greeting} /> : null}
                  <p className="text-cocoa">{meaningGreeting(meaning)}</p>
                  <p className="pt-2 text-[0.8rem] text-cocoa">
                    Turn meanings on whenever you need a hand.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 px-6 pt-4 pb-5">
          {step === 1 ? consent : null}
          <button type="button" className="btn-primary text-lg" onClick={advance}>
            {step === 0 ? 'Continue' : 'Agree and continue'}
          </button>
          <p className="text-center text-[0.8rem] text-cocoa">
            {step === 0
              ? 'We’ll find your pace through conversation.'
              : 'You can change both languages in Settings.'}
          </p>
        </div>
      </div>
    </>
  )
}
