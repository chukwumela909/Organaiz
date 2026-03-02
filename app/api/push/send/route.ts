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
    const { title, body, icon, url } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const payload = JSON.stringify({
      title: title || "Organaiz",
      body: body || "",
      icon: icon || "/icon-192.png",
      url: url || "/",
    });

    const subs = getSubscriptions();

    if (subs.length === 0) {
      return NextResponse.json(
        { error: "No subscriptions found", sent: 0 },
        { status: 200 }
      );
    }

    const results = await Promise.allSettled(
      subs.map((sub) => webpush.sendNotification(sub as unknown as webpush.PushSubscription, payload))
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({ sent, failed });
  } catch {
    return NextResponse.json(
      { error: "Failed to send notifications" },
      { status: 500 }
    );
  }
}
