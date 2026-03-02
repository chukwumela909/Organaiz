"use client";

import { useEffect, useState, useCallback } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type PermissionState = "prompt" | "granted" | "denied" | "unsupported";

export default function PushNotifications() {
  const [permission, setPermission] = useState<PermissionState>("prompt");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showButton, setShowButton] = useState(false);

  // Check current state on mount
  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermission("unsupported");
      return;
    }

    const perm = Notification.permission as PermissionState;
    setPermission(perm);

    if (perm === "granted") {
      checkExistingSubscription();
    }

    // Show the button immediately
    setShowButton(true);

    // Show auto-prompt banner after 3s if not yet decided
    if (perm === "prompt") {
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const checkExistingSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    } catch {
      // ignore
    }
  };

  const subscribe = useCallback(async () => {
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm as PermissionState);
      setShowBanner(false);

      if (perm !== "granted") return;

      const reg = await navigator.serviceWorker.ready;
      const applicationServerKey = urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      );

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      // Send subscription to our API
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });

      setIsSubscribed(true);
    } catch (err) {
      console.error("Push subscription failed:", err);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error("Unsubscribe failed:", err);
    }
  }, []);

  if (permission === "unsupported") return null;

  return (
    <>
      {/* Floating bell button — always visible (bottom-right) */}
      {showButton && (
        <button
          onClick={isSubscribed ? unsubscribe : subscribe}
          aria-label={isSubscribed ? "Disable notifications" : "Enable notifications"}
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition-all hover:scale-105 hover:bg-zinc-700 active:scale-95 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
        >
          {isSubscribed ? (
            // Bell with slash (notifications on → tap to disable)
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.143 17.082a24.248 24.248 0 005.714 0M14.857 17.082A3.001 3.001 0 0112 20a3.001 3.001 0 01-2.857-2.918M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z" />
              <circle cx="18" cy="6" r="4" fill="currentColor" className="text-emerald-500 dark:text-emerald-400" stroke="none" />
            </svg>
          ) : (
            // Bell icon (notifications off → tap to enable)
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a24.248 24.248 0 01-5.714 0M14.857 17.082A3.001 3.001 0 0112 20a3.001 3.001 0 01-2.857-2.918M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z" />
            </svg>
          )}
        </button>
      )}

      {/* Auto-prompt banner — slides up after 3s */}
      {showBanner && permission === "prompt" && (
        <div className="fixed bottom-20 right-6 z-50 flex w-72 flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 text-zinc-600 dark:text-zinc-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a24.248 24.248 0 01-5.714 0M14.857 17.082A3.001 3.001 0 0112 20a3.001 3.001 0 01-2.857-2.918M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                Stay in the loop
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Get reminders &amp; updates even when the app is closed.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={subscribe}
              className="flex-1 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Enable
            </button>
            <button
              onClick={() => setShowBanner(false)}
              className="flex-1 rounded-lg bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            >
              Not now
            </button>
          </div>
        </div>
      )}

      {/* Denied state — subtle inline notice */}
      {permission === "denied" && showButton && (
        <div className="fixed bottom-20 right-6 z-40 w-60 rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-500 shadow dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          Notifications blocked. Enable them in your browser settings to receive updates.
        </div>
      )}
    </>
  );
}
