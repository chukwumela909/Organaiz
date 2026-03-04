import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { getSubscriptions } from "@/lib/subscriptions";

export const runtime = "nodejs";

webpush.setVapidDetails(
  "mailto:admin@organaiz.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { caller } = await request.json();

    const callerName = caller || "Organaiz";

    const payload = JSON.stringify({
      type: "call",
      title: "Incoming Call",
      body: `${callerName} is calling you...`,
      icon: "/icon-192.png",
      caller: callerName,
      url: `/call?caller=${encodeURIComponent(callerName)}`,
      tag: "organaiz-call",
      requireInteraction: true,
    });

    const subs = getSubscriptions();

    if (subs.length === 0) {
      return NextResponse.json(
        { error: "No subscriptions found", sent: 0 },
        { status: 200 }
      );
    }

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          sub as unknown as webpush.PushSubscription,
          payload
        )
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({ sent, failed });
  } catch {
    return NextResponse.json(
      { error: "Failed to send call notification" },
      { status: 500 }
    );
  }
}
