// Organaiz Service Worker — manual (no build tool needed)
// Handles: offline fallback, push notifications, notification clicks

const CACHE_NAME = "organaiz-v1";
const OFFLINE_URL = "/offline";

// Install: cache the offline page
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: serve offline fallback for navigation requests when network fails
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(OFFLINE_URL).then((cached) => cached || new Response("Offline", { status: 503 }))
      )
    );
  }
});

// Push: show notification
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Organaiz", body: event.data.text() };
  }

  // Call-type notification: silent notification + auto-open call screen for real ringtone
  if (data.type === "call") {
    const caller = data.caller || "Unknown";
    const callUrl = data.url || "/call?caller=" + encodeURIComponent(caller);

    const options = {
      body: data.body || "Incoming call...",
      icon: data.icon || "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: callUrl, type: "call", caller: caller },
      tag: "organaiz-call",
      renotify: true,
      requireInteraction: true,
      silent: true, // suppress system chime — the call page plays the real ringtone
      actions: [
        { action: "accept", title: "Accept" },
        { action: "decline", title: "Decline" },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "Incoming Call", options)
        .then(() => {
          // Try to open the call screen immediately so the ringtone plays
          return self.clients.matchAll({ type: "window", includeUncontrolled: true });
        })
        .then((clientList) => {
          // If an app tab is already open, message it to navigate to the call screen
          for (const client of clientList) {
            if (client.url.includes(self.registration.scope)) {
              client.postMessage({
                type: "incoming-call",
                caller: caller,
                url: callUrl,
              });
              return; // messaged an open tab — it will navigate
            }
          }
          // No open tab — auto-open the call screen (Chromium allows this from push handlers)
          return self.clients.openWindow(callUrl);
        })
    );
    return;
  }

  // Normal notification
  const options = {
    body: data.body || "",
    icon: data.icon || "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: data.url || "/" },
    vibrate: [100, 50, 100],
    tag: data.tag || "organaiz-notification",
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Organaiz", options)
  );
});

// Notification click: open/focus the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = data.url || "/";

  // Handle call notification actions
  if (data.type === "call") {
    if (event.action === "decline") {
      // Just close, don't open anything
      return;
    }
    // "accept" action or body tap — open call screen
    targetUrl = data.url || "/call";
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && "focus" in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow(targetUrl);
      })
  );
});
