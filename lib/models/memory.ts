import mongoose, { Schema, Document, Model } from "mongoose";

export type MemoryType = "fact" | "preference" | "goal" | "context" | "relationship";
export type MemoryStatus = "active" | "deprecated";

export interface IMemory extends Document {
  content: string;
  type: MemoryType;
  embedding: number[];
  relevanceScore: number;
  status: MemoryStatus;
  lastAccessedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MemorySchema = new Schema<IMemory>(
  {
    content: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["fact", "preference", "goal", "context", "relationship"],
      default: "fact",
    },
    embedding: { type: [Number], select: false },
    relevanceScore: { type: Number, default: 1.0, min: 0, max: 1 },
    status: {
      type: String,
      enum: ["active", "deprecated"],
      default: "active",
    },
    lastAccessedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

MemorySchema.index({ status: 1 });

const Memory: Model<IMemory> =
  mongoose.models.Memory || mongoose.model<IMemory>("Memory", MemorySchema);

export default Memory;
