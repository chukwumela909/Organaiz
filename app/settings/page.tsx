"use client";

import Link from "next/link";
import PhoneSetup from "@/app/components/PhoneSetup";
import PushNotifications from "@/app/components/PushNotifications";

export default function SettingsPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-white dark:bg-zinc-950">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <Link
          href="/"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          aria-label="Back to chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
          </svg>
        </Link>
        <h1 className="text-base font-semibold text-zinc-900 dark:text-white">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {/* Phone & Calls */}
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Phone & Calls
          </h2>
          <PhoneSetup />
        </section>

        {/* Push Notifications */}
        <section>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Push Notifications
          </h2>
          <PushNotifications />
        </section>
      </div>
    </div>
  );
}
