import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Memory from "@/lib/models/memory";

export const runtime = "nodejs";

/** GET /api/memories — list active memories */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "active";

    const filter: Record<string, unknown> = {};
    if (status !== "all") {
      filter.status = status;
    }

    const memories = await Memory.find(filter)
      .sort({ lastAccessedAt: -1 })
      .lean();

    return NextResponse.json({ memories });
  } catch (err) {
    console.error("[GET /api/memories] Error:", err);
    return NextResponse.json({ error: "Failed to list memories" }, { status: 500 });
  }
}
