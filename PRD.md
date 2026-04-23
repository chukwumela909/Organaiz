# PRD: Organaiz — AI-Powered Life Organizer

## Problem Statement

People struggle to stay organized across the many dimensions of their lives — daily tasks, long-term goals, random ideas, recurring responsibilities, and half-formed plans that never get acted on. Existing productivity tools are passive: they store what you put in and remind you when you tell them to, but they don't think, connect dots, or push you forward.

The current Organaiz app already solves one piece of this — automated accountability calls that wake you up and keep you honest — but it has no intelligence. It doesn't know what you're working on, what's overdue, what ideas you've been sitting on, or how your goals connect. The calls are generic motivational messages rather than specific, context-aware nudges.

What's needed is a **super-intelligent AI personal assistant** that lives inside Organaiz. One that knows your goals, tracks your tasks, captures your random ideas, finds connections between them, proactively reminds you about what matters, and communicates with you like a blunt, sarcastic friend who won't let you slack off — through voice, text, and phone calls.

## Solution

Transform Organaiz from a reminder-only accountability app into a **full AI life management platform**. The AI assistant becomes the centerpiece — a single, continuous DM-style interface where the user primarily interacts through voice (with text as a fallback). The AI:

1. **Captures everything** — tasks, goals, ideas, random thoughts — from voice or text, and stores them in a structured hierarchy (Life Areas → Goals → Projects → Tasks → Subtasks).

2. **Connects the dots** — uses intelligent memory with MongoDB Atlas Vector Search to find relationships between ideas, surface relevant context, and remind the user about dormant thoughts when they become relevant.

3. **Manages timelines** — tracks deadlines, priorities, progress percentages, and statuses. Suggests optimal scheduling based on what's urgent, what's important, and what the user has capacity for.

4. **Proactively reaches out** — via Twilio voice calls, push notifications, and in-app nudges. The calls are now AI-aware: instead of generic messages, the AI crafts specific messages based on the user's actual tasks, deadlines, and context for that day. After a call, a push notification links to the voice page for a full follow-up conversation.

5. **Maintains personality** — the same sarcastic, blunt, no-excuses personality from the current call system, extended to all AI interactions.

6. **Remembers intelligently** — doesn't store every word ever said. Instead, evaluates each interaction and selectively stores important facts, preferences, goals, ideas, and context. Can deprecate memories over time when they're no longer relevant.

The app remains a PWA optimized for iPhone usage. Home page is a voice-first DM interface with iMessage-style bubbles. No authentication for now (single user).

## User Stories

