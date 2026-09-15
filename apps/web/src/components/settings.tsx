import { Download, LogOut, Share } from 'lucide-react'
import { useRef, useState } from 'react'
import { useCoordinator, useStore } from '../lib/app'
import { api } from '../lib/api'
import { decodeArchiveText, encodeArchiveText } from '../lib/archive'
import { ALL_LANGUAGES, MEANING_LANGUAGES, settingsTitle } from '../lib/languages'
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
      setMessage('Your backup has been imported.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Import failed.')
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
    <Sheet open={open} onOpenChange={(v) => coordinator.setShowSettings(v)} title="Make yourself comfortable" wide>
      <div className="flex flex-col gap-7 px-6 pt-2 pb-12">
        <SettingSection
          title="Just your pace"
          footer={
            coordinator.isRunning
              ? 'End this conversation to switch languages. Each language keeps its own words and progress.'
              : 'Each language keeps its own words and progress. Mural finds your pace through conversation.'
          }
        >
          <Picker
            label="Learning language"
            value={coordinator.language.id}
            onChange={(v) => coordinator.selectLanguage(v)}
            options={ALL_LANGUAGES.map((l) => l.id)}
            display={(id) => settingsTitle(ALL_LANGUAGES.find((l) => l.id === id)!)}
            disabled={coordinator.isRunning}
          />
          <Toggle
            label="Meaning subtitles"
            checked={store.preferences.meaningVisible}
            onChange={() => coordinator.toggleMeaning()}
          />
          <Picker
            label="Meaning language"
            value={store.preferences.meaningLanguage}
            onChange={(v) => coordinator.selectMeaningLanguage(v)}
            options={MEANING_LANGUAGES}
          />
          <SettingRow label="Corrections" value="Gently, as we talk" />
          <textarea
            className="field min-h-16"
            placeholder="A few things you enjoy"
            value={store.preferences.interests}
            onChange={(e) =>
              store.updatePreferences((p) => {
                p.interests = e.target.value.slice(0, 500)
              })
            }
          />
        </SettingSection>

        <SettingSection
          title="Keep it comfortable"
          footer="Voice estimate uses $0.05/min as of 11 September 2026. Translation, teaching and search cost extra. Interrupted requests can be billed without a usage record here. Your OpenAI dashboard is authoritative. The time limit is local, not a billing cap."
        >
          <Picker
            label="Conversation limit"
            value={store.preferences.sessionMinutes}
            onChange={(v) => store.updatePreferences((p) => (p.sessionMinutes = v))}
            options={SESSION_MINUTES}
            display={(m) => `${m} minutes`}
          />
          <SettingRow
            label="Recorded voice time"
            value={`${Math.floor(totalVoiceSeconds / 60)} min ${Math.floor(totalVoiceSeconds % 60)} sec`}
          />
          <SettingRow
            label="Voice estimate"
            value={`$${(totalVoiceSeconds / 60 * 0.05).toFixed(2)} USD`}
          />
          <SettingRow label="Search calls recorded" value={String(totalSearches)} />
          <a
            href="https://platform.openai.com/usage"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-cocoa/40 underline-offset-2"
          >
            OpenAI usage and billing
          </a>
        </SettingSection>

        <SettingSection
          title="Your words belong to you"
          footer="Backups include transcripts and learning evidence, never account credentials. Import adds conversations with new IDs. Existing conversations stay unchanged."
        >
          <button type="button" className="flex items-center gap-2.5 text-left" onClick={exportBackup}>
            <Share size={17} className="text-cocoa" /> Export learning backup
          </button>
          <button
            type="button"
            className="flex items-center gap-2.5 text-left disabled:opacity-50"
            disabled={coordinator.isRunning}
            onClick={() => fileRef.current?.click()}
          >
            <Download size={17} className="text-cocoa" /> Import learning backup
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
            Delete all conversations and learning
          </button>
          {message ? <p className="text-[0.8rem] text-cocoa">{message}</p> : null}
        </SettingSection>

        <SettingSection title="Help and privacy">
          <a href="https://mural.chat/privacy/" target="_blank" rel="noreferrer" className="underline decoration-cocoa/40 underline-offset-2">Privacy policy</a>
          <a href="https://mural.chat/terms/" target="_blank" rel="noreferrer" className="underline decoration-cocoa/40 underline-offset-2">Terms of use</a>
          <a href="https://mural.chat/support/" target="_blank" rel="noreferrer" className="underline decoration-cocoa/40 underline-offset-2">Contact support</a>
        </SettingSection>

        <SettingSection title="About this copy">
          <p className="text-[0.8rem] leading-relaxed text-cocoa">
            Mural web 0.1 · Voice: GPT-Live-1 · Teacher: GPT-5.6 Luna. Audio and selected text go to
            OpenAI while you practise; raw audio is never saved.
          </p>
          <a
            href="https://developers.openai.com/api/docs/guides/your-data"
            target="_blank"
            rel="noreferrer"
            className="text-[0.85rem] underline decoration-cocoa/40 underline-offset-2"
          >
            OpenAI data controls
          </a>
        </SettingSection>

        <SettingSection title="Sign in">
          <button
            type="button"
            className="flex items-center gap-2.5 text-left"
            onClick={() => setConfirmingLogout(true)}
          >
            <LogOut size={17} className="text-cocoa" /> Sign out of this device
          </button>
        </SettingSection>
      </div>

      <Sheet open={confirmingDelete} onOpenChange={setConfirmingDelete} title="Delete all learning data?">
        <div className="flex flex-col gap-5 px-6 pt-2 pb-8">
          <p className="text-[0.95rem] text-cocoa">
            This removes conversations, vocabulary and progress. Export a backup first if you want to
            keep them. Your preferences remain.
          </p>
          <button
            type="button"
            className="btn-soft !bg-red-100 text-red-800"
            onClick={() => {
              coordinator.deleteLearningData()
              setConfirmingDelete(false)
            }}
          >
            Delete all learning data
          </button>
        </div>
      </Sheet>
      <Sheet open={confirmingLogout} onOpenChange={setConfirmingLogout} title="Sign out?">
        <div className="flex flex-col gap-5 px-6 pt-2 pb-8">
          <p className="text-[0.95rem] text-cocoa">
            You’ll need the shared password to sign back in. Your learning record stays on the
            server.
          </p>
          <button type="button" className="btn-primary" onClick={() => void logout()}>
            Sign out
          </button>
        </div>
      </Sheet>
    </Sheet>
  )
}
