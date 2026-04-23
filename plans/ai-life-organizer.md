# Plan: AI-Powered Life Organizer

> Source PRD: `PRD.md` — Transform Organaiz from a reminder-only accountability app into a full AI life management platform with conversational interface, task hierarchy, intelligent memory, voice interaction, and proactive AI-driven calls/notifications.

## Architectural Decisions

Durable decisions resolved during design review (28 decisions). These apply across all phases.

### AI Provider & Conversation

- **Conversation model**: Claude Sonnet 4 via `@anthropic-ai/sdk`. No provider abstraction — use the SDK directly in `lib/ai.ts`. If switching models later, refactor one file.
- **Embeddings model**: OpenAI `text-embedding-3-small` via `openai` SDK. Anthropic has no embedding model.
- **Env vars**: `ANTHROPIC_API_KEY` (conversation) + `OPENAI_API_KEY` (embeddings only).
- **Structured extraction**: Anthropic tool use (function calling). Tools defined progressively per phase. Fine-grained, well-named tools (`create_task`, `update_task`, `capture_idea`) — not coarse mega-tools.
- **Conversation history**: Client sends full message array `{ messages: [{ role, content }, ...] }`. Server truncates to last **30 messages** (~15 exchanges) before forwarding to Claude. Memory system compensates for truncated early context.
- **System prompt**: `buildPrompt(context: 'chat' | 'notification' | 'call' | 'summary')` in `lib/ai.ts`. Shared personality preamble + context-specific suffix. Personality: sarcastic, blunt, no-excuses.
- **"New conversation" button**: Visible in chat UI for manual session reset.

### Schema (MongoDB)

- **User** — Extended with `lastActiveAt` (updated on every API interaction), `lifeAreas`, `preferences`. Existing fields (phone, timezone, callPrefs, streak, lastCheckIn, pushSubscription) preserved. `lastCheckIn` remains for streak/call confirmation only.
- **Item** — Single unified collection for all types. Fields: `type` (area/goal/project/task/subtask), `title`, `description`, `status` (not-started/in-progress/done), `priority` (urgent/high/medium/low), `deadline?`, `estimatedDuration?`, `tags`, `parentId?`, `relatedItems` (array of `{ itemId, type: blocks|related-to|part-of|inspired-by }`), `recurrenceRule?` (JSON: `{ frequency, days?, dayOfMonth?, time? }`), `progress`, `completedAt?`, `lastNotifiedAt?`. Indexes: `{ status, deadline }`, `{ parentId }`, `{ type }`. Hierarchy traversal: simple recursive `find({ parentId })` queries — no materialized paths needed at single-user scale.
- **Idea** — Fields: `content`, `tags`, `category`, `embedding` (vector), `status` (captured/promoted/archived), `relatedItems`, `promotedToItemId?`. Vector search index on `embedding`. On promotion: idea stays as `status: "promoted"` (not archived). Vector search filters to `{ status: "captured" }` by default.
- **Memory** — Fields: `content`, `type` (fact/preference/goal/idea/context), `embedding` (vector), `relevanceScore`, `status` (active/deprecated), `lastAccessedAt`. Vector search index on `embedding`. **No automatic decay** — memories persist until manually forgotten via `forget_memory` tool or user saying "forget this." `GET /api/memories` for manual browsing/cleanup.
- **CallJob** — Extended with `aiGeneratedMessage` (boolean), `contextSnapshot` (JSON).

### Routes

- `POST /api/chat` — Central AI conversation endpoint (text + transcribed voice)
- `POST /api/voice/transcribe` — Whisper fallback for iOS STT
- `GET|POST|PATCH /api/tasks` and `GET|POST|PATCH /api/tasks/[id]` — Task/goal/item CRUD
- `GET|POST /api/ideas` and `PATCH /api/ideas/[id]` — Idea capture and management
- `GET /api/memories` and `DELETE /api/memories/[id]` — Memory browsing and deletion
- `GET /api/calls/[id]/context` — CallJob context for post-call follow-up
- `GET /api/dashboard/summary` — AI-generated summaries
- `GET /api/dashboard/progress` — Progress data for goals/projects
- Existing routes preserved: `/api/users/phone`, `/api/calls/*`, `/api/push/*`
- New page routes: `/` (chat home), `/voice`, `/settings`, `/dashboard`

### Memory System

