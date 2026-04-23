import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Idea from "@/lib/models/idea";

export const runtime = "nodejs";

/** GET /api/ideas — list ideas with optional status filter */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const filter: Record<string, unknown> = {};
    if (status && status !== "all") {
      filter.status = status;
    } else if (!status) {
      filter.status = "captured";
    }

    const ideas = await Idea.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ ideas });
  } catch (err) {
    console.error("[GET /api/ideas] Error:", err);
    return NextResponse.json({ error: "Failed to fetch ideas" }, { status: 500 });
  }
}

/** POST /api/ideas — capture an idea */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.content || typeof body.content !== "string") {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    const idea = await Idea.create({
      content: body.content.trim(),
      tags: body.tags || [],
      category: body.category?.trim(),
    });

    return NextResponse.json({ idea: idea.toObject() }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/ideas] Error:", err);
    return NextResponse.json({ error: "Failed to capture idea" }, { status: 500 });
  }
}
