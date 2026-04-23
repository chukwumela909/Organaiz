"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ChatHeader from "@/app/components/ChatHeader";
import ChatMessage from "@/app/components/ChatMessage";
import ChatInput from "@/app/components/ChatInput";
import TaskCard from "@/app/components/TaskCard";
import IdeaCard from "@/app/components/IdeaCard";

interface Message {
  role: "user" | "assistant";
  content: string;
  tasks?: TaskData[];
  ideas?: IdeaData[];
}

interface TaskData {
  _id: string;
  title: string;
  status: string;
  priority: string;
  deadline?: string;
  tags?: string[];
}

interface IdeaData {
  _id: string;
  content: string;
  tags?: string[];
  category?: string;
  status: string;
}

const GREETING = "What do you want? I'm your AI life organizer — tasks, goals, ideas, whatever. Talk to me or keep scrolling through your phone. Your call.";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: GREETING },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const handleTaskStatusChange = useCallback((taskId: string, newStatus: string) => {
    setMessages((prev) =>
      prev.map((msg) => ({
        ...msg,
        tasks: msg.tasks?.map((t) =>
          t._id === taskId ? { ...t, status: newStatus } : t
        ),
      }))
    );
  }, []);

  const handleIdeaStatusChange = useCallback((ideaId: string, newStatus: string) => {
    setMessages((prev) =>
      prev.map((msg) => ({
        ...msg,
        ideas: msg.ideas?.map((i) =>
          i._id === ideaId ? { ...i, status: newStatus } : i
        ),
      }))
    );
  }, []);

  const handleSend = useCallback(async (content: string) => {
    const userMsg: Message = { role: "user", content };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Something broke." }));
        setMessages((prev) => [...prev, { role: "assistant", content: err.error || "Something broke. Try again." }]);
        return;
      }

      const data = await res.json();

      // Extract tasks and ideas from actions
      const tasks: TaskData[] = [];
      const ideas: IdeaData[] = [];
      for (const action of data.actions || []) {
        if (action.task) tasks.push(action.task as TaskData);
        if (action.tasks) tasks.push(...(action.tasks as TaskData[]));
        if (action.item) tasks.push(action.item as TaskData); // items render as task cards
        if (action.idea) ideas.push(action.idea as IdeaData);
        if (action.ideas) ideas.push(...(action.ideas as IdeaData[]));
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          tasks: tasks.length > 0 ? tasks : undefined,
          ideas: ideas.length > 0 ? ideas : undefined,
        },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Network error. Check your connection and try again." }]);
    } finally {
      setLoading(false);
    }
  }, [messages]);

  const handleNewChat = useCallback(() => {
    setMessages([{ role: "assistant", content: GREETING }]);
  }, []);

  return (
    <div className="flex h-dvh flex-col bg-white dark:bg-zinc-950">
      <ChatHeader onNewChat={handleNewChat} />

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((msg, i) => (
          <div key={i}>
            <ChatMessage role={msg.role} content={msg.content} />
            {msg.tasks && msg.tasks.length > 0 && (
              <div className="mb-3 ml-0 max-w-[85%]">
                {msg.tasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onStatusChange={handleTaskStatusChange}
                  />
                ))}
              </div>
            )}
            {msg.ideas && msg.ideas.length > 0 && (
              <div className="mb-3 ml-0 max-w-[85%]">
                {msg.ideas.map((idea) => (
                  <IdeaCard
                    key={idea._id}
                    idea={idea}
                    onStatusChange={handleIdeaStatusChange}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start mb-3">
            <div className="flex gap-1.5 rounded-2xl bg-zinc-200 px-4 py-3 dark:bg-zinc-800">
              <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 dark:bg-zinc-500" style={{ animationDelay: "0ms" }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 dark:bg-zinc-500" style={{ animationDelay: "150ms" }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 dark:bg-zinc-500" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  );
}
