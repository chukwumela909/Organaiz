export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-col items-center justify-center gap-8 px-8 text-center">
        {/* Pulse ring animation */}
        <div className="relative flex items-center justify-center">
          <span className="absolute inline-flex h-20 w-20 animate-ping rounded-full bg-zinc-300 opacity-40 dark:bg-zinc-700" />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-zinc-500 dark:text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3l18 18M8.111 8.111A3 3 0 0012 6.5c.37 0 .73.067 1.065.19M16.5 12A4.5 4.5 0 0012 7.5m0 0v0M21 5.25A16.95 16.95 0 0012 3C7.418 3 3.337 4.893.75 8.034M3 3 1.5 1.5M12 12.75A3 3 0 0115 9.75M12 12.75v.75m0 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-white">
            You&apos;re Offline
          </h1>
          <p className="max-w-xs text-base leading-7 text-zinc-500 dark:text-zinc-400">
            No connection right now — but don&apos;t stop. The best plans are
            made before the world catches up.
          </p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
            Organaiz
          </p>
          <div className="h-px w-12 bg-zinc-200 dark:bg-zinc-800" />
          <p className="text-xs text-zinc-400 dark:text-zinc-600">
            Reconnect and pick up where you left off.
          </p>
        </div>
      </main>
    </div>
  );
}
