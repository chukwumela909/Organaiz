"use client";

import { useCallback, useState } from "react";

interface IdeaCardProps {
  idea: {
    _id: string;
    content: string;
    tags?: string[];
    category?: string;
    status: string;
  };
  onStatusChange?: (ideaId: string, newStatus: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  business: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400",
  personal: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400",
  creative: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  health: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  learning: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400",
};

export default function IdeaCard({ idea, onStatusChange }: IdeaCardProps) {
  const [archiving, setArchiving] = useState(false);
  const isArchived = idea.status === "archived";
  const isPromoted = idea.status === "promoted";

  const handleArchive = useCallback(async () => {
    if (isArchived || archiving) return;
    setArchiving(true);
    try {
      const res = await fetch(`/api/ideas/${idea._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });
      if (res.ok) {
        onStatusChange?.(idea._id, "archived");
      }
    } catch {
      // Silently fail — user can retry via chat
    } finally {
      setArchiving(false);
    }
  }, [idea._id, isArchived, archiving, onStatusChange]);

  return (
    <div className={`my-2 flex items-start gap-3 rounded-xl border px-3 py-2.5 text-sm ${
      isArchived
        ? "border-zinc-200 bg-zinc-50 opacity-60 dark:border-zinc-800 dark:bg-zinc-900"
        : "border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20"
    }`}>
      {/* Lightbulb icon */}
      <span className="mt-0.5 shrink-0 text-base" aria-hidden>💡</span>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className={`${isArchived ? "line-through text-zinc-400 dark:text-zinc-500" : "text-zinc-900 dark:text-zinc-100"}`}>
          {idea.content}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {/* Category badge */}
          {idea.category && (
            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[idea.category] || "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"}`}>
              {idea.category}
            </span>
          )}

          {/* Status badge for promoted */}
          {isPromoted && (
            <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
              promoted
            </span>
          )}

          {/* Tags */}
          {idea.tags?.map((tag) => (
            <span key={tag} className="text-[10px] text-zinc-400 dark:text-zinc-500">#{tag}</span>
          ))}
        </div>
      </div>

      {/* Archive button */}
      {!isArchived && !isPromoted && (
        <button
          onClick={handleArchive}
          disabled={archiving}
          aria-label="Archive idea"
          className={`mt-0.5 shrink-0 text-xs text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 ${archiving ? "animate-pulse" : ""}`}
        >
          ✕
        </button>
      )}
    </div>
  );
}
