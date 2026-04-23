import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { CallJob } from "@/lib/models/call-job";

export const runtime = "nodejs";

/**
 * POST /api/calls/webhook
 * Twilio status callback — receives call status updates.
 * Twilio sends form-encoded data.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callSid = formData.get("CallSid") as string;
    const callStatus = formData.get("CallStatus") as string;
    const callDuration = formData.get("CallDuration") as string;
    const answeredBy = formData.get("AnsweredBy") as string; // human, machine, etc.

    console.log(
      `[Twilio Webhook] SID=${callSid} Status=${callStatus} Duration=${callDuration} AnsweredBy=${answeredBy}`
    );

    await connectDB();

    const job = await CallJob.findOne({ twilioCallSid: callSid });
    if (!job) {
      console.warn(`[Twilio Webhook] No job found for SID ${callSid}`);
      return NextResponse.json({ received: true });
    }

    switch (callStatus) {
      case "completed":
        job.status = "completed";
        job.completedAt = new Date();
        if (callDuration) job.callDuration = parseInt(callDuration, 10);
        break;

      case "no-answer":
      case "busy":
      case "canceled":
        job.status = "no-answer";
        // Schedule retry if attempts remain
        if (job.attempts < job.maxAttempts) {
          job.status = "pending";
          job.nextRetryAt = new Date(Date.now() + 5 * 60 * 1000); // retry in 5 min
          job.scheduledAt = job.nextRetryAt;
        }
        break;

      case "failed":
        job.status = "failed";
        break;

      case "ringing":
      case "in-progress":
        job.status = "calling";
        if (callStatus === "in-progress") {
          job.answeredAt = new Date();
        }
        break;
    }

    await job.save();

    // Twilio expects a 200 with empty TwiML or just OK
    return new NextResponse("<Response></Response>", {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err) {
    console.error("[Twilio Webhook] Error:", err);
    return new NextResponse("<Response></Response>", {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }
}
