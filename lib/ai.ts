import Anthropic from "@anthropic-ai/sdk";
import type { Tool, MessageParam, ContentBlock, ToolResultBlockParam } from "@anthropic-ai/sdk/resources/messages";
import { connectDB } from "@/lib/db";
import Item from "@/lib/models/item";
import Idea from "@/lib/models/idea";
import Memory from "@/lib/models/memory";
import { generateEmbedding, cosineSimilarity } from "@/lib/embeddings";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY env var");
  _client = new Anthropic({ apiKey });
  return _client;
}

const PERSONALITY_PREAMBLE = `You are Organaiz — a sarcastic, blunt, no-excuses AI life organizer. You don't sugarcoat anything. You're witty but never mean-spirited. You keep responses concise — no walls of text. You curse occasionally for emphasis (nothing extreme). You genuinely care about the user's progress, but you express it through tough love.

Your personality is inspired by these example call messages you send:
- "Rise and shine. Your goals are already awake. Are you?"
- "Quick reality check. Are you making progress, or just premium procrastination?"
- "The day doesn't care about your feelings. Neither do I. Log your results before midnight."
- "You're ignoring your notifications. Bold move. Your streak is about to pay the price."

Be helpful, be direct, be memorable. Never be boring or generic.`;

const CONTEXT_SUFFIXES: Record<string, string> = {
  chat: `You're in a direct message conversation with the user. Help them organize their life — tasks, goals, ideas, schedules, whatever they throw at you. Keep responses conversational and concise. Use short paragraphs. If they're being lazy, call them out. If they're making progress, acknowledge it briefly (no cheerleading).

You have tools to manage tasks, items (goals, projects, subtasks), ideas, and memories. Use them when appropriate — always use the tools, don't just describe what you'd do.

For tasks: extract priority and deadline from context when mentioned. Auto-generate 1-3 relevant tags.
For ideas: capture immediately with capture_idea, then optionally ask follow-up questions. Don't interrogate before capturing.
For hierarchy: use create_item to create goals, projects, or subtasks under a parent. When the user wants to break something down, create the hierarchy.
For memories: when the user shares a fact, preference, or goal worth remembering across sessions, use store_memory. Be selective — don't store trivial conversation. When they say "forget this" or similar, use forget_memory.

When listing tasks, present them conversationally — mention overdue items or upcoming deadlines, and be snarky about incomplete ones.`,

  notification: `You're composing a push notification message. Keep it SHORT — under 100 characters ideally. Be punchy, sarcastic, and actionable. Make them want to open the app.`,

  call: `You're writing a script for a phone call via text-to-speech. Keep it natural and conversational — something that sounds good spoken aloud. 2-3 sentences max. Reference specific tasks or deadlines if context is available.`,

  summary: `You're generating a daily/weekly summary. Be structured but not boring. Highlight wins, call out missed items, and suggest priorities. Use bullet points sparingly.`,
};

export function buildPrompt(context: "chat" | "notification" | "call" | "summary", memories?: string[]): string {
  let prompt = `${PERSONALITY_PREAMBLE}\n\n${CONTEXT_SUFFIXES[context]}`;
  if (memories && memories.length > 0) {
    prompt += `\n\nThings you know about the user:\n${memories.map((m) => `- ${m}`).join("\n")}`;
  }
  return prompt;
}

// --- Anthropic Tool Definitions ---

