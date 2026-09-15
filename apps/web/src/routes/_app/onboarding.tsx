import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { CheckCircle2, ChevronLeft, Circle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Brand } from '../../components/brand'
import { MuralOrb } from '../../components/orb'
import { PinyinHelp } from '../../components/pinyin'
import { Picker } from '../../components/sheet'
import { useApp, useT } from '../../lib/app'
import { AI_CONSENT_VERSION } from '../../lib/coordinator'
import { DEFAULT_MEANING_LANGUAGE } from '../../lib/models'
import {
  INTERFACE_LANGUAGES,
  asInterfaceLanguage,
  languageName,
  localizedSettingsTitle,
  meaningLanguageName,
  type InterfaceLanguage,
} from '../../lib/i18n'
import {
  ALL_LANGUAGES,
  MEANING_LANGUAGES,
  meaningGreeting,
  moduleFor,
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

/// Best meaning-language guess from the device/browser locale.
function preferredMeaning(excludeName: string, fallback?: string): string {
  const navs = typeof navigator !== 'undefined' ? navigator.languages ?? [] : []
  for (const nav of navs) {
    const code = nav.split('-')[0]
    const name =
      code === 'pt'
        ? 'Brazilian Portuguese'
        : code === 'zh'
          ? 'Chinese (Simplified)'
          : (moduleFor(code)?.name ?? displayNames?.of(code) ?? '')
    if (MEANING_LANGUAGES.includes(name) && name !== excludeName) return name
  }
  return fallback ?? MEANING_LANGUAGES.find((n) => n !== excludeName) ?? 'English'
}

function OnboardingPage() {
  const { store, coordinator } = useApp()
  const navigate = useNavigate()
  const t = useT()
  const [step, setStep] = useState(0)
  const [interfaceLang, setInterfaceLang] = useState<InterfaceLanguage>(
    asInterfaceLanguage(store.preferences.interfaceLanguage),
  )
  const [meaning, setMeaning] = useState(() =>
    store.preferences.hasOnboarded
      ? store.preferences.meaningLanguage
      : preferredMeaning('', DEFAULT_MEANING_LANGUAGE),
  )
  const [targetID, setTargetID] = useState(coordinator.language.id)
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

  function chooseInterface(id: InterfaceLanguage) {
    setInterfaceLang(id)
    coordinator.selectInterfaceLanguage(id)
  }

  function chooseTarget(id: string) {
    setTargetID(id)
    const name = moduleFor(id)?.name
    const same =
      name === meaning ||
      (name === 'Portuguese' && meaning === 'Brazilian Portuguese')
    if (name && same) setMeaning(preferredMeaning(name))
  }

  function advance() {
    if (step < 2) {
      setStep(step + 1)
    } else {
      coordinator.selectLanguage(targetID)
      coordinator.selectMeaningLanguage(meaning)
      coordinator.selectInterfaceLanguage(interfaceLang)
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
      <p className="text-center text-[0.85rem] leading-relaxed text-cocoa">{t('consent.summary')}</p>
      <a
        href="https://mural.chat/privacy/"
        target="_blank"
        rel="noreferrer"
        className="text-[0.85rem] underline"
      >
        {t('consent.privacy')}
      </a>
    </div>
  )

  return (
    <>
      <div className="mesh-bg" aria-hidden />
      <div className="relative mx-auto flex h-dvh w-full max-w-xl flex-col">
        <div className="flex h-14 items-center justify-between px-6 pt-2">
          {step > 0 ? (
            <button
              type="button"
              aria-label={step === 1 ? t('ob.backInterface') : t('ob.backMeaning')}
              className="glass flex size-11 items-center justify-center rounded-full"
              onClick={() => setStep(step - 1)}
            >
              <ChevronLeft size={20} />
            </button>
          ) : (
            <Brand />
          )}
          <div
            className="flex items-center gap-1.5"
            aria-label={t('ob.step', { n: step + 1, total: 3 })}
          >
            {[0, 1, 2].map((i) => (
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
          <div className={`flex flex-col items-center ${step === 2 ? 'gap-4' : 'gap-5'}`}>
            <div className="flex flex-col items-center gap-1 pt-2">
              <MuralOrb className={step === 2 ? 'w-20' : 'w-32'} />
              <p
                key={greeting}
                className={`fade-in font-medium tracking-[-2px] ${
                  step === 2 ? 'text-5xl' : 'text-6xl'
                }`}
              >
                {step === 2 ? target.greeting : greeting}
              </p>
            </div>

            {step === 0 ? (
              <div className="flex w-full flex-col gap-4">
                <h1 className="text-center text-2xl font-semibold tracking-[-0.5px] whitespace-pre-line">
                  {t('ob.interfaceTitle')}
                </h1>
                <div className="flex flex-col gap-2.5">
                  {INTERFACE_LANGUAGES.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      aria-pressed={interfaceLang === l.id}
                      className={`flex items-center gap-3.5 rounded-[22px] px-5 py-3.5 text-left transition-colors ${
                        interfaceLang === l.id
                          ? 'bg-white/95 ring-[1.5px] ring-orange/55'
                          : 'bg-white/50'
                      }`}
                      onClick={() => chooseInterface(l.id)}
                    >
                      <span className="flex flex-1 flex-col items-start gap-0.5">
                        <span className="font-semibold">{l.nativeName}</span>
                        <span className="text-[0.8rem] text-cocoa">{l.name}</span>
                      </span>
                      {interfaceLang === l.id ? (
                        <CheckCircle2 size={22} className="text-orange" />
                      ) : (
                        <Circle size={22} className="text-cocoa/40" />
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-center text-[0.8rem] text-cocoa">{t('ob.interfaceHint')}</p>
              </div>
            ) : step === 1 ? (
              <div className="flex w-full flex-col items-center gap-5">
                <div className="flex flex-col items-center gap-2.5 text-center">
                  <h1 className="text-2xl font-semibold tracking-[-0.5px] whitespace-pre-line">
                    {t('ob.meaningTitle')}
                  </h1>
                  <p className="text-[0.95rem] text-cocoa">{t('ob.meaningSub')}</p>
                </div>
                <Picker
                  label={t('ob.meaningPicker')}
                  value={meaning}
                  onChange={setMeaning}
                  options={MEANING_LANGUAGES}
                  display={(n) => meaningLanguageName(n, interfaceLang)}
                />
                <p className="pt-2 text-center text-[0.8rem] text-cocoa">{t('ob.meaningHint')}</p>
              </div>
            ) : (
              <div className="flex w-full flex-col gap-4">
                <h1 className="text-center text-2xl font-semibold tracking-[-0.5px] whitespace-pre-line">
                  {t('ob.targetTitle')}
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
                      onClick={() => chooseTarget(l.id)}
                    >
                      <span className="flex flex-1 flex-col items-start gap-0.5">
                        <span className="font-semibold">{l.nativeName}</span>
                        <span className="text-[0.8rem] text-cocoa">
                          {localizedSettingsTitle(l, interfaceLang)}
                        </span>
                      </span>
                      {targetID === l.id ? (
                        <CheckCircle2 size={22} className="text-orange" />
                      ) : (
                        <Circle size={22} className="text-cocoa/40" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col items-center gap-2 py-1 text-center">
                  <p className="text-[0.8rem] text-cocoa">
                    {t('ob.speaks', { language: languageName(target, interfaceLang) })}
                  </p>
                  {target.id === 'zh' ? <PinyinHelp text={target.greeting} /> : null}
                  <p className="text-cocoa">{meaningGreeting(meaning)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 px-6 pt-4 pb-5">
          {step === 2 ? consent : null}
          <button type="button" className="btn-primary text-lg" onClick={advance}>
            {step === 2 ? t('ob.agree') : t('ob.continue')}
          </button>
          <p className="text-center text-[0.8rem] text-cocoa">
            {step === 2 ? t('ob.footnoteLast') : t('ob.footnote0')}
          </p>
        </div>
      </div>
    </>
  )
}
