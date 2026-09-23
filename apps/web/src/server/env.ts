import { env } from 'cloudflare:workers'

export interface AppEnv {
  DB: D1Database
  OPENAI_API_KEY?: string
  APP_PASSWORD?: string
  SESSION_SECRET?: string
  OPENAI_BASE_URL?: string
  VOICE_MODEL?: string
  TEXT_MODEL?: string
}

export function getEnv(): AppEnv {
  return env as unknown as AppEnv
}

export function openAIBase(): string {
  return (getEnv().OPENAI_BASE_URL ?? 'https://api.openai.com').replace(/\/+$/, '')
}
export function voiceModel(): string {
  return getEnv().VOICE_MODEL ?? 'gpt-live-1'
}
export function textModel(): string {
  return getEnv().TEXT_MODEL ?? 'gpt-5.6-luna'
}