const CHAT_TOOLS: Tool[] = [
  {
    name: "create_task",
    description: "Create a new task for the user. Use when they ask to add, create, or remind them about something.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Short task title" },
        description: { type: "string", description: "Optional longer description" },
        priority: { type: "string", enum: ["urgent", "high", "medium", "low"], description: "Task priority. Infer from context — 'ASAP' or 'urgent' = urgent, 'important' = high, default = medium" },
        deadline: { type: "string", description: "ISO 8601 date string for the deadline, if mentioned. E.g. '2025-03-27T00:00:00.000Z'" },
        estimatedDuration: { type: "number", description: "Estimated time in minutes, if mentioned" },
        tags: { type: "array", items: { type: "string" }, description: "1-3 relevant tags. Always auto-generate these based on the task content." },
      },
      required: ["title", "tags"],
    },
  },
  {
    name: "list_tasks",
    description: "List the user's tasks. Use when they ask to see, show, or check their tasks/to-dos.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: { type: "string", enum: ["not-started", "in-progress", "done", "all"], description: "Filter by status. Default: show non-done tasks." },
      },
      required: [],
    },
  },
  {
    name: "update_task",
    description: "Update an existing task. Use when the user wants to mark something done, change priority, update deadline, etc.",
    input_schema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "The MongoDB _id of the task to update" },
        title: { type: "string", description: "New title, if changing" },
        description: { type: "string", description: "New description, if changing" },
        status: { type: "string", enum: ["not-started", "in-progress", "done"], description: "New status" },
        priority: { type: "string", enum: ["urgent", "high", "medium", "low"], description: "New priority" },
        deadline: { type: "string", description: "New deadline as ISO 8601, or null to remove" },
        tags: { type: "array", items: { type: "string" }, description: "New tags array" },
      },
      required: ["taskId"],
    },
  },
  {
    name: "create_item",
    description: "Create a hierarchical item (goal, project, or subtask) under an optional parent. Use for goals, projects, and subtasks — NOT for standalone tasks (use create_task for those).",
    input_schema: {
      type: "object" as const,
      properties: {
        type: { type: "string", enum: ["area", "goal", "project", "subtask"], description: "Item type in the hierarchy" },
        title: { type: "string", description: "Short item title" },
        description: { type: "string", description: "Optional longer description" },
        parentId: { type: "string", description: "MongoDB _id of the parent item. Goals go under areas, projects under goals, subtasks under tasks." },
        priority: { type: "string", enum: ["urgent", "high", "medium", "low"], description: "Priority level" },
        deadline: { type: "string", description: "ISO 8601 deadline if applicable" },
        tags: { type: "array", items: { type: "string" }, description: "1-3 relevant tags" },
      },
      required: ["type", "title"],
    },
  },
  {
    name: "capture_idea",
    description: "Capture an idea immediately. Use when the user shares a thought, concept, or idea. Store it first, ask follow-up questions second.",
    input_schema: {
      type: "object" as const,
      properties: {
        content: { type: "string", description: "The idea content — capture the user's thought as-is" },
        tags: { type: "array", items: { type: "string" }, description: "1-3 relevant tags" },
        category: { type: "string", description: "Category like 'business', 'personal', 'creative', 'health', 'learning'" },
      },
      required: ["content", "tags"],
    },
  },
  {
    name: "list_ideas",
    description: "List captured ideas. Use when the user asks to see their ideas or brainstorms.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: { type: "string", enum: ["captured", "promoted", "archived", "all"], description: "Filter by status. Default: captured only." },
      },
      required: [],
    },
  },
  {
    name: "store_memory",
    description: "Store a fact, preference, or goal about the user for long-term memory. Use when the user shares something worth remembering across sessions — their name, job, habits, preferences, important dates, goals. Be selective: don't store trivial conversation.",
    input_schema: {
      type: "object" as const,
      properties: {
        content: { type: "string", description: "The memory content — a concise, self-contained statement. E.g. 'User works as a software engineer at Google' or 'User prefers morning workouts'" },
        type: { type: "string", enum: ["fact", "preference", "goal", "context", "relationship"], description: "Memory type. fact = biographical info, preference = likes/dislikes, goal = aspirations, context = situational info, relationship = people in their life" },
      },
      required: ["content", "type"],
    },
  },
  {
    name: "forget_memory",
    description: "Deprecate a memory. Use when the user says 'forget this', 'that's no longer true', or wants to remove something you remembered.",
    input_schema: {
      type: "object" as const,
      properties: {
        memoryId: { type: "string", description: "The MongoDB _id of the memory to deprecate" },
      },
      required: ["memoryId"],
    },
  },
];

// --- Tool Execution ---

export interface ChatAction {
  type: "task_created" | "task_updated" | "tasks_listed" | "item_created" | "idea_captured" | "ideas_listed" | "memory_stored" | "memory_forgotten";
  task?: Record<string, unknown>;
  tasks?: Record<string, unknown>[];
  item?: Record<string, unknown>;
  idea?: Record<string, unknown>;
  ideas?: Record<string, unknown>[];
  memory?: Record<string, unknown>;
}