1. As a user, I want to talk to the AI by pressing a mic button on the home page, so that I can capture thoughts and tasks hands-free.
2. As a user, I want to type quick messages to the AI when I can't speak, so that I have a fallback input method.
3. As a user, I want the conversation to feel like a continuous DM with a friend, so that I don't have to manage threads or sessions.
4. As a user, I want the AI to respond with text bubbles in an iMessage-style layout, so that the interface feels native and familiar on my iPhone.
5. As a user, I want the AI to speak its responses aloud when I'm in voice mode, so that I can interact without looking at the screen.
6. As a user, I want to say "remind me to buy groceries tomorrow" and have the AI automatically create a task with a deadline, so that I don't have to manually enter task details.
7. As a user, I want to say "I have this idea about starting a podcast" and have the AI capture it immediately, so that no thought gets lost.
8. As a user, I want the AI to ask follow-up questions about my ideas when appropriate, but always store the idea first, so that capture is never blocked by interrogation.
9. As a user, I want to set long-term goals like "get promoted by December" and have the AI help me break them into projects, tasks, and subtasks, so that big ambitions become actionable steps.
10. As a user, I want the AI to understand that tasks can be related — e.g., "learn Python" is connected to "career switch to tech" — so that it can surface relevant connections.
11. As a user, I want an AI-generated task hierarchy where my life is organized into areas (Career, Health, Finance, Personal, Learning), goals, projects, tasks, and subtasks, so that everything has a place.
12. As a user, I want tasks to have deadlines, priorities, estimated time, tags, and status, so that the AI can make smart decisions about what to focus on.
13. As a user, I want recurring tasks (e.g., "exercise every Monday/Wednesday/Friday") to be automatically generated at the right times, so that I don't have to recreate them.
14. As a user, I want the AI to wake me up with a Twilio call that mentions my specific tasks for the day, so that I start the morning with a clear plan.
15. As a user, I want the morning call to ask "what are your goals for today?" and capture my spoken response as tasks, so that I can plan my day without opening the app.
16. As a user, I want a push notification after the Twilio call that links to the voice page, so that I can continue the conversation and add more detail.
17. As a user, I want the AI to track my daily goals throughout the entire day and nudge me if I'm falling behind, so that things actually get done.
18. As a user, I want proactive push notifications when a deadline is approaching, so that I'm never surprised by something overdue.
19. As a user, I want the AI to nudge me when I haven't checked in for a while, so that I stay engaged and accountable.
20. As a user, I want the AI to notify me when a related task is completed and another is now unblocked, so that I maintain momentum.
21. As a user, I want the AI to periodically surface dormant ideas that haven't been acted on, so that good thoughts don't die in a backlog.
22. As a user, I want no daily limit on AI nudges — it should do what's necessary, so that nothing important falls through the cracks.
23. As a user, I want the Twilio calls to mention specific tasks by name (e.g., "You have 3 things due today: finish the report, call the dentist, and review that PR"), so that the calls are actionable rather than generic.
24. As a user, I want the AI to maintain its sarcastic, blunt personality across all interactions (chat, voice, calls, notifications), so that the experience feels consistent and motivating.
25. As a user, I want to see my progress as percentage completion on goals and projects, so that I can see how far I've come.
26. As a user, I want status labels (not started / in progress / done) on all tasks, so that I can quickly scan what needs attention.
27. As a user, I want a visual timeline or calendar view of my tasks and deadlines, so that I can see my schedule at a glance.
28. As a user, I want streak tracking to carry over from the current system, so that my accountability record is preserved.
29. As a user, I want AI-generated daily summaries ("Today you completed 5 tasks, focused on Career, have 2 overdue items"), so that I can reflect on my productivity.
30. As a user, I want AI-generated weekly summaries with trends and insights, so that I can see patterns in my behavior over time.
31. As a user, I want to ask the AI "show me my week" or "how's my progress on [goal]" and get a visual dashboard, so that I can pull up views on demand.
32. As a user, I want the AI to suggest what I should work on next based on priorities, deadlines, and context, so that I never waste time deciding.
33. As a user, I want the AI to remember my preferences (e.g., "I prefer to exercise in the morning", "I work best after lunch"), so that its suggestions are personalized.
34. As a user, I want to be able to tell the AI "forget this" or "this doesn't matter anymore" to remove irrelevant memories, so that the AI stays focused on what matters.
35. As a user, I want the AI memory to be intelligent — storing important facts and deprecating irrelevant ones over time — so that it doesn't become cluttered with noise.
36. As a user, I want voice interactions on the voice page to work in both push-to-talk and continuous conversation mode, so that I can choose what suits the moment.
37. As a user, I want quick-action buttons on notifications (e.g., "I completed [task X]"), so that I can update task status without opening the app.
38. As a user, I want push notifications to be AI-driven and mention specific tasks/deadlines, so that every notification is relevant and useful.
39. As a user, I want the app to work offline with basic functionality, so that I can still capture thoughts when I have no connection (synced when back online).
40. As a user, I want the existing call schedule (6 AM, 12 PM, 9 PM) to be enhanced with AI context, so that each call is different and specific to my day.
41. As a user, I want the midday call to be a progress check ("You planned 5 tasks this morning. You've done 2. What happened to the other 3?"), so that I stay accountable through the day.
42. As a user, I want the evening call to ask me to log results and reflect ("Did you actually do the thing, or just think about doing the thing?"), so that I close the day with honest tracking.
43. As a user, I want to set reminders for specific events during a phone call ("remind me about the meeting at 3 PM"), so that voice interaction is fully functional.

## Implementation Decisions

### Module Architecture (9 Modules)

