# Mural web

A web port of the Mural iOS app: the same conversation-first language practice
(voice via OpenAI realtime + WebRTC, meaning subtitles, words, themes,
transcripts) behind a shared-password gate, deployable to Cloudflare Workers.

## Stack

- TanStack Start (React + Vite SSR), Tailwind 4, Base UI primitives
- Cloudflare Workers (`@cloudflare/vite-plugin`) — `main: @tanstack/react-start/server-entry`
- D1 + Drizzle for the learning archive (sessions + preferences, same
  SessionRecord JSON shape as the native `Archive`)
- Server-side OpenAI proxy — the API key never reaches the browser

## Develop

```sh
npm install
cp .dev.vars.example .dev.vars   # fill in APP_PASSWORD, OPENAI_API_KEY, SESSION_SECRET
npm run dev                      # vite dev (workerd locally via the CF plugin)
npm run db:migrate:local         # first run only — creates local D1 tables
```

Check types with `npm run check`, build with `npm run build`.

## Deploy

```sh
npx wrangler d1 create mural-web            # put the printed id in wrangler.jsonc
npx wrangler secret put APP_PASSWORD
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put SESSION_SECRET
npm run deploy                              # vite build && wrangler deploy
npm run db:migrate                          # apply D1 migrations remotely
```

`wrangler.jsonc` also carries non-secret vars: `OPENAI_BASE_URL`,
`VOICE_MODEL` (`gpt-live-1`), `TEXT_MODEL` (`gpt-5.6-luna`).

## Layout

- `src/lib` — ports of `MuralCore`: models, language modules, themes,
  TeachingPolicy prompts, LearningEngine projection, archive codec (iOS
  backup-compatible), WebRTC transport, conversation coordinator, store.
- `src/server` — auth (sealed cookie session), Drizzle schema/queries,
  OpenAI Responses + live-session proxy.
- `src/routes/api` — REST endpoints used by the client (`/api/login`,
  `/api/archive`, `/api/sessions`, `/api/realtime`, `/api/ai`, …). All except
  `/api/login` require the sealed session cookie.
- `src/routes` — pages: `/login`, onboarding, Talk, Themes, Words.

## Notes

- Learning backups export/import in the native `Archive` format (dates as
  seconds since 2001-01-01, schemaVersion 2) so files round-trip with iOS.
- Raw audio is never stored; voice seconds come from session usage events.
- Regenerate Worker types after changing `wrangler.jsonc`: `npm run cf-typegen`.