async function executeTool(name: string, input: Record<string, unknown>): Promise<{ result: string; action?: ChatAction }> {
  await connectDB();

  switch (name) {
    case "create_task": {
      const task = await Item.create({
        type: "task",
        title: input.title as string,
        description: input.description as string | undefined,
        priority: (input.priority as string) || "medium",
        deadline: input.deadline ? new Date(input.deadline as string) : undefined,
        estimatedDuration: input.estimatedDuration as number | undefined,
        tags: (input.tags as string[]) || [],
      });
      const plain = JSON.parse(JSON.stringify(task.toObject()));
      return {
        result: `Task created: "${plain.title}" (ID: ${plain._id}, priority: ${plain.priority}, deadline: ${plain.deadline ? plain.deadline.split("T")[0] : "none"})`,
        action: { type: "task_created", task: plain },
      };
    }

    case "list_tasks": {
      const filter: Record<string, unknown> = { type: "task" };
      if (input.status && input.status !== "all") {
        filter.status = input.status;
      } else if (!input.status) {
        filter.status = { $ne: "done" };
      }
      const tasks = await Item.find(filter).sort({ deadline: 1, priority: 1, createdAt: -1 }).lean();
      return {
        result: tasks.length === 0
          ? "No tasks found."
          : tasks.map((t) => `- [${t.status}] "${t.title}" (ID: ${t._id}, priority: ${t.priority}, deadline: ${t.deadline ? new Date(t.deadline).toISOString().split("T")[0] : "none"}, tags: ${(t.tags as string[]).join(", ")})`).join("\n"),
        action: { type: "tasks_listed", tasks: tasks as unknown as Record<string, unknown>[] },
      };
    }

    case "update_task": {
      const updates: Record<string, unknown> = {};
      if (input.title) updates.title = input.title as string;
      if (input.description !== undefined) updates.description = input.description as string;
      if (input.status) updates.status = input.status as string;
      if (input.priority) updates.priority = input.priority as string;
      if (input.deadline !== undefined) updates.deadline = input.deadline ? new Date(input.deadline as string) : null;
      if (input.tags) updates.tags = input.tags as string[];

      const task = await Item.findByIdAndUpdate(input.taskId as string, updates, { new: true }).lean();
      if (!task) return { result: `Task not found with ID: ${input.taskId}` };
      return {
        result: `Task updated: "${task.title}" is now ${task.status} (priority: ${task.priority})`,
        action: { type: "task_updated", task: task as unknown as Record<string, unknown> },
      };
    }

    case "create_item": {
      const item = await Item.create({
        type: input.type as string,
        title: input.title as string,
        description: input.description as string | undefined,
        parentId: input.parentId as string | undefined,
        priority: (input.priority as string) || "medium",
        deadline: input.deadline ? new Date(input.deadline as string) : undefined,
        tags: (input.tags as string[]) || [],
      });
      const plain = JSON.parse(JSON.stringify(item.toObject()));
      return {
        result: `${plain.type} created: "${plain.title}" (ID: ${plain._id}${plain.parentId ? `, under parent: ${plain.parentId}` : ""})`,
        action: { type: "item_created", item: plain },
      };
    }

    case "capture_idea": {
      const ideaContent = input.content as string;
      const idea = await Idea.create({
        content: ideaContent,
        tags: (input.tags as string[]) || [],
        category: input.category as string | undefined,
      });

      // Generate embedding in background (don't block response)
      generateEmbedding(ideaContent)
        .then((embedding) => Idea.findByIdAndUpdate(idea._id, { embedding }))
        .catch((err) => console.error("[capture_idea] Embedding failed:", err));

      const plain = JSON.parse(JSON.stringify(idea.toObject()));
      return {
        result: `Idea captured (ID: ${plain._id}): "${plain.content.substring(0, 80)}${plain.content.length > 80 ? "..." : ""}"`,
        action: { type: "idea_captured", idea: plain },
      };
    }

    case "list_ideas": {
      const filter: Record<string, unknown> = {};
      if (input.status && input.status !== "all") {
        filter.status = input.status;
      } else if (!input.status) {
        filter.status = "captured";
      }
      const ideas = await Idea.find(filter).sort({ createdAt: -1 }).lean();
      return {
        result: ideas.length === 0
          ? "No ideas found."
          : ideas.map((i) => `- [${i.status}] "${i.content.substring(0, 100)}" (ID: ${i._id}, tags: ${(i.tags as string[]).join(", ")})`).join("\n"),
        action: { type: "ideas_listed", ideas: ideas as unknown as Record<string, unknown>[] },
      };
    }

    case "store_memory": {
      const memContent = input.content as string;
      const memType = (input.type as string) || "fact";

      let embedding: number[] | undefined;
      try {
        embedding = await generateEmbedding(memContent);
      } catch (err) {
        console.error("[store_memory] Embedding failed:", err);
      }

      const memory = await Memory.create({
        content: memContent,
        type: memType,
        embedding,
      });
      const plain = JSON.parse(JSON.stringify(memory.toObject()));
      delete plain.embedding;
      return {
        result: `Memory stored (ID: ${plain._id}): "${memContent.substring(0, 80)}${memContent.length > 80 ? "..." : ""}" [${memType}]`,
        action: { type: "memory_stored", memory: plain },
      };
    }

    case "forget_memory": {
      const memoryId = input.memoryId as string;
      const memory = await Memory.findByIdAndUpdate(memoryId, { status: "deprecated" }, { new: true }).lean();
      if (!memory) return { result: `Memory not found with ID: ${memoryId}` };
      return {
        result: `Memory deprecated: "${memory.content.substring(0, 80)}"`,
        action: { type: "memory_forgotten", memory: memory as unknown as Record<string, unknown> },
      };
    }

    default:
      return { result: `Unknown tool: ${name}` };
  }
}

