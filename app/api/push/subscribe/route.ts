import { NextRequest, NextResponse } from "next/server";
import { addSubscription, removeSubscription } from "@/lib/subscriptions";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const sub = await request.json();

    if (!sub || !sub.endpoint) {
      return NextResponse.json(
        { error: "Invalid subscription object" },
        { status: 400 }
      );
    }

    addSubscription(sub);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { endpoint } = await request.json();
    removeSubscription(endpoint);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to unsubscribe" },
      { status: 500 }
    );
  }
}
