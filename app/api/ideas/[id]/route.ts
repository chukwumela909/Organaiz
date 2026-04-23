import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Idea from "@/lib/models/idea";
import mongoose from "mongoose";

export const runtime = "nodejs";

/** PATCH /api/ideas/[id] — update idea status or promote to item */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid idea ID" }, { status: 400 });
    }

    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (body.status !== undefined) updates.status = body.status;
    if (body.promotedToItemId !== undefined) updates.promotedToItemId = body.promotedToItemId;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.category !== undefined) updates.category = body.category;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const idea = await Idea.findByIdAndUpdate(id, updates, { new: true }).lean();
    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    return NextResponse.json({ idea });
  } catch (err) {
    console.error("[PATCH /api/ideas/:id] Error:", err);
    return NextResponse.json({ error: "Failed to update idea" }, { status: 500 });
  }
}