- **Extraction**: `store_memory` and `forget_memory` as Anthropic tools. Claude decides in-context what to remember — no second API call.
- **Retrieval query**: Embed the user's latest message only. Search for top-10 similar memories with similarity threshold 0.7.
- **Injection**: Retrieved memories placed in system prompt after personality preamble: `"Things you know about the user:\n- ..."`. Update `lastAccessedAt` on every retrieved memory.
- **No automatic decay**: Memories persist indefinitely. Manual cleanup only.

### Scheduler & Proactive Intelligence

- **Batched AI calls**: All trigger contexts per tick sent in a single Claude request. One API call per tick regardless of trigger count.
- **Overlapping tick guard**: `isProcessing` flag skips tick if previous tick is still running.
- **Notification cooldown**: `lastNotifiedAt` field on Item model. Scheduler query filters both triggers and cooldowns in one query.
- **Inactivity tracking**: `lastActiveAt` on User, updated on every `POST /api/chat` and task/idea API call.

### Twilio & Voice

- **Call script generation**: At CallJob creation time (not processing time). Context snapshot recorded. Fallback to static `CALL_MESSAGES` if Claude is down.
- **Post-call follow-up**: Push notification links to `/voice?callJobId=abc123`. Voice page fetches context via `GET /api/calls/[id]/context`.
- **Twilio TTS voice**: Keep Polly.Matthew. One-line change later if needed.
- **In-app TTS**: Web Speech API (`SpeechSynthesis`) only. Free, instant, no network dependency.

### UI/UX

- **Navigation**: Chat-first. Small icons in chat header top-right: mic → `/voice`, chart → `/dashboard`, gear → `/settings`. No bottom tab bar. `/call` stays nav-less (notification-only).
- **Chat input**: Auto-expanding `<textarea>`. Single line default, grows to ~5 lines. Enter sends, Shift+Enter newline. Collapses after send.
- **Inline cards**: Task/idea cards show info + single "Done" checkmark button. All other interactions conversational.
- **Dark mode**: Follow system preference (`prefers-color-scheme`). No manual toggle. Existing CSS variables handle both modes.

### Recurring Tasks

- **Recurrence format**: Simple JSON on Item: `{ frequency: "weekly", days: ["mon", "wed", "fri"], time?: "09:00" }`. Supports `daily`, `weekly`, `monthly`.
- **Instance generation**: One instance at a time. Next occurrence created when current is completed or its date passes. No rolling window.

### Dashboard

- **Chat → Dashboard handoff**: AI gives quick text summary in chat, links to `/dashboard` for full visualization.
- **`/dashboard` page**: Rich React page with progress bars, calendar view, streak counter.

### Offline

- **Dropped from plan.** No IndexedDB offline queuing. Existing `/offline` fallback page is sufficient. Phase 10 is notification quick actions only.

### Patterns Preserved

- Mongoose model caching (`mongoose.models.X ||`), `connectDB()` singleton, `export const runtime = "nodejs"`, try-catch error handling in all routes, E.164 phone validation, XML-escaped TwiML, Twilio 200-OK webhook convention.

---

## Phase 1: Chat UI Shell + AI Conversation (Text Only)

**User stories**: 2, 3, 4, 24

### What to build

A complete end-to-end vertical slice: the user opens the app, sees an iMessage-style chat interface, types a message, and receives an AI response with the sarcastic Organaiz personality. This replaces the current home page (animated bot + PhoneSetup).

The home page (`/`) becomes the DM interface — user messages on the right in dark bubbles, AI messages on the left in lighter bubbles. Auto-expanding textarea at the bottom (single line default, grows to ~5 lines, Enter sends, Shift+Enter newline). Messages are ephemeral (React state only). A "New conversation" button resets the session.

Navigation: small icons in chat header top-right — mic (→ `/voice`, Phase 5), chart (→ `/dashboard`, Phase 9), gear (→ `/settings`). The existing PhoneSetup and PushNotifications components move to `/settings`.

The backend is `POST /api/chat` receiving `{ messages: [{ role, content }, ...] }` (full conversation array from client). Server truncates to last 30 messages, forwards to Claude Sonnet 4 via `@anthropic-ai/sdk` with a system prompt built by `buildPrompt('chat')`. Returns `{ reply: string, actions: [] }`. No memory retrieval, no task creation — just raw conversation with personality.

