import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/user";
import { CallJob } from "@/lib/models/call-job";
import { makeCall, getCallMessage } from "@/lib/twilio";

export const runtime = "nodejs";

/**
 * POST /api/calls/test
 * Trigger a test call to a registered user (or a provided phone number).
 * Body: { phone?: string, type?: "morning" | "midday" | "evening" | "escalation" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const type = body.type || "morning";
    const message = body.message || getCallMessage(type);

    await connectDB();

    // Find user by phone, or use provided phone directly
    let phone = body.phone;

    if (!phone) {
      // Grab the first registered user
      const user = await User.findOne({ phone: { $exists: true } });
      if (!user) {
        return NextResponse.json(
          { error: "No users with phone numbers found. Register a phone first." },
          { status: 400 }
        );
      }
      phone = user.phone;
    }

    // Validate E.164
    if (!/^\+[1-9]\d{6,14}$/.test(phone)) {
      return NextResponse.json(
        { error: "Phone must be in E.164 format (e.g. +1234567890)" },
        { status: 400 }
      );
    }

    // Create a job record
    const job = await CallJob.create({
      // userId omitted for test calls
      phone,
      type,
      message,
      scheduledAt: new Date(),
      status: "queued",
      attempts: 1,
    });

    // Make the call
    const { callSid } = await makeCall(phone, message);

    // Update job with Twilio SID
    job.twilioCallSid = callSid;
    job.status = "calling";
    await job.save();

    return NextResponse.json({
      success: true,
      callSid,
      jobId: job._id,
      phone,
      message,
    });
  } catch (err) {
    console.error("[Calls/Test] Error:", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