// --- Chat Function ---

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResult {
  reply: string;
  actions: ChatAction[];
}

const MAX_MESSAGES = 30;

const MEMORY_SIMILARITY_THRESHOLD = 0.7;
const MEMORY_TOP_K = 10;

async function retrieveRelevantMemories(query: string): Promise<string[]> {
  try {
    await connectDB();

    // Try to embed the query for vector search
    let queryEmbedding: number[] | undefined;
    try {
      queryEmbedding = await generateEmbedding(query);
    } catch (err) {
      console.error("[memory retrieval] Embedding failed, falling back to all active memories:", err);
    }

    const activeMemories = await Memory.find({ status: "active" })
      .select("+embedding")
      .lean();

    if (activeMemories.length === 0) return [];

    if (queryEmbedding) {
      // Compute similarity and rank
      const scored = activeMemories
        .filter((m) => m.embedding && m.embedding.length > 0)
        .map((m) => ({
          content: m.content,
          id: m._id,
          similarity: cosineSimilarity(queryEmbedding, m.embedding!),
        }))
        .filter((m) => m.similarity >= MEMORY_SIMILARITY_THRESHOLD)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, MEMORY_TOP_K);

      // Update lastAccessedAt for retrieved memories
      if (scored.length > 0) {
        const ids = scored.map((m) => m.id);
        Memory.updateMany({ _id: { $in: ids } }, { lastAccessedAt: new Date() }).catch(() => {});
      }

      return scored.map((m) => m.content);
    }

    // Fallback: return most recent memories if no embedding available
    return activeMemories
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, MEMORY_TOP_K)
      .map((m) => m.content);
  } catch (err) {
    console.error("[memory retrieval] Error:", err);
    return [];
  }
}

export async function chat(messages: ChatMessage[]): Promise<ChatResult> {
  const client = getClient();
  const truncated = messages.slice(-MAX_MESSAGES);
  const actions: ChatAction[] = [];

  // Retrieve relevant memories based on the user's latest message
  const lastUserMessage = [...truncated].reverse().find((m) => m.role === "user");
  const memories = lastUserMessage
    ? await retrieveRelevantMemories(lastUserMessage.content)
    : [];

  const systemPrompt = buildPrompt("chat", memories.length > 0 ? memories : undefined);

  // Build the conversation for Anthropic
  let anthropicMessages: MessageParam[] = truncated.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // Tool use loop — Claude may call tools, we execute and feed results back
  let response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    tools: CHAT_TOOLS,
    messages: anthropicMessages,
  });

  while (response.stop_reason === "tool_use") {
    const toolBlocks = response.content.filter((b): b is Extract<ContentBlock, { type: "tool_use" }> => b.type === "tool_use");

    // Build tool results
    const toolResults: ToolResultBlockParam[] = [];
    for (const block of toolBlocks) {
      const { result, action } = await executeTool(block.name, block.input as Record<string, unknown>);
      if (action) actions.push(action);
      toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
    }

    // Append assistant response + tool results, then re-query
    anthropicMessages = [
      ...anthropicMessages,
      { role: "assistant", content: response.content },
      { role: "user", content: toolResults },
    ];

    response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      tools: CHAT_TOOLS,
      messages: anthropicMessages,
    });
  }

  const textBlock = response.content.find((b): b is Extract<ContentBlock, { type: "text" }> => b.type === "text");
  return {
    reply: textBlock?.text ?? "I got nothing. Try again.",
    actions,
  };
}