`lib/ai.ts` contains `buildPrompt(context)` function — shared personality preamble + context-specific suffix. Uses Anthropic SDK directly, no provider abstraction.

All existing functionality (calls, push, PWA) continues to work. Dark/light mode follows system preference via existing CSS variables.

### Acceptance criteria

- [ ] Home page (`/`) renders iMessage-style chat with auto-expanding textarea input
- [ ] User messages on right in dark bubbles, AI responses on left in lighter bubbles
- [ ] Client sends full message array; server truncates to last 30 messages before forwarding to Claude
- [ ] AI responds with sarcastic, blunt personality consistent with existing call messages
- [ ] Messages are ephemeral — "New conversation" button and page refresh both reset
- [ ] Chat header has icon links for mic, chart, gear (mic/chart disabled until later phases)
- [ ] PhoneSetup and PushNotifications accessible via `/settings` page
- [ ] Existing call/push functionality is unaffected
- [ ] `lib/ai.ts` with `buildPrompt()` and direct Anthropic SDK usage (no provider abstraction)
- [ ] `ANTHROPIC_API_KEY` env var required; route returns error if missing
- [ ] Loading state shown while waiting for AI response
- [ ] Dark/light mode follows system preference automatically

---

## Phase 2: Task CRUD via AI — Single Level

**User stories**: 6, 12, 26

### What to build

The AI can now create, list, and update tasks from natural language via Anthropic tool use. When the user says "remind me to buy groceries tomorrow," Claude calls the `create_task` tool, the server executes it, and the chat renders an inline task card.

The Item model is introduced (flat, single-level — no hierarchy yet). Fields: type (fixed to "task"), title, description, status, priority, deadline?, estimatedDuration?, tags. All optional fields are truly optional on the schema.

Anthropic tools added (progressive disclosure): `create_task`, `update_task`, `list_tasks`. Claude decides when to invoke them based on user intent. Tool calls are executed server-side; results and the text response are returned together.

API routes: `GET /api/tasks` (list with filters), `POST /api/tasks` (create), `PATCH /api/tasks/[id]` (update). These work independently of chat.

Chat UI renders task cards inline — title, status badge, priority, deadline, plus a single "Done" checkmark button (hybrid interaction: quick-complete via button, everything else conversational).

### Acceptance criteria

- [ ] Item model (single collection) with fields: type, title, description, status, priority, deadline?, estimatedDuration?, tags, createdAt, updatedAt
- [ ] Anthropic tools defined: `create_task`, `update_task`, `list_tasks` — Claude invokes them from natural language
- [ ] User says "remind me to buy groceries tomorrow" → Claude calls `create_task` → task created in MongoDB
- [ ] User says "what are my tasks" → Claude calls `list_tasks` → tasks returned and rendered
- [ ] User says "mark buy groceries as done" → Claude calls `update_task` → task status updated
- [ ] Inline task cards in chat with "Done" checkmark button (clicking calls `PATCH /api/tasks/[id]`)
- [ ] `GET /api/tasks`, `POST /api/tasks`, `PATCH /api/tasks/[id]` work independently of chat
- [ ] AI extracts priority and deadline from natural language when provided
- [ ] AI auto-generates tags for tasks

---

## Phase 3: Idea Capture + Item Hierarchy

**User stories**: 7, 8, 9, 10, 11

### What to build

Two additions: (1) the Idea model for quick thought capture, and (2) the Item model gains hierarchy (parentId, type levels, relationships).

When the user says "I have this idea about starting a podcast," Claude calls the `capture_idea` tool. The idea is immediately stored — capture first, follow-up questions second.

The Item model now supports the full hierarchy: Life Area → Goal → Project → Task → Subtask via `parentId` references and `type` enum. Hierarchy traversal uses simple recursive `find({ parentId })` queries — no materialized paths needed at single-user scale. Relationships between items stored as typed links in `relatedItems`: blocks, related-to, part-of, inspired-by.

New Anthropic tools added: `capture_idea`, `list_ideas`, `create_item` (for hierarchy — creates goals, projects, subtasks).

Idea promotion: when an idea becomes a goal/task, the Idea document stays as `status: "promoted"` with `promotedToItemId` linking to the new Item. Vector search on Ideas filters to `{ status: "captured" }` by default so promoted ideas don't clutter results.

