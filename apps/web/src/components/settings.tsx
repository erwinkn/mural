import { Download, LogOut, Share } from 'lucide-react'
import { useRef, useState } from 'react'
import { useCoordinator, useStore, useT } from '../lib/app'
import { api } from '../lib/api'
import { decodeArchiveText, encodeArchiveText } from '../lib/archive'
import { ALL_LANGUAGES } from '../lib/languages'
import { INTERFACE_LANGUAGES, asInterfaceLanguage, localizedSettingsTitle } from '../lib/i18n'
import { useNavigate } from '@tanstack/react-router'
import { Sheet, SettingRow, SettingSection, Toggle, Picker } from './sheet'

const SESSION_MINUTES = [5, 10, 15, 20, 30, 60]

export function SettingsSheet() {
  const coordinator = useCoordinator()
  const store = useStore()
  const navigate = useNavigate()
  const [message, setMessage] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const t = useT()

  const totalVoiceSeconds = store.sessions.reduce((n, s) => n + s.voiceSeconds, 0)
  const totalSearches = store.sessions.reduce((n, s) => n + s.searchCalls, 0)
  const open = coordinator.showSettings

  function exportBackup() {
    const blob = new Blob([encodeArchiveText(store.archive)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Mural-learning-backup.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importBackup(file: File) {
    try {
      const text = await file.text()
      await store.importArchive(decodeArchiveText(text))
      setMessage(t('settings.imported'))
    } catch (e) {
      setMessage(e instanceof Error ? e.message : t('settings.importFailed'))
    }
  }

  async function logout() {
    try {
      await api.logout()
    } finally {
      void navigate({ to: '/login' })
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => coordinator.setShowSettings(v)} title={t('settings.title')} wide>
      <div className="flex flex-col gap-7 px-6 pt-2 pb-12">
        <SettingSection
          title={t('settings.pace')}
          footer={
            coordinator.isRunning
              ? t('settings.paceFooterRunning')
              : t('settings.paceFooter')
          }
        >
          <Picker
            label={t('settings.learningLanguage')}
            value={coordinator.language.id}
            onChange={(v) => coordinator.selectLanguage(v)}
            options={ALL_LANGUAGES.map((l) => l.id)}
            display={(id) =>
              localizedSettingsTitle(
                ALL_LANGUAGES.find((l) => l.id === id)!,
                asInterfaceLanguage(store.preferences.interfaceLanguage),
              )
            }
            disabled={coordinator.isRunning}
          />
          <Picker
            label={t('settings.interfaceLanguage')}
            value={asInterfaceLanguage(store.preferences.interfaceLanguage)}
            onChange={(v) => coordinator.selectInterfaceLanguage(v)}
            options={INTERFACE_LANGUAGES.map((l) => l.id)}
            display={(id) => INTERFACE_LANGUAGES.find((l) => l.id === id)?.nativeName ?? id}
          />
          <Toggle
            label={t('settings.meaningSubtitles')}
            checked={store.preferences.meaningVisible}
            onChange={() => coordinator.toggleMeaning()}
          />
          <SettingRow label={t('settings.corrections')} value={t('settings.correctionsValue')} />
          <textarea
            className="field min-h-16"
            placeholder={t('settings.interests')}
            value={store.preferences.interests}
            onChange={(e) =>
              store.updatePreferences((p) => {
                p.interests = e.target.value.slice(0, 500)
              })
            }
          />
        </SettingSection>

        <SettingSection
          title={t('settings.comfort')}
          footer={t('settings.comfortFooter')}
        >
          <Picker
            label={t('settings.limit')}
            value={store.preferences.sessionMinutes}
            onChange={(v) => store.updatePreferences((p) => (p.sessionMinutes = v))}
            options={SESSION_MINUTES}
            display={(m) => t('settings.minutes', { m })}
          />
          <SettingRow
            label={t('settings.voiceTime')}
            value={t('settings.voiceTimeValue', { m: Math.floor(totalVoiceSeconds / 60), s: Math.floor(totalVoiceSeconds % 60) })}
          />
          <SettingRow
            label={t('settings.voiceEstimate')}
            value={`$${(totalVoiceSeconds / 60 * 0.05).toFixed(2)} USD`}
          />
          <SettingRow label={t('settings.searchCalls')} value={String(totalSearches)} />
          <a
            href="https://platform.openai.com/usage"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-cocoa/40 underline-offset-2"
          >
            {t('settings.openaiUsage')}
          </a>
        </SettingSection>

        <SettingSection
          title={t('settings.data')}
          footer={t('settings.dataFooter')}
        >
          <button type="button" className="flex items-center gap-2.5 text-left" onClick={exportBackup}>
            <Share size={17} className="text-cocoa" /> {t('settings.export')}
          </button>
          <button
            type="button"
            className="flex items-center gap-2.5 text-left disabled:opacity-50"
            disabled={coordinator.isRunning}
            onClick={() => fileRef.current?.click()}
          >
            <Download size={17} className="text-cocoa" /> {t('settings.import')}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) void importBackup(f)
            }}
          />
          <button
            type="button"
            className="flex items-center gap-2.5 text-left text-red-700/80 disabled:opacity-50"
            disabled={coordinator.isRunning}
            onClick={() => setConfirmingDelete(true)}
          >
            {t('settings.deleteAll')}
          </button>
          {message ? <p className="text-[0.8rem] text-cocoa">{message}</p> : null}
        </SettingSection>

        <SettingSection title={t('settings.help')}>
          <a href="https://mural.chat/privacy/" target="_blank" rel="noreferrer" className="underline decoration-cocoa/40 underline-offset-2">{t('settings.privacy')}</a>
          <a href="https://mural.chat/terms/" target="_blank" rel="noreferrer" className="underline decoration-cocoa/40 underline-offset-2">{t('settings.terms')}</a>
          <a href="https://mural.chat/support/" target="_blank" rel="noreferrer" className="underline decoration-cocoa/40 underline-offset-2">{t('settings.support')}</a>
        </SettingSection>

        <SettingSection title={t('settings.about')}>
          <p className="text-[0.8rem] leading-relaxed text-cocoa">
            {t('settings.aboutBody')}
          </p>
          <a
            href="https://developers.openai.com/api/docs/guides/your-data"
            target="_blank"
            rel="noreferrer"
            className="text-[0.85rem] underline decoration-cocoa/40 underline-offset-2"
          >
            {t('settings.openaiData')}
          </a>
        </SettingSection>

        <SettingSection title={t('settings.signin')}>
          <button
            type="button"
            className="flex items-center gap-2.5 text-left"
            onClick={() => setConfirmingLogout(true)}
          >
            <LogOut size={17} className="text-cocoa" /> {t('settings.signout')}
          </button>
        </SettingSection>
      </div>

      <Sheet open={confirmingDelete} onOpenChange={setConfirmingDelete} title={t('settings.deleteAllTitle')}>
        <div className="flex flex-col gap-5 px-6 pt-2 pb-8">
          <p className="text-[0.95rem] text-cocoa">
            {t('settings.deleteAllBody')}
          </p>
          <button
            type="button"
            className="btn-soft !bg-red-100 text-red-800"
            onClick={() => {
              coordinator.deleteLearningData()
              setConfirmingDelete(false)
            }}
          >
            {t('settings.deleteAllConfirm')}
          </button>
        </div>
      </Sheet>
      <Sheet open={confirmingLogout} onOpenChange={setConfirmingLogout} title={t('settings.signoutTitle')}>
        <div className="flex flex-col gap-5 px-6 pt-2 pb-8">
          <p className="text-[0.95rem] text-cocoa">
            {t('settings.signoutBody')}
          </p>
          <button type="button" className="btn-primary" onClick={() => void logout()}>
            {t('settings.signoutConfirm')}
          </button>
        </div>
      </Sheet>
    </Sheet>
  )
}
