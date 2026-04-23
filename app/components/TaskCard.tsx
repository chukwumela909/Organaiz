"use client";

import { useCallback, useState } from "react";

interface TaskCardProps {
  task: {
    _id: string;
    title: string;
    status: string;
    priority: string;
    deadline?: string;
    tags?: string[];
  };
  onStatusChange?: (taskId: string, newStatus: string) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  low: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

const STATUS_LABELS: Record<string, string> = {
  "not-started": "To Do",
  "in-progress": "In Progress",
  done: "Done",
};

export default function TaskCard({ task, onStatusChange }: TaskCardProps) {
  const [updating, setUpdating] = useState(false);
  const isDone = task.status === "done";

  const handleDone = useCallback(async () => {
    if (isDone || updating) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/tasks/${task._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "done" }),
      });
      if (res.ok) {
        onStatusChange?.(task._id, "done");
      }
    } catch {
      // Silently fail — user can retry via chat
    } finally {
      setUpdating(false);
    }
  }, [task._id, isDone, updating, onStatusChange]);

  const deadlineStr = task.deadline
    ? new Date(task.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  const isOverdue = task.deadline && !isDone && new Date(task.deadline) < new Date();

  return (
    <div className={`my-2 flex items-start gap-3 rounded-xl border px-3 py-2.5 text-sm ${isDone ? "border-zinc-200 bg-zinc-50 opacity-60 dark:border-zinc-800 dark:bg-zinc-900" : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"}`}>
      {/* Done button */}
      <button
        onClick={handleDone}
        disabled={isDone || updating}
        aria-label={isDone ? "Task completed" : "Mark as done"}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          isDone
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-zinc-300 hover:border-emerald-400 dark:border-zinc-600 dark:hover:border-emerald-500"
        } ${updating ? "animate-pulse" : ""}`}
      >
        {isDone && (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
            <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className={`font-medium ${isDone ? "line-through text-zinc-400 dark:text-zinc-500" : "text-zinc-900 dark:text-zinc-100"}`}>
          {task.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {/* Priority badge */}
          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium}`}>
            {task.priority}
          </span>

          {/* Status badge */}
          {!isDone && (
            <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {STATUS_LABELS[task.status] || task.status}
            </span>
          )}

          {/* Deadline */}
          {deadlineStr && (
            <span className={`text-[10px] font-medium ${isOverdue ? "text-red-500" : "text-zinc-400 dark:text-zinc-500"}`}>
              {isOverdue ? "⚠ " : "📅 "}{deadlineStr}
            </span>
          )}

          {/* Tags */}
          {task.tags?.map((tag) => (
            <span key={tag} className="text-[10px] text-zinc-400 dark:text-zinc-500">#{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