Embedding infrastructure introduced: both Ideas and Items get embeddings (via OpenAI `text-embedding-3-small`) on creation for future vector search. Full memory retrieval comes in Phase 4.

### Acceptance criteria

- [ ] Idea model with fields: content, tags, category, embedding, status (captured/promoted/archived), relatedItems, promotedToItemId?
- [ ] User says "I have this idea about X" → Claude calls `capture_idea` → idea immediately stored
- [ ] AI stores the idea first, then optionally asks follow-up questions
- [ ] Item model supports parentId and type enum (area/goal/project/task/subtask)
- [ ] User says "break down [goal] into tasks" → AI creates a hierarchy via `create_item` tool calls
- [ ] Items can have typed relationships (blocks, related-to, part-of, inspired-by)
- [ ] Default Life Areas seeded for the user (Career, Health, Finance, Personal, Learning)
- [ ] `POST /api/ideas` and `GET /api/ideas` routes work
- [ ] Embeddings generated (via OpenAI `text-embedding-3-small`) for ideas and items on creation
- [ ] On idea promotion: idea stays as `status: "promoted"`, linked via `promotedToItemId`
- [ ] Vector similarity search on capture finds related existing items and creates relationship links

---

## Phase 4: Intelligent Memory System

**User stories**: 33, 34, 35

### What to build

The AI gains persistent, selective memory via two new Anthropic tools: `store_memory` and `forget_memory`. Claude decides in-context whether something is worth remembering and calls `store_memory` as part of the same response — no extra API call.

Before generating each AI response, the system embeds the user's latest message, retrieves the top-10 most relevant memories via MongoDB Atlas Vector Search (similarity threshold 0.7), and injects them into the system prompt after the personality preamble: `"Things you know about the user:\n- ..."`. Updates `lastAccessedAt` on every retrieved memory.

No automatic decay. Memories persist indefinitely until the user says "forget this" (Claude calls `forget_memory`) or the user manually deletes via `DELETE /api/memories/[id]`. At single-user scale, even 1000+ memories is a tiny collection.

The system prompt instructs Claude: "When the user shares a fact, preference, or goal worth remembering across sessions, use the store_memory tool. Be selective — don't store trivial conversation."

### Acceptance criteria

- [ ] Memory model with content, type, embedding, relevanceScore, status (active/deprecated), lastAccessedAt
- [ ] MongoDB Atlas Vector Search index configured on Memory collection's embedding field
- [ ] `store_memory` and `forget_memory` Anthropic tools added to tool definitions
- [ ] Claude decides in-context what to remember — no second API call for extraction
- [ ] Before each response, top-10 memories retrieved via vector search (threshold 0.7) and injected into system prompt
- [ ] AI references previously stored information naturally ("You mentioned earlier that...")
- [ ] User says "forget this" → Claude calls `forget_memory` → memory deprecated
- [ ] No automatic decay — memories persist until manually forgotten
- [ ] `GET /api/memories` lists active memories (for browsing/cleanup)
- [ ] `DELETE /api/memories/[id]` removes a specific memory
- [ ] Chat conversation remains ephemeral — only tool-extracted memories persist across sessions

---

## Phase 5: Voice Interface (STT + TTS)

**User stories**: 1, 5, 36

### What to build

Voice becomes a first-class input and output method. The chat page gets a mic button that activates speech-to-text. AI responses are spoken aloud via Web Speech API (`SpeechSynthesis`) when the user is in voice mode — no OpenAI TTS API (free, instant, no network dependency).

Speech-to-text uses Web Speech API (`SpeechRecognition`) as primary, with OpenAI Whisper API fallback (`POST /api/voice/transcribe`) for iOS Safari where Web Speech is limited. Fallback triggers automatically when Web Speech API is unavailable.

A dedicated `/voice` page provides a voice-forward experience: large mic button, waveform visualizer, real-time transcript display. Supports push-to-talk (hold button) and continuous conversation mode (toggle). Also serves as the post-call follow-up destination (Phase 7).

Voice input is transcribed and sent through `POST /api/chat` — the backend doesn't distinguish between voice and text input. The `isVoice` flag in client state controls whether TTS auto-plays on the response.

### Acceptance criteria

