import twilio from "twilio";
import type { Twilio } from "twilio";

let _client: Twilio | null = null;

/** Lazy-initialize the Twilio client so it doesn't crash at build time with placeholder env vars */
function getClient(): Twilio {
  if (_client) return _client;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error(
      "Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN env vars"
    );
  }

  _client = twilio(accountSid, authToken);
  return _client;
}

function getFromNumber(): string {
  const num = process.env.TWILIO_PHONE_NUMBER;
  if (!num) throw new Error("Missing TWILIO_PHONE_NUMBER env var");
  return num;
}

/**
 * Sarcastic/witty messages by call type.
 * Each array has variants — we pick randomly for variety.
 */
export const CALL_MESSAGES: Record<string, string[]> = {
  morning: [
    "Rise and shine. Your goals are already awake. Are you? Open Organaiz and get moving.",
    "Good morning. Your to-do list has been staring at the ceiling waiting for you. Time to open Organaiz.",
    "Hey. The sun is up, your excuses shouldn't be. Open Organaiz and plan your day.",
  ],
  midday: [
    "Quick reality check. Are you making progress, or just premium procrastination? Open Organaiz and update.",
    "Halfway through the day. Let's see if you're halfway through your goals. Open Organaiz.",
    "Lunch break reality check. Your tasks aren't going to complete themselves. Open Organaiz.",
  ],
  evening: [
    "Day's almost done. Time to face the music. Open Organaiz and log your results. No excuses.",
    "Evening verdict time. Did you actually do the thing, or just think about doing the thing? Log it in Organaiz.",
    "The day doesn't care about your feelings. Neither do I. Log your results in Organaiz before midnight.",
  ],
  escalation: [
    "You're ignoring your notifications. Bold move. Your streak is about to pay the price. Open Organaiz. Now.",
    "I've been trying to reach you about your accountability. This is your last warning. Open Organaiz.",
    "Still nothing? Interesting strategy. Let's see how that works for your streak. Open Organaiz.",
  ],
};

/** Pick a random message for a call type */
export function getCallMessage(type: string): string {
  const messages = CALL_MESSAGES[type] || CALL_MESSAGES.morning;
  return messages[Math.floor(Math.random() * messages.length)];
}

/** Base URL for webhooks — set NEXT_PUBLIC_APP_URL in env */
function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/**
 * Make an outbound call with TTS message.
 * Returns the Twilio Call SID for tracking.
 */
export async function makeCall(
  to: string,
  message: string
): Promise<{ callSid: string }> {
  const twiml = `<Response><Say voice="Polly.Matthew" language="en-US">${escapeXml(message)}</Say><Pause length="1"/><Say voice="Polly.Matthew" language="en-US">Press any key to confirm you got this.</Say><Gather numDigits="1" action="${getBaseUrl()}/api/calls/confirm" method="POST"><Say voice="Polly.Matthew" language="en-US">I'll wait.</Say></Gather><Say voice="Polly.Matthew" language="en-US">No response. I'll try again later. Good luck.</Say></Response>`;

  const call = await getClient().calls.create({
    to,
    from: getFromNumber(),
    twiml,
    statusCallback: `${getBaseUrl()}/api/calls/webhook`,
    statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
    statusCallbackMethod: "POST",
    machineDetection: "Enable", // detect voicemail
    timeout: 30, // ring for 30 seconds then give up
  });

  return { callSid: call.sid };
}

/** Escape special XML characters for TwiML */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
