import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  phone: string; // E.164 format: +1234567890
  timezone: string; // IANA: "America/New_York", "Africa/Lagos", etc.
  callPrefs: {
    morning: boolean; // ~6:00 AM in user's timezone
    midday: boolean; // ~12:00 PM
    evening: boolean; // ~9:00 PM
    escalation: boolean; // call if push notification ignored
  };
  pushSubscription?: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };
  streak: number;
  lastCheckIn?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: (v: string) => /^\+[1-9]\d{6,14}$/.test(v),
        message: "Phone must be in E.164 format (e.g. +1234567890)",
      },
    },
    timezone: {
      type: String,
      required: true,
      default: "UTC",
    },
    callPrefs: {
      morning: { type: Boolean, default: true },
      midday: { type: Boolean, default: true },
      evening: { type: Boolean, default: true },
      escalation: { type: Boolean, default: true },
    },
    pushSubscription: {
      endpoint: String,
      keys: {
        p256dh: String,
        auth: String,
      },
    },
    streak: { type: Number, default: 0 },
    lastCheckIn: Date,
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
