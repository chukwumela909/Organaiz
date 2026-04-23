import { connectDB } from "@/lib/db";
import Item from "@/lib/models/item";

const DEFAULT_AREAS = [
  { title: "Career", tags: ["career", "work"] },
  { title: "Health", tags: ["health", "fitness"] },
  { title: "Finance", tags: ["finance", "money"] },
  { title: "Personal", tags: ["personal", "relationships"] },
  { title: "Learning", tags: ["learning", "growth"] },
];

let _seeded = false;

export async function seedDefaultAreas(): Promise<void> {
  if (_seeded) return;
  await connectDB();

  const existingAreas = await Item.countDocuments({ type: "area" });
  if (existingAreas > 0) {
    _seeded = true;
    return;
  }

  await Item.insertMany(
    DEFAULT_AREAS.map((area) => ({
      type: "area",
      title: area.title,
      tags: area.tags,
      status: "in-progress",
      priority: "medium",
    }))
  );

  _seeded = true;
  console.log("[seed] Created default Life Areas:", DEFAULT_AREAS.map((a) => a.title).join(", "));
}
