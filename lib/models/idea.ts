import mongoose, { Schema, Document, Model } from "mongoose";

export type IdeaStatus = "captured" | "promoted" | "archived";

export interface IIdea extends Document {
  content: string;
  tags: string[];
  category?: string;
  embedding?: number[];
  status: IdeaStatus;
  relatedItems: mongoose.Types.ObjectId[];
  promotedToItemId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const IdeaSchema = new Schema<IIdea>(
  {
    content: { type: String, required: true, trim: true },
    tags: { type: [String], default: [] },
    category: { type: String, trim: true },
    embedding: { type: [Number], select: false },
    status: {
      type: String,
      enum: ["captured", "promoted", "archived"],
      default: "captured",
    },
    relatedItems: [{ type: Schema.Types.ObjectId, ref: "Item" }],
    promotedToItemId: { type: Schema.Types.ObjectId, ref: "Item" },
  },
  {
    timestamps: true,
  }
);

IdeaSchema.index({ status: 1 });

const Idea: Model<IIdea> =
  mongoose.models.Idea || mongoose.model<IIdea>("Idea", IdeaSchema);

export default Idea;
