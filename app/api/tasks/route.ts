import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Item from "@/lib/models/item";

export const runtime = "nodejs";

/** GET /api/tasks — list tasks with optional filters */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const filter: Record<string, unknown> = { type: "task" };
    if (status && status !== "all") filter.status = status;
    if (priority) filter.priority = priority;

    const tasks = await Item.find(filter).sort({ deadline: 1, createdAt: -1 }).lean();
    return NextResponse.json({ tasks });
  } catch (err) {
    console.error("[GET /api/tasks] Error:", err);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

/** POST /api/tasks — create a task */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.title || typeof body.title !== "string") {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const task = await Item.create({
      type: "task",
      title: body.title.trim(),
      description: body.description?.trim(),
      priority: body.priority || "medium",
      deadline: body.deadline ? new Date(body.deadline) : undefined,
      estimatedDuration: body.estimatedDuration,
      tags: body.tags || [],
    });

    return NextResponse.json({ task: task.toObject() }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/tasks] Error:", err);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
