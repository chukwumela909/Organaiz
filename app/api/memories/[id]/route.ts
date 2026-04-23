import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Memory from "@/lib/models/memory";
import mongoose from "mongoose";

export const runtime = "nodejs";

/** GET /api/memories/[id] — get a single memory */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid memory ID" }, { status: 400 });
    }

    const memory = await Memory.findById(id).lean();
    if (!memory) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    }

    return NextResponse.json({ memory });
  } catch (err) {
    console.error("[GET /api/memories/:id] Error:", err);
    return NextResponse.json({ error: "Failed to get memory" }, { status: 500 });
  }
}

/** DELETE /api/memories/[id] — delete a memory permanently */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid memory ID" }, { status: 400 });
    }

    const memory = await Memory.findByIdAndDelete(id);
    if (!memory) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("[DELETE /api/memories/:id] Error:", err);
    return NextResponse.json({ error: "Failed to delete memory" }, { status: 500 });
  }
}
