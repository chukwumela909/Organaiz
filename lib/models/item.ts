import mongoose, { Schema, Document, Model } from "mongoose";

export type ItemType = "area" | "goal" | "project" | "task" | "subtask";
export type ItemStatus = "not-started" | "in-progress" | "done";
export type ItemPriority = "urgent" | "high" | "medium" | "low";
export type RelationType = "blocks" | "related-to" | "part-of" | "inspired-by";

export interface IRelatedItem {
  itemId: mongoose.Types.ObjectId;
  type: RelationType;
}

export interface IItem extends Document {
  type: ItemType;
  title: string;
  description?: string;
  status: ItemStatus;
  priority: ItemPriority;
  parentId?: mongoose.Types.ObjectId;
  relatedItems: IRelatedItem[];
  deadline?: Date;
  estimatedDuration?: number; // minutes
  tags: string[];
  progress?: number; // 0-100
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema = new Schema<IItem>(
  {
    type: {
      type: String,
      enum: ["area", "goal", "project", "task", "subtask"],
      default: "task",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ["not-started", "in-progress", "done"],
      default: "not-started",
    },
    priority: {
      type: String,
      enum: ["urgent", "high", "medium", "low"],
      default: "medium",
    },
    parentId: { type: Schema.Types.ObjectId, ref: "Item" },
    relatedItems: [
      {
        itemId: { type: Schema.Types.ObjectId, ref: "Item" },
        type: { type: String, enum: ["blocks", "related-to", "part-of", "inspired-by"] },
      },
    ],
    deadline: { type: Date },
    estimatedDuration: { type: Number },
    tags: { type: [String], default: [] },
    progress: { type: Number, min: 0, max: 100 },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

ItemSchema.index({ status: 1, deadline: 1 });
ItemSchema.index({ parentId: 1 });
ItemSchema.index({ type: 1 });

const Item: Model<IItem> =
  mongoose.models.Item || mongoose.model<IItem>("Item", ItemSchema);

export default Item;
