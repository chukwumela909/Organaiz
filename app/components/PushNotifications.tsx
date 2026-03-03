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

/** Wait for service worker with a timeout so it doesn't hang forever in dev */
function waitForServiceWorker(timeoutMs = 8000): Promise<ServiceWorkerRegistration | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      console.warn("[Push] Service worker not ready within timeout — are you in production mode?");
      resolve(null);
    }, timeoutMs);

    navigator.serviceWorker.ready.then((reg) => {
      clearTimeout(timer);
      resolve(reg);
    });
  });
}

type PermissionState = "prompt" | "granted" | "denied" | "unsupported";

export default function PushNotifications() {
  const [permission, setPermission] = useState<PermissionState>("prompt");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [swReady, setSwReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check current state on mount
  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermission("unsupported");
      return;
    }

    const perm = Notification.permission as PermissionState;
    setPermission(perm);

    // Show the button immediately
    setShowButton(true);

    // Check if service worker is active
    waitForServiceWorker().then((reg) => {
      if (reg) {
        setSwReady(true);
        console.log("[Push] Service worker is active");
        if (perm === "granted") {
          reg.pushManager.getSubscription().then((sub) => {
            setIsSubscribed(!!sub);
          });
        }
      } else {
        console.warn("[Push] No service worker — push won't work. Run: npm run build && npm run start");
      }
    });

    // Show auto-prompt banner after 3s if not yet decided
    if (perm === "prompt") {
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const subscribe = useCallback(async () => {
    setError(null);
    try {
      console.log("[Push] Requesting notification permission...");
      const perm = await Notification.requestPermission();
      console.log("[Push] Permission result:", perm);
      setPermission(perm as PermissionState);
      setShowBanner(false);

      if (perm !== "granted") return;

      console.log("[Push] Waiting for service worker...");
      const reg = await waitForServiceWorker();

      if (!reg) {
        setError("No service worker found. Make sure you're running in production mode (npm run build && npm run start).");
        return;
      }

      console.log("[Push] Service worker ready. Subscribing to push...");
      const applicationServerKey = urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      );

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });
      console.log("[Push] Subscribed! Sending to server...");

      // Send subscription to our API
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      const data = await res.json();
      console.log("[Push] Server response:", data);

      setIsSubscribed(true);

      // Auto-fire a test notification to confirm it works
      console.log("[Push] Sending welcome notification...");
      const sendRes = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Organaiz",
          body: "Notifications are now enabled! 🎉",
          url: "/",
        }),
      });
      const sendData = await sendRes.json();
      console.log("[Push] Send result:", sendData);
    } catch (err) {
      console.error("Push subscription failed:", err);
      setError(String(err));
    }
  }, []);

  const sendTestNotification = useCallback(async () => {
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Organaiz",
          body: "This is a test notification!",
          url: "/",
        }),
      });
      const data = await res.json();
      console.log("[Push] Test send result:", data);
    } catch (err) {
      console.error("Test notification failed:", err);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await waitForServiceWorker();
      if (!reg) return;
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
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
          {/* Test send button — only when subscribed */}
          {isSubscribed && (
            <button
              onClick={sendTestNotification}
              className="flex h-10 items-center gap-2 rounded-full bg-emerald-600 px-4 text-xs font-medium text-white shadow-lg transition-all hover:bg-emerald-500 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
              Test Notification
            </button>
          )}
          <button
            onClick={isSubscribed ? unsubscribe : subscribe}
            aria-label={isSubscribed ? "Disable notifications" : "Enable notifications"}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition-all hover:scale-105 hover:bg-zinc-700 active:scale-95 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
          >
            {isSubscribed ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.143 17.082a24.248 24.248 0 005.714 0M14.857 17.082A3.001 3.001 0 0112 20a3.001 3.001 0 01-2.857-2.918M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z" />
                <circle cx="18" cy="6" r="4" fill="currentColor" className="text-emerald-500 dark:text-emerald-400" stroke="none" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a24.248 24.248 0 01-5.714 0M14.857 17.082A3.001 3.001 0 0112 20a3.001 3.001 0 01-2.857-2.918M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="fixed bottom-20 right-6 z-50 w-72 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 shadow dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-bold">✕</button>
        </div>
      )}

      {/* No service worker warning */}
      {showButton && !swReady && permission !== "prompt" && (
        <div className="fixed bottom-20 right-6 z-40 w-64 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-700 shadow dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-400">
          Service worker not detected. Push notifications require production mode.
        </div>
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