- [ ] Mic button on chat page activates speech-to-text
- [ ] Transcribed voice input sent to `POST /api/chat` like text input
- [ ] AI responses spoken aloud via Web Speech API (`SpeechSynthesis`) when in voice mode
- [ ] `/voice` page with large mic button and real-time transcript display
- [ ] Push-to-talk mode: hold button to speak, release to send
- [ ] Continuous conversation mode: toggle on, speak freely, AI responds after pauses
- [ ] `POST /api/voice/transcribe` accepts audio blob, returns text via Whisper API
- [ ] Fallback to Whisper triggers automatically when Web Speech API unavailable (iOS Safari)
- [ ] Voice interactions create tasks and ideas the same way text does
- [ ] Waveform or visual indicator shows when listening/processing

---

## Phase 6: Proactive Notifications + AI-Aware Push

**User stories**: 17, 18, 19, 20, 21, 22, 38

### What to build

The scheduler becomes intelligent. In addition to creating CallJobs, it now evaluates trigger conditions every tick and sends AI-generated push notifications. Push subscriptions migrated from in-memory `lib/subscriptions.ts` to User model's `pushSubscription` field in MongoDB.

Trigger conditions checked per tick: tasks with deadlines within configurable thresholds, user inactivity (via `lastActiveAt` on User), tasks unblocked by completed dependencies, ideas older than N days without action.

All trigger contexts for a tick are batched into a single Claude request: "Generate notification messages for these N events." One API call per tick regardless of trigger count. An `isProcessing` flag prevents overlapping ticks.

Cooldown: the `lastNotifiedAt` field on Item is checked in the same query that finds triggers — `{ deadline: { $lte: threshold }, lastNotifiedAt: { $lt: cooldownCutoff } }`. No extra collection.

No daily limit — acts whenever necessary.

### Acceptance criteria

- [ ] Push subscriptions persisted in User model (migrated from in-memory Map)
- [ ] `lib/subscriptions.ts` replaced — `/api/push/subscribe` POST/DELETE read/write from MongoDB
- [ ] Scheduler evaluates triggers per tick: approaching deadlines, inactivity, unblocked tasks, dormant ideas
- [ ] All trigger contexts batched into single Claude request per tick
- [ ] `isProcessing` flag prevents overlapping ticks
- [ ] Cooldown via `lastNotifiedAt` on Item — single query finds triggers AND enforces cooldown
- [ ] Inactivity check uses `lastActiveAt` on User model
- [ ] Push notifications mention specific task names and deadlines
- [ ] Dormant ideas (configurable threshold) trigger periodic nudges
- [ ] Completed task unblocking a dependent task triggers notification
- [ ] Existing push send/call routes continue to work

---

## Phase 7: AI-Aware Twilio Calls + Post-Call Follow-Up

**User stories**: 14, 15, 16, 23, 40, 41, 42, 43

### What to build

The three daily Twilio calls become AI-powered. At CallJob creation time (not processing time), the scheduler queries active tasks/goals and sends context to Claude via `buildPrompt('call')` to generate a personalized TTS script. The script and context snapshot are stored on the CallJob. If Claude is down, fall back to static `CALL_MESSAGES`.

Morning call: announces specific tasks due today. Midday call: progress check — done vs. remaining. Evening call: reflection prompt.

After call confirmation (key press), the confirm endpoint sends a push notification linking to `/voice?callJobId=abc123`. The `/voice` page reads the query param, fetches context via `GET /api/calls/[id]/context`, and pre-populates the AI conversation with "Continuing from your [morning/midday/evening] check-in...". Without a query param, `/voice` starts a fresh session.

TTS voice: keep Polly.Matthew. Existing retry logic, voicemail detection, XML escaping all preserved.

### Acceptance criteria

- [ ] Call scripts generated at CallJob creation time, stored in `message` field
- [ ] CallJob stores `aiGeneratedMessage` (boolean) and `contextSnapshot` (JSON)
- [ ] Morning call TTS mentions specific tasks due today by name
- [ ] Midday call TTS references completed vs. remaining tasks
- [ ] Evening call TTS asks for reflection on the day's results
- [ ] AI generates call scripts using `buildPrompt('call')` — same personality as chat
- [ ] Fallback to static `CALL_MESSAGES` if Claude is unavailable at creation time
- [ ] After call confirmation, push notification sent linking to `/voice?callJobId=abc123`
- [ ] `/voice` page fetches context via `GET /api/calls/[id]/context` and pre-populates conversation
- [ ] Existing retry logic (max 3 attempts, 5-minute retry) preserved
- [ ] Polly.Matthew voice, voicemail detection, XML escaping all continue to work

