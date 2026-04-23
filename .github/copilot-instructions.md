# Project Guidelines — Organaiz

AI-powered life organizer PWA with conversational interface. Uses Claude Sonnet 4 for chat, Twilio voice calls for accountability, and web push notifications. Chat-first UI with sarcastic, blunt personality.

## Tech Stack

- **Next.js 16** (App Router) + React 19 + TypeScript (strict)
- **Claude Sonnet 4** via `@anthropic-ai/sdk` — AI conversation (no provider abstraction)
- **OpenAI** via `openai` SDK — embeddings only (`text-embedding-3-small`)
- **MongoDB** via Mongoose — models in `lib/models/`
- **Twilio** — voice calls with TTS, status callbacks, machine detection
- **Web Push** — VAPID-based push notifications via service worker
- **node-cron** — background scheduler started in `instrumentation.ts`
- **Tailwind CSS 4** — dark mode supported (`dark:` classes)
- **PWA** — `@ducanh2912/next-pwa`, offline fallback at `/offline`

## Architecture

```
app/                  → Pages + API routes (App Router)
  api/chat/           → AI conversation endpoint (POST)
  api/calls/          → Twilio call lifecycle (test, confirm, webhook)
  api/push/           → Push subscription + notification endpoints
  api/users/phone/    → User registration/settings
  components/         → ChatHeader, ChatMessage, ChatInput, PhoneSetup, PushNotifications, RegisterSW
  settings/           → Settings page (phone setup + push notifications)
lib/                  → Server-side logic
  ai.ts               → Anthropic SDK, buildPrompt(), chat(), tool use loop, memory retrieval
  embeddings.ts       → OpenAI embeddings + cosine similarity
  seed.ts             → Default Life Areas seeder
  db.ts               → Mongoose connection (singleton)
  scheduler.ts        → Cron job: create CallJobs + process pending calls
  twilio.ts           → Twilio client, TwiML generation, call messages
  subscriptions.ts    → Push subscription store (⚠️ in-memory, needs DB migration)
  models/             → Mongoose schemas (User, CallJob, Item, Idea, Memory)
worker/index.ts       → Service worker source → compiles to public/sw.js
instrumentation.ts    → Server startup hook (starts scheduler)
```

## Build & Run

```bash
npm run dev          # Dev server (PWA/SW disabled)
npm run build        # Production build
npm run start        # Production server (PWA enabled, SW works)
npm run lint         # ESLint
```

Service worker and push notifications only work after `npm run build && npm run start`.

## Environment Variables

All required — see `setup.md` for generation instructions:

| Variable | Scope | Purpose |
|----------|-------|---------|
| `MONGODB_URI` | Server | MongoDB connection string |
| `TWILIO_ACCOUNT_SID` | Server | Twilio account |
| `TWILIO_AUTH_TOKEN` | Server | Twilio auth |
| `TWILIO_PHONE_NUMBER` | Server | Sending number (E.164) |
| `NEXT_PUBLIC_APP_URL` | Public | Base URL for Twilio callbacks |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Public | Web Push VAPID public key |
| `VAPID_PRIVATE_KEY` | Server | Web Push VAPID private key |
| `ANTHROPIC_API_KEY` | Server | Claude Sonnet 4 conversation |
| `OPENAI_API_KEY` | Server | OpenAI embeddings (text-embedding-3-small) |

## Conventions

### Naming
- Components: `PascalCase` — files and exports
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE` (e.g., `CALL_MESSAGES`)
- Interfaces: `I` prefix (`IUser`, `ICallJob`)
- Mongoose models: use `mongoose.models` cache to prevent duplicate compilation

### Phone Numbers
- Always E.164 format: `/^\+[1-9]\d{6,14}$/`
- Client auto-adds `+`, strips spaces/dashes before saving

### Timezones
- IANA strings only (`America/New_York`, `Africa/Lagos`)
- `Intl.DateTimeFormat` for timezone-aware hour calculation
- Jobs created only in first 5 minutes of target hour (dedup window)

### API Responses
- Error shape: `{ error: string }` with appropriate HTTP status
- Twilio webhook routes: always return `200 OK` (prevents Twilio retries)
- All routes wrapped in try-catch with `console.error` logging

### Security Notes
- ⚠️ Twilio webhook signature verification is not yet implemented
- All TTS messages are XML-escaped before embedding in TwiML
- HTTPS required in production (PWA mandate)

## Key Patterns

- **Call deduplication:** Scheduler checks for existing jobs today before creating new ones
- **Retry logic:** No-answer → retry after 5 minutes, max 3 attempts per job
- **Voicemail detection:** `machineDetection: "Enable"` on Twilio calls
- **CallJob lifecycle:** `pending → queued → calling → completed/no-answer/failed`
- **Scheduler frequency:** Every 60 seconds via cron, processes all users per tick

## Known Issues

1. Push subscriptions are stored in-memory (`lib/subscriptions.ts`) — lost on restart
2. Daylight saving transitions not explicitly handled for timezone edge cases
3. Service worker requires production build to function
