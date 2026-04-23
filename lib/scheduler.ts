import cron from "node-cron";
import { connectDB } from "@/lib/db";
import { User, IUser } from "@/lib/models/user";
import { CallJob, CallType } from "@/lib/models/call-job";
import { makeCall, getCallMessage } from "@/lib/twilio";

/**
 * Determine which call type is due for a given hour in the user's local timezone.
 * Returns null if no call is due.
 */
function getCallTypeForHour(hour: number): CallType | null {
  if (hour === 6) return "morning";
  if (hour === 12) return "midday";
  if (hour === 21) return "evening";
  return null;
}

/**
 * Get current hour in a given timezone.
 */
function getCurrentHourInTimezone(tz: string): number {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      hour12: false,
    });
    return parseInt(formatter.format(now), 10);
  } catch {
    return new Date().getUTCHours(); // fallback to UTC
  }
}

/**
 * Get current minute in a given timezone.
 */
function getCurrentMinuteInTimezone(tz: string): number {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      minute: "numeric",
    });
    return parseInt(formatter.format(now), 10);
  } catch {
    return new Date().getUTCMinutes();
  }
}

/**
 * Check if a call job already exists for this user + type today.
 * Prevents duplicate calls if the scheduler runs multiple times in the same hour.
 */
async function jobExistsToday(
  userId: string,
  type: CallType
): Promise<boolean> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const count = await CallJob.countDocuments({
    userId,
    type,
    createdAt: { $gte: startOfDay },
  });

  return count > 0;
}

/**
 * Process pending/retry call jobs.
 * Finds jobs that are due and makes the calls.
 */
async function processPendingJobs(): Promise<void> {
  const now = new Date();

  const dueJobs = await CallJob.find({
    status: "pending",
    scheduledAt: { $lte: now },
  }).limit(10); // process max 10 per tick

  for (const job of dueJobs) {
    try {
      job.status = "queued";
      job.attempts += 1;
      await job.save();

      const { callSid } = await makeCall(job.phone, job.message);

      job.twilioCallSid = callSid;
      job.status = "calling";
      await job.save();

      console.log(
        `[Scheduler] Called ${job.phone} (${job.type}) — SID: ${callSid}`
      );
    } catch (err) {
      console.error(`[Scheduler] Failed to call ${job.phone}:`, err);
      job.status = "failed";
      await job.save();
    }
  }
}

/**
 * Scan all users, check if a call is due in their timezone,
 * and create call jobs.
 */
async function createScheduledJobs(): Promise<void> {
  const users = await User.find({
    phone: { $exists: true, $ne: "" },
  });

  for (const user of users) {
    const hour = getCurrentHourInTimezone(user.timezone);
    const minute = getCurrentMinuteInTimezone(user.timezone);

    // Only create jobs at the top of the hour (first 5 minutes)
    if (minute > 4) continue;

    const callType = getCallTypeForHour(hour);
    if (!callType) continue;

    // Check if user has this call type enabled
    const prefs = user.callPrefs;
    if (callType === "morning" && !prefs.morning) continue;
    if (callType === "midday" && !prefs.midday) continue;
    if (callType === "evening" && !prefs.evening) continue;

    // Check for existing job today
    const exists = await jobExistsToday(
      String(user._id),
      callType
    );
    if (exists) continue;

    // Create the job
    const message = getCallMessage(callType);
    await CallJob.create({
      userId: user._id,
      phone: user.phone,
      type: callType,
      message,
      scheduledAt: new Date(),
      status: "pending",
    });

    console.log(
      `[Scheduler] Created ${callType} job for ${user.phone} (${user.timezone}, local hour: ${hour})`
    );
  }
}

/**
 * Main scheduler tick — runs every minute.
 */
async function tick(): Promise<void> {
  try {
    await connectDB();
    await createScheduledJobs();
    await processPendingJobs();
  } catch (err) {
    console.error("[Scheduler] Tick failed:", err);
  }
}

/**
 * Start the scheduler. Should be called once on server startup.
 */
let started = false;

export function startScheduler(): void {
  if (started) return;
  started = true;

  console.log("[Scheduler] Starting call scheduler (every 60s)...");

  // Run every minute
  cron.schedule("* * * * *", () => {
    tick();
  });

  // Also run immediately on startup
  tick();
}
