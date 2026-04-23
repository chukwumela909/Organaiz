import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/user";

export const runtime = "nodejs";

/**
 * POST /api/users/phone
 * Register or update a user's phone number and call preferences.
 * Body: { phone: string, timezone?: string, callPrefs?: { morning, midday, evening, escalation } }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, timezone, callPrefs } = body;

    if (!phone || !/^\+[1-9]\d{6,14}$/.test(phone)) {
      return NextResponse.json(
        { error: "Phone must be in E.164 format (e.g. +1234567890)" },
        { status: 400 }
      );
    }

    await connectDB();

    // Upsert user by phone number
    const user = await User.findOneAndUpdate(
      { phone },
      {
        $set: {
          phone,
          ...(timezone && { timezone }),
          ...(callPrefs && { callPrefs }),
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        phone: user.phone,
        timezone: user.timezone,
        callPrefs: user.callPrefs,
      },
    });
  } catch (err) {
    console.error("[Users/Phone] Error:", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users/phone?phone=+1234567890
 * Get user's current settings.
 */
export async function GET(request: NextRequest) {
  try {
    const phone = request.nextUrl.searchParams.get("phone");

    if (!phone) {
      return NextResponse.json(
        { error: "Phone query param required" },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findOne({ phone });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user._id,
        phone: user.phone,
        timezone: user.timezone,
        callPrefs: user.callPrefs,
        streak: user.streak,
        lastCheckIn: user.lastCheckIn,
      },
    });
  } catch (err) {
    console.error("[Users/Phone GET] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
