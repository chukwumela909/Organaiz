import { NextRequest, NextResponse } from "next/server";
import { chat, type ChatMessage } from "@/lib/ai";
import { seedDefaultAreas } from "@/lib/seed";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: ChatMessage[] = body.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages array is required" }, { status: 400 });
    }

    // Validate message shape
    for (const msg of messages) {
      if (!msg.role || !msg.content || !["user", "assistant"].includes(msg.role)) {
        return NextResponse.json({ error: "Invalid message format" }, { status: 400 });
      }
    }

    const { reply, actions } = await chat(messages);

    // Seed default Life Areas on first chat (no-op after first run)
    await seedDefaultAreas();

    return NextResponse.json({ reply, actions });
  } catch (err) {
    console.error("[/api/chat] Error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    if (message.includes("ANTHROPIC_API_KEY")) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