---

## Phase 8: Recurring Tasks + AI Scheduling

**User stories**: 13, 32

### What to build

Items gain a `recurrenceRule` field — a simple JSON object: `{ frequency: "weekly", days: ["mon", "wed", "fri"], time?: "09:00" }`. Supports `daily`, `weekly` (with optional `days`), `monthly` (with optional `dayOfMonth`). No iCal RRULE complexity — simple date math covers 99% of personal recurrence.

Instance generation: one at a time. The scheduler tick checks for recurrence rules whose current instance is completed or past-due. For completed: generate the next occurrence. For past-due: mark as overdue, generate the next occurrence. No rolling window, no orphan cleanup.

New Anthropic tool: `create_recurring_task`. User says "exercise every Monday, Wednesday, Friday" → Claude calls the tool with the parsed recurrence JSON.

The AI can suggest what to work on next. When asked "what should I focus on?", Claude evaluates active items (via `list_tasks`), considers deadlines, priorities, blocked/unblocked status, and user preferences (from memories), and recommends the optimal next action.

### Acceptance criteria

- [ ] Item `recurrenceRule` field: JSON `{ frequency, days?, dayOfMonth?, time? }`
- [ ] User says "exercise every Monday, Wednesday, Friday" → AI creates recurring item with parsed rule
- [ ] Scheduler tick generates next instance when current is completed or past-due
- [ ] One instance at a time — no rolling window generation
- [ ] Missed instances marked as overdue before generating next occurrence
- [ ] User asks "what should I focus on?" → AI recommends next action based on priorities, deadlines, context, and memories
- [ ] Recurring tasks appear in task lists with recurrence indicators

---

## Phase 9: Dashboard, Progress & Summaries

**User stories**: 25, 27, 28, 29, 30, 31

### What to build

A `/dashboard` page with rich visual views: progress bars for goals/projects, calendar view plotting tasks on deadline dates, streak counter. This is the primary visualization surface — chat gives quick text summaries and links to `/dashboard` for the full picture.

Progress percentage computed from child items via recursive `find({ parentId })`. A project with 3/5 tasks done = 60%. Streak tracking uses the existing `streak` and `lastCheckIn` fields on User, now properly incremented on daily check-in or call confirmation.

AI-generated summaries via `buildPrompt('summary')`. `GET /api/dashboard/summary` returns daily/weekly natural language commentary. `GET /api/dashboard/progress` returns structured data (completion rates, overdue counts, area breakdowns).

When user says "show me my week" in chat, the AI gives a quick text summary + "Want the full picture? [Open dashboard](/dashboard)."

### Acceptance criteria

- [ ] `/dashboard` page with task list, calendar/timeline view, goal progress bars, streak counter
- [ ] Progress percentage computed recursively from child items
- [ ] Calendar view shows tasks plotted on deadline dates
- [ ] Streak counter increments on daily check-in or call confirmation
- [ ] User says "show me my week" → AI gives text summary + link to `/dashboard`
- [ ] User says "how's my progress on [goal]" → AI gives detailed breakdown
- [ ] `GET /api/dashboard/summary` returns AI-generated daily and weekly summaries via `buildPrompt('summary')`
- [ ] `GET /api/dashboard/progress` returns structured progress data
- [ ] Weekly summary includes trends ("You completed 30% more tasks this week than last")
- [ ] Summaries maintain the sarcastic personality

---

## Phase 10: Quick Actions from Notifications

**User stories**: 37, 39

### What to build

Push notifications include actionable buttons — "Mark as done", "Snooze 1 hour" — that update task status via a direct API call without opening the app. The service worker handles `notificationaction` events and calls `PATCH /api/tasks/[id]` with the status update.

No offline capture (dropped from plan). The existing `/offline` fallback page is sufficient. Engineering effort focused on notification actions, which are genuinely high-value.

### Acceptance criteria

- [ ] Push notifications include action buttons ("Mark as done", "Snooze 1 hour")
- [ ] Clicking a notification action updates task status via API without opening the app
- [ ] Service worker handles `notificationaction` events and calls `PATCH /api/tasks/[id]`
- [ ] "Snooze" action updates the task's deadline and resets `lastNotifiedAt`
- [ ] Actions work even when the app is not open in any tab