**1. AI Conversation Engine**
- Central brain of the application. Receives user input (text or transcribed voice), retrieves relevant context from the Memory System and Task Engine, constructs enriched prompts, sends to OpenAI or Claude, and parses the response.
- Intent extraction pipeline: each AI response is analyzed for actionable intents — create task, log idea, set reminder, update status, answer question, suggest schedule. These intents are dispatched to the appropriate module.
- Personality system prompt maintains the sarcastic, blunt, no-excuses character across all interactions.
- Dual-provider support: OpenAI and Claude as selectable backends. The conversation engine abstracts the provider behind a unified interface.

**2. Intelligent Memory System**
- Powered by MongoDB Atlas Vector Search. Each "memory" is a document with: content (text), type (fact, preference, goal, idea, context), embedding (vector), relevance score, creation date, last accessed date, and active/deprecated status.
- After each conversation turn, the AI evaluates what was said and produces zero or more memory extractions. These are embedded (via OpenAI's embedding API) and stored.
- Before each AI response, the system retrieves the top-K most relevant memories via vector similarity search and injects them into the system prompt as context.
- Memory decay: memories that haven't been accessed or reinforced in a configurable period are automatically marked as deprecated and excluded from retrieval. User can also explicitly say "forget this."
- Chat messages themselves are ephemeral — displayed in the UI for the current session but not persisted. Only extracted memories/facts survive.

**3. Task & Goal Hierarchy Engine**
- Data model: five-level hierarchy — Life Area → Goal → Project → Task → Subtask. Each node stores: title, description, status (not-started / in-progress / done), priority (urgent / high / medium / low), deadline, estimated duration, tags (AI-generated), recurrence rule, parent reference, related items (many-to-many), progress percentage (computed from children), creation date, completion date.
- Relationships between items are stored as typed links: "blocks", "related-to", "part-of", "inspired-by". The AI creates these from natural language ("this is related to my career goal").
- Recurring task engine: stores a recurrence rule (e.g., "every Monday, Wednesday, Friday") and generates concrete task instances. A background job creates upcoming instances and marks missed ones.
- AI can create, update, complete, and reschedule items from natural language. The Task Engine exposes a structured API that the AI Conversation Engine calls.

**4. Idea Capture & Connection System**
- Quick-capture pipeline: user says or types an idea → stored immediately as an Idea document with raw text, AI-generated tags, category, embedding, and creation date.
- Connection discovery: on capture, the system runs a vector similarity search against existing tasks, goals, and other ideas. If strong matches are found, relationships are created automatically.
- Idea lifecycle: captured → categorized → connected → optionally promoted to a task or goal when the user decides.
- Periodic surfacing: the Proactive Engine queries for ideas older than N days that haven't been acted on and triggers a nudge.

**5. Proactive Intelligence Engine**
- Replaces and extends the current generic cron scheduler. Runs on the same 60-second tick cycle.
- Trigger evaluation pipeline checks, per tick, for: approaching deadlines (configurable thresholds), inactivity (no check-in for X hours), completed tasks that unblock others, dormant ideas past threshold, scheduled check-in times (morning/midday/evening), recurring task generation, weekly summary generation day.
- For each triggered event, the engine determines the delivery channel: Twilio call, push notification, or in-app nudge. It sends event context to the AI Conversation Engine to generate the specific message content.
- No daily limit — the engine acts on every relevant trigger but uses a cooldown per item to avoid spamming the same reminder.

**6. Voice Interface Module**
- In-browser speech-to-text using the Web Speech API (`SpeechRecognition`). Works in both push-to-talk (hold mic button) and continuous conversation mode (toggle).
- Text-to-speech for AI responses using the Web Speech API (`SpeechSynthesis`) or a higher-quality TTS API (OpenAI TTS).
- Voice input is transcribed and sent to the AI Conversation Engine identically to text input.
- A dedicated `/voice` page with a large mic button, waveform visualizer, and real-time transcript display.
- The home page integrates a compact voice widget alongside the text input.

**7. Enhanced Twilio Integration**
- Builds on the existing call system (6 AM / 12 PM / 9 PM schedule).
- Before making each call, the Proactive Engine queries the Task Engine for today's context: due tasks, overdue items, completed items, goal progress. This context is sent to the AI Conversation Engine to generate a personalized TTS call script.
- Morning call: announces today's tasks, asks about daily goals.
- Midday call: progress check, highlights what's done vs. remaining.
- Evening call: asks for day reflection, prompts logging of results.
- After the user accepts a call (presses a key), a push notification is sent linking to the `/voice` page with a pre-loaded context prompt ("Let's continue from your morning check-in...").
- Existing retry logic (max 3 attempts, 5-minute retry) and voicemail detection are preserved.
- TTS messages are still XML-escaped for TwiML safety.

**8. Chat UI (DM Interface)**
- Home page redesigned as a continuous DM conversation in iMessage-style bubbles. User messages on the right (dark bubbles), AI messages on the left (lighter bubbles).
- Input area at the bottom: text input field with a mic button. Mic button activates voice mode with a push-to-talk or continuous toggle.
- Messages are ephemeral — rendered from an in-memory array for the current session. When the user reopens the app, the conversation starts fresh. Important information has already been extracted to memory/tasks by the AI.
- Quick-action buttons: notifications can include actionable buttons (e.g., "Mark as done") that update task status via a single API call without opening the chat.
- The existing animated bot graphic is repurposed as the AI's avatar in the chat.

**9. Dashboard & Progress Views**
- Accessible via chat commands ("show my week", "how am I doing") or a navigation element.
- Views include: task list (filterable by status, priority, area), calendar/timeline (tasks plotted on dates), goal progress (percentage bars), streak counter, daily summary, weekly summary.
- All views are rendered as in-app components. The AI can reference and link to them from chat responses.
- Summaries are AI-generated: the AI Conversation Engine receives a data payload (tasks completed, overdue, goal progress) and generates a natural language summary with personality.

### Technical Decisions

- **AI Providers**: OpenAI (GPT-4o for conversation, `text-embedding-3-small` for embeddings) and/or Anthropic Claude, abstracted behind a provider interface. Start with OpenAI.
- **Memory Storage**: MongoDB Atlas Vector Search — embeddings stored in a `memories` collection alongside metadata. No separate vector database (no Pinecone).
- **Chat Ephemerality**: Chat messages are not persisted to the database. They live in React state. Only AI-extracted memories and created tasks/ideas persist.
- **Voice**: Web Speech API for STT and TTS in the browser. Fallback to OpenAI Whisper API for STT and OpenAI TTS API for higher-quality speech synthesis if Web Speech API is insufficient on iOS Safari.
- **Auth**: None for now. Single-user model. The app treats whoever opens it as the owner.
- **Twilio Flow (Option C)**: Twilio calls remain one-way TTS + key press. After call acceptance, a push notification directs the user to the voice page for a full AI conversation. No real-time two-way phone conversations.
- **Existing Data**: Current User and CallJob models are extended, not replaced. Existing fields (phone, timezone, callPrefs, streak) are preserved.
- **New Environment Variables**: `OPENAI_API_KEY` (or `ANTHROPIC_API_KEY`). No new external services beyond the AI provider.

### Schema Evolution

- **User model**: Add `lifeAreas` (default set), `preferences` (AI-learned), `memorySettings` (decay period, max memories).
- **New: Item model** (unified for goals, projects, tasks, subtasks): `type`, `title`, `description`, `status`, `priority`, `deadline`, `estimatedDuration`, `tags`, `parentId`, `relatedItems`, `recurrenceRule`, `progress`, `areaId`, `completedAt`.
- **New: Idea model**: `content`, `tags`, `category`, `embedding`, `status` (captured/promoted/archived), `relatedItems`, `promotedToItemId`.
- **New: Memory model**: `content`, `type` (fact/preference/goal/idea/context), `embedding`, `relevanceScore`, `status` (active/deprecated), `lastAccessedAt`.
- **CallJob model**: Add `aiGeneratedMessage` (boolean), `contextSnapshot` (JSON of tasks/goals used to generate the message).

### API Contracts

- `POST /api/chat` — Send message to AI, receive response + any side effects (created tasks, ideas, memories). Body: `{ message: string, isVoice: boolean }`. Response: `{ reply: string, actions: Action[] }`.
- `POST /api/voice/transcribe` — (Fallback) send audio blob, get transcription. Body: `FormData` with audio file. Response: `{ text: string }`.
- `GET /api/tasks` — List tasks with filters. Query: `status`, `priority`, `parentId`, `areaId`, `due`. Response: `{ items: Item[] }`.
- `POST /api/tasks` — Create task. Body: `{ title, description, priority, deadline, parentId, ... }`.
- `PATCH /api/tasks/:id` — Update task fields.
- `POST /api/ideas` — Capture idea. Body: `{ content: string }`. Response: `{ idea: Idea, connections: Item[] }`.
- `GET /api/ideas` — List ideas with filters.
- `GET /api/memories` — List active memories (debug/admin).
- `DELETE /api/memories/:id` — Forget a specific memory.
- `GET /api/dashboard/summary` — AI-generated daily/weekly summary.
- `GET /api/dashboard/progress` — Progress data for goals/projects.

## Testing Decisions

Tests are **out of scope** for this PRD. All modules will be built without test coverage initially. Testing infrastructure can be added in a subsequent phase.

When tests are eventually written, good tests for this system should:
- Test external behavior through module interfaces, not internal implementation
- For the AI Conversation Engine: verify that given specific context + user input, the correct intents are extracted and dispatched (mock the AI provider response)
- For the Task Engine: verify CRUD operations, hierarchy enforcement, relationship linking, and recurrence generation through the API
- For the Proactive Engine: verify that given a specific state (due tasks, inactivity period, completed blockers), the correct triggers fire and the correct delivery channel is selected
- For the Memory System: verify store, retrieve (vector similarity ranking), and deprecation lifecycle through the module interface

## Out of Scope

1. **Authentication & multi-user support** — Single-user only for now. Auth will be added later.
2. **Real-time two-way voice on Twilio calls** — Calls remain one-way TTS. Full conversations happen in-browser after the call.
3. **Native mobile apps** — PWA only, optimized for iPhone Safari.
4. **Third-party integrations** — No Google Calendar, Notion, Slack, or other service integrations.
5. **Collaboration features** — No shared tasks, delegation, or team features.
6. **Twilio webhook signature verification** — Known security gap, will be addressed separately.
7. **Test coverage** — No tests in this phase.
8. **Offline AI interaction** — AI features require internet. Offline mode limited to viewing cached data.
9. **Payment/billing** — No monetization features.
10. **Data export/import** — No bulk data management.

## Further Notes

### Migration Strategy
The existing Organaiz app has working features (phone registration, call scheduling, push notifications, PWA) that must be preserved. The implementation should:
- Extend existing models, not replace them
- Keep the current Twilio call flow working while adding AI-generated messages
- Maintain the current push notification system while making it AI-aware
- Replace the home page UI (robot + phone setup) with the new chat interface, moving phone setup to a settings page

### AI Cost Considerations
Each user interaction involves:
- One LLM call for response generation (GPT-4o: ~$2.50/1M input tokens, ~$10/1M output tokens)
- One embedding call for memory storage (~$0.02/1M tokens via text-embedding-3-small)
- One vector search for memory retrieval (included in MongoDB Atlas)
- Proactive messages generate additional LLM calls

For a single user with moderate usage (50-100 interactions/day), estimated daily AI cost is $0.50-$2.00.

### Implementation Priority Suggestion
1. **Phase 1**: AI Conversation Engine + Chat UI (get the AI talking)
2. **Phase 2**: Task & Goal Hierarchy Engine + Idea Capture (structured data)
3. **Phase 3**: Intelligent Memory System (persistent context)
4. **Phase 4**: Voice Interface Module (voice interaction)
5. **Phase 5**: Proactive Intelligence Engine + Enhanced Twilio (smart nudges)
6. **Phase 6**: Dashboard & Progress Views (visualization)

### PWA Considerations for iOS
- Web Speech API has limited support on iOS Safari — plan for OpenAI Whisper fallback for speech-to-text
- Push notifications require iOS 16.4+ Safari with the PWA added to home screen
- Service worker and background sync have limitations on iOS — proactive features rely on server-side push, not client-side scheduling