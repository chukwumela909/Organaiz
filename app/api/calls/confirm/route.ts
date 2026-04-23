import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { CallJob } from "@/lib/models/call-job";

export const runtime = "nodejs";

/**
 * POST /api/calls/confirm
 * Twilio <Gather> action — user pressed a key to confirm they got the call.
 * Twilio sends form-encoded data.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callSid = formData.get("CallSid") as string;
    const digits = formData.get("Digits") as string;

    console.log(`[Twilio Confirm] SID=${callSid} Digits=${digits}`);

    await connectDB();

    const job = await CallJob.findOne({ twilioCallSid: callSid });
    if (job) {
      job.status = "completed";
      job.completedAt = new Date();
      await job.save();
    }

    // Respond with a witty confirmation
    const responses = [
      "Good. You're alive. Now go be productive.",
      "Acknowledged. Your streak lives another day.",
      "Look at you, answering your phone like a responsible human. Impressive.",
      "Confirmed. Now close this call and open Organaiz. Chop chop.",
    ];
    const msg = responses[Math.floor(Math.random() * responses.length)];

    return new NextResponse(
      `<Response><Say voice="Polly.Matthew" language="en-US">${msg}</Say></Response>`,
      { headers: { "Content-Type": "text/xml" } }
    );
  } catch (err) {
    console.error("[Twilio Confirm] Error:", err);
    return new NextResponse(
      `<Response><Say voice="Polly.Matthew">Got it. Goodbye.</Say></Response>`,
      { status: 200, headers: { "Content-Type": "text/xml" } }
    );
  }
}
