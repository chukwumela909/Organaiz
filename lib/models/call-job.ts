import mongoose, { Schema, Document, Model } from "mongoose";

export type CallType = "morning" | "midday" | "evening" | "escalation";
export type CallStatus =
  | "pending"
  | "queued"
  | "calling"
  | "completed"
  | "no-answer"
  | "failed"
  | "cancelled";

export interface ICallJob extends Document {
  userId?: mongoose.Types.ObjectId;
  phone: string;
  type: CallType;
  message: string; // TTS message the user hears
  scheduledAt: Date;
  status: CallStatus;
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: Date;
  twilioCallSid?: string;
  callDuration?: number; // seconds
  answeredAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CallJobSchema = new Schema<ICallJob>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    phone: { type: String, required: true },
    type: {
      type: String,
      enum: ["morning", "midday", "evening", "escalation"],
      required: true,
    },
    message: { type: String, required: true },
    scheduledAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: [
        "pending",
        "queued",
        "calling",
        "completed",
        "no-answer",
        "failed",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    nextRetryAt: Date,
    twilioCallSid: String,
    callDuration: Number,
    answeredAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

// Compound index for the scheduler query
CallJobSchema.index({ status: 1, scheduledAt: 1 });

export const CallJob: Model<ICallJob> =
  mongoose.models.CallJob ||
  mongoose.model<ICallJob>("CallJob", CallJobSchema);
